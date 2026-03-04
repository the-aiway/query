import type { Table } from 'apache-arrow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    depsResolved,
    Duckable,
    makeRef,
    makeStoreRef,
    resolveSql,
    table as reTable,
    values as reValues,
    sql,
    type ApplyFill,
    type DuckDBType,
    type ParamProxy,
    type SqlFunction,
    type StoreRef,
    type ThenableRef,
    type UseSqlHook,
    type UseTableHook,
    type UseValuesHook,
} from '../core/reducks';
import type { InferDuckTable } from '../duck/inferSqlReturntype';
import { toValuesSelect } from '../toValues';

export { buildProxy, cacheTable, depsResolved, Duckable, fromArrow, getRuntime, isRef, lazyTable, makeRef, makeStoreRef, materializeChain, needsMaterialization, opfs, re, resolveSql, runSql, setRuntime, sql, statement, table, values } from '../core/reducks';
export type { ApplyFill, DuckDBType, DuckResult, DuckRuntime, ExtractRow, ParamProxy, ParamString, QueryRef, QueryStatus, QueryType, ScalarValue, SqlFunction, StoreRef, ThenableRef, UseCacheTableHook, UseSqlHook, UseTableHook, UseValuesHook, ValidSQL } from '../core/reducks';

// ─── Hooks ───────────────────────────────────────────────────

const uid = (() => {
  let s = 0;
  return (prefix: string) => `${prefix}_${++s}_${Math.random().toString(36).slice(2, 6)}`;
})();

function useQueryRef(type: 'fragment' | 'table' | 'opfs'): UseTableHook {
  return ((queryFn: unknown, params: Record<string, unknown> = {}): Duckable => {
    const ready = depsResolved(params);
    const sqlStr = ready ? resolveSql(queryFn, params) : null;
    const pending = useMemo(() => new Duckable('pending', type, '', [], { id: uid('p') }), []);
    return useMemo(() => (sqlStr !== null ? makeRef(type, sqlStr, params) : pending), [sqlStr, pending]);
  }) as UseTableHook;
}

export const useSql: UseSqlHook = useQueryRef('fragment');
export const useTable: UseTableHook = useQueryRef('table');
export const useOPFS: UseTableHook = useQueryRef('opfs');

/** @deprecated Use useTable */
export const useLazyTable: UseTableHook = useQueryRef('table');
/** @deprecated Use useTable */
export const useCacheTable: UseTableHook = useQueryRef('table');

export function useStore<TSchema extends Record<string, DuckDBType>>(schema: TSchema): StoreRef<InferDuckTable<TSchema>> {
  const schemaKey = useMemo(() => JSON.stringify(Object.fromEntries(Object.entries(schema).sort(([a], [b]) => a.localeCompare(b)))), [schema]);
  return useMemo(() => makeStoreRef(schema), [schemaKey]);
}

export function useStatement<TVariable extends object>(): <TFixed extends object>(builder: (t: ParamProxy<TVariable & TFixed>) => string, fixed: TFixed) => (params: TVariable) => ThenableRef<unknown>;
export function useStatement<TVariable extends object, TFixed extends object = Record<string, unknown>>(
  builder: (t: ParamProxy<TVariable & TFixed>) => string,
  fixed: TFixed
): (params: TVariable) => ThenableRef<unknown>;
export function useStatement(builder?: unknown, fixed?: Record<string, unknown>): unknown {
  const pendingRef = useMemo(() => new Duckable('pending', 'fragment', '', [], { id: uid('p') }), []);
  if (builder === undefined) {
    return (b: unknown, f: Record<string, unknown>) => {
      const ready = depsResolved(f);
      return (params: Record<string, unknown>) => (ready ? sql(b as never, { ...f, ...params }) : pendingRef);
    };
  }
  const ready = depsResolved(fixed ?? {});
  return useCallback((params: Record<string, unknown>) => (ready ? sql(builder as never, { ...fixed, ...params }) : pendingRef), [ready, builder, fixed, pendingRef]);
}

export const useValues: UseValuesHook = ((data: Record<string, unknown>[], schema?: Record<string, string> | readonly string[]): Duckable => {
  const sqlStr = useMemo(() => toValuesSelect(data, schema), [JSON.stringify(data)]);
  return useMemo(() => new Duckable('ready', 'fragment', sqlStr, [], { id: uid('f') }), [sqlStr]);
}) as UseValuesHook;

export function useArrow(arrowTable: Table | null) {
  const pending = useMemo(() => new Duckable('pending', 'arrow', '', [], { id: uid('p') }), []);
  return useMemo(() => {
    if (!arrowTable) return pending;
    const id = uid('a');
    return new Duckable('idle', 'arrow', `FROM "${id}"`, [], { id, arrowTable });
  }, [arrowTable, pending]);
}

// ─── Deprecated pipeline compat ──────────────────────────────

