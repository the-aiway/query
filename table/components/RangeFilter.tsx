import { useQuery, keepPreviousData } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import { useQT } from './QueryTableContext';
import { buildWhereClause, quoteIdent, isRangeFilter, type FiltersState } from './sqlUtils';

import { Input } from '../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Slider } from '../ui/Slider';

const FLOAT_BUCKETS = 80;
const MAX_DISCRETE_BINS = 200;
const INT_TYPES = /INT|TINYINT|SMALLINT|BIGINT|HUGEINT|UBIGINT|UINTEGER|USMALLINT|UTINYINT/i;

function useColumnStats(opts: {
  open: boolean;
  col: string | null;
  isInteger: boolean;
  baseSql: string;
  params?: unknown[];
  globalFilter: string;
  fieldNamesForGlobal: string[];
  columnFilters: FiltersState;
  pool: ReturnType<typeof import('../../react/DuckDBProvider').useDuckDB>['pool'];
}) {
  return useQuery({
    queryKey: [
      'duckdb',
      'stats',
      opts.col,
      opts.baseSql,
      opts.globalFilter,
      opts.columnFilters,
      opts.isInteger,
    ],
    queryFn: async () => {
      if (!opts.baseSql || !opts.col || !opts.open) return null;

      const { whereClause, whereParams } = buildWhereClause({
        globalFilter: opts.globalFilter,
        fieldNamesForGlobal: opts.fieldNamesForGlobal,
        columnFilters: opts.columnFilters,
        excludeCol: opts.col,
      });

      const colIdent = quoteIdent(opts.col);

      const histCTE = opts.isInteger
        ? `hist AS (
            SELECT ${colIdent}::BIGINT as bucket, COUNT(*)::BIGINT as cnt
            FROM filtered
            WHERE ${colIdent} IS NOT NULL
            GROUP BY 1
          )`
        : `hist AS (
            SELECT
              CASE
                WHEN ${colIdent} < (SELECT min_val FROM stats) THEN 0
                WHEN ${colIdent} >= (SELECT max_val FROM stats) THEN ${FLOAT_BUCKETS + 1}
                WHEN (SELECT max_val FROM stats) = (SELECT min_val FROM stats) THEN 1
                ELSE floor(((${colIdent} - (SELECT min_val FROM stats)) / ((SELECT max_val FROM stats) - (SELECT min_val FROM stats))) * ${FLOAT_BUCKETS})::INT + 1
              END as bucket,
              COUNT(*)::BIGINT as cnt
            FROM filtered, stats
            WHERE ${colIdent} IS NOT NULL
            GROUP BY 1
          )`;

      const q = `
        WITH base AS (${opts.baseSql}),
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
        ${histCTE}
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
      const rows = await opts.pool.query(q, fullParams);

      if (rows.length === 0) return null;

      const firstRow = rows[0];
      if (!firstRow) return null;

      const min = Number(firstRow.min_val);
      const max = Number(firstRow.max_val);
      const total = Number(firstRow.total);

      if (total === 0) return null;

      const base = {
        min,
        max,
        min_val: min,
        max_val: max,
        avg: Number(firstRow.avg_val),
        median: Number(firstRow.median_val),
        p01: Number(firstRow.p01),
        p99: Number(firstRow.p99),
        p90: Number(firstRow.p90),
        total,
      };

      if (min === max) {
        return {
          ...base,
          histogram: [{ bin: 0, count: total }],
          discrete: true,
          discreteValues: [{ value: min, count: total }],
        };
      }

      if (opts.isInteger) {
        const rawValues: { value: number; count: number }[] = [];
        for (const r of rows as { bucket: number; cnt: number }[]) {
          if (!r) continue;
          rawValues.push({ value: Number(r.bucket), count: Number(r.cnt) });
        }
        rawValues.sort((a, b) => a.value - b.value);

        const intRange = Math.round(max) - Math.round(min) + 1;

        if (intRange <= MAX_DISCRETE_BINS) {
          const intMin = Math.round(min);
          const valueMap = new Map(rawValues.map((v) => [v.value, v.count]));
          const discreteValues: { value: number; count: number }[] = [];
          for (let i = 0; i < intRange; i++) {
            const val = intMin + i;
            discreteValues.push({ value: val, count: valueMap.get(val) ?? 0 });
          }
          return {
            ...base,
            histogram: discreteValues.map((d, i) => ({ bin: i, count: d.count })),
            discrete: true,
            discreteValues,
          };
        }

        const histogram = Array.from({ length: FLOAT_BUCKETS }, (_, i) => ({
          bin: i,
          count: 0,
        }));
        for (const v of rawValues) {
          const idx = Math.min(
            FLOAT_BUCKETS - 1,
            Math.max(0, Math.floor(((v.value - min) / (max - min)) * FLOAT_BUCKETS)),
          );
          histogram[idx]!.count += v.count;
        }
        return { ...base, histogram, discrete: false, discreteValues: null };
      }

      const histogram = Array.from({ length: FLOAT_BUCKETS }, (_, i) => ({
        bin: i,
        count: 0,
      }));
      for (const r of rows as { bucket: number; cnt: number }[]) {
        if (!r) continue;
        const cnt = Number(r.cnt);
        if (r.bucket >= 1 && r.bucket <= FLOAT_BUCKETS) {
          histogram[r.bucket - 1]!.count = cnt;
        } else if (r.bucket <= 0) {
          histogram[0]!.count += cnt;
        } else if (r.bucket >= FLOAT_BUCKETS + 1) {
          histogram[FLOAT_BUCKETS - 1]!.count += cnt;
        }
      }
      return { ...base, histogram, discrete: false, discreteValues: null };
    },
    enabled: opts.open && !!opts.col && !!opts.baseSql,
    placeholderData: keepPreviousData,
  });
}

type DiscreteValue = { value: number; count: number };

type ColumnStatsData = {
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
  discrete: boolean;
  discreteValues: DiscreteValue[] | null;
  total: number;
};

export function RangeFilter({
  col,
  icon,
  triggerClassName,
}: {
  col: string;
  icon: React.ReactNode;
  triggerClassName?: string;
}) {
  const {
    pool,
    schema,
    columnFilters,
    onChangeFilter,
    onClearCol,
    openFilterCol,
    onOpenFilterCol,
    queryParts,
    globalFilter,
    fieldNamesForGlobal,
    params,
  } = useQT();

  const open = openFilterCol === col;
  const filterValue = columnFilters[col];

  const colType = useMemo(() => {
    const s = schema?.find((c) => c.name === col);
    return s?.type?.toUpperCase() ?? '';
  }, [schema, col]);

  const isInteger = INT_TYPES.test(colType);

  const {
    data: stats,
    isLoading,
    error,
  } = useColumnStats({
    open,
    col,
    isInteger,
    baseSql: queryParts.baseSql,
    params,
    globalFilter,
    fieldNamesForGlobal,
    columnFilters,
    pool,
  }) as { isLoading: boolean; error: Error | null; data: ColumnStatsData };

  const fmtNum = (n: number | undefined) => {
    if (n === undefined || n === null) return '—';
    if (isInteger) return Math.round(n).toLocaleString();
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const valToPos = (v: number): number => {
    if (!stats) return 0;
    if (stats.max === stats.min) return 0;
    return ((v - stats.min) / (stats.max - stats.min)) * 100;
  };

  const posToVal = (p: number): number => {
    if (!stats) return 0;
    const raw = stats.min + (p / 100) * (stats.max - stats.min);
    return isInteger ? Math.round(raw) : raw;
  };

  const committedRange = useMemo(() => {
    if (filterValue && isRangeFilter(filterValue)) {
      return filterValue.$between;
    }
    return null;
  }, [filterValue]);

  const [sliderPos, setSliderPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (open && stats) {
      if (committedRange) {
        setSliderPos([valToPos(committedRange[0]), valToPos(committedRange[1])]);
      } else {
        setSliderPos([0, 100]);
      }
    }
  }, [open, stats, committedRange]);

  const handleRangeChange = (val: number[]) => {
    if (val.length >= 2 && val[0] !== undefined && val[1] !== undefined) {
      setSliderPos([val[0], val[1]]);
    }
  };

  const handleRangeCommit = (val: number[]) => {
    if (!stats || val.length < 2 || val[0] === undefined || val[1] === undefined) return;
    const v0 = posToVal(val[0]);
    const v1 = posToVal(val[1]);
    const epsilon = isInteger ? 0.5 : (stats.max - stats.min) * 0.0001;
    const isFull = Math.abs(v0 - stats.min) < epsilon && Math.abs(v1 - stats.max) < epsilon;
    if (isFull) {
      onChangeFilter(col, undefined);
    } else {
      onChangeFilter(col, { $between: [v0, v1] });
    }
  };

  const currentRange =
    sliderPos && sliderPos.length === 2
      ? ([posToVal(sliderPos[0]), posToVal(sliderPos[1])] as [number, number])
      : (committedRange ?? (stats ? ([stats.min, stats.max] as [number, number]) : null));

  const displayFrom = currentRange
    ? isInteger
      ? Math.round(currentRange[0])
      : Math.round(currentRange[0] * 100) / 100
    : stats
      ? isInteger
        ? Math.round(stats.min)
        : Math.round(stats.min * 100) / 100
      : 0;

  const displayTo = currentRange
    ? isInteger
      ? Math.round(currentRange[1])
      : Math.round(currentRange[1] * 100) / 100
    : stats
      ? isInteger
        ? Math.round(stats.max)
        : Math.round(stats.max * 100) / 100
      : 0;

  const [hoveredBin, setHoveredBin] = useState<null | {
    label: string;
    count: number;
  }>(null);

  return (
    <Popover open={open} onOpenChange={(o) => onOpenFilterCol(o ? col : null)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative h-6 w-6 inline-flex items-center justify-center rounded border border-border bg-background/40 backdrop-blur hover:bg-background/60 ${triggerClassName ?? ''}`}
          title={
            filterValue && isRangeFilter(filterValue)
              ? `Filter [${filterValue.$between[0]}, ${filterValue.$between[1]}]`
              : 'Filter values'
          }
          onClick={(e) => e.stopPropagation()}
        >
          {icon}
          {filterValue && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono leading-4 text-center">
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
            <div className="text-xs font-mono font-semibold truncate">{col}</div>
            <div className="mt-1 text-[10px] font-mono text-muted-foreground">
              {committedRange
                ? `${fmtNum(committedRange[0])} → ${fmtNum(committedRange[1])}`
                : 'no range filter'}
              {colType && <span className="ml-2 opacity-60">({colType})</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="h-7 px-2 rounded border bg-background/60 hover:bg-background text-[11px] font-mono text-muted-foreground hover:text-foreground"
              onClick={() => onClearCol(col)}
            >
              clear
            </button>
            <button
              type="button"
              className="h-7 px-2 rounded border bg-background/60 hover:bg-background text-[11px] font-mono text-muted-foreground hover:text-foreground"
              onClick={() => onOpenFilterCol(null)}
            >
              close
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-xs text-muted-foreground font-mono">loading…</div>
        ) : error ? (
          <div className="text-xs text-destructive font-mono whitespace-pre-wrap">
            {String(error)}
          </div>
        ) : stats ? (
          <div className="space-y-3">
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
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">{k}</div>
                  <div className="text-[11px] font-mono font-semibold tabular-nums">
                    {fmtNum(v)}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-background/40 p-2 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">
                  distribution (log)
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  non-null: {stats.total.toLocaleString()}
                </div>
              </div>

              <Histogram
                stats={stats}
                currentRange={currentRange}
                sliderPos={sliderPos}
                fmtNum={fmtNum}
                hoveredBin={hoveredBin}
                setHoveredBin={setHoveredBin}
              />
            </div>

            <div className="rounded-lg border bg-background/40 p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">range</div>
                <div className="text-[10px] font-mono text-muted-foreground">
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
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">
                      from
                    </div>
                    <Input
                      type="number"
                      step={isInteger ? 1 : 0.01}
                      value={displayFrom}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && stats) {
                          const rounded = isInteger ? Math.round(val) : val;
                          const pos0 = valToPos(rounded);
                          const pos1 =
                            sliderPos?.[1] ?? valToPos(committedRange?.[1] ?? stats.max);
                          const newPos: [number, number] = [pos0, pos1];
                          setSliderPos(newPos);
                          handleRangeCommit(newPos);
                        }
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase text-right">
                      to
                    </div>
                    <Input
                      type="number"
                      step={isInteger ? 1 : 0.01}
                      value={displayTo}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && stats) {
                          const rounded = isInteger ? Math.round(val) : val;
                          const pos0 =
                            sliderPos?.[0] ?? valToPos(committedRange?.[0] ?? stats.min);
                          const pos1 = valToPos(rounded);
                          const newPos: [number, number] = [pos0, pos1];
                          setSliderPos(newPos);
                          handleRangeCommit(newPos);
                        }
                      }}
                      className="h-8 text-xs font-mono text-right"
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

function Histogram({
  stats,
  currentRange,
  sliderPos,
  fmtNum,
  hoveredBin,
  setHoveredBin,
}: {
  stats: ColumnStatsData;
  currentRange: [number, number] | null;
  sliderPos: [number, number] | null;
  fmtNum: (n: number | undefined) => string;
  hoveredBin: { label: string; count: number } | null;
  setHoveredBin: (b: { label: string; count: number } | null) => void;
}) {
  if (stats.discrete && stats.discreteValues) {
    return (
      <DiscreteHistogram
        values={stats.discreteValues}
        currentRange={currentRange ?? [stats.min, stats.max]}
        sliderPos={sliderPos}
        stats={stats}
        hoveredBin={hoveredBin}
        setHoveredBin={setHoveredBin}
      />
    );
  }

  return (
    <ContinuousHistogram
      histogram={stats.histogram}
      stats={stats}
      currentRange={currentRange ?? [stats.min, stats.max]}
      sliderPos={sliderPos}
      fmtNum={fmtNum}
      hoveredBin={hoveredBin}
      setHoveredBin={setHoveredBin}
    />
  );
}

function DiscreteHistogram({
  values,
  currentRange,
  sliderPos,
  stats,
  hoveredBin,
  setHoveredBin,
}: {
  values: DiscreteValue[];
  currentRange: [number, number];
  sliderPos: [number, number] | null;
  stats: ColumnStatsData;
  hoveredBin: { label: string; count: number } | null;
  setHoveredBin: (b: { label: string; count: number } | null) => void;
}) {
  const n = values.length;
  const maxLog = Math.max(1, ...values.map((d) => Math.log(d.count + 1)));
  const [r0, r1] =
    currentRange[0] <= currentRange[1] ? currentRange : [currentRange[1], currentRange[0]];

  const selPos =
    sliderPos && sliderPos.length === 2
      ? ([Math.min(sliderPos[0], sliderPos[1]), Math.max(sliderPos[0], sliderPos[1])] as [
          number,
          number,
        ])
      : ([0, 100] as [number, number]);

  const barWidth = 100 / n;
  const gap = Math.min(barWidth * 0.15, 1.5);

  return (
    <>
      <svg
        viewBox="0 0 100 44"
        className="w-full h-[160px] block"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredBin(null)}
      >
        <line
          x1="0"
          y1="39.5"
          x2="100"
          y2="39.5"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
        />
        <rect
          x={selPos[0]}
          y="0"
          width={Math.max(0.1, selPos[1] - selPos[0])}
          height="40"
          fill="hsl(var(--primary))"
          fillOpacity="0.06"
        />

        {values.map((d, i) => {
          const logCount = Math.log(d.count + 1);
          const h = (logCount / maxLog) * 38;
          const y = 39 - h;
          const x = i * barWidth + gap;
          const w = Math.max(0.1, barWidth - gap * 2);
          const inRange = d.value >= r0 - 0.5 && d.value <= r1 + 0.5;
          const fill = inRange ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
          const opacity = inRange ? 0.9 : 0.18;
          return (
            <rect
              key={d.value}
              x={x}
              y={y}
              width={w}
              height={h}
              fill={fill}
              fillOpacity={opacity}
              rx="0.6"
              onMouseMove={() =>
                setHoveredBin({ label: String(d.value), count: d.count })
              }
            >
              <title>{`${d.value}\n${d.count.toLocaleString()} rows`}</title>
            </rect>
          );
        })}

        {n <= 30 &&
          values.map((d, i) => {
            const cx = i * barWidth + barWidth / 2;
            return (
              <text
                key={`label-${d.value}`}
                x={cx}
                y="43"
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="2.8"
                fontFamily="monospace"
              >
                {d.value}
              </text>
            );
          })}
      </svg>

      {hoveredBin && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border bg-popover px-2 py-1 shadow-sm"
          style={{ left: 8, top: 8 }}
        >
          <div className="text-[10px] font-mono text-muted-foreground">value {hoveredBin.label}</div>
          <div className="text-[11px] font-mono font-semibold">
            {hoveredBin.count.toLocaleString()} rows
          </div>
        </div>
      )}
    </>
  );
}

