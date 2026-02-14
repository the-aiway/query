import { useState, useRef, createElement, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';

import { useMaterialize, type ExtractRow, type QueryRef } from './reducks';
import { QueryTable } from '../table/QueryTable';
import { cn } from '../table/ui/utils';

// --- Types ---

type SourcesData<T extends Record<string, QueryRef | null>> = {
  [K in keyof T]: ExtractRow<NonNullable<T[K]>>[];
};

interface DataCardComponent {
  /** Single source, slice mode (default) — children receives all rows. */
  <TEntry extends QueryRef<string, any> | null>(props: {
    source: TEntry;
    mode?: 'slice';
    fallback?: ReactNode;
    className?: string;
    children: (data: ExtractRow<NonNullable<TEntry>>[]) => ReactNode;
  }): ReactNode;

  /** Single source, single mode — children receives first row. */
  <TEntry extends QueryRef<string, any> | null>(props: {
    source: TEntry;
    mode: 'single';
    fallback?: ReactNode;
    className?: string;
    children: (data: ExtractRow<NonNullable<TEntry>>) => ReactNode;
  }): ReactNode;

  /** Multiple sources — children receives a keyed record of row arrays. */
  <TSources extends Record<string, QueryRef<string, any> | null>>(props: {
    sources: TSources;
    fallback?: ReactNode;
    className?: string;
    children: (data: SourcesData<TSources>) => ReactNode;
  }): ReactNode;
}

// --- Internal Components ---

function DataCardImpl({ source, sources, mode, fallback, children, empty, className }: {
  source?: QueryRef | null;
  sources?: Record<string, QueryRef | null>;
  mode?: 'single' | 'slice';
  fallback?: ReactNode;
  children: (data: any) => ReactNode;
  empty?: boolean;
  className?: string;
}): ReactNode {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const contentRef = useRef<HTMLDivElement>(null);
  const savedHeightRef = useRef<number | undefined>(undefined);

  const isSingleSource = source !== undefined;
  const singleData = useMaterialize.rows(isSingleSource ? source : null);
  const multiData = useMaterialize.concurrent(isSingleSource ? {} : sources ?? {});

  const data = isSingleSource ? singleData : multiData;

  const handleSwitchToTable = () => {
    if (contentRef.current) {
      const height = contentRef.current.offsetHeight;
      if (height > 0) {
        savedHeightRef.current = height;
      }
    }
    setView('table');
  };

  if (!data) return fallback ?? null;
  if (isSingleSource && mode === 'single' && singleData?.length === 0) return fallback ?? null;

  if (view === 'table' && isSingleSource) {
    return (
      <div style={{ height: savedHeightRef.current }} className={className}>
        <QueryTable 
          table={source} 
          onClose={() => setView('chart')} 
          height={savedHeightRef.current}
        />
      </div>
    );
  }

  if (empty) return <div className={className}>emtpy</div>;

  return (
    <div className={cn("relative h-1/5", className)} ref={contentRef}>
      {isSingleSource && (
        <button
          type="button"
          onClick={handleSwitchToTable}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Switch to table view"
        >
          <Table2 className="w-3.5 h-3.5" />
        </button>
      )}
      {isSingleSource 
        ? (mode === 'single' ? children(singleData![0]) : children(singleData!))
        : children(multiData)
      }
    </div>
  );
}

/**
 * Reactive data boundary component. Materializes QueryRef sources and renders
 * children with typed data. Isolates re-renders to only the consuming subtree.
 *
 * Features a table/chart toggle icon in the top-right corner (single source only).
 * In table mode, renders a full QueryTable powered by the source QueryRef,
 * with editable SQL and virtual scrolling.
 */
export const DataCard: DataCardComponent = (props: any): any => {
  if (props?.disabled) {
    return <div>disabled</div>;
  }
  return createElement(DataCardImpl, props);
};
