import { useEffect, useMemo, useState } from 'react';
import { tableFromJSON, Table } from 'apache-arrow';
import { type QueryRef, getCoordinator } from '../../react/reducks';
import type { ConnectionPool } from '../../duck/ConnectionPool';

// --- Helpers ---

let tableCounter = 0;
function getNextTableName() {
  return `_dt_${++tableCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

const isQueryRef = (v: unknown): v is QueryRef =>
  !!v && typeof v === 'object' && '_type' in v && '_id' in v;

// --- Hook ---

export type ResolvedSource = {
  sql: string | null;
  params?: unknown[];
  entry?: QueryRef;
  loading: boolean;
  loadingMessage?: string;
};

export function useResolvedSource(
  tableInput: string | Record<string, unknown>[] | Table | QueryRef | null | undefined,
  pool: ConnectionPool,
): ResolvedSource {
  // 1. Resolve entry sources to flat SQL
  const entryResolvedSql = useMemo<string | null>(() => {
    if (!isQueryRef(tableInput)) return null;
    if (tableInput._status !== 'ready') return null;
    const coordinator = getCoordinator(pool);
    return coordinator.resolveEntryAsSql(tableInput);
  }, [tableInput, pool]);

  // 2. Handle data/arrow registration (insert into temp DuckDB table)
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

  // 3. Derive final result
  const entry = isQueryRef(tableInput) ? tableInput : undefined;
  const isEntryLoading = isQueryRef(tableInput) && !entryResolvedSql;
  const isDataLoading = (Array.isArray(tableInput) || tableInput instanceof Table) && !registered;

  if (isEntryLoading) {
    return { sql: null, entry, loading: true, loadingMessage: 'waiting for data...' };
  }

  if (isDataLoading) {
    return { sql: null, loading: true, loadingMessage: 'registering data...' };
  }

  const sql = typeof tableInput === 'string'
    ? tableInput
    : isQueryRef(tableInput)
      ? entryResolvedSql
      : registered?.sql ?? null;

  return { sql: sql ?? null, entry, loading: false };
}