/** @deprecated Import re from '#query/core/reducks' and call pipeline functions directly */
export type ReEngine<Thenable extends boolean = false> = {
  sql: Thenable extends true ? SqlFunction : UseSqlHook;
  table: UseTableHook;
  values: UseValuesHook;
};

/** @deprecated Import re from '#query/core/reducks' and call pipeline functions directly */
export type PipelineFn<TParams, TResult, Thenable extends boolean = false> = (re: ReEngine<Thenable>, params: TParams) => TResult;

/** @deprecated Wrap pipeline calls in useMemo instead */
export function usePipeline<TParams, TResult>(fn: PipelineFn<TParams, TResult>, params: TParams): TResult {
  return fn({ sql: useSql, table: useTable, values: useValues } as ReEngine, params);
}

/** @deprecated Use re directly */
export function pipeline<TParams, TResult>(fn: PipelineFn<TParams, TResult, true>, params: TParams): TResult {
  return fn({ sql, table: reTable, values: reValues } as unknown as ReEngine<true>, params);
}

// ─── useRows / useRow ────────────────────────────────────────

type UseQueryMeta = { isLoading: boolean; error: Error | undefined };

declare module '../core/reducks' {
  interface Duckable<TRow> {
    useRows(): [NonNullable<TRow>[], UseQueryMeta];
    useRows<TFill>(): [NonNullable<ApplyFill<TRow, TFill>>[], UseQueryMeta];
    useRows<R>(select: (rows: NonNullable<TRow>[]) => R): [R, UseQueryMeta];
    useRow(): [NonNullable<TRow> | null, UseQueryMeta];
    useRow<TFill>(): [NonNullable<ApplyFill<TRow, TFill>> | null, UseQueryMeta];
    useRow<R>(select: (row: NonNullable<TRow> | null) => R): [R, UseQueryMeta];
  }
}

export function useRows<T, TFill = never>(ref: Duckable<T>): [NonNullable<ApplyFill<T, TFill>>[], UseQueryMeta];
export function useRows<T, R>(ref: Duckable<T>, select: (rows: NonNullable<T>[]) => R): [R, UseQueryMeta];
export function useRows<T, R>(ref: Duckable<T>, select?: (rows: NonNullable<T>[]) => R): [NonNullable<T>[] | R, UseQueryMeta] {
  const [state, setState] = useState<{
    data: NonNullable<T>[];
    isLoading: boolean;
    error: Error | undefined;
  }>({ data: [], isLoading: true, error: undefined });

  useEffect(() => {
    setState({ data: [], isLoading: true, error: undefined });
    if (ref.status === 'pending') return;

    let cancelled = false;
    ref.rows().then(
      (data) => {
        if (!cancelled) setState({ data, isLoading: false, error: undefined });
      },
      (err) => {
        if (!cancelled) setState({ data: [], isLoading: false, error: err instanceof Error ? err : new Error(String(err)) });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [ref.id, ref.status]);

  const selectRef = useRef(select);
  selectRef.current = select;
  const result = useMemo(() => (selectRef.current ? selectRef.current(state.data) : state.data), [state.data]);

  return [result, { isLoading: state.isLoading, error: state.error }];
}

export function useRow<T, TFill = never>(ref: Duckable<T>): [NonNullable<ApplyFill<T, TFill>> | null, UseQueryMeta];
export function useRow<T, R>(ref: Duckable<T>, select: (row: NonNullable<T> | null) => R): [R, UseQueryMeta];
export function useRow<T, R>(ref: Duckable<T>, select?: (row: NonNullable<T> | null) => R): [NonNullable<T> | null | R, UseQueryMeta] {
  const [state, setState] = useState<{
    data: NonNullable<T> | null;
    isLoading: boolean;
    error: Error | undefined;
  }>({ data: null, isLoading: true, error: undefined });

  useEffect(() => {
    setState({ data: null, isLoading: true, error: undefined });
    if (ref.status === 'pending') return;

    let cancelled = false;
    ref.row().then(
      (data) => {
        if (!cancelled) setState({ data: data as NonNullable<T> | null, isLoading: false, error: undefined });
      },
      (err) => {
        if (!cancelled) setState({ data: null, isLoading: false, error: err instanceof Error ? err : new Error(String(err)) });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [ref.id, ref.status]);

  const selectRef = useRef(select);
  selectRef.current = select;
  const result = useMemo(() => (selectRef.current ? selectRef.current(state.data) : state.data), [state.data]);

  return [ result, { isLoading: state.isLoading, error: state.error }];
}

const useRowsRef = function <TRow, R>(this: Duckable<TRow>, select?: (rows: NonNullable<TRow>[]) => R) {
  return useRows(this, select as never);
} as Duckable<unknown>['useRows'];

const useRowRef = function <TRow, R>(this: Duckable<TRow>, select?: (row: NonNullable<TRow> | null) => R) {
  return useRow(this, select as never);
} as Duckable<unknown>['useRow'];

Duckable.prototype.useRows = useRowsRef;
Duckable.prototype.useRow = useRowRef;
