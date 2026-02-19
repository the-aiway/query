import type { Table } from 'apache-arrow';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';
import type { SqlConditionValue } from '../sqlConditions';
import { useSql, useTable, useValues } from './reducks';

export type QueryStatus = 'pending' | 'idle' | 'writing' | 'ready' | 'error';
export type QueryType = 'table' | 'fragment' | 'arrow' | 'lazy';

export interface QueryRef<TRow = unknown> {
  readonly id: string;
  readonly status: QueryStatus;
  readonly type: QueryType;
  readonly query: string;
  readonly name?: string;
  readonly error?: Error;
  readonly dependencies: readonly QueryRef[];
  ensureName(name: string): void;
  toSql(options?: { cte?: boolean }): Promise<string>;
  readonly __row?: TRow;
  toArray(): Promise<NonNullable<TRow>[]>;
  toArrow(): Promise<Table>;
  row(): Promise<NonNullable<TRow> | null>;
}

export type ExtractRow<T> = T extends QueryRef<infer R> ? R : unknown;
export type ScalarValue = string | number | boolean | null | undefined;

export type ParamString<T> = string extends keyof T ? string : '';
export type ParamProxy<T> = { [K in keyof T]: ParamString<T> } & {
  raw: { [K in keyof T]: ParamString<T> };
  where: (conditions: Record<string, SqlConditionValue>) => ParamString<T>;
  eq: (col: string, val: ScalarValue) => ParamString<T>;
  neq: (col: string, val: ScalarValue) => ParamString<T>;
  gt: (col: string, val: ScalarValue) => ParamString<T>;
  gte: (col: string, val: ScalarValue) => ParamString<T>;
  lt: (col: string, val: ScalarValue) => ParamString<T>;
  lte: (col: string, val: ScalarValue) => ParamString<T>;
  between: (col: string, a: ScalarValue, b: ScalarValue) => ParamString<T>;
  in: (col: string, vals: (string | number)[]) => ParamString<T>;
  like: (col: string, val: string) => ParamString<T>;
  ilike: (col: string, val: string) => ParamString<T>;
};

type WhitespaceChar = ' ' | '\n' | '\t' | '\r';
type TrimLeft<T extends string> = T extends `${WhitespaceChar}${infer R}` ? TrimLeft<R> : T;

export type ValidSQL<T extends string> =
  string extends T
    ? T
    : TrimLeft<T> extends `${'WITH' | 'with'}${string}`
      ? "ERROR: WITH clauses are forbidden — split into separate useSql refs"
      : TrimLeft<T> extends `${'SELECT' | 'FROM' | 'PIVOT' | '--sql' | '--SQL'}${string}`
        ? T
        : "ERROR: SQL must start with SELECT, FROM, PIVOT or --sql";

type InferRow<TQuery extends string> = InferSQLStrict<TQuery>[number];
type OverrideRow<TQuery extends string, TOverride> = [TOverride] extends [never] ? InferRow<TQuery> : TOverride;

export interface UseTableHook {
  <TOverride = never, TParams extends Record<string, unknown> = Record<string, unknown>, TQuery extends string = string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): QueryRef<OverrideRow<TQuery, TOverride>>;
  <TOverride = never, TQuery extends string = string>(
    sql: ValidSQL<TQuery>,
  ): QueryRef<OverrideRow<TQuery, TOverride>>;
}

export interface UseSqlHook {
  <TOverride = never, TParams extends Record<string, unknown> = Record<string, unknown>, TQuery extends string = string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): QueryRef<OverrideRow<TQuery, TOverride>>;
  <TOverride = never, TQuery extends string = string>(
    sql: ValidSQL<TQuery>,
  ): QueryRef<OverrideRow<TQuery, TOverride>>;
}

export type DuckDBType = 'VARCHAR' | 'INT' | 'INTEGER' | 'BIGINT' | 'FLOAT' | 'DOUBLE' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'DECIMAL' | 'HUGEINT' | (string & {});

