import type { ConnectionPool } from '../duck/ConnectionPool';
import {
  resolveEntryAsSql as _resolveEntryAsSql,
} from './resolveDependencies';

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
  /** @internal Phantom type for row shape inference. Never set at runtime. */
  readonly __row?: TRow;
}

/**
 * The DataCoordinator manages the lifecycle of DuckDB queries, caching, and materialization.
 */
export class DataCoordinator {
  protected cache = new Map<string, CacheEntry>();
  protected pool: ConnectionPool;
  protected maxFiles = 100;
  protected pendingMaterializations = new Map<string, Promise<CacheEntry>>();

  constructor(pool: ConnectionPool) {
    this.pool = pool;
  }

  /**
   * Generates a unique content-addressable key for a query configuration.
   */
  protected getCacheKey(
    slug: string,
    query: string,
    type: CacheEntry['type']
  ): string {
    return `${type}\0${slug}\0${query}`;
  }

  /**
   * Registers a Virtual View or Fragment.
   */
  registerView<TSlug extends string>(
    slug: TSlug,
    query: string,
    dependencies: string[] = [],
    type: 'fragment' = 'fragment'
  ): CacheEntry<TSlug> {
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

  /**
   * Requests a Materialized Table.
   */
  async requestTable<TSlug extends string>(
    slug: TSlug,
    query: string,
    dependencies: string[] = []
  ): Promise<CacheEntry<TSlug>> {
    const key = this.getCacheKey(slug, query, 'table');
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
      dependencies,
      type: 'table',
      query,
    };

    this.cache.set(key, entry);

    const promise = this.executeMaterialization(key, entry, query) as Promise<CacheEntry<TSlug>>;
    this.pendingMaterializations.set(key, promise);
    promise.finally(() => this.pendingMaterializations.delete(key));
    return promise;
  }

  protected async executeMaterialization(
    key: string,
    entry: CacheEntry,
    query: string
  ): Promise<CacheEntry> {
    try {
      this.cache.set(key, { ...entry, status: 'writing' });

      await this.pool.db.registerOPFSFileName(entry.path);
      await this.pool.dumpIPCTable(`COPY (${query}) TO '${entry.path}' (FORMAT PARQUET)`);

      const readyEntry: CacheEntry = { ...entry, status: 'ready', lastUsed: Date.now() };
      this.cache.set(key, readyEntry);

      this.cleanupStaleSlugEntries(entry.slug, key);
      this.cleanup();
      return readyEntry;
    } catch (err) {
      console.error(`Error materializing table ${entry.id}:`, err);
      const errorEntry: CacheEntry = { ...entry, status: 'error', error: err as Error };
      this.cache.set(key, errorEntry);
      return errorEntry;
    }
  }

  protected async cleanupStaleSlugEntries(slug: string, currentKey: string) {
    const toDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.slug === slug && key !== currentKey && entry.type === 'table') {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      const entry = this.cache.get(key);
      if (entry?.path) {
        try {
          await this.pool.db.dropFile(entry.path);
        } catch (e) {}
      }
      this.cache.delete(key);
    }
  }

  protected async cleanup() {
    const tableEntries = Array.from(this.cache.entries()).filter(([, e]) => e.type === 'table');
    if (tableEntries.length <= this.maxFiles) return;

    const sorted = tableEntries.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);
    const refCounts = new Map<string, number>();
    for (const entry of this.cache.values()) {
      for (const depId of entry.dependencies) {
        refCounts.set(depId, (refCounts.get(depId) || 0) + 1);
      }
    }

    const toDelete: string[] = [];
    for (const [key, entry] of sorted) {
      if (tableEntries.length - toDelete.length <= this.maxFiles) break;
      if ((refCounts.get(entry.id) || 0) === 0 && entry.status === 'ready') {
        toDelete.push(key);
        try {
          await this.pool.db.dropFile(entry.path);
        } catch (e) {}
      }
    }

    for (const key of toDelete) this.cache.delete(key);
  }

  resolveEntryAsSql(entry: CacheEntry): string {
    return _resolveEntryAsSql([...this.cache.values()], entry);
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
