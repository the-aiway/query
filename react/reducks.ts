/**
 * reducks — self-contained reactive SQL hooks for DuckDB-WASM.
 *
 * API:
 *   useTable(t => sql, params?)   → QueryRef   (lazy spec — materializes on first consume)
 *   useSql(t => sql, params?)     → QueryRef   (virtual fragment, inlined as subquery)
 *   ref.materialize()             → Promise<Row[]>
 *   ref.materialize({ row: true })→ Promise<Row | null>
 *
 * Params:
 *   QueryRef values  → FROM expressions (table path or inlined subquery)
 *   Scalars          → auto-escaped SQL literals (strings quoted, numbers raw, booleans TRUE/FALSE)
 *   t.raw.*          → raw interpolation (for file paths, identifiers, prebuilt SQL expressions)
 *
 * Hooks always return a QueryRef (never null). When scalar params are missing,
 * the ref has status 'pending'. Ref params that are pending propagate pending
 * status without null cascading. Actual COPY TO PARQUET runs only when
 * ref.materialize() is called. Works with React's use(): use(ref.materialize())
 *
 * Cache: content-addressed by resolved SQL string.
 */

import { useMemo } from 'react';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';
import { type SqlConditionValue, buildWhere, eq, neq, gt, gte, lt, lte, between, $in, like, ilike } from '../sqlConditions';
import { toValuesSelect } from '../toValues';
import type { ConnectionPool } from '../duck/ConnectionPool';

// ─── Core Types ──────────────────────────────────────────────

export interface QueryRef<TRow = unknown> {
  _name?: string;
  readonly _id: string;
  _status: 'pending' | 'idle' | 'writing' | 'ready' | 'error';
  readonly _type: 'table' | 'fragment';
  readonly _query: string;
  _error?: Error;
  readonly _dependencies: QueryRef[];
  /** @internal Phantom — never set at runtime. */
  readonly __row?: TRow;
  materialize(opts: { row: true; plain?: boolean }): Promise<NonNullable<TRow>>;
  materialize(opts?: { row?: false; plain?: boolean }): Promise<NonNullable<TRow>[]>;
}

export type ExtractRow<T> = T extends QueryRef<infer R> ? R : unknown;

// ─── Param Proxy Types ───────────────────────────────────────

type ScalarValue = string | number | boolean | null | undefined;

/** `t.*` = auto-escaped, `t.raw.*` = raw interpolation, `t.where(...)` = WHERE clause, `t.eq(col, val)` etc = inline conditions */
type ParamString<T> = string extends keyof T ? string : '';

type ParamProxy<T> = { [K in keyof T]: ParamString<T> } & {
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

type StripPrefix<T extends string> = T extends `${' ' | '\n' | '\t'}${infer Rest}`
  ? StripPrefix<Rest>
  : T extends `${'--sql' | '--SQL'}${infer Rest}`
    ? StripPrefix<Rest>
    : T;

type ForbiddenCTE<T extends string> = StripPrefix<T> extends `${'WITH' | 'with'}${infer _}`
  ? "ERROR: WITH (CTEs) are forbidden in useSql/useTable — use --sql prefix in a parent query instead"
  : T;

type ValidSQL<T extends string> = ForbiddenCTE<T> extends `ERROR${string}`
  ? ForbiddenCTE<T>
  : T extends `${' ' | '\n' | '\t'}${infer Rest}`
    ? ValidSQL<Rest>
    : T extends `${'SELECT' | 'FROM' | 'PIVOT' | '--sql'}${string}`
      ? T
      : "ERROR: SQL must start with SELECT, PIVOT or --sql";

// ─── Hook Interfaces ─────────────────────────────────────────

export interface UseTableHook {
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): QueryRef<InferSQLStrict<TQuery>[number]>;
  <TQuery extends string>(
    sql: ValidSQL<TQuery>,
  ): QueryRef<InferSQLStrict<TQuery>[number]>;
}

export interface UseSqlHook {
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): QueryRef<InferSQLStrict<TQuery>[number]>;
  <TQuery extends string>(
    sql: ValidSQL<TQuery>,
  ): QueryRef<InferSQLStrict<TQuery>[number]>;
}

type DuckDBType = 'VARCHAR' | 'INT' | 'INTEGER' | 'BIGINT' | 'FLOAT' | 'DOUBLE' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'DECIMAL' | 'HUGEINT' | (string & {});

export interface UseValuesHook {
  <TSchema extends Record<string, DuckDBType>>(
    data: { [K in keyof TSchema]?: unknown }[],
    schema: TSchema,
  ): QueryRef<{ [K in keyof TSchema]: unknown }>;
  <TKey extends string>(
    data: Record<string, unknown>[],
    columns: readonly TKey[],
  ): QueryRef<{ [K in TKey]: unknown }>;
}


