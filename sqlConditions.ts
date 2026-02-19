export type SqlValue = string | number | boolean | string[] | number[] | null | undefined;
export type SqlOperator =
  | '$in'
  | '$between'
  | '$gte'
  | '$lte'
  | '$gt'
  | '$lt'
  | '$eq'
  | '$neq'
  | '$like'
  | '$ilike';
export type SqlConditionValue = SqlValue | Partial<Record<SqlOperator, SqlValue>>;

const formatValue = (v: unknown): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'string') return `'${v.replaceAll("'", "''")}'`;
  return String(v as string);
};

export function sqlConditions(conditions: Record<string, SqlConditionValue>): string {
  const parts = Object.entries(conditions)
    .map(([column, condition]) => {
      if (condition === undefined || condition === null || condition === false || condition === '')
        return null;

      if (typeof condition !== 'object' || Array.isArray(condition)) {
        if (Array.isArray(condition)) {
          if (condition.length === 0) return null;
          return `${column} IN (${condition.map(formatValue).join(',')})`;
        }
        return condition === null ? `${column} IS NULL` : `${column} = ${formatValue(condition)}`;
      }

      const operatorParts = Object.entries(condition as Record<SqlOperator, SqlValue>)
        .map(([op, val]) => {
          if (val === undefined) return null;

          switch (op) {
            case '$in':
              if (Array.isArray(val)) {
                if (val.length === 0) return null;
                return `${column} IN (${val.map(formatValue).join(',')})`;
              }
              return val === null ? `${column} IS NULL` : `${column} = ${formatValue(val)}`;
            case '$between':
              if (Array.isArray(val) && val.length === 2 && val[0] !== undefined && val[1] !== undefined) {
                return `${column} BETWEEN ${formatValue(val[0])} AND ${formatValue(val[1])}`;
              }
              return null;
            case '$gte':
              return `${column} >= ${formatValue(val)}`;
            case '$lte':
              return `${column} <= ${formatValue(val)}`;
            case '$gt':
              return `${column} > ${formatValue(val)}`;
            case '$lt':
              return `${column} < ${formatValue(val)}`;
            case '$eq':
              return val === null ? `${column} IS NULL` : `${column} = ${formatValue(val)}`;
            case '$neq':
              return val === null ? `${column} IS NOT NULL` : `${column} <> ${formatValue(val)}`;
            case '$like':
              return `${column} LIKE ${formatValue(val)}`;
            case '$ilike':
              return `${column} ILIKE ${formatValue(val)}`;
            default:
              return null;
          }
        })
        .filter((p): p is string => p !== null);

      return operatorParts.length > 0 ? `(${operatorParts.join(' AND ')})` : null;
    })
    .filter((p): p is string => p !== null);

  return parts.length > 0 ? parts.join(' AND ') : ' TRUE ';
}

export function buildWhere(conditions: Record<string, SqlConditionValue>): string {
  const clause = sqlConditions(conditions);
  return clause === ' TRUE ' ? '' : `WHERE ${clause}`;
}

type ScalarValue = string | number | boolean | null | undefined;

export const eq = (col: string, val: ScalarValue): string => val == null ? `${col} IS NULL` : `${col} = ${formatValue(val)}`;
export const neq = (col: string, val: ScalarValue): string => val == null ? `${col} IS NOT NULL` : `${col} <> ${formatValue(val)}`;
export const gt = (col: string, val: ScalarValue): string => `${col} > ${formatValue(val)}`;
export const gte = (col: string, val: ScalarValue): string => `${col} >= ${formatValue(val)}`;
export const lt = (col: string, val: ScalarValue): string => `${col} < ${formatValue(val)}`;
export const lte = (col: string, val: ScalarValue): string => `${col} <= ${formatValue(val)}`;
export const between = (col: string, a: ScalarValue, b: ScalarValue): string => `${col} BETWEEN ${formatValue(a)} AND ${formatValue(b)}`;
export const $in = (col: string, vals: (string | number)[]): string => vals.length === 0 ? 'FALSE' : `${col} IN (${vals.map(formatValue).join(',')})`;
export const like = (col: string, val: string): string => `${col} LIKE ${formatValue(val)}`;
export const ilike = (col: string, val: string): string => `${col} ILIKE ${formatValue(val)}`;
