import { useMemo, useState, useRef, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';

import { type QueryRef } from './reducks';
import { Materialize, toQueryTableSource } from './Materialize';
import { QueryTable } from '../table/QueryTable';
import { cn } from '../table/ui/utils';

type SourceValue = QueryRef | Promise<unknown>;
type SourceProp<T extends Record<string, SourceValue>> = T | (() => T);
type ResolvedData<T extends Record<string, SourceValue>> = {
  [K in keyof T]: T[K] extends QueryRef<infer R>
    ? NonNullable<R>[]
    : T[K] extends Promise<infer R>
    ? R
    : unknown[];
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

function DataCardContent({ source, children, className }: {
  source: Record<string, SourceValue>;
  children: (data: Record<string, unknown>) => ReactNode;
  className?: string;
}): ReactNode {
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
    <Materialize source={source}>
      {(data) => (
        <div className={cn('group relative', className)} ref={contentRef}>
          {hasSource && (
            <button
              type="button"
              onClick={handleSwitchToTable}
              className="absolute top-2 right-2 z-30 p-1.5 rounded-md bg-muted/35 text-muted-foreground opacity-20 hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-muted/80 hover:text-foreground transition-all duration-150"
              title="Switch to table view"
            >
              <Table2 className="w-3.5 h-3.5" />
            </button>
          )}
          {children(data as Record<string, unknown>)}
        </div>
      )}
    </Materialize>
  );
}

/**
 * Reactive data boundary with table view toggle. Resolves QueryRef/Promise sources
 * with Suspense and renders children with typed named data.
 *
 * For a raw version without the table toggle UI, use `Materialize` instead.
 *
 * Usage:
 *   <DataCard source={{ rows: myRef }}>{({rows}) => ...}</DataCard>
 *   <DataCard source={{ stats: statsRef.next() }}>{({stats}) => stats?.total}</DataCard>
 *   <DataCard source={() => ({ rows: myRef })}>{({rows}) => ...}</DataCard>
 */
export const DataCard: DataCardComponent = ((props: {
  source: Record<string, SourceValue> | (() => Record<string, SourceValue>);
  fallback?: ReactNode;
  className?: string;
  disabled?: boolean;
  children: (data: Record<string, unknown>) => ReactNode;
}): ReactNode => {
  if (props?.disabled) return null;
  const source = typeof props.source === 'function' ? props.source() : props.source;
  return (
    <DataCardContent source={source} className={props.className}>
      {props.children}
    </DataCardContent>
  );
}) as DataCardComponent;
