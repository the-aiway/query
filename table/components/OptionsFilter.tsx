import { useQuery, keepPreviousData } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import type { ColumnOption } from './Datasource';
import { useQT } from './QueryTableContext';
import { buildWhereClause, quoteIdent, isSetFilter, type FiltersState } from './sqlUtils';
import { sqlConditions } from '../../sqlConditions';

import { Input } from '../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ScrollArea } from '../ui/ScrollArea';

function useColumnOptions(opts: {
  open: boolean;
  col: string | null;
  baseSql: string;
  params?: unknown[];
  globalFilter: string;
  fieldNamesForGlobal: string[];
  columnFilters: FiltersState;
  search: string;
  limit?: number;
  pool: ReturnType<typeof import('../../react/DuckDBProvider').useDuckDB>['pool'];
}) {
  return useQuery({
    queryKey: ['duckdb', 'options', opts.col, opts.baseSql, opts.globalFilter, opts.columnFilters, opts.search],
    queryFn: async () => {
      if (!opts.baseSql || !opts.col || !opts.open) return { options: [], total: 0 };

      const { whereClause } = buildWhereClause({
        globalFilter: opts.globalFilter,
        fieldNamesForGlobal: opts.fieldNamesForGlobal,
        columnFilters: opts.columnFilters,
        excludeCol: opts.col,
      });

      const searchFilter = opts.search.trim()
        ? `WHERE ${sqlConditions({ key: { $ilike: `%${opts.search}%` } })}`
        : '';

      const q = `
        WITH base AS (${opts.baseSql}),
        filtered AS (SELECT * FROM base${whereClause}),
        counts AS (
          SELECT COALESCE(CAST(${quoteIdent(opts.col)} AS VARCHAR), '__NULL__') AS key, COUNT(*)::BIGINT AS cnt
          FROM filtered GROUP BY 1
        )
        SELECT key, cnt, (cnt::DOUBLE / SUM(cnt) OVER ()) AS frac
        FROM counts ${searchFilter}
        ORDER BY cnt DESC LIMIT ${opts.limit ?? 200}
      `;

      const rows = await opts.pool.query(q, opts.params ?? []);
      const options = rows.map((r) => ({ key: r.key, label: r.key === '__NULL__' ? '(null)' : r.key, count: Number(r.cnt), frac: r.frac }) as ColumnOption);
      return { options, total: options.reduce((acc, o) => acc + o.count, 0) || 1 };
    },
    enabled: opts.open && !!opts.col && !!opts.baseSql,
    placeholderData: keepPreviousData,
  });
}

export function OptionsFilter({ col, icon, limit, triggerClassName }: { col: string; icon: React.ReactNode; limit?: number; triggerClassName?: string }) {
  const { pool, columnFilters, onChangeFilter, onClearCol, openFilterCol, onOpenFilterCol, filterSearch, setFilterSearch, queryParts, globalFilter, fieldNamesForGlobal, params } = useQT();

  const open = openFilterCol === col;
  const filterValue = columnFilters[col];

  const { data, isLoading, error } = useColumnOptions({
    open, col, baseSql: queryParts.baseSql, params, globalFilter, fieldNamesForGlobal, columnFilters, search: open ? filterSearch : '', limit, pool,
  });

  const options = data?.options ?? [];
  const optionsTotal = data?.total ?? 1;
  const selectedKeys = useMemo(() => (filterValue && isSetFilter(filterValue) ? new Set(filterValue) : new Set<string>()), [filterValue]);

  return (
    <Popover open={open} onOpenChange={(o) => onOpenFilterCol(o ? col : null)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative h-6 w-6 inline-flex items-center justify-center rounded border border-border bg-background/40 backdrop-blur hover:bg-background/60 ${triggerClassName ?? ''}`}
          title={filterValue && isSetFilter(filterValue) ? `Filter (${filterValue.length})` : 'Filter values'}
          onClick={(e) => e.stopPropagation()}
        >
          {icon}
          {filterValue && isSetFilter(filterValue) && filterValue.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono leading-4 text-center">
              {filterValue.length}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" side="bottom" className="w-[420px] p-3 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-xs font-mono font-semibold truncate">{col}</div>
            <div className="mt-1 text-[10px] font-mono text-muted-foreground">
              {filterValue && isSetFilter(filterValue) ? `${filterValue.length} selected` : 'no filter'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="h-7 px-2 rounded border bg-background/60 hover:bg-background text-[11px] font-mono" onClick={() => onChangeFilter(col, options.map((o) => o.key))} disabled={options.length === 0}>all</button>
            <button type="button" className="h-7 px-2 rounded border bg-background/60 hover:bg-background text-[11px] font-mono" onClick={() => onChangeFilter(col, [])}>none</button>
            <button type="button" className="h-7 px-2 rounded border bg-background/60 hover:bg-background text-[11px] font-mono text-muted-foreground hover:text-foreground" onClick={() => onClearCol(col)}>clear</button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-xs text-muted-foreground font-mono">loading…</div>
        ) : error ? (
          <div className="text-xs text-destructive font-mono whitespace-pre-wrap">{String(error)}</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="search…" className="h-8 text-xs font-mono" />
              <button type="button" className="h-8 px-2 rounded border bg-background/60 hover:bg-background text-[11px] font-mono" onClick={() => onChangeFilter(col, ['__NULL__'])}>(null)</button>
            </div>
            <ScrollArea className="h-[340px] pr-2">
              <div className="space-y-1.5">
                {options.map((opt) => {
                  const checked = selectedKeys.has(opt.key);
                  const pct = Math.round((opt.count / optionsTotal) * 100);
                  return (
                    <button
                      key={opt.key} type="button"
                      className={`flex items-start gap-2 px-2 py-2 rounded border cursor-pointer ${checked ? 'bg-primary/5 border-primary/20' : 'bg-background/40 border-border/60'} hover:bg-muted/30 w-full text-left`}
                      onClick={() => { const next = new Set(selectedKeys); if (checked) next.delete(opt.key); else next.add(opt.key); onChangeFilter(col, Array.from(next)); }}
                    >
                      <div className="pt-0.5"><div className={`h-4 w-1.5 min-w-1.5 rounded-full ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="text-xs font-mono truncate leading-5">{opt.label}</div>
                          <div className="ml-auto text-[10px] font-mono text-muted-foreground whitespace-nowrap leading-5">{opt.count.toLocaleString()} · {pct}%</div>
                        </div>
                        <div className="mt-1.5 h-1.5 bg-muted/50 rounded overflow-hidden">
                          <div className="h-full bg-primary/60" style={{ width: `${Math.min(100, Math.max(1, pct))}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
