import { Copy, Download, FileJson, FileType } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '../ui/Button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator, ContextMenuLabel } from '../ui/ContextMenu';
import { useQT } from './QueryTableContext';

export function ExportButton({ disabled }: { disabled?: boolean }) {
  const { id, pool, queryParts } = useQT();
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDownloading = progress !== null;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleExport = useCallback(
    async (format: 'csv' | 'json' | 'parquet' | 'tsv', mode: 'download' | 'clipboard' = 'download') => {
      if (!pool || queryParts.filteredRef.status === 'pending') return;

      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      setProgress(2);
      setStage('Preparing');

      try {
        const fullSql = await queryParts.filteredRef.toSql();
        setProgress(10);

        const extension = format;
        const safeId = id.trim().replace(/[^a-zA-Z0-9_-]+/g, '_') || 'table';
        let copyOptions = '(FORMAT CSV, HEADER true)';
        if (format === 'json') copyOptions = '(FORMAT JSON, ARRAY true)';
        else if (format === 'parquet') copyOptions = '(FORMAT PARQUET)';
        else if (format === 'tsv') copyOptions = "(FORMAT CSV, DELIMITER '\t', HEADER true)";

        const exportFileName = `export_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;
        const conn = await pool.acquire();

        try {
          await pool.db.registerEmptyFileBuffer(exportFileName);
          setProgress(15);
          setStage(mode === 'clipboard' ? 'Copying' : 'Querying');

          // DuckDB-WASM doesn't expose progress for COPY — asymptotically approach 70% so the bar keeps moving.
          intervalRef.current = setInterval(() => {
            setProgress((p) => (p === null || p >= 70 ? p : p + (70 - p) * 0.05));
          }, 200);

          await pool.query(`COPY (${fullSql}) TO '${exportFileName}' ${copyOptions}`, []);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setProgress(75);
          setStage('Building file');

          const fileBuffer = await pool.db.copyFileToBuffer(exportFileName);
          setProgress(90);

          if (mode === 'clipboard') {
            const text = new TextDecoder().decode(fileBuffer);
            await navigator.clipboard.writeText(text);
            setStage('Copied');
          } else {
            const mimeType = format === 'csv' || format === 'tsv' ? 'text/csv;charset=utf-8;' : format === 'json' ? 'application/json;charset=utf-8;' : 'application/octet-stream';

            const blob = new Blob([fileBuffer as unknown as BlobPart], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeId}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setStage('Downloaded');
          }
          setProgress(100);
        } finally {
          pool.release(conn);
          try {
            await pool.db.dropFile(exportFileName);
          } catch {}
        }
      } catch (error) {
        console.error(`[QueryTable] Export failed (${format}, ${mode}):`, error);
        setStage('Failed');
      } finally {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        resetTimeoutRef.current = setTimeout(() => {
          setProgress(null);
          setStage('');
          resetTimeoutRef.current = null;
        }, 600);
      }
    },
    [id, pool, queryParts.filteredRef]
  );

  return (
    <div className="flex shrink-0 items-center gap-2">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0"
            onClick={() => void handleExport('csv')}
            disabled={disabled || isDownloading}
            title="Download (Right-click for options)"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent alignOffset={-5}>
          <ContextMenuLabel>Copy to Clipboard</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => void handleExport('csv', 'clipboard')}>
            <Copy className="mr-2 h-4 w-4" />
            Copy as CSV
          </ContextMenuItem>
          <ContextMenuItem onClick={() => void handleExport('json', 'clipboard')}>
            <Copy className="mr-2 h-4 w-4" />
            Copy as JSON
          </ContextMenuItem>
          <ContextMenuItem onClick={() => void handleExport('tsv', 'clipboard')}>
            <Copy className="mr-2 h-4 w-4" />
            Copy as TSV (for Excel)
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>Download</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => void handleExport('csv')}>
            <FileType className="mr-2 h-4 w-4" />
            Download as CSV
          </ContextMenuItem>
          <ContextMenuItem onClick={() => void handleExport('json')}>
            <FileJson className="mr-2 h-4 w-4" />
            Download as JSON
          </ContextMenuItem>
          <ContextMenuItem onClick={() => void handleExport('parquet')}>
            <FileType className="mr-2 h-4 w-4" />
            Download as Parquet
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {isDownloading ? (
        <div className="text-muted-foreground flex items-center gap-2 font-mono text-[11px]">
          <div className="bg-muted/60 h-1 w-24 overflow-hidden rounded-full" role="progressbar" aria-valuenow={Math.round(progress ?? 0)} aria-valuemin={0} aria-valuemax={100}>
            <div className="bg-primary h-full transition-[width] duration-200 ease-out" style={{ width: `${progress ?? 0}%` }} />
          </div>
          <span className="whitespace-nowrap">{stage}</span>
        </div>
      ) : null}
    </div>
  );
}
