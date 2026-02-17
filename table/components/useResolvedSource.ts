import { useEffect, useMemo, useRef, useState } from 'react';
import { tableFromJSON, Table } from 'apache-arrow';
import { type QueryRef, needsMaterialization, materializeChain, tablePath } from '../../react/reducks';
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

  const depsReady = !isQueryRef(tableInput) || !needsMaterialization(tableInput);
  const [materializingDeps, setMaterializingDeps] = useState(false);

  useEffect(() => {
    if (!isQueryRef(tableInput) || depsReady) return;
    let alive = true;
    setMaterializingDeps(true);
    materializeChain(tableInput, pool)
      .finally(() => { if (alive) setMaterializingDeps(false); });
    return () => { alive = false; };
  }, [tableInput, depsReady, pool]);

  const tableRefSql = useMemo(() => {
    if (!isQueryRef(tableInput)) return null;
    if (tableInput._status !== 'ready') return null;
    if (tableInput._type === 'table') {
      return `SELECT * FROM '${tablePath(tableInput)}'`;
    }
    return null;
  }, [tableInput]);

  const sqlToMaterialize = useMemo(() => {
    if (typeof tableInput === 'string' && tableInput.trim()) {
      return normalizeSelectSql(tableInput);
    }
    if (isQueryRef(tableInput) && tableInput._type === 'fragment' && depsReady) {
      return tableInput._query;
    }
    return null;
  }, [tableInput, depsReady]);

  const [materialized, setMaterialized] = useState<{ baseSql: string } | null>(null);

  useEffect(() => {
    if (!sqlToMaterialize) {
      setMaterialized(null);
      return;
    }

    let cancelled = false;
    const name = getNextTableName();
    const path = `opfs://${name}.parquet`;

    (async () => {
      try {
        await pool.db.registerOPFSFileName(path);
        await pool.queryIPCTable(`COPY (${sqlToMaterialize}) TO '${path}' (FORMAT PARQUET)`);
        if (!cancelled) {
          setMaterialized({ baseSql: `SELECT * FROM '${path}'` });
        }
      } catch (err) {
        console.error('[QueryTable] Materialization failed, using raw SQL:', err);
        if (!cancelled) {
          setMaterialized({ baseSql: sqlToMaterialize });
        }
      }
    })();

    return () => {
      cancelled = true;
      pool.db.dropFile(path).catch(() => {});
    };
  }, [sqlToMaterialize, pool]);

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

  const depsPending = isQueryRef(tableInput) && (!depsReady || materializingDeps);

  if (isQueryRef(tableInput) && tableInput._status !== 'ready' && !depsPending) {
    return { sql: null, originalSql: null, entry, loading: true, loadingMessage: 'waiting for data...' };
  }

  if (depsPending) {
    if (lastGood.current) return { ...lastGood.current, entry, refreshing: true };
    return { sql: null, originalSql: null, entry, loading: true, loadingMessage: 'materializing dependencies...' };
  }

  let result: ResolvedSource;

  if (tableRefSql) {
    result = { sql: tableRefSql, originalSql, entry, loading: false };
  } else if (sqlToMaterialize) {
    if (!materialized) {
      if (lastGood.current) return { ...lastGood.current, entry, refreshing: true };
      result = { sql: null, originalSql, entry, loading: true, loadingMessage: 'Fetching Data...' };
    } else {
      result = { sql: materialized.baseSql, originalSql, entry, loading: false };
    }
  } else if (Array.isArray(tableInput) || tableInput instanceof Table) {
    if (!registered) {
      result = { sql: null, originalSql: null, loading: true, loadingMessage: 'registering data...' };
    } else {
      result = { sql: registered.sql, originalSql: registered.sql, loading: false };
    }
  } else {
    result = { sql: null, originalSql: null, loading: false };
  }

  if (result.sql) lastGood.current = result;
  return result;
}
