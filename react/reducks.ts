import { useEffect, useMemo, useState, useRef } from 'react';

function escapeSQLString(value: string): string {
  return value.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

import { DataCoordinator, type CacheEntry, substituteParams } from './DataCoordinator';
import { buildSubstitutionMap } from './resolveDependencies';
import { useDuckDB } from './DuckDBProvider';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';

// Global coordinator instance
let globalCoordinator: DataCoordinator | null = null;

export function getCoordinator(pool: any) {
  if (!globalCoordinator) globalCoordinator = new DataCoordinator(pool);
  return globalCoordinator;
}

// Helper to convert tuple of CacheEntries to an object type
type DepsToMap<T extends (CacheEntry | null)[]> = {
  [K in T[number] as K extends CacheEntry<infer S> ? S : never]: string;
};

// --- Shared Types & Helpers ---

// --- Shared Types & Helpers ---

export type ReducksParams = Record<string, unknown>;

export type ReducksQueryFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (t: DepsToMap<TDeps>) => TQuery;

type NoCTE<T extends string> = Uppercase<T> extends `${string}WITH${string}` ? 'ERROR: CTEs (WITH clause) are NOT allowed in useFragment. Use useDerivedTable instead for complex queries.' : T;

export type ReducksFragmentFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (t: DepsToMap<TDeps>) => NoCTE<TQuery>;

/**
 * Interface for hooks that derive a new view or table from existing dependencies.
 * Supports two syntaxes:
 * 1. Standard: (slug, queryFn, params, dependencies)
 * 2. Object: ({ [slug]: queryFn }, dependencies, params)
 */
export interface ReducksDerivedHook {
  /**
   * Registers a derived view/table using standard syntax.
   * @param slug - Unique identifier for the view/table
   * @param queryFn - Function that returns the SQL query, receiving a map of dependency slugs.
   * @param params - Parameters to be substituted into the query (e.g. $id).
   * @param dependencies - List of dependent CacheEntries (views or parquets).
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(slug: TSlug, queryFn: ReducksQueryFn<TDeps, TQuery>, params: ReducksParams, dependencies?: TDeps): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a derived view/table using object syntax with dependencies.
   * @param views - Object with a single key (slug) and value (queryFn or SQL string).
   * @param dependencies - List of dependent CacheEntries (views or parquets).
   * @param params - Parameters to be substituted into the query (e.g. $id).
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(views: Record<TSlug, ReducksQueryFn<TDeps, TQuery> | TQuery>, dependencies: TDeps, params?: ReducksParams): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a derived view/table using object syntax with params but no dependencies.
   * @param views - Object with a single key (slug) and value (queryFn or SQL string).
   * @param params - Parameters to be substituted into the query (e.g. $id).
   */
  <TSlug extends string, TQuery extends string>(views: Record<TSlug, ReducksQueryFn<[], TQuery> | TQuery>, params: ReducksParams): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a derived view/table using object syntax with no dependencies or params.
   * @param views - Object with a single key (slug) and value (queryFn or SQL string).
   */
  <TSlug extends string, TQuery extends string>(views: Record<TSlug, ReducksQueryFn<[], TQuery> | TQuery>): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;
}

/**
 * Interface specialized for useFragment, forbidding CTEs (WITH clause).
 */
export interface ReducksFragmentHook {
  /**
   * Registers a reactive SQL fragment using standard syntax.
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(slug: TSlug, queryFn: ReducksFragmentFn<TDeps, TQuery>, params: ReducksParams, dependencies?: TDeps): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a reactive SQL fragment using object syntax with dependencies.
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(views: Record<TSlug, ReducksFragmentFn<TDeps, TQuery> | NoCTE<TQuery>>, dependencies: TDeps, params?: ReducksParams): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a reactive SQL fragment using object syntax with params but no dependencies.
   */
  <TSlug extends string, TQuery extends string>(views: Record<TSlug, ReducksFragmentFn<[], TQuery> | NoCTE<TQuery>>, params: ReducksParams): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a reactive SQL fragment using object syntax with no dependencies or params.
   */
  <TSlug extends string, TQuery extends string>(views: Record<TSlug, ReducksFragmentFn<[], TQuery> | NoCTE<TQuery>>): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;
}

/**
 * Interface for hooks that run aggregate queries and return data directly.
 * @template TReturnMode - 'single' returns the first row, 'slice' returns all rows.
 */
export interface ReducksAggregateHook<TReturnMode extends 'single' | 'slice'> {
  /**
   * Runs an aggregate query.
   * @param queryFn - Function that returns the SQL query.
   * @param params - Parameters to be substituted into the query.
   * @param dependencies - List of dependent CacheEntries.
   */
  <TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: ReducksQueryFn<TDeps, TQuery>, params: ReducksParams, dependencies?: TDeps): (TReturnMode extends 'single' ? InferSQLStrict<TQuery>[number] : InferSQLStrict<TQuery>) | null;

  /**
   * Runs an aggregate query without parameters.
   * @param queryFn - Function that returns the SQL query.
   * @param dependencies - List of dependent CacheEntries.
   */
  <TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: ReducksQueryFn<TDeps, TQuery>, dependencies: TDeps): (TReturnMode extends 'single' ? InferSQLStrict<TQuery>[number] : InferSQLStrict<TQuery>) | null;
}

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
    const entries = Object.entries(arg1);
    if (entries.length !== 1) {
      throw new Error('useDerivedView supports exactly one view in object syntax');
    }
    [slug, queryFn] = entries[0] as [string, any];
    if (Array.isArray(arg2)) {
      // Syntax B: ({ slug: query }, deps, params?)
      dependencies = arg2;
      params = arg3 || {};
    } else {
      // Syntax C: ({ slug: query }, params)
      params = arg2 || {};
      dependencies = [];
    }
  }

  // Normalize: if queryFn is a plain SQL string, wrap it in a function
  if (typeof queryFn === 'string') {
    const sql = queryFn;
    queryFn = () => sql;
  }

  return { slug, queryFn, params, dependencies };
}

