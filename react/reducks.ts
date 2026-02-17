/**
 * reducks — self-contained reactive SQL hooks for DuckDB-WASM.
 *
 * API:
 *   useTable(t => sql, params?)   → QueryRef | null   (lazy spec — materializes on first consume)
 *   useSql(t => sql, params?)     → QueryRef | null   (virtual fragment, inlined as subquery)
 *   useMaterialize.rows(ref)      → Row[] | null
 *   useMaterialize.row(ref)       → Row | null
 *   useMaterialize.concurrent({}) → { key: Row[] }[] | null
 *
 * Params:
 *   QueryRef values  → FROM expressions (table path or inlined subquery)
 *   Scalars          → auto-escaped SQL literals (strings quoted, numbers raw, booleans TRUE/FALSE)
 *   t.raw.*          → raw interpolation (for file paths, identifiers, prebuilt SQL expressions)
 *
 * Lazy materialization:
 *   useTable creates a spec without executing. Actual COPY TO PARQUET runs
 *   only when a consumer (useMaterialize) triggers materializeChain().
 *   Names are always resolved before materialization, so no a-posteriori lookup.
 *   Unused tables skip execution entirely.
 *
 * Cache: content-addressed by resolved SQL string.
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { useDuckDB } from './DuckDBProvider';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';
import { type SqlConditionValue, buildWhere, eq, neq, gt, gte, lt, lte, between, $in, like, ilike } from '../sqlConditions';
import type { ConnectionPool } from '../duck/ConnectionPool';

// ─── Core Types ──────────────────────────────────────────────

export interface QueryRef<TRow = unknown> {
  _name?: string;
  readonly _id: string;
  _status: 'idle' | 'writing' | 'ready' | 'error';
  readonly _type: 'table' | 'fragment';
  readonly _query: string;
  _error?: Error;
  readonly _dependencies: QueryRef[];
  /** @internal Phantom — never set at runtime. */
  readonly __row?: TRow;
}

export type ExtractRow<T> = T extends QueryRef<infer R> ? R : unknown;

// ─── Shaped Refs ─────────────────────────────────────────────

export type ShapedRef<TShape extends string = 'rows', TRow = unknown> = {
  readonly _ref: QueryRef<TRow>;
  readonly _shape: TShape;
  readonly _key?: string;
};

export type SourceEntry<TRow = unknown> = QueryRef<TRow> | ShapedRef<string, TRow> | null;

export function row<TRow>(ref: QueryRef<TRow> | null): ShapedRef<'row', TRow> | null {
  return ref ? { _ref: ref, _shape: 'row' } : null;
}

export function map<TRow>(ref: QueryRef<TRow> | null, key: string & keyof NonNullable<TRow>): ShapedRef<'map', TRow> | null {
  return ref ? { _ref: ref, _shape: 'map', _key: key } : null;
}

export function values<TRow, K extends string & keyof NonNullable<TRow>>(ref: QueryRef<TRow> | null, key: K): ShapedRef<'values', TRow> | null {
  return ref ? { _ref: ref, _shape: 'values', _key: key } : null;
}

function isShapedRef(v: unknown): v is ShapedRef {
  return v != null && typeof v === 'object' && '_ref' in v && '_shape' in v;
}

function unwrapRef(v: SourceEntry): QueryRef | null {
  if (v == null) return null;
  if (isShapedRef(v)) return v._ref;
  return v as QueryRef;
}

function getShape(v: SourceEntry): { shape: string; key?: string } {
  if (isShapedRef(v)) return { shape: v._shape, key: v._key };
  return { shape: 'rows' };
}

function applyShape(rows: unknown[], shape: string, key?: string): unknown {
  if (shape === 'row') return rows[0] ?? null;
  if (shape === 'map' && key) return new Map(rows.map(r => [(r as Record<string, unknown>)[key], r]));
  if (shape === 'values' && key) return rows.map(r => (r as Record<string, unknown>)[key]);
  return rows;
}

export type ResolveShape<TEntry> =
  TEntry extends null ? never :
  TEntry extends ShapedRef<'row', infer R> ? NonNullable<R> :
  TEntry extends ShapedRef<'map', infer R> ? Map<string, NonNullable<R>> :
  TEntry extends ShapedRef<'values', infer R> ? (R extends Record<string, infer V> ? V[] : unknown[]) :
  TEntry extends QueryRef<infer R> ? NonNullable<R>[] :
  unknown[];

// ─── Param Proxy Types ───────────────────────────────────────

