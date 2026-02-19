import { useQueries } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Vector, Table, tableFromJSON } from 'apache-arrow';
import { Database, Loader2, AlertCircle } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';

import { Cell } from './components/Cell';
import { Headers } from './components/Headers';
import { QueryTableToolbar } from './components/QueryTableToolbar';
import { QueryTableProvider, useQT, type QueryTableProps, type QueryResolutionStrategy } from './components/QueryTableContext';
import { quoteIdent, normalizeSelectSql } from './components/sqlUtils';

import { Card, CardContent } from './ui/Card';
import { useDuckDB } from '../react/DuckDBProvider';
import { type QueryRef, sql, table, fromArrow, lazyTable } from '../react/reducks';

const PAGE_SIZE = 1000;
const MAX_VIEWPORT_ROWS = 200;
const DEFAULT_VIEWPORT_HEIGHT = 560;

const KEYWORD_RE = /\b(SELECT|FROM|JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|CROSS\s+JOIN|FULL\s+JOIN|LATERAL|WHERE|GROUP\s+BY|ORDER\s+BY|LIMIT|HAVING|UNION|PIVOT|UNPIVOT)\b/gi;

function condenseSql(sql: string): string {
  const cleaned = sql.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
  const parts: string[] = [];
  let lastIdx = 0;

  for (const m of cleaned.matchAll(KEYWORD_RE)) {
    const kw = m[0].replace(/\s+/g, ' ').toUpperCase();
    const between = cleaned.slice(lastIdx, m.index).trim();
    if (parts.length > 0 && between) parts.push('...');
    parts.push(kw);
    lastIdx = m.index! + m[0].length;

    if (kw === 'FROM' || kw.includes('JOIN')) {
      const after = cleaned.slice(lastIdx).trimStart();
      const srcMatch = after.match(/^'([^']+)'|^"([^"]+)"|^(\S+)/);
      if (srcMatch) {
        const raw = srcMatch[1] ?? srcMatch[2] ?? srcMatch[3]!;
        const segment = raw.includes('/') ? raw.split('/').pop()! : raw;
        const short = segment
          .replace(/\.[tf]_\d+_[a-z0-9]+\.parquet$/, '.parquet')
          .replace(/^[tf]_\d+_[a-z0-9]+\.parquet$/, 'ref');
        parts.push(short);
        lastIdx += (after.length - after.trimStart().length) + srcMatch[0].length;
      }
    }
  }

  const result = parts.join(' ');
  return result.length > 80 ? result.slice(0, 77) + '...' : result;
}