function useDependencyCheck(dependencies: (CacheEntry | null)[]) {
  return useMemo(() => dependencies.every((d) => d !== null && d.status === 'ready'), [dependencies]);
}

function useQueryBuilder<TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: ReducksQueryFn<TDeps, TQuery>, dependencies: TDeps) {
  return useMemo(() => {
    const readyDeps = dependencies.filter((d): d is CacheEntry => d !== null);
    const depIds = readyDeps.map((d) => d.id);
    const t = buildSubstitutionMap(readyDeps, depIds);
    return queryFn(t as DepsToMap<TDeps>);
  }, [queryFn, dependencies]);
}

function useReducksBase<TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: ReducksQueryFn<TDeps, TQuery>, dependencies: TDeps) {
  const { pool } = useDuckDB();
  const coordinator = getCoordinator(pool);
  const allDepsReady = useDependencyCheck(dependencies);
  const query = useQueryBuilder(queryFn, dependencies);

  return { pool, coordinator, allDepsReady, query };
}

function useDuckDBQuery(queryFn: any, arg2: any, arg3: any) {
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

  const { pool, coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);
  const [data, setData] = useState<any[] | null>(null);
  const lastData = useRef<any[] | null>(null);

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
        val = `'${escapeSQLString(v)}'`;
      }
      finalQuery = finalQuery.split(`$${k}`).join(String(val));
    }

    pool.dump(viewPrefix + finalQuery).then((res: any) => {
      if (isMounted) {
        const plainData = JSON.parse(JSON.stringify(res));
        setData(plainData);
        lastData.current = plainData;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [allDepsReady, query, JSON.stringify(params), coordinator, ...dependencies]);

  return { data, lastData };
}

// --- Exports ---

/**
 * Creates a reactive DuckDB view from a SQL query.
 * Use Case: Creates a lightweight, virtual view in DuckDB. Ideal for intermediate transformations, filtering, or joining data without materialization costs.
 *
 * @deprecated Use `useFragment` instead. Views are connection-local (TEMP VIEW),
 * which causes "table not found" errors across pooled connections. Fragments are
 * inlined directly and avoid this class of bugs entirely.
 *
 * @example
 * ```ts
 * const adults = useFragment({ adults: (t) => `SELECT * FROM ${t.users} WHERE age >= 18` }, [users]);
 * ```
 */
export const useDerivedView: ReducksDerivedHook = (arg1: any, arg2?: any, arg3: any = {}, arg4: any = []): any => {
  const { slug, queryFn, params, dependencies } = normalizeArgs(arg1, arg2, arg3, arg4);
  const { coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);

  return useMemo(() => {
    if (!allDepsReady || !query) return null;
    if (Object.values(params).some((v) => v === undefined)) return null;

    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);
    return coordinator.registerView(slug!, query, params, depIds);
  }, [allDepsReady, query, slug, JSON.stringify(params), coordinator, ...dependencies]);
};

/**
 * Creates a reactive DuckDB table (materialized) from a SQL query.
 * Use Case: Creates a materialized table in DuckDB. Essential for caching expensive computations like aggregations or distincts.
 *
 * @example
 * ```ts
 * const stats = useDerivedTable({ stats: (t) => `SELECT city, count(*) as c FROM ${t.users} GROUP BY city` }, [users]);
 * ```
 */