function ContinuousHistogram({
  histogram,
  stats,
  currentRange,
  sliderPos,
  fmtNum,
  hoveredBin,
  setHoveredBin,
}: {
  histogram: { bin: number; count: number }[];
  stats: ColumnStatsData;
  currentRange: [number, number];
  sliderPos: [number, number] | null;
  fmtNum: (n: number | undefined) => string;
  hoveredBin: { label: string; count: number } | null;
  setHoveredBin: (b: { label: string; count: number } | null) => void;
}) {
  const bucketCount = Math.max(1, histogram.length);
  const width = (stats.max - stats.min) / bucketCount;
  const maxLog = Math.max(
    1,
    ...histogram.map((d) => Math.log(d.count + 1)),
  );
  const [r0, r1] =
    currentRange[0] <= currentRange[1] ? currentRange : [currentRange[1], currentRange[0]];

  const selPos =
    sliderPos && sliderPos.length === 2
      ? ([Math.min(sliderPos[0], sliderPos[1]), Math.max(sliderPos[0], sliderPos[1])] as [
          number,
          number,
        ])
      : ([0, 100] as [number, number]);

  const linePoints = histogram
    .map((d) => {
      const xm = ((d.bin + 0.5) / bucketCount) * 100;
      const y = 39 - (Math.log(d.count + 1) / maxLog) * 38;
      return `${xm},${y}`;
    })
    .join(' ');

  return (
    <>
      <svg
        viewBox="0 0 100 40"
        className="w-full h-[160px] block"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredBin(null)}
      >
        <line
          x1="0"
          y1="39.5"
          x2="100"
          y2="39.5"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
        />
        <rect
          x={selPos[0]}
          y="0"
          width={Math.max(0.1, selPos[1] - selPos[0])}
          height="40"
          fill="hsl(var(--primary))"
          fillOpacity="0.06"
        />
        <rect
          x={selPos[0]}
          y="0"
          width="0.4"
          height="40"
          fill="hsl(var(--primary))"
          fillOpacity="0.35"
        />
        <rect
          x={selPos[1] - 0.4}
          y="0"
          width="0.4"
          height="40"
          fill="hsl(var(--primary))"
          fillOpacity="0.35"
        />

        {histogram.map((d) => {
          const x0 = (d.bin / bucketCount) * 100;
          const x1 = ((d.bin + 1) / bucketCount) * 100;
          const w = Math.max(0.05, x1 - x0);
          const logCount = Math.log(d.count + 1);
          const h = (logCount / maxLog) * 38;
          const y = 39 - h;
          const binStart = stats.min + d.bin * width;
          const binEnd = stats.min + (d.bin + 1) * width;
          const inRange = binEnd >= r0 && binStart <= r1;
          const fill = inRange ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
          const opacity = inRange ? 0.9 : 0.18;
          return (
            <rect
              key={d.bin}
              x={x0 + w * 0.08}
              y={y}
              width={w * 0.84}
              height={h}
              fill={fill}
              fillOpacity={opacity}
              rx="0.6"
              onMouseMove={() =>
                setHoveredBin({
                  label: `${fmtNum(binStart)} → ${fmtNum(binEnd)}`,
                  count: d.count,
                })
              }
            >
              <title>{`${fmtNum(binStart)} – ${fmtNum(binEnd)}\n${d.count.toLocaleString()} rows`}</title>
            </rect>
          );
        })}

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
          style={{ left: 8, top: 8 }}
        >
          <div className="text-[10px] font-mono text-muted-foreground">{hoveredBin.label}</div>
          <div className="text-[11px] font-mono font-semibold">
            {hoveredBin.count.toLocaleString()} rows
          </div>
        </div>
      )}
    </>
  );
}
