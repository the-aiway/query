import type { Table } from 'apache-arrow';
import { type InferDuckTable, type InferSQLStrict, type Materialize } from '../duck/inferSqlReturntype';
import { $in, between, buildWhere, eq, gt, gte, ilike, like, lt, lte, neq, type SqlConditionValue } from '../sqlConditions';
import { escapeSQL, fnv1a32 } from '../sqlUtils';
import { toValues, toValuesSelect } from '../toValues';

// ─── Types ───────────────────────────────────────────────────

export type QueryStatus = 'pending' | 'idle' | 'writing' | 'ready' | 'error';
export type QueryType = 'fragment' | 'table' | 'opfs' | 'arrow';
export type DuckDBType = 'VARCHAR' | 'INT' | 'INTEGER' | 'BIGINT' | 'FLOAT' | 'DOUBLE' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'DECIMAL' | 'HUGEINT' | (string & {});

export type ScalarValue = string | number | boolean | null | undefined;
export type ParamString<T> = string extends keyof T ? string : '';
export type ParamProxy<T> = { [K in keyof T]: ParamString<T> } & {
  raw: T;
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

export type ValidSQL<T extends string> = string extends T
  ? T
  : TrimLeft<T> extends `${'SELECT' | 'FROM' | 'PIVOT' | '--sql' | '--SQL' | 'WITH' | 'with'}${string}`
    ? T
    : 'ERROR: SQL must start with SELECT, FROM, PIVOT, WITH or --sql';

type InferRow<TQuery extends string> = InferSQLStrict<TQuery>[number];

type FillUnknown<T, Fill> = Materialize<{ [K in keyof T]: unknown extends T[K] ? Fill : T[K] }>;

export type ApplyFill<TRow, TFill> = [TFill] extends [never] ? TRow : TFill extends Record<string, unknown> ? TFill : FillUnknown<TRow, TFill>;

type OverrideRow<TQuery extends string, TOverride> = [TOverride] extends [never]
  ? InferRow<TQuery>
  : TOverride extends Record<string, unknown>
    ? TOverride
    : TOverride extends unknown[]
      ? TOverride[number]
      : FillUnknown<InferRow<TQuery>, TOverride>;

export type ExtractRow<T> = T extends Duckable<infer R> ? R : unknown;
/** @deprecated Use Duckable directly */
export type QueryRef<TRow = unknown> = Duckable<TRow>;

export type ThenableRef<TRow = unknown> = Duckable<TRow>;

type SqlCallable<Thenable extends boolean = false> = {
  <TOverride = never, TParams extends Record<string, unknown> = Record<string, unknown>, TQuery extends string = string>(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams
  ): Thenable extends true ? ThenableRef<OverrideRow<TQuery, TOverride>> : Duckable<OverrideRow<TQuery, TOverride>>;
  <TOverride = never, TQuery extends string = string>(sql: ValidSQL<TQuery>): Thenable extends true ? ThenableRef<OverrideRow<TQuery, TOverride>> : Duckable<OverrideRow<TQuery, TOverride>>;
};

export type SqlFunction = SqlCallable<true>;
export type UseSqlHook = SqlCallable;
export type UseTableHook = SqlCallable;
/** @deprecated Use UseTableHook */
export type UseCacheTableHook = SqlCallable;

export interface UseValuesHook {
  <TData extends Record<string, unknown>>(data: TData[]): Duckable<TData>;
  <TSchema extends Record<string, DuckDBType>>(data: Partial<InferDuckTable<TSchema>>[], schema: TSchema): Duckable<InferDuckTable<TSchema>>;
  <TKey extends string>(data: Record<string, unknown>[], columns: readonly TKey[]): Duckable<{ [K in TKey]: unknown }>;
}

export type StoreRef<TRow = unknown> = Duckable<TRow> & {
  insert: (rows: TRow | TRow[]) => Promise<void>;
  clear: () => Promise<void>;
};

// ─── Runtime ─────────────────────────────────────────────────

export interface DuckResult {
  rows?: () => unknown[];
  toArray?: () => unknown[];
  row?: () => unknown;
  arrowTable?: unknown;
  toArrow?(): Promise<Table>;
  raw?: unknown;
}

export interface DuckRuntime {
  exec(sql: string): Promise<DuckResult>;
  insertArrow?(name: string, arrowTable: unknown): Promise<void>;
  registerOPFSFileName?(path: string): Promise<void>;
}

let _runtime: DuckRuntime | null = null;

function rowsFromResult(result: DuckResult, select = (e: unknown[]) => e): unknown[] {
  if (result.rows) return select(result.rows());
  if (result.toArray) return select(result.toArray());
  throw new Error('[reducks] Runtime exec() result must provide rows() or toArray()');
}

function rowFromResult(result: DuckResult, select = (e: unknown) => e): unknown {
  if (result.row) return result.row();
  const rows = rowsFromResult(result);
  return rows[0] != null ? select(rows[0]) : null;
}

function arrowTableFromResult(result: DuckResult): unknown {
  const value = result.toArrow ?? result.arrowTable ?? result.raw;
  if (value == null) throw new Error('[reducks] Runtime exec() result must provide arrowTable or raw for arrowTable()');
  return value;
}

export function setRuntime(runtime: DuckRuntime) {
  _runtime = runtime;
}

export function getRuntime(): DuckRuntime {
  if (!_runtime) throw new Error('[reducks] No runtime set. Call setRuntime() before consuming refs.');
  return _runtime;
}

// ─── Internals ───────────────────────────────────────────────

const NEVER = new Promise<never>(() => {});

let _seq = 0;
const uid = (prefix: string) => `${prefix}_${++_seq}_${Math.random().toString(36).slice(2, 6)}`;

export function isRef(v: unknown): v is Duckable {
  return v instanceof Duckable;
}

export function buildProxy<T extends Record<string, unknown>>(params: T): ParamProxy<T> {
  const escaped: Record<string, string> = {};
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (isRef(v)) {
      v.ensureName(k);
      const expr = Duckable.toExpr(v);
      escaped[k] = expr;
      raw[k] = v;
    } else {
      escaped[k] = escapeSQL(v);
      raw[k] = String(v ?? '');
    }
  }
  return Object.assign(escaped, {
    raw,
    where: buildWhere,
    eq,
    neq,
    gt,
    gte,
    lt,
    lte,
    between,
    in: $in,
    like,
    ilike,
  }) as ParamProxy<T>;
}

