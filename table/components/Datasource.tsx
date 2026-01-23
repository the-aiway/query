import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Vector } from 'apache-arrow';

import { normalizeSelectSql, buildWhereClause, quoteIdent, type FiltersState } from './sqlUtils';

import { useDuckDB } from '../../duck/DuckDBProvider';

export type SortingState = Array<{ id: string; desc: boolean }>;

export type ColumnOption = {
  key: string;
  label: string;
  count: number;
  frac: number;
};

export type ColumnSummary = {
  name: string;
  type: string;
  uniq: number;
  nulls: number;
  total: number;
};

export type ColumnSize = {
  name: string;
  p80Len: number;
};

type QueryBase = {
  sql: string;
  params?: unknown[];
  globalFilter: string;
  setFilters: FiltersState;
};

export type QueryParts = {
  baseSql: string;
  whereClause: string;
  fullParams: unknown[];
};

// 1. Hook to build query parts (used by components to drive other queries)
export function useQueryParts({
  sql,
  params,
  globalFilter,
  setFilters,
  fieldNames,
}: QueryBase & { fieldNames: string[] }) {
  const normalizedSql = normalizeSelectSql(sql);
  const gfActive = globalFilter.trim().length > 0;
  const fieldNamesForGlobal = gfActive ? fieldNames : [];

  const { whereClause, whereParams } = buildWhereClause({
    globalFilter,
    fieldNamesForGlobal,
    setFilters,
  });

  const fullParams = [...(params ?? []), ...whereParams];

  return { baseSql: normalizedSql, whereClause, fullParams };
}

// 2. Fetch Schema
export function useTableSchema(opts: QueryBase) {
  const { pool } = useDuckDB();
  const parts = useQueryParts({ ...opts, fieldNames: [] });

  return useQuery({
    queryKey: ['duckdb', 'schema', parts.baseSql, opts.params],
    queryFn: async () => {
      const q = `WITH base AS (${parts.baseSql}) SELECT * FROM base LIMIT 0`;
      const t = await pool.queryIPCTable(q, opts.params);
      return t.schema.fields.map((f) => {
        const typeStr = String(f.type as unknown as string).toUpperCase();
        const fields = f.type.children?.map((c: { name: string; type: string }) => ({
          name: c.name,
          type: String(c.type).toUpperCase(),
        }));
        return {
          name: f.name,
          type: typeStr,
          fields,
        };
      });
    },
    enabled: !!parts.baseSql,
    staleTime: 5 * 60 * 1000,
  });
}

// 3. Fetch Count
export function useTableCount(opts: QueryBase) {
  const { pool } = useDuckDB();
  const parts = useQueryParts({ ...opts, fieldNames: [] });

  return useQuery({
    queryKey: ['duckdb', 'count', parts.baseSql, parts.fullParams],
    queryFn: async () => {
      const q = `
        WITH base AS (${parts.baseSql})
        SELECT COUNT(*)::BIGINT as c 
        FROM base
        ${parts.whereClause}
      ` as const;
      const rows = await pool.query(q, parts.fullParams);
      return Number(rows[0]?.c ?? 0);
    },
    enabled: !!parts.baseSql,
    placeholderData: keepPreviousData,
  });
}

// 3b. Fetch Column Summaries (uniq, nulls, total)
export function useColumnSummaries(opts: QueryBase) {
  const { pool } = useDuckDB();
  const parts = useQueryParts({ ...opts, fieldNames: [] });

  return useQuery({
    queryKey: ['duckdb', 'col-summaries', parts.baseSql, parts.fullParams],
    queryFn: async () => {
      const rows = await pool.dump(`--sql
      
        WITH base AS (${parts.baseSql}),
        base_filtered AS (SELECT * FROM base${parts.whereClause}),
        metrics AS (
          SELECT
            {
              name: any_value(alias(COLUMNS(*))),
              type: first(typeof(COLUMNS(*)))::VARCHAR,
              uniq: approx_count_distinct(COLUMNS(*))::BIGINT,
              nulls: (count(*) - count(COLUMNS(*)))::BIGINT,
              total: count(*)::BIGINT
            } AS "m_\\0"
          FROM base_filtered
        ),
        stacked AS (
          UNPIVOT metrics ON COLUMNS(*)
          INTO NAME _col VALUE value
        )
        SELECT
          value.name AS name,
          value.type AS type,
          value.uniq AS uniq,
          value.nulls AS nulls,
          value.total AS total
        FROM stacked
        ORDER BY name
      `);

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
    enabled: !!parts.baseSql,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// 3c. Fetch Column Sizes (p80Len using sample)
export function useColumnSizes(opts: QueryBase) {
  const { pool } = useDuckDB();
  const parts = useQueryParts({ ...opts, fieldNames: [] });

  return useQuery({
    queryKey: ['duckdb', 'col-sizes', parts.baseSql, parts.fullParams],
    queryFn: async () => {
      const rows = await pool.dump(`--sql
        WITH base AS (${parts.baseSql}),
        base_filtered AS (SELECT * FROM base${parts.whereClause}),
        sample AS (SELECT * FROM base_filtered USING SAMPLE 1000),
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
      `);

      return rows.map(
        (r): ColumnSize => ({
          name: String(r.name),
          p80Len: Number(r.p80Len ?? 0),
        })
      );
    },
    enabled: !!parts.baseSql,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// 4. Helper for Page Query Options
export function getTableDataPageQueryOptions(
  pool: ReturnType<typeof useDuckDB>['pool'],
  parts: QueryParts | null,
  sorting: SortingState,
  limit: number,
  offset: number
) {
  return {
    queryKey: ['duckdb', 'data', parts?.baseSql, parts?.fullParams, sorting, limit, offset],
    queryFn: async () => {
      if (!parts) return null;

      const orderClause =
        sorting.length > 0
          ? `\nORDER BY ${sorting.map((s) => `${quoteIdent(s.id)} ${s.desc ? 'DESC' : 'ASC'} NULLS LAST`).join(', ')}`
          : '';

      const q = `
        WITH base AS (${parts.baseSql})
        SELECT *
        FROM base
        ${parts.whereClause}
        ${orderClause}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const t = await pool.queryIPCTable(q, parts.fullParams);

      const nextVectors = new Map<string, Vector>();
      for (let i = 0; i < t.schema.fields.length; i++) {
        const f = t.schema.fields[i];
        const v = t.getChildAt(i);
        if (f && v) nextVectors.set(f.name, v as unknown as Vector);
      }

      return {
        vectors: nextVectors,
        rowCount: t.numRows,
      };
    },
    enabled: !!parts,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  };
}
