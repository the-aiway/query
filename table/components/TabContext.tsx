import React, { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { type SortingState, type ColumnSizingState, type VisibilityState, type ColumnPinningState } from '@tanstack/react-table';
import { type QueryRef } from '../../react/reducks';
import { type FiltersState } from './sqlUtils';

type CustomSqlTab = {
  id: string;
  label: string;
  sql: string;
  createdAt: number;
};

type PreviewState = {
  label: string;
  source: QueryRef | null;
  sql: string | null;
  nonce: number;
};

type SourceTab = {
  id: string;
  label: string;
  type: 'source';
  source: QueryRef | null;
};

type CustomTab = {
  id: string;
  label: string;
  type: 'custom';
  sql: string;
};

type Tab = SourceTab | CustomTab;

type TableState = {
  sorting: SortingState;
  columnFilters: FiltersState;
  globalFilter: string;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;
  columnPinning: ColumnPinningState;
  openFilterCol: string | null;
  filterSearch: string;
  isSearchExpanded: boolean;
  isFullscreen: boolean;
};

type TabContextValue = {
  tabs: Tab[];
  activeTabId: string | null;
  activeTab: Tab | undefined;
  preview: PreviewState | null;
  
  setActiveTabId: (id: string) => void;
  createCustomTab: (sql: string) => void;
  setPreviewRef: (source: QueryRef, label: string) => void;
  setPreviewSql: (sql: string, label: string) => void;
  clearPreview: () => void;
  updateCustomTab: (tabId: string, sql: string) => void;
  deleteCustomTab: (tabId: string) => void;
  
  onSqlEdit: (sql: string) => void;
  
  tableState: TableState;
  setTableState: <K extends keyof TableState>(key: K, value: TableState[K]) => void;
  resetTableState: () => void;
};

const TabContext = createContext<TabContextValue | null>(null);

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) {
    throw new Error('useTab must be used within TabProvider');
  }
  return ctx;
}

const createDefaultTableState = (): TableState => ({
  sorting: [],
  columnFilters: {},
  globalFilter: '',
  columnSizing: {},
  columnVisibility: {},
  columnPinning: {},
  openFilterCol: null,
  filterSearch: '',
  isSearchExpanded: false,
  isFullscreen: false,
});

type TabProviderProps = {
  children: ReactNode;
  sourceTabs: Array<{ key: string; ref: QueryRef | null }>;
};

export function TabProvider({ children, sourceTabs }: TabProviderProps) {
  const [customTabs, setCustomTabs] = useState<CustomSqlTab[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [tableStateByTab, setTableStateByTab] = useState<Record<string, TableState>>({});
  const nonceRef = useRef(0);

  const tabs = useMemo<Tab[]>(() => {
    const result: Tab[] = [];
    
    for (const { key, ref } of sourceTabs) {
      result.push({
        id: `source:${key}`,
        label: key,
        type: 'source',
        source: ref,
      });
    }
    
    for (const tab of customTabs) {
      result.push({
        id: `custom:${tab.id}`,
        label: tab.label,
        type: 'custom',
        sql: tab.sql,
      });
    }
    
    return result;
  }, [sourceTabs, customTabs]);

  const activeTabId = tabs.some((t) => t.id === selectedTabId)
    ? selectedTabId
    : (tabs[0]?.id ?? null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const tableState = useMemo<TableState>(() => {
    if (!activeTabId) return createDefaultTableState();
    return tableStateByTab[activeTabId] ?? createDefaultTableState();
  }, [activeTabId, tableStateByTab]);

  const setActiveTabId = useCallback((id: string) => {
    setSelectedTabId(id);
    setPreview(null);
  }, []);

  const createCustomTab = useCallback((sql: string) => {
    const newTab: CustomSqlTab = {
      id: Date.now().toString(),
      label: `Custom SQL ${customTabs.length + 1}`,
      sql,
      createdAt: Date.now(),
    };
    setCustomTabs((prev) => [...prev, newTab]);
    setSelectedTabId(`custom:${newTab.id}`);
  }, [customTabs.length]);

  const setPreviewRef = useCallback((source: QueryRef, label: string) => {
    setPreview({ label, source, sql: null, nonce: ++nonceRef.current });
  }, []);

  const setPreviewSql = useCallback((sql: string, label: string) => {
    setPreview({ label, source: null, sql, nonce: ++nonceRef.current });
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const updateCustomTab = useCallback((tabId: string, sql: string) => {
    setCustomTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, sql } : t)));
  }, []);

  const deleteCustomTab = useCallback((tabId: string) => {
    setCustomTabs((prev) => prev.filter((t) => t.id !== tabId));
    const deletedId = `custom:${tabId}`;
    setTableStateByTab((prev) => {
      const next = { ...prev };
      delete next[deletedId];
      return next;
    });
    if (selectedTabId === deletedId) {
      setSelectedTabId(tabs[0]?.id ?? null);
    }
  }, [selectedTabId, tabs]);

  const onSqlEdit = useCallback((sql: string) => {
    if (!activeTab) return;
    if (activeTab.type === 'custom') {
      const customTabId = activeTab.id.replace('custom:', '');
      updateCustomTab(customTabId, sql);
    } else {
      createCustomTab(sql);
    }
  }, [activeTab, updateCustomTab, createCustomTab]);

  const setTableState = useCallback(<K extends keyof TableState>(key: K, value: TableState[K]) => {
    if (!activeTabId) return;
    setTableStateByTab((prev) => ({
      ...prev,
      [activeTabId]: {
        ...(prev[activeTabId] ?? createDefaultTableState()),
        [key]: value,
      },
    }));
  }, [activeTabId]);

  const resetTableState = useCallback(() => {
    if (!activeTabId) return;
    setTableStateByTab((prev) => {
      const next = { ...prev };
      delete next[activeTabId];
      return next;
    });
  }, [activeTabId]);

  const value = useMemo<TabContextValue>(() => ({
    tabs,
    activeTabId,
    activeTab,
    preview,
    setActiveTabId,
    createCustomTab,
    setPreviewRef,
    setPreviewSql,
    clearPreview,
    updateCustomTab,
    deleteCustomTab,
    onSqlEdit,
    tableState,
    setTableState,
    resetTableState,
  }), [tabs, activeTabId, activeTab, preview, setActiveTabId, createCustomTab, setPreviewRef, setPreviewSql, clearPreview, updateCustomTab, deleteCustomTab, onSqlEdit, tableState, setTableState, resetTableState]);

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}
