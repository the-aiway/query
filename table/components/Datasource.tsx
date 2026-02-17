import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Vector } from 'apache-arrow';

import { normalizeSelectSql, buildWhereClause, quoteIdent, type FiltersState } from './sqlUtils';
import { useDuckDB } from '../../react/DuckDBProvider';

export type SortingState = Array<{ id: string; desc: boolean }>;
export type ColumnOption = { key: string; label: string; count: number; frac: number };
export type ColumnSummary = { name: string; type: string; uniq: number; nulls: number; total: number };
export type ColumnSize = { name: string; p80Len: number };

type QueryBase = { sql: string; params?: unknown[]; globalFilter: string; columnFilters: FiltersState };

export type QueryParts = { baseSql: string; whereClause: string; params: unknown[] };

export function useQueryParts({ sql, params, globalFilter, columnFilters, fieldNames }: QueryBase & { fieldNames: string[] }): QueryParts {
  const baseSql = normalizeSelectSql(sql);
  const { whereClause } = buildWhereClause({
    globalFilter,
    fieldNamesForGlobal: globalFilter.trim() ? fieldNames : [],
    columnFilters,
  });
  return { baseSql, whereClause, params: params ?? [] };
}

export function useTableSchema(opts: QueryBase) {
  const { pool } = useDuckDB();
  const { baseSql } = useQueryParts({ ...opts, fieldNames: [] });

  return useQuery({
    queryKey: ['duckdb', 'schema', baseSql, opts.params],
    queryFn: async () => {
      const t = await pool.queryIPCTable(`WITH base AS (${baseSql}) SELECT * FROM base LIMIT 0`, opts.params);
      return t.schema.fields.map((f) => ({
        name: f.name,
        type: String(f.type as unknown as string).toUpperCase(),
        fields: f.type.children?.map((c: { name: string; type: string }) => ({ name: c.name, type: String(c.type).toUpperCase() })),
      }));
    },
    enabled: !!baseSql,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTableCount(opts: QueryBase) {
  const { pool } = useDuckDB();
  const parts = useQueryParts({ ...opts, fieldNames: [] });

  return useQuery({
    queryKey: ['duckdb', 'count', parts.baseSql, parts.whereClause, parts.params],
    queryFn: async () => {
      const rows = await pool.query(`WITH base AS (${parts.baseSql}) SELECT COUNT(*)::BIGINT as c FROM base ${parts.whereClause}`, parts.params);
      return Number(rows[0]?.c ?? 0);
    },
    enabled: !!parts.baseSql,
    placeholderData: keepPreviousData,
  });
}

export function useColumnSummaries(opts: QueryBase) {
  const { pool } = useDuckDB();
  const baseSql = normalizeSelectSql(opts.sql);

  return useQuery({
    queryKey: ['duckdb', 'col-summaries', baseSql, opts.params],
    queryFn: async () => {
      const rows = await pool.dump(
        `--sql
        WITH base AS (${baseSql}),
        metrics AS (
          SELECT { 
            name: any_value(alias(COLUMNS(*))),
            type: first(typeof(COLUMNS(*)))::VARCHAR,
            uniq: approx_count_distinct(COLUMNS(*))::BIGINT,
            nulls: (count(*) - count(COLUMNS(*)))::BIGINT,
            total: count(*)::BIGINT
          } AS "m_\\0"
          FROM base
        ),
        stacked AS (UNPIVOT metrics ON COLUMNS(*) INTO NAME _col VALUE value)
        SELECT value.name AS name,
        value.type AS type,
        value.uniq AS uniq,
        value.nulls AS nulls,
        value.total AS total FROM stacked ORDER BY name
      `,
        opts.params ?? []
      );
      return rows.map(
        (r): ColumnSummary => ({
          name: String(r.name),
          type: String(r.type),
          uniq: Number(r.uniq ?? 0),
          nulls: Number(r.nulls ?? 0),
          total: Number(r.total ?? 0),
        })
      );
    },
    enabled: !!baseSql,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useColumnSizes(opts: QueryBase) {
  const { pool } = useDuckDB();
  const baseSql = normalizeSelectSql(opts.sql);

  return useQuery({
    queryKey: ['duckdb', 'col-sizes', baseSql, opts.params],
    queryFn: async () => {
      const rows = await pool.dump(
        `--sql
        WITH base AS (${baseSql}),
        sample AS (SELECT * FROM base USING SAMPLE 1000),
        metrics AS (
          SELECT
          {
            name: any_value(alias(COLUMNS(*))),
            p80Len: coalesce(quantile_cont(length(CAST(COLUMNS(*) AS VARCHAR)), 0.8) FILTER (WHERE COLUMNS(*) IS NOT NULL AND length(CAST(COLUMNS(*) AS VARCHAR)) > 0), 0)::INT
          } AS "m_\\0"
          FROM sample
        ),
        stacked AS (
          UNPIVOT metrics ON COLUMNS(*)
          INTO NAME _col VALUE value
        )
        SELECT
        value.name AS name,
        value.p80Len AS p80Len
        FROM stacked
        ORDER BY name
      `,
        opts.params ?? []
      );
      return rows.map(
        (r): ColumnSize => ({
          name: String(r.name),
          p80Len: Number(r.p80Len ?? 0),
        })
      );
    },
    enabled: !!baseSql,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function getTableDataPageQueryOptions(pool: ReturnType<typeof useDuckDB>['pool'], parts: QueryParts | null, sorting: SortingState, limit: number, offset: number) {
  const orderClause = sorting.length > 0 ? `\nORDER BY ${sorting.map((s) => `${quoteIdent(s.id)} ${s.desc ? 'DESC' : 'ASC'} NULLS LAST`).join(', ')}` : '';

  return {
    queryKey: ['duckdb', 'data', parts?.baseSql, parts?.whereClause, parts?.params, sorting, limit, offset],
    queryFn: async () => {
      if (!parts) return null;
      const t = await pool.queryIPCTable(
        `--sql
        WITH base AS (${parts.baseSql})
        SELECT * FROM base ${parts.whereClause} ${orderClause}
        LIMIT ${limit}
        OFFSET ${offset}`,
        parts.params
      );
      const vectors = new Map<string, Vector>();
      for (let i = 0; i < t.schema.fields.length; i++) {
        const f = t.schema.fields[i];
        const v = t.getChildAt(i);
        if (f && v) vectors.set(f.name, v as unknown as Vector);
      }
      return { vectors, rowCount: t.numRows };
    },
    enabled: !!parts,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  };
}
