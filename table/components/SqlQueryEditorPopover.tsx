import { useCallback, useEffect, useMemo, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

type SqlQueryEditorPopoverProps = {
  sql: string;
  onSave: (nextSql: string) => void;
  widthClassName?: string;
  title?: string;
};

export function SqlQueryEditorPopover({
  sql,
  onSave,
  widthClassName = 'w-[720px]',
  title = 'Click to edit query',
}: SqlQueryEditorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(sql);

  const display = useMemo(() => sql.replace(/\s+/g, ' ').trim(), [sql]);

  useEffect(() => {
    if (!open) setDraft(sql);
  }, [sql, open]);

  const commit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (trimmed !== sql.trim()) onSave(trimmed);
    },
    [onSave, sql]
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          commit(draft);
        } else {
          setDraft(sql);
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
      <PopoverContent className={`${widthClassName} p-2`} align="start">
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
          {draft}
        </pre>
        {/* TODO: fix Monaco Editor */}
        {/* <CodeEditor
          value={draft}
          onChange={(v) => setDraft(v ?? '')}
          onExecute={(sqlToExecute) => {
            commit(sqlToExecute);
            setOpen(false);
          }}
          height={height}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
          }}
        />  */}
      </PopoverContent>
    </Popover>
  );
}
