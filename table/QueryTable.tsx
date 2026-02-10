import { useQueries } from '@tanstack/react-query';
import {
    type ColumnDef,
    type ColumnPinningState,
    type ColumnSizingState,
    type SortingState,
    type VisibilityState,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type Vector, Table, tableFromJSON } from 'apache-arrow';
import {
  X,
  Settings2,
  Loader2,
  Database,
  AlertCircle,
  Download,
  Search,
  Maximize2,
  Minimize2,
  Maximize2,
  Minimize2,
  BarChart3,
  Copy,
  FileJson,
  FileSpreadsheet,
  FileType,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Cell } from './components/Cell';
import {
    type ColumnSummary,
    getTableDataPageQueryOptions,
    useColumnSizes,
    useColumnSummaries,
    useQueryParts,
    useTableCount,
    useTableSchema,
} from './components/Datasource';
import { Headers } from './components/Headers';
import { SqlQueryEditorPopover } from './components/SqlQueryEditorPopover';
import { type FilterValue, type FiltersState } from './components/sqlUtils';

import { useDuckDB } from '../react/DuckDBProvider';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Checkbox } from './ui/Checkbox';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { ScrollArea } from './ui/ScrollArea';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from './ui/ContextMenu';
import { useDuckDB } from '../react/DuckDBProvider';
import { type CacheEntry } from '../react/DataCoordinator';
import { getCoordinator } from '../react/reducks';

// --- Types & Helpers ---

export type DataTableSource =
  | { type: 'sql'; sql: string; params?: unknown[] }
  | { type: 'data'; data: Record<string, unknown>[]; tableName?: string; sql?: string }
  | { type: 'arrow'; table: Table; tableName?: string; sql?: string }
  | { type: 'entry'; entry: CacheEntry };

/** Create a SQL data source */
export function query(sql: string, params?: unknown[]): DataTableSource {
  return { type: 'sql', sql, params };
}

/** Create a data source from in-memory objects */
export function fromJSON(data: Record<string, unknown>[], tableName?: string): DataTableSource {
  return { type: 'data', data, tableName };
}

/** Create a data source from a Reducks CacheEntry */
export function fromEntry(entry: CacheEntry): DataTableSource {
  return { type: 'entry', entry };
}

type QueryTableProps = {
  /** The table data source. Can be a SQL string, an array of objects, a CacheEntry, or a DataTableSource object. */
  table?: string | Record<string, unknown>[] | Table | CacheEntry | DataTableSource | null;
  /** SQL query (legacy prop) */
  sql?: string;
  /** SQL parameters (legacy prop) */
  params?: unknown[];
  height?: number;
  rowHeight?: number;
  overscan?: number;
  getRowClassName?: (ctx: { get: (col: string) => unknown; rowIndex: number }) => string;
  renderCell?: (ctx: {
    colName: string;
    type: string;
    rawValue: unknown;
    display: string;
    rowIndex: number;
    pageRowIndex: number;
  }) => React.ReactNode | undefined;
  enableFilters?: boolean;
  colDefaultWidth?: number;
  colMinWidth?: number;
  colMaxWidth?: number;

  pool?: ReturnType<typeof useDuckDB>['pool'];
  /** Show a fixed row number column on the left */
  showRowNumbers?: boolean;
  /** Called when the user clicks the close/back button. When provided, a close button is shown in the toolbar. */
  onClose?: () => void;
};

const PAGE_SIZE = 1000;

// Estimates for column width (defaults; can be overridden per table)
const COL_DEFAULT_WIDTH = 140;
const COL_MIN_WIDTH = 80;
const COL_MAX_WIDTH = 180;
const ESTIMATE_CHAR_PX = 4;
const ESTIMATE_PADDING_PX = 32;

