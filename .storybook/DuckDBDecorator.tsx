import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { tableToIPC, type Table } from 'apache-arrow';
import { DuckQueryWasmProvider, useDuckDB } from '../react/DuckDBProvider';
import { setRuntime } from '../react/reducks';
import { LoadingCard } from '../table/DataTable';
import { TooltipProvider } from '../table/ui/Tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function RuntimeBridge({ children }: { children: React.ReactNode }) {
  const { pool } = useDuckDB();
  setRuntime({
    async exec(sql: string) {
      const table = await pool.queryIPCTable(sql);
      return {
        rows: () => table.toArray().map((r) => r?.toJSON?.() ?? { ...r }),
        row: () => {
          const first = table.get(0);
          return first?.toJSON?.() ?? (first ? { ...first } : null);
        },
        arrowTable: table,
        raw: table,
      };
    },
    async insertArrow(name: string, arrowTable: unknown) {
      const conn = await pool.acquire();
      try {
        await conn.insertArrowFromIPCStream(tableToIPC(arrowTable as Table, 'stream'), { name, create: true });
      } finally {
        pool.release(conn);
      }
    },
  });
  return <>{children}</>;
}

export function DuckDBDecorator(Story: React.ComponentType) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingCard message="Initializing DuckDB..." />}>
        <DuckQueryWasmProvider bundlePath="/static/duckdb">
          <RuntimeBridge>
            <TooltipProvider>
              <Story />
            </TooltipProvider>
          </RuntimeBridge>
        </DuckQueryWasmProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
