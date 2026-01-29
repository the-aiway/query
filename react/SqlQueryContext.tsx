import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDuckDB } from './DuckDBProvider';
import type { QueryHandle, SqlQueryContextValue, Dependency } from './useSqlQuery.types';
import { normalizeSQL, rewriteNamedParams, fnv1a32Hex, stableStringify, isQueryHandle } from './useSqlQuery.utils';

const SqlQueryContext = createContext<SqlQueryContextValue | null>(null);

export function useSqlQueryContext() {
  const context = useContext(SqlQueryContext);
  if (!context) {
    throw new Error('useSqlQuery must be used within a SqlQueryProvider');
  }
  return context;
}

export function SqlQueryProvider({ children }: { children: React.ReactNode }) {
  const { pool } = useDuckDB();
  const queryClient = useQueryClient();
  const aliasRegistry = useRef<Map<string, string>>(new Map());

  const value = useMemo(() => ({
    // register is now a pass-through to get a stable handle, but execution is handled by useQuery
    register: (alias: string | null, sql: string, params: Record<string, unknown>, depsKey: string = '') => {
      const normalizedSql = normalizeSQL(sql);
      const paramsKey = stableStringify(Object.keys(params).sort().reduce((acc, k) => ({ ...acc, [k]: params[k] }), {}));
      
      if (alias) {
        const existingSql = aliasRegistry.current.get(alias);
        if (existingSql && existingSql !== normalizedSql) {
           // We allow updates to the same alias if it's the same component/flow
           // but we should warn or handle collisions if they are truly different queries.
           // For now, we update the registry to the latest SQL.
           aliasRegistry.current.set(alias, normalizedSql);
        } else if (!existingSql) {
           aliasRegistry.current.set(alias, normalizedSql);
        }
      }

      const isTransient = alias === null;
      const lookupKey = isTransient 
        ? `transient:${fnv1a32Hex(normalizedSql)}:${paramsKey}:${depsKey}`
        : `alias:${alias}:${fnv1a32Hex(normalizedSql)}:${paramsKey}`;

      // We return a "virtual" handle that will be populated by the hook
      return {
        alias,
        tableId: lookupKey,
        sql,
        params,
        // These will be overridden by the hook
        status: 'pending',
        isPending: true,
        isFetching: true,
        isSuccess: false,
        isError: false,
        error: null,
        table: null,
        data: null,
        duration: null,
        updatedAt: null,
        promise: queryClient.getQueryCache().find({ queryKey: ['sql-query', lookupKey] })?.promise || Promise.resolve(),
        refetch: async () => {
          await queryClient.invalidateQueries({ queryKey: ['sql-query', lookupKey] });
        },
        toString: () => alias || lookupKey,
      } as QueryHandle;
    },
    unregister: () => {
      // TanStack Query handles cleanup via GC
    },
    getHandle: () => {
      // Not strictly needed with TanStack Query as the hook manages state
      return undefined;
    },
    subscribe: (alias: string | null, callback: () => void, transientKey?: string) => {
      const lookupKey = alias || transientKey!;
      return queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryKey[0] === 'sql-query' && event.query.queryKey[1] === lookupKey) {
          callback();
        }
      });
    }
  }), [queryClient]);

  return <SqlQueryContext.Provider value={value}>{children}</SqlQueryContext.Provider>;
}
