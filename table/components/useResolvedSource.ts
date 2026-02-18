import { use, useEffect, useMemo, useRef, useState } from 'react';
import { tableFromJSON, Table } from 'apache-arrow';
import { type QueryRef, tablePath, useTable } from '../../react/reducks';
import type { ConnectionPool } from '../../duck/ConnectionPool';
import { normalizeSelectSql } from './sqlUtils';

let tableCounter = 0;
function getNextTableName() {
  return `_qt_${++tableCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

const isQueryRef = (v: unknown): v is QueryRef =>
  !!v && typeof v === 'object' && '_type' in v && '_id' in v;

export type ResolvedSource = {
  sql: string | null;
  originalSql: string | null;
  params?: unknown[];
  entry?: QueryRef;
  loading: boolean;
  loadingMessage?: string;
  refreshing?: boolean;
};

export function useResolvedSource(
  tableInput: string | Record<string, unknown>[] | Table | QueryRef | null | undefined,
  pool: ConnectionPool,
): ResolvedSource {
  const entry = isQueryRef(tableInput) ? tableInput : undefined;
  const fragmentRef = isQueryRef(tableInput) && tableInput._type === 'fragment' ? tableInput : undefined;
  const wrappedRef = useTable((t) => `SELECT * FROM ${t._src}`, { _src: fragmentRef });

  const [registered, setRegistered] = useState<{ sql: string } | null>(null);

  useEffect(() => {
    const isData = Array.isArray(tableInput) || tableInput instanceof Table;
    if (!isData) {
      setRegistered(null);
      return;
    }

    let cancelled = false;
    const tableName = getNextTableName();

    async function register() {
      try {
        let tableToInsert: Table | null = null;
        if (tableInput instanceof Table) tableToInsert = tableInput;
        else if (Array.isArray(tableInput)) tableToInsert = tableFromJSON(tableInput);

        if (tableToInsert) {
          const conn = await pool.acquire();
          try {
            await conn.insertArrowTable(tableToInsert, { name: tableName, create: true });
          } finally {
            pool.release(conn);
          }
        }

        if (cancelled) return;
        setRegistered({ sql: `SELECT * FROM "${tableName}"` });
      } catch (err) {
        console.error('[DataTable] Failed to register data:', err);
      }
    }

    void register();
    return () => {
      cancelled = true;
      pool.query(`DROP TABLE IF EXISTS "${tableName}"`).catch(() => {});
    };
  }, [tableInput, pool]);

  const originalSql = useMemo(() => {
    if (typeof tableInput === 'string') return tableInput;
    if (isQueryRef(tableInput)) return tableInput._query;
    return null;
  }, [tableInput]);

  const lastGood = useRef<ResolvedSource | null>(null);

  if (isQueryRef(tableInput) && tableInput._type === 'table') {
    use(tableInput.materialize());
    const result: ResolvedSource = {
      sql: `SELECT * FROM '${tablePath(tableInput)}'`,
      originalSql,
      entry,
      loading: false,
    };
    if (result.sql) lastGood.current = result;
    return result;
  }

  if (isQueryRef(tableInput) && tableInput._type === 'fragment') {
    use(wrappedRef.materialize());
    const result: ResolvedSource = {
      sql: `SELECT * FROM '${tablePath(wrappedRef)}'`,
      originalSql,
      entry,
      loading: false,
    };
    if (result.sql) lastGood.current = result;
    return result;
  }

  if (Array.isArray(tableInput) || tableInput instanceof Table) {
    if (!registered) {
      return { sql: null, originalSql: null, loading: true, loadingMessage: 'registering data...' };
    }
    const result: ResolvedSource = { sql: registered.sql, originalSql: registered.sql, loading: false };
    lastGood.current = result;
    return result;
  }

  if (typeof tableInput === 'string' && tableInput.trim()) {
    const result: ResolvedSource = {
      sql: normalizeSelectSql(tableInput),
      originalSql,
      entry,
      loading: false,
    };
    if (result.sql) lastGood.current = result;
    return result;
  }

  return { sql: null, originalSql: null, loading: false };
}
