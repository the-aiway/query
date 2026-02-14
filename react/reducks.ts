/**
 * reducks — self-contained reactive SQL hooks for DuckDB-WASM.
 *
 * API:
 *   useTable(t => sql, params?)   → QueryRef | null   (materializes to OPFS parquet)
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
 * Cache: content-addressed by resolved SQL string. No slugs needed.
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { useDuckDB } from './DuckDBProvider';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';

// ─── Core Types ──────────────────────────────────────────────

export interface QueryRef<TRow = unknown> {
  _name?: string;
  readonly _id: string;
  readonly _status: 'pending' | 'writing' | 'ready' | 'error';
  readonly _type: 'table' | 'fragment';
  readonly _path: string;
  readonly _query: string;
  readonly _error?: Error;
  readonly _dependencies: QueryRef[];
  /** @internal Phantom — never set at runtime. */
  readonly __row?: TRow;
}

export type ExtractRow<T> = T extends QueryRef<infer R> ? R : unknown;

// ─── Param Proxy Types ───────────────────────────────────────

/** `t.*` = auto-escaped, `t.raw.*` = raw interpolation */
type ParamProxy<T> = { [K in keyof T]: string } & { raw: { [K in keyof T]: string } };

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

export interface UseTablesHook {
  <T extends Record<string, ((t: ParamProxy<TParams>) => ValidSQL<any>) | ValidSQL<any>>, TParams extends Record<string, any>>(
    queries: T,
    params?: TParams,
  ): {
    [K in keyof T]: T[K] extends (t: ParamProxy<TParams>) => ValidSQL<infer Q>
      ? QueryRef<InferSQLStrict<Q>[number]>
      : T[K] extends ValidSQL<infer Q>
        ? QueryRef<InferSQLStrict<Q>[number]>
        : QueryRef;
  };
}

interface MaterializeRowsHook {
  <TRef extends QueryRef | null>(source: TRef): ExtractRow<NonNullable<TRef>>[] | null;
  <T extends Record<string, QueryRef | null>>(source: T): ExtractRow<NonNullable<T[keyof T]>>[] | null;
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): InferSQLStrict<TQuery> | null;
}

interface MaterializeRowHook {
  <TRef extends QueryRef | null>(source: TRef): ExtractRow<NonNullable<TRef>> | null;
  <T extends Record<string, QueryRef | null>>(source: T): ExtractRow<NonNullable<T[keyof T]>> | null;
  <TParams extends Record<string, any>, TQuery extends string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams,
  ): InferSQLStrict<TQuery>[number] | null;
}

interface MaterializeConcurrentHook {
  <T extends Record<string, QueryRef | null>>(sources: T): {
    [K in keyof T]: ExtractRow<NonNullable<T[K]>>[];
  } | null;
}

// ─── Internals ───────────────────────────────────────────────

const _cache = new Map<string, QueryRef>();
export const _nameRegistry = new Map<string, string>();

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
      .replace(/'/g, "''") // SQL escape single quotes
      .replace(/\\"/g, '__ESC_DQ__') // Protect escaped double quotes
      .replace(/"/g, "'") // Structural double quotes -> single quotes
      .replace(/__ESC_DQ__/g, '"'); // Restore double quotes in content
  }
  return String(v);
}

function fromExpr(ref: QueryRef): string {
  return ref._type === 'fragment' ? `(${ref._query})` : `'${ref._path}'`;
}

function buildProxy<T extends Record<string, any>>(params: T): ParamProxy<T> {
  const escaped: Record<string, string> = {};
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (isRef(v)) {
      if (!v._name) {
        v._name = k;
        _nameRegistry.set(v._id, k);
      }
      const expr = fromExpr(v);
      escaped[k] = expr;
      raw[k] = expr;
    } else {
      escaped[k] = escapeSQL(v);
      raw[k] = String(v ?? '');
    }
  }
  return Object.assign(escaped, { raw }) as ParamProxy<T>;
}

function depsReady(params: Record<string, any>): boolean {
  return Object.values(params).every((v) => v != null && (!isRef(v) || v._status === 'ready'));
}

let _seq = 0;
const uid = (prefix: string) => `${prefix}_${++_seq}_${Math.random().toString(36).slice(2, 6)}`;

