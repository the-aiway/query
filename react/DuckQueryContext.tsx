import { Table } from 'apache-arrow';
import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';

export type TableEntry = {
  name: string;
  table: Table;
  hash: string;
};

export type DuckQueryContextValue = {
  tables: Map<string, TableEntry>;
  files: Map<string, string>;
  registerTable: (entry: TableEntry) => void;
  registerFile: (name: string, url: string) => void;
};

export const DuckQueryContext = createContext<DuckQueryContextValue | null>(null);

export function useDuckQueryContext() {
  const context = useContext(DuckQueryContext);
  if (!context) {
    throw new Error('useDuckQuery must be used within a DuckQueryProvider');
  }
  return context;
}

export function DuckQueryProvider({ children }: { children: React.ReactNode }) {
  // We use refs + forceUpdate pattern or just a stable object that mutates?
  // Since we want suspense query to drive the data, the Context is mostly for
  // *discovery* of available tables for consumers.
  //
  // However, simple mutations won't trigger re-renders in consumers using the context.
  // BUT: consumers like `useSql` will depend on the *data*, which comes from `useQuery`.
  // The Context here is primarily a registry so `useSql` knows what table names exist
  // and can look up their hashes to form its own query key.

  const [tables, setTables] = useState<Map<string, TableEntry>>(() => new Map());
  const [files, setFiles] = useState<Map<string, string>>(() => new Map());

  // We need to notify listeners when the registry changes?
  // `useSql` needs to know if a table it depends on (by name) has changed hash.
  // Actually, `useSql` takes `deps` as ArrowTable objects (from `useTable`).
  // So the explicit dependency graph handles the "re-render" part.

  // The global context is useful for debugging and perhaps implicit lookups later.
  // For now, let's keep it simple.

  const registerTable = useCallback((entry: TableEntry) => {
    setTables((prev) => {
      const existing = prev.get(entry.name);
      if (existing && existing.hash === entry.hash) return prev;
      const next = new Map(prev);
      next.set(entry.name, entry);
      return next;
    });
  }, []);

  const registerFile = useCallback((name: string, url: string) => {
    setFiles((prev) => {
      const existing = prev.get(name);
      if (existing === url) return prev;
      const next = new Map(prev);
      next.set(name, url);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      tables,
      files,
      registerTable,
      registerFile,
    }),
    [tables, files, registerTable, registerFile]
  );

  return createElement(DuckQueryContext.Provider, { value }, children);
}
