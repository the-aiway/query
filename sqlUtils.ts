export type FilterValue =
  | { type: 'set'; values: string[] }
  | { type: 'range'; min: number; max: number };

export type FiltersState = Record<string, FilterValue>;

export function quoteIdent(name: string) {
  if (name.includes('.')) {
    return name
      .split('.')
      .map((part) => `"${part.replaceAll('"', '""')}"`)
      .join('.');
  }
  return `"${name.replaceAll('"', '""')}"`;
}

export function quoteString(val: string) {
  return `'${val.replaceAll("'", "''")}'`;
}

export function normalizeSelectSql(sql: string) {
  const trimmed = sql.trim();
  if (!trimmed) return '';

  // Remove trailing semicolon if present, as it breaks CTE wrapping
  const cleaned = trimmed.replace(/;+$/, '');

  // Allow shorthand: FROM 'file.csv'
  if (/^from\b/i.test(cleaned)) {
    return `SELECT * ${cleaned}`;
  }

  return cleaned;
}
export function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
export function fnv1a32Hex(input: string) {
  return fnv1a32(input).toString(16).padStart(8, '0');
}

export function buildWhereClause(opts: {
  globalFilter: string;
  fieldNamesForGlobal: string[];
  setFilters: FiltersState;
  excludeCol?: string;
}): { whereClause: string; whereParams: unknown[] } {
  const gf = opts.globalFilter.trim();
  const whereParts: string[] = [];
  const whereParams: unknown[] = [];

  const sortedEntries = Object.entries(opts.setFilters).sort(([a], [b]) => a.localeCompare(b));

  for (const [col, filter] of sortedEntries) {
    if (!filter) continue;
    if (opts.excludeCol && col === opts.excludeCol) continue;

    if (filter.type === 'set') {
      const selected = filter.values;
      if (selected.length === 0) continue;

      const nonNull = selected.filter((k) => k !== '__NULL__');
      const hasNull = selected.some((k) => k === '__NULL__');

      const clauses: string[] = [];
      if (nonNull.length > 0) {
        clauses.push(
          `CAST(${quoteIdent(col)} AS VARCHAR) IN (${nonNull.map(() => '?').join(', ')})`
        );
        whereParams.push(...nonNull);
      }
      if (hasNull) {
        clauses.push(`${quoteIdent(col)} IS NULL`);
      }

      if (clauses.length > 0) {
        whereParts.push(`(${clauses.join(' OR ')})`);
      }
    } else if (filter.type === 'range') {
      const { min, max } = filter;
      if (typeof min === 'number' && typeof max === 'number') {
        whereParts.push(`(${quoteIdent(col)} >= ? AND ${quoteIdent(col)} <= ?)`);
        whereParams.push(min, max);
      }
    }
  }

  if (gf && opts.fieldNamesForGlobal.length > 0) {
    const orParts = opts.fieldNamesForGlobal.map((col) => {
      whereParams.push(gf);
      return `CAST(${quoteIdent(col)} AS VARCHAR) ILIKE '%' || ? || '%'`;
    });
    whereParts.push(`(${orParts.join(' OR ')})`);
  }

  const whereClause = whereParts.length > 0 ? `\nWHERE ${whereParts.join(' AND ')}` : '';
  return { whereClause, whereParams };
}
