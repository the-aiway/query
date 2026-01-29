import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { useSqlQuery } from './useSqlQuery';
import { SqlQueryProvider } from './SqlQueryContext';
import { DuckDBContext } from './DuckDBProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock ConnectionPool
const mockDumpIPCTable = mock(() => Promise.resolve({
  toArray: () => [],
  [Symbol.iterator]: function* () { yield* []; }
}));
const mockInsertTable = mock(() => Promise.resolve());
const mockCreateTableFromQuery = mock(() => Promise.resolve({
  toArray: () => [{ count: 42, toJSON: () => ({ count: 42 }) }],
  [Symbol.iterator]: function* () { yield { count: 42, toJSON: () => ({ count: 42 }) }; }
}));
const mockAcquire = mock(() => Promise.resolve({}));
const mockRelease = mock(() => {});

const mockPool = {
  acquire: mockAcquire,
  release: mockRelease,
  dumpIPCTable: mockDumpIPCTable,
  insertTable: mockInsertTable,
  createTableFromQuery: mockCreateTableFromQuery,
  query: mock(() => Promise.resolve([])),
};

// Mock DuckDB Context
const mockDuckDBContext = {
  pool: mockPool,
  instance: {},
  createInstance: async () => {},
  selectedBundle: 'mvp',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <DuckDBContext.Provider value={mockDuckDBContext as any}>
      <SqlQueryProvider>{children}</SqlQueryProvider>
    </DuckDBContext.Provider>
  </QueryClientProvider>
);

describe('useSqlQuery', () => {
  beforeEach(() => {
    mockDumpIPCTable.mockClear();
    mockInsertTable.mockClear();
    mockCreateTableFromQuery.mockClear();
    mockAcquire.mockClear();
    mockRelease.mockClear();
    mockDumpIPCTable.mockResolvedValue({
      toArray: () => [{ count: 42, toJSON: () => ({ count: 42 }) }],
      [Symbol.iterator]: function* () { yield { count: 42, toJSON: () => ({ count: 42 }) }; }
    });
    mockCreateTableFromQuery.mockResolvedValue({
      toArray: () => [{ count: 42, toJSON: () => ({ count: 42 }) }],
      [Symbol.iterator]: function* () { yield { count: 42, toJSON: () => ({ count: 42 }) }; }
    });
    queryClient.clear();
  });

  it('should execute static query immediately', async () => {
    const { result } = renderHook(() => useSqlQuery('SELECT 1'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDumpIPCTable).toHaveBeenCalledWith('SELECT 1', []);
    expect(result.current.data).toEqual([{ count: 42 }]);
  });

  it('should register named table and execute', async () => {
    const { result } = renderHook(() => useSqlQuery({ orders: 'SELECT * FROM orders' }), { wrapper: Wrapper });

    expect(result.current.alias).toBe('orders');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreateTableFromQuery).toHaveBeenCalledWith('orders', 'SELECT * FROM orders', []);
  });

  it('should wait for dependencies', async () => {
    // We simulate a dependency handle that is initially pending
    const depHandle = {
      alias: 'orders',
      tableId: 'orders',
      sql: 'SELECT...',
      params: {},
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
      promise: new Promise(() => {}), // Never resolves initially
      refetch: async () => {},
      toString: () => 'orders',
    };

    const { result, rerender } = renderHook(
      ({ dep }) => useSqlQuery('SELECT count(*) FROM orders', [dep]),
      { 
        wrapper: Wrapper,
        initialProps: { dep: depHandle as any }
      }
    );

    // Should be pending and NOT called query
    expect(result.current.isPending).toBe(true);
    expect(mockDumpIPCTable).not.toHaveBeenCalled();

    // Now simulate dependency success
    const successHandle = {
      ...depHandle,
      status: 'success',
      isPending: false,
      isSuccess: true,
      updatedAt: Date.now(),
      promise: Promise.resolve(),
    };

    rerender({ dep: successHandle as any });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    }, { timeout: 5000 });

    expect(mockDumpIPCTable).toHaveBeenCalledWith('SELECT count(*) FROM orders', []);
  });

  it('should handle named parameters', async () => {
    const { result } = renderHook(
      () => useSqlQuery('SELECT * FROM users WHERE id = $id', { id: 123 }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDumpIPCTable).toHaveBeenCalledWith(
      expect.stringContaining('$1'), 
      [123]
    );
  });

  it('should deduplicate transient queries', async () => {
    const sql = 'SELECT count(*) FROM orders';
    
    const { result } = renderHook(
      () => {
        const r1 = useSqlQuery(sql);
        const r2 = useSqlQuery(sql);
        return { r1, r2 };
      },
      { wrapper: Wrapper }
    );

    expect(result.current.r1.tableId).toBe(result.current.r2.tableId);
    expect(result.current.r1.tableId).toMatch(/^transient:/);

    await waitFor(() => {
      expect(result.current.r1.isSuccess).toBe(true);
      expect(result.current.r2.isSuccess).toBe(true);
    });

    // Should only have called dumpIPCTable ONCE
    expect(mockDumpIPCTable).toHaveBeenCalledTimes(1);
    expect(mockDumpIPCTable).toHaveBeenCalledWith(sql, []);
    
    // Both should have same data
    expect(result.current.r1.data).toEqual([{ count: 42 }]);
    expect(result.current.r2.data).toEqual([{ count: 42 }]);
  });
});
