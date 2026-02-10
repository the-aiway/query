import Editor, { type OnMount } from '@monaco-editor/react';
import { format } from 'sql-formatter';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CacheEntry } from '../../react/DataCoordinator';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ScrollArea } from '../ui/ScrollArea';

type SqlQueryEditorPopoverProps = {
  sql: string;
  onSave: (nextSql: string) => void;
  widthClassName?: string;
  title?: string;
  chain?: { entry: CacheEntry; resolvedSql: string; originalSql: string }[];
  entry?: CacheEntry;
  onReplay?: (sql: string) => void;
};

export function SqlQueryEditorPopover({
  sql,
  onSave,
  widthClassName = 'w-[860px]',
  title = 'Click to edit query',
  chain,
  entry,
  onReplay,
}: SqlQueryEditorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(entry?.id ?? null);
  const [draft, setDraft] = useState(sql);
  const [lastPresentedDraft, setLastPresentedDraft] = useState(sql);
  const editorRef = useRef<any>(null);

  const display = useMemo(() => sql.replace(/\s+/g, ' ').trim(), [sql]);
  const isCacheEntryMode = Boolean(entry && chain && chain.length > 0);

  const activeChainItem = useMemo(() => {
    if (!isCacheEntryMode || !chain) return null;
    const selected = activeEntryId
      ? chain.find((item) => item.entry.id === activeEntryId)
      : null;
    if (selected) return selected;
    if (entry) {
      const fromEntry = chain.find((item) => item.entry.id === entry.id);
      if (fromEntry) return fromEntry;
    }
    return chain[chain.length - 1] ?? null;
  }, [activeEntryId, chain, entry, isCacheEntryMode]);

  const lineCount = useMemo(() => draft.split('\n').length, [draft]);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 20, 100), 500);

  const toFormattedSql = useCallback((inputSql: string) => {
    try {
      return format(inputSql, { language: 'sql' });
    } catch {
      return inputSql;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setDraft(sql);
      setLastPresentedDraft(sql);
      return;
    }

    if (activeChainItem) {
      setActiveEntryId(activeChainItem.entry.id);
      const currentSql = sql.trim();
      const originalSql = activeChainItem.originalSql.trim();
      const resolvedSql = activeChainItem.resolvedSql.trim();
      const shouldKeepEditedState =
        currentSql.length > 0 && currentSql !== originalSql && currentSql !== resolvedSql;
      const presented = toFormattedSql(
        shouldKeepEditedState ? sql : activeChainItem.originalSql
      );
      setDraft(presented);
      setLastPresentedDraft(presented);
      return;
    }

    const presented = toFormattedSql(sql);
    setDraft(presented);
    setLastPresentedDraft(presented);
  }, [sql, open, activeChainItem, toFormattedSql]);

  const commit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (trimmed === lastPresentedDraft.trim()) return;
      if (trimmed !== sql.trim()) onSave(trimmed);
    },
    [onSave, sql, lastPresentedDraft]
  );

  const execute = useCallback(() => {
    if (activeChainItem && draft.trim() === activeChainItem.originalSql.trim()) {
      onSave(activeChainItem.resolvedSql);
      setOpen(false);
      return;
    }
    commit(draft);
    setOpen(false);
  }, [activeChainItem, commit, draft, onSave]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    monaco.languages.registerDocumentFormattingEditProvider('sql', {
      provideDocumentFormattingEdits(model: any) {
        try {
          const formatted = format(model.getValue(), { language: 'sql' });
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        } catch {
          return [];
        }
      },
    });

    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
         const value = editor.getValue();
         const trimmed = value.trim();
         if (!trimmed) return;
         if (activeChainItem && trimmed === activeChainItem.originalSql.trim()) {
           onSave(activeChainItem.resolvedSql);
           setOpen(false);
           return;
         }
         onSave(trimmed);
         setOpen(false);
      },
    });

    editor.addAction({
      id: 'format-sql',
      label: 'Format SQL',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Semicolon,
        monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.Comma
      ],
      run: () => {
        const action = editor.getAction('editor.action.formatDocument');
        action?.run();
      },
    });

    const action = editor.getAction('editor.action.formatDocument');
    action?.run();

    editor.focus();
  }, [activeChainItem, onSave]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          commit(draft);
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="text-[11px] font-mono text-muted-foreground truncate cursor-pointer hover:text-foreground w-full min-w-0"
          title={title}
        >
          {display}
        </div>
      </PopoverTrigger>
      <PopoverContent className={`${widthClassName} p-0 overflow-hidden flex flex-row`} align="start">
        {/* Sidebar for Dependency Chain */}
        {chain && chain.length > 0 && (
            <div className="w-48 border-r border-border bg-muted/10 flex flex-col shrink-0">
                <div className="p-2 text-[10px] font-semibold text-muted-foreground border-b border-border">
                    DEPENDENCY CHAIN
                </div>
                <ScrollArea className="flex-1 max-h-[500px]">
                    <div className="flex flex-col p-1 gap-1">
                        {chain.map((item, idx) => (
                            <button
                                key={item.entry.id}
                                onClick={() => {
                                    setActiveEntryId(item.entry.id);
                                    if (onReplay) onReplay(item.resolvedSql);
                                    const presented = toFormattedSql(item.originalSql);
                                    setDraft(presented);
                                    setLastPresentedDraft(presented);
                                }}
                                className={`flex flex-col items-start p-2 rounded hover:bg-muted/30 text-left group transition-colors ${activeChainItem?.entry.id === item.entry.id ? 'bg-muted/40' : ''}`}
                            >
                                <span className="text-[11px] font-medium font-mono text-foreground/80 group-hover:text-primary">
                                    {item.entry.slug}
                                </span>
                                <span className="text-[9px] text-muted-foreground truncate w-full">
                                    {item.entry.type} • {idx + 1}
                                </span>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {isCacheEntryMode ? 'Original Query' : 'Resolved SQL'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter run
              </span>
            </div>
            <Editor
              height={editorHeight}
              defaultLanguage="sql"
              value={draft}
              onChange={(v) => setDraft(v ?? '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                folding: false,
                glyphMargin: false,
                renderLineHighlight: 'line',
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                padding: { top: 8, bottom: 8 },
                tabSize: 2,
                suggestOnTriggerCharacters: false,
                quickSuggestions: false,
                parameterHints: { enabled: false },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
              }}
            />
            {/* Footer buttons (Format, CTE, Run) */}
            <div className="border-t border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between">
                
                <div className="flex items-center gap-1">
                     <button type="button" onClick={() => editorRef.current?.getAction('editor.action.formatDocument')?.run()} className="text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground px-3 py-1 rounded hover:bg-accent transition-colors">Format SQL</button>
                </div>
                <button type="button" onClick={execute} className="text-[11px] font-mono font-medium text-primary hover:text-primary/80 px-3 py-1 rounded hover:bg-primary/10 transition-colors">Run Query</button>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
