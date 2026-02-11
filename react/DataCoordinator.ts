import type { ConnectionPool } from '../duck/ConnectionPool';
import { inlineEntry } from './resolveDependencies'
export type QueryStatus = 'pending' | 'writing' | 'ready' | 'error';

/**
 * Represents a cached query result or modification.
 */
export interface CacheEntry<TSlug extends string = string, TRow = unknown> {
  id: string; // Unique internal ID (e.g. "users_v_k2j4s")
  slug: TSlug; // User-provided slug (e.g. "users")
  path: string; // OPFS path for tables (e.g. "opfs://users_t_...parquet")
  status: QueryStatus;
  error?: Error;
  lastUsed: number; // Timestamp for LRU cleanup
  dependencies: string[]; // IDs of dependencies
  type: 'table' | 'fragment';
  query?: string; // SQL query string
  /** @internal Phantom type for row shape inference. Never set at rsqluntime. */
  readonly __row?: TRow;
}

const sqlCopy = (sql: string, path: string, options = {}) => {
  return `COPY (${sql}) TO '${path}' (${Object.entries(options)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')})`;
};

export class DataCoordinator {
  protected cache = new Map<string, CacheEntry>();
  protected pool: ConnectionPool;
  protected pendingMaterializations = new Map<string, Promise<CacheEntry>>();

  constructor(pool: ConnectionPool) {
    this.pool = pool;
  }

  protected getCacheKey(slug: string, query: string, type: CacheEntry['type']): string {
    return `${type}\0${slug}\0${query}`;
  }

  registerView<TSlug extends string>(slug: TSlug, query: string, dependencies: string[] = [], type: 'fragment' = 'fragment'): CacheEntry<TSlug> {
    const key = this.getCacheKey(slug, query, type);
    const existing = this.cache.get(key);

    if (existing) {
      existing.lastUsed = Date.now();
      return existing as CacheEntry<TSlug>;
    }

    const id = `${slug}_f_${Math.random().toString(36).slice(2, 7)}`;
    const entry: CacheEntry<TSlug> = {
      id,
      slug,
      path: '',
      status: 'ready',
      lastUsed: Date.now(),
      dependencies,
      type,
      query,
    };

    this.cache.set(key, entry);
    return entry;
  }

  async requestTable<TSlug extends string>(slug: TSlug, source: string | unknown[], dependencies: string[] = []): Promise<CacheEntry<TSlug>> {
    const contentKey = typeof source === 'string' ? source : `__ingest\0${dependencies[0] ?? ''}`;
    const key = this.getCacheKey(slug, contentKey, 'table');
    const existing = this.cache.get(key);

    if (existing?.status === 'ready') {
      existing.lastUsed = Date.now();
      return existing as CacheEntry<TSlug>;
    }

    const pending = this.pendingMaterializations.get(key);
    if (pending) {
      return pending as Promise<CacheEntry<TSlug>>;
    }

    const id = `${slug}_t_${Math.random().toString(36).slice(2, 7)}`;
    const path = `opfs://${id}.parquet`;

    const entry: CacheEntry<TSlug> = {
      id,
      slug,
      path,
      status: 'pending',
      lastUsed: Date.now(),
      dependencies: typeof source === 'string' ? dependencies : [],
      type: 'table',
      query: typeof source === 'string' ? source : `SELECT * REPLACE() FROM '${path}'`,
    };

    this.cache.set(key, entry);

    const promise = this.executeMaterialization(key, entry, source) as Promise<CacheEntry<TSlug>>;
    this.pendingMaterializations.set(key, promise);
    promise.finally(() => this.pendingMaterializations.delete(key));
    return promise;
  }

  protected async executeMaterialization(key: string, entry: CacheEntry, source: string | unknown[]): Promise<CacheEntry> {
    const tempTable = typeof source !== 'string' ? `"__ingest_${entry.id}"` : null;
    try {
      this.cache.set(key, { ...entry, status: 'writing' });

      if (tempTable) {
        await this.pool.insertTable(tempTable, source as any);
      }

      const copySql = tempTable ? `FROM ${tempTable}` : (source as string);

      await this.pool.db.registerOPFSFileName(entry.path);
      await this.pool.queryIPCTable(`--:re:${entry.type}:${entry.slug}\n` + sqlCopy(copySql, entry.path, { format: 'parquet' }));

      if (tempTable) {
        try {
          await this.pool.dump(`DROP TABLE IF EXISTS ${tempTable}`);
        } catch {}
      }

      const readyEntry: CacheEntry = { ...entry, status: 'ready', lastUsed: Date.now() };
      this.cache.set(key, readyEntry);
      return readyEntry;
    } catch (err) {
      console.error(`Error materializing table ${entry.id}:`, err);
      if (tempTable) {
        try {
          await this.pool.dump(`DROP TABLE IF EXISTS ${tempTable}`);
        } catch {}
      }
      const errorEntry: CacheEntry = { ...entry, status: 'error', error: err as Error };
      this.cache.set(key, errorEntry);
      return errorEntry;
    }
  }

  resolveEntryAsSql(entry: CacheEntry): string {
    const cache = [...this.cache.values()]
    return inlineEntry(cache, entry, new Set());
  }
  getDependencyChain(entry: CacheEntry): CacheEntry[] {
    const chain: CacheEntry[] = [];
    const visited = new Set<string>();
    const entries = Array.from(this.cache.values());

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const dep = entries.find((e) => e.id === id);
      if (dep) {
        dep.dependencies.forEach(visit);
        chain.push(dep);
      }
    };

    entry.dependencies.forEach(visit);
    return chain;
  }
}
