import React, { useMemo } from 'react';

import type { ColumnOption } from './Datasource';
import { useQT } from './QueryTableContext';
import { buildWhereClause, isSetFilter, quoteIdent, type FiltersState } from '../../sqlUtils';
import { useSql, type QueryRef } from '../../react/reducks';
import { Materialize } from '../../react/Materialize';

import { Input } from '../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ScrollArea } from '../ui/ScrollArea';

function useColumnOptions(opts: { col: string | null; tableRef: QueryRef; globalFilter: string; fieldNamesForGlobal: string[]; columnFilters: FiltersState; search: string; limit?: number }) {
  const { whereClause } = buildWhereClause({
    globalFilter: opts.globalFilter,
    fieldNamesForGlobal: opts.fieldNamesForGlobal,
    columnFilters: opts.columnFilters,
    excludeCol: opts.col ?? undefined,
  });

  const colIdent = opts.col ? quoteIdent(opts.col) : '';
  const searchFilter = opts.search.trim() ? ` AND key ILIKE '%${opts.search.trim().replace(/'/g, "''")}%'` : '';
  const maxRows = opts.limit ?? 200;

  const filtered = useSql((t) => `SELECT * FROM ${t.base}${whereClause}`, { base: opts.tableRef });

  const counts = useSql(
    (t) => `SELECT COALESCE(CAST(${t.raw.colIdent} AS VARCHAR), '__NULL__') AS key, COUNT(*)::BIGINT AS cnt
      FROM ${t.filtered} GROUP BY 1`,
    { filtered, colIdent }
  );

  return useSql(
    (t) => `SELECT key, cnt, (cnt::DOUBLE / SUM(cnt) OVER ()) AS frac
      FROM ${t.counts}
      WHERE TRUE${searchFilter}
      ORDER BY cnt DESC LIMIT ${t.maxRows}`,
    { counts, maxRows }
  );
}

export function OptionsFilter({ col, icon, limit, triggerClassName }: { col: string; icon: React.ReactNode; limit?: number; triggerClassName?: string }) {
  const { columnFilters, onChangeFilter, onClearCol, openFilterCol, onOpenFilterCol, filterSearch, setFilterSearch, queryParts, globalFilter, fieldNamesForGlobal } = useQT();

  const open = openFilterCol === col;
  const filterValue = columnFilters[col];
  const selectedKeys = useMemo(() => (filterValue && isSetFilter(filterValue) ? new Set(filterValue) : new Set<string>()), [filterValue]);

  const optionsRef = useColumnOptions({
    col,
    tableRef: queryParts.tableRef,
    globalFilter,
    fieldNamesForGlobal,
    columnFilters,
    search: open ? filterSearch : '',
    limit,
  });

  return (
    <Popover open={open} onOpenChange={(o) => onOpenFilterCol(o ? col : null)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`border-border bg-background/40 hover:bg-background/60 relative inline-flex h-6 w-6 items-center justify-center rounded border backdrop-blur ${triggerClassName ?? ''}`}
          title={filterValue && isSetFilter(filterValue) ? `Filter (${filterValue.length})` : 'Filter values'}
          onClick={(e) => e.stopPropagation()}
        >
          {icon}
          {filterValue && isSetFilter(filterValue) && filterValue.length > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-center text-[10px] leading-4">{filterValue.length}</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" side="bottom" className="bg-background/95 supports-backdrop-filter:bg-background/80 w-[420px] p-3 backdrop-blur" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">{col}</div>
            <div className="text-muted-foreground mt-1 text-[10px]">{filterValue && isSetFilter(filterValue) ? `${filterValue.length} selected` : 'no filter'}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" className="bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground h-7 rounded border px-2 text-[11px]" onClick={() => onClearCol(col)}>
              clear
            </button>
          </div>
        </div>

        <div className="mb-2">
          <Input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="search…" className="h-8 font-mono text-xs" />
        </div>
        <Materialize source={{ rows: optionsRef }} disabled={!open} fallback={<div className="text-muted-foreground font-mono text-xs">loading…</div>}>
          {({ rows }) => {
            const options = (rows as Record<string, unknown>[]).map(
              (r): ColumnOption => ({
                key: String(r.key),
                label: r.key === '__NULL__' ? '(null)' : String(r.key),
                count: Number(r.cnt),
                frac: Number(r.frac),
              })
            );
            const optionsTotal = options.reduce((acc, o) => acc + o.count, 0) || 1;
            return (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="bg-background/60 hover:bg-background h-8 rounded border px-2 font-mono text-[11px]"
                    onClick={() =>
                      onChangeFilter(
                        col,
                        options.map((o) => o.key)
                      )
                    }
                  >
                    all
                  </button>
                  <button type="button" className="bg-background/60 hover:bg-background h-8 rounded border px-2 font-mono text-[11px]" onClick={() => onChangeFilter(col, [])}>
                    none
                  </button>
                  <button type="button" className="bg-background/60 hover:bg-background h-8 rounded border px-2 font-mono text-[11px]" onClick={() => onChangeFilter(col, ['__NULL__'])}>
                    (null)
                  </button>
                </div>
                <ScrollArea className="h-[340px] pr-2">
                  <div className="space-y-1.5">
                    {options.map((opt) => {
                      const checked = selectedKeys.has(opt.key);
                      const pct = Math.round((opt.count / optionsTotal) * 100);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className={`flex cursor-pointer items-start gap-2 rounded border px-2 py-2 ${checked ? 'bg-primary/5 border-primary/20' : 'bg-background/40 border-border/60'} hover:bg-muted/30 w-full text-left`}
                          onClick={() => {
                            const next = new Set(selectedKeys);
                            if (checked) next.delete(opt.key);
                            else next.add(opt.key);
                            onChangeFilter(col, Array.from(next));
                          }}
                        >
                          <div className="pt-0.5">
                            <div className={`h-4 w-1.5 min-w-1.5 rounded-full ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <div className="truncate text-xs leading-5">{opt.label}</div>
                              <div className="text-muted-foreground ml-auto text-[10px] leading-5 whitespace-nowrap">
                                {opt.count.toLocaleString()} · {pct}%
                              </div>
                            </div>
                            <div className="bg-muted/50 mt-1.5 h-1.5 overflow-hidden rounded">
                              <div className="bg-primary/60 h-full" style={{ width: `${Math.min(100, Math.max(1, pct))}%` }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            );
          }}
        </Materialize>
      </PopoverContent>
    </Popover>
  );
}
