
export type FilterValue = string[] | { $between: [number, number] };
export type FiltersState = Record<string, FilterValue>;

export function isSetFilter(v: FilterValue): v is string[] {
  return Array.isArray(v);
}

export function isRangeFilter(v: FilterValue): v is { $between: [number, number] } {
  return !Array.isArray(v) && typeof v === 'object' && '$between' in v && Array.isArray(v.$between);
}

export function serializeQTUrlState(
  sorting: { id: string; desc: boolean }[],
  filters: FiltersState,
  globalFilter: string,
  customSql?: string | null,
): string | null {
  const state: Record<string, unknown> = {};

  for (const [col, val] of Object.entries(filters)) {
    if (!val) continue;
    if (isSetFilter(val) && val.length > 0) state[col] = val;
    else if (isRangeFilter(val)) state[col] = val;
  }

  if (sorting.length > 0) {
    state.$sort = sorting.map((s) => (s.desc ? `-${s.id}` : s.id));
  }
  if (globalFilter.trim()) state.$q = globalFilter.trim();
  if (customSql?.trim()) state.$sql = customSql.trim();

  if (Object.keys(state).length === 0) return null;

  return JSON.stringify(state);
}


export function parseQTUrlState(raw: string | null): {
  sorting: { id: string; desc: boolean }[];
  filters: FiltersState;
  globalFilter: string;
  customSql: string | null;
} {
  const defaults = { sorting: [] as { id: string; desc: boolean }[], filters: {} as FiltersState, globalFilter: '', customSql: null as string | null };
  if (!raw) return defaults;

  const parsed = JSON.parse(raw);
  if (!parsed) return defaults;

  const sorting: { id: string; desc: boolean }[] = [];
  if (Array.isArray(parsed.$sort)) {
    for (const s of parsed.$sort) {
      if (typeof s !== 'string') continue;
      if (s.startsWith('-')) sorting.push({ id: s.slice(1), desc: true });
      else sorting.push({ id: s, desc: false });
    }
  }

  const globalFilter = typeof parsed.$q === 'string' ? parsed.$q : '';
  const customSql = typeof parsed.$sql === 'string' ? parsed.$sql : null;

  const filters: FiltersState = {};
  for (const [key, val] of Object.entries(parsed)) {
    if (key.startsWith('$')) continue;
    if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
      filters[key] = val as string[];
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('$between' in val && Array.isArray((val as Record<string, unknown>).$between)) {
        const b = (val as { $between: unknown[] }).$between;
        if (b.length === 2 && typeof b[0] === 'number' && typeof b[1] === 'number') {
          filters[key] = { $between: [b[0], b[1]] };
        }
      } else if ('$gte' in val && '$lte' in val) {
        const r = val as { $gte: unknown; $lte: unknown };
        if (typeof r.$gte === 'number' && typeof r.$lte === 'number') {
          filters[key] = { $between: [r.$gte, r.$lte] };
        }
      }
    }
  }

  return { sorting, filters, globalFilter, customSql };
}

export interface QTLayoutState {
  v?: Record<string, boolean>;
  sz?: Record<string, number>;
}

export function serializeQTLayout(
  visibility: Record<string, boolean>,
  sizing: Record<string, number>,
): string {
  return JSON.stringify({
    ...(Object.keys(visibility).length > 0 ? { v: visibility } : {}),
    ...(Object.keys(sizing).length > 0 ? { sz: sizing } : {}),
  });
}

export function parseQTLayout(
  raw: string | null,
  fieldNames: string[],
): {
  visibility: Record<string, boolean>;
  sizing: Record<string, number>;
} | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as QTLayoutState;
    const fieldSet = new Set(fieldNames);

    const visibility: Record<string, boolean> = {};
    if (parsed.v && typeof parsed.v === 'object') {
      for (const [col, visible] of Object.entries(parsed.v)) {
        if (fieldSet.has(col)) visibility[col] = !!visible;
      }
    }

    const sizing: Record<string, number> = {};
    if (parsed.sz && typeof parsed.sz === 'object') {
      for (const [col, size] of Object.entries(parsed.sz)) {
        if (fieldSet.has(col) && typeof size === 'number' && Number.isFinite(size)) {
          sizing[col] = size;
        }
      }
    }

    return { visibility, sizing };
  } catch {
    return null;
  }
}

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

  const cleaned = trimmed.replace(/;+$/, '');

  if (/^from\b/i.test(cleaned)) {
    return `SELECT * ${cleaned}`;
  }

  return cleaned;
}

export function fnv1a32Hex(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildWhereClause(opts: {
  globalFilter: string;
  fieldNamesForGlobal: string[];
  columnFilters: FiltersState;
  excludeCol?: string;
}): { whereClause: string; whereParams: unknown[] } {
  const gf = opts.globalFilter.trim();
  const whereParts: string[] = [];
  const whereParams: unknown[] = [];

  const sortedEntries = Object.entries(opts.columnFilters).sort(([a], [b]) => a.localeCompare(b));

  for (const [col, filter] of sortedEntries) {
    if (!filter) continue;
    if (opts.excludeCol && col === opts.excludeCol) continue;

    if (isSetFilter(filter)) {
      if (filter.length === 0) continue;
      const nonNull = filter.filter((k) => k !== '__NULL__');
      const hasNull = filter.some((k) => k === '__NULL__');
      const clauses: string[] = [];
      if (nonNull.length > 0) {
        clauses.push(`CAST(${quoteIdent(col)} AS VARCHAR) IN (${nonNull.map(() => '?').join(', ')})`);
        whereParams.push(...nonNull);
      }
      if (hasNull) clauses.push(`${quoteIdent(col)} IS NULL`);
      if (clauses.length > 0) whereParts.push(`(${clauses.join(' OR ')})`);
    } else if (isRangeFilter(filter)) {
      whereParts.push(`(${quoteIdent(col)} >= ? AND ${quoteIdent(col)} <= ?)`);
      whereParams.push(filter.$between[0], filter.$between[1]);
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
