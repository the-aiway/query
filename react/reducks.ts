import { useEffect, useMemo, useState, useRef } from 'react';

import { DataCoordinator, type CacheEntry } from './DataCoordinator';
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

export type ReducksQueryFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (t: DepsToMap<TDeps>) => TQuery;

type NoCTE<T extends string> = Uppercase<T> extends `${string}WITH${string}` ? 'ERROR: CTEs (WITH clause) are NOT allowed in useFragment. Use useDerivedTable instead for complex queries.' : T;

export type ReducksFragmentFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (t: DepsToMap<TDeps>) => NoCTE<TQuery>;

/**
 * Interface for hooks that derive a new view or table from existing dependencies.
 */
export interface ReducksDerivedHook {
  /**
   * Registers a derived view/table using standard syntax.
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(slug: TSlug, queryFn: ReducksQueryFn<TDeps, TQuery>, dependencies?: TDeps): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a derived view/table using object syntax.
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(views: Record<TSlug, ReducksQueryFn<TDeps, TQuery> | TQuery>, dependencies?: TDeps): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;
}

/**
 * Interface specialized for useFragment, forbidding CTEs (WITH clause).
 */
export interface ReducksFragmentHook {
  /**
   * Registers a reactive SQL fragment using standard syntax.
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(slug: TSlug, queryFn: ReducksFragmentFn<TDeps, TQuery>, dependencies?: TDeps): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  /**
   * Registers a reactive SQL fragment using object syntax.
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(views: Record<TSlug, ReducksFragmentFn<TDeps, TQuery> | NoCTE<TQuery>>, dependencies?: TDeps): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;
}

/**
 * Interface for hooks that run aggregate queries and return data directly.
 * @template TReturnMode - 'single' returns the first row, 'slice' returns all rows.
 */
export interface ReducksAggregateHook<TReturnMode extends 'single' | 'slice'> {
  /**
   * Runs an aggregate query.
   */
  <TDeps extends (CacheEntry | null)[], TQuery extends string>(queryFn: ReducksQueryFn<TDeps, TQuery>, dependencies?: TDeps): (TReturnMode extends 'single' ? InferSQLStrict<TQuery>[number] : InferSQLStrict<TQuery>) | null;
}

function useDependencyCheck(dependencies: (CacheEntry | null)[]) {
  return useMemo(() => dependencies?.every((d) => d !== null && d.status === 'ready'), [dependencies]);
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

function useDuckDBQuery(queryFn: any, dependencies: any[] = []) {
  const { pool, coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);
  const [data, setData] = useState<any[] | null>(null);
  const lastData = useRef<any[] | null>(null);

  useEffect(() => {
    if (!allDepsReady || !query) return;

    let isMounted = true;

    pool
      .dump(query)
      .then((res: any) => {
        if (isMounted) {
          const plainData = JSON.parse(JSON.stringify(res));
          setData(plainData);
          lastData.current = plainData;
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('DuckDB query error:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [allDepsReady, query, coordinator, ...dependencies]);

  return { data, lastData };
}

// --- Exports ---

/**
 * Creates a reactive DuckDB table (materialized) from a SQL query.
 * Use Case: Creates a materialized table in DuckDB. Essential for caching expensive computations like aggregations or distincts.
 */
export const useDerivedTable: ReducksDerivedHook = (arg1: any, arg2?: any, arg3: any = []): any => {
  const [entry, setEntry] = useState<any>(null);
  const lastReadyEntry = useRef<any>(null);

  let slug: string;
  let queryFn: any;
  let dependencies: any[];

  if (typeof arg1 === 'string') {
    slug = arg1;
    queryFn = arg2;
    dependencies = arg3 || [];
  } else {
    [slug, queryFn] = Object.entries(arg1)[0] as [string, any];
    dependencies = arg2 || [];
  }

  if (typeof queryFn === 'string') {
    const sql = queryFn;
    queryFn = () => sql;
  }

  const { coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);

  useEffect(() => {
    if (!allDepsReady || !query) return;

    let isMounted = true;
    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);

    coordinator.requestTable(slug, query, depIds).then((newEntry) => {
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
  }, [allDepsReady, query, slug, coordinator, ...dependencies]);

  return entry?.status === 'ready' ? entry : lastReadyEntry.current;
};

/**
 * Executes an aggregate query and returns the first row of results.
 */
export const useAggregateResults: ReducksAggregateHook<'single'> = (queryFn: any, dependencies: any = []): any => {
  const { data, lastData } = useDuckDBQuery(queryFn, dependencies);
  return (data && data.length > 0 ? data[0] : null) || (lastData.current && lastData.current.length > 0 ? lastData.current[0] : null);
};

/**
 * Executes a query and returns all rows as an array.
 */
export const useSlice: ReducksAggregateHook<'slice'> = (queryFn: any, dependencies: any = []): any => {
  const { data, lastData } = useDuckDBQuery(queryFn, dependencies);
  return (data ?? null) || (lastData.current ?? null);
};

/**
 * Creates a reactive SQL fragment.
 */
export const useFragment: ReducksFragmentHook = (arg1: any, arg2?: any, arg3: any = []): any => {
  let slug: string;
  let queryFn: any;
  let dependencies: any[];

  if (typeof arg1 === 'string') {
    slug = arg1;
    queryFn = arg2;
    dependencies = arg3 || [];
  } else {
    [slug, queryFn] = Object.entries(arg1)[0] as [string, any];
    dependencies = arg2 || [];
  }

  if (typeof queryFn === 'string') {
    const sql = queryFn;
    queryFn = () => sql;
  }

  const { coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);

  return useMemo(() => {
    if (!allDepsReady || !query) return null;

    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);
    return coordinator.registerView(slug!, query, depIds, 'fragment');
  }, [allDepsReady, query, slug, coordinator, ...dependencies]);
};

// --- Materialization Boundary ---

/** Extract the phantom row type from a CacheEntry. */
export type ExtractRow<T> = T extends CacheEntry<any, infer R> ? R : unknown;

export function buildFromExpression(entry: CacheEntry): string {
  if (entry.type === 'fragment') {
    return `(${entry.query || ''})`;
  }
  return `'${entry.path}'`;
}

/**
 * Hook to materialize a single CacheEntry into a data array.
 */
export function useMaterialize(source: CacheEntry | null): any[] | null {
  const { pool } = useDuckDB();
  const [data, setData] = useState<any[] | null>(null);
  const lastData = useRef<any[] | null>(null);

  const isReady = source !== null && source.status === 'ready';

  useEffect(() => {
    if (!isReady || !source) return;
    let isMounted = true;

    const fromExpr = buildFromExpression(source);

    pool
      .dump(`SELECT * FROM ${fromExpr}`)
      .then((res: any) => {
        if (isMounted) {
          const plainData = JSON.parse(JSON.stringify(res));
          setData(plainData);
          lastData.current = plainData;
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Materialize error:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isReady, source, pool]);

  return data ?? lastData.current;
}

/**
 * Hook to materialize multiple CacheEntries in parallel into a keyed data record.
 */
export function useMultiMaterialize(sources: Record<string, CacheEntry | null>): Record<string, any[]> | null {
  const { pool } = useDuckDB();
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

        try {
          const res = await pool.dump(`SELECT * FROM ${fromExpr}`);
          return [key, JSON.parse(JSON.stringify(res))] as const;
        } catch (err) {
          if (isMounted) console.error(`MultiMaterialize error for ${key}:`, err);
          return [key, []] as const;
        }
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
  }, [allReady, sourceKey, pool]);

  return results ?? lastResults.current;
}

// --- Inline Tests ---

export function _typeCheck() {
  // Test 1: Basic Table
  const t1 = useDerivedTable('table_1', () => 'SELECT 1', []);
  // t1 should be CacheEntry<'table_1'> | null
  t1 satisfies CacheEntry<'table_1'> | null;

  // Test 2: Dependency Inference
  const t2 = useFragment(
    'view_1',
    (t) => {
      // t.table_1 should exist and be a string
      const x = t.table_1;
      return `SELECT * FROM ${x}`;
    },
    [t1]
  );
  t2 satisfies CacheEntry<'view_1'> | null;

  // Test 3: Multiple Dependencies
  const t3 = useFragment('view_2', (t) => `SELECT * FROM ${t.table_1} JOIN ${t.view_1}`, [t1, t2]);
  t3 satisfies CacheEntry<'view_2'> | null;

  // Test 4: Verify types with satisfies
  const _test1: CacheEntry<'table_1'> | null = t1;

  // Test 5: Verify 't' object type inference failure
  useFragment(
    'view_fail',
    (t) => {
      // @ts-expect-error - t.non_existent should be an error
      return `SELECT * FROM ${t.non_existent}`;
    },
    [t1]
  );

  // Test 6: Object Syntax
  const objView = useFragment(
    {
      view_4: (t) => `SELECT * FROM ${t.view_2}`,
    },
    [t3]
  );
  objView satisfies CacheEntry<'view_4'> | null;

  // Test 7: Aggregate Results with InferSQL
  const agg = useAggregateResults((t) => `SELECT count(*)::int as total FROM ${t.table_1}`, [t1]);
  // Verify return type inference
  agg satisfies { total: number } | null;

  // Test 8: Aggregate Results without deps
  const aggNoParams = useAggregateResults((t) => `SELECT 1::int as one`);
  aggNoParams satisfies { one: number } | null;

  // Test 9: Fragment Usage
  const fragment = useFragment(
    {
      active_users: (t) => `SELECT * FROM ${t.table_1} WHERE active = true`,
    },
    [t1]
  );
  fragment satisfies CacheEntry<'active_users'> | null;

  const aggFragment = useAggregateResults((t) => `SELECT count(*) as cnt FROM ${t.active_users}`, [fragment]);

  // Test 10: Object syntax with no dependencies (function value)
  const noDeps = useDerivedTable({ standalone: () => `SELECT 1::int as x` });
  noDeps satisfies CacheEntry<'standalone'> | null;

  // Test 11: Object syntax with no dependencies (plain string value)
  const noDepsStr = useDerivedTable({ standalone_str: `SELECT 1::int as y` });
  noDepsStr satisfies CacheEntry<'standalone_str'> | null;

  // --- Phantom Row Type Tests ---

  // Test 13: Phantom row type is inferred from SQL
  const typed = useDerivedTable('typed_t', () => `SELECT count(*)::int as total, name FROM t`, []);
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
  const xxx = useFragment(
    {
      dep_frag: (t) => `SELECT count(*)::int as cnt FROM ${t.typed_t} WHERE ${t.eq('cnt', 123)} and startsWith(${t.escape('name')})`,
    },
    [typed]
  );
  type DepRow = ExtractRow<NonNullable<typeof depFrag>>;
  null as unknown as DepRow satisfies { cnt: number };
}