export function depsResolved(params: Record<string, unknown>) {
  return Object.values(params).every((v) => (isRef(v) ? v.status !== 'pending' : true));
}

export function resolveSql(queryFn: unknown, params: Record<string, unknown>) {
  return typeof queryFn === 'function' ? queryFn(buildProxy(params)) : queryFn;
}

// ─── DuckRef ───────────────────────────────────────────────
export class Duckable<TRow = unknown> implements PromiseLike<NonNullable<TRow>[]> {
  readonly id: string;
  readonly type: QueryType;
  readonly query: string;
  readonly dependencies: readonly Duckable[];
  readonly __row?: TRow;

  status: QueryStatus;
  name?: string;
  error?: Error;

  _formatter: (e: unknown[]) => unknown[] = (e) => e;
  _arrowTable?: unknown;
  _storeSchema?: Record<string, string>;
  _storeBuffer?: Record<string, unknown>[];
  _materializing?: Promise<void>;
  private _promises = new Map<string, Promise<unknown>>();

  then<TResult1 = NonNullable<TRow>[] | null, TResult2 = never>(
    onfulfilled?: ((value: NonNullable<TRow>[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.rows().then(onfulfilled, onrejected);
  }

  constructor(status: QueryStatus, type: QueryType, query: string, dependencies: Duckable[] = [], options: { id?: string; name?: string; arrowTable?: unknown } = {}) {
    this.id = options.id ?? uid(type[0]!);
    this.type = type;
    // replace trailling ; and \n\s*
    this.query = query?.replace(/[;\n\s]*$/gm, '') ?? '';
    this.dependencies = dependencies;
    this.status = status;
    this.name = options.name;
    this._arrowTable = options.arrowTable;
  }

  ensureName(name: string) {
    if (!this.name) this.name = name;
  }

  setStatus(status: QueryStatus, error?: Error) {
    this.status = status;
    this.error = status === 'error' ? error : undefined;
  }

  takeArrowTable() {
    const value = this._arrowTable;
    this._arrowTable = undefined;
    return value;
  }

  static toStatement(ref: Duckable) {
    const tag = `--:re:${ref.type}:${ref.name ?? ref.id}\n`;
    if (ref.type === 'fragment') return tag + ref.query;
    if (ref.type === 'opfs') return tag + `FROM 'opfs://${ref.id}.parquet'`;
    return tag + `FROM ${ref.id}`;
  }

  static toExpr(ref: Duckable) {
    if (ref.type === 'fragment') return `(${ref.query})`;
    if (ref.type === 'opfs') return `'opfs://${ref.id}.parquet'`;
    return `"${ref.id}"`;
  }

  static deterministicId(sql: string) {
    return fnv1a32(sql).toString(36);
  }

  private cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.status === 'pending') return NEVER as Promise<T>;
    const hit = this._promises.get(key);
    if (hit) return hit as Promise<T>;
    const promise = fn();
    this._promises.set(key, promise);
    return promise;
  }

  private async execute(): Promise<DuckResult> {
    await materializeChain(this);
    return getRuntime().exec(Duckable.toStatement(this));
  }

  rows<TFill = never>(): Duckable<ApplyFill<TRow, TFill>> & PromiseLike<NonNullable<ApplyFill<TRow, TFill>>[]>;
  rows<R>(select: (rows: NonNullable<TRow>[]) => R): Promise<R>;
  rows<R>(select?: (rows: NonNullable<TRow>[]) => R): any {
    if (select) {
      this._formatter = select as (e: unknown[]) => unknown[];
    }
    // if (select) {
    //   return this.cached('a', async () => rowsFromResult(await this.execute()) as never).then(select);
    // }
    return Object.assign(this as any, {
      then: (onfulfilled?: any, onrejected?: any) => {
        return this.cached('a', async () => rowsFromResult(await this.execute(), this._formatter) as never).then(onfulfilled, onrejected);
      },
    });
  }

  row<TFill = never>(): Promise<NonNullable<ApplyFill<TRow, TFill>> | null>;
  row<R>(select: (row: NonNullable<TRow> | null) => R): Promise<R>;
  row<R>(select?: (row: NonNullable<TRow> | null) => R): Promise<any> {
    if (select) {
      return this.cached('n', async () => rowFromResult(await this.execute()) as never).then(select);
    }
    return this.cached('n', async () => rowFromResult(await this.execute()) as never);
  }
  /** @deprecated Use rows() */
  toArray(): Duckable<TRow> & PromiseLike<NonNullable<TRow>[]> {
    return this.rows() as any;
  }

  /** @deprecated Use arrowTable() */
  toArrow(): Promise<Table> {
    return this.arrowTable() as any;
  }

  arrowTable(): Promise<Table> {
    return this.cached('w', async () => {
      const result = await this.execute();
      return arrowTableFromResult(result) as Table;
    });
  }

  toSqlSync(): string {
    return Duckable.toStatement(this);
  }
  async toSql(): Promise<string> {
    await materializeChain(this);
    return Duckable.toStatement(this);
  }
}

// ─── Materialization ─────────────────────────────────────────

function getDependencyChain(ref: Duckable): Duckable[] {
  const visited = new Set<string>();
  const chain: Duckable[] = [];
  const traverse = (node: Duckable) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    for (const dep of node.dependencies) traverse(dep);
    chain.push(node);
  };
  traverse(ref);
  return chain;
}