let tableCounter = 0;
function getNextTableName() {
  return `_dt_${++tableCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

// --- Internal Components ---

type VirtualizedViewportProps = {
  pool: ReturnType<typeof useDuckDB>['pool'];
  height?: number;
  rowHeight: number;
  overscan: number;

  rowCount: number;
  table: ReturnType<typeof useReactTable<Record<string, unknown>>>;
  schema: { name: string; type: string; fields?: { name: string; type: string }[] }[];
  summaryMap: Map<string, ColumnSummary>;

  setFilters: FiltersState;
  openFilterCol: string | null;
  onOpenFilterCol: (col: string | null) => void;
  filterSearch: string;
  onChangeFilterSearch: (next: string) => void;
  onClearCol: (col: string) => void;
  onChangeFilter: (col: string, next: FilterValue | undefined) => void;

  sql: string;
  params?: unknown[];
  globalFilter: string;
  fieldNamesForGlobal: string[];
  enableFilters?: boolean;
  showRowNumbers?: boolean;

  queryParts: ReturnType<typeof useQueryParts>;
  sorting: SortingState;
  getRowClassName?: (ctx: { get: (col: string) => unknown; rowIndex: number }) => string;
  renderCell?: QueryTableProps['renderCell'];
};

const VirtualizedViewport = React.memo(function VirtualizedViewport({
  pool,
  height,
  rowHeight,
  overscan,
  rowCount,
  table,
  schema,
  summaryMap,
  setFilters,
  openFilterCol,
  onOpenFilterCol,
  filterSearch,
  onChangeFilterSearch,
  onClearCol,
  onChangeFilter,
  sql,
  params,
  globalFilter,
  fieldNamesForGlobal,
  enableFilters = true,
  showRowNumbers: _showRowNumbers = false,
  queryParts,
  sorting,
  getRowClassName,
  renderCell,
}: VirtualizedViewportProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const schemaTypeByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of schema) {
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
      <Headers
        table={table}
        schema={schema}
        setFilters={setFilters}
        enableFilters={enableFilters}
        openFilterCol={openFilterCol}
        onOpenFilterCol={onOpenFilterCol}
        filterSearch={filterSearch}
        onChangeFilterSearch={onChangeFilterSearch}
        onClearCol={onClearCol}
        onChangeFilter={onChangeFilter}
        sql={sql}
        params={params}
        globalFilter={globalFilter}
        fieldNamesForGlobal={fieldNamesForGlobal}
      />

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
  table: tableInput,
  sql: sqlInput,
  params: paramsInput,
  height,
  rowHeight = 28,
  overscan = 12,
  getRowClassName,
  renderCell,
  enableFilters = true,
  colDefaultWidth = COL_DEFAULT_WIDTH,
  colMinWidth = COL_MIN_WIDTH,
  colMaxWidth = COL_MAX_WIDTH,
  pool: poolProp,
  showRowNumbers = false,
  onClose,
}: QueryTableProps) {
  const { pool: contextPool } = useDuckDB();

  // If a DQuery is provided via query prop, use its pool
  const pool = poolProp ?? contextPool;

  // Helper to detect a CacheEntry (has slug + status + type fields)
  const isCacheEntry = (v: unknown): v is CacheEntry =>
    !!v && typeof v === 'object' && 'slug' in v && 'status' in v && 'id' in v;

  // 1. Resolve source from various inputs
  const source = useMemo<DataTableSource | null>(() => {
    if (tableInput) {
      if (typeof tableInput === 'string') return query(tableInput, paramsInput);
      if (Array.isArray(tableInput)) return { type: 'data', data: tableInput, sql: sqlInput };
      if (tableInput instanceof Table) {
        return {
          type: 'arrow',
          table: tableInput,
          sql: sqlInput,
        };
      }
      if (isCacheEntry(tableInput)) return { type: 'entry', entry: tableInput };
      return tableInput;
    }
    if (sqlInput) return query(sqlInput, paramsInput);
    return null;
  }, [tableInput, sqlInput, paramsInput]);

  // 2. Resolve entry sources to SQL
  // Builds a single query with CTEs for all dependencies (including fragments)
  // so the user sees clean, editable SQL like `WITH dep1 AS (...), dep2 AS (...) SELECT * FROM entry_id`
  const entryResolved = useMemo<{ sql: string; chain: { entry: CacheEntry; resolvedSql: string; originalSql: string }[] } | null>(() => {
    if (!source || source.type !== 'entry' || !pool) return null;
    const { entry } = source;
    if (entry.status !== 'ready') return null;

    const coordinator = getCoordinator(pool);
    const sql = coordinator.resolveEntryAsSql(entry);
    const dependencyChain = coordinator.getDependencyChain(entry);
    const ladder = [...dependencyChain, entry];
    const byId = new Map<string, CacheEntry>(ladder.map((item) => [item.id, item]));
    const toOriginalSql = (item: CacheEntry) => {
      if (!item.query) return item.type === 'table' ? `SELECT * FROM ${item.slug}` : '';
      let restored = item.query;
      for (const depId of item.dependencies) {
        const dep = byId.get(depId);
        if (!dep) continue;
        restored = restored.split(dep.id).join(dep.slug);
        if (dep.path) {
          restored = restored.split(`'${dep.path}'`).join(dep.slug);
          restored = restored.split(dep.path).join(dep.slug);
        }
      }
      return restored;
    };
    const chain = ladder.map((item) => ({
      entry: item,
      resolvedSql: coordinator.resolveEntryAsSql(item),
      originalSql: toOriginalSql(item),
    }));

    return { sql, chain };
  }, [source, pool]);

  // 3. Handle data registration if it's in-memory data
  const [registered, setRegistered] = useState<{
    sql: string;
    params?: unknown[];
    pool?: typeof pool;
  } | null>(null);

  useEffect(() => {
    if (!source || (source.type !== 'data' && source.type !== 'arrow') || !pool) {
      setRegistered(null);
      return;
    }

    let cancelled = false;
    const tableName = ('tableName' in source && source.tableName) || getNextTableName();

    async function register() {
      try {
        let tableToInsert: Table | null = null;
        if (source?.type === 'arrow') {
          tableToInsert = source.table;
        } else if (source?.type === 'data') {
          tableToInsert = tableFromJSON(source.data);
        }

        if (tableToInsert) {
          const conn = await pool.acquire();
          try {
            await conn.insertArrowTable(tableToInsert, {
              name: tableName,
              create: true, // Create a new table
            });
          } finally {
            pool.release(conn);
          }
        }

        if (cancelled) return;

        let sql = (source as { sql?: string }).sql || `SELECT * FROM DATA`;
        // Replace DATA alias with actual table name
        sql = sql.replace(/\bDATA\b/gi, `"${tableName}"`);

        setRegistered({ sql });
      } catch (err) {
        console.error('[DataTable] Failed to register data:', err);
      }
    }

    void register();
    return () => {
      cancelled = true;
      pool.query(`DROP TABLE IF EXISTS "${tableName}"`).catch(() => {});
    };
  }, [source, pool]);

  // 4. Get initial SQL and params
  const initSql = source?.type === 'sql' ? source.sql
    : source?.type === 'entry' ? entryResolved?.sql
    : registered?.sql;
  const params = source?.type === 'sql' ? source.params : registered?.params;

  // Show loading while entry is not ready
  if (source?.type === 'entry' && !entryResolved) {
    return (
      <Card className="h-full w-full min-w-0 flex flex-col overflow-hidden items-center justify-center bg-muted/5 border-dashed">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Database className="h-8 w-8 text-muted-foreground/20" />
            <Loader2 className="h-4 w-4 animate-spin text-primary absolute -bottom-1 -right-1" />
          </div>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
            waiting for data...
          </div>
        </div>
      </Card>
    );
  }

  // Show loading while registering data
  if ((source?.type === 'data' || source?.type === 'arrow') && !registered) {
    return (
      <Card className="h-full w-full min-w-0 flex flex-col overflow-hidden items-center justify-center bg-muted/5 border-dashed">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Database className="h-8 w-8 text-muted-foreground/20" />
            <Loader2 className="h-4 w-4 animate-spin text-primary absolute -bottom-1 -right-1" />
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
            registering data...
          </div>
        </div>
      </Card>
    );
  }

  if (!initSql) return null;

  return (
    <QueryTableInternal
      key={initSql} // Reset state when the fundamental SQL changes
      initSql={initSql}
      chain={entryResolved?.chain}
      entry={source?.type === 'entry' ? source.entry : undefined}
      params={params}
      height={height}
      rowHeight={rowHeight}
      overscan={overscan}
      getRowClassName={getRowClassName}
      renderCell={renderCell}
      enableFilters={enableFilters}
      colDefaultWidth={colDefaultWidth}
      colMinWidth={colMinWidth}
      colMaxWidth={colMaxWidth}
      pool={pool}
      showRowNumbers={showRowNumbers}
      onClose={onClose}
    />
  );
}

function QueryTableInternal({
  initSql,
  chain,
  entry,
  params,
  height,
  rowHeight,
  overscan,
  getRowClassName,
  renderCell,
  enableFilters,
  colDefaultWidth,
  colMinWidth,
  colMaxWidth,
  pool,
  showRowNumbers = false,
  onClose,
}: Omit<QueryTableProps, 'table' | 'sql'> & {
  initSql: string;
  chain?: { entry: CacheEntry; resolvedSql: string; originalSql: string }[];
  entry?: CacheEntry;
  pool: ReturnType<typeof useDuckDB>['pool'];
  onClose?: () => void;
}) {
  const [sql, onSaveSql] = useState(initSql);
  const lastInitSqlRef = useRef(initSql);

  // If the parent changes the SQL prop (e.g. selecting a different carrier),
  // keep the internal state in sync.
  useEffect(() => {
    if (lastInitSqlRef.current === initSql) return;
    lastInitSqlRef.current = initSql;
    onSaveSql(initSql);
  }, [initSql]);

  // --- State ---
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [setFilters, setSetFilters] = useState<FiltersState>({});
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // When filters are disabled for a table (e.g. pricing grid pivot), automatically tighten widths.
  const effectiveColDefaultWidth = enableFilters
    ? colDefaultWidth!
    : Math.min(colDefaultWidth!, 72);
  const effectiveColMinWidth = enableFilters ? colMinWidth! : Math.min(colMinWidth!, 44);
  const effectiveColMaxWidth = enableFilters ? colMaxWidth! : Math.min(colMaxWidth!, 110);

  const lastSqlRef = useRef<string>('');
  // 3b. Sizes (for auto-sizing)
  const { data: columnSizes = [] } = useColumnSizes({
    sql,
    params,
    globalFilter,
    setFilters,
  });

  // --- Queries ---
  // 1. Schema
  const schemaQuery = useTableSchema({
    sql,
    params,
    globalFilter,
    setFilters,
  });
  const schema = schemaQuery.data ?? [];
  const schemaError = schemaQuery.error;
  const schemaLoading = schemaQuery.isLoading || schemaQuery.isFetching;

  const fieldNames = useMemo(() => schema.map((f) => f.name), [schema]);

  // 2. Count
  const countQuery = useTableCount({
    sql,
    params,
    globalFilter,
    setFilters,
  });
  const rowCount = countQuery.data ?? 0;
  const countError = countQuery.error;
  const countLoading = countQuery.isLoading || countQuery.isFetching;

  // Check if this is the initial load (no data yet)
  const isInitialLoad = schemaLoading || (countLoading && schema.length === 0);

  // 3a. Summaries (for visibility heuristics & pill display)
  const summariesQuery = useColumnSummaries({
    sql,
    params,
    globalFilter,
    setFilters,
  });
  const columnSummaries = summariesQuery.data ?? [];

  // 4. Query Parts
  const queryParts = useQueryParts({
    sql,
    params,
    globalFilter,
    setFilters,
    fieldNames,
  });

  // --- TanStack Table Setup ---
  const summaryMap = useMemo(
    () => new Map(columnSummaries.map((s) => [s.name, s])),
    [columnSummaries]
  );

  const sizeMap = useMemo(() => new Map(columnSizes.map((s) => [s.name, s])), [columnSizes]);

  // Construct columns
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const dataColumns = schema.flatMap((col) => {
      // If it's a STRUCT with fields, expand into sub-columns
      if (col.fields && col.fields.length > 0) {
        return col.fields.map((f: { name: string; type: string }) => {
          const subName = `${col.name}.${f.name}`;
          const displayName = subName.replace(/^\d+_/, '');
          return {
            id: subName,
            accessorKey: subName,
            header: displayName,
            size: effectiveColDefaultWidth,
            minSize: effectiveColMinWidth,
            maxSize: effectiveColMaxWidth,
          };
        });
      }

      // Strip numeric prefix from column names (e.g., "001_0-5" -> "0-5")
      const displayName = col.name.replace(/^\d+_/, '');
      return [
        {
          id: col.name,
          accessorKey: col.name,
          header: displayName,
          // Default width until DB summaries arrive
          size: effectiveColDefaultWidth,
          minSize: effectiveColMinWidth,
          maxSize: effectiveColMaxWidth,
        },
      ];
    });

    // Add row number column if enabled
    if (showRowNumbers) {
      return [
        {
          id: '_row_index',
          accessorKey: '_row_index',
          header: '#',
          size: 60,
          minSize: 50,
          maxSize: 80,
          enableSorting: false,
          enableColumnFilter: false,
          enableHiding: false,
          meta: { isRowIndex: true },
        },
        ...dataColumns,
      ];
    }

    return dataColumns;
  }, [
    schema,
    effectiveColDefaultWidth,
    effectiveColMinWidth,
    effectiveColMaxWidth,
    showRowNumbers,
  ]);

  // Seed column widths from DB, once per schema
  const initializedSchemaRef = useRef<string>('');

  useEffect(() => {
    if (!lastSqlRef.current) {
      lastSqlRef.current = sql;
      return;
    }
    if (lastSqlRef.current === sql) return;
    lastSqlRef.current = sql;

    // SQL changed (likely edited) → reset any UI state that may not make sense across a new query.
    setSorting([]);
    setColumnSizing({});
    setColumnVisibility({});
    setGlobalFilter('');
    setSetFilters({});
    setOpenFilterCol(null);
    setFilterSearch('');
    initializedSchemaRef.current = '';
  }, [sql]);

  useEffect(() => {
    const nextSchemaKey = fieldNames.join(',');
    if (
      !nextSchemaKey ||
      columnSizes.length === 0 ||
      initializedSchemaRef.current === nextSchemaKey
    ) {
      return;
    }

    const newSizing: ColumnSizingState = {};
    // Row index column has fixed width
    if (showRowNumbers) {
      newSizing['_row_index'] = 60;
    }
    for (const name of fieldNames) {
      const headerLen = name.length;
      const size = sizeMap.get(name);
      const p80 = size?.p80Len ?? 0;
      const maxLen = Math.max(headerLen, p80);
      const estimatedWidth = Math.ceil(maxLen * ESTIMATE_CHAR_PX + ESTIMATE_PADDING_PX);
      const clampedWidth = Math.max(
        effectiveColMinWidth,
        Math.min(effectiveColMaxWidth, estimatedWidth)
      );
      newSizing[name] = clampedWidth;
    }
    setColumnSizing(newSizing);
    initializedSchemaRef.current = nextSchemaKey;
  }, [
    columnSizes,
    fieldNames,
    sizeMap,
    rowCount,
    effectiveColMinWidth,
    effectiveColMaxWidth,
    showRowNumbers,
  ]);

  // Hide empty columns by default (still toggleable in UI)
  const initializedVisibilityRef = useRef<string>('');
  useEffect(() => {
    const schemaKey = fieldNames.join(',');
    if (
      !schemaKey ||
      initializedVisibilityRef.current === schemaKey ||
      columnSummaries.length === 0
    ) {
      return;
    }
    if (Object.keys(columnVisibility).length > 0) return;

    const nextVisibility: VisibilityState = {};
    // Always show row index column if enabled
    if (showRowNumbers) {
      nextVisibility['_row_index'] = true;
    }
    const candidates: Array<{ name: string; visible: boolean }> = [];
    for (const name of fieldNames) {
      // const s = summaryMap.get(name);
      // Disable hiding heuristic - show everything by default as requested by user
      const shouldHide = false;
      const visible = !shouldHide;
      nextVisibility[name] = visible;
      candidates.push({ name, visible });
    }

    const anyVisible = Object.values(nextVisibility).some(Boolean);
    if (!anyVisible && fieldNames.length > 0) {
      const firstNonHidden = candidates.find((c) => c.visible)?.name;
      nextVisibility[firstNonHidden ?? fieldNames[0]!] = true;
    }

    setColumnVisibility(nextVisibility);
    initializedVisibilityRef.current = schemaKey;
  }, [columnSummaries, fieldNames, summaryMap, columnVisibility, showRowNumbers]);

  const table = useReactTable({
    data: [],
    columns,
    state: {
      sorting,
      columnSizing,
      columnPinning,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnSizingChange: (updater) => {
      setColumnSizing((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  // --- Handlers ---
  const onClearCol = useCallback((col: string) => {
    setSetFilters((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  }, []);

  const onChangeFilter = useCallback((col: string, next: FilterValue | undefined) => {
    setSetFilters((prev) => {
      const nextState = { ...prev };
      if (!next) delete nextState[col];
      else nextState[col] = next;
      return nextState;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSetFilters({});
    setGlobalFilter('');
    setOpenFilterCol(null);
    setFilterSearch('');
  }, []);

  // --- Export Handler ---
  const handleExport = useCallback(
    async (
      format: 'csv' | 'json' | 'parquet' | 'tsv',
      mode: 'download' | 'clipboard' = 'download'
    ) => {
      if (!pool || !queryParts.baseSql) return;

      setIsDownloading(true);
      try {
        const fullSql = `
          WITH base AS (${queryParts.baseSql})
          SELECT * FROM base
          ${queryParts.whereClause}
        `;

        const extension = format;
        let copyOptions = '(FORMAT CSV, HEADER true)';
        if (format === 'json') copyOptions = '(FORMAT JSON, ARRAY true)';
        else if (format === 'parquet') copyOptions = '(FORMAT PARQUET)';
        else if (format === 'tsv') copyOptions = "(FORMAT CSV, DELIMITER '\t', HEADER true)";

        const exportFileName = `export_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;
        const conn = await pool.acquire();

        try {
          await pool.db.registerEmptyFileBuffer(exportFileName);
          await pool.query(
            `COPY (${fullSql}) TO '${exportFileName}' ${copyOptions}`,
            queryParts.fullParams
          );
          const fileBuffer = await pool.db.copyFileToBuffer(exportFileName);

          if (mode === 'clipboard') {
            const text = new TextDecoder().decode(fileBuffer);
            await navigator.clipboard.writeText(text);
          } else {
            const mimeType =
              format === 'csv' || format === 'tsv'
                ? 'text/csv;charset=utf-8;'
                : format === 'json'
                  ? 'application/json;charset=utf-8;'
                  : 'application/octet-stream';

            const blob = new Blob([fileBuffer as unknown as BlobPart], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        } finally {
          pool.release(conn);
          try {
            await pool.db.dropFile(exportFileName);
          } catch {}
        }
      } catch (error) {
        console.error(`[QueryTable] Export failed (${format}, ${mode}):`, error);
      } finally {
        setIsDownloading(false);
      }
    },
    [pool, queryParts.baseSql, queryParts.whereClause, queryParts.fullParams]
  );

  // --- Filters UI Logic ---
  const activeSetFilters = useMemo(() => {
    return Object.entries(setFilters)
      .filter(([, val]) => val !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [setFilters]);

  const fieldNamesForGlobal = useMemo(
    () => (globalFilter.trim() ? fieldNames : ([] as string[])),
    [globalFilter, fieldNames]
  );

  const totalFilterCount = (globalFilter ? 1 : 0) + activeSetFilters.length;
  const globalFilterActive = !!globalFilter.trim();

  const tableContent = (
    <Card
      className={`${isFullscreen ? 'h-full w-full rounded-none border-0' : 'h-full w-full min-w-0'} flex flex-col overflow-hidden relative max-w-full flex-1`}
    >
      <CardContent className="p-0 flex flex-col min-h-0 min-w-0 flex-1 relative overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>

          <ContextMenu>
            <ContextMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => void handleExport('csv')}
                disabled={isInitialLoad || rowCount === 0 || isDownloading}
                title="Download (Right-click for options)"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
            </ContextMenuTrigger>
            <ContextMenuContent alignOffset={-5}>
              <ContextMenuLabel>Copy to Clipboard</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => void handleExport('csv', 'clipboard')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy as CSV
              </ContextMenuItem>
              <ContextMenuItem onClick={() => void handleExport('json', 'clipboard')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy as JSON
              </ContextMenuItem>
              <ContextMenuItem onClick={() => void handleExport('tsv', 'clipboard')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy as TSV (for Excel)
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuLabel>Download</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => void handleExport('csv')}>
                <FileType className="mr-2 h-4 w-4" />
                Download as CSV
              </ContextMenuItem>
              <ContextMenuItem onClick={() => void handleExport('json')}>
                <FileJson className="mr-2 h-4 w-4" />
                Download as JSON
              </ContextMenuItem>
              <ContextMenuItem onClick={() => void handleExport('parquet')}>
                <FileType className="mr-2 h-4 w-4" />
                Download as Parquet
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap flex items-center gap-2">
            {isInitialLoad ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Loading...</span>
              </>
            ) : (
              <span>{rowCount.toLocaleString()} rows</span>
            )}
          </div>

          {/* SQL preview (must never widen the table) */}
          <div className="min-w-0 flex-1 overflow-hidden">
            {onSaveSql ? (
              <SqlQueryEditorPopover
                sql={sql}
                onSave={onSaveSql}
                chain={chain}
                entry={entry}
                onReplay={(replaySql: string) => {
                  onSaveSql(replaySql);
                }}
              />
            ) : (
              <div
                className="text-[11px] text-muted-foreground truncate w-full"
                title={sql.replace(/\s+/g, ' ').trim()}
              >
                {sql.replace(/\s+/g, ' ').trim()}
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {enableFilters && (activeSetFilters.length > 0 || globalFilterActive) && (
            <div className="hidden lg:flex items-center gap-2 max-w-[60%] overflow-hidden shrink-0">
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                filters:
              </div>

              {totalFilterCount === 1 ? (
                <div className="flex flex-wrap items-center gap-2 overflow-hidden max-h-7">
                  {globalFilterActive && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono"
                      title="Clear global filter"
                      onClick={() => setGlobalFilter('')}
                    >
                      <span className="truncate max-w-35">global</span>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}

                  {activeSetFilters.map(([col, val]) => {
                    let label = '';
                    if (val.type === 'set') label = `(${val.values.length})`;
                    else if (val.type === 'range')
                      label = `[${Math.round(val.min * 100) / 100}, ${Math.round(val.max * 100) / 100}]`;

                    return (
                      <button
                        key={col}
                        type="button"
                        className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono"
                        title={`Clear ${col}`}
                        onClick={() => onClearCol(col)}
                      >
                        <span className="truncate max-w-45">{col}</span>
                        <span className="text-muted-foreground">{label}</span>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center"
                      title="Show all active filters"
                    >
                      [{totalFilterCount} filters see more]
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-130 p-3" align="end">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-xs text-muted-foreground">
                        active filters ({totalFilterCount})
                      </div>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                        onClick={clearAllFilters}
                      >
                        clear all
                      </button>
                    </div>

                    <ScrollArea className="max-h-80 pr-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {globalFilterActive && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono"
                            title="Clear global filter"
                            onClick={() => setGlobalFilter('')}
                          >
                            <span className="truncate max-w-60">global</span>
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        )}

                        {activeSetFilters.map(([col, val]) => {
                          let label = '';
                          if (val.type === 'set') label = `(${val.values.length})`;
                          else if (val.type === 'range') {
                            label = `[${Math.round(val.min * 100) / 100}, ${Math.round(val.max * 100) / 100}]`;
                          }

                          return (
                            <button
                              key={col}
                              type="button"
                              className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono"
                              title={`Clear ${col}`}
                              onClick={() => onClearCol(col)}
                            >
                              <span className="truncate max-w-65">{col}</span>
                              <span className="text-muted-foreground">{label}</span>
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-50 p-2">
                <div className="text-xs font-semibold mb-2 text-muted-foreground">
                  Toggle Columns
                </div>
                <ScrollArea className="h-50">
                  <div className="flex flex-col gap-1.5">
                    {table.getAllLeafColumns().map((column) => {
                      const isRowIndex = column.id === '_row_index';
                      return (
                        <div key={column.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`col-toggle-${column.id}`}
                            checked={column.getIsVisible()}
                            onCheckedChange={(val) => column.toggleVisibility(!!val)}
                            disabled={isRowIndex}
                          />
                          <Label
                            htmlFor={`col-toggle-${column.id}`}
                            className={`text-xs font-normal truncate ${isRowIndex ? 'text-muted-foreground' : ''}`}
                          >
                            {column.id}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {enableFilters &&
              (isSearchExpanded ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={searchInputRef}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    onBlur={() => {
                      if (!globalFilter.trim()) {
                        setIsSearchExpanded(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setGlobalFilter('');
                        setIsSearchExpanded(false);
                      }
                    }}
                    placeholder="global filter"
                    className="w-40 h-7 text-xs shrink-0"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setGlobalFilter('');
                      setIsSearchExpanded(false);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 0);
                  }}
                  title="Search"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              ))}

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onClose}
                title="Back to chart view"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {schemaError || countError ? (
          <QueryError error={schemaError || countError} />
        ) : (
          <VirtualizedViewport
            pool={pool}
            height={height}
            rowHeight={rowHeight!}
            overscan={overscan!}
            rowCount={rowCount}
            table={table}
            schema={schema}
            summaryMap={summaryMap}
            setFilters={setFilters}
            openFilterCol={openFilterCol}
            onOpenFilterCol={(col) => {
              setFilterSearch('');
              setOpenFilterCol(col);
            }}
            filterSearch={filterSearch}
            onChangeFilterSearch={setFilterSearch}
            onClearCol={onClearCol}
            onChangeFilter={onChangeFilter}
            sql={sql}
            params={params}
            globalFilter={globalFilter}
            fieldNamesForGlobal={fieldNamesForGlobal}
            enableFilters={enableFilters}
            showRowNumbers={showRowNumbers}
            queryParts={queryParts}
            sorting={sorting}
            getRowClassName={getRowClassName}
            renderCell={renderCell}
          />
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