export const useDerivedTable: ReducksDerivedHook = (arg1: any, arg2?: any, arg3: any = {}, arg4: any = []): any => {
  const [entry, setEntry] = useState<any>(null);
  const lastReadyEntry = useRef<any>(null);
  const { slug, queryFn, params, dependencies } = normalizeArgs(arg1, arg2, arg3, arg4);
  const { coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);

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
  }, [allDepsReady, query, slug, JSON.stringify(params), coordinator, ...dependencies]);

  return entry?.status === 'ready' ? entry : lastReadyEntry.current;
};

/**
 * Executes an aggregate query and returns the first row of results.
 * Use Case: Fetches a single row of data, useful for scalar values, counts, or single-entity details.
 *
 * @example
 * ```ts
 * const total = useAggregateResults((t) => `SELECT count(*)::int as c FROM ${t.users}`, [users]);
 * ```
 */
export const useAggregateResults: ReducksAggregateHook<'single'> = (queryFn: any, arg2: any = {}, arg3: any = []): any => {
  const { data, lastData } = useDuckDBQuery(queryFn, arg2, arg3);
  return (data && data.length > 0 ? data[0] : null) || (lastData.current && lastData.current.length > 0 ? lastData.current[0] : null);
};

/**
 * Executes a query and returns all rows as an array.
 * Use Case: Fetches a dataset as an array of objects. Used for populating lists, charts, or grids.
 *
 * @example
 * ```ts
 * const list = useSlice((t) => `SELECT name, age FROM ${t.users} LIMIT 100`, [users]);
 * ```
 */
export const useSlice: ReducksAggregateHook<'slice'> = (queryFn: any, arg2: any = {}, arg3: any = []): any => {
  const { data, lastData } = useDuckDBQuery(queryFn, arg2, arg3);
  return (data ?? null) || (lastData.current ?? null);
};

/**
 * Creates a reactive SQL fragment.
 * Use Case: Creates a reusable SQL snippet that is inlined into dependent queries.
 * Ideal for encapsulating logic without creating the overhead of a standard View.
 * Parameters are baked into the fragment at runtime.
 *
 * @example
 * ```ts
 * const activeUsers = useFragment({ active: (t) => `SELECT * FROM ${t.users} WHERE last_login > NOW() - INTERVAL 7 DAY` }, [users]);
 * const count = useAggregateResults((t) => `SELECT count(*) FROM ${t.active}`, [activeUsers]);
 * // Becomes: SELECT count(*) FROM (SELECT * FROM users_... WHERE last_login > ...)
 * ```
 */
export const useFragment: ReducksFragmentHook = (arg1: any, arg2?: any, arg3: any = {}, arg4: any = []): any => {
  const { slug, queryFn, params, dependencies } = normalizeArgs(arg1, arg2, arg3, arg4);
  const { coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);

  return useMemo(() => {
    if (!allDepsReady || !query) return null;
    if (Object.values(params).some((v) => v === undefined)) return null;

    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);
    return coordinator.registerView(slug!, query, params, depIds, 'fragment');
  }, [allDepsReady, query, slug, JSON.stringify(params), coordinator, ...dependencies]);
};

// --- Materialization Boundary ---

/** Extract the phantom row type from a CacheEntry. */
export type ExtractRow<T> = T extends CacheEntry<any, infer R> ? R : unknown;

export function buildFromExpression(entry: CacheEntry): string {
  if (entry.type === 'fragment') {
    return `(${substituteParams(entry.query || '', entry.params || {})})`;
  }
  if (entry.type === 'view') {
    return entry.id;
  }
  return `'${entry.path}'`;
}

/**
 * Hook to materialize a single CacheEntry into a data array.
 * Executes `SELECT * FROM <source>` and returns the rows, keeping the last
 * successful result while a refresh is in progress.
 */