async function materializeRef(ref: Duckable): Promise<void> {
  if (ref.status === 'ready' || ref.type === 'fragment') return;
  if (ref.status === 'error') throw ref.error;
  if (ref._materializing) return ref._materializing;

  const promise = (async () => {
    ref.setStatus('writing');
    const runtime = getRuntime();
    const name = ref.name ?? ref.id;
    try {
      if (ref.type === 'arrow') {
        const arrowTable = ref.takeArrowTable();
        if (!arrowTable) throw new Error(`[materialize:${name}] Arrow table missing`);
        if (!runtime.insertArrow) throw new Error(`[materialize:${name}] Runtime does not support insertArrow`);
        await runtime.insertArrow(ref.id, arrowTable);
      } else if (ref._storeSchema) {
        const cols = Object.entries(ref._storeSchema)
          .map(([c, t]) => `${c} ${t}`)
          .join(', ');
        await runtime.exec(`--:re:table:${name}\nCREATE TABLE IF NOT EXISTS ${ref.id} (${cols})`);
        if (ref._storeBuffer && ref._storeBuffer.length > 0) {
          const colNames = Object.keys(ref._storeSchema);
          await runtime.exec(`--:re:table:${name}\nINSERT INTO ${ref.id} SELECT * FROM (VALUES ${toValues(ref._storeBuffer, ref._storeSchema)}) AS _v(${colNames.join(',')})`);
          ref._storeBuffer = [];
        }
      } else if (ref.type === 'opfs') {
        const path = `opfs://${ref.id}.parquet`;
        await runtime.registerOPFSFileName!(path);
        await runtime.exec(`--:re:opfs:${name}\nCOPY (${ref.query}) TO '${path}' (FORMAT PARQUET)`);
      } else {
        await runtime.exec(`--:re:table:${name}\nCREATE TABLE IF NOT EXISTS "${ref.id}" AS ${ref.query}`);
      }
      ref.setStatus('ready');
    } catch (err) {
      ref.setStatus('error', err as Error);
      console.error(`[materialize:${name}]`, err);
      throw err;
    } finally {
      ref._materializing = undefined;
    }
  })();

  ref._materializing = promise;
  return promise;
}

