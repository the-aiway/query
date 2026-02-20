import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Table } from 'apache-arrow';
import { buildWhere, eq, neq, gt, gte, lt, lte, between, $in, like, ilike, sqlConditions, type SqlConditionValue } from '../sqlConditions';
import { escapeSQL } from '../sqlUtils';
import { toValuesSelect } from '../toValues';
import type { ConnectionPool, } from '../duck/ConnectionPool';
import type { ParamProxy, QueryRef as QueryRefContract, QueryStatus, QueryType, RefType, UseSqlHook, UseTableHook, UseValuesHook } from './reducks.type';

export type QueryRef<TRow = unknown> = QueryRefContract<TRow>;

// ─── Internals ───────────────────────────────────────────────

const _cache = new Map<string, QueryRef>();
const _materializing = new Map<string, Promise<void>>();

function isRef(v: unknown): v is QueryRefContract {
  return v != null && typeof v === 'object' && 'type' in v && 'id' in v && 'toArray' in v;
}

function buildProxy<T extends Record<string, any>>(params: T, options?: { useCteNames?: boolean }): ParamProxy<T> {
  const escaped: Record<string, string> = {};
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (isRef(v)) {
      v.ensureName(k);
      const name = Ref.resolveName(v) || v.id;
      const expr = options?.useCteNames ? `_${name}` : Ref.toExpr(v);
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
  return Object.values(params).every((v) => {
    if (isRef(v)) return v.status !== 'pending';
    return true;
  });
}

let _seq = 0;
const uid = (prefix: string) => `${prefix}_${++_seq}_${Math.random().toString(36).slice(2, 6)}`;

const NEVER = new Promise<never>(() => {});
const _materializeCache = new Map<string, Promise<unknown>>();
const TYPE_PREFIX: Record<QueryType, string> = { table: 't', fragment: 'f', lazy: 'l', arrow: 'a' };

function getPool(): ConnectionPool {
  return (window as unknown as { pool: ConnectionPool }).pool;
}

export class Ref<TRow = unknown> implements QueryRefContract<TRow> {
  static #nameById = new Map<string, string>();

  readonly #id: string;
  readonly #type: QueryType;
  readonly #query: string;
  readonly #queryFn?: (t: ParamProxy<any>) => string;
  readonly #params?: Record<string, any>;
  readonly #dependencies: readonly QueryRefContract[];
  #status: QueryStatus;
  #name?: string;
  #error?: Error;
  #arrowTable?: Table;
  readonly __row?: TRow;

  constructor(
    status: QueryStatus,
    type: QueryType,
    query: string,
    dependencies: QueryRefContract[] = [],
    options: { id?: string; name?: string; arrowTable?: Table; queryFn?: (t: ParamProxy<any>) => string; params?: Record<string, any> } = {}
  ) {
    this.#id = options.id ?? uid(TYPE_PREFIX[type]);
    this.#type = type;
    this.#query = query;
    this.#queryFn = options.queryFn;
    this.#params = options.params;
    this.#dependencies = dependencies;
    this.#status = status;
    this.#name = options.name;
    this.#arrowTable = options.arrowTable;
    if (options.name) Ref.#nameById.set(this.#id, options.name);
  }

  get id(): string {
    return this.#id;
  }

  get type(): QueryType {
    return this.#type;
  }

  get query(): string {
    return this.#query;
  }

  get dependencies(): readonly QueryRefContract[] {
    return this.#dependencies;
  }

  get status(): QueryStatus {
    return this.#status;
  }

  get name(): string | undefined {
    return this.#name;
  }

  get error(): Error | undefined {
    return this.#error;
  }

  ensureName(name: string): void {
    const mappedName = Ref.#nameById.get(this.#id) ?? name;
    Ref.#nameById.set(this.#id, mappedName);
    if (!this.#name) this.#name = mappedName;
  }

  static toExpr(ref: QueryRefContract): string {
    if (ref.type === 'fragment') return `(${ref.query})`;
    if (ref.type === 'arrow' || ref.type === 'lazy') return `"${ref.id}"`;
    return `'${Ref.tablePath(ref)}'`;
  }

  static resolveName(ref: QueryRefContract): string | undefined {
    return ref.name ?? Ref.#nameById.get(ref.id);
  }

  static tablePath(ref: QueryRefContract): string {
    const resolvedName = Ref.resolveName(ref);
    return resolvedName ? `opfs://${resolvedName}.${ref.id}.parquet` : `opfs://${ref.id}.parquet`;
  }

  setStatus(status: QueryStatus, error?: Error): void {
    this.#status = status;
    this.#error = status === 'error' ? error : undefined;
  }

  takeArrowTable(): Table | undefined {
    const value = this.#arrowTable;
    this.#arrowTable = undefined;
    return value;
  }

  private cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.#status === 'pending') return NEVER as Promise<T>;
    const cacheKey = `${this.id}\0${key}`;
    const hit = _materializeCache.get(cacheKey);
    if (hit) return hit as Promise<T>;
    const promise = fn();
    _materializeCache.set(cacheKey, promise);
    return promise;
  }

  private async execute() {
    const pool = getPool();
    await materializeChain(this, pool);
    const name = Ref.resolveName(this) || this.id;
    const prefix = `--:re:${this.type}:${name}\n`;
    return pool.queryIPCTable(`${prefix}FROM ${Ref.toExpr(this)}`);
  }

  async toSql(options?: { cte?: boolean }): Promise<string> {
    const pool = getPool();
    await materializeChain(this, pool);
    if (options?.cte) {
      const chain = getDependencyChain(this);
      const ctes = chain
        .filter((n) => n.id !== this.id)
        .map((n) => {
          const name = Ref.resolveName(n) || n.id;
          const query = n instanceof Ref && n.#queryFn && n.#params ? n.#queryFn(buildProxy(n.#params, { useCteNames: true })) : n.type === 'fragment' ? n.query : `FROM ${Ref.toExpr(n)}`;
          return `_${name} AS (${query})`;
        })
        .join(',\n');

      const baseSql =
        this.#queryFn && this.#params ? this.#queryFn(buildProxy(this.#params, { useCteNames: true })) : this.type === 'fragment' ? this.query : `FROM _${Ref.resolveName(this) || this.id}`;

      return ctes ? `WITH ${ctes}\n${baseSql}` : baseSql;
    }
    if (this.type === 'fragment') return this.query;
    return `FROM ${Ref.toExpr(this)}`;
  }

  toArray(): Promise<NonNullable<TRow>[]> {
    return this.cached('a', async () => (await this.execute()).toMaterialized() as NonNullable<TRow>[]);
  }

  toArrow(): Promise<Table> {
    return this.cached('w', async () => (await this.execute()) as unknown as Table);
  }

  row(): Promise<NonNullable<TRow> | null> {
    return this.cached('n', async () => ((await this.execute()).toMaterialized()[0] ?? null) as NonNullable<TRow> | null);
  }
}

// ─── Materialization ─────────────────────────────────────────

function getDependencyChain(ref: QueryRefContract): QueryRefContract[] {
  const visited = new Set<string>();
  const chain: QueryRefContract[] = [];
  const traverse = (node: QueryRefContract) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    for (const dep of node.dependencies) traverse(dep);
    chain.push(node);
  };
  traverse(ref);
  return chain;
}

