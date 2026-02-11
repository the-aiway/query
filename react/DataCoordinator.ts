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
   * Requests a Materialized Table. Source can be:
   * - SQL string: executed and COPYed to OPFS parquet
   * - Data (JSON array or Arrow Table): inserted into temp table, COPYed to OPFS, temp dropped
   */
  async requestTable<TSlug extends string>(
    slug: TSlug,
    source: string | unknown[],
    dependencies: string[] = []
  ): Promise<CacheEntry<TSlug>> {
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
      query: typeof source === 'string' ? source : `SELECT * FROM '${path}'`,
    };

    this.cache.set(key, entry);

    const promise = this.executeMaterialization(key, entry, source) as Promise<CacheEntry<TSlug>>;
    this.pendingMaterializations.set(key, promise);
    promise.finally(() => this.pendingMaterializations.delete(key));
    return promise;
  }

  protected async executeMaterialization(
    key: string,
    entry: CacheEntry,
    source: string | unknown[],
  ): Promise<CacheEntry> {
    const tempTable = typeof source !== 'string' ? `"__ingest_${entry.id}"` : null;
    try {
      this.cache.set(key, { ...entry, status: 'writing' });

      // If data source, insert into a temp named table first
      if (tempTable) {
        await this.pool.insertTable(tempTable, source as any);
      }

      const copySql = tempTable
        ? `SELECT * FROM ${tempTable}`
        : source as string;

      await this.pool.db.registerOPFSFileName(entry.path);
      await this.pool.dumpIPCTable(`COPY (${copySql}) TO '${entry.path}' (FORMAT PARQUET)`);

      // Drop temp table if we created one
      if (tempTable) {
        try { await this.pool.dump(`DROP TABLE IF EXISTS ${tempTable}`); } catch {}
      }

      const readyEntry: CacheEntry = { ...entry, status: 'ready', lastUsed: Date.now() };
      this.cache.set(key, readyEntry);
      return readyEntry;
    } catch (err) {
      console.error(`Error materializing table ${entry.id}:`, err);
      if (tempTable) {
        try { await this.pool.dump(`DROP TABLE IF EXISTS ${tempTable}`); } catch {}
      }
      const errorEntry: CacheEntry = { ...entry, status: 'error', error: err as Error };
      this.cache.set(key, errorEntry);
      return errorEntry;
    }
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
