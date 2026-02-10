import { useState, useRef, useLayoutEffect, createElement, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';

import { type CacheEntry } from './DataCoordinator';
import { useMaterialize, useMultiMaterialize, type ExtractRow } from './reducks';
import { QueryTable } from '../table/QueryTable';

// --- Types ---

type SourcesData<T extends Record<string, CacheEntry | null>> = {
  [K in keyof T]: ExtractRow<NonNullable<T[K]>>[];
};

interface DataCardComponent {
  /** Single source, slice mode (default) — children receives all rows. */
  <TEntry extends CacheEntry<string, any> | null>(props: {
    source: TEntry;
    mode?: 'slice';
    fallback?: ReactNode;
    children: (data: ExtractRow<NonNullable<TEntry>>[]) => ReactNode;
  }): ReactNode;

  /** Single source, single mode — children receives first row. */
  <TEntry extends CacheEntry<string, any> | null>(props: {
    source: TEntry;
    mode: 'single';
    fallback?: ReactNode;
    children: (data: ExtractRow<NonNullable<TEntry>>) => ReactNode;
  }): ReactNode;

  /** Multiple sources — children receives a keyed record of row arrays. */
  <TSources extends Record<string, CacheEntry<string, any> | null>>(props: {
    sources: TSources;
    fallback?: ReactNode;
    children: (data: SourcesData<TSources>) => ReactNode;
  }): ReactNode;
}

// --- Internal Components ---

function DataCardSingle({ source, mode, fallback, children }: {
  source: CacheEntry | null;
  mode?: 'single' | 'slice';
  fallback?: ReactNode;
  children: (data: any) => ReactNode;
}): ReactNode {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);
  const data = useMaterialize(source);

  // Measure height of the chart content so QueryTable can match it
  useLayoutEffect(() => {
    if (view === 'chart' && contentRef.current) {
      const height = contentRef.current.offsetHeight;
      if (height > 0) {
        setContentHeight(height);
      }
    }
  }, [view, data]);

  if (!data) return fallback ?? null;
  if (mode === 'single' && data.length === 0) return fallback ?? null;

  if (view === 'table') {
    return (
      <QueryTable 
        table={source} 
        onClose={() => setView('chart')} 
        height={contentHeight}
      />
    );
  }

  return (
    <div className="relative" ref={contentRef}>
      <button
        type="button"
        onClick={() => setView('table')}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Switch to table view"
      >
        <Table2 className="w-3.5 h-3.5" />
      </button>
      {mode === 'single' ? children(data[0]) : children(data)}
    </div>
  );
}

function DataCardMulti({ sources, fallback, children }: {
  sources: Record<string, CacheEntry | null>;
  fallback?: ReactNode;
  children: (data: any) => ReactNode;
}): ReactNode {
  const data = useMultiMaterialize(sources);
  if (!data) return fallback ?? null;
  return children(data);
}

/**
 * Reactive data boundary component. Materializes CacheEntry sources and renders
 * children with typed data. Isolates re-renders to only the consuming subtree.
 *
 * Features a table/chart toggle icon in the top-right corner (single source only).
 * In table mode, renders a full QueryTable powered by the source CacheEntry,
 * with editable SQL and virtual scrolling.
 *
 * @example Single source (slice):
 * ```tsx
 * <DataCard source={myFragment}>
 *   {(rows) => <Chart data={rows} />}
 * </DataCard>
 * ```
 *
 * @example Single source (aggregate):
 * ```tsx
 * <DataCard source={statsFrag} mode="single">
 *   {(row) => <div>{row.total}</div>}
 * </DataCard>
 * ```
 *
 * @example Multiple sources:
 * ```tsx
 * <DataCard sources={{ stats: statsFrag, share: shareFrag }}>
 *   {({ stats, share }) => <Combined stats={stats} share={share} />}
 * </DataCard>
 * ```
 */
export const DataCard: DataCardComponent = (props: any): any => {
  if ('sources' in props) {
    return createElement(DataCardMulti, props);
  }
  return createElement(DataCardSingle, props);
};
