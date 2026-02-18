import { use, useMemo, useState, useRef, Suspense, createElement, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';

import { type QueryRef } from './reducks';
import { QueryTable } from '../table/QueryTable';
import { cn } from '../table/ui/utils';

type SourceValue = QueryRef | Promise<unknown>;
type SourceProp<T extends Record<string, SourceValue>> = T | (() => T);
type ResolvedData<T extends Record<string, SourceValue>> = {
  [K in keyof T]: T[K] extends Promise<infer R> ? R : unknown[];
};
const TABLE_TOOLBAR_HEIGHT = 42;
const DEFAULT_TABLE_VIEWPORT_HEIGHT = 240;

interface DataCardComponent {
  <T extends Record<string, SourceValue>>(props: {
    source: SourceProp<T>;
    fallback?: ReactNode;
    className?: string;
    disabled?: boolean;
    children: (data: ResolvedData<T>) => ReactNode;
  }): ReactNode;
}

function isQueryRef(value: SourceValue): value is QueryRef {
  return typeof value === 'object' && value !== null && '_id' in value && '_type' in value;
}

function resolveSource(source: Record<string, SourceValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    out[key] = isQueryRef(value) ? use(value.materialize()) : use(value);
  }
  return out;
}

function toQueryTableSource(source: Record<string, SourceValue>): Record<string, QueryRef> {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => isQueryRef(value)),
  ) as Record<string, QueryRef>;
}

function DataCardImpl({ source: sourceProp, children, className }: {
  source: Record<string, SourceValue> | (() => Record<string, SourceValue>);
  children: (data: Record<string, unknown>) => ReactNode;
  className?: string;
}): ReactNode {
  const source = typeof sourceProp === 'function' ? sourceProp() : sourceProp;
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const contentRef = useRef<HTMLDivElement>(null);
  const savedHeightRef = useRef<number | undefined>(undefined);
  const savedWidthRef = useRef<number | undefined>(undefined);
  const queryTableSource = useMemo(() => toQueryTableSource(source), [source]);

  const hasSource = Object.keys(queryTableSource).length > 0;
  const cardHeight = savedHeightRef.current;
  const cardWidth = savedWidthRef.current;
  const tableHeight = cardHeight != null
    ? cardHeight - TABLE_TOOLBAR_HEIGHT
    : DEFAULT_TABLE_VIEWPORT_HEIGHT;

  const handleSwitchToTable = () => {
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const height = Math.round(rect.height);
      const width = Math.round(rect.width);
      if (height > 0) savedHeightRef.current = height;
      if (width > 0) savedWidthRef.current = width;
    }
    setView('table');
  };

  const data = resolveSource(source);

  if (view === 'table' && hasSource) {
    return (
      <div
        style={{
          height: cardHeight,
          minHeight: cardHeight,
          maxHeight: cardHeight,
          width: cardWidth,
          minWidth: cardWidth,
          maxWidth: cardWidth,
        }}
        className={cn('flex min-h-0 flex-col overflow-hidden', className)}
      >
        <QueryTable
          table={queryTableSource}
          onClose={() => setView('chart')}
          height={tableHeight}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={contentRef}>
      {hasSource && (
        <button
          type="button"
          onClick={handleSwitchToTable}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Switch to table view"
        >
          <Table2 className="w-3.5 h-3.5" />
        </button>
      )}
      {children(data as Record<string, unknown>)}
    </div>
  );
}

/**
 * Reactive data boundary. Resolves QueryRef/Promise sources with Suspense and
 * renders children with typed named data. Isolates re-renders to the subtree.
 *
 * Usage:
 *   <DataCard source={{ rows: myRef }}>{({rows}) => ...}</DataCard>
 *   <DataCard source={{ stats: statsRef.materialize({ row: true }) }}>{({stats}) => stats?.total}</DataCard>
 *   <DataCard source={() => ({ rows: myRef })}>{({rows}) => ...}</DataCard>
 */
export const DataCard: DataCardComponent = (props: any): any => {
  if (props?.disabled) return <div>disabled</div>;
  return (
    <Suspense fallback={props?.fallback ?? null}>
      {createElement(DataCardImpl, props)}
    </Suspense>
  );
};
