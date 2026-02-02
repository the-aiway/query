import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import type { InferSQL, Row } from '../duck/inferSqlReturntype';
import { QueryBuilder } from '../duck/query';
import type { ConnectionPool } from '../duck/ConnectionPool';
export { QueryQuack } from './QueryQuack';
export * from './QuackEnum';

/**
 * A QuackScope represents a "Zero-Data" pointer to a DuckDB object (View or Table).
 * It allows React components to pass around references to data without actually
 * holding the data in memory.
 */
export type QuackScope = {
  /** Uniquely identifies the scope instance. Used for cleanup. */
  id: string;
  /** The actual name of the view/table in DuckDB. */
  name: string;
  /** Whether the scope points to a permanent TABLE or a temporary VIEW. */
  isTable: boolean;
};

export type QuackResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

const QuackContext = createContext<QuackClient | null>(null);

interface QuackProviderProps {
  client: QuackClient;
  children: React.ReactNode;
}

export const QuackProvider = ({ client, children }: QuackProviderProps) => {
  return React.createElement(QuackContext.Provider, { value: client }, children);
};

export const useQuack = () => {
  const ctx = useContext(QuackContext);
  if (!ctx) throw new Error('useQuack must be used within QuackProvider');
  return ctx;
};

// Hook to register a root data source (e.g. Parquet file)
export function useQuackSource(name: string, sqlQuery: string): QuackScope | null {
  const quack = useQuack();
  const [scope, setScope] = useState<QuackScope | null>(null);

  useEffect(() => {
    let active = true;
    void quack.registerSource(name, sqlQuery).then((s) => {
      if (active) setScope(s);
    });
    return () => {
      active = false;
    };
  }, [quack, name, sqlQuery]);

  return scope;
}

// Hook to derive a computation scope (View) from a parent scope
export function useQuackScope(
  parent: QuackScope | null,
  transform: (parentName: string) => string,
  deps: unknown[] = [],
  options: { debounceMs?: number } = {}
): QuackScope | null {
  const quack = useQuack();
  const [scope, setScope] = useState<QuackScope | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentScopeRef = useRef<QuackScope | null>(null);

  useEffect(() => {
    if (!parent) return;
    let active = true;

    const run = async () => {
      try {
        const s = await quack.createScope(parent, transform);
        if (active) {
          const prev = currentScopeRef.current;
          currentScopeRef.current = s;
          setScope(s);
          // Only drop the previous scope if it's actually different
          if (prev && prev.id !== s.id) {
            void quack.dropScope(prev);
          }
        } else {
          // If the effect is already inactive, drop the newly created scope immediately
          void quack.dropScope(s);
        }
      } catch (err: unknown) {
        console.error('[Quack] Scope creation error:', err);
      }
    };

    if (options.debounceMs) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        void run();
      }, options.debounceMs);
    } else {
      void run();
    }

    return () => {
      active = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [parent, ...deps]);

  // Handle cleanup of the final scope on unmount
  useEffect(() => {
    return () => {
      if (currentScopeRef.current) {
        void quack.dropScope(currentScopeRef.current);
      }
    };
  }, [quack]);

  return scope;
}

/**
 * Hook to extract tiny metrics/aggregates from a scope
 * Returns exactly one row or null.
 */
export function useQuackMetric<TOverride = unknown, T extends string = string>(
  scope: QuackScope | null,
  query: (scopeName: string) => T,
  deps: unknown[] = []
): QuackResult<Row<InferSQL<T, TOverride>[number]>> {
  const quack = useQuack();
  const [state, setState] = useState<QuackResult<Row<InferSQL<T, TOverride>[number]>>>({
    data: null,
    isLoading: !!scope,
    error: null,
  });

  useEffect(() => {
    if (!scope) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    let active = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    const fetch = async (attempt = 0) => {
      try {
        const data = await quack.getMetric<TOverride, T>(scope, query);

        if (active) {
          setState({
            data: data,
            isLoading: false,
            error: null,
          });
        }
      } catch (err: any) {
        const isCatalogError = err?.message?.includes('Catalog Error');
        if (active) {
          if (isCatalogError && attempt < 3) {
            // Transient catalog visibility lag: retry after a short delay
            setTimeout(() => void fetch(attempt + 1), 50 * (attempt + 1));
          } else {
            console.error('[Quack] Metric error:', err);
            setState({ data: null, isLoading: false, error: err });
          }
        }
      }
    };

    void fetch();
    return () => {
      active = false;
    };
  }, [scope, ...deps]);

  return state;
}

/**
 * Hook to extract full result sets (e.g. for charts/maps) from a scope
 */
export function useQuackResults<TOverride = unknown, T extends string = string>(
  scope: QuackScope | null,
  query: (scopeName: string) => T,
  deps: unknown[] = []
): QuackResult<Row<InferSQL<T, TOverride>[number]>[]> {
  const quack = useQuack();
  const [state, setState] = useState<QuackResult<Row<InferSQL<T, TOverride>[number]>[]>>({
    data: null,
    isLoading: !!scope,
    error: null,
  });

  useEffect(() => {
    if (!scope) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    let active = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    const fetch = async (attempt = 0) => {
      try {
        const d = await quack.getResults<TOverride, T>(scope, query);

        if (active) {
          setState({
            data: d,
            isLoading: false,
            error: null,
          });
        }
      } catch (err: any) {
        const isCatalogError = err?.message?.includes('Catalog Error');
        if (active) {
          if (isCatalogError && attempt < 5) {
            // Transient catalog visibility lag: retry after a short delay
            setTimeout(() => void fetch(attempt + 1), 50 * (attempt + 1));
          } else {
            console.error('[Quack] Results error:', err);
            setState({ data: null, isLoading: false, error: err });
          }
        }
      }
    };

    void fetch();
    return () => {
      active = false;
    };
  }, [scope, ...deps]);

  return state;
}

