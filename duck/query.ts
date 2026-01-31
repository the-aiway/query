import { Table as ArrowTable } from 'apache-arrow';
import type { ConnectionPool } from './ConnectionPool';
import type { Prettify, InferSQL } from './inferSqlReturntype';
import { withDump, type DumpConsole } from './dump';

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
  array(options: ArrayOptions = {}): TRow[] {
    const { plain = false } = options;
    const rows = ArrowTable.prototype.toArray.call(this);
    if (plain) {
      return rows.map((e = {}) => (e as any)?.toJSON?.() ?? { ...e }) as any;
    }
    return rows as any;
  }
}

export class QueryBuilder<TOverride = unknown, Q extends string = string> {
  private _dump = false;
  private _logger: DumpConsole = console;

  constructor(
    private _pool: ConnectionPool,
    private _query: Q,
    private _params?: unknown[]
  ) {}

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
  async array<R = TOverride>(options: ArrayOptions = {}): Promise<InferSQL<Q, R>> {
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
  ): Promise<Map<InferSQL<Q, R>[number][K], InferSQL<Q, R>[number][]>> {
    const table = await this.table<R>();

    const keyVector = table.getChild(key as string);
    if (!keyVector) {
      throw new Error(`Column "${key as string}" not found in results`);
    }

    const map = new Map<any, any[]>();
    const numRows = table.numRows;

    for (let i = 0; i < numRows; i++) {
      const k = keyVector.get(i);
      const row = table.get(i);

      let group = map.get(k);
      if (!group) {
        group = [];
        map.set(k, group);
      }
      group.push(row);
    }
    return map;
  }

  /**
   * Execute the query and return an async generator that yields rows.
   */
  async *stream<R = TOverride>(options: ArrayOptions = {}): AsyncGenerator<InferSQL<Q, R>[number]> {
    const { plain = false } = options;
    const stream = this._pool.streamIPC(this._query, this._params);

    for await (const batch of stream) {
      for (const row of batch) {
        if (plain) {
          yield ((row as any)?.toJSON?.() ?? { ...row }) as any;
        } else {
          yield row as any;
        }
      }
    }
  }

  /**
   * Execute the query and return an Arrow Table (IPC format).
   */
  async table<R = TOverride>(): Promise<InferredArrowTable<InferSQL<Q, R>[number]>> {
    const execute = () => this._pool.queryIPCTable(this._query, this._params);
    const table = this._dump
      ? await withDump(this._query, this._pool, execute, this._logger)
      : await execute();

    const inferredTable = table as unknown as InferredArrowTable<InferSQL<Q, R>[number]>;
    inferredTable.array = function (options: ArrayOptions = {}) {
      const { plain = false } = options;
      const rows = ArrowTable.prototype.toArray.call(this);
      if (plain) {
        return rows.map((e = {}) => (e as any)?.toJSON?.() ?? { ...e }) as any;
      }
      return rows as any;
    };
    return inferredTable;
  }

  /**
   * Make the QueryBuilder awaitable (executes the query but returns nothing).
   */
  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.table()
      .then(() => {})
      .then(onfulfilled, onrejected);
  }
}
