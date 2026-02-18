/**
 * reducks — self-contained reactive SQL hooks for DuckDB-WASM.
 *
 * API:
 *   useTable(t => sql, params?)   → QueryRef   (lazy spec — materializes on first consume)
 *   useSql(t => sql, params?)     → QueryRef   (virtual fragment, inlined as subquery)
 *   ref.toArray()                  → Promise<Row[]>
 *   ref.toArrow()                  → Promise<Arrow Table>
 *   ref.next()                     → Promise<Row | null>
 *
 * Params:
 *   QueryRef values  → FROM expressions (table path or inlined subquery)
 *   Scalars          → auto-escaped SQL literals (strings quoted, numbers raw, booleans TRUE/FALSE)
 *   t.raw.*          → raw interpolation (for file paths, identifiers, prebuilt SQL expressions)
 *
 * Hooks always return a QueryRef (never null). When scalar params are missing,
 * the ref has status 'pending'. Ref params that are pending propagate pending
 * status without null cascading. Actual COPY TO PARQUET runs only when
 * consumed via toArray/toArrow/next. Works with React's use(): use(ref.toArray())
 *
 * Cache: content-addressed by resolved SQL string.
 */

import { useMemo } from 'react';
import type { Table } from 'apache-arrow';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';
import { type SqlConditionValue, buildWhere, eq, neq, gt, gte, lt, lte, between, $in, like, ilike } from '../sqlConditions';
import { toValuesSelect } from '../toValues';
import type { ConnectionPool, InferredArrowTable } from '../duck/ConnectionPool';

// ─── Core Types ──────────────────────────────────────────────

export interface QueryRef<TRow = unknown> {
  _name?: string;
  readonly _id: string;
  _status: 'pending' | 'idle' | 'writing' | 'ready' | 'error';
  readonly _type: 'table' | 'fragment' | 'arrow' | 'lazy';
  readonly _query: string;
  _error?: Error;
  readonly _dependencies: QueryRef[];
  /** @internal Stashed Arrow Table for lazy registration. */
  _arrowTable?: Table;
  /** @internal Background COPY promise for lazy refs. */
  _lazyCopy?: Promise<void>;
  /** @internal Whether the first lazy query has already been issued. */
  _lazyFirstConsumed?: boolean;
  /** @internal Phantom — never set at runtime. */
  readonly __row?: TRow;
  toArray(): Promise<NonNullable<TRow>[]>;
  toArrow(): Promise<Table>;
  next(): Promise<NonNullable<TRow> | null>;
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

type ValidSQL<T extends string> =
  string extends T
    ? T
    : T extends `${'WITH' | 'with'}${string}`
      ? "ERROR: WITH clauses are forbidden — split into separate useSql refs"
      : T extends `${'SELECT' | 'FROM' | 'PIVOT' | '--sql' | '--SQL'}${string}`
        ? T
        : "ERROR: SQL must start with SELECT, FROM, PIVOT or --sql";

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

const _sqlRefCache = new Map<string, QueryRef>();

export function createSqlRef<TParams extends Record<string, unknown>>(
  queryFn: (t: { [K in keyof TParams]: string }) => string,
  params: TParams
): QueryRef {
  const proxy = {} as { [K in keyof TParams]: string };
  const deps: QueryRef[] = [];
  
  for (const [k, v] of Object.entries(params)) {
    if (isRef(v)) {
      if (!v._name) v._name = k;
      (proxy as Record<string, string>)[k] = fromExpr(v);
      deps.push(v);
    } else {
      (proxy as Record<string, string>)[k] = escapeSQL(v);
    }
  }
  
  const sql = queryFn(proxy);
  
  const cached = _sqlRefCache.get(sql);
  if (cached) return cached;
  
  const id = uid('d');
  const ref = createRef({
    _id: id,
    _status: deps.every(d => d._status !== 'pending') ? 'ready' : 'pending',
    _type: 'fragment',
    _query: sql,
    _dependencies: deps,
  });
  
  _sqlRefCache.set(sql, ref);
  return ref;
}

function fromExpr(ref: QueryRef): string {
  if (ref._type === 'fragment') return `(${ref._query})`;
  if (ref._type === 'arrow' || ref._type === 'lazy') return `"${ref._id}"`;
  return `'${tablePath(ref)}'`;
}

export function refToSql(ref: QueryRef): string {
  if (ref._type === 'fragment') return ref._query;
  return `SELECT * FROM ${fromExpr(ref)}`;
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
  _arrowTable?: Table;
}): QueryRef<TRow> {
  const entry = spec as unknown as QueryRef<TRow>;
  console.log('CREATE REF', entry._name);
  function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (entry._status === 'pending') return NEVER as Promise<T>;
    const cacheKey = `${entry._id}\0${key}`;
    const hit = _materializeCache.get(cacheKey);
    if (hit) return hit as Promise<T>;
    const p = fn();
    _materializeCache.set(cacheKey, p);
    return p;
  }

  async function execute() {
    const pool = getPool();
    await materializeChain(entry, pool);
    const name = entry._name || entry._id;
    const prefix = `--:re:${entry._type}:${name}\n`;
    return pool.queryIPCTable(`${prefix}FROM ${fromExpr(entry)}`);
  }

  entry.toArray = () => cached('a', async () => (await execute()).toMaterialized() as NonNullable<TRow>[]);
  entry.toArrow = () => cached('w', async () => (await execute()) as unknown as Table);
  entry.next = () => cached('n', async () => ((await execute()).toMaterialized()[0] ?? null) as NonNullable<TRow> | null);

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
    try {
      if (ref._type === 'arrow') {
        if (!ref._arrowTable) throw new Error(`[materialize:${name}] Arrow table missing on ref`);
        const conn = await pool.acquire();
        try {
          await conn.insertArrowTable(ref._arrowTable, { name: ref._id, create: true });
        } finally {
          pool.release(conn);
        }
        ref._arrowTable = undefined;
      } else if (ref._type === 'lazy') {
        await pool.queryIPCTable(`--:re:lazy:${name}\nCREATE OR REPLACE VIEW "${ref._id}" AS ${ref._query}`);
        ref._status = 'ready';
        _materializing.delete(ref._id);
        const path = tablePath(ref);
        ref._lazyCopy = new Promise<void>((resolve, reject) => {
          new Promise(r => setTimeout(r, 1000)).then(() =>
            pool.db.registerOPFSFileName(path)
          ).then(() =>
            pool.queryIPCTable(`--:re:lazy-copy:${name}\nCOPY (${ref._query}) TO '${path}' (FORMAT PARQUET)`)
          ).then(() =>
            pool.queryIPCTable(`--:re:lazy-swap:${name}\nCREATE OR REPLACE VIEW "${ref._id}" AS FROM '${path}'`)
          ).then(() => resolve()).catch(err => {
            console.warn(`[lazy-materialize:${name}]`, err);
            resolve();
          });
        });
        return;
      } else {
        const path = tablePath(ref);
        await pool.db.registerOPFSFileName(path);
        await pool.queryIPCTable(`--:re:table:${name}\nCOPY (${ref._query}) TO '${path}' (FORMAT PARQUET)`);
      }
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
    if (node._type === 'lazy' && node._status === 'ready' && node._lazyCopy && node._lazyFirstConsumed) {
      await node._lazyCopy;
      continue;
    }
    if (node._type === 'lazy' && node._status === 'ready') {
      node._lazyFirstConsumed = true;
      continue;
    }
    if (node._type !== 'fragment' && node._status !== 'ready') {
      await materializeRef(node, pool);
    }
  }
}

