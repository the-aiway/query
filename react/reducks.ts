import { useEffect, useMemo, useState, useRef } from 'react';

import { DataCoordinator, type CacheEntry } from './DataCoordinator';
import { buildSubstitutionMap } from './resolveDependencies';
import { useDuckDB } from './DuckDBProvider';
import type { ConnectionPool } from '../duck/ConnectionPool';
import type { InferSQLStrict } from '../duck/inferSqlReturntype';

let globalCoordinator: DataCoordinator | null = null;

export function getCoordinator(pool: ConnectionPool) {
  if (!globalCoordinator) globalCoordinator = new DataCoordinator(pool);
  return globalCoordinator;
}

// --- Types ---

type DepsToMap<T extends (CacheEntry | null)[]> = {
  [K in T[number] as K extends CacheEntry<infer S> ? S : never]: string;
};

export type SqlQueryFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (t: DepsToMap<TDeps>) => TQuery;

type NoCTE<T extends string> = Uppercase<T> extends `${string}WITH${string}`
  ? 'ERROR: CTEs (WITH clause) are NOT allowed in useSql. Use useTable instead.'
  : T;

export type SqlFragmentFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (t: DepsToMap<TDeps>) => NoCTE<TQuery>;

export type ExtractRow<T> = T extends CacheEntry<infer _S, infer R> ? R : unknown;

// --- Hook Interfaces ---

export interface UseTableHook {
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(
    slug: TSlug, queryFn: SqlQueryFn<TDeps, TQuery>, dependencies?: TDeps
  ): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(
    views: Record<TSlug, SqlQueryFn<TDeps, TQuery> | TQuery>, dependencies?: TDeps
  ): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;
}

export interface UseSqlHook {
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(
    slug: TSlug, queryFn: SqlFragmentFn<TDeps, TQuery>, dependencies?: TDeps
  ): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;

  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(
    views: Record<TSlug, SqlFragmentFn<TDeps, TQuery> | NoCTE<TQuery>>, dependencies?: TDeps
  ): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;
}

interface MaterializeRowsHook {
  <TEntry extends CacheEntry | null>(source: TEntry): ExtractRow<NonNullable<TEntry>>[] | null;

  <TDeps extends (CacheEntry | null)[], TQuery extends string>(
    queryFn: SqlQueryFn<TDeps, TQuery>, dependencies?: TDeps
  ): InferSQLStrict<TQuery> | null;
}

interface MaterializeRowHook {
  <TEntry extends CacheEntry | null>(source: TEntry): ExtractRow<NonNullable<TEntry>> | null;

  <TDeps extends (CacheEntry | null)[], TQuery extends string>(
    queryFn: SqlQueryFn<TDeps, TQuery>, dependencies?: TDeps
  ): InferSQLStrict<TQuery>[number] | null;
}

interface MaterializeConcurrentHook {
  <T extends Record<string, CacheEntry | null>>(sources: T): {
    [K in keyof T]: ExtractRow<NonNullable<T[K]>>[];
  } | null;
}

// --- Internal Helpers ---

function parseSlugArgs(arg1: unknown, arg2?: unknown, arg3?: unknown) {
  let slug: string;
  let queryFn: unknown;
  let dependencies: (CacheEntry | null)[];

  if (typeof arg1 === 'string') {
    slug = arg1;
    queryFn = arg2;
    dependencies = (arg3 as (CacheEntry | null)[]) || [];
  } else {
    const entries = Object.entries(arg1 as Record<string, unknown>);
    [slug, queryFn] = entries[0]!;
    dependencies = (arg2 as (CacheEntry | null)[]) || [];
  }

  if (typeof queryFn === 'string') {
    const sql = queryFn;
    queryFn = () => sql;
  }

  return { slug, queryFn: queryFn as (...args: unknown[]) => string, dependencies };
}

function useDependencyCheck(dependencies: (CacheEntry | null)[]) {
  return useMemo(() => dependencies.every((d) => d !== null && d.status === 'ready'), [dependencies]);
}

