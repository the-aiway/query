import { type ColumnDef, getCoreRowModel, useReactTable, type ColumnSizingState, type ColumnPinningState, type SortingState, type VisibilityState } from '@tanstack/react-table';
import { Table } from 'apache-arrow';
import React, { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

import { type ColumnDescribe, useColumnDescribe, useColumnSummaries, useColumnSizes, useQueryParts, useTableCount, useTableSchema } from './Datasource';
import {
  type FilterValue,
  type FiltersState,
  buildWhereClause,
  isSetFilter,
  isRangeFilter,
  serializeQTLayout,
  parseQTLayout,
} from '../../sqlUtils';
import { useDuckDB } from '../../react/DuckDBProvider';
import { useSql, type QueryRef } from '../../react/reducks';

export type QueryResolutionStrategy = 'direct' | 'materialized' | 'lazy';

type QueryTableCommonProps = {
  height?: number;
  rowHeight?: number;
  compact?: boolean;
  resolutionStrategy?: QueryResolutionStrategy;
  persistStateInUrl?: boolean;
  overscan?: number;
  getRowClassName?: (ctx: { get: (col: string) => unknown; rowIndex: number }) => string;
  renderCell?: (ctx: { colName: string; type: string; rawValue: unknown; display: string; rowIndex: number; pageRowIndex: number }) => React.ReactNode | undefined;
  enableFilters?: boolean;
  colDefaultWidth?: number;
  colMinWidth?: number;
  colMaxWidth?: number;
  pool?: ReturnType<typeof useDuckDB>['pool'];
  showRowNumbers?: boolean;
  onClose?: () => void;
  title?: string;
  footer?: ReactNode;
  dependencyRootRef?: QueryRef;
};

type QueryTableNonEntryInput = string | Record<string, unknown>[] | Table;
export type QueryTableSourceMap = Record<string, QueryRef | QueryTableNonEntryInput | null | undefined>;

export type QueryTableProps =
  | (QueryTableCommonProps & {
      table: QueryRef;
      id?: string;
    })
  | (QueryTableCommonProps & {
      table: null | undefined;
      id?: string;
    })
  | (QueryTableCommonProps & {
      table?: QueryTableNonEntryInput;
      id?: string;
    })
  | (QueryTableCommonProps & {
      table: QueryTableSourceMap;
      id?: string;
    });

const COL_DEFAULT_WIDTH = 140;
const COL_MIN_WIDTH = 80;
const COL_MAX_WIDTH = 180;
const ESTIMATE_CHAR_PX = 4;
const ESTIMATE_PADDING_PX = 32;

const LAYOUT_DEBOUNCE_MS = 500;

function useQueryTableState({
  id,
  tableRef,
  pool,
  compact = true,
  persistStateInUrl = true,
  enableFilters = true,
  showRowNumbers = false,
  colDefaultWidth = COL_DEFAULT_WIDTH,
  colMinWidth = COL_MIN_WIDTH,
  colMaxWidth = COL_MAX_WIDTH,
  getRowClassName,
  renderCell,
  onClose,
  title,
  dependencyRootRef,
}: {
  id: string;
  title?: string;
  tableRef: QueryRef;
  dependencyRootRef?: QueryRef;
  pool: ReturnType<typeof useDuckDB>['pool'];
} & Omit<QueryTableProps, 'table' | 'pool' | 'height' | 'rowHeight' | 'overscan'>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<FiltersState>({});

  // --- localStorage: column sizing + visibility ---
  const layoutKey = `qt_layout_${id}`;

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const layoutTimerRef = useRef<Timer | null>(null);

  const saveLayout = useCallback(
    (sizing: ColumnSizingState, visibility: VisibilityState) => {
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
      layoutTimerRef.current = setTimeout(() => {
        localStorage.setItem(layoutKey, serializeQTLayout(visibility, sizing));
      }, LAYOUT_DEBOUNCE_MS);
    },
    [layoutKey]
  );

  const setColumnSizingWithSave = useCallback(
    (updater: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState)) => {
      setColumnSizing((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        setColumnVisibility((vis) => {
          saveLayout(next, vis);
          return vis;
        });
        return next;
      });
    },
    [saveLayout]
  );

  const setColumnVisibilityWithSave = useCallback(
    (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        setColumnSizing((sz) => {
          saveLayout(sz, next);
          return sz;
        });
        return next;
      });
    },
    [saveLayout]
  );

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

  const schemaQuery = useTableSchema(tableRef);
  const schema = schemaQuery.data ?? [];
  const fieldNames = useMemo(() => schema.map((f) => f.name), [schema]);

  const queryParts = useQueryParts({ tableRef, globalFilter, columnFilters, fieldNames });

  const countQuery = useTableCount(queryParts.filteredRef);
  const rowCount = countQuery.data ?? 0;
  const isInitialLoad = schemaQuery.isLoading || (countQuery.isLoading && schema.length === 0);

  const summariesQuery = useColumnSummaries(tableRef);
  const columnSummaries = summariesQuery.data ?? [];
  const summaryMap = useMemo(() => new Map(columnSummaries.map((s) => [s.name, s])), [columnSummaries]);

  const describeQuery = useColumnDescribe(tableRef);
  const columnDescribe = describeQuery.data ?? [];
  const describeMap = useMemo(() => new Map<string, ColumnDescribe>(columnDescribe.map((d) => [d.name, d])), [columnDescribe]);

  const sizesQuery = useColumnSizes(tableRef, { enabled: compact });
  const columnSizes = sizesQuery.data ?? [];
  const sizeMap = useMemo(() => new Map(columnSizes.map((s) => [s.name, s])), [columnSizes]);

  const refreshing = countQuery.isFetching || summariesQuery.isFetching || describeQuery.isFetching || sizesQuery.isFetching;

  const hasActiveFiltersOrSorting = sorting.length > 0 || Object.keys(columnFilters).length > 0 || globalFilter.trim().length > 0;

  const queryError = schemaQuery.error || countQuery.error;

  useEffect(() => {
    if (queryError && hasActiveFiltersOrSorting) {
      setSorting([]);
      setColumnFilters({});
      setGlobalFilter('');
      setOpenFilterCol(null);
      setFilterSearch('');
    }
  }, [queryError, hasActiveFiltersOrSorting]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const effDefault = enableFilters ? colDefaultWidth : Math.min(colDefaultWidth, 72);
    const effMin = enableFilters ? colMinWidth : Math.min(colMinWidth, 44);
    const effMax = compact ? (enableFilters ? colMaxWidth : Math.min(colMaxWidth, 110)) : 9999;

    const dataColumns = schema.flatMap((col) => {
      return [
        {
          id: col.name,
          accessorKey: col.name,
          header: col.name.replace(/^\d+_/, ''),
          size: effDefault,
          minSize: effMin,
          maxSize: effMax,
        },
      ];
    });

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
  }, [schema, enableFilters, colDefaultWidth, colMinWidth, colMaxWidth, showRowNumbers, compact]);

  const table = useReactTable({
    data: [],
    columns,
    state: { sorting, columnSizing, columnPinning, columnVisibility },
    enableColumnResizing: compact,
    onSortingChange: setSorting,
    onColumnSizingChange: (updater) => {
      setColumnSizingWithSave((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibilityWithSave((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const initializedSchemaRef = useRef<string>('');
  const initializedVisibilityRef = useRef<string>('');

  useEffect(() => {
    const schemaKey = fieldNames.join(',');

    if (schemaKey && (compact ? !sizesQuery.isLoading : true) && initializedSchemaRef.current !== schemaKey) {
      const effMin = enableFilters ? colMinWidth : Math.min(colMinWidth, 44);
      const effMax = enableFilters ? colMaxWidth : Math.min(colMaxWidth, 110);
      const effDefault = enableFilters ? colDefaultWidth : Math.min(colDefaultWidth, 72);

      const savedLayout = parseQTLayout(localStorage.getItem(layoutKey));

      const newSizing: ColumnSizingState = { ...savedLayout?.sizing };
      if (showRowNumbers) newSizing['_row_index'] = 60;

      for (const name of fieldNames) {
        if (newSizing[name] !== undefined) continue;
        if (compact) {
          const size = sizeMap.get(name);
          const p80 = size?.p80Len ?? 0;
          const maxLen = Math.max(name.length, p80);
          const estimatedWidth = Math.ceil(maxLen * ESTIMATE_CHAR_PX + ESTIMATE_PADDING_PX);
          newSizing[name] = Math.max(effMin, Math.min(effMax, estimatedWidth));
        } else {
          newSizing[name] = Math.max(effDefault, 600);
        }
      }
      setColumnSizing(newSizing);

      initializedSchemaRef.current = schemaKey;
    }

    if (schemaKey && columnSummaries.length > 0 && initializedVisibilityRef.current !== schemaKey) {
      const savedLayout = parseQTLayout(localStorage.getItem(layoutKey));
      if (savedLayout?.visibility && Object.keys(savedLayout.visibility).length > 0) {
        setColumnVisibility(savedLayout.visibility);
        initializedVisibilityRef.current = schemaKey;
      } else if (Object.keys(columnVisibility).length === 0) {
        const nextVisibility: VisibilityState = {};
        if (showRowNumbers) nextVisibility['_row_index'] = true;
        for (const name of fieldNames) nextVisibility[name] = true;
        setColumnVisibility(nextVisibility);
        initializedVisibilityRef.current = schemaKey;
      }
    }
  }, [fieldNames, columnSummaries, showRowNumbers, sizeMap, enableFilters, colMinWidth, colMaxWidth, colDefaultWidth, columnVisibility, layoutKey, sizesQuery.isLoading, compact]);

  const hasChanges = hasActiveFiltersOrSorting;
  const isCompactColumnSizingReady = useMemo(() => {
    if (!compact) return true;
    if (schema.length === 0) return true;
    if (showRowNumbers && columnSizing['_row_index'] === undefined) return false;
    return fieldNames.every((name) => columnSizing[name] !== undefined);
  }, [compact, schema.length, showRowNumbers, columnSizing, fieldNames]);

  const resetAll = useCallback(() => {
    setSorting([]);
    setColumnFilters({});
    setGlobalFilter('');
    setOpenFilterCol(null);
    setFilterSearch('');
    setColumnSizing({});
    setColumnVisibility({});
    setColumnPinning({});
    initializedSchemaRef.current = '';
    initializedVisibilityRef.current = '';
  }, []);

  const fieldNamesForGlobal = useMemo(() => (globalFilter.trim() ? fieldNames : []), [globalFilter, fieldNames]);

  const activeColumnFilters = useMemo(() => {
    return Object.entries(columnFilters)
      .filter(([, val]) => {
        if (!val) return false;
        if (isSetFilter(val)) return val.length > 0;
        return isRangeFilter(val);
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [columnFilters]);

  const globalFilterActive = !!globalFilter.trim();
  const totalFilterCount = (globalFilterActive ? 1 : 0) + activeColumnFilters.length;

  return {
    id,
    pool,
    sql: tableRef.query ?? `SELECT * FROM '${tableRef.id}'`,
    originalSql: tableRef.query ?? `SELECT * FROM '${tableRef.id}'`,
    entry: tableRef,
    dependencyRootRef,
    schema,
    rowCount,
    columnSummaries,
    summaryMap,
    columnDescribe,
    describeMap,
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
    setColumnSizing: setColumnSizingWithSave,
    columnVisibility,
    setColumnVisibility: setColumnVisibilityWithSave,
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

    resetAll,
    hasChanges,
    table,
    compact,
    isCompactColumnSizingReady,

    enableFilters,
    showRowNumbers,
    getRowClassName,
    renderCell,
    onClose,
    refreshing,
  };
}

type QTContextValue = ReturnType<typeof useQueryTableState>;

const QTContext = createContext<QTContextValue | null>(null);

export function useQT() {
  const ctx = useContext(QTContext);
  if (!ctx) throw new Error('useQT must be used within a QueryTableProvider');
  return ctx;
}

export function useFilteredRef(excludeCol?: string): QueryRef {
  const { queryParts, globalFilter, fieldNamesForGlobal, columnFilters } = useQT();
  const { whereClause } = buildWhereClause({
    globalFilter,
    fieldNamesForGlobal,
    columnFilters,
    excludeCol,
  });
  return useSql((t) => `SELECT * FROM ${t.base}${whereClause}`, { base: queryParts.tableRef });
}

export function QueryTableProvider({
  children,
  ...stateProps
}: {
  id: string;
  children: ReactNode;
  tableRef: QueryRef;
  pool: ReturnType<typeof useDuckDB>['pool'];
} & Omit<QueryTableProps, 'table' | 'pool' | 'height' | 'rowHeight' | 'overscan'>) {
  const value = useQueryTableState(stateProps);
  return <QTContext.Provider value={value}>{children}</QTContext.Provider>;
}