async function materializeRef(ref: QueryRefContract, pool: ConnectionPool): Promise<void> {
  if (!(ref instanceof Ref)) return;
  if (ref.status === 'ready' || ref.type === 'fragment') return;
  if (ref.status === 'error') throw ref.error;

  const existing = _materializing.get(ref.id);
  if (existing) return existing;

  const promise = (async () => {
    ref.setStatus('writing');
    const name = Ref.resolveName(ref) || ref.id;
    try {
      if (ref.type === 'arrow') {
        const arrowTable = ref.takeArrowTable();
        if (!arrowTable) throw new Error(`[materialize:${name}] Arrow table missing on ref`);
        const conn = await pool.acquire();
        try {
          await conn.insertArrowTable(arrowTable, { name: ref.id, create: true });
        } finally {
          pool.release(conn);
        }
      } else if (ref.type === 'lazy') {
        await pool.queryIPCTable(`--:re:lazy:${name}\nCREATE OR REPLACE VIEW "${ref.id}" AS ${ref.query}`);
        ref.setStatus('ready');
        _materializing.delete(ref.id);
        const path = Ref.tablePath(ref);
        void new Promise<void>((resolve, reject) => {
          // todo: waitForNoPendingQueries
          new Promise((r) => setTimeout(r, 1000))
            .then(() => pool.db.registerOPFSFileName(path))
            .then(() => pool.queryIPCTable(`--:re:lazy-copy:${name}\nCOPY (${ref.query}) TO '${path}' (FORMAT PARQUET)`))
            .then(() => pool.queryIPCTable(`--:re:lazy-swap:${name}\nCREATE OR REPLACE VIEW "${ref.id}" AS FROM '${path}'`))
            .then(() => resolve())
            .catch((err) => {
              console.warn(`[lazy-materialize:${name}]`, err);
              resolve();
            });
        });
        return;
      } else {
        const path = Ref.tablePath(ref);
        await pool.db.registerOPFSFileName(path);
        await pool.queryIPCTable(`--:re:table:${name}\nCOPY (${ref.query}) TO '${path}' (FORMAT PARQUET)`);
      }
      ref.setStatus('ready');
    } catch (err) {
      ref.setStatus('error', err as Error);
      console.error(`[materialize:${name}]`, err);
      throw err;
    } finally {
      _materializing.delete(ref.id);
    }
  })();

  _materializing.set(ref.id, promise);
  return promise;
}

