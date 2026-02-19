import { Table } from 'apache-arrow';
import { Code2, X, Database } from 'lucide-react';
import React, { useMemo, useRef } from 'react';

import { DataTable, tableInputToRef } from './DataTable';
import { type QueryTableProps, type QueryTableSourceMap } from './components/QueryTableContext';
import { type QueryRef } from '../react/reducks';
import { SqlQueryEditorPopover } from './components/SqlQueryEditorPopover';
import { Button } from './ui/Button';
import { TabProvider, useTab } from './components/TabContext';

const SOURCE_SWITCHER_HEIGHT = 36;


function isNamedSourceMap(input: QueryTableProps['table']): input is QueryTableSourceMap {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input instanceof Table) return false;
  return !('type' in input);
}

function QueryTableTabs() {
  const { tabs, activeTabId, setActiveTabId, deleteCustomTab, createCustomTab } = useTab();

  const hasMultipleTabs = tabs.length > 1;

  if (!hasMultipleTabs) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto bg-background/95 px-2 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        const isCustom = tab.type === 'custom';
        return (
          <div key={tab.id} className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`rounded border px-2 py-0.5 text-[9px] font-mono transition-colors flex items-center gap-1 ${active
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              title={tab.label}
            >
              {isCustom ? (
                <Code2 className="h-3 w-3" />
              ) : (
                <Database className="h-3 w-3" />
              )}
              {tab.label}
            </button>
            {isCustom && (
              <button
                type="button"
                onClick={() => {
                  const customTabId = tab.id.replace('custom:', '');
                  deleteCustomTab(customTabId);
                }}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete tab"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <SqlQueryEditorPopover
        sql=""
        title="New Custom SQL"
        onSave={createCustomTab}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-[9px] font-mono shrink-0"
          title="Create custom SQL tab"
        >
          <Code2 className="h-3 w-3 mr-1" />
          New SQL
        </Button>
      </SqlQueryEditorPopover>
    </div>
  );
}

function QueryTableContent({
  height,
  rowHeight,
  overscan,
  baseId,
  ...props
}: {
  height?: number;
  rowHeight: number;
  overscan: number;
  baseId: string;
} & Omit<QueryTableProps, 'table' | 'id' | 'height' | 'rowHeight' | 'overscan'>) {
  const { activeTab, tabs, preview } = useTab();
  const hasMultipleTabs = tabs.length > 1;

  const adjustedHeight = typeof height === 'number' && hasMultipleTabs
    ? Math.max(120, height - SOURCE_SWITCHER_HEIGHT)
    : height;

  const footer = useMemo(() => {
    const userFooter = props.footer;
    const tabsFooter = <QueryTableTabs />;

    if (!hasMultipleTabs) return userFooter;

    if (userFooter) {
      return (
        <div className="flex flex-col">
          {tabsFooter}
          {userFooter}
        </div>
      );
    }

    return tabsFooter;
  }, [hasMultipleTabs, props.footer]);

  if (!activeTab) return null;
  const dependencyRootRef = activeTab.type === 'source' ? activeTab.source ?? undefined : undefined;

  if (preview?.source) {
    return (
      <DataTable
        key={`${activeTab.id}:preview:${preview.source.id}:${preview.nonce}`}
        id={baseId}
        table={preview.source}
        height={adjustedHeight}
        rowHeight={rowHeight}
        overscan={overscan}
        footer={footer}
        title={preview.label}
        dependencyRootRef={dependencyRootRef}
        {...props}
      />
    );
  }

  if (preview?.sql) {
    return (
      <DataTable
        key={`${activeTab.id}:preview-sql:${preview.nonce}`}
        id={`${baseId}_preview`}
        table={preview.sql}
        height={adjustedHeight}
        rowHeight={rowHeight}
        overscan={overscan}
        footer={footer}
        title={preview.label}
        dependencyRootRef={dependencyRootRef}
        {...props}
      />
    );
  }

  if (activeTab.type === 'source') {
    return (
      <DataTable
        key={activeTab.id}
        id={baseId}
        table={activeTab.source ?? undefined}
        height={adjustedHeight}
        rowHeight={rowHeight}
        overscan={overscan}
        footer={footer}
        title={activeTab.label}
        dependencyRootRef={dependencyRootRef}
        {...props}
      />
    );
  }

  return (
    <DataTable
      key={activeTab.id}
      id={`${baseId}_${activeTab.id}`}
      table={activeTab.sql}
      height={adjustedHeight}
      rowHeight={rowHeight}
      overscan={overscan}
      footer={footer}
      title={activeTab.label}
      dependencyRootRef={dependencyRootRef}
      {...props}
    />
  );
}

export function QueryTable({
  id,
  table: tableInput,
  height,
  compact = true,
  rowHeight,
  overscan = 12,
  ...props
}: QueryTableProps) {
  const effectiveRowHeight = rowHeight ?? (compact ? 24 : 28);
  const sourceMap = isNamedSourceMap(tableInput) ? tableInput : null;
  const arrowRefCache = useRef(new Map<object, QueryRef>());

  const sourceTabs = useMemo(() => {
    if (!sourceMap) return [];
    return Object.entries(sourceMap)
      .map(([key, entry]) => {
        const ref = tableInputToRef(entry as QueryRef | null | undefined, arrowRefCache.current);
        if (ref) ref.ensureName(key);
        return { key, ref };
      })
      .filter(({ ref }) => !!ref);
  }, [sourceMap]);

  const baseId = id ?? sourceTabs[0]?.key ?? 'default';

  return (
    <TabProvider sourceTabs={sourceTabs}>
      <QueryTableContent
        height={height}
        rowHeight={effectiveRowHeight}
        overscan={overscan}
        baseId={baseId}
        compact={compact}
        {...props}
      />
    </TabProvider>
  );
}

export default QueryTable;
