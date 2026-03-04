import { mapKeys } from 'es-toolkit/object';
import { sqlConditions, type SqlConditionValue } from './sqlConditions';

export type FilterValue = string[] | { $between: [number, number] };
export type FiltersState = Record<string, FilterValue>;

export const isSetFilter = (v: FilterValue): v is string[] => Array.isArray(v);
export const isRangeFilter = (v: FilterValue): v is { $between: [number, number] } => !Array.isArray(v) && typeof v === 'object' && '$between' in v;

const cond = (col: string, val: SqlConditionValue) => sqlConditions(mapKeys({ _: val }, () => col));

export function quoteIdent(name: string) {
  if (name.includes('.'))
    return name
      .split('.')
      .map((p) => `"${p.replaceAll('"', '""')}"`)
      .join('.');
  return `"${name.replaceAll('"', '""')}"`;
}

const qi = quoteIdent;
const cast = (col: string) => `CAST(${qi(col)} AS VARCHAR)`;

export function normalizeSelectSql(sql: string) {
  const cleaned = sql.trim().replace(/;+$/, '');
  if (!cleaned) return '';
  return /^from\b/i.test(cleaned) ? `SELECT * ${cleaned}` : cleaned;
}

export function buildWhereClause(opts: { globalFilter: string; fieldNamesForGlobal: string[]; columnFilters: FiltersState; excludeCol?: string }): { whereClause: string } {
  const parts: string[] = [];

  for (const [col, f] of Object.entries(opts.columnFilters).sort(([a], [b]) => a.localeCompare(b))) {
    if (!f || (opts.excludeCol && col === opts.excludeCol)) continue;

    if (isSetFilter(f) && f.length > 0) {
      const nonNull = f.filter((k) => k !== '__NULL__');
      const or = [...(nonNull.length > 0 ? [cond(cast(col), { $in: nonNull })] : []), ...(f.includes('__NULL__') ? [cond(qi(col), { $eq: null })] : [])];
      if (or.length > 0) parts.push(`(${or.join(' OR ')})`);
    } else if (isRangeFilter(f)) {
      parts.push(cond(qi(col), { $between: f.$between }));
    }
  }

  const gf = opts.globalFilter.trim();
  if (gf && opts.fieldNamesForGlobal.length > 0) parts.push(`(${opts.fieldNamesForGlobal.map((c) => cond(cast(c), { $ilike: `%${gf}%` })).join(' OR ')})`);

  return { whereClause: parts.length > 0 ? `\nWHERE ${parts.join(' AND ')}` : '' };
}

export function serializeSort(sorting: { id: string; desc: boolean }[]): string | null {
  if (sorting.length === 0) return null;
  return sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',');
}

export function parseSort(raw: string | null): { id: string; desc: boolean }[] {
  if (!raw) return [];
  return raw
    .split(',')
    .filter(Boolean)
    .map((s) => (s.startsWith('-') ? { id: s.slice(1), desc: true } : { id: s, desc: false }));
}

export function serializeFilters(filters: FiltersState): string | null {
  const active: FiltersState = {};
  for (const [col, val] of Object.entries(filters)) {
    if (isSetFilter(val) && val.length > 0) active[col] = val;
    else if (isRangeFilter(val)) active[col] = val;
  }
  return Object.keys(active).length > 0 ? JSON.stringify(active) : null;
}

export function parseFilters(raw: string | null): FiltersState {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as FiltersState;
  } catch {
    return {};
  }
}

export function serializeQTLayout(visibility: Record<string, boolean>, sizing: Record<string, number>): string {
  return JSON.stringify({
    ...(Object.keys(visibility).length > 0 ? { v: visibility } : {}),
    ...(Object.keys(sizing).length > 0 ? { sz: sizing } : {}),
  });
}

export function parseQTLayout(raw: string | null) {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as { v?: Record<string, boolean>; sz?: Record<string, number> };
    return { visibility: p.v ?? {}, sizing: p.sz ?? {} };
  } catch {
    return null;
  }
}

export function escapeSQL(v: unknown): string {
  if (v == null) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
  if (typeof v === 'object') {
    return JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val))
      .replace(/'/g, "''")
      .replace(/\\"/g, '"')
      .replace(/"/g, "'");
  }
  return String(v);
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
