import { Copy, Download, FileJson, FileType, Loader2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Button } from '../ui/Button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '../ui/ContextMenu';
import { type useDuckDB } from '../../react/DuckDBProvider';
import { type useQueryParts } from './Datasource';

type ExportButtonProps = {
  pool: ReturnType<typeof useDuckDB>['pool'];
  queryParts: ReturnType<typeof useQueryParts>;
  disabled?: boolean;
};

export function ExportButton({ pool, queryParts, disabled }: ExportButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExport = useCallback(
    async (
      format: 'csv' | 'json' | 'parquet' | 'tsv',
      mode: 'download' | 'clipboard' = 'download'
    ) => {
      if (!pool || !queryParts.baseSql) return;

      setIsDownloading(true);
      try {
        const fullSql = `
          WITH base AS (${queryParts.baseSql})
          SELECT * FROM base
          ${queryParts.whereClause}
        `;

        const extension = format;
        let copyOptions = '(FORMAT CSV, HEADER true)';
        if (format === 'json') copyOptions = '(FORMAT JSON, ARRAY true)';
        else if (format === 'parquet') copyOptions = '(FORMAT PARQUET)';
        else if (format === 'tsv') copyOptions = "(FORMAT CSV, DELIMITER '\t', HEADER true)";

        const exportFileName = `export_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;
        const conn = await pool.acquire();

        try {
          await pool.db.registerEmptyFileBuffer(exportFileName);
          await pool.query(
            `COPY (${fullSql}) TO '${exportFileName}' ${copyOptions}`,
            queryParts.fullParams
          );
          const fileBuffer = await pool.db.copyFileToBuffer(exportFileName);

          if (mode === 'clipboard') {
            const text = new TextDecoder().decode(fileBuffer);
            await navigator.clipboard.writeText(text);
          } else {
            const mimeType =
              format === 'csv' || format === 'tsv'
                ? 'text/csv;charset=utf-8;'
                : format === 'json'
                  ? 'application/json;charset=utf-8;'
                  : 'application/octet-stream';

            const blob = new Blob([fileBuffer as unknown as BlobPart], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        } finally {
          pool.release(conn);
          try {
            await pool.db.dropFile(exportFileName);
          } catch {}
        }
      } catch (error) {
        console.error(`[QueryTable] Export failed (${format}, ${mode}):`, error);
      } finally {
        setIsDownloading(false);
      }
    },
    [pool, queryParts.baseSql, queryParts.whereClause, queryParts.fullParams]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => void handleExport('csv')}
          disabled={disabled || isDownloading}
          title="Download (Right-click for options)"
        >
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
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
  );
}