export async function materializeChain(ref: Duckable): Promise<void> {
  for (const node of getDependencyChain(ref)) {
    if (node.type !== 'fragment' && node.status !== 'ready') {
      await materializeRef(node);
    }
  }
}

export function needsMaterialization(ref: Duckable) {
  return getDependencyChain(ref).some((n) => n.type !== 'fragment' && n.status !== 'ready');
}

export async function runSql(query: string): Promise<void> {
  await getRuntime().exec(query);
}

// ─── Factories (content-addressed cache: same SQL → same ref) ─

const _refCache = new Map<string, Duckable>();

export function makeRef(type: 'fragment' | 'table' | 'opfs', queryFn: unknown, params: Record<string, unknown> = {}): Duckable {
  const hasPending = Object.values(params).some((v) => isRef(v) && v.status === 'pending');
  if (hasPending) return new Duckable('pending', type, '', []);

  const sqlStr = resolveSql(queryFn, params);
  const key = `${type}\0${sqlStr}`;
  const hit = _refCache.get(key);
  if (hit) return hit;

  const deps = Object.values(params).filter(isRef);
  const prefix = type === 'fragment' ? 'f' : type === 'opfs' ? 'o' : 't';
  const id = type === 'fragment' ? uid('f') : `${prefix}_${Duckable.deterministicId(sqlStr)}`;
  const ref = new Duckable(type === 'fragment' ? 'ready' : 'idle', type, sqlStr, deps, { id });
  _refCache.set(key, ref);
  return ref;
}

export function makeStoreRef<TSchema extends Record<string, DuckDBType>>(id: string, _schema: TSchema): StoreRef<InferDuckTable<TSchema>>;
export function makeStoreRef<TSchema extends Record<string, DuckDBType>>(_schema: TSchema): StoreRef<InferDuckTable<TSchema>>;
export function makeStoreRef<TSchema extends Record<string, DuckDBType>>(...params: [string | TSchema, TSchema?]): StoreRef<InferDuckTable<TSchema>> {
  const [id, schema] = params.length === 1 ? [uid('s'), params[0]!] : [params[0]! as string, params[1]! as TSchema];
  const ref = new Duckable('idle', 'table', '', [], { id });
  ref._storeSchema = schema as Record<string, string>;
  ref._storeBuffer = [];

  const insert = async (rows: Partial<InferDuckTable<TSchema>> | Partial<InferDuckTable<TSchema>>[]) => {
    const arr = (Array.isArray(rows) ? rows : [rows]) as Record<string, unknown>[];
    if (ref.status === 'ready') {
      if (arr.length === 0) return;
      const colNames = Object.keys(schema);
      await getRuntime().exec(`--:re:table:${ref.name ?? ref.id}\nINSERT INTO ${id} SELECT * FROM (VALUES ${toValues(arr, schema as Record<string, string>)}) AS _v(${colNames.join(',')})`);
    } else {
      ref._storeBuffer!.push(...arr);
    }
  };

  const clear = async () => {
    await getRuntime().exec(`DELETE FROM ${id}`);
    ref._storeBuffer = [];
  };

  return Object.assign(ref, { insert, clear }) as StoreRef<InferDuckTable<TSchema>>;
}

// ─── re namespace (imperative API) ───────────────────────────

const sqlFn = ((queryFn: unknown, params?: Record<string, unknown>) => makeRef('fragment', queryFn, params ?? {})) as SqlFunction;

