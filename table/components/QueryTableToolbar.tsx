import { Code2, X, Settings2, Loader2, Search, Maximize2, Minimize2, BarChart3, RotateCcw } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ScrollArea } from '../ui/ScrollArea';

import { DependencyTree } from './DependencyTree';
import { ExportButton } from './ExportButton';
import { SqlQueryEditorPopover } from './SqlQueryEditorPopover';
import { useQT } from './QueryTableContext';
import { useTab } from './TabContext';
import { isSetFilter, isRangeFilter } from '../../sqlUtils';
import { cn } from '../ui/utils';

export function QueryTableToolbar({ isFullscreen, setIsFullscreen }: { isFullscreen: boolean; setIsFullscreen: (isFullscreen: boolean) => void }) {
  const {
    title,
    isInitialLoad,
    rowCount,
    sql,
    originalSql,
    resetAll,
    hasChanges,
    entry,
    dependencyRootRef,
    enableFilters,
    activeColumnFilters,
    globalFilterActive,
    totalFilterCount,
    globalFilter,
    setGlobalFilter,
    onClearCol,
    clearAllFilters,
    table,
    columnVisibility,
    summaryMap,
    describeMap,
    isSearchExpanded,
    setIsSearchExpanded,
    searchInputRef,
    onClose,
    refreshing,
  } = useQT();

  const { onSqlEdit, preview, clearPreview } = useTab();

  const searchInputRefInternal = React.useRef<HTMLInputElement>(null);
  const searchInputRefToUse = searchInputRef || searchInputRefInternal;
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const [columnSearch, setColumnSearch] = React.useState('');

  const hiddenColumnCount = React.useMemo(() => Object.values(columnVisibility).filter((isVisible) => isVisible === false).length, [columnVisibility]);
  const allLeafColumns = table.getAllLeafColumns();
  const hideableColumns = React.useMemo(() => allLeafColumns.filter((column) => column.getCanHide()), [allLeafColumns]);
  const visibleColumnCount = React.useMemo(() => allLeafColumns.filter((column) => column.getIsVisible()).length, [allLeafColumns]);
  const normalizedColumnSearch = columnSearch.trim().toLowerCase();
  const filteredColumns = React.useMemo(() => allLeafColumns.filter((column) => column.id.toLowerCase().includes(normalizedColumnSearch)), [allLeafColumns, normalizedColumnSearch]);

  return (
    <div className="bg-muted/30 flex min-w-0 items-center gap-3 border-b px-3 py-2">
      <Button variant="ghost" size="sm" className="h-7 w-7 shrink-0 p-0" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </Button>

      <ExportButton disabled={isInitialLoad || rowCount === 0} />

      <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap">
        <div className="flex h-3 w-3 shrink-0 items-center justify-center">{(isInitialLoad || refreshing) && <Loader2 className="text-primary h-3 w-3 animate-spin" />}</div>
        <span>{isInitialLoad ? 'Loading...' : `${rowCount.toLocaleString()} rows`}</span>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {title && <span className="text-muted-foreground truncate font-mono text-[11px]">{title}</span>}
        <SqlQueryEditorPopover title={title} sql={originalSql ?? sql} onSave={onSqlEdit}>
          <Button variant="ghost" size="sm" className="h-7 w-7 shrink-0 p-0" title="Edit SQL">
            <Code2 className="h-3.5 w-3.5" />
          </Button>
        </SqlQueryEditorPopover>
        {(hasChanges || preview) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 shrink-0 gap-1 px-2 font-mono text-[11px]"
            onClick={() => {
              resetAll();
              clearPreview();
            }}
            title="Reset filters, sorting & preview"
          >
            <RotateCcw className="h-3 w-3" />
            reset
          </Button>
        )}
        <DependencyTree entry={dependencyRootRef ?? entry} />
      </div>

      {enableFilters && (activeColumnFilters.length > 0 || globalFilterActive) && (
        <div className="hidden max-w-[60%] shrink-0 items-center gap-2 overflow-hidden lg:flex">
          <div className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">filters:</div>
          {totalFilterCount === 1 ? (
            <div className="flex max-h-7 flex-wrap items-center gap-2 overflow-hidden">
              {globalFilterActive && (
                <button type="button" className="bg-background inline-flex h-7 items-center gap-1 rounded border px-2 font-mono text-[11px]" onClick={() => setGlobalFilter('')}>
                  <span className="max-w-35 truncate">global</span>
                  <X className="text-muted-foreground h-3.5 w-3.5" />
                </button>
              )}
              {activeColumnFilters.map(([col, val]) => (
                <button key={col} type="button" className="bg-background inline-flex h-7 items-center gap-1 rounded border px-2 font-mono text-[11px]" onClick={() => onClearCol(col)}>
                  <span className="max-w-45 truncate">{col}</span>
                  <span className="text-muted-foreground">
                    {isSetFilter(val) ? `(${val.length})` : isRangeFilter(val) ? `[${Math.round(val.$between[0] * 100) / 100}, ${Math.round(val.$between[1] * 100) / 100}]` : ''}
                  </span>
                  <X className="text-muted-foreground h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground inline-flex items-center font-mono text-[11px]">
                  [{totalFilterCount} filters]
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-130 p-3" align="end">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-muted-foreground font-mono text-xs">active filters ({totalFilterCount})</div>
                  <button type="button" className="text-muted-foreground hover:text-foreground font-mono text-xs underline" onClick={clearAllFilters}>
                    clear all
                  </button>
                </div>
                <ScrollArea className="max-h-80 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {globalFilterActive && (
                      <button type="button" className="bg-background inline-flex h-7 items-center gap-1 rounded border px-2 font-mono text-[11px]" onClick={() => setGlobalFilter('')}>
                        <span className="max-w-60 truncate">global</span>
                        <X className="text-muted-foreground h-3.5 w-3.5" />
                      </button>
                    )}
                    {activeColumnFilters.map(([col, val]) => (
                      <button key={col} type="button" className="bg-background inline-flex h-7 items-center gap-1 rounded border px-2 font-mono text-[11px]" onClick={() => onClearCol(col)}>
                        <span className="max-w-65 truncate">{col}</span>
                        <span className="text-muted-foreground">
                          {isSetFilter(val) ? `(${val.length})` : isRangeFilter(val) ? `[${Math.round(val.$between[0] * 100) / 100}, ${Math.round(val.$between[1] * 100) / 100}]` : ''}
                        </span>
                        <X className="text-muted-foreground h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className={cn('flex items-center gap-2', onClose && 'max-[980px]:hidden')}>
          <Popover
            open={columnsOpen}
            onOpenChange={(nextOpen) => {
              setColumnsOpen(nextOpen);
              if (!nextOpen) setColumnSearch('');
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-7 w-7 p-0">
                <Settings2 className="h-3.5 w-3.5" />
                {hiddenColumnCount > 0 && <span className="ring-background absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-orange-500 ring-1" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="bg-background/95 supports-backdrop-filter:bg-background/80 w-[380px] p-2.5 backdrop-blur">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-semibold">Columns</div>
                  <div className="text-muted-foreground mt-1 font-mono text-[10px]">
                    {visibleColumnCount.toLocaleString()} visible · {hiddenColumnCount.toLocaleString()} hidden
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground h-6 rounded border px-2 font-mono text-[10px]"
                    onClick={() => hideableColumns.forEach((column) => column.toggleVisibility(true))}
                  >
                    show all
                  </button>
                  <button
                    type="button"
                    className="bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground h-6 rounded border px-2 font-mono text-[10px]"
                    onClick={() => hideableColumns.forEach((column) => column.toggleVisibility(false))}
                  >
                    hide all
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <Input value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} placeholder="search columns…" className="h-7 font-mono text-[11px]" />
              </div>

              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-1.5">
                  {filteredColumns.map((column) => {
                    const summary = summaryMap.get(column.id);
                    const total = Number(summary?.total ?? 0);
                    const nullCount = Number(summary?.nulls ?? 0);
                    const emptyCount = Number(describeMap.get(column.id)?.emptyCount ?? 0);
                    const nullPct = total > 0 ? (nullCount / total) * 100 : 0;
                    const emptyPct = total > 0 ? (emptyCount / total) * 100 : 0;
                    const completedCount = Math.max(0, total - nullCount - emptyCount);
                    const completionPct = total > 0 ? (completedCount / total) * 100 : 0;

                    return (
                      <label
                        key={column.id}
                        htmlFor={`cv-${column.id}`}
                        className={`flex w-full cursor-pointer items-start gap-2 rounded border px-2 py-1.5 text-left ${column.getIsVisible() ? 'bg-primary/5 border-primary/20' : 'bg-background/40 border-border/60'} hover:bg-muted/30`}
                      >
                        <div className="pt-0.5">
                          <Checkbox id={`cv-${column.id}`} checked={column.getIsVisible()} onCheckedChange={(val) => column.toggleVisibility(!!val)} disabled={column.id === '_row_index'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <div className="truncate font-mono text-[11px] leading-4.5">{column.id}</div>
                            <div className="text-muted-foreground ml-auto font-mono text-[9px] leading-4.5 whitespace-nowrap">{summary?.type ?? 'UNKNOWN'}</div>
                          </div>
                          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[9px] leading-4">
                            <span>complete: {completionPct.toFixed(1)}%</span>
                            <span>distinct: {Number(summary?.uniq ?? 0).toLocaleString()}</span>
                            <span>null: {nullPct.toFixed(1)}%</span>
                            <span>empty: {emptyPct.toFixed(1)}%</span>
                          </div>
                          <div className="bg-muted/60 mt-1 h-1.5 overflow-hidden rounded">
                            <div className="bg-primary/70 h-full" style={{ width: `${Math.max(0, Math.min(100, completionPct))}%` }} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {filteredColumns.length === 0 && <div className="text-muted-foreground px-1 py-2 font-mono text-xs">no matching columns</div>}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {enableFilters &&
            (isSearchExpanded ? (
              <div className="flex items-center gap-1">
                <Input
                  ref={searchInputRefToUse}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  onBlur={() => !globalFilter.trim() && setIsSearchExpanded(false)}
                  placeholder="global search"
                  className="h-7 w-40 font-mono text-xs"
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
                  setTimeout(() => searchInputRefToUse.current?.focus(), 0);
                }}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            ))}
        </div>

        {onClose && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose} title="Exit table view">
            <BarChart3 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
