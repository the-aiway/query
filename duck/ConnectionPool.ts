import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { Table as ArrowTable, tableFromJSON, type TypeMap } from 'apache-arrow';

import type { Materialize, InferSQL } from './inferSqlReturntype';

export type { AsyncDuckDB, AsyncDuckDBConnection };

export type InferredArrowTable<TRow> = ArrowTable<TypeMap> & {
  toMaterialized: () => TRow[];
};

function withToMaterialized<TRow>(table: ArrowTable<TypeMap>): InferredArrowTable<TRow> {
  return Object.assign(table, {
    toMaterialized: () => Array.from(table).map((e = {}) => e?.toJSON?.() ?? { ...e }),
  }) as InferredArrowTable<TRow>;
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
   * Execute a query and return the raw DuckDB Table (IPC format).
   * Useful for direct table manipulation or when you need the table structure.
   */
  async queryIPCTable<TOverride = unknown, Q extends string = string>(query: Q, params?: unknown[]): Promise<InferredArrowTable<Materialize<InferSQL<Q, TOverride>>[number]>> {
    const conn = await this.acquire();
    await this.ensureQueryHook(conn);
    try {
      let result;
      if (!params || params.length === 0) {
        result = await conn.query(query);
      } else {
        const stmt = await conn.prepare(query);
        try {
          if (typeof stmt.query === 'function') {
            result = await stmt.query(...params);
          } else {
            const stream = await stmt.send(...params);
            const res = await stream.readAll();
            result = new ArrowTable(res);
          }
        } finally {
          await stmt.close();
        }
      }

      const table = result || new ArrowTable();
      return withToMaterialized<Materialize<InferSQL<Q, TOverride>>[number]>(table);
    } finally {
      this.release(conn);
    }
  }

  /**
   * Execute a query on an available connection and release it immediately.
   * If params are provided, it uses prepare/send/close.
   */
  async query<TOverride = unknown, Q extends string = string>(query: Q, params?: unknown[]) {
    const table = await this.queryIPCTable<TOverride, Q>(query, params);
    return table.toArray() as unknown as Materialize<InferSQL<Q, TOverride>>;
  }

  dump = this.query;
  dumpIPCTable = this.queryIPCTable;

  /**
   * Insert data into a table. Accepts either an Arrow Table or an array of objects.
   * If an array of objects is provided, it will be converted to an Arrow Table first.
   */
  async insertTable<T extends Record<string, unknown>>(tableName: string, data: ArrowTable | T[], options: { create?: boolean; schema?: Record<string, string> } = {}): Promise<void> {
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