type ScalarValue = string | number | boolean | null | undefined;

/** `t.*` = auto-escaped, `t.raw.*` = raw interpolation, `t.where(...)` = WHERE clause, `t.eq(col, val)` etc = inline conditions */
type ParamProxy<T> = { [K in keyof T]: string } & {
  raw: { [K in keyof T]: string };
  where: (conditions: Record<string, SqlConditionValue>) => string;
  eq: (col: string, val: ScalarValue) => string;
  neq: (col: string, val: ScalarValue) => string;
  gt: (col: string, val: ScalarValue) => string;
  gte: (col: string, val: ScalarValue) => string;
  lt: (col: string, val: ScalarValue) => string;
  lte: (col: string, val: ScalarValue) => string;
  between: (col: string, a: ScalarValue, b: ScalarValue) => string;
  in: (col: string, vals: (string | number)[]) => string;
  like: (col: string, val: string) => string;
  ilike: (col: string, val: string) => string;
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
    : T extends `${'SELECT' | 'select' | 'PIVOT' | 'pivot' | '--sql' | '--SQL'}${string}`
      ? T
      : "ERROR: SQL must start with SELECT, PIVOT or --sql";

// ─── Hook Interfaces ─────────────────────────────────────────

export interface UseTableHook {
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: ((t: ParamProxy<TParams>) => ValidSQL<TQuery>) | ValidSQL<TQuery>,
    params?: TParams,
  ): QueryRef<InferSQLStrict<TQuery>[number]> | null;
}

export interface UseSqlHook {
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): QueryRef<InferSQLStrict<TQuery>[number]> | null;
}

type DuckDBType = 'VARCHAR' | 'INT' | 'INTEGER' | 'BIGINT' | 'FLOAT' | 'DOUBLE' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'DECIMAL' | 'HUGEINT' | (string & {});

export interface UseValuesHook {
  <TSchema extends Record<string, DuckDBType>>(
    data: { [K in keyof TSchema]?: unknown }[],
    schema: TSchema,
  ): QueryRef<{ [K in keyof TSchema]: unknown }> | null;
  <TKey extends string>(
    data: Record<string, unknown>[],
    columns: readonly TKey[],
  ): QueryRef<{ [K in TKey]: unknown }> | null;
}


interface MaterializeRowsHook {
  <T extends Record<string, QueryRef | null>>(source: T): ExtractRow<NonNullable<T[keyof T]>>[] | null;
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): InferSQLStrict<TQuery> | null;
}

interface MaterializeRowHook {
  <T extends Record<string, QueryRef | null>>(source: T): ExtractRow<NonNullable<T[keyof T]>> | null;
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): InferSQLStrict<TQuery>[number] | null;
}

interface MaterializeConcurrentHook {
  <T extends Record<string, SourceEntry>>(sources: T): {
    [K in keyof T]: ResolveShape<T[K]>;
  } | null;
}

// ─── Internals ───────────────────────────────────────────────

const _cache = new Map<string, QueryRef>();
const _materializing = new Map<string, Promise<void>>();
const _inflightQueries = new Map<string, Promise<unknown[]>>();

function runSharedQuery(pool: ConnectionPool, sql: string): Promise<unknown[]> {
  const existing = _inflightQueries.get(sql);
  if (existing) return existing;
  const queryPromise = (pool.query(sql) as Promise<unknown[]>).finally(() => {
    if (_inflightQueries.get(sql) === queryPromise) {
      _inflightQueries.delete(sql);
    }
  });
  _inflightQueries.set(sql, queryPromise);
  return queryPromise;
}

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

function depsResolved(params: Record<string, any>): boolean {
  return Object.values(params).every(v => v != null);
}

let _seq = 0;
const uid = (prefix: string) => `${prefix}_${++_seq}_${Math.random().toString(36).slice(2, 6)}`;

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

function usePoolQuery(sql: string | null): unknown[] | null {
  const { pool } = useDuckDB();
  const [data, setData] = useState<unknown[] | null>(null);
  const last = useRef<unknown[] | null>(null);

  useEffect(() => {
    if (!sql) return;
    let alive = true;
    runSharedQuery(pool, sql).then((res) => {
      if (alive) { setData(res); last.current = res; }
    }).catch((err: unknown) => {
      if (alive) console.error('[reducks] query error:', err);
    });
    return () => { alive = false; };
  }, [sql, pool]);

  return data ?? last.current;
}

