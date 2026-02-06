import { useEffect, useMemo, useState, useRef } from 'react';

import { DataCoordinator, type CacheEntry } from './DataCoordinator';
import { useDuckDB } from './DuckDBProvider';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';

// Global coordinator instance
let globalCoordinator: DataCoordinator | null = null;

function getCoordinator(pool: any) {
  if (!globalCoordinator) globalCoordinator = new DataCoordinator(pool);
  return globalCoordinator;
}

// Helper to convert tuple of CacheEntries to an object type
type DepsToMap<T extends (CacheEntry | null)[]> = {
  [K in T[number] as K extends CacheEntry<infer S> ? S : never]: string;
};

// --- Shared Types & Helpers ---

// type QueryFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (
//   t: DepsToMap<TDeps>
// ) => TQuery;

function normalizeArgs(arg1: any, arg2: any, arg3: any, arg4: any) {
  let slug: string | undefined;
  let queryFn: any;
  let params: Record<string, unknown> = {};
  let dependencies: any[] = [];

  if (typeof arg1 === 'string') {
    // Syntax A: (slug, query, params, deps)
    slug = arg1;
    queryFn = arg2;
    params = arg3;
    dependencies = arg4 || [];
  } else {
    // Syntax B: ({ slug: query }, deps, params?)
    const entries = Object.entries(arg1);
    if (entries.length !== 1) {
      throw new Error('useDerivedView supports exactly one view in object syntax');
    }
    [slug, queryFn] = entries[0] as [string, any];
    dependencies = arg2;
    params = arg3 || {};
  }

  return { slug, queryFn, params, dependencies };
}

function useCoordinatorSubscription(coordinator: DataCoordinator) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return coordinator.subscribe(() => setTick((t) => t + 1));
  }, [coordinator]);
  return tick;
}

function useDependencyCheck(dependencies: (CacheEntry | null)[]) {
  return useMemo(() => dependencies.every((d) => d !== null && d.status === 'ready'), [dependencies]);
}

function useQueryBuilder<TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: (t: DepsToMap<TDeps>) => TQuery, dependencies: TDeps) {
  return useMemo(() => {
    const t: Record<string, string> = {};
    dependencies.forEach((dep) => {
      if (dep) {
        t[dep.slug] = dep.type === 'view' ? dep.id : `read_parquet('${dep.path}')`;
      }
    });
    return queryFn(t as DepsToMap<TDeps>);
  }, [queryFn, dependencies]);
}

// --- Overload Signatures ---

// 1. Standard Syntax
export function useDerivedView<TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(slug: TSlug, queryFn: (t: DepsToMap<TDeps>) => TQuery, params: Record<string, unknown>, dependencies?: TDeps): CacheEntry<TSlug> | null;

// 2. Object Syntax
export function useDerivedView<TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(views: Record<TSlug, (t: DepsToMap<TDeps>) => TQuery>, dependencies: TDeps, params?: Record<string, unknown>): CacheEntry<TSlug> | null;

// --- Implementation ---

export function useDerivedView(arg1: any, arg2: any, arg3: any = {}, arg4: any = []): any {
  const { pool } = useDuckDB();
  const coordinator = getCoordinator(pool);
  const { slug, queryFn, params, dependencies } = normalizeArgs(arg1, arg2, arg3, arg4);

  const tick = useCoordinatorSubscription(coordinator);
  const allDepsReady = useDependencyCheck(dependencies);
  const query = useQueryBuilder(queryFn, dependencies);

  const entry = useMemo(() => {
    if (!allDepsReady || !query) return null;
    if (Object.values(params).some((v) => v === undefined)) return null;

    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);
    return coordinator.registerView(slug!, query, params, depIds);
  }, [allDepsReady, query, slug, JSON.stringify(params), coordinator, tick, ...dependencies]);

  return entry;
}

// --- Overload Signatures ---

// 1. Standard Syntax
export function useDerivedTable<TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(slug: TSlug, queryFn: (t: DepsToMap<TDeps>) => TQuery, params: Record<string, unknown>, dependencies?: TDeps): CacheEntry<TSlug> | null;

// 2. Object Syntax
export function useDerivedTable<TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(views: Record<TSlug, (t: DepsToMap<TDeps>) => TQuery>, dependencies: TDeps, params?: Record<string, unknown>): CacheEntry<TSlug> | null;

// --- Implementation ---

