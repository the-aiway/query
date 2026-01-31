import { Table as ArrowTable } from 'apache-arrow';
import type { ConnectionPool, AsyncDuckDBConnection } from './ConnectionPool';
import type { Prettify, InferSQL, DuckDBRow } from './inferSqlReturntype';
import { withDump, type DumpConsole } from './dump';
import { mapNamedParams } from './namedParams';

export interface ArrayOptions {
  /**
   * Whether to convert the Arrow data to plain JavaScript objects.
   * If true, BigInts will be converted to numbers (if safe) or strings,
   * and other Arrow-specific types will be simplified.
   * Defaults to false.
   */
  plain?: boolean;
}

export class InferredArrowTable<TRow> extends ArrowTable {
  array(options: ArrayOptions = {}): DuckDBRow<TRow>[] {
    const { plain = false } = options;
    const rows = ArrowTable.prototype.toArray.call(this);
    if (plain) {
      return rows.map(toPlainObject);
    }
    return rows 
  }
}

function toPlainObject(row: any) {
  return row?.toJSON?.() ?? { ...row };
}

export class QueryBuilder<TOverride = unknown, Q extends string = string> {
  private _dump = false;
  private _logger: DumpConsole = console;

  constructor(
    private _pool: ConnectionPool,
    private _query: Q,
    private _params?: unknown[]
  ) { }

  /**
   * Enable logging/dumping for this query.
   */
  dump(logger: DumpConsole = console): this {
    this._logger = logger;
    this._dump = true;
    return this;
  }

  /**
   * Execute the query and return a materialized array of objects.
   */
  async array<R = TOverride>(
    options: ArrayOptions = {}
  ): Promise<DuckDBRow<InferSQL<Q, R>[number]>[]> {
    const table = await this.table<R>();
    return table.array(options) as any;
  }

  /**
   * Execute the query and return a Map indexed by the given column.
   * Uses Arrow vectors for high-performance indexing without full table materialization.
   * If multiple rows have the same key, they are grouped into an array.
   */
  async vectorMap<K extends keyof InferSQL<Q, R>[number], R = TOverride>(
    key: K
  ): Promise<Map<InferSQL<Q, R>[number][K], DuckDBRow<InferSQL<Q, R>[number]>[]>> {
    const table = await this.table<R>();

    const keyVector = table.getChild(key as string);
    if (!keyVector) {
      throw new Error(`Column "${key as string}" not found in results`);
    }

    const map = new Map();
    const numRows = table.numRows;

    for (let i = 0; i < numRows; i++) {
      const k = keyVector.get(i);
      const row = table.get(i);
      const group = map.get(k) ?? [];
      if (group.length === 0) map.set(k, group);
      group.push(row);
    }
    return map;
  }

  /**
   * Execute the query and return an async generator that yields rows.
   */
  async *stream<R = TOverride>(
    options: ArrayOptions = {}
  ): AsyncGenerator<DuckDBRow<InferSQL<Q, R>[number]>> {
    const { plain = false } = options;
    const conn = await this._pool.acquire();

    try {
      const stream = await this._execute(conn, 'send');
      for await (const batch of stream) {
        for (const row of batch) {
          yield (plain ? toPlainObject(row) : row);
        }
      }
    } finally {
      this._pool.release(conn);
    }
  }

  /**
   * Execute the query and return an Arrow Table (IPC format).
   */
  async table<R = TOverride>() {
    const execute = () =>
      this._pool.run(async (conn) => {
        return this._execute(conn, 'query');
      });
    const table = this._dump
      ? await withDump(this._query, this._pool, execute, this._logger)
      : await execute();
    return table as InferredArrowTable<InferSQL<Q, R>[number]>;
    // inferredTable.array = function (options: ArrayOptions = {}) {
    //   const { plain = false } = options;
    //   const rows = ArrowTable.prototype.toArray.call(this);
    //   if (plain) {
    //     return rows.map(toPlainObject) as any;
    //   }
    //   return rows as any;
    // };
  }

  private async _execute(conn: AsyncDuckDBConnection, method: 'query' | 'send') {
    const mapped = mapNamedParams(this._query, this._params as any);
    if (!mapped.params || mapped.params.length === 0) {
      return conn[method](mapped.sql);
    }
    const stmt = await conn.prepare(mapped.sql);
    try {
      return await stmt[method](...mapped.params);
    } finally {
      await stmt.close();
    }
  }

  /**
   * Make the QueryBuilder awaitable (executes the query but returns nothing).
   */
  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.table()
      .then(() => { })
      .then(onfulfilled, onrejected);
  }
}