/**
 * Hook to discover the schema (columns, types) of a scope.
 */
export function useQuackSchema(scope: QuackScope | null) {
  return useQuackResults<{
    column_name: string;
    column_type: string;
    null: string;
    key: string;
    default: string;
    extra: string;
  }>(scope, (name) => `DESCRIBE ${name}`);
}

// Hook for paged/virtualized access
export function useQuackCursor(
  scope: QuackScope | null,
  options: { orderBy?: string; pageSize?: number } = {}
) {
  const quack = useQuack();
  const [rowCount, setRowCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!scope) return;
    let active = true;
    setIsLoading(true);
    quack
      .getRowCount(scope)
      .then((count) => {
        if (active) {
          setRowCount(count);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [quack, scope]);

  const getBatch = useMemo(() => {
    return async (offset: number) => {
      if (!scope) return [];
      return quack.getBatch(scope, options.pageSize || 50, offset);
    };
  }, [quack, scope, options.pageSize]);

  return { rowCount, getBatch, isLoading };
}

/**
 * The QuackClient is a computation manager for DuckDB-Wasm.
 * It ensures DDL operations (creating/dropping views) are sequenced to avoid catalog conflicts.
 */
export class QuackClient {
  private _nextId = 0;
  private _queue: Promise<unknown> = Promise.resolve();

  constructor(
    private _db: duckdb.AsyncDuckDB,
    private _pool: ConnectionPool
  ) {}

  private async _enqueue<T>(task: () => Promise<T>): Promise<T> {
    const p = this._queue.then(task);
    this._queue = p.catch(() => {});
    return p;
  }

  private generateId(prefix: string, sqlQuery: string) {
    let hash = 0;
    for (let i = 0; i < sqlQuery.length; i++) {
      hash = (hash << 5) - hash + sqlQuery.charCodeAt(i);
      hash |= 0;
    }
    const h = Math.abs(hash).toString(36).substring(0, 4);
    // Remove DuckDB prefixes like qv_ or qt_ from source names for cleaner IDs
    const cleanPrefix = prefix
      .replace(/^(qv|qt)_/, '')
      .replace(/_view$/, '')
      .substring(0, 12);
    return `qv_${cleanPrefix}_${h}`;
  }

  /**
   * Register a permanent table as a root data source.
   */
  async registerSource(name: string, sqlQuery: string): Promise<QuackScope> {
    return this._enqueue(async () => {
      await this._pool.run((conn) => conn.query(`CREATE OR REPLACE TABLE ${name} AS ${sqlQuery}`));
      return { id: name, name, isTable: true };
    });
  }

  /**
   * Create a derived computation scope (VIEW).
   */
  async createScope(
    parent: QuackScope,
    transform: (parentName: string) => string
  ): Promise<QuackScope> {
    const sqlQuery = transform(parent.name);
    const id = this.generateId(parent.name, sqlQuery);
    return this._enqueue(async () => {
      await this._pool.run((conn) => conn.query(`CREATE OR REPLACE VIEW ${id} AS ${sqlQuery}`));
      return { id, name: id, isTable: false };
    });
  }

  /**
   * Drop a scope when it's no longer needed.
   */
  async dropScope(scope: QuackScope) {
    if (scope.isTable) return;
    return this._enqueue(async () => {
      try {
        await this._pool.run((conn) => conn.query(`DROP VIEW IF EXISTS ${scope.name}`));
      } catch {
        // Silently fail on drop if it's already gone or there's a transient issue
      }
    });
  }

  /**
   * Execute a query using the underlying QueryBuilder (fluent API).
   */
  query<TOverride = unknown, Q extends string = string>(sql: Q, params?: unknown[]) {
    return new QueryBuilder<TOverride, Q>(this._pool, sql, params);
  }

  async getMetric<TOverride = unknown, T extends string = string>(
    scope: QuackScope,
    query: (name: string) => T
  ): Promise<Row<InferSQL<T, TOverride>[number]> | null> {
    const rows = await this.query<TOverride, T>(query(scope.name)).array({ plain: true });
    return (rows[0] as Row<InferSQL<T, TOverride>[number]>) || null;
  }

  async getResults<TOverride = unknown, T extends string = string>(
    scope: QuackScope,
    query: (name: string) => T
  ): Promise<Row<InferSQL<T, TOverride>[number]>[]> {
    return (await this.query<TOverride, T>(query(scope.name)).array({
      plain: true,
    })) as Row<InferSQL<T, TOverride>[number]>[];
  }

  async getRowCount(scope: QuackScope): Promise<number> {
    const result = await this.query(`SELECT count(*)::BIGINT as total FROM ${scope.name}`).array({
      plain: true,
    });
    return Number(result[0]?.total);
  }

  async getBatch(scope: QuackScope, limit: number, offset: number): Promise<unknown[]> {
    return this.query(`SELECT * FROM ${scope.name} LIMIT ${limit} OFFSET ${offset}`).array({
      plain: true,
    });
  }
}
