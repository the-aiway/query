import Editor, { type OnMount } from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

import { Dialog, DialogContent, DialogTrigger } from '../ui/Dialog';

type SqlQueryEditorPopoverProps = {
  sql: string | (() => Promise<string>);
  title?: string;
  children?: React.ReactNode;
  onSave?: (sql: string) => void;
};

export function SqlQueryEditorPopover({
  sql,
  title = 'SQL',
  children,
  onSave,
}: SqlQueryEditorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [resolvedSql, setResolvedSql] = useState('');
  const editorRef = useRef<unknown>(null);

  const isReadOnly = !onSave;

  useEffect(() => {
    if (open) {
      if (typeof sql === 'function') {
        sql().then(res => {
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
      return format(resolvedSql, { language: 'sql', dialect: 'duckdb' });
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
            const formatted = format(model.getValue(), { language: 'sql' });
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
          keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Semicolon,
            monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.Comma,
          ],
          run: () => editor.getAction('editor.action.formatDocument')?.run(),
        });
      }

      editor.getAction('editor.action.formatDocument')?.run();
      if (!isReadOnly) editor.focus();
    },
    [isReadOnly, onSave],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button
            type="button"
            className="text-[11px] text-muted-foreground truncate cursor-pointer hover:text-foreground"
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
            {!isReadOnly && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter run
              </span>
            )}
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
            <div className="border-t border-border bg-muted/30 px-3 py-1.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => (editorRef.current as { getAction: (id: string) => { run: () => void } | undefined })?.getAction('editor.action.formatDocument')?.run()}
                className="text-[11px] font-mono font-medium text-muted-foreground hover:text-foreground px-3 py-1 rounded hover:bg-accent transition-colors"
              >
                Format SQL
              </button>
              <button
                type="button"
                onClick={handleExecute}
                className="text-[11px] font-mono font-medium text-primary hover:text-primary/80 px-3 py-1 rounded hover:bg-primary/10 transition-colors"
              >
                Run Query
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
