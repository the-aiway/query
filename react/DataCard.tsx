import { useState, useRef, createElement, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';

import { useMaterialize, row, map, values, type SourceEntry, type ResolveShape, type QueryRef } from './reducks';
import { QueryTable } from '../table/QueryTable';
import { cn } from '../table/ui/utils';

type ResolvedData<T extends Record<string, SourceEntry>> = {
  [K in keyof T]: ResolveShape<T[K]>;
};

interface ShapeHelpers {
  row: typeof row;
  map: typeof map;
  values: typeof values;
}

const shapeHelpers: ShapeHelpers = { row, map, values };

type SourceProp<T extends Record<string, SourceEntry>> = T | ((m: ShapeHelpers) => T);
const SOURCE_SWITCHER_HEIGHT = 36;
const TABLE_TOOLBAR_HEIGHT = 42;
const DEFAULT_TABLE_VIEWPORT_HEIGHT = 240;

interface DataCardComponent {
  <T extends Record<string, SourceEntry>>(props: {
    source: SourceProp<T>;
    fallback?: ReactNode;
    className?: string;
    disabled?: boolean;
    children: (data: ResolvedData<T>) => ReactNode;
  }): ReactNode;
}

function unwrapFirstRef(source: Record<string, SourceEntry>): QueryRef | null {
  const first = Object.values(source)[0];
  if (!first) return null;
  return '_ref' in first ? first._ref : first;
}

function unwrapRef(entry: SourceEntry | undefined): QueryRef | null {
  if (!entry) return null;
  return '_ref' in entry ? entry._ref : entry;
}

function DataCardImpl({ source: sourceProp, fallback, children, className }: {
  source: Record<string, SourceEntry> | ((m: ShapeHelpers) => Record<string, SourceEntry>);
  fallback?: ReactNode;
  children: (data: Record<string, unknown>) => ReactNode;
  className?: string;
}): ReactNode {
  const source = typeof sourceProp === 'function' ? sourceProp(shapeHelpers) : sourceProp;
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const contentRef = useRef<HTMLDivElement>(null);
  const savedHeightRef = useRef<number | undefined>(undefined);
  const savedWidthRef = useRef<number | undefined>(undefined);

  const data = useMaterialize.concurrent(source);
  const entries = Object.entries(source);
  const hasSource = entries.length > 0;
  const firstRef = unwrapFirstRef(source);
  const firstKey = entries[0]?.[0] ?? null;
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(null);
  const activeSourceKey = selectedSourceKey && source[selectedSourceKey] ? selectedSourceKey : firstKey;
  const activeSourceRef = activeSourceKey ? unwrapRef(source[activeSourceKey]) : firstRef;
  const hasMultipleSources = entries.length > 1;
  const cardHeight = savedHeightRef.current;
  const cardWidth = savedWidthRef.current;
  const tableHeight = cardHeight != null
    ? cardHeight - TABLE_TOOLBAR_HEIGHT - (hasMultipleSources ? SOURCE_SWITCHER_HEIGHT : 0)
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

  if (!data) return fallback ?? null;

  if (view === 'table' && activeSourceRef) {
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
          id={activeSourceRef._name || activeSourceRef._id}
          table={activeSourceRef}
          onClose={() => setView('chart')}
          height={tableHeight}
          footer={hasMultipleSources ? (
            <div className="flex items-center gap-1 overflow-x-auto bg-background/95 px-2 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/75">
              {entries.map(([key, entry]) => {
                const ref = unwrapRef(entry);
                if (!ref) return null;
                const active = key === activeSourceKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSourceKey(key)}
                    className={cn(
                      'shrink-0 rounded border px-2 py-0.5 text-[9px] font-mono transition-colors',
                      active
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    )}
                    title={ref._name || ref._id}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ) : undefined}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={contentRef}>
      {hasSource && activeSourceRef && (
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
 * Reactive data boundary. Materializes QueryRef sources and renders
 * children with typed named data. Isolates re-renders to the consuming subtree.
 *
 * Usage:
 *   <DataCard source={{myTable}}>{({myTable}) => ...}</DataCard>
 *   <DataCard source={{stats: row(statsRef)}}>{({stats}) => stats.total}</DataCard>
 *   <DataCard source={m => ({ stats: m.row(statsRef) })}>{({stats}) => stats.total}</DataCard>
 */
export const DataCard: DataCardComponent = (props: any): any => {
  if (props?.disabled) return <div>disabled</div>;
  return createElement(DataCardImpl, props);
};
