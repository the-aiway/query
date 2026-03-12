import { Table } from 'apache-arrow';
import React, { useMemo, useRef } from 'react';

import { DataTable, tableInputToRef } from './DataTable';
import { type QueryTableProps, type QueryTableSourceMap } from './components/QueryTableContext';
import { type QueryRef } from '../react/reducks';

type QueryTableInputProps = QueryTableProps & {
  sql?: string;
};

function isNamedSourceMap(input: QueryTableProps['table']): input is QueryTableSourceMap {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input instanceof Table) return false;
  return !('type' in input);
}

export function QueryTable({ sql: sqlInput, id, table: tableInput, height, compact = true, rowHeight, overscan = 12, ...props }: QueryTableInputProps) {
  const effectiveTableInput = sqlInput ?? tableInput;
  const effectiveRowHeight = rowHeight ?? (compact ? 24 : 28);
  const sourceMap = isNamedSourceMap(effectiveTableInput) ? effectiveTableInput : null;
  const arrowRefCache = useRef(new Map<object, QueryRef>());
  const generatedIdRef = useRef(`qt_${Math.random().toString(36).slice(2, 10)}`);

  const ref = useMemo(() => {
    if (sourceMap) {
      const entries = Object.entries(sourceMap)
        .map(([key, entry]) => {
          const r = tableInputToRef(entry as QueryRef | null | undefined, arrowRefCache.current);
          if (r) r.ensureName(key);
          return r;
        })
        .filter(Boolean)[0];
      return entries;
    }
    const r = tableInputToRef(effectiveTableInput as QueryRef | null | undefined, arrowRefCache.current);
    if (!r) return null;
    const key = id ?? generatedIdRef.current;
    if (!r.name) r.ensureName(key);
    return r;
  }, [sourceMap, effectiveTableInput, id]);

  const tableId = id ?? ref?.name ?? generatedIdRef.current;

  if (!ref) return null;

  return (
    <DataTable
      id={tableId}
      table={ref}
      height={height}
      rowHeight={effectiveRowHeight}
      overscan={overscan}
      compact={compact}
      {...props}
    />
  );
}

export default QueryTable;
