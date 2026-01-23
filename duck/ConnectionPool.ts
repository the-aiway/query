import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import * as DuckDBBrowser from '@duckdb/duckdb-wasm';
import { Table as ArrowTable, tableFromJSON, type TypeMap } from 'apache-arrow';

import type { Materialize, InferSQL } from './inferSqlReturntype';

const duckdb = DuckDBBrowser as unknown as typeof import('@duckdb/duckdb-wasm') & {};

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
  async queryIPCTable<TOverride = unknown, Q extends string = string>(
    query: Q,
    params?: unknown[]
  ): Promise<InferredArrowTable<Materialize<InferSQL<Q, TOverride>>[number]>> {
    const conn = await this.acquire();
    await this.ensureQueryHook(conn);
    try {
      let result;
      if (!params || params.length === 0) {
        result = await conn.query(query);
      } else {
        const stmt = await conn.prepare(query);
        try {
          const stream = await stmt.send(...params);
          const res = await stream.readAll();
          result = new ArrowTable(res);
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
   * Returns results as an array of objects with automatic type inference.
   */
  async query<TOverride = unknown, Q extends string = string>(query: Q, params?: unknown[]) {
    const table = await this.queryIPCTable<TOverride, Q>(query, params);
    return table.toArray() as unknown as Materialize<InferSQL<Q, TOverride>>;
  }

  async dump<TOverride = unknown, Q extends string = string>(query: Q, params?: unknown[]) {
    const table = await this.dumpIPCTable<TOverride, Q>(query, params);
    return table.toArray() as unknown as Materialize<InferSQL<Q, TOverride>>;
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
      await this.dump(`CREATE OR REPLACE TABLE ${tableName} (${schema});`);
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

  count = 0;

  log(rtn: ArrowTable) {
    const resultsProxy = { clickToSeeMore: true };
    Object.defineProperty(resultsProxy, 'results', {
      get: () => Array.from(rtn).map((e) => e?.toJSON()),
      enumerable: true,
      configurable: true,
    });
    console.dir(resultsProxy, { showHidden: true, depth: 4 });
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
  async dumpIPCTable<TOverride = unknown, Q extends string = string>(
    query: Q,
    params?: unknown[]
  ): Promise<InferredArrowTable<Materialize<InferSQL<Q, TOverride>>[number]>> {
    const _id = this.count++;
    const tokens = await this.db.tokenize(query);
    const ANSI_RESET = '\x1b[0m';
    const ANSI_BOLD = '\x1b[1m';

    const rgbToAnsi = (r: number, g: number, b: number) => `${ANSI_BOLD}\x1b[38;2;${r};${g};${b}m`;

    // Color map by token type
    const colorMap: Record<DuckDBBrowser.TokenType, string> = {
      [DuckDBBrowser.TokenType.IDENTIFIER]: rgbToAnsi(63, 197, 107),
      [DuckDBBrowser.TokenType.NUMERIC_CONSTANT]: rgbToAnsi(255, 120, 248),
      [DuckDBBrowser.TokenType.STRING_CONSTANT]: rgbToAnsi(255, 120, 248),
      [DuckDBBrowser.TokenType.OPERATOR]: rgbToAnsi(122, 130, 218),
      [DuckDBBrowser.TokenType.KEYWORD]: rgbToAnsi(16, 177, 254),
      [DuckDBBrowser.TokenType.COMMENT]: rgbToAnsi(99, 109, 131),
    };

    // Colorize tokens using offsets and types
    const highlightedQuery = tokens.offsets
      .map((offset, i) => {
        const nextOffset = tokens.offsets[i + 1] ?? query.length;
        const value = query.substring(offset, nextOffset);
        const color = colorMap[tokens.types[i] as DuckDBBrowser.TokenType];
        return `${color}${value}${ANSI_RESET}`;
      })
      .join('');
    const randomString = '-- ' + _id;
    const queryStart = highlightedQuery.replace(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');
    console.groupCollapsed(queryStart + ' ' + randomString);
    console.time(highlightedQuery + randomString);
    try {
      const rtn = await this.queryIPCTable<TOverride, Q>(query, params);
      console.timeEnd(highlightedQuery + randomString);
      this.log(rtn);
      console.groupEnd();
      return rtn;
    } catch (error) {
      const errMessages = Array.from(
        new Set((error as Error).message.split('\n').filter((e: string) => e.trim()))
      );
      console.groupEnd();
      console.error(errMessages.join('\n'));
      console.trace();
      throw error;
    }
  }
}
