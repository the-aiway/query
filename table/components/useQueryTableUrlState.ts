import { createSerializer, parseAsJson, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useMemo, useRef } from 'react';

import type { FiltersState, FilterValue } from './sqlUtils';

type SortItem = { id: string; desc: boolean };

const parsers = {
  sort: parseAsJson<SortItem[]>((v) => {
    if (!Array.isArray(v)) return [];
    return v.filter(
      (item): item is SortItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.desc === 'boolean',
    );
  }).withDefault([]),
  q: parseAsString.withDefault(''),
  cf: parseAsJson<FiltersState>((v) => {
    if (!v || typeof v !== 'object') return {};
    const result: FiltersState = {};
    for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
      if (val && typeof val === 'object' && 'type' in val) {
        const f = val as Record<string, unknown>;
        if (f.type === 'set' && Array.isArray(f.values)) {
          result[key] = { type: 'set', values: f.values.filter((v): v is string => typeof v === 'string') };
        } else if (f.type === 'range' && typeof f.min === 'number' && typeof f.max === 'number') {
          result[key] = { type: 'range', min: f.min, max: f.max };
        }
      }
    }
    return result;
  }).withDefault({}),
};

export function useQueryTableUrlState(prefix = 'qt') {
  const prefixedParsers = useMemo(() => {
    const result: Record<string, (typeof parsers)[keyof typeof parsers]> = {};
    for (const [key, parser] of Object.entries(parsers)) {
      result[`${prefix}_${key}`] = parser;
    }
    return result as {
      [K in `${typeof prefix}_sort`]: typeof parsers.sort;
    } & {
      [K in `${typeof prefix}_q`]: typeof parsers.q;
    } & {
      [K in `${typeof prefix}_cf`]: typeof parsers.cf;
    };
  }, [prefix]);

  const [raw, setRaw] = useQueryStates(prefixedParsers, {
    history: 'replace',
  });

  const sortKey = `${prefix}_sort` as const;
  const qKey = `${prefix}_q` as const;
  const cfKey = `${prefix}_cf` as const;

  const sorting = (raw as Record<string, unknown>)[sortKey] as SortItem[];
  const globalFilter = (raw as Record<string, unknown>)[qKey] as string;
  const columnFilters = (raw as Record<string, unknown>)[cfKey] as FiltersState;

  const setSorting = useCallback(
    (updater: SortItem[] | ((prev: SortItem[]) => SortItem[])) => {
      void setRaw((prev) => {
        const prevSort = (prev as Record<string, unknown>)[sortKey] as SortItem[];
        const next = typeof updater === 'function' ? updater(prevSort) : updater;
        return { ...prev, [sortKey]: next.length > 0 ? next : null } as typeof prev;
      });
    },
    [setRaw, sortKey],
  );

  const setGlobalFilter = useCallback(
    (v: string) => {
      void setRaw((prev) => ({ ...prev, [qKey]: v || null } as typeof prev));
    },
    [setRaw, qKey],
  );

  const setColumnFilters = useCallback(
    (updater: FiltersState | ((prev: FiltersState) => FiltersState)) => {
      void setRaw((prev) => {
        const prevCf = (prev as Record<string, unknown>)[cfKey] as FiltersState;
        const next = typeof updater === 'function' ? updater(prevCf) : updater;
        const hasEntries = Object.keys(next).length > 0;
        return { ...prev, [cfKey]: hasEntries ? next : null } as typeof prev;
      });
    },
    [setRaw, cfKey],
  );

  const onClearCol = useCallback(
    (col: string) => {
      setColumnFilters((prev) => {
        const next = { ...prev };
        delete next[col];
        return next;
      });
    },
    [setColumnFilters],
  );

  const onChangeFilter = useCallback(
    (col: string, next: FilterValue | undefined) => {
      setColumnFilters((prev) => {
        const nextState = { ...prev };
        if (!next) delete nextState[col];
        else nextState[col] = next;
        return nextState;
      });
    },
    [setColumnFilters],
  );

  const clearAllFilters = useCallback(() => {
    void setRaw((prev) => ({
      ...prev,
      [cfKey]: null,
      [qKey]: null,
    } as typeof prev));
  }, [setRaw, cfKey, qKey]);

  const resetAll = useCallback(() => {
    void setRaw((prev) => ({
      ...prev,
      [sortKey]: null,
      [qKey]: null,
      [cfKey]: null,
    } as typeof prev));
  }, [setRaw, sortKey, qKey, cfKey]);

  return {
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilters,
    onClearCol,
    onChangeFilter,
    clearAllFilters,
    resetAll,
  };
}