function useQueryBuilder(queryFn: (...args: unknown[]) => string, dependencies: (CacheEntry | null)[]) {
  return useMemo(() => {
    const readyDeps = dependencies.filter((d): d is CacheEntry => d !== null);
    const depIds = readyDeps.map((d) => d.id);
    const t = buildSubstitutionMap(readyDeps, depIds);
    return queryFn(t);
  }, [queryFn, dependencies]);
}

function useDepsQuery(queryFn: (...args: unknown[]) => string, dependencies: (CacheEntry | null)[]) {
  const { pool } = useDuckDB();
  const coordinator = getCoordinator(pool);
  const allDepsReady = useDependencyCheck(dependencies);
  const query = useQueryBuilder(queryFn, dependencies);
  return { pool, coordinator, allDepsReady, query };
}

function usePoolQuery(sql: string | null): unknown[] | null {
  const { pool } = useDuckDB();
  const [data, setData] = useState<unknown[] | null>(null);
  const lastData = useRef<unknown[] | null>(null);

  useEffect(() => {
    if (!sql) return;
    let isMounted = true;

    pool
      .dump(sql)
      .then((res: unknown) => {
        if (isMounted) {
          const plain = JSON.parse(JSON.stringify(res));
          setData(plain);
          lastData.current = plain;
        }
      })
      .catch((err: unknown) => {
        if (isMounted) console.error('DuckDB query error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [sql, pool]);

  return data ?? lastData.current;
}

export function buildFromExpression(entry: CacheEntry): string {
  if (entry.type === 'fragment') return `(${entry.query || ''})`;
  return `'${entry.path}'`;
}

// --- Producers ---

const NOOP_SQL_FN = () => 'SELECT NULL WHERE FALSE';

export const useTable: UseTableHook = (arg1: any, arg2?: any, arg3: any = []): any => {
  const [entry, setEntry] = useState<CacheEntry | null>(null);
  const lastReadyEntry = useRef<CacheEntry | null>(null);
  const { slug, queryFn, dependencies } = parseSlugArgs(arg1, arg2, arg3);
  const { coordinator, allDepsReady, query } = useDepsQuery(queryFn, dependencies);

  useEffect(() => {
    if (!allDepsReady || !query) return;
    let isMounted = true;
    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);

    coordinator.requestTable(slug, query, depIds).then((newEntry) => {
      if (isMounted) {
        setEntry(newEntry);
        if (newEntry.status === 'ready') lastReadyEntry.current = newEntry;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [allDepsReady, query, slug, coordinator, ...dependencies]);

  return entry?.status === 'ready' ? entry : lastReadyEntry.current;
};

export const useSql: UseSqlHook = (arg1: any, arg2?: any, arg3: any = []): any => {
  const { slug, queryFn, dependencies } = parseSlugArgs(arg1, arg2, arg3);
  const { coordinator, allDepsReady, query } = useDepsQuery(queryFn, dependencies);

  return useMemo(() => {
    if (!allDepsReady || !query) return null;
    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);
    return coordinator.registerView(slug, query, depIds, 'fragment');
  }, [allDepsReady, query, slug, coordinator, ...dependencies]);
};

// --- Consumers ---

const _rows: MaterializeRowsHook = (arg1: any, arg2?: any): any => {
  const isQueryFn = typeof arg1 === 'function';
  const stableDummy = useMemo(() => NOOP_SQL_FN, []);

  const { allDepsReady, query } = useDepsQuery(
    isQueryFn ? (arg1 as (...args: unknown[]) => string) : stableDummy,
    isQueryFn ? ((arg2 as (CacheEntry | null)[]) || []) : [],
  );

  const source = !isQueryFn ? (arg1 as CacheEntry | null) : null;
  const entryReady = source !== null && source.status === 'ready';

  const sql = isQueryFn
    ? (allDepsReady ? query : null)
    : (entryReady && source ? `SELECT * FROM ${buildFromExpression(source)}` : null);

  return usePoolQuery(sql);
};

const _row: MaterializeRowHook = (arg1: any, arg2?: any): any => {
  const rows = _rows(arg1, arg2) as unknown[] | null;
  return rows && rows.length > 0 ? rows[0] : null;
};

const _concurrent: MaterializeConcurrentHook = (sources): any => {
  const { pool } = useDuckDB();
  const [results, setResults] = useState<Record<string, unknown[]> | null>(null);
  const lastResults = useRef<Record<string, unknown[]> | null>(null);

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
          if (isMounted) console.error(`Concurrent materialize error [${key}]:`, err);
          return [key, []] as const;
        }
      }),
    ).then((pairs) => {
      if (isMounted) {
        const obj = Object.fromEntries(pairs) as Record<string, unknown[]>;
        setResults(obj);
        lastResults.current = obj;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [allReady, sourceKey, pool]);

  return results ?? lastResults.current;
};

export const useMaterialize = {
  rows: _rows,
  row: _row,
  concurrent: _concurrent,
};

// --- Backward compat (other pages not yet migrated) ---
// TODO: migrate remaining pages to useTable/useSql/useMaterialize then delete these
export {
  useTable as useDerivedTable,
  useSql as useFragment,
};
export const useAggregateResults = _row;
export const useSlice = _rows;

// --- Type Tests ---

export function _typeCheck() {
  const t1 = useTable('table_1', () => 'SELECT 1', []);
  t1 satisfies CacheEntry<'table_1'> | null;

  const t2 = useSql(
    'view_1',
    (t) => {
      const x = t.table_1;
      return `SELECT * FROM ${x}`;
    },
    [t1],
  );
  t2 satisfies CacheEntry<'view_1'> | null;

  const t3 = useSql('view_2', (t) => `SELECT * FROM ${t.table_1} JOIN ${t.view_1}`, [t1, t2]);
  t3 satisfies CacheEntry<'view_2'> | null;

  const _test1: CacheEntry<'table_1'> | null = t1;

  useSql(
    'view_fail',
    (t) => {
      // @ts-expect-error - t.non_existent should be an error
      return `SELECT * FROM ${t.non_existent}`;
    },
    [t1],
  );

  const objView = useSql({ view_4: (t) => `SELECT * FROM ${t.view_2}` }, [t3]);
  objView satisfies CacheEntry<'view_4'> | null;

  const agg = useMaterialize.row((t) => `SELECT count(*)::int as total FROM ${t.table_1}`, [t1]);
  agg && agg satisfies { total: number };

  const aggNoDeps = useMaterialize.row((t) => `SELECT 1::int as one`);
  aggNoDeps && aggNoDeps satisfies { one: number };

  const fragment = useSql(
    { active_users: (t) => `SELECT * FROM ${t.table_1} WHERE active = true` },
    [t1],
  );
  fragment satisfies CacheEntry<'active_users'> | null;

  const _aggFragment = useMaterialize.row((t) => `SELECT count(*) as cnt FROM ${t.active_users}`, [fragment]);

  const noDeps = useTable({ standalone: () => `SELECT 1::int as x` });
  noDeps satisfies CacheEntry<'standalone'> | null;

  const noDepsStr = useTable({ standalone_str: `SELECT 1::int as y` });
  noDepsStr satisfies CacheEntry<'standalone_str'> | null;

  // Phantom row type is inferred from SQL
  const typed = useTable('typed_t', () => `SELECT count(*)::int as total, name FROM t`, []);
  typed && typed satisfies CacheEntry<'typed_t', { total: number; name: unknown }>;
  null as unknown as ExtractRow<NonNullable<typeof typed>> satisfies { total: number; name: unknown };

  // Phantom type carries through fragments
  const typedFrag = useSql({
    typed_frag: () => `SELECT sum(cost)::int as total_cost, carrier as best FROM t`,
  });
  typedFrag && typedFrag satisfies CacheEntry<'typed_frag', { total_cost: number; best: unknown }>;
  null as unknown as ExtractRow<NonNullable<typeof typedFrag>> satisfies { total_cost: number; best: unknown };

  // Phantom type works with dependencies (template literal interpolation)
  const depFrag = useSql(
    { dep_frag: (t) => `SELECT count(*)::int as cnt FROM ${t.typed_t}` },
    [typed],
  );
  depFrag && depFrag satisfies CacheEntry<'dep_frag', { cnt: number }>;
  null as unknown as ExtractRow<NonNullable<typeof depFrag>> satisfies { cnt: number };

  const rows = useMaterialize.rows(typed);
  rows && rows satisfies { total: number; name: unknown }[];

  const row = useMaterialize.row(typed);
  row && row satisfies { total: number; name: unknown };

  const queryRows = useMaterialize.rows((t) => `SELECT count(*)::int as n FROM ${t.table_1}`, [t1]);
  queryRows && queryRows satisfies { n: number }[];

  const multi = useMaterialize.concurrent({ a: typed, b: typedFrag });
  multi && multi satisfies { a: { total: number; name: unknown }[]; b: { total_cost: number; best: unknown }[] };

  // useTable with dependencies (derived from another table)
  const derived = useTable('derived_t', (t) => `SELECT total * 2 as doubled FROM ${t.typed_t}`, [typed]);
  derived && derived satisfies CacheEntry<'derived_t'>;

  // useSql object syntax with plain string value (no function)
  const sqlStr = useSql({ inline_v: `SELECT 1::int as v` });
  sqlStr && sqlStr satisfies CacheEntry<'inline_v', { v: number }>;

  // useSql NoCTE rejection
  useSql({
    // @ts-expect-error - CTEs are forbidden in useSql
    cte_fail: () => `WITH cte AS (SELECT 1) SELECT * FROM cte`,
  });

  // useMaterialize.rows from a useSql fragment (phantom type flows through)
  const fragRows = useMaterialize.rows(typedFrag);
  fragRows && fragRows satisfies { total_cost: number; best: unknown }[];

  // useMaterialize.row from a useSql fragment
  const fragRow = useMaterialize.row(typedFrag);
  fragRow && fragRow satisfies { total_cost: number; best: unknown };

  // useMaterialize.rows with queryFn and empty deps
  const noDepsRows = useMaterialize.rows(() => `SELECT 42::int as val`, []);
  noDepsRows && noDepsRows satisfies { val: number }[];

  // useMaterialize.concurrent with single entry
  const single = useMaterialize.concurrent({ only: typed });
  single && single satisfies { only: { total: number; name: unknown }[] };

  // --- Additional coverage ---

  // useTable object syntax WITH dependencies
  const objWithDeps = useTable({ derived_obj: (t) => `SELECT total::int as t FROM ${t.typed_t}` }, [typed]);
  objWithDeps && objWithDeps satisfies CacheEntry<'derived_obj', { t: number }>;

  // useTable allows CTEs (only useSql forbids them)
  const withCte = useTable('cte_ok', () => `WITH x AS (SELECT 1::int as v) SELECT * FROM x`, []);
  withCte && withCte satisfies CacheEntry<'cte_ok'>;

  // useSql slug-string with no deps
  const sqlNoDeps = useSql('no_deps_v', () => `SELECT 1::int as one`);
  sqlNoDeps && sqlNoDeps satisfies CacheEntry<'no_deps_v', { one: number }>;

  // Phantom type flowing through full chain: table -> fragment -> fragment -> materialize
  const chainFrag = useSql(
    { chain: (t) => `SELECT cnt * 2 as doubled FROM ${t.dep_frag}` },
    [depFrag],
  );
  chainFrag && chainFrag satisfies CacheEntry<'chain'>;
  const chainRow = useMaterialize.row(chainFrag);
  chainRow && chainRow satisfies { doubled: unknown };

  // useMaterialize.row from a dep-chain fragment (phantom type)
  const depRow = useMaterialize.row(depFrag);
  depRow && depRow satisfies { cnt: number };

  // useMaterialize.concurrent mixing table + fragment
  const mixed = useMaterialize.concurrent({ tbl: typed, frag: depFrag });
  mixed && mixed satisfies { tbl: { total: number; name: unknown }[]; frag: { cnt: number }[] };

  // useMaterialize.rows with queryFn using multiple deps
  const multiDepRows = useMaterialize.rows(
    (t) => `SELECT count(*)::int as c FROM ${t.typed_t} JOIN ${t.dep_frag}`,
    [typed, depFrag],
  );
  multiDepRows && multiDepRows satisfies { c: number }[];

  // useSql object syntax with plain string + deps (static SQL referencing nothing)
  const staticWithDeps = useSql({ static_v: `SELECT 1::int as x` }, [typed]);
  staticWithDeps && staticWithDeps satisfies CacheEntry<'static_v', { x: number }>;
}
