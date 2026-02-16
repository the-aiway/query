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

  const data = useMaterialize.concurrent(source);
  const entries = Object.entries(source);
  const isSingle = entries.length === 1;
  const firstRef = unwrapFirstRef(source);

  const handleSwitchToTable = () => {
    if (contentRef.current) {
      const height = contentRef.current.offsetHeight;
      if (height > 0) savedHeightRef.current = height;
    }
    setView('table');
  };

  if (!data) return fallback ?? null;

  if (view === 'table' && isSingle && firstRef) {
    return (
      <div style={{ height: savedHeightRef.current }} className={className}>
        <QueryTable
          id={firstRef._name || firstRef._id}
          table={firstRef}
          onClose={() => setView('chart')}
          height={savedHeightRef.current}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-1/5", className)} ref={contentRef}>
      {isSingle && (
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
