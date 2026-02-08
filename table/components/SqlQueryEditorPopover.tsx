import Editor, { type OnMount } from '@monaco-editor/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

type SqlQueryEditorPopoverProps = {
  sql: string;
  onSave: (nextSql: string) => void;
  widthClassName?: string;
  title?: string;
};

/** Format SQL with basic indentation (no external dep). */
function formatSql(raw: string): string {
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|FULL JOIN|CROSS JOIN|ON|AND|OR|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION|UNION ALL|EXCEPT|INTERSECT|WITH|AS|QUALIFY|PARTITION BY|WINDOW|CREATE|INSERT|UPDATE|DELETE|SET|VALUES|INTO|COPY|CASE|WHEN|THEN|ELSE|END)\b/gi;
  let formatted = raw.replace(/\s+/g, ' ').trim();
  formatted = formatted.replace(keywords, (match) => {
    const upper = match.toUpperCase();
    if (['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'QUALIFY', 'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT', 'WITH'].includes(upper)) {
      return `\n${upper}`;
    }
    if (['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN'].includes(upper)) {
      return `\n${upper}`;
    }
    if (upper === 'AND' || upper === 'OR') {
      return `\n  ${upper}`;
    }
    if (upper === 'ON') {
      return ` ${upper}`;
    }
    return upper;
  });
  // Indent fields after SELECT
  formatted = formatted.replace(/\nSELECT\s+/g, '\nSELECT\n  ');
  formatted = formatted.replace(/,\s*/g, ',\n  ');
  return formatted.trim();
}

export function SqlQueryEditorPopover({
  sql,
  onSave,
  widthClassName = 'w-[860px]',
  title = 'Click to edit query',
}: SqlQueryEditorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(sql);
  const editorRef = useRef<any>(null);

  const display = useMemo(() => sql.replace(/\s+/g, ' ').trim(), [sql]);

  // Compute line count for dynamic height
  const lineCount = useMemo(() => draft.split('\n').length, [draft]);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 20, 100), 500);

  useEffect(() => {
    if (!open) setDraft(sql);
  }, [sql, open]);

  // When opening, format the SQL for readability
  useEffect(() => {
    if (open) {
      setDraft(formatSql(sql));
    }
  }, [open]);

  const commit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
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

    // Cmd/Ctrl+Enter to execute
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        const value = editor.getValue();
        const trimmed = value.trim();
        if (trimmed) {
          onSave(trimmed);
          setOpen(false);
        }
      },
    });

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
          setDraft(formatSql(sql));
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="text-[11px] text-muted-foreground truncate cursor-pointer hover:text-foreground w-full min-w-0"
          title={title}
        >
          {display}
        </div>
      </PopoverTrigger>
      <PopoverContent className={`${widthClassName} p-0 overflow-hidden`} align="start">
        <div className="border-b border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            SQL Editor
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to run
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
        <div className="border-t border-border bg-muted/30 px-3 py-1.5 flex items-center justify-end">
          <button
            type="button"
            onClick={execute}
            className="text-[11px] font-mono font-medium text-primary hover:text-primary/80 px-3 py-1 rounded hover:bg-primary/10 transition-colors"
          >
            Run Query
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
