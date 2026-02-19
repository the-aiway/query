import {
  Code2,
  X,
  Settings2,
  Loader2,
  Search,
  Maximize2,
  Minimize2,
  BarChart3,
  RotateCcw,
} from 'lucide-react';
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
import { isSetFilter, isRangeFilter } from './sqlUtils';

export function QueryTableToolbar() {
  const {
    isFullscreen,
    setIsFullscreen,
    title,
    queryParts,
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

  const hiddenColumnCount = React.useMemo(
    () => Object.values(columnVisibility).filter((isVisible) => isVisible === false).length,
    [columnVisibility]
  );
  const allLeafColumns = table.getAllLeafColumns();
  const hideableColumns = React.useMemo(
    () => allLeafColumns.filter((column) => column.getCanHide()),
    [allLeafColumns]
  );
  const visibleColumnCount = React.useMemo(
    () => allLeafColumns.filter((column) => column.getIsVisible()).length,
    [allLeafColumns]
  );
  const normalizedColumnSearch = columnSearch.trim().toLowerCase();
  const filteredColumns = React.useMemo(
    () => allLeafColumns.filter((column) => column.id.toLowerCase().includes(normalizedColumnSearch)),
    [allLeafColumns, normalizedColumnSearch]
  );

  return (
    <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-3 min-w-0">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={() => setIsFullscreen(!isFullscreen)}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </Button>

      <ExportButton disabled={isInitialLoad || rowCount === 0} />

      <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
        <div className="w-3 h-3 shrink-0 flex items-center justify-center">
          {(isInitialLoad || refreshing) && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
        <span>{isInitialLoad ? 'Loading...' : `${rowCount.toLocaleString()} rows`}</span>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden flex items-center gap-1">
        {title && <span className="text-[11px] font-mono text-muted-foreground truncate">{title}</span>}
        <SqlQueryEditorPopover title={title} sql={originalSql ?? sql} onSave={onSqlEdit}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" title="Edit SQL">
            <Code2 className="h-3.5 w-3.5" />
          </Button>
        </SqlQueryEditorPopover>
        {(hasChanges || preview) && (
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground shrink-0" onClick={() => { resetAll(); clearPreview(); }} title="Reset filters, sorting & preview">
            <RotateCcw className="h-3 w-3" />reset
          </Button>
        )}
        {(dependencyRootRef ?? entry) && <DependencyTree entry={(dependencyRootRef ?? entry)!} />}
      </div>

      {enableFilters && (activeColumnFilters.length > 0 || globalFilterActive) && (
        <div className="hidden lg:flex items-center gap-2 max-w-[60%] overflow-hidden shrink-0">
          <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">filters:</div>
          {totalFilterCount === 1 ? (
            <div className="flex flex-wrap items-center gap-2 overflow-hidden max-h-7">
              {globalFilterActive && (
                <button type="button" className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono" onClick={() => setGlobalFilter('')}>
                  <span className="truncate max-w-35">global</span><X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              {activeColumnFilters.map(([col, val]) => (
                <button key={col} type="button" className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono" onClick={() => onClearCol(col)}>
                  <span className="truncate max-w-45">{col}</span>
                  <span className="text-muted-foreground">{isSetFilter(val) ? `(${val.length})` : isRangeFilter(val) ? `[${Math.round(val.$between[0] * 100) / 100}, ${Math.round(val.$between[1] * 100) / 100}]` : ''}</span>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-[11px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center">
                  [{totalFilterCount} filters]
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-130 p-3" align="end">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-mono text-muted-foreground">active filters ({totalFilterCount})</div>
                  <button type="button" className="text-xs font-mono text-muted-foreground hover:text-foreground underline" onClick={clearAllFilters}>clear all</button>
                </div>
                <ScrollArea className="max-h-80 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {globalFilterActive && (
                      <button type="button" className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono" onClick={() => setGlobalFilter('')}>
                        <span className="truncate max-w-60">global</span><X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    {activeColumnFilters.map(([col, val]) => (
                      <button key={col} type="button" className="inline-flex items-center gap-1 px-2 h-7 rounded border bg-background text-[11px] font-mono" onClick={() => onClearCol(col)}>
                        <span className="truncate max-w-65">{col}</span>
                        <span className="text-muted-foreground">{isSetFilter(val) ? `(${val.length})` : isRangeFilter(val) ? `[${Math.round(val.$between[0] * 100) / 100}, ${Math.round(val.$between[1] * 100) / 100}]` : ''}</span>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Popover open={columnsOpen} onOpenChange={(nextOpen) => { setColumnsOpen(nextOpen); if (!nextOpen) setColumnSearch(''); }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 relative">
              <Settings2 className="h-3.5 w-3.5" />
              {hiddenColumnCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-orange-500 ring-1 ring-background" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[380px] p-2.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-[11px] font-mono font-semibold">Columns</div>
                <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                  {visibleColumnCount.toLocaleString()} visible · {hiddenColumnCount.toLocaleString()} hidden
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="h-6 px-2 rounded border bg-background/60 hover:bg-background text-[10px] font-mono text-muted-foreground hover:text-foreground"
                  onClick={() => hideableColumns.forEach((column) => column.toggleVisibility(true))}
                >
                  show all
                </button>
                <button
                  type="button"
                  className="h-6 px-2 rounded border bg-background/60 hover:bg-background text-[10px] font-mono text-muted-foreground hover:text-foreground"
                  onClick={() => hideableColumns.forEach((column) => column.toggleVisibility(false))}
                >
                  hide all
                </button>
              </div>
            </div>

            <div className="mb-2">
              <Input
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="search columns…"
                className="h-7 text-[11px] font-mono"
              />
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
                      className={`flex items-start gap-2 px-2 py-1.5 rounded border cursor-pointer w-full text-left ${column.getIsVisible() ? 'bg-primary/5 border-primary/20' : 'bg-background/40 border-border/60'} hover:bg-muted/30`}
                    >
                      <div className="pt-0.5">
                        <Checkbox
                          id={`cv-${column.id}`}
                          checked={column.getIsVisible()}
                          onCheckedChange={(val) => column.toggleVisibility(!!val)}
                          disabled={column.id === '_row_index'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="text-[11px] font-mono truncate leading-4.5">{column.id}</div>
                          <div className="ml-auto text-[9px] font-mono text-muted-foreground whitespace-nowrap leading-4.5">
                            {summary?.type ?? 'UNKNOWN'}
                          </div>
                        </div>
                        <div className="mt-0.5 text-[9px] font-mono text-muted-foreground leading-4 flex flex-wrap items-center gap-x-2">
                          <span>complete: {completionPct.toFixed(1)}%</span>
                          <span>distinct: {Number(summary?.uniq ?? 0).toLocaleString()}</span>
                          <span>null: {nullPct.toFixed(1)}%</span>
                          <span>empty: {emptyPct.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-muted/60 rounded overflow-hidden">
                          <div
                            className="h-full bg-primary/70"
                            style={{ width: `${Math.max(0, Math.min(100, completionPct))}%` }}
                          />
                        </div>
                      </div>
                    </label>
                  );
                })}
                {filteredColumns.length === 0 && (
                  <div className="text-xs font-mono text-muted-foreground px-1 py-2">no matching columns</div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {enableFilters && (isSearchExpanded ? (
          <div className="flex items-center gap-1">
            <Input ref={searchInputRefToUse} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} onBlur={() => !globalFilter.trim() && setIsSearchExpanded(false)} placeholder="global search" className="w-40 h-7 text-xs font-mono" autoFocus />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setGlobalFilter(''); setIsSearchExpanded(false); }}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setIsSearchExpanded(true); setTimeout(() => searchInputRefToUse.current?.focus(), 0); }}><Search className="h-3.5 w-3.5" /></Button>
        ))}

        {onClose && <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><BarChart3 className="h-3.5 w-3.5" /></Button>}
      </div>
    </div>
  );
}