const tableFn = ((queryFn: unknown, params?: Record<string, unknown>) => makeRef('table', queryFn, params ?? {})) as SqlFunction;

const opfsFn = ((queryFn: unknown, params?: Record<string, unknown>) => makeRef('opfs', queryFn, params ?? {})) as SqlFunction;

const valuesFn: UseValuesHook = ((data: Record<string, unknown>[], schema?: Record<string, string> | readonly string[]): Duckable => {
  const valSql = toValuesSelect(data, schema);
  const key = `fragment\0${valSql}`;
  const hit = _refCache.get(key);
  if (hit) return hit;
  const ref = new Duckable('ready', 'fragment', valSql, [], { id: uid('f') });
  _refCache.set(key, ref);
  return ref;
}) as UseValuesHook;

function fromArrowFn(arrowTable: Table) {
  const id = uid('a');
  return new Duckable('idle', 'arrow', `FROM ${id}`, [], { id, arrowTable });
}

export function statement<TVariable extends Record<string, unknown>>(): <TFixed extends Record<string, unknown>>(
  builder: (t: ParamProxy<TVariable & TFixed>) => string,
  fixed: TFixed
) => (params: TVariable) => ThenableRef<unknown>;
export function statement<TVariable extends Record<string, unknown>, TFixed extends Record<string, unknown> = Record<string, unknown>, TQuery extends string = string, TOverride = never>(
  builder: (t: ParamProxy<TVariable & TFixed>) => ValidSQL<TQuery>,
  fixed?: TFixed
): (params: TVariable) => ThenableRef<OverrideRow<TQuery, TOverride>>;
export function statement(builder?: unknown, fixed?: Record<string, unknown>): unknown {
  if (builder === undefined) {
    return (b: unknown, f: Record<string, unknown>) => (params: Record<string, unknown>) => sqlFn(b as never, { ...f, ...params });
  }
  return (params: Record<string, unknown>) => sqlFn(builder as never, { ...fixed, ...params });
}

export const re = {
  duck: sqlFn,
  sql: sqlFn,
  table: tableFn,
  opfs: opfsFn,
  setRuntime,
  store: makeStoreRef,
  values: valuesFn,
  fromArrow: fromArrowFn,
  statement,
};

export { fromArrowFn as fromArrow, opfsFn as opfs, sqlFn as sql, tableFn as table, valuesFn as values };
/** @deprecated Use re.table */
export const cacheTable = tableFn;
/** @deprecated Use re.table */
export const lazyTable = tableFn;

