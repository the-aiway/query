import { Table } from 'apache-arrow';
import { Code2, X, Database } from 'lucide-react';
import React, { useMemo, useRef } from 'react';

import { DataTable, tableInputToRef } from './DataTable';
import {
  type QueryTableProps,
  type QueryTableSourceMap,
} from './components/QueryTableContext';
import { type QueryRef } from '../react/reducks';
import { SqlQueryEditorPopover } from './components/SqlQueryEditorPopover';
import { Button } from './ui/Button';
import { TabProvider, useTab } from './components/TabContext';

const SOURCE_SWITCHER_HEIGHT = 36;

type QueryTableInputProps = QueryTableProps & {
  sql?: string;
};

function isNamedSourceMap(input: QueryTableProps['table']): input is QueryTableSourceMap {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input instanceof Table) return false;
  return !('type' in input);
}

function QueryTableTabs() {
  const { tabs, activeTabId, setActiveTabId, deleteCustomTab, createCustomTab } = useTab();

  const hasMultipleTabs = tabs.length > 1;

  if (!hasMultipleTabs) return null;

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/75 flex items-center gap-1 overflow-x-auto border-b px-2 py-1 backdrop-blur">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        const isCustom = tab.type === 'custom';
        return (
          <div key={tab.id} className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] transition-colors ${
                active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
              title={tab.label}
            >
              {isCustom ? <Code2 className="h-3 w-3" /> : <Database className="h-3 w-3" />}
              {tab.label}
            </button>
            {isCustom && (
              <button
                type="button"
                onClick={() => {
                  const customTabId = tab.id.replace('custom:', '');
                  deleteCustomTab(customTabId);
                }}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex h-5 w-5 items-center justify-center rounded transition-colors"
                title="Delete tab"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <SqlQueryEditorPopover sql="" title="New Custom SQL" onSave={createCustomTab}>
        <Button variant="ghost" size="sm" className="h-5 shrink-0 px-2 font-mono text-[9px]" title="Create custom SQL tab">
          <Code2 className="mr-1 h-3 w-3" />
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

  const adjustedHeight = typeof height === 'number' && hasMultipleTabs ? Math.max(120, height - SOURCE_SWITCHER_HEIGHT) : height;

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
  const dependencyRootRef = activeTab.type === 'source' ? (activeTab.source ?? undefined) : undefined;

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

export function QueryTable({ sql: sqlInput, id, table: tableInput, height, compact = true, rowHeight, overscan = 12, ...props }: QueryTableInputProps) {
  const effectiveTableInput = sqlInput ?? tableInput;
  const effectiveRowHeight = rowHeight ?? (compact ? 24 : 28);
  const sourceMap = isNamedSourceMap(effectiveTableInput) ? effectiveTableInput : null;
  const arrowRefCache = useRef(new Map<object, QueryRef>());
  const generatedIdRef = useRef(`qt_${Math.random().toString(36).slice(2, 10)}`);
  const isUnnamedCompatMode = !sourceMap && !id;

  const sourceTabs = useMemo(() => {
    if (sourceMap) {
      return Object.entries(sourceMap)
        .map(([key, entry]) => {
          const ref = tableInputToRef(entry as QueryRef | null | undefined, arrowRefCache.current);
          if (ref) ref.ensureName(key);
          return { key, ref };
        })
        .filter(({ ref }) => !!ref);
    }
    const ref = tableInputToRef(effectiveTableInput as QueryRef | null | undefined, arrowRefCache.current);
    if (!ref) return [];
    const key = id ?? generatedIdRef.current;
    if (!ref.name) ref.ensureName(key);
    return [{ key, ref }];
  }, [sourceMap, effectiveTableInput, id]);

  const baseId = id ?? sourceTabs[0]?.key ?? generatedIdRef.current;

  return (
    <TabProvider sourceTabs={sourceTabs}>
      <QueryTableContent height={height} rowHeight={effectiveRowHeight} overscan={overscan} baseId={baseId} compact={compact} persistStateInUrl={!isUnnamedCompatMode} {...props} />
    </TabProvider>
  );
}

export default QueryTable;
