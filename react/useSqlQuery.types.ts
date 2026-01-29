import type { Table } from 'apache-arrow';

import type { Materialize, InferSQL } from '../duck/inferSqlReturntype';

export type { Materialize, InferSQL };

export interface QueryHandle<T = unknown> {
  alias: string | null;
  tableId: string;
  sql: string;
  params: Record<string, unknown>;

  status: 'pending' | 'success' | 'error';
  isPending: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;

  table: Table | null;
  data: T[] | null;

  duration: number | null;
  updatedAt: number | null;

  promise: Promise<void>;

  refetch(): Promise<void>;
  toString(): string;
}

export type Dependency = QueryHandle | string | number | boolean | null;

export interface RegisteredTable {
  handle: QueryHandle;
  normalizedSql: string;
  refCount: number;
  inflight: Promise<void> | null;
}

export interface SqlQueryContextValue {
  register(alias: string | null, sql: string, params: Record<string, unknown>, depsKey?: string): QueryHandle;
  unregister(alias: string | null, transientKey?: string): void;
  getHandle(alias: string | null, transientKey?: string): QueryHandle | undefined;
  subscribe(alias: string | null, callback: () => void, transientKey?: string): () => void;
}