export async function materializeChain(ref: QueryRefContract, pool: ConnectionPool): Promise<void> {
  for (const node of getDependencyChain(ref)) {
    if (node.type !== 'fragment' && node.status !== 'ready') {
      await materializeRef(node, pool);
    }
  }
}

export function needsMaterialization(ref: QueryRefContract): boolean {
  return getDependencyChain(ref).some((n) => n.type !== 'fragment' && n.status !== 'ready');
}

// ─── Plain API (no React) ────────────────────────────────────

const REF_STATUS: Record<RefType, QueryStatus> = { table: 'idle', fragment: 'ready', lazy: 'idle' };
const REF_PREFIX: Record<RefType, string> = { table: 't', fragment: 'f', lazy: 'l' };

function makeRef(type: RefType, queryFn: any, params: any = {}): QueryRef {
  if (!depsResolved(params)) {
    throw new Error('[reducks] Cannot create ref: ref dependencies are pending');
  }
  const isFn = typeof queryFn === 'function';
  const sql = isFn ? queryFn(buildProxy(params)) : queryFn;
  const key = `${type}\0${sql}`;
  const hit = _cache.get(key);
  if (hit) return hit;
  const deps = Object.values(params).filter(isRef) as QueryRefContract[];
  const entry = new Ref(REF_STATUS[type], type, sql, deps, {
    id: uid(REF_PREFIX[type]),
    queryFn: isFn ? queryFn : undefined,
    params: isFn ? params : undefined,
  });
  _cache.set(key, entry);
  return entry;
}

export const sql: UseSqlHook = ((queryFn: any, params?: any) => makeRef('fragment', queryFn, params ?? {})) as UseSqlHook;
export const table: UseTableHook = ((queryFn: any, params?: any) => makeRef('table', queryFn, params ?? {})) as UseTableHook;
export const lazyTable: UseTableHook = ((queryFn: any, params?: any) => makeRef('lazy', queryFn, params ?? {})) as UseTableHook;


export const values: UseValuesHook = ((data: Record<string, unknown>[], schema?: Record<string, string> | readonly string[]): any => {
  const valSql = toValuesSelect(data, schema);
  const key = `fragment\0${valSql}`;
  const hit = _cache.get(key);
  if (hit) return hit;
  const entry = new Ref('ready', 'fragment', valSql, [], { id: uid('f') });
  _cache.set(key, entry);
  return entry;
}) as UseValuesHook;

export type ReEngine = { sql: UseSqlHook; table: UseTableHook; values: UseValuesHook };
export type PipelineFn<TParams, TResult> = (re: ReEngine, params: TParams) => TResult;

export function pipeline<TParams, TResult>(fn: PipelineFn<TParams, TResult>, params: TParams): TResult {
  return fn({ sql, table, values }, params);
}




// ─── Hooks: Producers ────────────────────────────────────────

function useQueryRef(type: RefType): UseTableHook {
  return (queryFn: any, params: any = {}): any => {
    const ready = depsResolved(params);
    const resolved = ready ? makeRef(type, queryFn, params) : null;
    const pending = useMemo(() => new Ref('pending', type, '', [], { id: uid('p') }), []);

    return useMemo(() => resolved ?? pending, [resolved, pending]);
  };
}

export const useTable: UseTableHook = useQueryRef('table');
export const useSql: UseSqlHook = useQueryRef('fragment');
export const useLazyTable: UseTableHook = useQueryRef('lazy');

export function usePipeline<TParams, TResult>(fn: PipelineFn<TParams, TResult>, params: TParams): TResult {
  return fn({ sql: useSql, table: useTable, values: useValues }, params);
}


export const useValues: UseValuesHook = (
  data: Record<string, unknown>[],
  schema?: Record<string, string> | readonly string[]
): any => {
  const sql = useMemo(() => toValuesSelect(data, schema), [JSON.stringify(data), JSON.stringify(schema ?? null)]);

  return useMemo(() => {
    const key = `fragment\0${sql}`;
    const hit = _cache.get(key);
    if (hit) return hit;
    const entry = new Ref('ready', 'fragment', sql, [], { id: uid('f') });
    _cache.set(key, entry);
    return entry;
  }, [sql]);
};

export function fromArrow(arrowTable: Table): QueryRef {
  const id = uid('a');
  return new Ref('idle', 'arrow', `FROM "${id}"`, [], { id, arrowTable });
}

export function useArrow(arrowTable: Table | null): QueryRef {
  const pending = useMemo(() => new Ref('pending', 'arrow', '', [], { id: uid('p') }), []);

  return useMemo(() => (arrowTable ? fromArrow(arrowTable) : pending), [arrowTable, pending]);
}
