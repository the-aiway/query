import type { CacheEntry } from './DataCoordinator';

/**
 * Raw substitution — injects values without quoting.
 */
export function substituteRaw(query: string, subs: Record<string, string>): string {
  let result = query;
  for (const [k, v] of Object.entries(subs)) {
    result = result.split(`$${k}`).join(v);
  }
  return result;
}

function findById(cache: CacheEntry[], id: string): CacheEntry | undefined {
  return cache.find(e => e.id === id);
}

/**
 * Builds a slug→expression mapping for query construction.
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
      subs[dep.slug] = `(${fragQuery})`;
    } else {
      subs[dep.slug] = `'${dep.path}'`;
    }
  }

  return subs;
}

/**
 * Recursively resolves an entry's query by replacing concrete dep references
 * with their inlined SQL, depth-first.
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

  for (const depId of entry.dependencies) {
    if (visited.has(depId)) continue;
    const dep = findById(cache, depId);
    if (!dep) continue;

    visited.add(depId);
    const depSql = inlineEntry(cache, dep, visited);

    if (dep.type === 'table') {
      sql = sql.split(`'${dep.path}'`).join(`(${depSql})`);
    }
  }

  return sql;
}

/**
 * Resolves an entry into a single, self-contained SQL query for display.
 */
export function resolveEntryAsSql(
  cache: CacheEntry[],
  entry: CacheEntry
): string {
  return inlineEntry(cache, entry, new Set());
}