export const useTable: UseTableHook = (queryFn: any, params: any = {}): any => {
  const ready = depsResolved(params);
  const sql = ready ? (typeof queryFn === 'function' ? queryFn(buildProxy(params)) : queryFn) : null;

  return useMemo(() => {
    if (!sql) return null;
    const key = `table\0${sql}`;
    const hit = _cache.get(key);
    if (hit) return hit;

    const id = uid('t');
    const deps = Object.values(params).filter(isRef) as QueryRef[];
    const entry: QueryRef = {
      _id: id,
      _status: 'idle',
      _type: 'table',
      _query: sql,
      _dependencies: deps,
    };
    _cache.set(key, entry);
    return entry;
  }, [sql]);
};

export const useSql: UseSqlHook = (queryFn: any, params: any = {}): any => {
  const ready = depsResolved(params);
  const sql: string | null = ready ? queryFn(buildProxy(params)) : null;

  return useMemo(() => {
    if (!sql) return null;
    const key = `fragment\0${sql}`;
    const hit = _cache.get(key);
    if (hit) return hit;
    const deps = Object.values(params).filter(isRef) as QueryRef[];
    const entry: QueryRef = {
      _id: uid('f'),
      _status: 'ready',
      _type: 'fragment',
      _query: sql,
      _dependencies: deps,
    };
    _cache.set(key, entry);
    return entry;
  }, [sql]);
};


export const useValues: UseValuesHook = (data: Record<string, unknown>[], schema: Record<string, string> | readonly string[]): any => {
  const isArray = Array.isArray(schema);
  const cols = isArray ? schema as string[] : Object.keys(schema);
  const sql = useMemo(() => {
    if (data.length === 0) {
      if (isArray) return `SELECT ${cols.map(c => `NULL AS ${c}`).join(', ')} WHERE FALSE`;
      const selects = cols.map(c => `NULL::${(schema as Record<string, string>)[c]} AS ${c}`).join(', ');
      return `SELECT ${selects} WHERE FALSE`;
    }
    const rows = data.map(r => `(${cols.map(c => escapeSQL(r[c])).join(',')})`);
    if (isArray) return `SELECT * FROM (VALUES ${rows.join(',')}) AS _v(${cols.join(',')})`;
    const casts = cols.map(c => `${c}::${(schema as Record<string, string>)[c]} AS ${c}`).join(', ');
    return `SELECT ${casts} FROM (VALUES ${rows.join(',')}) AS _v(${cols.join(',')})`;
  }, [JSON.stringify(data)]);

  return useMemo(() => {
    const key = `fragment\0${sql}`;
    const hit = _cache.get(key);
    if (hit) return hit;
    const entry: QueryRef = {
      _id: uid('f'),
      _status: 'ready',
      _type: 'fragment',
      _query: sql,
      _dependencies: [],
    };
    _cache.set(key, entry);
    return entry;
  }, [sql]);
};

// ─── Hooks: Consumers ────────────────────────────────────────

function normalizeSource(arg: Record<string, QueryRef | null>): { ref: QueryRef | null; name: string } {
  const [entry] = Object.entries(arg);
  return entry ? { ref: entry[1], name: entry[0] } : { ref: null, name: '' };
}

const _rows: MaterializeRowsHook = (arg1: any, arg2?: any): any => {
  const { pool } = useDuckDB();
  const isFn = typeof arg1 === 'function';

  let source: QueryRef | null = null;

  if (isFn) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    source = useSql(arg1, arg2 || {});
  } else {
    const { ref, name } = normalizeSource(arg1);
    source = ref;
    if (source && name) source._name = name;
  }

  const [, kick] = useState(0);
  const sourceId = source?._id;
  const pending = source != null && needsMaterialization(source);

  useEffect(() => {
    if (!source || !pending) return;
    let alive = true;
    materializeChain(source, pool)
      .then(() => { if (alive) kick(v => v + 1); })
      .catch(() => { if (alive) kick(v => v + 1); });
    return () => { alive = false; };
  }, [sourceId, pending, pool]);

  const ok = source != null && !needsMaterialization(source);
  const name = source?._name || source?._id;
  const prefix = ok && source && name ? `--:re:${source._type}:${name}\n` : '';
  return usePoolQuery(ok ? `${prefix}FROM ${fromExpr(source!)}` : null);
};

const _rowsPlain: MaterializeRowsHook = (arg1: any, arg2?: any): any => {
  const rows = _rows(arg1, arg2);
  return useMemo(() => (rows ? JSON.parse(JSON.stringify(rows)) : null), [rows]);
};

