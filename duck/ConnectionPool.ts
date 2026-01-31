import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { Table as ArrowTable, tableFromJSON } from 'apache-arrow';

import { QueryBuilder } from './query';

export type { AsyncDuckDB, AsyncDuckDBConnection };

/**
 * Maps named parameters ($key) to positional parameters ($1, $2, ...)
 * and returns the parameters in the correct order.
 */
function mapNamedParams(
  sql: string,
  params?: unknown[] | Record<string, unknown>
): { sql: string; params: unknown[] } {
  if (!params) return { sql, params: [] };

  if (Array.isArray(params)) {
    return { sql, params };
  }

  const keys = Object.keys(params).sort((a, b) => b.length - a.length);
  let mappedSql = sql;
  const normalizedParams: unknown[] = [];
  const keyToIndex = new Map<string, number>();

  // Replace each $key with its positional index ($1, $2, ...)
  // We sort keys by length descending to avoid partial matches (e.g., $id vs $id_long)
  for (const key of keys) {
    const placeholder = `$${key}`;
    if (mappedSql.includes(placeholder)) {
      if (!keyToIndex.has(key)) {
        normalizedParams.push((params as Record<string, unknown>)[key]);
        keyToIndex.set(key, normalizedParams.length);
      }
      const index = keyToIndex.get(key);
      mappedSql = mappedSql.split(placeholder).join(`$${index}`);
    }
  }

  return { sql: mappedSql, params: normalizedParams };
}

export class ConnectionPool {
  private connections: AsyncDuckDBConnection[] = [];
  public db: AsyncDuckDB;
  private maxSize: number;
  private available: AsyncDuckDBConnection[] = [];
  private queue: ((conn: AsyncDuckDBConnection) => void)[] = [];
  private queryHook?: string;

  constructor(db: AsyncDuckDB, size: number = 4) {
    this.db = db;
    this.maxSize = size;
  }

  async acquire(): Promise<AsyncDuckDBConnection> {
    // Check if we have an available connection
    if (this.available.length > 0) {
      return this.available.pop()!;
    }

    // Create new if we haven't reached max size
    if (this.connections.length < this.maxSize) {
      const conn = await this.db.connect();
      this.connections.push(conn);
      return conn;
    }

    // Wait for available connection
    return new Promise<AsyncDuckDBConnection>((resolve) => {
      this.queue.push(resolve);
    });
  }

  private async ensureQueryHook(conn: AsyncDuckDBConnection): Promise<void> {
    if (this.queryHook) {
      await conn.query(this.queryHook);
    }
  }

  release(conn: AsyncDuckDBConnection) {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift()!;
      resolve(conn);
    } else {
      this.available.push(conn);
    }
  }

  /**
   * Returns a QueryBuilder for the given SQL.
   */
  query<TOverride = unknown, Q extends string = string>(
    sql: Q,
    params?: unknown[] | Record<string, unknown>
  ): QueryBuilder<TOverride, Q> {
    return new QueryBuilder<TOverride, Q>(this, sql, params as any);
  }

  private async executeWithConnection<T>(
    sql: string,
    params: unknown[] | Record<string, unknown> | undefined,
    callback: (
      conn: AsyncDuckDBConnection,
      mappedSql: string,
      positionalParams: unknown[]
    ) => Promise<T>
  ): Promise<T> {
    const conn = await this.acquire();
    await this.ensureQueryHook(conn);
    try {
      const mapped = mapNamedParams(sql, params as any);
      return await callback(conn, mapped.sql, mapped.params);
    } finally {
      this.release(conn);
    }
  }

  /**
   * Execute a query and return the raw DuckDB Table (IPC format).
   * Useful for direct table manipulation or when you need the table structure.
   */
  async queryIPCTable(
    query: string,
    params?: unknown[] | Record<string, unknown>
  ): Promise<ArrowTable> {
    return this.executeWithConnection(query, params, async (conn, sql, positionalParams) => {
      let result;
      if (!positionalParams || positionalParams.length === 0) {
        result = await conn.query(sql);
      } else {
        const stmt = await conn.prepare(sql);
        try {
          result = await stmt.query(...positionalParams);
        } finally {
          await stmt.close();
        }
      }
      return result || new ArrowTable();
    });
  }

  /**
   * Execute a query and return a stream of Arrow RecordBatches.
   */
  async *streamIPC(
    query: string,
    params?: unknown[] | Record<string, unknown>
  ): AsyncGenerator<any> {
    const mapped = mapNamedParams(query, params as any);
    const conn = await this.acquire();
    await this.ensureQueryHook(conn);
    try {
      if (!mapped.params || mapped.params.length === 0) {
        const stream = await conn.send(mapped.sql);
        for await (const batch of stream) {
          yield batch;
        }
      } else {
        const stmt = await conn.prepare(mapped.sql);
        try {
          const stream = await stmt.send(...mapped.params);
          for await (const batch of stream) {
            yield batch;
          }
        } finally {
          await stmt.close();
        }
      }
    } finally {
      this.release(conn);
    }
  }

  async dump<Q extends string>(query: Q, params?: unknown[]) {
    return this.query<unknown, Q>(query, params).dump();
  }

  /**
   * Insert data into a table. Accepts either an Arrow Table or an array of objects.
   * If an array of objects is provided, it will be converted to an Arrow Table first.
   */
  async insertTable<T extends Record<string, unknown>>(
    tableName: string,
    data: ArrowTable | T[],
    options: { create?: boolean; schema?: Record<string, string> } = {}
  ): Promise<void> {
    if (!data || (Array.isArray(data) && data?.length === 0)) {
      // arrow cannot create table from empty array cause theres no schema
      const schema = Object.entries(options.schema || {})
        .map(([name, type]) => `${name} ${type}`)
        .join(', ');
      await this.query(`CREATE OR REPLACE TABLE ${tableName} (${schema});`);
      return;
    }
    const table = data instanceof ArrowTable ? data : tableFromJSON(data);
    const conn = await this.acquire();
    await this.ensureQueryHook(conn);
    try {
      await conn.query(`DROP TABLE IF EXISTS ${tableName};`);
      await conn.insertArrowTable(table, {
        name: tableName,
      });
    } finally {
      this.release(conn);
    }
  }

  /**
   * Returns a new pool instance with query hook that runs before each query.
   * The original pool is not modified.
   */
  withQueryHook(sql: string): ConnectionPool {
    const wrappedPool = Object.create(Object.getPrototypeOf(this));
    Object.assign(wrappedPool, this);
    wrappedPool.queryHook = sql;
    return wrappedPool;
  }
}
