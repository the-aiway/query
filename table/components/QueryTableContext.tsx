import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  type ColumnSizingState,
  type ColumnPinningState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { Table } from 'apache-arrow';
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';

import {
  type ColumnSummary,
  useColumnSummaries,
  useColumnSizes,
  useQueryParts,
  useTableCount,
  useTableSchema,
} from './Datasource';
import { type FilterValue, type FiltersState } from './sqlUtils';
import { useDuckDB } from '../../react/DuckDBProvider';
import { type QueryRef } from '../../react/reducks';

export type QueryTableProps = {
  table?: string | Record<string, unknown>[] | QueryRef | Table | null;
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
  showRowNumbers?: boolean;
  onClose?: () => void;
};

const COL_DEFAULT_WIDTH = 140;
const COL_MIN_WIDTH = 80;
const COL_MAX_WIDTH = 180;
const ESTIMATE_CHAR_PX = 4;
const ESTIMATE_PADDING_PX = 32;

function useQueryTableState({
  initSql,
  entry,
  params,
  pool,
  enableFilters = true,
  showRowNumbers = false,
  colDefaultWidth = COL_DEFAULT_WIDTH,
  colMinWidth = COL_MIN_WIDTH,
  colMaxWidth = COL_MAX_WIDTH,
  getRowClassName,
  renderCell,
  onClose,
  title,
}: {
  title: string,
  initSql: string;
  entry?: QueryRef;
  params?: unknown[];
  pool: ReturnType<typeof useDuckDB>['pool'];
} & Omit<QueryTableProps, 'table' | 'pool' | 'height' | 'rowHeight' | 'overscan'>) {
  const [sql, setSql] = useState(initSql);
  const lastInitSqlRef = useRef(initSql);

  useEffect(() => {
    if (lastInitSqlRef.current === initSql) return;
    lastInitSqlRef.current = initSql;
    setSql(initSql);
  }, [initSql]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<FiltersState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const onClearCol = useCallback((col: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  }, []);

  const onChangeFilter = useCallback((col: string, next: FilterValue | undefined) => {
    setColumnFilters((prev) => {
      const nextState = { ...prev };
      if (!next) delete nextState[col];
      else nextState[col] = next;
      return nextState;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters({});
    setGlobalFilter('');
    setOpenFilterCol(null);
    setFilterSearch('');
  }, []);

  const schemaQuery = useTableSchema({ sql, params, globalFilter, columnFilters });
  const schema = schemaQuery.data ?? [];
  const fieldNames = useMemo(() => schema.map((f) => f.name), [schema]);

  const countQuery = useTableCount({ sql, params, globalFilter, columnFilters });
  const rowCount = countQuery.data ?? 0;
  const isInitialLoad = schemaQuery.isLoading || (countQuery.isLoading && schema.length === 0);

  const summariesQuery = useColumnSummaries({ sql, params, globalFilter, columnFilters });
  const columnSummaries = summariesQuery.data ?? [];
  const summaryMap = useMemo(() => new Map(columnSummaries.map((s) => [s.name, s])), [columnSummaries]);

  const sizesQuery = useColumnSizes({ sql, params, globalFilter, columnFilters });
  const columnSizes = sizesQuery.data ?? [];
  const sizeMap = useMemo(() => new Map(columnSizes.map((s) => [s.name, s])), [columnSizes]);

  const queryParts = useQueryParts({ sql, params, globalFilter, columnFilters, fieldNames });

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const effDefault = enableFilters ? colDefaultWidth : Math.min(colDefaultWidth, 72);
    const effMin = enableFilters ? colMinWidth : Math.min(colMinWidth, 44);
    const effMax = enableFilters ? colMaxWidth : Math.min(colMaxWidth, 110);

    const dataColumns = schema.flatMap((col) => {
      // if (col.fields && col.fields.length > 0) {
      //   return col.fields.map((f: { name: string; type: string }) => {
      //     const subName = `${col.name}.${f.name}`;
      //     return { id: subName, accessorKey: subName, header: subName.replace(/^\d+_/, ''), size: effDefault, minSize: effMin, maxSize: effMax };
      //   });
      // }
      return [{ id: col.name, accessorKey: col.name, header: col.name.replace(/^\d+_/, ''), size: effDefault, minSize: effMin, maxSize: effMax }];
    });

    if (showRowNumbers) {
      return [
        { id: '_row_index', accessorKey: '_row_index', header: '#', size: 60, minSize: 50, maxSize: 80, enableSorting: false, enableColumnFilter: false, enableHiding: false, meta: { isRowIndex: true } },
        ...dataColumns,
      ];
    }
    return dataColumns;
  }, [schema, enableFilters, colDefaultWidth, colMinWidth, colMaxWidth, showRowNumbers]);

  const table = useReactTable({
    data: [],
    columns,
    state: { sorting, columnSizing, columnPinning, columnVisibility },
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

  const lastSqlRef = useRef<string>('');
  const initializedSchemaRef = useRef<string>('');
  const initializedVisibilityRef = useRef<string>('');

  useEffect(() => {
    const schemaKey = fieldNames.join(',');

    if (lastSqlRef.current !== sql) {
      lastSqlRef.current = sql;
      setSorting([]);
      setColumnFilters({});
      setGlobalFilter('');
      setColumnSizing({});
      setColumnVisibility({});
      setOpenFilterCol(null);
      setFilterSearch('');
      initializedSchemaRef.current = '';
      initializedVisibilityRef.current = '';
      return;
    }

    if (schemaKey && columnSizes.length > 0 && initializedSchemaRef.current !== schemaKey) {
      const effMin = enableFilters ? colMinWidth : Math.min(colMinWidth, 44);
      const effMax = enableFilters ? colMaxWidth : Math.min(colMaxWidth, 110);
      const newSizing: ColumnSizingState = {};
      if (showRowNumbers) newSizing['_row_index'] = 60;
      for (const name of fieldNames) {
        const size = sizeMap.get(name);
        const p80 = size?.p80Len ?? 0;
        const maxLen = Math.max(name.length, p80);
        const estimatedWidth = Math.ceil(maxLen * ESTIMATE_CHAR_PX + ESTIMATE_PADDING_PX);
        newSizing[name] = Math.max(effMin, Math.min(effMax, estimatedWidth));
      }
      setColumnSizing(newSizing);
      initializedSchemaRef.current = schemaKey;
    }

    if (schemaKey && columnSummaries.length > 0 && initializedVisibilityRef.current !== schemaKey) {
      if (Object.keys(columnVisibility).length === 0) {
        const nextVisibility: VisibilityState = {};
        if (showRowNumbers) nextVisibility['_row_index'] = true;
        for (const name of fieldNames) nextVisibility[name] = true;
        setColumnVisibility(nextVisibility);
        initializedVisibilityRef.current = schemaKey;
      }
    }
  }, [sql, fieldNames, columnSizes, columnSummaries, showRowNumbers, sizeMap, enableFilters, colMinWidth, colMaxWidth, columnVisibility]);

  const onSaveSql = useCallback((nextSql: string) => setSql(nextSql), []);

  const fieldNamesForGlobal = useMemo(
    () => (globalFilter.trim() ? fieldNames : []),
    [globalFilter, fieldNames],
  );

  const activeColumnFilters = useMemo(() => {
    return Object.entries(columnFilters)
      .filter(([, val]) => val !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [columnFilters]);

  const globalFilterActive = !!globalFilter.trim();
  const totalFilterCount = (globalFilterActive ? 1 : 0) + activeColumnFilters.length;

  return {
    pool,
    sql,
    params,
    entry,
    schema,
    rowCount,
    columnSummaries,
    summaryMap,
    queryParts,
    fieldNames,
    isInitialLoad,
    schemaError: schemaQuery.error,
    countError: countQuery.error,
    title,

    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilters,
    onClearCol,
    onChangeFilter,
    clearAllFilters,

    columnSizing,
    setColumnSizing,
    columnVisibility,
    setColumnVisibility,
    openFilterCol,
    onOpenFilterCol: setOpenFilterCol,
    filterSearch,
    setFilterSearch,
    isSearchExpanded,
    setIsSearchExpanded,
    isFullscreen,
    setIsFullscreen,
    searchInputRef,

    activeColumnFilters,
    fieldNamesForGlobal,
    totalFilterCount,
    globalFilterActive,

    onSaveSql,
    table,

    enableFilters,
    showRowNumbers,
    getRowClassName,
    renderCell,
    onClose,
  };
}

type QTContextValue = ReturnType<typeof useQueryTableState>;

const QTContext = createContext<QTContextValue | null>(null);

export function useQT() {
  const ctx = useContext(QTContext);
  if (!ctx) throw new Error('useQT must be used within a QueryTableProvider');
  return ctx;
}

export function QueryTableProvider({
  children,
  ...stateProps
}: {
  children: ReactNode;
  initSql: string;
  entry?: QueryRef;
  params?: unknown[];
  pool: ReturnType<typeof useDuckDB>['pool'];
} & Omit<QueryTableProps, 'table' | 'pool' | 'height' | 'rowHeight' | 'overscan'>) {
  const value = useQueryTableState(stateProps);
  return <QTContext.Provider value={value}>{children}</QTContext.Provider>;
}