export function needsMaterialization(ref: QueryRef): boolean {
  return getDependencyChain(ref).some(n => n._type !== 'fragment' && n._status !== 'ready');
}

// ─── Plain API (no React) ────────────────────────────────────

type RefType = 'table' | 'fragment' | 'lazy';
const REF_STATUS: Record<RefType, QueryRef['_status']> = { table: 'idle', fragment: 'ready', lazy: 'idle' };
const REF_PREFIX: Record<RefType, string> = { table: 't', fragment: 'f', lazy: 'l' };

function makeRef(type: RefType, queryFn: any, params: any = {}): QueryRef {
  if (!depsResolved(params)) {
    throw new Error('[reducks] Cannot create ref: scalar dependencies are null/undefined');
  }
  const sql = typeof queryFn === 'function' ? queryFn(buildProxy(params)) : queryFn;
  const key = `${type}\0${sql}`;
  const hit = _cache.get(key);
  if (hit) return hit;
  const deps = Object.values(params).filter(isRef) as QueryRef[];
  const entry = createRef({
    _id: uid(REF_PREFIX[type]),
    _status: REF_STATUS[type],
    _type: type,
    _query: sql,
    _dependencies: deps,
  });
  _cache.set(key, entry);
  return entry;
}

export const sql: UseSqlHook = ((queryFn: any, params?: any) => makeRef('fragment', queryFn, params ?? {})) as UseSqlHook;
export const table: UseTableHook = ((queryFn: any, params?: any) => makeRef('table', queryFn, params ?? {})) as UseTableHook;
export const lazyTable: UseTableHook = ((queryFn: any, params?: any) => makeRef('lazy', queryFn, params ?? {})) as UseTableHook;

// ─── Hooks: Producers ────────────────────────────────────────

function useQueryRef(type: RefType): UseTableHook {
  return (queryFn: any, params: any = {}): any => {
    const ready = depsResolved(params);
    const resolved = ready ? makeRef(type, queryFn, params) : null;
    const pending = useMemo(() => createRef({
      _id: uid('p'),
      _status: 'pending',
      _type: type,
      _query: '',
      _dependencies: [],
    }), []);

    return useMemo(() => resolved ?? pending, [resolved, pending]);
  };
}

export const useTable: UseTableHook = useQueryRef('table');
export const useSql: UseSqlHook = useQueryRef('fragment');
export const useLazyTable: UseTableHook = useQueryRef('lazy');


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

export function arrow(arrowTable: Table): QueryRef {
  const id = uid('a');
  return createRef({
    _id: id,
    _status: 'idle',
    _type: 'arrow',
    _query: `SELECT * FROM "${id}"`,
    _dependencies: [],
    _arrowTable: arrowTable,
  });
}

export function useArrow(arrowTable: Table | null): QueryRef {
  const pending = useMemo(() => createRef({
    _id: uid('p'),
    _status: 'pending',
    _type: 'arrow',
    _query: '',
    _dependencies: [],
  }), []);

  return useMemo(
    () => arrowTable ? arrow(arrowTable) : pending,
    [arrowTable, pending],
  );
}

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

  const row1 = await f2.next();
  row1 && (row1 satisfies { val: number });

  const fragRows = await f3.toArray();
  fragRows && (fragRows satisfies { total_cost: number; best: unknown }[]);

  const multi = await Promise.all([typed.toArray(), f2.toArray()]);
  multi satisfies [{ total: number; name: unknown }[], { val: number }[]];

  const single = await typed.toArray();
  single satisfies { total: number; name: unknown }[];

  const shaped1 = await typed.next();
  shaped1 && (shaped1 satisfies { total: number; name: unknown });

  const shaped2 = await Promise.all([typed.toArray(), f2.next()]);
  shaped2 satisfies [{ total: number; name: unknown }[], { val: number } | null];

  const inlineRow = await useSql(() => `SELECT 1::int as x`, {}).next();
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
