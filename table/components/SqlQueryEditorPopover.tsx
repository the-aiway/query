import Editor, { type OnMount } from '@monaco-editor/react';
import { format } from 'sql-formatter';
import React, { useCallback, useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogTrigger } from '../ui/Dialog';

type SqlQueryEditorPopoverProps = {
  sql: string;
  title?: string;
  children?: React.ReactNode;
};

export function SqlQueryEditorPopover({
  sql,
  title = 'SQL',
  children,
}: SqlQueryEditorPopoverProps) {
  const [open, setOpen] = useState(false);

  const formatted = useMemo(() => {
    try {
      return format(sql, { language: 'sql', dialect: 'duckdb' });
    } catch {
      return sql;
    }
  }, [sql]);

  const lineCount = useMemo(() => formatted.split('\n').length, [formatted]);
  const editorHeight = Math.min(Math.max(lineCount * 19 + 20, 150), 500);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
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

      editor.getAction('editor.action.formatDocument')?.run();
    },
    [],
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
          </div>
          <Editor
            height={editorHeight}
            defaultLanguage="sql"
            value={formatted}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              folding: false,
              glyphMargin: false,
              renderLineHighlight: 'none',
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
              contextmenu: false,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