export interface UseValuesHook {
  <TData extends Record<string, unknown>>(
    data: TData[],
  ): QueryRef<{ [K in keyof TData]: unknown }>;
  <TSchema extends Record<string, DuckDBType>>(
    data: { [K in keyof TSchema]?: unknown }[],
    schema: TSchema,
  ): QueryRef<{ [K in keyof TSchema]: unknown }>;
  <TKey extends string>(
    data: Record<string, unknown>[],
    columns: readonly TKey[],
  ): QueryRef<{ [K in TKey]: unknown }>;
}

export type RefType = 'table' | 'fragment' | 'lazy';



// ─── Type Tests ──────────────────────────────────────────────
export async  function _typeCheck() {
  const f1_plain = useSql(`SELECT * FROM '/api/export/*/reference_carriers.parquet'`);
  f1_plain && (f1_plain satisfies QueryRef);

  const f2 = useSql(() => `SELECT 42::int as val`);
  f2 && (f2 satisfies QueryRef<{ val: number }>);

  const f3 = useSql(() => `SELECT sum(cost)::int as total_cost, carrier as best FROM t`);
  f3 && (f3 satisfies QueryRef<{ total_cost: number; best: unknown }>);

  const f_sql = useSql(() => `--sql\nSELECT 1`);
  f_sql && (f_sql satisfies QueryRef);

  const f_pivot = useSql(() => `PIVOT t ON col USING sum(val)`);
  f_pivot && (f_pivot satisfies QueryRef);

  // @ts-expect-error - SQL must start with SELECT, FROM, PIVOT or --sql
  useSql(() => `UPDATE t SET x = 1`);

  const typed = useTable(() => `SELECT count(*)::int as total, name FROM t`);
  typed && (typed satisfies QueryRef<{ total: number; name: unknown }>);

  null as unknown as ExtractRow<NonNullable<typeof typed>> satisfies { total: number; name: unknown };

  // --- toArray / next / toArrow ---

  const rows1 = await typed.toArray();
  (rows1 satisfies { total: number; name: unknown }[]);

  const row1 = await f2.row();
  row1 && (row1 satisfies { val: number });

  const fragRows = await f3.toArray();
  fragRows && (fragRows satisfies { total_cost: number; best: unknown }[]);

  const multi = await Promise.all([typed.toArray(), f2.toArray()]);
  multi satisfies [{ total: number; name: unknown }[], { val: number }[]];

  const single = await typed.toArray();
  single satisfies { total: number; name: unknown }[];

  const shaped1 = await typed.row();
  shaped1 && (shaped1 satisfies { total: number; name: unknown });

  const shaped2 = await Promise.all([typed.toArray(), f2.row()]);
  shaped2 satisfies [{ total: number; name: unknown }[], { val: number } | null];

  const inlineRow = await useSql(() => `SELECT 1::int as x`, {}).row();
  inlineRow && (inlineRow satisfies { x: number });

  const inlineRows = await useSql(() => `SELECT 'abc' as s`, {}).toArray();
  inlineRows satisfies { s: string }[];

  const arrowTable = await typed.toArrow();
  arrowTable satisfies Table;

  // --- useValues ---

  const cutoffsTyped = useValues([
    { carrier: 'heppner', cutoff: 250 },
    { carrier: 'geodist', cutoff: 300 },
  ], { carrier: 'VARCHAR', cutoff: 'INT' });
  cutoffsTyped && (cutoffsTyped satisfies QueryRef<{ carrier: unknown; cutoff: unknown }>);

  const cutoffsSimple = useValues([
    { carrier: 'heppner', cutoff: 250 },
    { carrier: 'geodist', cutoff: 300 },
  ], ['carrier', 'cutoff']);
  cutoffsSimple && (cutoffsSimple satisfies QueryRef<{ carrier: unknown; cutoff: unknown }>);

  const emptyTyped = useValues([], { id: 'INT', name: 'VARCHAR' });
  emptyTyped && (emptyTyped satisfies QueryRef<{ id: unknown; name: unknown }>);

  const emptySimple = useValues([], ['id', 'name'] as const);
  emptySimple && (emptySimple satisfies QueryRef<{ id: unknown; name: unknown }>);

}
