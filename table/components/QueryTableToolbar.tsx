import {
  X,
  Settings2,
  Loader2,
  Search,
  Maximize2,
  Minimize2,
  BarChart3,
  Code2,
} from 'lucide-react';
import React from 'react';

import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ScrollArea } from '../ui/ScrollArea';

import { DependencyTree } from './DependencyTree';
import { ExportButton } from './ExportButton';
import { SqlQueryEditorPopover } from './SqlQueryEditorPopover';
import { useQT } from './QueryTableContext';

export function QueryTableToolbar() {
  const {
    isFullscreen,
    setIsFullscreen,
    pool,
    title,
    queryParts,
    isInitialLoad,
    rowCount,
    originalSql,
    onSaveSql,
    entry,
    enableFilters,
    activeColumnFilters,
    globalFilterActive,
    totalFilterCount,
    globalFilter,
    setGlobalFilter,
    onClearCol,
    clearAllFilters,
    table,
    isSearchExpanded,
    setIsSearchExpanded,
    searchInputRef,
    onClose,
  } = useQT();

  const searchInputRefInternal = React.useRef<HTMLInputElement>(null);
  const searchInputRefToUse = searchInputRef || searchInputRefInternal;

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

      <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap flex items-center gap-2">
        {isInitialLoad ? (
          <><Loader2 className="h-3 w-3 animate-spin text-primary" /><span>Loading...</span></>
        ) : (
          <span>{rowCount.toLocaleString()} rows</span>
        )}
      </div>

      <div className="min-w-0 flex-1 overflow-hidden flex items-center gap-1">
        {title && <span className="text-[11px] font-mono text-muted-foreground truncate">{title}</span>}
        <SqlQueryEditorPopover title={title} sql={originalSql} onSave={onSaveSql}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" title="Edit SQL">
            <Code2 className="h-3.5 w-3.5" />
          </Button>
        </SqlQueryEditorPopover>
        {entry && <DependencyTree entry={entry} pool={pool} onReplay={onSaveSql} />}
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
                  <span className="text-muted-foreground">{val.type === 'set' ? `(${val.values.length})` : val.type === 'range' ? `[${Math.round(val.min * 100) / 100}, ${Math.round(val.max * 100) / 100}]` : ''}</span>
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
                        <span className="text-muted-foreground">{val.type === 'set' ? `(${val.values.length})` : val.type === 'range' ? `[${Math.round(val.min * 100) / 100}, ${Math.round(val.max * 100) / 100}]` : ''}</span>
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
        <Popover>
          <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Settings2 className="h-3.5 w-3.5" /></Button></PopoverTrigger>
          <PopoverContent align="end" className="w-50 p-2">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">Columns</div>
            <ScrollArea className="h-50">
              <div className="flex flex-col gap-1.5">
                {table.getAllLeafColumns().map((column) => (
                  <div key={column.id} className="flex items-center gap-2">
                    <Checkbox id={`cv-${column.id}`} checked={column.getIsVisible()} onCheckedChange={(val) => column.toggleVisibility(!!val)} disabled={column.id === '_row_index'} />
                    <Label htmlFor={`cv-${column.id}`} className="text-xs font-mono truncate">{column.id}</Label>
                  </div>
                ))}
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
