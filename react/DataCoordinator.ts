import type { ConnectionPool } from '../duck/ConnectionPool';

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
   * Resolves the full chain of dependencies for a set of IDs.
   * Returns a list of SQL statements (CREATE TEMP VIEW ...) needed to reconstruct the context.
   *
   * @param depIds - The immediate dependencies of a query.
   * @param opts.includeFragments - If true, also create views for fragments (default: false, fragments are inlined).
   * @param opts.mode - 'view' (default) returns CREATE TEMP VIEW statements, 'cte' returns CTE clauses.
   * @returns Array of SQL statements/clauses.
   */
  resolveViewDependencies(
    depIds: string[],
    opts?: { includeFragments?: boolean; mode?: 'view' | 'cte' }
  ): string[] {
    const includeFragments = opts?.includeFragments ?? false;
    const mode = opts?.mode ?? 'view';
    const results: string[] = [];
    const visited = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const entry = Array.from(this.cache.values()).find((e) => e.id === id);
      if (!entry) return;

      // Depth-first traversal: Visit dependencies of dependencies first
      entry.dependencies.forEach(visit);

      const shouldInclude =
        (entry.type === 'view' && entry.query) ||
        (includeFragments && entry.type === 'fragment' && entry.query);

      if (shouldInclude) {
        // Prepare replacement map: slug -> actual ID or read_parquet call
        const depSubstitutions: Record<string, string> = {};
        entry.dependencies.forEach((depId) => {
          const dep = Array.from(this.cache.values()).find((e) => e.id === depId);
          if (dep) {
            if (!includeFragments && dep.type === 'fragment') {
              // For fragments, we inline the query directly recursively
              const fragQuery = dep.query ? substituteParams(dep.query, dep.params || {}) : '';
              depSubstitutions[dep.slug] = `(${fragQuery})`;
            } else {
              // Reference views/tables/fragments by their ID
              depSubstitutions[dep.slug] = dep.type === 'table' ? `read_parquet('${dep.path}')` : dep.id;
            }
          }
        });

        // Reconstruct the query string with concrete IDs
        let query = entry.query!;
        // First substitute dependency references ($slug -> actual ID or inline)
        query = substituteParams(query, depSubstitutions);
        // Then substitute the entry's own params
        if (entry.params) {
          query = substituteParams(query, entry.params);
        }

        if (mode === 'cte') {
          // CTE clause: "name AS (query)"
          results.push(`${entry.id} AS (${query})`);
        } else {
          // Create the temporary view for the session
          results.push(`CREATE OR REPLACE TEMP VIEW ${entry.id} AS ${query};`);
        }
      }
    };

    depIds.forEach(visit);
    return results;
  }

  /**
   * Resolves an entry and all its dependencies into a single SQL query using CTEs.
   * Returns a complete query like: `WITH dep1 AS (...), dep2 AS (...) SELECT ... FROM dep2`
   * The entry's own query becomes the final SELECT (not wrapped in another CTE).
   *
   * @param entry - The CacheEntry to resolve.
   * @returns A complete SQL query string.
   */
  resolveEntryAsSql(entry: CacheEntry): string {
    const ctes: string[] = [];
    const visited = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const e = Array.from(this.cache.values()).find((c) => c.id === id);
      if (!e) return;

      // Depth-first traversal: Visit dependencies first
      e.dependencies.forEach(visit);

      // Only process entries with queries (views and fragments)
      if (!e.query || (e.type !== 'view' && e.type !== 'fragment')) return;

      // Build substitution map: slug -> CTE name or read_parquet
      const depSubstitutions: Record<string, string> = {};
      e.dependencies.forEach((depId) => {
        const dep = Array.from(this.cache.values()).find((c) => c.id === depId);
        if (dep) {
          depSubstitutions[dep.slug] = dep.type === 'table' ? `read_parquet('${dep.path}')` : dep.id;
        }
      });

      // Substitute dependency references and params
      let query = e.query;
      query = substituteParams(query, depSubstitutions);
      if (e.params) {
        query = substituteParams(query, e.params);
      }

      ctes.push(`${e.id} AS (${query})`);
    };

    // Visit all dependencies (but NOT the entry itself - its query becomes the final SELECT)
    entry.dependencies.forEach(visit);

    // Build the final SELECT from the entry
    let finalSelect: string;
    if (entry.query && (entry.type === 'fragment' || entry.type === 'view')) {
      // Substitute dependency references in the entry's query
      const depSubstitutions: Record<string, string> = {};
      entry.dependencies.forEach((depId) => {
        const dep = Array.from(this.cache.values()).find((c) => c.id === depId);
        if (dep) {
          depSubstitutions[dep.slug] = dep.type === 'table' ? `read_parquet('${dep.path}')` : dep.id;
        }
      });
      finalSelect = substituteParams(entry.query, depSubstitutions);
      if (entry.params) {
        finalSelect = substituteParams(finalSelect, entry.params);
      }
    } else if (entry.type === 'table') {
      finalSelect = `SELECT * FROM read_parquet('${entry.path}')`;
    } else {
      finalSelect = `SELECT * FROM ${entry.id}`;
    }

    return ctes.length > 0
      ? `WITH ${ctes.join(',\n')}\n${finalSelect}`
      : finalSelect;
  }
}
