import Editor, { type OnMount } from '@monaco-editor/react';
import { format } from 'sql-formatter';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Dialog, DialogContent, DialogTrigger } from '../ui/Dialog';

type SqlQueryEditorPopoverProps = {
  sql: string;
  onSave: (nextSql: string) => void;
  title?: string;
  children?: React.ReactNode;
};

export function SqlQueryEditorPopover({
  sql,
  onSave,
  title = 'SQL Editor',
  children,
}: SqlQueryEditorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(sql);
  const editorRef = useRef<any>(null);

  const lineCount = useMemo(() => draft.split('\n').length, [draft]);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 20, 150), 500);

  const toFormattedSql = useCallback((inputSql: string) => {
    try {
      return format(inputSql, { language: 'sql' , dialect: 'duckdb' });
    } catch {
      return inputSql;
    }
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(toFormattedSql(sql));
    }
  }, [sql, open, toFormattedSql]);

  const execute = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== sql.trim()) {
      onSave(trimmed);
    }
    setOpen(false);
  }, [onSave, sql, draft]);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      monaco.languages.registerDocumentFormattingEditProvider('sql', {
        provideDocumentFormattingEdits(model: any) {
          try {
            const formatted = format(model.getValue(), { language: 'sql' });
            return [{ range: model.getFullModelRange(), text: formatted }];
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
          const trimmed = editor.getValue().trim();
          if (!trimmed) return;
          onSave(trimmed);
          setOpen(false);
        },
      });

      editor.addAction({
        id: 'format-sql',
        label: 'Format SQL',
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Semicolon,
          monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.Comma,
        ],
        run: () => editor.getAction('editor.action.formatDocument')?.run(),
      });

      editor.getAction('editor.action.formatDocument')?.run();
      editor.focus();
    },
    [onSave],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button
            type="button"
            className="text-[11px] font-mono text-muted-foreground truncate cursor-pointer hover:text-foreground"
            title={title}
          >
            {title}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden">
        <div className="flex flex-col min-w-0">
          <div className="border-b border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              {title}
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
          <div className="border-t border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => editorRef.current?.getAction('editor.action.formatDocument')?.run()}
              className="text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground px-3 py-1 rounded hover:bg-accent transition-colors"
            >
              Format SQL
            </button>
            <button
              type="button"
              onClick={execute}
              className="text-[11px] font-mono font-medium text-primary hover:text-primary/80 px-3 py-1 rounded hover:bg-primary/10 transition-colors"
            >
              Run Query
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
