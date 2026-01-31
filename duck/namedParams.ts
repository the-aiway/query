/**
 * Maps named parameters ($key) to positional parameters ($1, $2, ...)
 * and returns the parameters in the correct order.
 */
export function mapNamedParams(
  sql: string,
  params?: unknown[] | Record<string, unknown>
): { sql: string; params: unknown[] } {
  if (!params) return { sql, params: [] };

  if (Array.isArray(params)) {
    return { sql, params };
  }

  const keys = Object.keys(params).sort((a, b) => b.length - a.length);
  let mappedSql = sql;
  const normalizedParams: unknown[] = [];
  const keyToIndex = new Map<string, number>();

  // Replace each $key with its positional index ($1, $2, ...)
  // We sort keys by length descending to avoid partial matches (e.g., $id vs $id_long)
  for (const key of keys) {
    const placeholder = `$${key}`;
    if (mappedSql.includes(placeholder)) {
      if (!keyToIndex.has(key)) {
        normalizedParams.push((params as Record<string, unknown>)[key]);
        keyToIndex.set(key, normalizedParams.length);
      }
      const index = keyToIndex.get(key);
      mappedSql = mappedSql.split(placeholder).join(`$${index}`);
    }
  }

  return { sql: mappedSql, params: normalizedParams };
}
