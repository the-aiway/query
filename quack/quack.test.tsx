import { test, expect, describe, beforeEach, afterEach, jest } from 'bun:test';
import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { initDuckDB } from '../duckdb-wasm-init';
import * as arrow from 'apache-arrow';
import {
  QuackClient,
  QuackProvider,
  useQuack,
  useQuackSource,
  useQuackScope,
  useQuackMetric,
  useQuackResults,
  useQuackCursor,
} from './';

// Register Happy DOM
GlobalRegistrator.register();

describe('QuackClient Core', () => {
  let db;
  let conn;
  let quack;

  beforeEach(async () => {
    const init = await initDuckDB();
    db = init.db;
    conn = init.conn;
    quack = new QuackClient(db, conn);
  });

  afterEach(async () => {
    await cleanup();
  });

  test('registerSource creates a table', async () => {
    const scope = await quack.registerSource('test_table', 'SELECT 1 as val');
    expect(scope.name).toBe('test_table');
    expect(scope.isTable).toBe(true);

    const check = await conn.query('SELECT * FROM test_table');
    const table = arrow.tableFromIPC(check);
    expect(table.numRows).toBe(1);
  });

  test('createScope creates a view with hash-based ID', async () => {
    const parent = await quack.registerSource('root', 'SELECT * FROM range(10) t(id)');
    const scope = await quack.createScope(parent, (p) => `SELECT * FROM ${p} WHERE id > 5`);

    expect(scope.id).toStartWith('qv_root_');
    expect(scope.isTable).toBe(false);

    const rows = await quack.getRowCount(scope);
    expect(rows).toBe(4); // 6, 7, 8, 9
  });

  test('dropScope removes views but not tables', async () => {
    const tableScope = await quack.registerSource('fixed_table', 'SELECT 1');
    const viewScope = await quack.createScope(tableScope, (p) => `SELECT * FROM ${p}`);

    await quack.dropScope(viewScope);

    // Instead of querying and triggering a noisy Catalog Error, check the system catalog
    const checkView = await conn.query(
      `SELECT count(*) as count FROM duckdb_views WHERE view_name = '${viewScope.name}'`
    );
    const viewTable = arrow.tableFromIPC(checkView);
    expect(Number(viewTable.getChildAt(0)?.get(0))).toBe(0);

    await quack.dropScope(tableScope);
    // Tables should persist
    const checkTable = await conn.query(
      `SELECT count(*) as count FROM duckdb_tables WHERE table_name = '${tableScope.name}'`
    );
    const tableTable = arrow.tableFromIPC(checkTable);
    expect(Number(tableTable.getChildAt(0)?.get(0))).toBe(1);
  });

  test('getMetric / getResults / getBatch / getRowCount', async () => {
    const scope = await quack.registerSource('data', 'SELECT * FROM range(10) t(id)');

    // getMetric
    const metric = await quack.getMetric(scope, (s) => `SELECT count(*) as total FROM ${s}`);
    expect(metric).toEqual({ total: 10n });

    // getResults
    const results = await quack.getResults(scope, (s) => `SELECT id FROM ${s} WHERE id < 3`);
    expect(results).toEqual([{ id: 0n }, { id: 1n }, { id: 2n }]);

    // getBatch
    const batch = await quack.getBatch(scope, 5, 2);
    expect(batch).toEqual([{ id: 5n }, { id: 6n }]);

    // getRowCount
    const count = await quack.getRowCount(scope);
    expect(count).toBe(10);
  });
});

describe('Quack Hooks', () => {
  let quack;

  beforeEach(async () => {
    const init = await initDuckDB();
    quack = new QuackClient(init.db, init.conn);
  });

  afterEach(cleanup);

  const Wrapper = ({ children }) => <QuackProvider client={quack}>{children}</QuackProvider>;

  test('useQuackSource registers source', async () => {
    let capturedScope = null;
    const TestComponent = () => {
      const scope = useQuackSource('hook_source', 'SELECT 123 as val');
      capturedScope = scope;
      return null;
    };

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => expect(capturedScope).not.toBeNull());
    expect(capturedScope.name).toBe('hook_source');
  });

  test('useQuackScope derives scope', async () => {
    let derivedScope = null;
    const TestComponent = () => {
      const source = useQuackSource('p', 'SELECT 1');
      const scope = useQuackScope(source, (name) => `SELECT * FROM ${name}`);
      derivedScope = scope;
      return null;
    };

    render(<TestComponent />, { wrapper: Wrapper });
    await waitFor(() => expect(derivedScope).not.toBeNull());
    expect(derivedScope.name).toStartWith('qv_p_');
  });

  test('useQuackMetric fetches metrics', async () => {
    let result = null;
    const TestComponent = () => {
      const source = useQuackSource('m', 'SELECT 42 as val');
      const data = useQuackMetric(source, (s) => `SELECT val FROM ${s}`);
      result = data;
      return null;
    };

    render(<TestComponent />, { wrapper: Wrapper });
    await waitFor(() => expect(result).toEqual({ val: 42 }));
  });

  test('useQuackResults fetches results', async () => {
    let result = null;
    const TestComponent = () => {
      const source = useQuackSource('r', 'SELECT * FROM range(2) t(v)');
      const data = useQuackResults(source, (s) => `SELECT v FROM ${s}`);
      result = data;
      return null;
    };

    render(<TestComponent />, { wrapper: Wrapper });
    await waitFor(() => expect(result).toEqual([{ v: 0n }, { v: 1n }]));
  });

  test('useQuackCursor handles pagination', async () => {
    let cursor = null;
    const TestComponent = () => {
      const source = useQuackSource('c', 'SELECT * FROM range(100) t(id)');
      cursor = useQuackCursor(source, { pageSize: 10 });
      return null;
    };

    render(<TestComponent />, { wrapper: Wrapper });
    await waitFor(() => expect(cursor?.rowCount).toBe(100));

    const batch = await cursor.getBatch(20);
    expect(batch.length).toBe(10);
    expect(batch[0].id).toBe(20n);
  });

  test('useQuack throws outside provider', () => {
    const TestComponent = () => {
      useQuack();
      return null;
    };
    // Silence console error for expected crash
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useQuack must be used within QuackProvider');
    spy.mockRestore();
  });
});
