import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import * as arrow from 'apache-arrow';

// Types for our "Zero-Data" pointers
export type QuackScope = {
  id: string;
  name: string;
  isTable: boolean;
};

const QuackContext = createContext<QuackClient | null>(null);

export const QuackProvider = ({ client, children }) => {
  return React.createElement(QuackContext.Provider, { value: client as any }, children);
};

export const useQuack = () => {
  const ctx = useContext(QuackContext);
  if (!ctx) throw new Error('useQuack must be used within QuackProvider');
  return ctx;
};
// Hook to register a root data source (e.g. Parquet file)
export function useQuackSource(name: string, sql: string, deps: any[] = []) {
  const quack = useQuack();
  const [scope, setScope] = useState<QuackScope | null>(null);

  useEffect(() => {
    let active = true;
    quack.registerSource(name, sql).then((s) => {
      if (active) setScope(s);
    });
    return () => {
      active = false;
    };
  }, deps);

  return scope;
}
// Hook to derive a computation scope (View) from a parent scope

export function useQuackScope(parent: QuackScope | null, transform: Function, deps = []) {
  const quack = useQuack();
  const [scope, setScope] = useState<QuackScope | null>(null);

  useEffect(() => {
    if (!parent) return;
    let active = true;
    let currentScope: QuackScope | null = null;

    quack.createScope(parent, transform).then((s) => {
      if (active) {
        currentScope = s;
        setScope(s);
      } else {
        quack.dropScope(s);
      }
    });

    return () => {
      active = false;
      setScope(null); // Prevent downstream from using stale/dropped scope
      if (currentScope) quack.dropScope(currentScope);
    };
  }, [parent, ...deps]);

  return scope;
}
// Hook to extract tiny metrics/aggregates from a scope
export function useQuackMetric<T>(
  scope: QuackScope | null,
  query: (scopeName: string) => string,
  deps: any[] = []
) {
  const quack = useQuack();
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!scope) return;
    let active = true;
    quack
      .getMetric<T>(scope, query)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        // Catalog Errors are expected transient races during rapid slider movements
        const isCatalogError = err?.message?.includes('Catalog Error');
        if (active && !isCatalogError) {
          console.error('[Quack] Metric error:', err);
        }
      });
    return () => {
      active = false;
    };
  }, [scope, ...deps]);

  return data;
}
// Hook to extract full result sets (e.g. for charts/maps) from a scope
export function useQuackResults<T>(scope: QuackScope | null, query: Function, deps = []) {
  const quack = useQuack();
  const [data, setData] = useState<T[] | null>(null);

  useEffect(() => {
    if (!scope) return;
    let active = true;
    quack
      .getResults<T>(scope, query)
      .then((d) => active && setData(d))
      .catch(
        (err) =>
          active &&
          !err?.message?.includes('Catalog Error') &&
          console.error('[Quack] Results error:', err)
      );
    return () => {
      active = false;
    };
  }, [scope, ...deps]);

  return data;
}
// Hook for paged/virtualized access
export function useQuackCursor(
  scope: QuackScope | null,
  options: { orderBy?: string; pageSize?: number } = {}
) {
  const quack = useQuack();
  const [rowCount, setRowCount] = useState<number>(0);

  useEffect(() => {
    if (!scope) return;
    quack.getRowCount(scope).then(setRowCount);
  }, [scope]);

  const getBatch = useMemo(() => {
    return async (offset: number) => {
      if (!scope) return [];
      return quack.getBatch(scope, offset, options.pageSize || 50, options.orderBy);
    };
  }, [scope, options.orderBy, options.pageSize]);

  return { rowCount, getBatch };
}

export class QuackClient {
  private _nextId = 0;

  constructor(
    private _db: duckdb.AsyncDuckDB,
    private conn: duckdb.AsyncDuckDBConnection
  ) {}

  private generateId(prefix: string, sql: string) {
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      hash = (hash << 5) - hash + sql.charCodeAt(i);
      hash |= 0;
    }
    const h = Math.abs(hash).toString(36).substring(0, 4);
    // Clean prefix: remove 'qview_' if present, take first 8 chars
    const cleanPrefix = prefix.replace(/^q[vt]_/, '').substring(0, 8);
    return `qv_${cleanPrefix}_${h}_${this._nextId++}`;
  }
  // Register a persistent source (Table/Parquet)
  async registerSource(name: string, sql: string): Promise<QuackScope> {
    await this.conn.query(`CREATE OR REPLACE TABLE ${name} AS ${sql}`);
    return { id: name, name, isTable: true };
  }
  // Create a scoped view derived from a parent
  async createScope(parent: QuackScope, transform: Function): Promise<QuackScope> {
    const sql = transform(parent.name);
    const id = this.generateId(parent.name, sql);
    await this.conn.query(`CREATE OR REPLACE VIEW ${id} AS ${sql}`);
    return { id, name: id, isTable: false };
  }

  async dropScope(scope: QuackScope) {
    if (scope.isTable) return;
    await this.conn.query(`DROP VIEW IF EXISTS ${scope.name}`);
  }
  // Pull the "Tip of the Iceberg" (Aggregates)
  async getMetric<T>(scope: QuackScope, query: (scopeName: string) => string): Promise<T> {
    const sql = query(scope.name);

    const result = await this.conn.query(sql);
    const table = (result as any).toArray ? (result as any) : arrow.tableFromIPC(result as any);
    const rtn = table.get(0)?.toJSON() as T;
    return rtn;
  }

  async getResults<T>(scope: QuackScope, query: Function): Promise<T[]> {
    const sql = query(scope.name);
    const result = await this.conn.query(sql);
    const table = (result as any).toArray ? (result as any) : arrow.tableFromIPC(result as any);
    const rtn = table.toArray().map((r: any) => r.toJSON());
    return rtn;
  }
  // Get a paged slice of data
  async getBatch(scope: QuackScope, offset = 0, limit = 10, orderBy?: string): Promise<any[]> {
    const sort = orderBy ? `ORDER BY ${orderBy}` : '';
    const sql = `SELECT * FROM ${scope.name} ${sort} LIMIT ${limit} OFFSET ${offset}`;
    const result = await this.conn.query(sql);
    const table = (result as any).toArray ? (result as any) : arrow.tableFromIPC(result as any);
    return table.toArray().map((r: any) => r.toJSON());
  }

  async getRowCount(scope: QuackScope): Promise<number> {
    const result = await this.conn.query(`SELECT count(*)::BIGINT as total FROM ${scope.name}`);
    const table = (result as any).toArray ? (result as any) : arrow.tableFromIPC(result as any);
    return Number(table.getChildAt(0)?.get(0));
  }
}
