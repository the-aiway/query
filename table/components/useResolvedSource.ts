import { useEffect, useMemo, useState } from 'react';
import { tableFromJSON, Table } from 'apache-arrow';
import { type CacheEntry } from '../../react/DataCoordinator';
import { getCoordinator } from '../../react/reducks';
import type { ConnectionPool } from '../../duck/ConnectionPool';

// --- Types ---

export type DataTableSource =
  | { type: 'sql'; sql: string; params?: unknown[] }
  | { type: 'data'; data: Record<string, unknown>[]; tableName?: string; sql?: string }
  | { type: 'arrow'; table: Table; tableName?: string; sql?: string }
  | { type: 'entry'; entry: CacheEntry };

// --- Factory Functions ---

/** Create a SQL data source */
export function query(sql: string, params?: unknown[]): DataTableSource {
  return { type: 'sql', sql, params };
}

/** Create a data source from in-memory objects */
export function fromJSON(data: Record<string, unknown>[], tableName?: string): DataTableSource {
  return { type: 'data', data, tableName };
}

/** Create a data source from a Reducks CacheEntry */
export function fromEntry(entry: CacheEntry): DataTableSource {
  return { type: 'entry', entry };
}

// --- Helpers ---

let tableCounter = 0;
function getNextTableName() {
  return `_dt_${++tableCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

const isCacheEntry = (v: unknown): v is CacheEntry =>
  !!v && typeof v === 'object' && 'slug' in v && 'status' in v && 'id' in v;

// --- Hook ---

export type ResolvedSource = {
  sql: string | null;
  params?: unknown[];
  entry?: CacheEntry;
  loading: boolean;
  loadingMessage?: string;
};

export function useResolvedSource(
  tableInput: string | Record<string, unknown>[] | Table | CacheEntry | DataTableSource | null | undefined,
  sqlInput: string | undefined,
  paramsInput: unknown[] | undefined,
  pool: ConnectionPool,
): ResolvedSource {
  // 1. Resolve source from various inputs
  const source = useMemo<DataTableSource | null>(() => {
    if (tableInput) {
      if (typeof tableInput === 'string') return query(tableInput, paramsInput);
      if (Array.isArray(tableInput)) return { type: 'data', data: tableInput, sql: sqlInput };
      if (tableInput instanceof Table) return { type: 'arrow', table: tableInput, sql: sqlInput };
      if (isCacheEntry(tableInput)) return { type: 'entry', entry: tableInput };
      return tableInput as DataTableSource;
    }
    if (sqlInput) return query(sqlInput, paramsInput);
    return null;
  }, [tableInput, sqlInput, paramsInput]);

  // 2. Resolve entry sources to flat SQL
  const entryResolvedSql = useMemo<string | null>(() => {
    if (!source || source.type !== 'entry') return null;
    const { entry } = source;
    if (entry.status !== 'ready') return null;
    const coordinator = getCoordinator(pool);
    return coordinator.resolveEntryAsSql(entry);
  }, [source, pool]);

  // 3. Handle data/arrow registration (insert into temp DuckDB table)
  const [registered, setRegistered] = useState<{ sql: string; params?: unknown[] } | null>(null);

  useEffect(() => {
    if (!source || (source.type !== 'data' && source.type !== 'arrow')) {
      setRegistered(null);
      return;
    }

    let cancelled = false;
    const tableName = ('tableName' in source && source.tableName) || getNextTableName();

    async function register() {
      try {
        let tableToInsert: Table | null = null;
        if (source?.type === 'arrow') tableToInsert = source.table;
        else if (source?.type === 'data') tableToInsert = tableFromJSON(source.data);

        if (tableToInsert) {
          const conn = await pool.acquire();
          try {
            await conn.insertArrowTable(tableToInsert, { name: tableName, create: true });
          } finally {
            pool.release(conn);
          }
        }

        if (cancelled) return;

        let sql = (source as { sql?: string }).sql || `SELECT * FROM DATA`;
        sql = sql.replace(/\bDATA\b/gi, `"${tableName}"`);
        setRegistered({ sql });
      } catch (err) {
        console.error('[DataTable] Failed to register data:', err);
      }
    }

    void register();
    return () => {
      cancelled = true;
      pool.query(`DROP TABLE IF EXISTS "${tableName}"`).catch(() => {});
    };
  }, [source, pool]);

  // 4. Derive final result (all hooks already called above)
  const entry = source?.type === 'entry' ? source.entry : undefined;
  const isEntryLoading = source?.type === 'entry' && !entryResolvedSql;
  const isDataLoading = (source?.type === 'data' || source?.type === 'arrow') && !registered;

  if (isEntryLoading) {
    return { sql: null, entry, loading: true, loadingMessage: 'waiting for data...' };
  }

  if (isDataLoading) {
    return { sql: null, loading: true, loadingMessage: 'registering data...' };
  }

  const sql = source?.type === 'sql'
    ? source.sql
    : source?.type === 'entry'
      ? entryResolvedSql
      : registered?.sql ?? null;

  const params = source?.type === 'sql' ? source.params : registered?.params;

  return { sql: sql ?? null, params, entry, loading: false };
}
