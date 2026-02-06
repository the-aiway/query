import type { ConnectionPool } from '#query';

export type QueryStatus = 'pending' | 'writing' | 'ready' | 'error';

export interface CacheEntry<TSlug extends string = string> {
  id: string;
  slug: TSlug;
  path: string;
  status: QueryStatus;
  error?: Error;
  lastUsed: number;
  dependencies: string[];
  type: 'table' | 'view';
  query?: string;
  params?: Record<string, unknown>;
}

export class DataCoordinator {
  protected cache = new Map<string, CacheEntry>();
  protected pool: ConnectionPool;
  protected maxFiles = 100;
  protected listeners = new Set<() => void>();

  constructor(pool: ConnectionPool) {
    this.pool = pool;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected notify() {
    this.listeners.forEach((l) => l());
  }

  protected getCacheKey(
    slug: string,
    query: string,
    params: Record<string, unknown>,
    dependencies: string[]
  ): string {
    return JSON.stringify({ slug, query, params, dependencies });
  }

  registerView<TSlug extends string>(
    slug: TSlug,
    query: string,
    params: Record<string, unknown>,
    dependencies: string[] = []
  ): CacheEntry<TSlug> {
    const key = this.getCacheKey(slug, query, params, dependencies);
    const existing = this.cache.get(key);

    if (existing) {
      existing.lastUsed = Date.now();
      return existing as CacheEntry<TSlug>;
    }

    const id = `${slug}_v_${Math.random().toString(36).slice(2, 7)}`;
    const entry: CacheEntry<TSlug> = {
      id,
      slug,
      path: '',
      status: 'ready',
      lastUsed: Date.now(),
      dependencies,
      type: 'view',
      query,
      params,
    };

    this.cache.set(key, entry);
    this.notify();
    return entry;
  }

  async requestTable<TSlug extends string>(
    slug: TSlug,
    query: string,
    params: Record<string, unknown>,
    dependencies: string[] = []
  ): Promise<CacheEntry<TSlug>> {
    const key = this.getCacheKey(slug, query, params, dependencies);
    const existing = this.cache.get(key);

    if (existing) {
      existing.lastUsed = Date.now();
      return existing as CacheEntry<TSlug>;
    }

    const id = `${slug}_t_${Math.random().toString(36).slice(2, 7)}`;
    const path = `opfs://${id}.parquet`;

    const entry: CacheEntry<TSlug> = {
      id,
      slug,
      path,
      status: 'pending',
      lastUsed: Date.now(),
      dependencies,
      type: 'table',
    };

    this.cache.set(key, entry);
    this.executeMaterialization(key, entry, query, params);

    return entry;
  }

  protected async executeMaterialization(
    key: string,
    entry: CacheEntry,
    query: string,
    params: Record<string, unknown>
  ) {
    try {
      entry.status = 'writing';

      let finalQuery = query;
      for (const [k, v] of Object.entries(params)) {
        let val = v;
        if (v instanceof Date) {
          val = `'${v.toISOString()}'`;
        } else if (typeof v === 'string') {
          val = `'${v}'`;
        }
        finalQuery = finalQuery.split(`$${k}`).join(String(val));
      }

      await this.pool.db.registerOPFSFileName(entry.path);
      await this.pool.dumpIPCTable(`COPY (${finalQuery}) TO '${entry.path}' (FORMAT PARQUET)`);

      entry.status = 'ready';
      this.notify();
      this.cleanup();
    } catch (err) {
      console.error(`Error materializing table ${entry.id}:`, err);
      entry.status = 'error';
      entry.error = err as Error;
      this.notify();
    }
  }

  protected async cleanup() {
    const tableEntries = Array.from(this.cache.entries()).filter(([, e]) => e.type === 'table');

    if (tableEntries.length <= this.maxFiles) return;

    const sortedEntries = tableEntries.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

    const refCounts = new Map<string, number>();
    for (const entry of this.cache.values()) {
      for (const depId of entry.dependencies) {
        refCounts.set(depId, (refCounts.get(depId) || 0) + 1);
      }
    }

    const toDelete: string[] = [];
    for (const [key, entry] of sortedEntries) {
      if (tableEntries.length - toDelete.length <= this.maxFiles) break;

      if (
        (refCounts.get(entry.id) || 0) === 0 &&
        entry.status !== 'writing' &&
        entry.status !== 'pending'
      ) {
        toDelete.push(key);
        try {
          await this.pool.db.dropFile(entry.path);
        } catch (e) {
          console.warn(`Failed to drop file ${entry.path}`, e);
        }
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
    }
  }

  resolveViewDependencies(depIds: string[]): string[] {
    const views: string[] = [];
    const visited = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const entry = Array.from(this.cache.values()).find((e) => e.id === id);
      if (!entry) return;

      // Visit dependencies first
      entry.dependencies.forEach(visit);

      if (entry.type === 'view' && entry.query) {
        const t: Record<string, string> = {};
        entry.dependencies.forEach((depId) => {
          const dep = Array.from(this.cache.values()).find((e) => e.id === depId);
          if (dep) {
            t[dep.slug] = dep.type === 'view' ? dep.id : `read_parquet('${dep.path}')`;
          }
        });

        let query = entry.query;
        if (entry.params) {
          for (const [k, v] of Object.entries(entry.params)) {
            let val = v;
            if (v instanceof Date) {
              val = `'${v.toISOString()}'`;
            } else if (typeof v === 'string') {
              val = `'${v}'`;
            }
            query = query.split(`$${k}`).join(String(val));
          }
        }
        views.push(`CREATE OR REPLACE TEMP VIEW ${entry.id} AS ${query};`);
      }
    };

    depIds.forEach(visit);
    return views;
  }
}
