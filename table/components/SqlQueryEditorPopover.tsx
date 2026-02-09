import Editor, { type OnMount } from '@monaco-editor/react';
import { format } from 'sql-formatter';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CacheEntry } from '../../react/DataCoordinator';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ScrollArea } from '../ui/ScrollArea';

// ---------------------------------------------------------------------------
// inlineToCte — extract FROM (SELECT ...) subqueries into a WITH clause
// ---------------------------------------------------------------------------

function inlineToCte(sql: string): string {
  const ctes: { name: string; body: string }[] = [];
  let counter = 0;
  let result = sql;

  // Repeatedly extract the innermost FROM (SELECT ...) subquery
  for (let safety = 0; safety < 50; safety++) {
    // Find FROM/JOIN followed by a parenthesized SELECT
    const match = result.match(/\b(FROM|JOIN)\s*\(\s*(SELECT\b)/i);
    if (!match || match.index === undefined) break;

    const parenStart = result.indexOf('(', match.index + match[1].length);
    if (parenStart < 0) break;

    // Find matching closing paren
    let depth = 1;
    let i = parenStart + 1;
    for (; i < result.length && depth > 0; i++) {
      if (result[i] === '(') depth++;
      else if (result[i] === ')') depth--;
    }
    if (depth !== 0) break; // unbalanced

    const innerSql = result.slice(parenStart + 1, i - 1).trim();
    const cteName = `_cte${++counter}`;
    ctes.push({ name: cteName, body: innerSql });

    // Replace (SELECT ...) with the CTE name, keeping FROM/JOIN keyword
    result = result.slice(0, parenStart) + cteName + result.slice(i);
  }

  if (ctes.length === 0) return sql;

  const withClause = 'WITH\n' + ctes.map((c) => `  ${c.name} AS (${c.body})`).join(',\n');
  return `${withClause}\n${result}`;
}

type SqlQueryEditorPopoverProps = {
  sql: string;
  onSave: (nextSql: string) => void;
  widthClassName?: string;
  title?: string;
  chain?: { entry: CacheEntry; sql: string }[];
  entry?: CacheEntry;
  onReplay?: (sql: string) => void;
};

// Start with slugs restored if possible
function restoreSlugs(query: string, chain: { entry: CacheEntry; sql: string }[]): string {
  let result = query;
  // Replace from longest to shortest to avoid partial matches on prefixes? 
  // Or just iterate.
  for (const item of chain) {
    const { id, path, slug } = item.entry;
    // Replace ID
    result = result.split(id).join(slug);
    // Replace Path (if table)
    if (path) {
       result = result.split(`'${path}'`).join(slug);
    }
  }
  return result;
}

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
  
  // Logic to determine initial draft
  const getInitialDraft = () => {
     if (entry?.query && chain) {
        return restoreSlugs(entry.query, chain);
     }
     return sql;
  };
  
  const [draft, setDraft] = useState(getInitialDraft());
  const [showingOriginal, setShowingOriginal] = useState(!!(entry?.query && chain));

  const [cteMode, setCteMode] = useState(false);
  const editorRef = useRef<any>(null);

  const display = useMemo(() => sql.replace(/\s+/g, ' ').trim(), [sql]);

  // Compute line count for dynamic height
  const lineCount = useMemo(() => draft.split('\n').length, [draft]);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 20, 100), 500);

  useEffect(() => {
    if (!open) {
        // When closed, reset to current sql (or restored version if preferred)
        // But if sql changed externally, we want to reflect it.
        // If we are in "replay" mode, sql prop updates.
        setDraft(sql); 
    } else {
        // When opening, if we have entry/chain, show original by default
        if (entry?.query && chain) {
            setShowingOriginal(true);
            const restored = restoreSlugs(entry.query, chain);
             try {
                setDraft(format(restored, { language: 'sql' }));
            } catch {
                setDraft(restored);
            }
        } else {
             setShowingOriginal(false);
             try {
                setDraft(format(sql, { language: 'sql' }));
            } catch {
                setDraft(sql);
            }
        }
    }
  }, [sql, open, entry, chain]);

  const commit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      // If we are showing original (with slugs), we technically can't run it directly 
      // unless we resolve slugs back to SQL/IDs. 
      // But typically the user edits it.
      // If the user edits the "original" view, and saves... `QueryTable` expects valid SQL.
      // `QueryTable` expects fully resolved SQL usually? Or does it handle slugs?
      // `DataCoordinator` can handle slugs in `registerView`.
      // But `QueryTable` `query(sql)` treats it as raw SQL.
      
      // If the user modified the "original" query (with slugs), and hits run...
      // The backend expects valid SQL. Slugs like "users" are NOT valid table names unless they exist.
      // But here we are just validating purely visual "Replay".
      
      // If text changed, we save it.
      if (trimmed !== sql.trim()) onSave(trimmed);
    },
    [onSave, sql]
  );

  const execute = useCallback(() => {
    commit(draft);
    setOpen(false);
  }, [commit, draft]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Register SQL formatter
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

    // Cmd/Ctrl+Enter to execute
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
         // ... same execute logic
         const value = editor.getValue();
         const trimmed = value.trim();
         if (trimmed) {
             // If showing original, we might need to warn or resolve?
             // For now assume user knows what they are doing.
             onSave(trimmed);
             setOpen(false);
         }
      },
    });

    // Format keybinding: Cmd+; or Shift+Cmd+,
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

    // Format on mount
    const action = editor.getAction('editor.action.formatDocument');
    action?.run();

    // Focus the editor
    editor.focus();
  }, [onSave]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
         if (!nextOpen) {
           commit(draft);
         } else {
             // handled in useEffect
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
                                    // REPLAY: load this dependency's resolved SQL
                                    if (onReplay) onReplay(item.sql);
                                    // Update local draft too so user sees it change
                                    setDraft(item.sql);
                                    setShowingOriginal(false); // We are showing resolved SQL of a dependency
                                }}
                                className="flex flex-col items-start p-2 rounded hover:bg-muted/30 text-left group transition-colors"
                            >
                                <span className="text-[11px] font-medium font-mono text-foreground/80 group-hover:text-primary">
                                    {item.entry.slug}
                                </span>
                                <span className="text-[9px] text-muted-foreground truncate w-full">
                                    {item.entry.type} • {item.entry.id.split('_').slice(-1)[0]}
                                </span>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
                {/* Current Entry / Original Button */}
                 {entry && (
                    <button
                         onClick={() => {
                             // Restore original view
                             if (entry.query) {
                                 const restored = restoreSlugs(entry.query, chain);
                                 setDraft(restored);
                                 setShowingOriginal(true);
                                 // We don't onReplay here because we want to show the "original" query text
                                 // which might not be executable without resolution?
                                 // Actually, if we want to "Reload table with THIS query", we need the resolved SQL usually.
                                 // But if the user wants to see the original definition...
                             }
                         }}
                         className="p-2 border-t border-border hover:bg-muted/30 text-left"
                    >
                         <span className="text-[11px] font-bold font-mono text-primary">
                            {entry.slug} (Current)
                         </span>
                         <div className="text-[9px] text-muted-foreground">Original Definition</div>
                    </button>
                 )}
            </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {showingOriginal ? 'Original Query (Slugs Restored)' : 'Resolved SQL'}
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
                     <button type="button" onClick={() => {
                        const next = !cteMode;
                        setCteMode(next);
                        const current = editorRef.current?.getValue() ?? draft;
                        
                        try {
                            const formatted = format(next ? inlineToCte(current) : (showingOriginal ? restoreSlugs(entry!.query!, chain!) : sql), { language: 'sql' });
                            setDraft(formatted);
                            editorRef.current?.setValue(formatted);
                         } catch {
                            // ...
                         }
                     }} className={`text-[11px] font-mono font-medium px-3 py-1 rounded transition-colors ${
                        cteMode
                          ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}>
                        {cteMode ? '← Inline' : 'CTE →'}
                     </button>
                </div>
                <button type="button" onClick={execute} className="text-[11px] font-mono font-medium text-primary hover:text-primary/80 px-3 py-1 rounded hover:bg-primary/10 transition-colors">Run Query</button>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
