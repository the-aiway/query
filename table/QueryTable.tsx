import { useQueries } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Vector, Table } from 'apache-arrow';
import { Database, Loader2, AlertCircle } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';

import { Cell } from './components/Cell';
import { getTableDataPageQueryOptions } from './components/Datasource';
import { Headers } from './components/Headers';
import { QueryTableToolbar } from './components/QueryTableToolbar';
import { useResolvedSource } from './components/useResolvedSource';
import { QueryTableProvider, useQT, type QueryTableProps } from './components/QueryTableContext';

import { Card, CardContent } from './ui/Card';
import { useDuckDB } from '../react/DuckDBProvider';

const PAGE_SIZE = 1000;

// --- Loading Card ---

const LoadingCard = ({ message }: { message?: string }) => (
  <Card className="h-full w-full min-w-0 flex flex-col overflow-hidden items-center justify-center bg-muted/5 border-dashed">
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Database className="h-8 w-8 text-muted-foreground/20" />
        <Loader2 className="h-4 w-4 animate-spin text-primary absolute -bottom-1 -right-1" />
      </div>
      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
        {message ?? 'loading...'}
      </div>
    </div>
  </Card>
);

// --- Internal Components ---

const VirtualizedViewport = React.memo(function VirtualizedViewport({
  height,
  rowHeight,
  overscan,
}: {
  height?: number;
  rowHeight: number;
  overscan: number;
}) {
  const {
    pool,
    rowCount,
    table,
    schema,
    summaryMap,
    queryParts,
    sorting,
    getRowClassName,
    renderCell,
  } = useQT();

  const parentRef = useRef<HTMLDivElement | null>(null);

  const schemaTypeByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of schema ?? []) {
      map.set(s.name, s.type);
      if (s.fields) {
        for (const f of s.fields) {
          map.set(`${s.name}.${f.name}`, f.type);
        }
      }
    }
    return map;
  }, [schema]);

  const visibleColumns = table.getVisibleLeafColumns();

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const neededPages = useMemo(() => {
    const first = virtualItems[0];
    const last = virtualItems[virtualItems.length - 1];
    if (!first || !last) return [];
    const startPage = Math.floor(first.index / PAGE_SIZE);
    const endPage = Math.floor(last.index / PAGE_SIZE);
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }, [virtualItems]);

  const pageQueries = useQueries({
    queries: neededPages.map((pageIndex) =>
      getTableDataPageQueryOptions(pool, queryParts, sorting, PAGE_SIZE, pageIndex * PAGE_SIZE)
    ),
  });

  const pageDataMap = useMemo(() => {
    const map = new Map<number, { vectors: Map<string, Vector>; rowCount: number } | undefined>();
    neededPages.forEach((pageIndex, i) => {
      const result = pageQueries[i];
      if (result?.data) map.set(pageIndex, result.data);
    });
    return map;
  }, [neededPages, pageQueries]);

  return (
    <div
      ref={parentRef}
      className="overflow-auto flex-1 min-h-0 min-w-0 bg-background w-full"
      style={{
        height: typeof height === 'number' ? height : undefined,
        contain: 'size layout paint',
      }}
    >
      <Headers />

      <div style={{ height: totalSize, position: 'relative', width: 'fit-content', minWidth: '100%' }}>
        {virtualItems.map((vi) => {
          const rowIndex = vi.index;
          const pageIndex = Math.floor(rowIndex / PAGE_SIZE);
          const pageRowIndex = rowIndex % PAGE_SIZE;
          const pageData = pageDataMap.get(pageIndex);
          const zebra = rowIndex % 2 === 0;
          const get = (col: string) => {
            if (col.includes('.')) {
              const [parent, child] = col.split('.');
              const val = pageData?.vectors?.get(parent!)?.get(pageRowIndex);
              return val && typeof val === 'object' ? val[child!] : undefined;
            }
            return pageData?.vectors?.get(col)?.get(pageRowIndex);
          };
          const extraRowClass = getRowClassName ? getRowClassName({ get, rowIndex }) : '';

          return (
            <div
              key={rowIndex}
              className={`flex border-b ${zebra ? 'bg-background' : 'bg-muted/10'} hover:bg-muted/30 ${extraRowClass}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateY(${vi.start}px)`,
                height: vi.size,
                width: 'fit-content',
                minWidth: '100%',
              }}
            >
              {visibleColumns.map((col) => {
                const colName = col.id;
                const type = schemaTypeByName.get(colName) ?? '';
                const summary = summaryMap.get(colName);
                const isRowIndex = colName === '_row_index';

                return (
                  <Cell
                    key={col.id}
                    column={col}
                    colName={colName}
                    type={type}
                    pageData={pageData}
                    pageRowIndex={pageRowIndex}
                    rowIndex={rowIndex}
                    summary={summary}
                    renderCell={renderCell}
                    isRowIndex={isRowIndex}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const QueryError = ({ error }: { error: unknown }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-destructive/5 text-destructive animate-in fade-in zoom-in duration-300">
    <div className="flex items-center gap-3 mb-4 shrink-0">
      <div className="p-2 rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">Query Error</h3>
    </div>
    <div className="max-w-2xl w-full min-h-0">
      <pre className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] overflow-auto whitespace-pre-wrap break-all shadow-inner max-h-[30vh]">
        {String((error as Error)?.message || error)}
      </pre>
    </div>
  </div>
);

// --- Main Components ---

export function QueryTable({
  id,
  table: tableInput,
  height,
  rowHeight = 28,
  overscan = 12,
  pool: poolProp,
  ...props
}: QueryTableProps) {
  const { pool: contextPool } = useDuckDB();
  const pool = poolProp ?? contextPool;

  const [editedSql, setEditedSql] = useState<string | null>(null);
  const resolved = useResolvedSource(editedSql ?? tableInput, pool);

  if (resolved.loading) {
    return <LoadingCard message={resolved.loadingMessage} />;
  }

  if (!resolved.sql) return null;

  return (
    <QueryTableProvider
      key={resolved.sql}
      id={id}
      initSql={resolved.sql}
      initOriginalSql={resolved.originalSql ?? undefined}
      entry={resolved.entry}
      params={resolved.params}
      pool={pool}
      onEditSql={setEditedSql}
      title={props.title ?? id}
      refreshing={resolved.refreshing}
      {...props}
    >
      <QueryTableInternal height={height} rowHeight={rowHeight} overscan={overscan} />
    </QueryTableProvider>
  );
}

function QueryTableInternal({
  height,
  rowHeight,
  overscan,
}: {
  height?: number;
  rowHeight: number;
  overscan: number;
}) {
  const { isFullscreen, schemaError, countError } = useQT();

  const tableContent = (
    <Card
      className={`${isFullscreen ? 'h-full w-full rounded-none border-0' : 'h-full w-full min-w-0'} flex flex-col overflow-hidden relative max-w-full flex-1 min-h-80`}
    >
      <CardContent className="p-0 flex flex-col min-h-0 min-w-0 flex-1 relative overflow-hidden">
        <QueryTableToolbar />

        {schemaError || countError ? (
          <QueryError error={schemaError || countError} />
        ) : (
          <VirtualizedViewport height={height} rowHeight={rowHeight} overscan={overscan} />
        )}
      </CardContent>
    </Card>
  );

  if (isFullscreen) {
    return <div className="fixed inset-0 z-50 bg-background">{tableContent}</div>;
  }

  return tableContent;
}

export const DataTable = QueryTable;
export default QueryTable;