// ─── Internals ───────────────────────────────────────────────

const _cache = new Map<string, QueryRef>();
const _materializing = new Map<string, Promise<void>>();

function isRef(v: unknown): v is QueryRef {
  return v != null && typeof v === 'object' && '_type' in v && '_id' in v;
}

function escapeSQL(v: unknown): string {
  if (v == null) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
  if (typeof v === 'object') {
    return JSON.stringify(v)
      .replace(/'/g, "''")
      .replace(/\\"/g, '__ESC_DQ__')
      .replace(/"/g, "'")
      .replace(/__ESC_DQ__/g, '"');
  }
  return String(v);
}

export function tablePath(ref: QueryRef): string {
  return ref._name ? `opfs://${ref._name}.${ref._id}.parquet` : `opfs://${ref._id}.parquet`;
}

function fromExpr(ref: QueryRef): string {
  return ref._type === 'fragment' ? `(${ref._query})` : `'${tablePath(ref)}'`;
}

function buildProxy<T extends Record<string, any>>(params: T): ParamProxy<T> {
  const escaped: Record<string, string> = {};
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (isRef(v)) {
      if (!v._name) v._name = k;
      const expr = fromExpr(v);
      escaped[k] = expr;
      raw[k] = expr;
    } else {
      escaped[k] = escapeSQL(v);
      raw[k] = String(v ?? '');
    }
  }
  return Object.assign(escaped, { raw, where: buildWhere, eq, neq, gt, gte, lt, lte, between, in: $in, like, ilike }) as ParamProxy<T>;
}

function depsResolved(params: Record<string, unknown>): boolean {
  return Object.values(params).every(v => {
    if (isRef(v)) return v._status !== 'pending';
    return v != null;
  });
}

let _seq = 0;
const uid = (prefix: string) => `${prefix}_${++_seq}_${Math.random().toString(36).slice(2, 6)}`;

const NEVER = new Promise<never>(() => {});
const _materializeCache = new Map<string, Promise<unknown>>();

function getPool(): ConnectionPool {
  return (window as unknown as { pool: ConnectionPool }).pool;
}

function createRef<TRow>(spec: {
  _id: string;
  _status: QueryRef['_status'];
  _type: QueryRef['_type'];
  _query: string;
  _dependencies: QueryRef[];
  _name?: string;
}): QueryRef<TRow> {
  const entry = spec as unknown as QueryRef<TRow>;
  entry.materialize = ((opts?: { row?: boolean; plain?: boolean }) => {
    if (entry._status === 'pending') return NEVER;

    const optKey = opts ? `${opts.row ? 'r' : ''}${opts.plain ? 'p' : ''}` : '';
    const cacheKey = `${entry._id}\0${optKey}`;

    const hit = _materializeCache.get(cacheKey);
    if (hit) return hit;

    const pool = getPool();
    const p = (async () => {
      await materializeChain(entry, pool);
      const name = entry._name || entry._id;
      const prefix = `--:re:${entry._type}:${name}\n`;
      const rows = await pool.query(`${prefix}FROM ${fromExpr(entry)}`) as unknown[];
      let result: unknown = rows;
      if (opts?.row) result = rows[0] ?? null;
      if (opts?.plain) result = JSON.parse(JSON.stringify(result));
      return result;
    })();

    _materializeCache.set(cacheKey, p);
    return p;
  }) as QueryRef<TRow>['materialize'];
  return entry;
}

// ─── Materialization ─────────────────────────────────────────

function getDependencyChain(ref: QueryRef): QueryRef[] {
  const visited = new Set<string>();
  const chain: QueryRef[] = [];
  const traverse = (node: QueryRef) => {
    if (visited.has(node._id)) return;
    visited.add(node._id);
    for (const dep of node._dependencies) traverse(dep);
    chain.push(node);
  };
  traverse(ref);
  return chain;
}

async function materializeRef(ref: QueryRef, pool: ConnectionPool): Promise<void> {
  if (ref._status === 'ready' || ref._type === 'fragment') return;
  if (ref._status === 'error') throw ref._error;

  const existing = _materializing.get(ref._id);
  if (existing) return existing;

  const promise = (async () => {
    ref._status = 'writing';
    const name = ref._name || ref._id;
    const path = tablePath(ref);
    try {
      await pool.db.registerOPFSFileName(path);
      await pool.queryIPCTable(`--:re:table:${name}\nCOPY (${ref._query}) TO '${path}' (FORMAT PARQUET)`);
      ref._status = 'ready';
    } catch (err) {
      ref._status = 'error';
      ref._error = err as Error;
      console.error(`[materialize:${name}]`, err);
      throw err;
    } finally {
      _materializing.delete(ref._id);
    }
  })();

  _materializing.set(ref._id, promise);
  return promise;
}

export async function materializeChain(ref: QueryRef, pool: any): Promise<void> {
  for (const node of getDependencyChain(ref)) {
    if (node._type === 'table' && node._status !== 'ready') {
      await materializeRef(node, pool);
    }
  }
}

export function needsMaterialization(ref: QueryRef): boolean {
  return getDependencyChain(ref).some(n => n._type === 'table' && n._status !== 'ready');
}

// ─── Hooks: Producers ────────────────────────────────────────

function useQueryRef(type: 'table' | 'fragment'): UseTableHook {
  return (queryFn: any, params: any = {}): any => {
    const ready = depsResolved(params);
    const sql = ready ? (typeof queryFn === 'function' ? queryFn(buildProxy(params)) : queryFn) : null;

    const pending = useMemo(() => createRef({
      _id: uid('p'),
      _status: 'pending',
      _type: type,
      _query: '',
      _dependencies: [],
    }), []);

    return useMemo(() => {
      if (!sql) return pending;
      const key = `${type}\0${sql}`;
      const hit = _cache.get(key);
      if (hit) return hit;
      const deps = Object.values(params).filter(isRef) as QueryRef[];
      const entry = createRef({
        _id: uid(type === 'table' ? 't' : 'f'),
        _status: type === 'table' ? 'idle' : 'ready',
        _type: type,
        _query: sql,
        _dependencies: deps,
      });
      _cache.set(key, entry);
      return entry;
    }, [sql, pending]);
  };
}

export const useTable: UseTableHook = useQueryRef('table');
export const useSql: UseSqlHook = useQueryRef('fragment');


export const useValues: UseValuesHook = (data: Record<string, unknown>[], schema: Record<string, string> | readonly string[]): any => {
  const sql = useMemo(() => toValuesSelect(data, schema), [JSON.stringify(data)]);

  return useMemo(() => {
    const key = `fragment\0${sql}`;
    const hit = _cache.get(key);
    if (hit) return hit;
    const entry = createRef({
      _id: uid('f'),
      _status: 'ready',
      _type: 'fragment',
      _query: sql,
      _dependencies: [],
    });
    _cache.set(key, entry);
    return entry;
  }, [sql]);
};

// ─── Type Tests ──────────────────────────────────────────────
export async  function _typeCheck() {
  // --- literal SQL (no interpolations — ValidSQL + InferSQLStrict work) ---

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

  // @ts-expect-error - SQL must start with SELECT, PIVOT or --sql
  useSql(() => `UPDATE t SET x = 1`);

  // @ts-expect-error - WITH is forbidden
  useSql(() => `WITH cte AS (SELECT 1) SELECT * FROM cte`);

  // @ts-expect-error - --sql prefix doesn't bypass CTE check
  useTable(() => `--sql\nWITH x AS (SELECT 1::int as v) SELECT * FROM x`);

  const typed = useTable(() => `SELECT count(*)::int as total, name FROM t`);
  typed && (typed satisfies QueryRef<{ total: number; name: unknown }>);

  null as unknown as ExtractRow<NonNullable<typeof typed>> satisfies { total: number; name: unknown };

  // --- useMaterialize (named source required) ---

  const rows1 = await typed.materialize();
  (rows1 satisfies { total: number; name: unknown }[]);

  const row1 = await f2.materialize({ row: true });
  (row1 satisfies { val: number });

  const fragRows = await f3.materialize();
  fragRows && (fragRows satisfies { total_cost: number; best: unknown }[]);

  const multi = await Promise.all([typed.materialize(), f2.materialize()]);
  multi satisfies [{ total: number; name: unknown }[],  { val: number }[]];

  const single = await typed.materialize();
  single satisfies { total: number; name: unknown }[];

  // --- shaped refs ---

  const shaped1 = await typed.materialize({ row: true });
  shaped1 satisfies { total: number; name: unknown };

  const shaped2 = await Promise.all([typed.materialize(), f2.materialize({ row: true })]);
  shaped2 satisfies [{ total: number; name: unknown }[], { val: number }];

  // --- inline materialize ---

  const inlineRow = await useSql(() => `SELECT 1::int as x`, {}).materialize({ row: true });
  inlineRow satisfies { x: number };

  const inlineRows = await useSql(() => `SELECT 'abc' as s`, {}).materialize();
  inlineRows satisfies { s: string }[];

  const inlinePlain = await useSql(() => `SELECT true::bool as b`, {}).materialize({ row: true, plain: true });
  inlinePlain && (inlinePlain satisfies { b: boolean });

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
