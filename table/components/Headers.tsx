import { flexRender } from '@tanstack/react-table';
import { Filter } from 'lucide-react';
import React from 'react';

import { copyToClipboard } from './Cell';
import { OptionsFilter } from './OptionsFilter';
import { RangeFilter } from './RangeFilter';
import { useQT } from './QueryTableContext';

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../ui/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

export function Headers() {
  const { table, schema, summaryMap, columnFilters, enableFilters, compact: tableCompact } = useQT();

  return (
    <div className="bg-secondary sticky top-0 z-10 w-fit min-w-full border-b shadow-sm">
      {table.getHeaderGroups().map((headerGroup) => (
        <div key={headerGroup.id} className="flex w-max min-w-full">
          {headerGroup.headers.map((header) => {
            const colName = header.column.id;
            const filterValue = columnFilters[colName];
            const hasFilter = filterValue !== undefined;
            const colNarrow = header.getSize() < 120;
            const isRowIndex = colName === '_row_index';

            // Find schema type
            const colSchema = schema?.find((s) => s.name === colName);
            const typeStr = colSchema?.type?.toUpperCase() ?? '';
            const isNumeric = typeStr.match(/INT|DOUBLE|FLOAT|DECIMAL|REAL|NUMERIC/);
            const isDateLike = typeStr.match(/DATE|TIME|TIMESTAMP/);
            const distinctCount = summaryMap.get(colName)?.uniq ?? Infinity;
            const useRangeFilter = Boolean((isNumeric || isDateLike) && distinctCount >= 100);
            const fullTitle = isRowIndex ? 'Row Number' : typeStr ? `${colName} (${typeStr})` : colName;

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
                    className={`group hover:bg-muted relative flex items-center border-r whitespace-nowrap select-none last:border-r-0 ${
                      isRowIndex ? 'bg-secondary/80 z-[12] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] backdrop-blur-sm dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]' : 'bg-secondary'
                    }`}
                    style={{ width: header.getSize(), ...stickyStyles }}
                  >
                    {/* Header Content with Sort Handler */}
                    <div
                      // Don't reserve space for filter icon until hover (prevents early ellipsis)
                      className={`flex min-w-0 flex-1 items-center gap-1 py-2 pr-2 pl-2 ${isRowIndex ? '' : 'cursor-pointer'} focus:outline-none ${enableFilters && !isRowIndex ? (hasFilter ? 'pr-10' : 'group-hover:pr-10') : ''}`}
                      onClick={isRowIndex ? undefined : header.column.getToggleSortingHandler()}
                      title={isRowIndex ? undefined : 'Click to sort, Right click for more options'}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`text-foreground flex min-w-0 flex-1 items-center gap-1 font-mono text-[11px] font-semibold tracking-tight ${isRowIndex ? 'justify-center' : ''}`}>
                            <span className="min-w-0 truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            {!isRowIndex && (
                              <span className={`text-muted-foreground shrink-0 text-center transition-all ${header.column.getIsSorted() ? 'w-4 opacity-100' : 'w-0 opacity-0'}`}>
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
                        className={`absolute top-1/2 right-1 -translate-y-1/2 transition-opacity ${
                          hasFilter ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
                        } ${colNarrow ? 'origin-right scale-90' : ''}`}
                      >
                        {useRangeFilter ? (
                          <RangeFilter
                            col={colName}
                            icon={
                              <Filter
                                className={
                                  hasFilter
                                    ? `${colNarrow ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-foreground`
                                    : `${colNarrow ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-muted-foreground opacity-50 group-hover:opacity-100`
                                }
                              />
                            }
                          />
                        ) : (
                          <OptionsFilter
                            col={colName}
                            icon={
                              <Filter
                                className={
                                  hasFilter
                                    ? `${colNarrow ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-foreground`
                                    : `${colNarrow ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-muted-foreground opacity-50 group-hover:opacity-100`
                                }
                              />
                            }
                          />
                        )}
                      </div>
                    )}

                    {tableCompact && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`hover:bg-primary/50 absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none ${header.column.getIsResizing() ? 'bg-primary' : 'bg-transparent'}`}
                      />
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  {!isRowIndex && (
                    <>
                      <ContextMenuItem onClick={() => copyToClipboard(colName)}>Copy Column Name</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => header.column.pin('start')}>Pin Left</ContextMenuItem>
                      <ContextMenuItem onClick={() => header.column.pin('end')}>Pin Right</ContextMenuItem>
                      <ContextMenuItem onClick={() => header.column.pin(false)}>Unpin</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => header.column.toggleVisibility(false)}>Hide Column</ContextMenuItem>
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
