import { test, expect, describe, beforeAll } from 'bun:test';
import { ConnectionPool } from './ConnectionPool';
import { initDuckDB } from '../duckdb-wasm-init';
import type { InferredArrowTable } from './query';
import { InferWithDefault } from './inferSqlReturntype';

describe('QueryBuilder', () => {
  let pool: ConnectionPool;

  beforeAll(async () => {
    const { db } = await initDuckDB();
    pool = new ConnectionPool(db);
  });

  // test('xxx', async () => {
  //   const table = await pool.query('SELECT 1::INT as id, \'test\' as name')
  //   console.log(table.map(e => e.id.))
  // });
  test('should be chainable and awaitable (returns table)', async () => {
    const table = await pool.query("SELECT 1 as id, 'test' as name").table();
    expect(table.numRows).toBe(1);
    expect(table.array({ plain: true })).toEqual([{ id: 1, name: 'test' }]);
  });

  test('should default to raw arrow rows', async () => {
    const result = await pool.query('SELECT 1 as id').array();
    // When plain is false (default), it returns the raw arrow proxy objects
    expect(result[0]).toBeDefined();
    expect(typeof result[0]).toBe('object');
  });

  test('should support .array({ plain: true }) for plain objects', async () => {
    const result = await pool.query('SELECT 1 as id').array({ plain: true });
    expect(result).toEqual([{ id: 1 }]);
  });

  test('should support .dump() chaining', async () => {
    const result = await pool.query('SELECT 1 as id').dump().array({ plain: true });
    expect(result).toEqual([{ id: 1 }]);
  });

  test('should support .stream()', async () => {
    const rows: any[] = [];
    const stream = pool
      .query("SELECT * FROM (VALUES (1, 'a'), (2, 'b')) t(id, name)")
      .stream({ plain: true });
    for await (const row of stream) {
      rows.push(row);
    }
    expect(rows).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
  });

  test('should support named parameters in .query()', async () => {
    const result = await pool.query('SELECT $val as value', { val: 42 }).array({ plain: true });
    expect(result).toEqual([{ value: 42 }]);
  });

  test('should support multiple named parameters', async () => {
    const result = await pool
      .query('SELECT $a as a, $b as b', { b: 2, a: 1 })
      .array({ plain: true });
    expect(result).toEqual([{ a: 1, b: 2 }]);
  });

  test('should support named parameters in .stream()', async () => {
    const rows: any[] = [];
    const stream = pool
      .query('SELECT $id as id, $name as name', { id: 1, name: 'a' })
      .stream({ plain: true });
    for await (const row of stream) {
      rows.push(row);
    }
    expect(rows).toEqual([{ id: 1, name: 'a' }]);
  });

  test('should support named parameters in .table()', async () => {
    const table = await pool
      .query<InferWithDefault<string>>('SELECT $v as v', { v: 'test' })
      .table();
    // table satisfies InferredArrowTable<{ v: string }>;
    expect(table.array({ plain: true })).toEqual([{ v: 'test' }]);
  });

  test('should support named parameters in .array()', async () => {
    const result = await pool.query('SELECT $v as v', { v: 123 }).array({ plain: true });
    expect(result).toEqual([{ v: 123 }]);
  });

  test('should support positional parameters (array) in .query()', async () => {
    const result = await pool.query('SELECT ? as a, ? as b', [1, 'test']).array({ plain: true });
    expect(result).toEqual([{ a: 1, b: 'test' }]);
  });

  test('should support positional parameters ($1, $2) in .query()', async () => {
    const result = await pool.query('SELECT $1 as a, $2 as b', [1, 'test']).array({ plain: true });
    expect(result).toEqual([{ a: 1, b: 'test' }]);
  });

  test('should support custom logger in .dump()', async () => {
    const logs: any[] = [];
    const customLogger = {
      log: (...args: any[]) => logs.push(['log', ...args]),
      error: (...args: any[]) => logs.push(['error', ...args]),
      dir: (...args: any[]) => logs.push(['dir', ...args]),
      groupCollapsed: (...args: any[]) => logs.push(['groupCollapsed', ...args]),
      groupEnd: () => logs.push(['groupEnd']),
      trace: () => logs.push(['trace']),
    };

    await pool.query('SELECT 1 as id').dump(customLogger).array({ plain: true });

    expect(logs.some((l) => l[0] === 'groupCollapsed')).toBe(true);
    // The highlighted query might contain ANSI escape codes, so we check if it contains the SQL
    expect(logs.some((l) => l[0] === 'log' && l[1].includes('SELECT'))).toBe(true);
  });

  test('should support custom default type inference', async () => {
    const q0 = await pool.query('SELECT 1 as x, 2 as y').array();
    // We use satisfies to check the type at compile time
    const q1 = await pool.query<{ x: number; xxy: number }>('SELECT 1 as xxy, 2 as x').array();
    // This should now resolve to { x: number; y: number; [x: string]: unknown }
    q1 satisfies { xxy: number; x: number }[];

    const q2 = pool.query('SELECT 1 as x, 2 as y').table();
    // This resolves to { x: unknown; y: unknown; [x: string]: unknown }
    q2 satisfies Promise<InferredArrowTable<{ x: number; y: number } & Record<string, unknown>>>;
  });

  test('should execute but return nothing when awaited directly', async () => {
    const result = await pool.query('SELECT 1 as id');
    expect(result).toBeUndefined();
  });

  test('should support .vectorMap(key)', async () => {
    const result = await pool
      .query<{
        id: number;
        name: string;
      }>("SELECT 1 as id, 'a' as name UNION SELECT 1, 'b' UNION SELECT 2, 'c'")
      .vectorMap('id');

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(2);
    expect(result.get(1)).toHaveLength(2);
    // Note: results are Arrow proxy objects, but contain the data
    expect(result.get(1)![0].id).toBe(1);
    expect(result.get(1)![0].name).toBe('a');
    expect(result.get(2)![0].id).toBe(2);
  });

  test('type inference tests', async () => {
    // Basic inference
    const q1 = pool.query("SELECT 1::INT as id, 'test' as name");
    q1.array() satisfies Promise<{ id: number; name: unknown }[]>;
    q1.table() satisfies Promise<InferredArrowTable<{ id: number; name: unknown }>>;

    // Named parameters inference
    const q2 = pool.query('SELECT $val::DECIMAL as val', { val: 0.4 });
    q2.array() satisfies Promise<{ val: number }[]>;

    // Override inference
    const q3 = pool.query<{ custom: string }>('SELECT 1 as id');
    q3.array() satisfies Promise<{ custom: string }[]>;

    // Stream inference
    const q4 = pool.query('SELECT 1::BOOLEAN as active');
    async () => {
      for await (const row of q4.stream()) {
        row satisfies { active: boolean };
      }
    };

    // vectorMap inference
    // We must provide the query string type explicitly if we want vectorMap checking to work when TOverride is inferred/defaulted?
    // Actually, in this case no override is provided, so it should infer T.
    const q5 = pool.query("SELECT 1 as id, 'a' as name");
    const lol = await q5.array();
    const lolx = await q5.table();
    q5.vectorMap('id') satisfies Promise<Map<number, { id: number; name: unknown }[]>>;
  });
});
