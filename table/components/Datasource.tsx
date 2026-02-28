import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { buildWhereClause, type FiltersState } from '../../sqlUtils';
import { useSql, type QueryRef } from '../../react/reducks';

export type SortingState = Array<{ id: string; desc: boolean }>;
export type ColumnOption = { key: string; label: string; count: number; frac: number };
export type ColumnSummary = {
  name: string;
  type: string;
  uniq: number;
  nulls: number;
  total: number;
};
export type ColumnSize = { name: string; p80Len: number };
export type ColumnDescribe = { name: string; emptyCount: number };

type QueryBase = {
  tableRef: QueryRef;
  globalFilter: string;
  columnFilters: FiltersState;
  fieldNames: string[];
};

export type QueryParts = { tableRef: QueryRef; filteredRef: QueryRef };

export function useQueryParts({ tableRef, globalFilter, columnFilters, fieldNames }: QueryBase): QueryParts {
  const { whereClause } = buildWhereClause({
    globalFilter,
    fieldNamesForGlobal: globalFilter.trim() ? fieldNames : [],
    columnFilters,
  });
  const filteredRef = useSql((t) => `SELECT * FROM ${t.base}${whereClause}`, { base: tableRef });
  return { tableRef, filteredRef };
}

export function useTableSchema(tableRef: QueryRef | null) {
  const schemaRef = useSql((t) => `SELECT * FROM ${t.base} LIMIT 0`, { base: tableRef });

  return useQuery({
    queryKey: ['reducks-schema', schemaRef.id],
    queryFn: async () => {
      const table = await schemaRef.toArrow();
      return table.schema.fields.map((f) => ({
        name: f.name,
        type: String(f.type as unknown as string).toUpperCase(),
        fields: f.type.children?.map((c: { name: string; type: string }) => ({
          name: c.name,
          type: String(c.type).toUpperCase(),
        })),
      }));
    },
    enabled: !!tableRef && tableRef.status !== 'pending',
    staleTime: 5 * 60 * 1000,
  });
}

export function useTableCount(filteredRef: QueryRef) {
  const countRef = useSql(
    (t) => `SELECT COUNT(*)::BIGINT as c
      FROM ${t.base}`,
    { base: filteredRef }
  );

  return useQuery({
    queryKey: ['reducks-count', countRef.id],
    queryFn: async () => {
      const row = await countRef.row();
      return Number(row?.c ?? 0);
    },
    enabled: filteredRef.status !== 'pending',
    placeholderData: keepPreviousData,
  });
}

export function useColumnSummaries(tableRef: QueryRef | null) {
  const metricsRef = useSql(
    (t) => `SELECT {
      name: any_value(alias(COLUMNS(*))),
      type: first(typeof(COLUMNS(*)))::VARCHAR,
      uniq: approx_count_distinct(COLUMNS(*))::BIGINT,
      nulls: (count(*) - count(COLUMNS(*)))::BIGINT,
      total: count(*)::BIGINT
    } AS "m_\\0"
    FROM ${t.base}`,
    { base: tableRef }
  );

  const stackedRef = useSql(
    (t) => `SELECT value.name AS name,
      value.type AS type,
      value.uniq AS uniq,
      value.nulls AS nulls,
      value.total AS total
    FROM (UNPIVOT ${t.metrics} ON COLUMNS(*) INTO NAME _col VALUE value)
    ORDER BY name`,
    { metrics: metricsRef }
  );

  return useQuery({
    queryKey: ['reducks-summaries', stackedRef.id],
    queryFn: async () => {
      const rows = await stackedRef.toArray();
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
    enabled: !!tableRef && tableRef.status !== 'pending',
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useColumnSizes(tableRef: QueryRef | null, opts?: { enabled?: boolean }) {
  const sampleRef = useSql((t) => `SELECT * FROM ${t.base} USING SAMPLE 1000`, { base: tableRef });

  const metricsRef = useSql(
    (t) => `SELECT {
      name: any_value(alias(COLUMNS(*))),
      p80Len: coalesce(quantile_cont(length(CAST(COLUMNS(*) AS VARCHAR)), 0.8) FILTER (WHERE COLUMNS(*) IS NOT NULL AND length(CAST(COLUMNS(*) AS VARCHAR)) > 0), 0)::INT
    } AS "m_\\0"
    FROM ${t.sample}`,
    { sample: sampleRef }
  );

  const sizesRef = useSql(
    (t) => `SELECT value.name AS name,
      value.p80Len AS p80Len
    FROM (UNPIVOT ${t.metrics} ON COLUMNS(*) INTO NAME _col VALUE value)
    ORDER BY name`,
    { metrics: metricsRef }
  );

  return useQuery({
    queryKey: ['reducks-sizes', sizesRef.id],
    queryFn: async () => {
      const rows = await sizesRef.toArray();
      return rows.map(
        (r): ColumnSize => ({
          name: String(r.name),
          p80Len: Number(r.p80Len ?? 0),
        })
      );
    },
    enabled: opts?.enabled !== false && !!tableRef && tableRef.status !== 'pending',
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useColumnDescribe(tableRef: QueryRef | null) {
  const describeRef = useSql(
    (t) => `SELECT
      value.name AS name,
      value.empty_count AS empty_count
    FROM (
      UNPIVOT (
        SELECT {
          name: any_value(alias(COLUMNS(*))),
          empty_count: (
            COUNT(*) FILTER (
              WHERE COLUMNS(*) IS NOT NULL
                AND length(trim(CAST(COLUMNS(*) AS VARCHAR))) = 0
            )
          )::BIGINT
        } AS "m_\\0"
        FROM ${t.base}
      ) ON COLUMNS(*) INTO NAME _col VALUE value
    )
    ORDER BY name`,
    { base: tableRef }
  );

  return useQuery({
    queryKey: ['reducks-describe', describeRef.id],
    queryFn: async () => {
      const rows = await describeRef.toArray();
      return rows.map(
        (r): ColumnDescribe => ({
          name: String(r.name),
          emptyCount: Number(r.empty_count ?? 0),
        })
      );
    },
    enabled: !!tableRef && tableRef.status !== 'pending',
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
