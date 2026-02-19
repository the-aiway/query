import { use, Suspense, createElement, type ReactNode } from 'react';

import { type QueryRef } from './reducks.type';

type SourceValue = QueryRef | Promise<unknown>;
type ResolvedData<T extends Record<string, SourceValue>> = {
  [K in keyof T]: T[K] extends Promise<infer R> ? R : unknown[];
};

export interface MaterializeComponent {
  <T extends Record<string, SourceValue>>(props: {
    source: T;
    fallback?: ReactNode;
    disabled?: boolean;
    children: (data: ResolvedData<T>) => ReactNode;
  }): ReactNode;
}

export function isQueryRef(value: SourceValue): value is QueryRef {
  return typeof value === 'object' && value !== null && 'id' in value && 'type' in value;
}

export function resolveSource(source: Record<string, SourceValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (isQueryRef(value)) value.ensureName(key);
    out[key] = isQueryRef(value) ? use(value.toArray()) : use(value);
  }
  return out;
}

export function toQueryTableSource(source: Record<string, SourceValue>): Record<string, QueryRef> {
  for (const [key, value] of Object.entries(source)) {
    if (isQueryRef(value)) value.ensureName(key);
  }
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => isQueryRef(value)),
  ) as Record<string, QueryRef>;
}

function MaterializeImpl({ source, children }: {
  source: Record<string, SourceValue>;
  children: (data: Record<string, unknown>) => ReactNode;
}): ReactNode {
  const data = resolveSource(source);
  return children(data as Record<string, unknown>);
}

/**
 * Low-level reactive data boundary. Resolves QueryRef/Promise sources with Suspense
 * and renders children with typed named data. Does not include UI chrome.
 *
 * Usage:
 *   const orders = useSql(() => `SELECT * FROM orders`);
 *   <Materialize source={{ orders }}>{({orders}) => <MyChart data={orders} />}</Materialize>
 */
export const Materialize: MaterializeComponent = ((props: {
  source: Record<string, SourceValue>;
  fallback?: ReactNode;
  disabled?: boolean;
  children: (data: Record<string, unknown>) => ReactNode;
}): ReactNode => {
  if (props?.disabled) return null;
  return (
    <Suspense fallback={props?.fallback ?? null}>
      {createElement(MaterializeImpl, { source: props.source, children: props.children })}
    </Suspense>
  );
}) as MaterializeComponent;
