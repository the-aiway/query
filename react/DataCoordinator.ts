import type { ConnectionPool } from '../duck/ConnectionPool';
import {
  resolveViewDependencies as _resolveViewDependencies,
  resolveEntryAsSql as _resolveEntryAsSql,
} from './resolveDependencies';

export type QueryStatus = 'pending' | 'writing' | 'ready' | 'error';

function escapeSQLString(value: string): string {
  return value.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

export function substituteParams(query: string, params: Record<string, unknown>): string {
  let finalQuery = query;
  for (const [k, v] of Object.entries(params)) {
    let val = v;
    if (v instanceof Date) {
      val = `'${v.toISOString()}'`;
    } else if (typeof v === 'string') {
      val = `'${escapeSQLString(v)}'`;
    }
    finalQuery = finalQuery.split(`$${k}`).join(String(val));
  }
  return finalQuery;
}

/**
 * Represents a cached query result or modification.
 * Can be a virtual view (lightweight), a materialized table (persistently stored in OPFS),
 * or a SQL fragment (inlined).
 */
export interface CacheEntry<TSlug extends string = string, TRow = unknown> {
  id: string; // Unique internal ID (e.g. "users_v_k2j4s")
  slug: TSlug; // User-provided slug (e.g. "users")
  path: string; // OPFS path for tables (e.g. "opfs://users_t_...parquet")
  status: QueryStatus;
  error?: Error;
  lastUsed: number; // Timestamp for LRU cleanup
  dependencies: string[]; // IDs of dependencies
  type: 'table' | 'view' | 'fragment';
  query?: string; // SQL query string
  params?: Record<string, unknown>; // Bound parameters
  /** @internal Phantom type for row shape inference. Never set at runtime. */
  readonly __row?: TRow;
}

/**
 * The DataCoordinator manages the lifecycle of DuckDB queries, caching, and materialization.
 *
 * Core Responsibilities:
 * 1. **Cache Management**: Deduplicates requests for the same query/params/dependencies.
 * 2. **Materialization**: Orchestrates `COPY TO` commands to write results to OPFS (Origin Private File System) as Parquet.
 * 3. **Virtual Views**: Manages lightweight `CREATE VIEW` abstractions for zero-copy composition.
 * 4. **Fragments**: Manages SQL fragments that are inlined directly into dependent queries.
 * 5. **Dependency Resolution**: Recursively resolves and reconstructs the dependency graph for a query.
 * 6. **Garbage Collection**: Prunes unused OPFS files to prevent storage exhaustion.
 */
export class DataCoordinator {
  protected cache = new Map<string, CacheEntry>();
  protected pool: ConnectionPool;
  protected maxFiles = 100;
  protected listeners = new Set<() => void>();
  protected pendingMaterializations = new Map<string, Promise<CacheEntry>>();

  constructor(pool: ConnectionPool) {
    this.pool = pool;
  }

  /**
   * Subscribes to changes in the cache (new entries, status updates).
   * Used by the `useCoordinatorSubscription` hook to trigger React re-renders.
   */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected notify() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Generates a unique content-addressable key for a query configuration.
   * This ensures that identical queries share the same cache entry (deduplication).
   */
  protected getCacheKey(
    slug: string,
    query: string,
    params: Record<string, unknown>,
    dependencies: string[],
    type: CacheEntry['type']
  ): string {
    return JSON.stringify({ slug, query, params, dependencies, type });
  }

  /**
   * Registers a Virtual View or Fragment.
   * - Views are lightweight aliases (CREATE VIEW).
   * - Fragments are inlined SQL subqueries.
   *
   * @returns The existing or newly created CacheEntry (synchronously 'ready').
   */
  registerView<TSlug extends string>(
    slug: TSlug,
    query: string,
    params: Record<string, unknown>,
    dependencies: string[] = [],
    type: 'view' | 'fragment' = 'view'
  ): CacheEntry<TSlug> {
    const key = this.getCacheKey(slug, query, params, dependencies, type);
    const existing = this.cache.get(key);

    if (existing) {
      existing.lastUsed = Date.now();
      return existing as CacheEntry<TSlug>;
    }

    // Unique ID generation: "slug_v_random" or "slug_f_random"
    const prefix = type === 'view' ? 'v' : 'f';
    const id = `${slug}_${prefix}_${Math.random().toString(36).slice(2, 7)}`;
    const entry: CacheEntry<TSlug> = {
      id,
      slug,
      path: '',
      status: 'ready', // Views/Fragments are instantly ready
      lastUsed: Date.now(),
      dependencies,
      type,
      query,
      params,
    };

    this.cache.set(key, entry);
    return entry;
  }

  /**
   * Requests a Materialized Table.
   * Tables are physically written to OPFS as Parquet files. This is async and expensive
   * but speeds up subsequent reads, especially for complex aggregations.
   *
   * @returns A Promise that resolves with the CacheEntry once materialization is complete.
   */
  async requestTable<TSlug extends string>(
    slug: TSlug,
    query: string,
    params: Record<string, unknown>,
    dependencies: string[] = []
  ): Promise<CacheEntry<TSlug>> {
    const key = this.getCacheKey(slug, query, params, dependencies, 'table');
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
      params,
    };

    this.cache.set(key, entry);

    const promise = this.executeMaterialization(key, entry, query, params) as Promise<CacheEntry<TSlug>>;
    this.pendingMaterializations.set(key, promise);
    promise.finally(() => this.pendingMaterializations.delete(key));
    return promise;
  }

  protected async executeMaterialization(
    key: string,
    entry: CacheEntry,
    query: string,
    params: Record<string, unknown>
  ): Promise<CacheEntry> {
    try {
      this.cache.set(key, { ...entry, status: 'writing' });

      const finalQuery = substituteParams(query, params);

      await this.pool.db.registerOPFSFileName(entry.path);
      await this.pool.dumpIPCTable(`COPY (${finalQuery}) TO '${entry.path}' (FORMAT PARQUET)`);

      const readyEntry: CacheEntry = { ...entry, status: 'ready', lastUsed: Date.now() };
      this.cache.set(key, readyEntry);
      this.cleanup();
      return readyEntry;
    } catch (err) {
      console.error(`Error materializing table ${entry.id}:`, err);
      const errorEntry: CacheEntry = { ...entry, status: 'error', error: err as Error };
      this.cache.set(key, errorEntry);
      return errorEntry;
    }
  }

  /**
   * Garbage Collection for OPFS files.
   * Keeps the cache size within `maxFiles` by removing the Least Recently Used (LRU) files.
   *
   * @remarks
   * This is critical because browser storage (OPFS) is finite.
   * It also checks reference counts (dependencies) to avoid deleting tables that are currently needed by others.
   */
  protected async cleanup() {
    const tableEntries = Array.from(this.cache.entries()).filter(([, e]) => e.type === 'table');

    if (tableEntries.length <= this.maxFiles) return;

    // Sort by LRU (oldest used first)
    const sortedEntries = tableEntries.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

    // Calculate reference counts (how many other views/tables depend on this ID)
    const refCounts = new Map<string, number>();
    for (const entry of this.cache.values()) {
      for (const depId of entry.dependencies) {
        refCounts.set(depId, (refCounts.get(depId) || 0) + 1);
      }
    }

    const toDelete: string[] = [];
    for (const [key, entry] of sortedEntries) {
      if (tableEntries.length - toDelete.length <= this.maxFiles) break;

      // Only delete if NO active dependencies and NOT currently writing
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

  /**
   * Resolves the full chain of view dependencies for execution.
   * Delegates to the pure `resolveViewDependencies` function.
   */
  resolveViewDependencies(depIds: string[]): string[] {
    return _resolveViewDependencies([...this.cache.values()], depIds);
  }

  /**
   * Resolves an entry into fully inlined, self-contained SQL for display.
   * Delegates to the pure `resolveEntryAsSql` function.
   */
  resolveEntryAsSql(entry: CacheEntry): string {
    return _resolveEntryAsSql([...this.cache.values()], entry);
  }

  /**
   * Retrieves the full recursive dependency chain for an entry.
   * Returns a list of dependencies ordered from leaves (deepest) to roots (direct).
   */
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
