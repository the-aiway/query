import type { CacheEntry } from './DataCoordinator';
import { substituteParams } from './DataCoordinator';

/**
 * Raw substitution — injects values without quoting.
 * Used for dependency expressions (paths, view ids, inlined SQL subqueries)
 * which are already properly formatted SQL fragments.
 */
export function substituteRaw(query: string, subs: Record<string, string>): string {
  let result = query;
  for (const [k, v] of Object.entries(subs)) {
    result = result.split(`$${k}`).join(v);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findById(cache: CacheEntry[], id: string): CacheEntry | undefined {
  for (const entry of cache) {
    if (entry.id === id) return entry;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// buildSubstitutionMap — used at query-building time (useQueryBuilder)
// ---------------------------------------------------------------------------

/**
 * Builds a slug→expression mapping for query construction.
 *
 * - Tables    → `'opfs://path.parquet'` (direct path)
 * - Views     → their internal identifier (e.g. `filtered_v_k2j34`)
 * - Fragments → `(inlined SQL)` with deps and params resolved
 */
export function buildSubstitutionMap(
  cache: CacheEntry[],
  depIds: string[]
): Record<string, string> {
  const subs: Record<string, string> = {};

  for (const depId of depIds) {
    const dep = findById(cache, depId);
    if (!dep) continue;

    if (dep.type === 'fragment') {
      let fragQuery = dep.query || '';
      if (dep.dependencies.length > 0) {
        const fragDepSubs = buildSubstitutionMap(cache, dep.dependencies);
        fragQuery = substituteRaw(fragQuery, fragDepSubs);
      }
      if (dep.params) fragQuery = substituteParams(fragQuery, dep.params);
      subs[dep.slug] = `(${fragQuery})`;
    } else if (dep.type === 'table') {
      subs[dep.slug] = `'${dep.path}'`;
    } else {
      subs[dep.slug] = dep.id;
    }
  }

  return subs;
}

// ---------------------------------------------------------------------------
// resolveViewDependencies — for EXECUTION (CREATE TEMP VIEW)
// ---------------------------------------------------------------------------

/**
 * Resolves the full chain of view dependencies for execution.
 * Returns CREATE TEMP VIEW statements. Tables and fragments are NOT emitted
 * (tables exist as OPFS files, fragments are inlined by buildSubstitutionMap).
 */
export function resolveViewDependencies(
  cache: CacheEntry[],
  depIds: string[]
): string[] {
  const results: string[] = [];
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);

    const entry = findById(cache, id);
    if (!entry) return;

    entry.dependencies.forEach(visit);

    if (entry.type !== 'view' || !entry.query) return;

    const depSubs = buildSubstitutionMap(cache, entry.dependencies);
    let query = substituteRaw(entry.query, depSubs);
    if (entry.params) query = substituteParams(query, entry.params);

    results.push(`CREATE OR REPLACE TEMP VIEW ${entry.id} AS ${query};`);
  };

  depIds.forEach(visit);
  return results;
}

// ---------------------------------------------------------------------------
// resolveEntryAsSql — for DISPLAY (fully inlined, self-contained)
// ---------------------------------------------------------------------------

/**
 * Recursively resolves an entry's query by replacing concrete dep references
 * (OPFS paths and view IDs) with their inlined SQL, depth-first.
 *
 * Since useQueryBuilder eagerly resolves deps, stored queries already contain
 * concrete references like `'opfs://path.parquet'` and `view_id`.
 * This function walks the dep graph and replaces those references with `(original SQL)`.
 */
function inlineEntry(
  cache: CacheEntry[],
  entry: CacheEntry,
  visited: Set<string>
): string {
  if (!entry.query) {
    return entry.type === 'table' ? `SELECT * FROM '${entry.path}'` : `SELECT * FROM ${entry.id}`;
  }

  let sql = entry.query;

  // Process each dependency: find its concrete reference in sql and replace with inlined query
  for (const depId of entry.dependencies) {
    if (visited.has(depId)) continue;
    const dep = findById(cache, depId);
    if (!dep) continue;

    visited.add(depId);
    const depSql = inlineEntry(cache, dep, visited);

    if (dep.type === 'table') {
      // Replace 'opfs://path.parquet' → (inlined SQL)
      sql = sql.split(`'${dep.path}'`).join(`(${depSql})`);
    } else if (dep.type === 'view') {
      // Replace view_id → (inlined SQL)
      // Use word-boundary-safe replacement to avoid partial matches
      sql = sql.replace(new RegExp(`\\b${escapeRegex(dep.id)}\\b`, 'g'), `(${depSql})`);
    }
    // Fragments are already inlined by buildSubstitutionMap at query-building time
  }

  if (entry.params) {
    sql = substituteParams(sql, entry.params);
  }

  return sql;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolves an entry into a single, self-contained SQL query for display.
 * All dependencies (tables, views) are recursively inlined as subqueries.
 * No opaque OPFS paths appear (when deps have stored queries).
 */
export function resolveEntryAsSql(
  cache: CacheEntry[],
  entry: CacheEntry
): string {
  return inlineEntry(cache, entry, new Set());
}
