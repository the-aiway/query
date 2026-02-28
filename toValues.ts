function escapeJsonForSql(obj: object): string {
  return JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
    .replace(/'/g, "''")
    .replace(/\\/g, '__ESC_DQ__')
    .replace(/"/g, "'")
    .replace(/__ESC_DQ__/g, '"');
}

function escapeSQL(v: unknown): string {
  if (v == null) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
  if (typeof v === 'object') return escapeJsonForSql(v);
  return String(v);
}

export type ValuesSchema = Record<string, string> | readonly string[];

function inferCols(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) return [];
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of data) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  return keys;
}

export function toValues(data: Record<string, unknown>[], schema?: ValuesSchema): string {
  const isArray = schema != null && Array.isArray(schema);
  const cols = schema != null ? (isArray ? (schema as string[]) : Object.keys(schema)) : inferCols(data);
  if (data.length === 0) return '';
  const rows = data.map((r) => `(${cols.map((c) => escapeSQL(r[c])).join(',')})`);
  return rows.join(',');
}

export function toValuesSelect(data: Record<string, unknown>[], schema?: ValuesSchema): string {
  const isArray = schema != null && Array.isArray(schema);
  const cols = schema != null ? (isArray ? (schema as string[]) : Object.keys(schema)) : inferCols(data);
  if (data.length === 0) {
    if (cols.length === 0) return 'SELECT 1 WHERE FALSE';
    if (isArray) return `SELECT ${cols.map((c) => `NULL AS ${c}`).join(', ')} WHERE FALSE`;
    const selects = cols.map((c) => `NULL::${(schema as Record<string, string>)[c]} AS ${c}`).join(', ');
    return `SELECT ${selects} WHERE FALSE`;
  }
  const valuesPart = toValues(data, schema);
  if (schema == null || isArray) {
    return `SELECT * FROM (VALUES ${valuesPart}) AS _v(${cols.join(',')})`;
  }
  const casts = cols.map((c) => `${c}::${(schema as Record<string, string>)[c]} AS ${c}`).join(', ');
  return `SELECT ${casts} FROM (VALUES ${valuesPart}) AS _v(${cols.join(',')})`;
}