// ─── Hooks: Producers ────────────────────────────────────────

function usePoolQuery(sql: string | null): unknown[] | null {
  const { pool } = useDuckDB();
  const [data, setData] = useState<unknown[] | null>(null);
  const last = useRef<unknown[] | null>(null);

  useEffect(() => {
    if (!sql) return;
    let alive = true;
    pool.query(sql).then((res: any) => {
      if (alive) { setData(res); last.current = res; }
    }).catch((err: unknown) => {
      if (alive) console.error('[reducks] query error:', err);
    });
    return () => { alive = false; };
  }, [sql, pool]);

  return data ?? last.current;
}

export const useTable: UseTableHook = (queryFn: any, params: any = {}): any => {
  const { pool } = useDuckDB();
  const [ref, setRef] = useState<QueryRef | null>(null);
  const lastReady = useRef<QueryRef | null>(null);

  const ready = depsReady(params);
  const sql = ready ? (typeof queryFn === 'function' ? queryFn(buildProxy(params)) : queryFn) : null;

  useEffect(() => {
    if (!sql) return;
    const key = `table\0${sql}`;
    const hit = _cache.get(key);
    if (hit?._status === 'ready') {
      setRef(hit);
      lastReady.current = hit;
      return;
    }

    let alive = true;
    const id = hit?._id ?? uid('t');
    const path = hit?._path ?? `opfs://${id}.parquet`;

    (async () => {
      try {
        await pool.db.registerOPFSFileName(path);
        const name = hit?._name || _nameRegistry.get(id);
        const prefix = name ? `--:re:table:${name}\n` : `--:re:table:${id}\n`;
        await pool.queryIPCTable(`${prefix}COPY (${sql}) TO '${path}' (FORMAT PARQUET)`);
        const deps = Object.values(params).filter(isRef) as QueryRef[];
        const entry: QueryRef = {
          _id: id,
          _status: 'ready',
          _type: 'table',
          _path: path,
          _query: sql,
          _name: name,
          _dependencies: deps,
        };
        _cache.set(key, entry);
        if (alive) { setRef(entry); lastReady.current = entry; }
      } catch (err) {
        const deps = Object.values(params).filter(isRef) as QueryRef[];
        const entry: QueryRef = {
          _id: id,
          _status: 'error',
          _type: 'table',
          _path: path,
          _query: sql,
          _error: err as Error,
          _name: hit?._name,
          _dependencies: deps,
        };
        _cache.set(key, entry);
        if (alive) setRef(entry);
        console.error('[useTable] materialization error:', err);
      }
    })();

    return () => { alive = false; };
  }, [sql, pool]);

  return ref?._status === 'ready' ? ref : lastReady.current;
};

export const useSql: UseSqlHook = (queryFn: any, params: any = {}): any => {
  const ready = depsReady(params);
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
      _path: '',
      _query: sql,
      _dependencies: deps,
    };
    _cache.set(key, entry);
    return entry;
  }, [sql]);
};

export const useTables: UseTablesHook = (queries: Record<string, any>, params: any = {}): any => {
  const results: Record<string, QueryRef | null> = {};
  for (const [key, queryOrFn] of Object.entries(queries)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = useTable(queryOrFn, params);
    if (ref && !ref._name) {
      ref._name = key;
      _nameRegistry.set(ref._id, key);
    }
    results[key] = ref;
  }

  const allReady = Object.values(results).every(r => r?._status === 'ready');
  return allReady ? results : {};
};

// ─── Hooks: Consumers ────────────────────────────────────────

