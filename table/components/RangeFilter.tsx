import { keepPreviousData, useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useQueryParts } from './Datasource';
import type { FilterValue } from './sqlUtils';
import { buildWhereClause, quoteIdent, type FiltersState } from './sqlUtils';

import { useDuckDB } from '../../react/DuckDBProvider';
import { Input } from '../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Slider } from '../ui/Slider';

export type RangeFilterProps = {
  col: string;
  icon: React.ReactNode;
  filterValue: FilterValue | undefined;
  onChange: (next: FilterValue | undefined) => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerClassName?: string;
  sql: string;
  params?: unknown[];
  globalFilter: string;
  fieldNamesForGlobal: string[];
  setFilters: FiltersState;
};

// Hook to fetch column stats (numeric)
function useColumnStats(opts: {
  open: boolean;
  col: string | null;
  sql: string;
  params?: unknown[];
  globalFilter: string;
  fieldNamesForGlobal: string[];
  setFilters: FiltersState;
}) {
  const { pool } = useDuckDB();
  const parts = useQueryParts({
    sql: opts.sql,
    params: opts.params,
    globalFilter: opts.globalFilter,
    setFilters: opts.setFilters,
    fieldNames: opts.fieldNamesForGlobal,
  });

  return useQuery({
    queryKey: ['duckdb', 'stats', opts.col, parts?.fullParams],
    queryFn: async () => {
      if (!parts || !opts.col || !opts.open) return null;

      const { whereClause, whereParams } = buildWhereClause({
        globalFilter: opts.globalFilter,
        fieldNamesForGlobal: opts.fieldNamesForGlobal,
        setFilters: opts.setFilters,
        excludeCol: opts.col,
      });

      // More buckets = smoother distribution + better brushing UX
      const BUCKETS = 80;
      const colIdent = quoteIdent(opts.col);

      const q = `
        WITH base AS (${parts.baseSql}),
        filtered AS (SELECT * FROM base${whereClause}),
        stats AS (
          SELECT
            MIN(${colIdent}) as min_val,
            MAX(${colIdent}) as max_val,
            AVG(${colIdent}) as avg_val,
            quantile_cont(${colIdent}, 0.5) as median_val,
            quantile_cont(${colIdent}, 0.01) as p01,
            quantile_cont(${colIdent}, 0.90) as p90,
            quantile_cont(${colIdent}, 0.99) as p99,
            COUNT(*)::BIGINT as total
          FROM filtered
          WHERE ${colIdent} IS NOT NULL
        ),
        hist AS (
          SELECT
            CASE
              WHEN ${colIdent} < (SELECT min_val FROM stats) THEN 0
              WHEN ${colIdent} >= (SELECT max_val FROM stats) THEN ${BUCKETS + 1}
              WHEN (SELECT max_val FROM stats) = (SELECT min_val FROM stats) THEN 1
              ELSE floor(((${colIdent} - (SELECT min_val FROM stats)) / ((SELECT max_val FROM stats) - (SELECT min_val FROM stats))) * ${BUCKETS})::INT + 1
            END as bucket,
            COUNT(*)::BIGINT as cnt
          FROM filtered, stats
          WHERE ${colIdent} IS NOT NULL
          GROUP BY 1
        )
        SELECT
          (SELECT min_val FROM stats) as min_val,
          (SELECT max_val FROM stats) as max_val,
          (SELECT avg_val FROM stats) as avg_val,
          (SELECT median_val FROM stats) as median_val,
          (SELECT p01 FROM stats) as p01,
          (SELECT p90 FROM stats) as p90,
          (SELECT p99 FROM stats) as p99,
          (SELECT total FROM stats) as total,
          bucket, cnt
        FROM hist
        ORDER BY bucket
      `;

      const fullParams = [...(opts.params ?? []), ...whereParams];
      const rows = await pool.query(q, fullParams);

      if (rows.length === 0) return null;

      const firstRow = rows[0];
      if (!firstRow) return null;

      const min = firstRow.min_val;
      const max = firstRow.max_val;
      const total = Number(firstRow.total);

      if (min === max || total === 0) {
        return {
          min,
          max,
          min_val: min,
          max_val: max,
          avg: firstRow.avg_val,
          median: firstRow.median_val,
          p01: firstRow.p01,
          p99: firstRow.p99,
          p90: firstRow.p90,
          histogram: Array.from({ length: BUCKETS }, (_, i) => ({ bin: i, count: 0 })),
          total,
          useSplitScale: false,
          splitPoint: firstRow.p90,
        };
      }

      const histogram = Array.from({ length: BUCKETS }, (_, i) => ({ bin: i, count: 0 }));
      for (const r of rows as { bucket: number; cnt: number }[]) {
        if (!r) continue;
        const cnt = Number(r.cnt);
        if (r.bucket >= 1 && r.bucket <= BUCKETS) {
          histogram[r.bucket - 1]!.count = cnt;
        } else if (r.bucket <= 0) {
          histogram[0]!.count += cnt;
        } else if (r.bucket >= BUCKETS + 1) {
          histogram[BUCKETS - 1]!.count += cnt;
        }
      }

      return {
        min,
        max,
        min_val: min,
        max_val: max,
        avg: firstRow.avg_val,
        median: firstRow.median_val,
        p01: firstRow.p01,
        p99: firstRow.p99,
        p90: firstRow.p90,
        histogram,
        total,
        useSplitScale: false,
        splitPoint: firstRow.p90,
      };
    },
    enabled: opts.open && !!opts.col && !!parts,
    placeholderData: keepPreviousData,
  });
}

