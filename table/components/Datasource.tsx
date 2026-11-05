import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useSql, type QueryRef } from '../../react/reducks';
import { buildWhereClause, escapeSQL, type FiltersState } from '../../sqlUtils';

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
  columnTypes?: Record<string, string>;
};

export type QueryParts = { tableRef: QueryRef; filteredRef: QueryRef };

export function useQueryParts({ tableRef, globalFilter, columnFilters, fieldNames, columnTypes }: QueryBase): QueryParts {
  const { whereClause } = buildWhereClause({
    globalFilter,
    fieldNamesForGlobal: globalFilter.trim() ? fieldNames : [],
    columnFilters,
    columnTypes,
  });
  const filteredRef = useSql((t) => `SELECT * FROM ${t.base}${whereClause}`, { base: tableRef });
  return { tableRef, filteredRef };
}

export function useTableSchema(tableRef: QueryRef | null) {
  const schemaRef = useSql((t) => `SELECT * FROM ${t.base} LIMIT 0`, { base: tableRef });

  return useQuery({
    queryKey: ['reducks-schema', schemaRef.id],
    queryFn: async () => {
      const table = await schemaRef.arrowTable();
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

const quoteColumn = (name: string) => `"${name.replaceAll('"', '""')}"`;

// DuckDB 2.0 binds COLUMNS(*) ~35x slower than 1.5 and evaluates it wrongly inside FILTER, so each column is spelled out.
function perColumnStats(fieldNames: string[], fields: (column: string) => string, base: string) {
  const items = fieldNames.map((name) => `{ name: ${escapeSQL(name)}, ${fields(quoteColumn(name))} }`).join(',\n      ');
  return `SELECT * FROM (
    SELECT unnest(m, recursive := true) FROM (SELECT [
      ${items}
    ] AS m FROM ${base})
  )
  ORDER BY name`;
}

export function useColumnSummaries(tableRef: QueryRef | null, fieldNames: string[]) {
  const stackedRef = useSql(
    (t) =>
      perColumnStats(
        fieldNames,
        (c) => `type: first(typeof(${c}))::VARCHAR,
        uniq: approx_count_distinct(${c})::BIGINT,
        nulls: (count(*) - count(${c}))::BIGINT,
        total: count(*)::BIGINT`,
        `${t.base}`
      ),
    { base: tableRef }
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
    enabled: fieldNames.length > 0 && !!tableRef && tableRef.status !== 'pending',
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useColumnSizes(tableRef: QueryRef | null, fieldNames: string[], opts?: { enabled?: boolean }) {
  const sampleRef = useSql((t) => `SELECT * FROM ${t.base} USING SAMPLE 1000`, { base: tableRef });

  const sizesRef = useSql(
    (t) =>
      perColumnStats(
        fieldNames,
        (c) => `p80Len: coalesce(quantile_cont(length(CAST(${c} AS VARCHAR)), 0.8) FILTER (WHERE ${c} IS NOT NULL AND length(CAST(${c} AS VARCHAR)) > 0), 0)::INT`,
        `${t.sample}`
      ),
    { sample: sampleRef }
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
    enabled: opts?.enabled !== false && fieldNames.length > 0 && !!tableRef && tableRef.status !== 'pending',
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useColumnDescribe(tableRef: QueryRef | null, fieldNames: string[]) {
  const describeRef = useSql(
    (t) =>
      perColumnStats(
        fieldNames,
        (c) => `empty_count: (COUNT(*) FILTER (WHERE ${c} IS NOT NULL AND length(trim(CAST(${c} AS VARCHAR))) = 0))::BIGINT`,
        `${t.base}`
      ),
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
    enabled: fieldNames.length > 0 && !!tableRef && tableRef.status !== 'pending',
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
