import type { Table } from 'apache-arrow';
import {
  buildWhere,
  eq,
  neq,
  gt,
  gte,
  lt,
  lte,
  between,
  $in,
  like,
  ilike,
  type SqlConditionValue,
} from '../sqlConditions';
import { escapeSQL, fnv1a32 } from '../sqlUtils';
import { toValues, toValuesSelect } from '../toValues';
import {
  type InferSQLStrict,
  type InferDuckTable,
  type Materialize,
} from '../duck/inferSqlReturntype';

// ─── Types ───────────────────────────────────────────────────

export type QueryStatus = 'pending' | 'idle' | 'writing' | 'ready' | 'error';
export type QueryType = 'fragment' | 'table' | 'opfs' | 'arrow';
export type DuckDBType =
  | 'VARCHAR'
  | 'INT'
  | 'INTEGER'
  | 'BIGINT'
  | 'FLOAT'
  | 'DOUBLE'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIMESTAMP'
  | 'DECIMAL'
  | 'HUGEINT'
  | (string & {});

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
  : TrimLeft<T> extends `${'WITH' | 'with'}${string}`
    ? 'ERROR: WITH clauses are forbidden — split into separate sql refs'
    : TrimLeft<T> extends `${'SELECT' | 'FROM' | 'PIVOT' | '--sql' | '--SQL'}${string}`
      ? T
      : 'ERROR: SQL must start with SELECT, FROM, PIVOT or --sql';

type InferRow<TQuery extends string> = InferSQLStrict<TQuery>[number];

type FillUnknown<T, Fill> = Materialize<{ [K in keyof T]: unknown extends T[K] ? Fill : T[K] }>;

export type ApplyFill<TRow, TFill> = [TFill] extends [never]
  ? TRow
  : TFill extends Record<string, unknown>
    ? TFill
    : FillUnknown<TRow, TFill>;

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
  <
    TOverride = never,
    TParams extends Record<string, unknown> = Record<string, unknown>,
    TQuery extends string = string,
  >(
    queryFn: (t: ParamProxy<TParams>) => ValidSQL<TQuery>,
    params?: TParams
  ): Thenable extends true
    ? ThenableRef<OverrideRow<TQuery, TOverride>>
    : Duckable<OverrideRow<TQuery, TOverride>>;
  <TOverride = never, TQuery extends string = string>(
    sql: ValidSQL<TQuery>
  ): Thenable extends true
    ? ThenableRef<OverrideRow<TQuery, TOverride>>
    : Duckable<OverrideRow<TQuery, TOverride>>;
};

export type SqlFunction = SqlCallable<true>;
export type UseSqlHook = SqlCallable;
export type UseTableHook = SqlCallable;
/** @deprecated Use UseTableHook */
export type UseCacheTableHook = SqlCallable;

export interface UseValuesHook {
  <TData extends Record<string, unknown>>(data: TData[]): Duckable<TData>;
  <TSchema extends Record<string, DuckDBType>>(
    data: Partial<InferDuckTable<TSchema>>[],
    schema: TSchema
  ): Duckable<InferDuckTable<TSchema>>;
  <TKey extends string>(
    data: Record<string, unknown>[],
    columns: readonly TKey[]
  ): Duckable<{ [K in TKey]: unknown }>;
}

export type StoreRef<TRow = unknown> = Duckable<TRow> & {
  insert: (rows: TRow | TRow[]) => void;
  clear: () => Promise<void>;
};

// ─── Runtime ─────────────────────────────────────────────────

export interface DuckResult {
  rows(): unknown[];
  /** @deprecated Use rows() */
  toArray(): unknown[];
  raw?: unknown;
}

export interface DuckRuntime {
  exec(sql: string): Promise<DuckResult>;
  insertArrow?(name: string, arrowTable: unknown): Promise<void>;
  registerOPFSFileName?(path: string): Promise<void>;
}

let _runtime: DuckRuntime | null = null;

export function setRuntime(runtime: DuckRuntime) {
  _runtime = runtime;
}

