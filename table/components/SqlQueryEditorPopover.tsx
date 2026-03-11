import Editor, { type OnMount } from '@monaco-editor/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'sql-formatter';

import { Dialog, DialogContent, DialogTrigger } from '../ui/Dialog';

type SqlQueryEditorPopoverProps = {
  sql: string | (() => Promise<string>);
  title?: string;
  children?: React.ReactNode;
  onSave?: (sql: string) => void;
};

export function SqlQueryEditorPopover({ sql, title = 'SQL', children, onSave }: SqlQueryEditorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [resolvedSql, setResolvedSql] = useState('');
  const editorRef = useRef<unknown>(null);

  const isReadOnly = !onSave;

  useEffect(() => {
    if (open) {
      if (typeof sql === 'function') {
        void sql().then((res) => {
          setResolvedSql(res);
          setDraft(res);
        });
      } else {
        setResolvedSql(sql);
        setDraft(sql);
      }
    }
  }, [sql, open]);

  const formatted = useMemo(() => {
    if (!resolvedSql) return '';
    try {
      return format(resolvedSql, { language: 'duckdb' });
    } catch {
      return resolvedSql;
    }
  }, [resolvedSql]);

  useEffect(() => {
    if (open && resolvedSql) {
      setDraft(isReadOnly ? formatted : resolvedSql);
    }
  }, [resolvedSql, formatted, open, isReadOnly]);

  const value = isReadOnly ? formatted : draft;
  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 20, 150), 500);

  const handleExecute = useCallback(() => {
    if (!onSave) return;
    const trimmed = draft.trim();
    if (trimmed) {
      onSave(trimmed);
    }
    setOpen(false);
  }, [onSave, draft]);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      monaco.languages.registerDocumentFormattingEditProvider('sql', {
        provideDocumentFormattingEdits(model: unknown & { getValue: () => string; getFullModelRange: () => unknown }) {
          try {
            const formatted = format(model.getValue(), { language: 'duckdb' });
            return [{ range: model.getFullModelRange(), text: formatted }];
          } catch {
            return [];
          }
        },
      });

      if (!isReadOnly) {
        editor.addAction({
          id: 'execute-query',
          label: 'Execute Query',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          run: () => {
            const trimmed = (editor as { getValue: () => string }).getValue().trim();
            if (!trimmed) return;
            if (onSave) onSave(trimmed);
            setOpen(false);
          },
        });

        editor.addAction({
          id: 'format-sql',
          label: 'Format SQL',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Semicolon, monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.Comma],
          run: () => editor.getAction('editor.action.formatDocument')?.run(),
        });
      }

      void editor.getAction('editor.action.formatDocument')?.run();
      if (!isReadOnly) editor.focus();
    },
    [isReadOnly, onSave]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button type="button" className="text-muted-foreground hover:text-foreground cursor-pointer truncate text-[11px]" title={title}>
            {title}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0">
        <div className="flex min-w-0 flex-col">
          <div className="border-border bg-muted/30 flex items-center justify-between border-b px-3 py-1.5">
            <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">{title}</span>
            {!isReadOnly && <span className="text-muted-foreground font-mono text-[10px]">{navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter run</span>}
          </div>
          <Editor
            height={editorHeight}
            defaultLanguage="sql"
            value={value}
            onChange={(v) => !isReadOnly && setDraft(v ?? '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              readOnly: isReadOnly,
              domReadOnly: isReadOnly,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              folding: false,
              glyphMargin: false,
              renderLineHighlight: isReadOnly ? 'none' : 'line',
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
              contextmenu: !isReadOnly,
            }}
          />
          {!isReadOnly && (
            <div className="border-border bg-muted/30 flex items-center justify-between border-t px-3 py-1.5">
              <button
                type="button"
                onClick={() =>
                  (
                    editorRef.current as {
                      getAction: (id: string) => { run: () => void } | undefined;
                    }
                  )
                    ?.getAction('editor.action.formatDocument')
                    ?.run()
                }
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded px-3 py-1 font-mono text-[11px] font-medium transition-colors"
              >
                Format SQL
              </button>
              <button type="button" onClick={handleExecute} className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded px-3 py-1 font-mono text-[11px] font-medium transition-colors">
                Run Query
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