const _rows: MaterializeRowsHook = (arg1: any, arg2?: any): any => {
  const isFn = typeof arg1 === 'function';
  const isObj = !isFn && arg1 !== null && typeof arg1 === 'object' && !isRef(arg1);

  let source: QueryRef | null = null;

  if (isObj) {
    const [name, ref] = Object.entries(arg1 as Record<string, QueryRef | null>)[0]!;
    if (ref && !ref._name) {
      ref._name = name;
      _nameRegistry.set(ref._id, name);
    }
    source = ref;
  } else if (isFn) {
    // We must call useSql unconditionally to maintain hook order
    source = useSql(arg1, arg2 || {});
  } else {
    source = arg1;
  }

  const ok = source != null && source._status === 'ready';
  const name = source?._name || _nameRegistry.get(source?._id);
  const prefix = name ? `--:re:${source._type}:${name}\n` : source?._id ? `--:re:${source._type}:${source._id}\n` : '';
  return usePoolQuery(ok ? `${prefix}FROM ${fromExpr(source)}` : null);
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
  const [results, setResults] = useState<Record<string, unknown[]> | null>(null);
  const last = useRef<Record<string, unknown[]> | null>(null);

  const entries = Object.entries(sources) as [string, QueryRef | null][];
  const allOk = entries.every(([, s]) => s != null && s._status === 'ready');
  const stableKey = entries.map(([k, v]) => `${k}:${v?._id}`).join(',');

  useEffect(() => {
    if (!allOk) return;
    let alive = true;
    Promise.all(
      entries.map(async ([key, ref]) => {
        if (!ref) return [key, []] as const;
        const name = ref._name || _nameRegistry.get(ref._id);
        const prefix = name ? `--:re:${ref._type}:${name}\n` : `--:re:${ref._type}:${ref._id}\n`;
        try {
          return [key, await pool.query(`${prefix}FROM ${fromExpr(ref)}`)] as const;
        } catch (err) {
          if (alive) console.error(`[concurrent] error [${key}]:`, err);
          return [key, []] as const;
        }
      }),
    ).then((pairs) => {
      if (alive) {
        const obj = Object.fromEntries(pairs) as Record<string, unknown[]>;
        setResults(obj);
        last.current = obj;
      }
    });
    return () => { alive = false; };
  }, [allOk, stableKey, pool]);

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

export function getCoordinator(pool: any) {
  return {
    resolveEntryAsSql: (entry: QueryRef) => entry._query,
    getDependencyChain: (entry: QueryRef) => {
      const visited = new Set<string>();
      const chain: QueryRef[] = [];
      const traverse = (node: QueryRef) => {
        if (visited.has(node._id)) return;
        visited.add(node._id);
        for (const dep of node._dependencies || []) {
          traverse(dep);
        }
        chain.push(node);
      };
      traverse(entry);
      return chain;
    }
  };
}

// ─── Type Tests ──────────────────────────────────────────────

export function _typeCheck() {
  // --- useTable ---

  // Basic, no params
  const t1 = useTable((t) => `SELECT 1::int as id, name FROM t`);
  t1 && (t1 satisfies QueryRef<{ id: number; name: unknown }>);

  // Scalar params (auto-escaped)
  const t2 = useTable(
    (t) => `SELECT * FROM '/data/${t.raw.org}/orders.parquet' WHERE segment = ${t.segment}`,
    { org: '3' as string, segment: 'messagerie' as string },
  );
  t2 && (t2 satisfies QueryRef);

  // QueryRef dep
  const t3 = useTable((t) => `SELECT count(*)::int as n FROM ${t.t1}`, { t1 });
  t3 && (t3 satisfies { n: number });

  // @ts-expect-error
  const t4 = useTable((t) => `--sql\nWITH x AS (SELECT 1::int as v) SELECT * FROM x`);
  t4 && (t4 satisfies QueryRef);

  // Mixed QueryRef + scalar params
  const t5 = useTable(
    (t) => `SELECT * FROM ${t.t1} WHERE threshold > ${t.threshold} AND name = ${t.name}`,
    { t1, threshold: 0.9, name: 'test' as string },
  );
  t5 && (t5 satisfies QueryRef);

  // --- useSql ---

  // Fragment with QueryRef dep
  const f1 = useSql((t) => `SELECT count(*)::int as total FROM ${t.t1}`, { t1 });
  f1 && (f1 satisfies QueryRef<{ total: number }>);

  // --sql prefix
  const f_sql = useSql(() => `--sql\nSELECT 1`);
  f_sql && (f_sql satisfies QueryRef);

  // PIVOT
  const f_pivot = useSql(() => `PIVOT t ON col USING sum(val)`);
  f_pivot && (f_pivot satisfies QueryRef);

  // Invalid start
  // @ts-expect-error - SQL must start with SELECT, PIVOT or --sql
  useSql(() => `UPDATE t SET x = 1`);

  // @ts-expect-error - WITH is forbidden
  useSql(() => `WITH cte AS (SELECT 1) SELECT * FROM cte`);

  // No params
  const f2 = useSql((t) => `SELECT 42::int as val`);
  f2 && (f2 satisfies QueryRef<{ val: number }>);

  // Plain string (no interpolation)
  const f3 = useSql(() => `SELECT sum(cost)::int as total_cost, carrier as best FROM t`);
  f3 && (f3 satisfies QueryRef<{ total_cost: number; best: unknown }>);

  // Object shorthand dep
  const f4 = useSql((t) => `SELECT * FROM ${t.f1} WHERE val > ${t.min}`, { f1, min: 10 });
  f4 && (f4 satisfies QueryRef);

  // --- Phantom type chain ---

  const typed = useTable((t) => `SELECT count(*)::int as total, name FROM t`);
  typed && (typed satisfies QueryRef<{ total: number; name: unknown }>);

  const chain1 = useSql((t) => `SELECT total::int as cnt FROM ${t.typed}`, { typed });
  chain1 && (chain1 satisfies QueryRef<{ cnt: number }>);

  const chain2 = useSql((t) => `SELECT cnt * 2 as doubled FROM ${t.chain1}`, { chain1 });
  chain2 && (chain2 satisfies QueryRef);

  // ExtractRow utility
  null as unknown as ExtractRow<NonNullable<typeof typed>> satisfies { total: number; name: unknown };
  null as unknown as ExtractRow<NonNullable<typeof chain1>> satisfies { cnt: number };

  // --- useMaterialize ---

  // rows from table
  const rows1 = useMaterialize.rows(typed);
  rows1 && (rows1 satisfies { total: number; name: unknown }[]);

  // row from fragment
  const row1 = useMaterialize.row(f1);
  row1 && (row1 satisfies { total: number });

  // row from chain
  const chainRow = useMaterialize.row(chain1);
  chainRow && (chainRow satisfies { cnt: number });

  // rows from fragment
  const fragRows = useMaterialize.rows(f3);
  fragRows && (fragRows satisfies { total_cost: number; best: unknown }[]);

  // concurrent - mixed table + fragment
  const multi = useMaterialize.concurrent({ tbl: typed, frag: f1 });
  multi && (multi satisfies { tbl: { total: number; name: unknown }[]; frag: { total: number }[] });

  // concurrent - single entry
  const single = useMaterialize.concurrent({ only: typed });
  single && (single satisfies { only: { total: number; name: unknown }[] });

  // --- t.raw for file paths / prebuilt SQL ---

  const raw1 = useTable(
    (t) => `SELECT * FROM '/api/export/${t.raw.orgId}/transport.parquet'`,
    { orgId: '3' as string },
  );
  raw1 && (raw1 satisfies QueryRef);

  const raw2 = useTable(
    (t) => `SELECT carrier, ${t.raw.caseExpr} as cutoff FROM t`,
    { caseExpr: "CASE carrier WHEN 'X' THEN 300 ELSE 500 END" as string },
  );
  raw2 && (raw2 satisfies QueryRef);

  // Object/Array params (auto-escaped with $$)
  const objParam = useSql((t) => `SELECT ${t.obj} as data`, { obj: { a: 1, b: 'test' } });
  objParam && (objParam satisfies QueryRef);

  const arrParam = useSql((t) => `SELECT ${t.arr} as data`, { arr: [1, 'two', { x: true }] });
  arrParam && (arrParam satisfies QueryRef);

  // useMaterialize with inline queryFn
  const inlineRow = useMaterialize.row((t) => `SELECT 1::int as x`, {});
  inlineRow && (inlineRow satisfies { x: number });

  const inlineRows = useMaterialize.rows((t) => `SELECT 'abc' as s`, {});
  inlineRows && (inlineRows satisfies { s: string }[]);

  const inlinePlain = useMaterialize.plain.row((t) => `SELECT true::bool as b`, {});
  inlinePlain && (inlinePlain satisfies { b: boolean });

  // --- useTables ---

  const tables = useTables({
    t1: `SELECT 1::int as a`,
    t2: (t) => `SELECT ${t.val}::int as b`,
  }, { val: 42 });
  tables && (tables.t1 satisfies QueryRef<{ a: number }>);
  tables && (tables.t2 satisfies QueryRef<{ b: number }>);
}