export function getRuntime(): DuckRuntime {
  if (!_runtime)
    throw new Error('[reducks] No runtime set. Call setRuntime() before consuming refs.');
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
  const raw: Record<string, string> = {};
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

  _arrowTable?: unknown;
  _storeSchema?: Record<string, string>;
  _storeBuffer?: Record<string, unknown>[];
  _materializing?: Promise<void>;
  private _promises = new Map<string, Promise<unknown>>();

  then<TResult1 = NonNullable<TRow>[], TResult2 = never>(
    onfulfilled?: ((value: NonNullable<TRow>[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.rows().then(onfulfilled, onrejected);
  }

  constructor(
    status: QueryStatus,
    type: QueryType,
    query: string,
    dependencies: Duckable[] = [],
    options: { id?: string; name?: string; arrowTable?: unknown } = {}
  ) {
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
    return tag + `FROM "${ref.id}"`;
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

  rows<TFill = never>(): Duckable<ApplyFill<TRow, TFill>> &
    PromiseLike<NonNullable<ApplyFill<TRow, TFill>>[]> {
    return Object.assign(this as any, {
      then: (onfulfilled?: any, onrejected?: any) => {
        return this.cached(
          'a',
          async () => (await this.execute()).rows() as never
        ).then(
          onfulfilled,
          onrejected
        );
      },
    });
  }

  /** @deprecated Use rows() */
  toArray(): Duckable<TRow> & PromiseLike<NonNullable<TRow>[]> {
    return this.rows() as any;
  }

  toArrow(): Promise<Table> {
    return this.cached('w', async () => {
      const result = await this.execute();
      return result.raw as Table;
    });
  }

  row<TFill = never>(): Duckable<ApplyFill<TRow, TFill>> &
    PromiseLike<NonNullable<ApplyFill<TRow, TFill>> | null> {
    return Object.assign(this as any, {
      then: (onfulfilled?: any, onrejected?: any) => {
        return this.cached(
          'n',
          async () => ((await this.execute()).rows()[0] ?? null) as never
        ).then(onfulfilled, onrejected);
      },
    });
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
        if (!runtime.insertArrow)
          throw new Error(`[materialize:${name}] Runtime does not support insertArrow`);
        await runtime.insertArrow(ref.id, arrowTable);
      } else if (ref._storeSchema) {
        const cols = Object.entries(ref._storeSchema)
          .map(([c, t]) => `${c} ${t}`)
          .join(', ');
        await runtime.exec(`--:re:table:${name}\nCREATE TABLE IF NOT EXISTS "${ref.id}" (${cols})`);
        if (ref._storeBuffer && ref._storeBuffer.length > 0) {
          const colNames = Object.keys(ref._storeSchema);
          await runtime.exec(
            `--:re:table:${name}\nINSERT INTO "${ref.id}" SELECT * FROM (VALUES ${toValues(ref._storeBuffer, ref._storeSchema)}) AS _v(${colNames.join(',')})`
          );
          ref._storeBuffer = [];
        }
      } else if (ref.type === 'opfs') {
        const path = `opfs://${ref.id}.parquet`;
        await runtime.registerOPFSFileName!(path);
        await runtime.exec(`--:re:opfs:${name}\nCOPY (${ref.query}) TO '${path}' (FORMAT PARQUET)`);
      } else {
        await runtime.exec(
          `--:re:table:${name}\nCREATE TABLE IF NOT EXISTS "${ref.id}" AS ${ref.query}`
        );
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

export function makeRef(
  type: 'fragment' | 'table' | 'opfs',
  queryFn: unknown,
  params: Record<string, unknown> = {}
): Duckable {
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

export function makeStoreRef<TSchema extends Record<string, DuckDBType>>(
  schema: TSchema
): StoreRef<InferDuckTable<TSchema>> {
  const id = uid('s');
  const ref = new Duckable('idle', 'table', '', [], { id });
  ref._storeSchema = schema as Record<string, string>;
  ref._storeBuffer = [];

  const insert = (rows: Partial<InferDuckTable<TSchema>> | Partial<InferDuckTable<TSchema>>[]) => {
    const arr = (Array.isArray(rows) ? rows : [rows]) as Record<string, unknown>[];
    if (ref.status === 'ready') {
      if (arr.length === 0) return;
      const colNames = Object.keys(schema);
      void getRuntime().exec(
        `--:re:table:${ref.name ?? ref.id}\nINSERT INTO "${id}" SELECT * FROM (VALUES ${toValues(arr, schema as Record<string, string>)}) AS _v(${colNames.join(',')})`
      );
    } else {
      ref._storeBuffer!.push(...arr);
    }
  };

  const clear = async () => {
    await getRuntime().exec(`DELETE FROM "${id}"`);
    ref._storeBuffer = [];
  };

  return Object.assign(ref, { insert, clear }) as StoreRef<InferDuckTable<TSchema>>;
}

// ─── re namespace (imperative API) ───────────────────────────

const sqlFn = ((queryFn: unknown, params?: Record<string, unknown>) =>
  makeRef('fragment', queryFn, params ?? {})) as SqlFunction;

const tableFn = ((queryFn: unknown, params?: Record<string, unknown>) =>
  makeRef('table', queryFn, params ?? {})) as SqlFunction;

const opfsFn = ((queryFn: unknown, params?: Record<string, unknown>) =>
  makeRef('opfs', queryFn, params ?? {})) as SqlFunction;

const valuesFn: UseValuesHook = ((
  data: Record<string, unknown>[],
  schema?: Record<string, string> | readonly string[]
): Duckable => {
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
  return new Duckable('idle', 'arrow', `FROM "${id}"`, [], { id, arrowTable });
}

export function statement<TVariable extends Record<string, unknown>>(): <
  TFixed extends Record<string, unknown>,
>(
  builder: (t: ParamProxy<TVariable & TFixed>) => string,
  fixed: TFixed
) => (params: TVariable) => ThenableRef<unknown>;
export function statement<
  TVariable extends Record<string, unknown>,
  TFixed extends Record<string, unknown> = Record<string, unknown>,
>(
  builder: (t: ParamProxy<TVariable & TFixed>) => string,
  fixed?: TFixed
): (params: TVariable) => ThenableRef<unknown>;
export function statement(builder?: unknown, fixed?: Record<string, unknown>): unknown {
  if (builder === undefined) {
    return (b: unknown, f: Record<string, unknown>) => (params: Record<string, unknown>) =>
      sqlFn(b as never, { ...f, ...params });
  }
  return (params: Record<string, unknown>) => sqlFn(builder as never, { ...fixed, ...params });
}

export const re = {
  duck: sqlFn,
  sql: sqlFn,
  table: tableFn,
  opfs: opfsFn,
  store: makeStoreRef,
  values: valuesFn,
  fromArrow: fromArrowFn,
  statement,
};

export {
  sqlFn as sql,
  tableFn as table,
  opfsFn as opfs,
  valuesFn as values,
  fromArrowFn as fromArrow,
};
/** @deprecated Use re.table */
export const cacheTable = tableFn;
/** @deprecated Use re.table */
export const lazyTable = tableFn;
