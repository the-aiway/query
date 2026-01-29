import React, { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDuckDB } from './DuckDBProvider';
import { useSqlQueryContext } from './SqlQueryContext';
import type { QueryHandle, Dependency, Materialize, InferSQL } from './useSqlQuery.types';
import { isQueryHandle, validateAlias, rewriteNamedParams, serializeDeps, stableStringify, normalizeSQL, fnv1a32Hex } from './useSqlQuery.utils';

type InferredQueryHandle<Q extends string, TOverride = unknown> = QueryHandle<
  Materialize<InferSQL<Q, TOverride>>[number]
>;

export function useSqlQuery<Q extends string>(
  queries: Record<string, Q>,
  dependencies?: Dependency[]
): InferredQueryHandle<Q>;

export function useSqlQuery<Q extends string>(
  sql: Q,
  dependencies?: Dependency[]
): InferredQueryHandle<Q>;

export function useSqlQuery<Q extends string>(
  sql: Q,
  params: Record<string, unknown>,
  dependencies?: Dependency[]
): InferredQueryHandle<Q>;

export function useSqlQuery(
  arg1: string | Record<string, string>,
  arg2?: Record<string, unknown> | Dependency[],
  arg3?: Dependency[]
): QueryHandle {
  const context = useSqlQueryContext();
  const { pool } = useDuckDB();

  const isNamedTable = typeof arg1 === 'object' && arg1 !== null;
  const alias = isNamedTable ? Object.keys(arg1)[0] : null;
  const sql = isNamedTable ? Object.values(arg1)[0] : (arg1 as string);
  
  let params: Record<string, unknown> = {};
  let deps: Dependency[] = [];

  if (isNamedTable) {
    if (Array.isArray(arg2)) {
      deps = arg2;
    }
  } else {
    if (Array.isArray(arg2)) {
      deps = arg2;
    } else if (typeof arg2 === 'object' && arg2 !== null) {
      params = arg2;
      if (Array.isArray(arg3)) {
        deps = arg3;
      }
    }
  }

  if (alias) {
    validateAlias(alias);
  }

  const depsKey = serializeDeps(deps);
  const paramsKey = useMemo(() => stableStringify(params), [params]);
  const normalizedSql = useMemo(() => normalizeSQL(sql), [sql]);
  
  const lookupKey = useMemo(() => {
    if (alias) return `alias:${alias}:${fnv1a32Hex(normalizedSql)}:${paramsKey}`;
    return `transient:${fnv1a32Hex(normalizedSql)}:${paramsKey}:${depsKey}`;
  }, [alias, normalizedSql, paramsKey, depsKey]);

  const queryKey = ['sql-query', lookupKey];

  const { data: result, status, error, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Wait for dependencies to be "ready" (have a promise and not be pending)
      const handleDeps = deps.filter(isQueryHandle);
      if (handleDeps.length > 0) {
        await Promise.all(handleDeps.map(async (d) => {
          if (d.promise) await d.promise;
          
          // For named tables, ensure they exist in DuckDB
          if (d.alias) {
            let attempts = 0;
            while (attempts < 20) {
              const check = await pool.query(`SELECT count(*) as c FROM information_schema.tables WHERE table_name = '${d.alias}'`);
              if (Number(check[0]?.c) > 0) break;
              await new Promise(resolve => setTimeout(resolve, 50));
              attempts++;
            }
            if (attempts === 20) {
              console.warn(`Dependency table "${d.alias}" not found after 1s. Proceeding anyway.`);
            }
          }
        }));
        
        const hasErrorDep = handleDeps.some(d => d.isError);
        if (hasErrorDep) {
          throw new Error(`One or more dependencies failed: ${handleDeps.filter(d => d.isError).map(d => d.alias || d.tableId).join(', ')}`);
        }
      }

      const start = performance.now();
      let rewrittenSql = sql;
      let values: unknown[] = [];
      
      if (params && Object.keys(params).length > 0) {
         const rewritten = rewriteNamedParams(sql, params);
         rewrittenSql = rewritten.sql;
         values = rewritten.values;
      }

      let resultTable;
      if (alias) {
        // Zero-copy: CREATE TABLE AS ... SELECT * FROM ...
        resultTable = await pool.createTableFromQuery(alias, rewrittenSql, values);
      } else {
        resultTable = await pool.dumpIPCTable(rewrittenSql, values);
      }

      return {
        table: resultTable,
        duration: performance.now() - start,
        updatedAt: Date.now(),
      };
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });

  const queryClient = useQueryClient();
  const promise = useMemo(() => {
    return queryClient.getQueryCache().find({ queryKey })?.promise || Promise.resolve();
  }, [queryClient, queryKey]);

  return useMemo(() => ({
    alias,
    tableId: lookupKey,
    sql,
    params,
    status: status === 'pending' ? 'pending' : (status === 'error' ? 'error' : 'success'),
    isPending: status === 'pending',
    isFetching,
    isSuccess: status === 'success',
    isError: status === 'error',
    error: error as Error | null,
    table: result?.table ?? null,
    get data() {
      if (!result?.table) return null;
      if (!(result as any)._materialized) {
        (result as any)._materialized = Array.from(result.table).map((row: any) => row.toJSON());
      }
      return (result as any)._materialized;
    },
    duration: result?.duration ?? null,
    updatedAt: result?.updatedAt ?? null,
    promise,
    refetch: async () => { await refetch(); },
    toString: () => alias || lookupKey,
  }), [alias, lookupKey, sql, params, status, isFetching, error, result, refetch, promise]);
}
