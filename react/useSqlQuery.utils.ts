import type { QueryHandle, Dependency } from './useSqlQuery.types';

export function fnv1a32Hex(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

export function createInitialHandle(
  alias: string | null,
  sql: string,
  params: Record<string, unknown>
): QueryHandle {
  return {
    alias,
    tableId: alias || `transient_${Math.random().toString(36).slice(2)}`,
    sql,
    params,
    status: 'pending',
    isPending: true,
    isFetching: true,
    isSuccess: false,
    isError: false,
    error: null,
    table: null,
    data: null,
    duration: null,
    updatedAt: null,
    promise: Promise.resolve(),
    refetch: async () => {},
    toString: () => alias || '',
  };
}

export function isQueryHandle(d: Dependency): d is QueryHandle {
  return d !== null && typeof d === 'object' && 'tableId' in d && 'updatedAt' in d;
}

export function normalizeSQL(sql: string): string {
  const strings: string[] = [];
  let normalized = sql.replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
    strings.push(match);
    return `__STR_${strings.length - 1}__`;
  });

  normalized = normalized
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/;\s*$/, '')
    .trim();

  normalized = normalized.replace(/__STR_(\d+)__/g, (_, i) => strings[parseInt(i)]);
  return normalized;
}

export function rewriteNamedParams(
  sql: string,
  params: Record<string, unknown>
): { sql: string; values: unknown[] } {
  // Mask string literals and comments to avoid matching params inside them
  const masked_parts: string[] = [];
  let masked = sql
    // Mask single-line comments
    .replace(/--.*$/gm, (match) => {
      masked_parts.push(match);
      return `__MASK_${masked_parts.length - 1}__`;
    })
    // Mask multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, (match) => {
      masked_parts.push(match);
      return `__MASK_${masked_parts.length - 1}__`;
    })
    // Mask string literals
    .replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
      masked_parts.push(match);
      return `__MASK_${masked_parts.length - 1}__`;
    });

  const values: unknown[] = [];
  const nameToIndex = new Map<string, number>();
  const paramPattern = /\$([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  let match;
  
  // Find all params in the SQL
  while ((match = paramPattern.exec(masked)) !== null) {
    const name = match[1];
    if (!nameToIndex.has(name)) {
      if (!(name in params)) {
        throw new Error(`Parameter "$${name}" not found in params object`);
      }
      nameToIndex.set(name, values.length + 1);
      values.push(params[name]);
    }
  }

  // Check for unused params
  // We only check keys that are actually passed in params object
  // The spec says: "Throws if param in SQL not in object, or param in object not in SQL."
  // The loop above checks "param in SQL not in object".
  // Now check "param in object not in SQL".
  
  // We need to re-scan or use the map we built.
  // nameToIndex contains all params found in SQL.
  for (const name of Object.keys(params)) {
    if (!nameToIndex.has(name)) {
      throw new Error(`Parameter "${name}" provided but not used in SQL`);
    }
  }

  // Rewrite params in masked SQL
  for (const [name, index] of nameToIndex) {
    // Use word boundary to ensure we don't replace $cityState with $1State if we are replacing $city
    masked = masked.replace(new RegExp(`\\$${name}\\b`, 'g'), `$${index}`);
  }

  // Restore masked parts (strings and comments)
  const rewrittenSql = masked.replace(/__MASK_(\d+)__/g, (_, i) => masked_parts[parseInt(i)]);

  return { sql: rewrittenSql, values };
}

const VALID_ALIAS = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED = [
  'select', 'from', 'where', 'table', 'index', 'create', 'drop', 'alter', 'update', 'delete', 'insert'
]; // Add more as needed

export function validateAlias(alias: string): void {
  if (!VALID_ALIAS.test(alias)) {
    throw new Error(
      `Invalid alias "${alias}". ` +
      `Aliases must start with a letter or underscore, followed by letters, digits, or underscores.`
    );
  }
  
  if (RESERVED.includes(alias.toLowerCase())) {
    throw new Error(`Alias "${alias}" is a reserved SQL keyword.`);
  }
}

export function serializeDeps(deps: Dependency[]): string {
  return deps.map(d => 
    isQueryHandle(d) ? `handle:${d.tableId}:${d.updatedAt}` : `val:${String(d)}`
  ).join(',');
}

export function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return String(value);
  if (t !== 'object') return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