export function useDerivedTable(arg1: any, arg2: any, arg3: any = {}, arg4: any = []): any {
  const { pool } = useDuckDB();
  const [entry, setEntry] = useState<any>(null);
  const lastReadyEntry = useRef<any>(null);
  const coordinator = getCoordinator(pool);
  const { slug, queryFn, params, dependencies } = normalizeArgs(arg1, arg2, arg3, arg4);

  const tick = useCoordinatorSubscription(coordinator);
  const allDepsReady = useDependencyCheck(dependencies);
  const query = useQueryBuilder(queryFn, dependencies);

  useEffect(() => {
    if (!allDepsReady || !query) return;
    if (Object.values(params).some((v) => v === undefined)) return;

    let isMounted = true;
    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);

    coordinator.requestTable(slug, query, params, depIds).then((newEntry) => {
      if (isMounted) {
        setEntry(newEntry);
        if (newEntry.status === 'ready') {
          lastReadyEntry.current = newEntry;
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [allDepsReady, query, slug, JSON.stringify(params), coordinator, tick, ...dependencies]);

  return entry?.status === 'ready' ? entry : lastReadyEntry.current;
}

// --- Overload Signatures for useAggregateResults ---

export function useAggregateResults<TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: (t: DepsToMap<TDeps>) => TQuery, params: Record<string, unknown>, dependencies?: TDeps): InferSQLStrict<TQuery>[number] | null;

export function useAggregateResults<TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: (t: DepsToMap<TDeps>) => TQuery, dependencies: TDeps): InferSQLStrict<TQuery>[number] | null;

// --- Implementation ---

export function useAggregateResults(queryFn: any, arg2: any = {}, arg3: any = []): any {
  const { pool } = useDuckDB();
  const [data, setData] = useState<any[] | null>(null);
  const lastData = useRef<any[] | null>(null);
  const coordinator = getCoordinator(pool);

  // Normalize args for aggregate (slightly different than views)
  let params: Record<string, unknown> = {};
  let dependencies: any[] = [];

  if (Array.isArray(arg2)) {
    dependencies = arg2;
    params = {};
  } else {
    params = arg2;
    dependencies = arg3 || [];
  }

  const tick = useCoordinatorSubscription(coordinator);
  const allDepsReady = useDependencyCheck(dependencies);
  const query = useQueryBuilder(queryFn, dependencies);

  useEffect(() => {
    if (!allDepsReady || !query) return;
    if (Object.values(params).some((v) => v === undefined)) return;

    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);
    const viewSqls = coordinator.resolveViewDependencies(depIds);
    const viewPrefix = viewSqls.length > 0 ? viewSqls.join('\n') + '\n' : '';

    let isMounted = true;
    let finalQuery = query;
    for (const [k, v] of Object.entries(params)) {
      let val = v;
      if (v instanceof Date) {
        val = `'${v.toISOString()}'`;
      } else if (typeof v === 'string') {
        val = `'${v}'`;
      }
      finalQuery = finalQuery.split(`$${k}`).join(String(val));
    }

    pool.dump(viewPrefix + finalQuery).then((res) => {
      if (isMounted) {
        const plainData = JSON.parse(JSON.stringify(res));
        setData(plainData);
        lastData.current = plainData;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [allDepsReady, query, JSON.stringify(params), coordinator, tick, ...dependencies]);

  return (data && data.length > 0 ? data[0] : null) || (lastData.current && lastData.current.length > 0 ? lastData.current[0] : null);
}

// --- Inline Tests ---

function typeCheck() {
  // Test 1: Basic Table
  const t1 = useDerivedTable('table_1', () => 'SELECT 1', {}, []);
  // t1 should be CacheEntry<'table_1'> | null
  t1 satisfies CacheEntry<'table_1'> | null;
  // @ts-expect-error - t1 is CacheEntry<'table_1'> | null, not 'table_2'
  t1 satisfies CacheEntry<'table_2'> | null;

  // Test 2: Dependency Inference
  const t2 = useDerivedView(
    'view_1',
    (t) => {
      // t.table_1 should exist and be a string
      const x = t.table_1;
      return `SELECT * FROM ${x}`;
    },
    {},
    [t1]
  );
  t2 satisfies CacheEntry<'view_1'> | null;

  // Test 3: Multiple Dependencies
  const t3 = useDerivedView('view_2', (t) => `SELECT * FROM ${t.table_1} JOIN ${t.view_1}`, {}, [t1, t2]);
  t3 satisfies CacheEntry<'view_2'> | null;

  // Test 4: Verify types with satisfies
  // We can't runtime check types easily here without a helper,
  // but we can assert the return type of the hooks.

  const _test1: CacheEntry<'table_1'> | null = t1;

  // Test 5: Verify 't' object type inference failure
  useDerivedView(
    'view_fail',
    (t) => {
      // @ts-expect-error - t.non_existent should be an error
      return `SELECT * FROM ${t.non_existent}`;
    },
    {},
    [t1]
  );

  // Test 6: Object Syntax
  const objView = useDerivedView(
    {
      view_4: (t) => `SELECT * FROM ${t.view_2}`,
    },
    [t3]
  );
  objView satisfies CacheEntry<'view_4'> | null;
  // Test 6: Object Syntax
  const objView3 = useDerivedView(
    {
      view_5: (t) => `SELECT * FROM ${t.view_4} JOIN ${t.table_1}`,
    },
    [objView, t1]
  );

  // Test 7: Aggregate Results with InferSQL
  const agg = useAggregateResults((t) => `SELECT count(*)::int as total FROM ${t.table_1}`, {}, [t1]);
  // Verify return type inference
  agg satisfies { total: number } | null;
  // @ts-expect-error - 'wrong' field does not exist
  agg satisfies { wrong: number } | null;

  // Test 8: Aggregate Results without params
  const aggNoParams = useAggregateResults((t) => `SELECT 1::int as one`, []);
  aggNoParams satisfies { one: number } | null;
  const agg2 = useAggregateResults((t) => `SELECT count(*)::int as total FROM ${t.table_1}`, [t1]);
  const agg3 = useAggregateResults(
    (t) => `SELECT count(*)::int as total, lol::INT as xxx WHERE id=$id FROM ${t.table_1}`,
    { id: 12 },
    [t1]
  );
  agg3 satisfies { total: number; xxx: number } | null;
}