// ─── Type Tests ──────────────────────────────────────────────
export async function _typeCheck() {
  const f1_plain = re.sql(`SELECT * FROM '/api/export/*/reference_carriers.parquet'`);
  f1_plain && (f1_plain satisfies ThenableRef);

  const f2 = re.sql(() => `SELECT 42::int as val`);
  f2 && (f2 satisfies ThenableRef<{ val: number }>);

  const f2b = await re.sql<{ val: number }>(() => `SELECT 42::int as val`);
  f2b && (f2b satisfies { val: number }[]);
  const queryRef = re.sql(
    (t) => {
      t satisfies { whatever: string };
      return `SELECT 42::int AS XX from ${t.whatever}`;
    },
    { whatever: 't' }
  );

  const f3 = re.sql(() => `SELECT sum(cost)::int as total_cost, carrier as best FROM t`);
  f3 && (f3 satisfies ThenableRef<{ total_cost: number; best: unknown }>);

  const f_sql = re.sql(() => `--sql\nSELECT 1`);
  f_sql && (f_sql satisfies ThenableRef);

  const f_pivot = re.sql(() => `PIVOT t ON col USING sum(val)`);
  f_pivot && (f_pivot satisfies ThenableRef);

  // @ts-expect-error - SQL must start with SELECT, FROM, PIVOT or --sql
  re.sql(() => `UPDATE t SET x = 1`);

  const typed = re.table(() => `SELECT count(*)::int as total, name FROM t`);
  typed && (typed satisfies ThenableRef<{ total: number; name: unknown }>);

  null as unknown as ExtractRow<NonNullable<typeof typed>> satisfies {
    total: number;
    name: unknown;
  };

  // --- toArray / next / arrowTable ---

  const rows1 = await typed.rows();
  rows1 satisfies { total: number; name: unknown }[];

  const row1 = await f2.row();
  row1 && (row1 satisfies { val: number });

  const fragRows = await f3.rows();
  fragRows && (fragRows satisfies { total_cost: number; best: unknown }[]);

  const multi = await Promise.all([typed.rows(), f2.rows()]);
  multi satisfies [{ total: number; name: unknown }[], { val: number }[]];

  const single = await typed.rows();
  single satisfies { total: number; name: unknown }[];

  const shaped1 = await typed.row();
  shaped1 && (shaped1 satisfies { total: number; name: unknown });

  const shaped2 = await Promise.all([typed.rows(), f2.row()]);
  shaped2 satisfies [{ total: number; name: unknown }[], { val: number } | null];

  const inlineRow = await re.sql(() => `SELECT 1::int as x`, {}).row();
  inlineRow && (inlineRow satisfies { x: number });

  const inlineRows = await re.sql(() => `SELECT 'abc' as s`, {}).rows();
  inlineRows satisfies { s: string }[];

  const arrowTable = await typed.arrowTable();
  arrowTable satisfies Table;

  // --- useValues ---

  const cutoffsTyped = re.values(
    [
      { carrier: 'heppner', cutoff: 250 },
      { carrier: 'geodist', cutoff: 300 },
    ],
    { carrier: 'VARCHAR', cutoff: 'INT' }
  );
  cutoffsTyped && (cutoffsTyped satisfies ThenableRef<{ carrier: unknown; cutoff: unknown }>);

  const cutoffsSimple = re.values(
    [
      { carrier: 'heppner', cutoff: 250 },
      { carrier: 'geodist', cutoff: 300 },
    ],
    ['carrier', 'cutoff']
  );
  cutoffsSimple && (cutoffsSimple satisfies ThenableRef<{ carrier: unknown; cutoff: unknown }>);

  const emptyTyped = re.values([], { id: 'INT', name: 'VARCHAR' });
  emptyTyped && (emptyTyped satisfies ThenableRef<{ id: unknown; name: unknown }>);

  const emptySimple = re.values([], ['id', 'name'] as const);
  emptySimple && (emptySimple satisfies ThenableRef<{ id: unknown; name: unknown }>);

  const s1 = re.sql((t) => 'SELECT 42 AS TOTO  FROM LOL');
  s1 satisfies ThenableRef<{ TOTO: number }>;
  const r1 = re.statement((t) => `SELECT 42 AS TOTO  FROM LOL = ${t.xx}`, { xx: 312 });
  // @ts-expect-error
  r1();
  const execed = await r1({ lol: 't' });
  execed satisfies { TOTO: number }[];

  const r2 = re.statement((t) => 'SELECT 42 AS TOTO  FROM LOL');
  const execed2 = await r2({});
  execed2 satisfies { TOTO: number }[];

  // --- useSql with multi-CTE object syntax ---

  // Simple CTE: object syntax returns single ref, last CTE is the main query
  // const cte1 = re.sql(t => ({
  //   base: `SELECT 1::int as x`,
  //   derived: `SELECT x + 1::int as y FROM ${t.base}`,
  // } as const));
  // cte1 satisfies QueryRef<{ y: number }>;

  // // CTE with external params (refs and scalars)
  // const externalRef = re.sql(() => `SELECT 'hello'::varchar as msg`);
  // const cte2 = re.sql(
  //   t => ({
  //     enriched: `SELECT msg, ${t.minVal}::int as threshold FROM ${t.externalRef}`,
  //     filtered: `SELECT * FROM ${t.enriched} WHERE threshold > 0`,
  //   } as const),
  //   { externalRef, minVal: 10 }
  // );
  // cte2 satisfies QueryRef<{ msg: string; threshold: number }>;

  // // Imperative sql with CTE object syntax
  // const cte3 = re.sql(t => ({
  //   orders: `SELECT 1::int as id, 100::int as amount`,
  //   summary: `SELECT sum(amount)::int as total FROM ${t.orders}`,
  // } as const));
  // cte3 satisfies QueryRef<{ total: number }>;

  // // CTE with mutual recursion (both CTEs reference each other) - loose typing due to mutual recursion
  // const cte4 = re.sql(t => ({
  //   a: `SELECT 1::int as x FROM ${t.b}`,
  //   b: `SELECT 2::int as y FROM ${t.a}`,
  // } as const));
  // cte4 satisfies QueryRef<unknown>;
}
