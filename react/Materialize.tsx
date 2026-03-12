import { useEffect, useState, type ReactNode } from 'react';

import { isRef, type QueryRef } from './reducks';

type SourceValue = QueryRef | Promise<unknown>;
type ResolvedData<T extends Record<string, SourceValue>> = {
  [K in keyof T]: T[K] extends QueryRef<infer R> ? NonNullable<R>[] : T[K] extends Promise<infer R> ? NonNullable<R> : never;
};

type MaterializeState<T> =
  | { status: 'pending' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T };

export function isQueryRef(value: unknown): value is QueryRef {
  return isRef(value);
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

/**
 * Simple reactive data boundary. Resolves QueryRef/Promise sources and renders children
 * with typed named data. Explicit loading/error/success states.
 *
 * Usage:
 *   const orders = useSql(() => `SELECT * FROM orders`);
 *   <Materialize source={{ orders }} fallback={<div>Loading...</div>}>
 *     {({orders}) => <MyChart data={orders} />}
 *   </Materialize>
 */
export function Materialize<T extends Record<string, SourceValue>>({
  source,
  fallback,
  error: errorFallback,
  disabled = false,
  children,
}: {
  source: T;
  fallback?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  children: (data: ResolvedData<T>) => ReactNode;
}): ReactNode {
  const [state, setState] = useState<MaterializeState<ResolvedData<T>>>({ status: 'pending' });

  useEffect(() => {
    if (disabled) return;

    let isMounted = true;
    resolveSourceAsync(source).then(
      (data) => {
        if (isMounted) setState({ status: 'success', data });
      },
      (err) => {
        if (isMounted) setState({ status: 'error', error: err });
      }
    );

    return () => {
      isMounted = false;
    };
  }, [source, disabled]);

  if (disabled) return null;
  if (state.status === 'pending') return fallback ?? null;
  if (state.status === 'error') return errorFallback ?? null;
  return children(state.data);
}
