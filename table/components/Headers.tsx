import { type Table, flexRender } from '@tanstack/react-table';
import { Filter } from 'lucide-react';
import React from 'react';

import { copyToClipboard } from './Cell';
import { OptionsFilter } from './OptionsFilter';
import { RangeFilter } from './RangeFilter';
import type { FiltersState, FilterValue } from './sqlUtils';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '../ui/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

type HeadersProps = {
  table: Table<Record<string, unknown>>;
  schema: { name: string; type: string }[];

  setFilters: FiltersState;
  enableFilters?: boolean;

  openFilterCol: string | null;
  onOpenFilterCol: (col: string | null) => void;

  filterSearch: string;
  onChangeFilterSearch: (next: string) => void;

  onClearCol: (col: string) => void;
  onChangeFilter: (col: string, next: FilterValue | undefined) => void;

  // Query props
  sql: string;
  params?: unknown[];
  globalFilter: string;
  fieldNamesForGlobal: string[];
};

export function Headers({
  table,
  schema,
  setFilters,
  enableFilters = true,
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
}: HeadersProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-secondary shadow-sm w-fit min-w-full">
      {table.getHeaderGroups().map((headerGroup) => (
        <div key={headerGroup.id} className="flex min-w-full w-max">
          {headerGroup.headers.map((header) => {
            const colName = header.column.id;
            const filterValue = setFilters[colName];
            const hasFilter = filterValue !== undefined;
            const compact = header.getSize() < 120;
            const isRowIndex = colName === '_row_index';

            // Find schema type
            const colSchema = schema.find((s) => s.name === colName);
            const typeStr = colSchema?.type?.toUpperCase() ?? '';
            const isNumeric = typeStr.match(/INT|DOUBLE|FLOAT|DECIMAL|REAL|NUMERIC/);
            const fullTitle = isRowIndex
              ? 'Row Number'
              : typeStr
                ? `${colName} (${typeStr})`
                : colName;

            // Use simple sticky positioning for row index column (without TanStack pinning API)
            const stickyStyles: React.CSSProperties = isRowIndex
              ? {
                  position: 'sticky',
                  left: 0,
                  zIndex: 12, // Higher than data headers
                }
              : {};

            return (
              <ContextMenu key={header.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={`relative border-r last:border-r-0 select-none whitespace-nowrap flex items-center group hover:bg-muted ${
                      isRowIndex
                        ? 'bg-secondary/80 backdrop-blur-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] z-[12]'
                        : 'bg-secondary'
                    }`}
                    style={{ width: header.getSize(), ...stickyStyles }}
                  >
                    {/* Header Content with Sort Handler */}
                    <div
                      // Don't reserve space for filter icon until hover (prevents early ellipsis)
                      className={`flex-1 min-w-0 flex items-center gap-1 pl-2 pr-2 py-2 ${isRowIndex ? '' : 'cursor-pointer'} focus:outline-none ${enableFilters && !isRowIndex ? 'group-hover:pr-10' : ''}`}
                      onClick={isRowIndex ? undefined : header.column.getToggleSortingHandler()}
                      title={isRowIndex ? undefined : 'Click to sort, Right click for more options'}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex-1 min-w-0 text-[11px] font-mono font-semibold tracking-tight flex items-center gap-1 text-foreground ${isRowIndex ? 'justify-center' : ''}`}
                          >
                            <span className="min-w-0 truncate">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {!isRowIndex && (
                              <span
                                className={`shrink-0 text-muted-foreground text-center transition-all ${
                                  header.column.getIsSorted() ? 'w-4 opacity-100' : 'w-0 opacity-0'
                                }`}
                              >
                                {{
                                  asc: ' ▲',
                                  desc: ' ▼',
                                }[header.column.getIsSorted() as string] ?? null}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6} className="font-mono">
                          {fullTitle}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Filter Icon */}
                    {enableFilters && !isRowIndex && (
                      <div
                        // Only show filter icon on hover (no layout space taken)
                        className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto ${
                          compact ? 'scale-90 origin-right' : ''
                        }`}
                      >
                        {isNumeric ? (
                          <RangeFilter
                            col={colName}
                            icon={
                              <Filter
                                className={
                                  hasFilter
                                    ? `${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-foreground`
                                    : `${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-muted-foreground opacity-50 group-hover:opacity-100`
                                }
                              />
                            }
                            filterValue={filterValue}
                            onChange={(next) => onChangeFilter(colName, next)}
                            onClear={() => onClearCol(colName)}
                            open={openFilterCol === colName}
                            onOpenChange={(open) => onOpenFilterCol(open ? colName : null)}
                            sql={sql}
                            params={params}
                            globalFilter={globalFilter}
                            fieldNamesForGlobal={fieldNamesForGlobal}
                            setFilters={setFilters}
                          />
                        ) : (
                          <OptionsFilter
                            col={colName}
                            icon={
                              <Filter
                                className={
                                  hasFilter
                                    ? `${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-foreground`
                                    : `${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-muted-foreground opacity-50 group-hover:opacity-100`
                                }
                              />
                            }
                            filterValue={filterValue}
                            onChange={(next) => onChangeFilter(colName, next)}
                            onClear={() => onClearCol(colName)}
                            open={openFilterCol === colName}
                            onOpenChange={(open) => onOpenFilterCol(open ? colName : null)}
                            search={openFilterCol === colName ? filterSearch : ''}
                            onChangeSearch={onChangeFilterSearch}
                            sql={sql}
                            params={params}
                            globalFilter={globalFilter}
                            fieldNamesForGlobal={fieldNamesForGlobal}
                            setFilters={setFilters}
                          />
                        )}
                      </div>
                    )}

                    {/* Resizer */}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50 ${
                        header.column.getIsResizing() ? 'bg-primary' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  {!isRowIndex && (
                    <>
                      <ContextMenuItem onClick={() => copyToClipboard(colName)}>
                        Copy Column Name
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => header.column.pin('left')}>
                        Pin Left
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => header.column.pin('right')}>
                        Pin Right
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => header.column.pin(false)}>
                        Unpin
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => header.column.toggleVisibility(false)}>
                        Hide Column
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      ))}
    </div>
  );
}