export const LoadingCard = ({ message }: { message?: string }) => (
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
    setSorting,
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
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: visibleColumns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => visibleColumns[index]?.getSize() ?? 0,
    overscan: 0,
  });

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 36,
  });

  const rawVirtualItems = virtualizer.getVirtualItems();
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const totalColumnSize = columnVirtualizer.getTotalSize();
  const virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
  const virtualPaddingRight =
    totalColumnSize - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
  const virtualItems = rawVirtualItems.length > MAX_VIEWPORT_ROWS
    ? rawVirtualItems.slice(0, MAX_VIEWPORT_ROWS)
    : rawVirtualItems;

  const firstVisibleIndex = virtualItems[0]?.index ?? 0;
  const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;

  const neededPages = useMemo(() => {
    if (firstVisibleIndex === 0 && lastVisibleIndex === 0 && virtualItems.length === 0) return [];
    const startPage = Math.floor(firstVisibleIndex / PAGE_SIZE);
    const endPage = Math.floor(lastVisibleIndex / PAGE_SIZE);
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }, [firstVisibleIndex, lastVisibleIndex, virtualItems.length]);

  const orderClause = !sorting.length ? '' : `ORDER BY ${sorting.map((s) => `${quoteIdent(s.id)} ${s.desc ? 'DESC' : 'ASC'} NULLS LAST`).join(', ')}`;

  const pageRefs = useMemo(() => {
    return neededPages.map((pageIndex) => {
      const limit = PAGE_SIZE;
      const offset = pageIndex * PAGE_SIZE;
      return sql(
        (t) => `SELECT * FROM ${t.base} ${orderClause} LIMIT ${limit} OFFSET ${offset}`,
        { base: queryParts.filteredRef }
      );
    });
  }, [neededPages, queryParts, orderClause]);

  const pageQueries = useQueries({
    queries: pageRefs.map((ref, idx) => ({
      queryKey: ['reducks-data', ref.id],
      queryFn: async () => {
        const table = await ref.toArrow();
        const vectors = new Map<string, Vector>();
        for (let i = 0; i < table.schema.fields.length; i++) {
          const f = table.schema.fields[i];
          const v = table.getChildAt(i);
          if (f && v) vectors.set(f.name, v as unknown as Vector);
        }
        return { vectors, rowCount: table.numRows };
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  const pageError = pageQueries.find((q) => q.error)?.error;
  useEffect(() => {
    if (pageError && sorting.length > 0) setSorting([]);
  }, [pageError, sorting, setSorting]);

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
        height: typeof height === 'number' ? height : DEFAULT_VIEWPORT_HEIGHT,
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
              {virtualPaddingLeft > 0 ? (
                <div aria-hidden className="shrink-0" style={{ width: virtualPaddingLeft }} />
              ) : null}
              {virtualColumns.map((virtualColumn) => {
                const col = visibleColumns[virtualColumn.index];
                if (!col) return null;
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
              {virtualPaddingRight > 0 ? (
                <div aria-hidden className="shrink-0" style={{ width: virtualPaddingRight }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const QueryError = ({ error }: { error: unknown }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-destructive/5 text-destructive animate-in fade-in zoom-in duration-300">
    <div className="flex items-center gap-3 mb-4 shrink-0">
      <div className="p-2 rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">Query Error</h3>
    </div>
    <div className="max-w-2xl w-full min-h-0">
      <pre className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 font-mono text-[11px] overflow-auto whitespace-pre-wrap break-all shadow-inner max-h-[30vh]">
        {String((error as Error)?.message || error)}
      </pre>
    </div>
  </div>
);

export type DataTableProps = Omit<QueryTableProps, 'table'> & {
  table: string | Record<string, unknown>[] | Table | QueryRef | null | undefined;
};

type DataTableInnerShellProps = Omit<DataTableProps, 'table'> & { tableRef: QueryRef };

function DataTableShell({
  id,
  tableRef,
  height,
  compact = true,
  resolutionStrategy = 'direct',
  rowHeight,
  overscan = 12,
  pool: poolProp,
  footer,
  ...props
}: DataTableInnerShellProps) {
  const effectiveRowHeight = rowHeight ?? (compact ? 24 : 28);
  const { pool: contextPool } = useDuckDB();
  const pool = poolProp ?? contextPool;
  if (tableRef.status === 'pending') return <LoadingCard />;

  const resolvedId = id ?? tableRef.id;
  const title = props.title ?? tableRef.name ?? tableRef.query;
  const effectiveTableRef = useMemo(() => {
    if (resolutionStrategy === 'materialized') {
      return table(
        (t) => `--sql\nSELECT * FROM ${t.tableRef}`,
        { tableRef }
      );
    }
    if (resolutionStrategy === 'lazy') {
      return lazyTable(
        (t) => `--sql\nSELECT * FROM ${t.tableRef}`,
        { tableRef }
      );
    }
    return tableRef;
  }, [resolutionStrategy, tableRef]);
  if (!resolvedId) {
    return <QueryError error="DataTable requires `id` unless `table` is a QueryRef entry." />;
  }

  return (
    <QueryTableProvider
      key={`${resolvedId}:${effectiveTableRef.id}`}
      id={resolvedId}
      tableRef={effectiveTableRef}
      pool={pool}
      title={title}
      compact={compact}
      {...props}
    >
      <DataTableInternal
        height={height}
        rowHeight={effectiveRowHeight}
        overscan={overscan}
        footer={footer}
      />
    </QueryTableProvider>
  );
}

export function tableInputToRef(input: DataTableProps['table'], cache?: Map<object, QueryRef>): QueryRef | null {
  if (!input) return null;
  if (typeof input === 'object' && 'type' in input && 'id' in input && 'toArray' in input) return input as QueryRef;
  if (typeof input === 'string' && input.trim()) return table(normalizeSelectSql(input));
  if (input instanceof Table || Array.isArray(input)) {
    const arrowTable = input instanceof Table ? input : tableFromJSON(input);
    if (cache) {
      let cached = cache.get(arrowTable);
      if (!cached) { cached = fromArrow(arrowTable); cache.set(arrowTable, cached); }
      return cached;
    }
    return fromArrow(arrowTable);
  }
  return null;
}

export function DataTable({ table: tableInput, ...props }: DataTableProps) {
  const cache = React.useRef(new Map<object, QueryRef>()).current;
  const ref = tableInputToRef(tableInput, cache);
  if (!ref) return null;
  return <DataTableShell {...props} tableRef={ref} />;
}

function DataTableInternal({
  height,
  rowHeight,
  overscan,
  footer,
}: {
  height?: number;
  rowHeight: number;
  overscan: number;
  footer?: React.ReactNode;
}) {
  const { isFullscreen, schemaError, countError, compact, isCompactColumnSizingReady } = useQT();

  const tableContent = (
    <Card
      className={`${isFullscreen ? 'h-full w-full rounded-none border-0' : 'h-full w-full min-w-0'} flex flex-col overflow-hidden relative max-w-full flex-1 ${height != null ? 'min-h-0' : 'min-h-80'}`}
    >
      <CardContent className="p-0 flex flex-col min-h-0 min-w-0 flex-1 relative overflow-hidden">
        <QueryTableToolbar />

        {schemaError || countError ? (
          <QueryError error={schemaError || countError} />
        ) : compact && !isCompactColumnSizingReady ? (
          <LoadingCard message="Loading" />
        ) : (
          <VirtualizedViewport height={height} rowHeight={rowHeight} overscan={overscan} />
        )}
        {footer ? <div className="shrink-0 border-t border-border/60">{footer}</div> : null}
      </CardContent>
    </Card>
  );

  if (isFullscreen) {
    return <div className="fixed inset-0 z-50 bg-background">{tableContent}</div>;
  }

  return tableContent;
}