export function useMaterialize(source: CacheEntry | null): any[] | null {
  const { pool } = useDuckDB();
  const coordinator = getCoordinator(pool);
  const [data, setData] = useState<any[] | null>(null);
  const lastData = useRef<any[] | null>(null);

  const isReady = source !== null && source.status === 'ready';

  useEffect(() => {
    if (!isReady || !source) return;
    let isMounted = true;

    const fromExpr = buildFromExpression(source);
    const viewSqls = coordinator.resolveViewDependencies(source.dependencies);
    const viewPrefix = viewSqls.length > 0 ? viewSqls.join('\n') + '\n' : '';

    pool.dump(`${viewPrefix}SELECT * FROM ${fromExpr}`).then((res: any) => {
      if (isMounted) {
        const plainData = JSON.parse(JSON.stringify(res));
        setData(plainData);
        lastData.current = plainData;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isReady, source, coordinator, pool]);

  return data ?? lastData.current;
}

/**
 * Hook to materialize multiple CacheEntries in parallel into a keyed data record.
 */
export function useMultiMaterialize(sources: Record<string, CacheEntry | null>): Record<string, any[]> | null {
  const { pool } = useDuckDB();
  const coordinator = getCoordinator(pool);
  const [results, setResults] = useState<Record<string, any[]> | null>(null);
  const lastResults = useRef<Record<string, any[]> | null>(null);

  const entries = Object.entries(sources);
  const allReady = entries.every(([, s]) => s !== null && s.status === 'ready');
  const sourceKey = entries.map(([k, v]) => `${k}:${v?.id}`).join(',');

  useEffect(() => {
    if (!allReady) return;
    let isMounted = true;

    Promise.all(
      entries.map(async ([key, entry]) => {
        if (!entry) return [key, []] as const;

        const fromExpr = buildFromExpression(entry);
        const viewSqls = coordinator.resolveViewDependencies(entry.dependencies);
        const viewPrefix = viewSqls.length > 0 ? viewSqls.join('\n') + '\n' : '';

        const res = await pool.dump(`${viewPrefix}SELECT * FROM ${fromExpr}`);
        return [key, JSON.parse(JSON.stringify(res))] as const;
      })
    ).then((pairs) => {
      if (isMounted) {
        const obj = Object.fromEntries(pairs) as Record<string, any[]>;
        setResults(obj);
        lastResults.current = obj;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [allReady, sourceKey, coordinator, pool]);

  return results ?? lastResults.current;
}

// --- Inline Tests ---

export function _typeCheck() {
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
  const agg3 = useAggregateResults((t) => `SELECT count(*)::int as total, lol::INT as xxx WHERE id=$id FROM ${t.table_1}`, { id: 12 }, [t1]);
  agg3 satisfies { total: number; xxx: number } | null;

  // Test 9: Fragment Usage
  const fragment = useFragment(
    {
      active_users: (t) => `SELECT * FROM ${t.table_1} WHERE active = true`,
    },
    [t1]
  );
  fragment satisfies CacheEntry<'active_users'> | null;

  const aggFragment = useAggregateResults((t) => `SELECT count(*) as cnt FROM ${t.active_users}`, [fragment]);

  // Should infer types correctly (assuming table_1 structure, but here we just check valid TS compilation)

  // Test 10: Object syntax with no dependencies or params (function value)
  const noDeps = useDerivedTable({ standalone: () => `SELECT 1::int as x` });
  noDeps satisfies CacheEntry<'standalone'> | null;

  // Test 11: Object syntax with no dependencies or params (plain string value)
  const noDepsStr = useDerivedTable({ standalone_str: `SELECT 1::int as y` });
  noDepsStr satisfies CacheEntry<'standalone_str'> | null;

  // Test 12: Object syntax with params but no dependencies (plain string value)
  const withParamsStr = useDerivedTable({ parameterized: `SELECT * FROM foo WHERE id = $id` }, { id: 42 });
  withParamsStr satisfies CacheEntry<'parameterized'> | null;

  // --- Phantom Row Type Tests ---

  // Test 13: Phantom row type is inferred from SQL
  const typed = useDerivedTable('typed_t', () => `SELECT count(*)::int as total, name FROM t`, {}, []);
  type TypedRow = ExtractRow<NonNullable<typeof typed>>;
  // total is number (count()::int), name is unknown (bare identifier)
  null as unknown as TypedRow satisfies { total: number; name: unknown };

  // Test 14: Phantom type carries through fragments
  const typedFrag = useFragment({
    typed_frag: () => `SELECT sum(cost)::int as total_cost, carrier as best FROM t`,
  });
  type FragRow = ExtractRow<NonNullable<typeof typedFrag>>;
  null as unknown as FragRow satisfies { total_cost: number; best: unknown };

  // Test 15: Phantom type works with dependencies (template literal interpolation)
  const depFrag = useFragment(
    {
      dep_frag: (t) => `SELECT count(*)::int as cnt FROM ${t.typed_t}`,
    },
    [typed]
  );
  type DepRow = ExtractRow<NonNullable<typeof depFrag>>;
  null as unknown as DepRow satisfies { cnt: number };

  // Test 16: CacheEntry with phantom type still satisfies CacheEntry<slug>
  typed satisfies CacheEntry<'typed_t'> | null;
  typedFrag satisfies CacheEntry<'typed_frag'> | null;
}