const _row: MaterializeRowHook = (arg1: any, arg2?: any): any => {
  const rows = _rows(arg1, arg2);
  return rows && rows.length > 0 ? rows[0] : null;
};

const _rowPlain: MaterializeRowHook = (arg1: any, arg2?: any): any => {
  const row = _row(arg1, arg2);
  return useMemo(() => (row ? JSON.parse(JSON.stringify(row)) : null), [row]);
};

const _concurrent: MaterializeConcurrentHook = (sources: any): any => {
  const { pool } = useDuckDB();
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const last = useRef<Record<string, unknown> | null>(null);

  const rawEntries = Object.entries(sources) as [string, SourceEntry][];
  const resolved = rawEntries.map(([k, v]) => {
    const ref = unwrapRef(v);
    if (ref && !ref._name) ref._name = k;
    return [k, ref, getShape(v)] as const;
  });

  const allPresent = resolved.every(([, ref]) => ref != null);
  const stableKey = resolved.map(([k, ref]) => `${k}:${ref?._id}`).join(',');

  useEffect(() => {
    if (!allPresent) return;
    let alive = true;

    (async () => {
      const chains = resolved.filter(([, ref]) => ref && needsMaterialization(ref));
      if (chains.length > 0) {
        await Promise.all(chains.map(([, ref]) =>
          materializeChain(ref!, pool).catch(err => console.error('[concurrent] materialize:', err))
        ));
      }

      const pairs = await Promise.all(
        resolved.map(async ([key, ref, { shape, key: shapeKey }]) => {
          if (!ref) return [key, shape === 'row' ? null : []] as const;
          const name = ref._name || ref._id;
          const prefix = `--:re:${ref._type}:${name}\n`;
          try {
            const rows = await runSharedQuery(pool, `${prefix}FROM ${fromExpr(ref)}`);
            return [key, applyShape(rows as unknown[], shape, shapeKey)] as const;
          } catch (err) {
            if (alive) console.error(`[concurrent] error [${key}]:`, err);
            return [key, shape === 'row' ? null : []] as const;
          }
        }),
      );

      if (alive) {
        const obj = Object.fromEntries(pairs) as Record<string, unknown>;
        setResults(obj);
        last.current = obj;
      }
    })();

    return () => { alive = false; };
  }, [allPresent, stableKey, pool]);

  return results ?? last.current;
};

const _concurrentPlain: MaterializeConcurrentHook = (sources: any): any => {
  const results = _concurrent(sources);
  return useMemo(() => (results ? JSON.parse(JSON.stringify(results)) : null), [results]);
};

export const useMaterialize = {
  rows: _rows,
  row: _row,
  concurrent: _concurrent,
  plain: {
    rows: _rowsPlain,
    row: _rowPlain,
    concurrent: _concurrentPlain,
  },
};

// ─── Type Tests ──────────────────────────────────────────────

export function _typeCheck() {
  // --- literal SQL (no interpolations — ValidSQL + InferSQLStrict work) ---

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

  const rows1 = useMaterialize.rows({ typed });
  rows1 && (rows1 satisfies { total: number; name: unknown }[]);

  const row1 = useMaterialize.row({ f2 });
  row1 && (row1 satisfies { val: number });

  const fragRows = useMaterialize.rows({ f3 });
  fragRows && (fragRows satisfies { total_cost: number; best: unknown }[]);

  const multi = useMaterialize.concurrent({ tbl: typed, frag: f2 });
  multi && (multi satisfies { tbl: { total: number; name: unknown }[]; frag: { val: number }[] });

  const single = useMaterialize.concurrent({ only: typed });
  single && (single satisfies { only: { total: number; name: unknown }[] });

  // --- shaped refs ---

  const shaped1 = useMaterialize.concurrent({ stats: row(typed) });
  shaped1 && (shaped1 satisfies { stats: { total: number; name: unknown } });

  const shaped2 = useMaterialize.concurrent({ rows: typed, agg: row(f2) });
  shaped2 && (shaped2 satisfies { rows: { total: number; name: unknown }[]; agg: { val: number } });

  // --- inline materialize ---

  const inlineRow = useMaterialize.row(() => `SELECT 1::int as x`, {});
  inlineRow && (inlineRow satisfies { x: number });

  const inlineRows = useMaterialize.rows(() => `SELECT 'abc' as s`, {});
  inlineRows && (inlineRows satisfies { s: string }[]);

  const inlinePlain = useMaterialize.plain.row(() => `SELECT true::bool as b`, {});
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