export function RangeFilter({
  col,
  icon,
  filterValue,
  onChange,
  onClear,
  open,
  onOpenChange,
  triggerClassName,
  sql,
  params,
  globalFilter,
  fieldNamesForGlobal,
  setFilters,
}: RangeFilterProps) {
  const {
    data: stats,
    isLoading,
    error,
  } = useColumnStats({
    open,
    col,
    sql,
    params,
    globalFilter,
    fieldNamesForGlobal,
    setFilters,
  }) as {
    isLoading: boolean;
    error: Error | null;
    data: {
      min: number;
      max: number;
      min_val: number;
      max_val: number;
      avg: number;
      median: number;
      p01: number;
      p99: number;
      p90: number;
      histogram: { bin: number; count: number }[];
      total: number;
      useSplitScale: boolean;
      splitPoint: number;
    };
  };

  // Helper to format numbers for display (max 2 decimals)
  const fmtNum = (n: number | undefined) =>
    n?.toLocaleString(undefined, { maximumFractionDigits: 2 });

  // Transform range value to slider position (0-100)
  const valToPos = (v: number): number => {
    if (!stats) return 0;
    if (stats.max === stats.min) return 0;
    return ((v - stats.min) / (stats.max - stats.min)) * 100;
  };

  // Transform slider position (0-100) to value
  const posToVal = (p: number): number => {
    if (!stats) return 0;
    return stats.min + (p / 100) * (stats.max - stats.min);
  };

  // Committed range from filterValue
  const committedRange = useMemo(() => {
    if (filterValue?.type === 'range') {
      return [filterValue.min, filterValue.max] as [number, number];
    }
    return null;
  }, [filterValue]);

  // Temporary slider position (0-100) for visual feedback only
  const [sliderPos, setSliderPos] = useState<[number, number] | null>(null);

  // Initialize slider position when opening
  useEffect(() => {
    if (open && stats) {
      if (committedRange) {
        const pos0 = valToPos(committedRange[0]);
        const pos1 = valToPos(committedRange[1]);
        setSliderPos([pos0, pos1]);
      } else {
        setSliderPos([0, 100]);
      }
    }
  }, [open, stats, committedRange]);

  const handleRangeChange = (val: number[]) => {
    // Only update visual position, don't commit
    if (val.length >= 2 && val[0] !== undefined && val[1] !== undefined) {
      setSliderPos([val[0], val[1]]);
    }
  };

  const handleRangeCommit = (val: number[]) => {
    if (!stats || val.length < 2 || val[0] === undefined || val[1] === undefined) return;
    const v0 = posToVal(val[0]);
    const v1 = posToVal(val[1]);

    // Check if full range covered (approximately)
    const isFull = Math.abs(v0 - stats.min) < 0.0001 && Math.abs(v1 - stats.max) < 0.0001;

    if (isFull) {
      onChange(undefined);
    } else {
      onChange({ type: 'range', min: v0, max: v1 });
    }
  };

  const histogramData = useMemo(() => {
    if (!stats) return [];

    const width = (stats.max - stats.min) / stats.histogram.length;
    const bucketCount = Math.max(1, stats.histogram.length);

    return stats.histogram.map((bin) => {
      const binStart = stats.min + bin.bin * width;
      const binEnd = stats.min + (bin.bin + 1) * width;
      // If no filter is applied (committedRange is null), show all bars as active
      // Otherwise, check if this bin overlaps with the filter range
      const isActive =
        committedRange === null
          ? true
          : binEnd >= committedRange[0] && binStart <= committedRange[1];

      return {
        name: bin.bin,
        count: bin.count,
        logCount: Math.log(bin.count + 1),
        binStart,
        binEnd,
        x0: (bin.bin / bucketCount) * 100,
        x1: ((bin.bin + 1) / bucketCount) * 100,
        xm: ((bin.bin + 0.5) / bucketCount) * 100,
        active: isActive,
      };
    });
  }, [stats, committedRange]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [focusWindow, setFocusWindow] = useState<{ startPct: number; endPct: number }>({
    startPct: 0,
    endPct: 100,
  });
  const [dragState, setDragState] = useState<
    null | { mode: 'new'; startPct: number } | { mode: 'move'; offsetPct: number; widthPct: number }
  >(null);

  const clampPct = (p: number) => Math.max(0, Math.min(100, p));
  const clientXToViewPct = (clientX: number) => {
    const el = svgRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / Math.max(1, r.width)) * 100;
    return clampPct(pct);
  };

  const toViewX = (domainPct: number) => {
    const w = Math.max(1e-6, focusWindow.endPct - focusWindow.startPct);
    return ((domainPct - focusWindow.startPct) / w) * 100;
  };
  const toDomainX = (viewPct: number) => {
    const w = Math.max(1e-6, focusWindow.endPct - focusWindow.startPct);
    return focusWindow.startPct + (viewPct / 100) * w;
  };

  const setFocusFromSelection = (sel: [number, number]) => {
    const s0 = clampPct(Math.min(sel[0], sel[1]));
    const s1 = clampPct(Math.max(sel[0], sel[1]));
    const width = Math.max(0, s1 - s0);
    if (width <= 0.5 || width >= 99.5) {
      setFocusWindow({ startPct: 0, endPct: 100 });
      return;
    }
    const pad = clampPct(Math.max(3, width * 0.2));
    const start = clampPct(s0 - pad);
    const end = clampPct(s1 + pad);
    const focusWidth = Math.max(8, end - start);
    const center = (start + end) / 2;
    const nextStart = clampPct(center - focusWidth / 2);
    const nextEnd = clampPct(nextStart + focusWidth);
    setFocusWindow({ startPct: nextStart, endPct: nextEnd });
  };

  const [hoveredBin, setHoveredBin] = useState<null | {
    idx: number;
    count: number;
    start: number;
    end: number;
    clientX: number;
    clientY: number;
  }>(null);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative h-6 w-6 inline-flex items-center justify-center rounded border border-border bg-background/40 backdrop-blur hover:bg-background/60 ${triggerClassName ?? ''}`}
          title={
            filterValue?.type === 'range'
              ? `Filter [${filterValue.min}, ${filterValue.max}]`
              : 'Filter values'
          }
          onClick={(e) => e.stopPropagation()}
        >
          {icon}
          {filterValue && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center">
              R
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        className="w-[420px] p-3 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{col}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {committedRange
                ? `${fmtNum(committedRange[0])} → ${fmtNum(committedRange[1])}`
                : 'no range filter'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="h-7 px-2 rounded border bg-background/60 hover:bg-background text-[11px] text-muted-foreground hover:text-foreground"
              onClick={onClear}
              title="Clear filter"
            >
              clear
            </button>
            <button
              type="button"
              className="h-7 px-2 rounded border bg-background/60 hover:bg-background text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
              title="Close"
            >
              close
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-xs text-muted-foreground font-mono">loading…</div>
        ) : error ? (
          <div className="text-xs text-destructive whitespace-pre-wrap">
            {String(error)}
          </div>
        ) : stats ? (
          <div className="space-y-3">
            {/* Stats strip */}
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  ['min', stats.min_val],
                  ['p01', stats.p01],
                  ['med', stats.median],
                  ['p99', stats.p99],
                  ['max', stats.max_val],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rounded-md border bg-background/40 px-2 py-1">
                  <div className="text-[10px] text-muted-foreground uppercase">{k}</div>
                  <div className="text-[11px] font-semibold tabular-nums">
                    {fmtNum(v)}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom histogram (no recharts) */}
            <div className="rounded-lg border bg-background/40 p-2 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-muted-foreground uppercase">
                  distribution (log)
                </div>
                <div className="text-[10px] text-muted-foreground">
                  non-null: {stats.total.toLocaleString()}
                </div>
              </div>

              {(() => {
                const maxLog = Math.max(1, ...histogramData.map((d) => d.logCount));
                const currentRange =
                  sliderPos && sliderPos.length === 2
                    ? ([posToVal(sliderPos[0]), posToVal(sliderPos[1])] as [number, number])
                    : (committedRange ?? ([stats.min, stats.max] as [number, number]));
                const [r0, r1] =
                  currentRange[0] <= currentRange[1]
                    ? currentRange
                    : [currentRange[1], currentRange[0]];
                const selPos =
                  sliderPos && sliderPos.length === 2
                    ? ([
                        Math.min(sliderPos[0], sliderPos[1]),
                        Math.max(sliderPos[0], sliderPos[1]),
                      ] as [number, number])
                    : ([0, 100] as [number, number]);
                const [sx0, sx1] = selPos;

                const focusActive = focusWindow.startPct > 0.01 || focusWindow.endPct < 99.99;

                const vsx0 = focusActive ? clampPct(toViewX(sx0)) : sx0;
                const vsx1 = focusActive ? clampPct(toViewX(sx1)) : sx1;

                const linePoints = histogramData
                  .map((d) => {
                    const y = 39 - (d.logCount / maxLog) * 38;
                    const x = focusActive ? toViewX(d.xm) : d.xm;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <>
                    <svg
                      ref={svgRef}
                      viewBox="0 0 100 40"
                      className="w-full h-[160px] block"
                      preserveAspectRatio="none"
                      onMouseLeave={() => setHoveredBin(null)}
                      onDoubleClick={() => {
                        setSliderPos(null);
                        setFocusWindow({ startPct: 0, endPct: 100 });
                        onChange(undefined);
                      }}
                      onPointerDown={(e) => {
                        const viewPct = clientXToViewPct(e.clientX);
                        const xPct = focusActive ? clampPct(toDomainX(viewPct)) : viewPct;

                        const committedSel =
                          committedRange && stats
                            ? ([
                                clampPct(valToPos(committedRange[0])),
                                clampPct(valToPos(committedRange[1])),
                              ] as [number, number])
                            : null;
                        const currentSel =
                          sliderPos && sliderPos.length === 2
                            ? ([
                                Math.min(sliderPos[0], sliderPos[1]),
                                Math.max(sliderPos[0], sliderPos[1]),
                              ] as [number, number])
                            : committedSel;

                        // If we have a committed range and no live slider yet, touching inside should "grab" it.
                        if (!sliderPos && committedSel) {
                          setSliderPos(committedSel);
                        }

                        if (currentSel && xPct >= currentSel[0] && xPct <= currentSel[1]) {
                          // Move existing selection
                          setDragState({
                            mode: 'move',
                            offsetPct: xPct - currentSel[0],
                            widthPct: currentSel[1] - currentSel[0],
                          });
                        } else {
                          // New selection
                          setDragState({ mode: 'new', startPct: xPct });
                          setSliderPos([xPct, xPct]);
                          // Don't refocus while drawing a new selection
                          setFocusWindow({ startPct: 0, endPct: 100 });
                        }
                        const target = e.currentTarget as unknown as HTMLElement;
                        if (typeof target.setPointerCapture === 'function') {
                          target.setPointerCapture(e.pointerId);
                        }
                      }}
                      onPointerMove={(e) => {
                        if (!dragState) return;
                        const viewPct = clientXToViewPct(e.clientX);
                        const xPct = focusActive ? clampPct(toDomainX(viewPct)) : viewPct;
                        if (dragState.mode === 'new') {
                          setSliderPos([dragState.startPct, xPct]);
                        } else {
                          // move
                          const start = clampPct(xPct - dragState.offsetPct);
                          const end = clampPct(start + dragState.widthPct);
                          const correctedStart =
                            end - start < dragState.widthPct
                              ? clampPct(end - dragState.widthPct)
                              : start;
                          setSliderPos([
                            correctedStart,
                            clampPct(correctedStart + dragState.widthPct),
                          ]);
                        }
                      }}
                      onPointerUp={(e) => {
                        const target = e.currentTarget as unknown as HTMLElement;
                        if (typeof target.releasePointerCapture === 'function') {
                          target.releasePointerCapture(e.pointerId);
                        }
                        setDragState(null);
                        const sel =
                          sliderPos && sliderPos.length === 2
                            ? ([
                                Math.min(sliderPos[0], sliderPos[1]),
                                Math.max(sliderPos[0], sliderPos[1]),
                              ] as [number, number])
                            : null;
                        if (sel) {
                          handleRangeCommit(sel);
                          // Refocus only after releasing selection
                          setFocusFromSelection(sel);
                        }
                      }}
                    >
                      {/* baseline */}
                      <line
                        x1="0"
                        y1="39.5"
                        x2="100"
                        y2="39.5"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                      />

                      {/* selection overlay */}
                      <rect
                        x={vsx0}
                        y="0"
                        width={Math.max(0.1, vsx1 - vsx0)}
                        height="40"
                        fill="hsl(var(--primary))"
                        fillOpacity="0.06"
                      />
                      <rect
                        x={vsx0}
                        y="0"
                        width="0.4"
                        height="40"
                        fill="hsl(var(--primary))"
                        fillOpacity="0.35"
                      />
                      <rect
                        x={vsx1 - 0.4}
                        y="0"
                        width="0.4"
                        height="40"
                        fill="hsl(var(--primary))"
                        fillOpacity="0.35"
                      />

                      {histogramData.map((d, idx) => {
                        const x0 = focusActive ? toViewX(d.x0) : d.x0;
                        const x1 = focusActive ? toViewX(d.x1) : d.x1;
                        const x = x0;
                        const w = Math.max(0.05, x1 - x0);
                        const h = (d.logCount / maxLog) * 38;
                        const y = 39 - h;
                        const inRange = d.binEnd >= r0 && d.binStart <= r1;
                        const fill = inRange
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted-foreground))';
                        const opacity = inRange ? 0.9 : 0.18;
                        return (
                          <rect
                            key={d.name}
                            x={x + w * 0.08}
                            y={y}
                            width={w * 0.84}
                            height={h}
                            fill={fill}
                            fillOpacity={opacity}
                            rx="0.6"
                            onMouseMove={(e) => {
                              setHoveredBin({
                                idx,
                                count: d.count,
                                start: d.binStart,
                                end: d.binEnd,
                                clientX: e.clientX,
                                clientY: e.clientY,
                              });
                            }}
                          >
                            <title>
                              {`${fmtNum(d.binStart)} – ${fmtNum(d.binEnd)}\n${d.count.toLocaleString()} rows`}
                            </title>
                          </rect>
                        );
                      })}

                      {/* line overlay */}
                      <polyline
                        points={linePoints}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeOpacity="0.45"
                        strokeWidth="0.6"
                      />
                    </svg>

                    {hoveredBin && (
                      <div
                        className="pointer-events-none absolute z-50 rounded-md border bg-popover px-2 py-1 shadow-sm"
                        style={{
                          left: 8,
                          top: 8,
                        }}
                      >
                        <div className="text-[10px] text-muted-foreground">count</div>
                        <div className="text-[11px] font-semibold">
                          {hoveredBin.count.toLocaleString()}
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {fmtNum(hoveredBin.start)} → {fmtNum(hoveredBin.end)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Controls */}
            <div className="rounded-lg border bg-background/40 p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] text-muted-foreground uppercase">range</div>
                <div className="text-[10px] text-muted-foreground">
                  avg: {fmtNum(stats.avg)} · total: {stats.total.toLocaleString()}
                </div>
              </div>

              <div className="pt-2 border-t">
                <Slider
                  min={0}
                  max={100}
                  step={0.1}
                  value={sliderPos ?? [0, 100]}
                  onValueChange={handleRangeChange}
                  onValueCommit={handleRangeCommit}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      from
                    </div>
                    <Input
                      type="number"
                      value={
                        sliderPos
                          ? Math.round(posToVal(sliderPos[0]) * 100) / 100
                          : committedRange
                            ? Math.round(committedRange[0] * 100) / 100
                            : Math.round(stats.min * 100) / 100
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && stats) {
                          const pos0 = valToPos(val);
                          const pos1 = sliderPos?.[1] ?? valToPos(committedRange?.[1] ?? stats.max);
                          const newPos: [number, number] = [pos0, pos1];
                          setSliderPos(newPos);
                          handleRangeCommit(newPos);
                        }
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase text-right">
                      to
                    </div>
                    <Input
                      type="number"
                      value={
                        sliderPos
                          ? Math.round(posToVal(sliderPos[1]) * 100) / 100
                          : committedRange
                            ? Math.round(committedRange[1] * 100) / 100
                            : Math.round(stats.max * 100) / 100
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && stats) {
                          const pos0 = sliderPos?.[0] ?? valToPos(committedRange?.[0] ?? stats.min);
                          const pos1 = valToPos(val);
                          const newPos: [number, number] = [pos0, pos1];
                          setSliderPos(newPos);
                          handleRangeCommit(newPos);
                        }
                      }}
                      className="h-8 text-xs text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground font-mono">Stats not available</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
