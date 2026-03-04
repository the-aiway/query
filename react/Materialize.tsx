import { Suspense, createElement, use, type ReactNode } from 'react';

import { isRef, type QueryRef } from './reducks';

type SourceValue = QueryRef | Promise<unknown>;
type ResolvedData<T extends Record<string, SourceValue>> = {
  [K in keyof T]: T[K] extends QueryRef<infer R> ? NonNullable<R>[] : T[K] extends Promise<infer R> ? NonNullable<R> : never;
};

export interface MaterializeComponent {
  <T extends Record<string, SourceValue>>(props: { source: T; fallback?: ReactNode; disabled?: boolean; children: (data: ResolvedData<T>) => ReactNode }): ReactNode;
}

export function isQueryRef(value: unknown): value is QueryRef {
  return isRef(value);
}

export function resolveSource<T extends Record<string, SourceValue>>(source: T): ResolvedData<T> {
  const out: any = {};
  for (const [key, value] of Object.entries(source)) {
    if (isQueryRef(value)) {
      value.ensureName(key);
      out[key] = use(value.rows() as PromiseLike<unknown[]>);
    } else {
      out[key] = use(value as Promise<unknown>);
    }
  }
  return out;
}

export async function resolveSourceAsync<T extends Record<string, SourceValue>>(source: T): Promise<ResolvedData<T>> {
  const out: any = {};
  for (const [key, value] of Object.entries(source)) {
    if (isQueryRef(value)) {
      value.ensureName(key);
      out[key] = await value.rows();
    } else {
      out[key] = await (value as Promise<unknown>);
    }
  }
  return out;
}

export function toQueryTableSource(source: Record<string, unknown>): Record<string, QueryRef> {
  for (const [key, value] of Object.entries(source)) {
    if (isQueryRef(value)) value.ensureName(key);
  }
  return Object.fromEntries(Object.entries(source).filter(([, value]) => isQueryRef(value))) as Record<string, QueryRef>;
}

function MaterializeImpl<T extends Record<string, SourceValue>>({ source, children }: { source: T; children: (data: ResolvedData<T>) => ReactNode }): ReactNode {
  const data = resolveSource(source);
  return children(data);
}

/**
 * Low-level reactive data boundary. Resolves QueryRef/Promise sources with Suspense
 * and renders children with typed named data. Does not include UI chrome.
 *
 * Usage:
 *   const orders = useSql(() => `SELECT * FROM orders`);
 *   <Materialize source={{ orders }}>{({orders}) => <MyChart data={orders} />}</Materialize>
 */
export const Materialize: MaterializeComponent = (<T extends Record<string, SourceValue>>(props: {
  source: T;
  fallback?: ReactNode;
  disabled?: boolean;
  children: (data: ResolvedData<T>) => ReactNode;
}): ReactNode => {
  if (props?.disabled) return null;
  return <Suspense fallback={props?.fallback ?? null}>{createElement(MaterializeImpl<T>, { source: props.source, children: props.children })}</Suspense>;
}) as MaterializeComponent;
