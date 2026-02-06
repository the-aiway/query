import type { Column } from '@tanstack/react-table';
import type { Vector } from 'apache-arrow';
import { Calendar, Hash } from 'lucide-react';
import React from 'react';

import type { ColumnSummary } from './Datasource';

export const colors = [
  'bg-gray-300/10 text-gray-500 ring-1 ring-inset ring-gray-300/20 dark:text-gray-300',
  'bg-zinc-300/10 text-zinc-500 ring-1 ring-inset ring-zinc-300/20 dark:text-zinc-300',
  'bg-neutral-300/10 text-neutral-500 ring-1 ring-inset ring-neutral-300/20 dark:text-neutral-300',
  'bg-stone-300/10 text-stone-500 ring-1 ring-inset ring-stone-300/20 dark:text-stone-300',

  'bg-red-300/10 text-red-500 ring-1 ring-inset ring-red-300/20 dark:text-red-300',
  'bg-rose-300/10 text-rose-500 ring-1 ring-inset ring-rose-300/20 dark:text-rose-300',
  'bg-pink-300/10 text-pink-500 ring-1 ring-inset ring-pink-300/20 dark:text-pink-300',
  'bg-fuchsia-300/10 text-fuchsia-500 ring-1 ring-inset ring-fuchsia-300/20 dark:text-fuchsia-300',
  'bg-purple-300/10 text-purple-500 ring-1 ring-inset ring-purple-300/20 dark:text-purple-300',

  'bg-violet-300/10 text-violet-500 ring-1 ring-inset ring-violet-300/20 dark:text-violet-300',
  'bg-indigo-300/10 text-indigo-500 ring-1 ring-inset ring-indigo-300/20 dark:text-indigo-300',
  'bg-blue-300/10 text-blue-500 ring-1 ring-inset ring-blue-300/20 dark:text-blue-300',
  'bg-sky-300/10 text-sky-500 ring-1 ring-inset ring-sky-300/20 dark:text-sky-300',
  'bg-cyan-300/10 text-cyan-500 ring-1 ring-inset ring-cyan-300/20 dark:text-cyan-300',

  'bg-teal-300/10 text-teal-500 ring-1 ring-inset ring-teal-300/20 dark:text-teal-300',
  'bg-emerald-300/10 text-emerald-500 ring-1 ring-inset ring-emerald-300/20 dark:text-emerald-300',
  'bg-green-300/10 text-green-500 ring-1 ring-inset ring-green-300/20 dark:text-green-300',
  'bg-lime-300/10 text-lime-500 ring-1 ring-inset ring-lime-300/20 dark:text-lime-300',
  'bg-yellow-300/10 text-yellow-500 ring-1 ring-inset ring-yellow-300/20 dark:text-yellow-300',

  'bg-amber-300/10 text-amber-500 ring-1 ring-inset ring-amber-300/20 dark:text-amber-300',
  'bg-orange-300/10 text-orange-500 ring-1 ring-inset ring-orange-300/20 dark:text-orange-300',

  // extended hues (still Tailwind-native)
  'bg-blue-400/10 text-blue-600 ring-1 ring-inset ring-blue-400/20 dark:text-blue-300',
  'bg-indigo-400/10 text-indigo-600 ring-1 ring-inset ring-indigo-400/20 dark:text-indigo-300',
  'bg-violet-400/10 text-violet-600 ring-1 ring-inset ring-violet-400/20 dark:text-violet-300',
  'bg-purple-400/10 text-purple-600 ring-1 ring-inset ring-purple-400/20 dark:text-purple-300',
  'bg-fuchsia-400/10 text-fuchsia-600 ring-1 ring-inset ring-fuchsia-400/20 dark:text-fuchsia-300',

  'bg-pink-400/10 text-pink-600 ring-1 ring-inset ring-pink-400/20 dark:text-pink-300',
  'bg-rose-400/10 text-rose-600 ring-1 ring-inset ring-rose-400/20 dark:text-rose-300',
  'bg-red-400/10 text-red-600 ring-1 ring-inset ring-red-400/20 dark:text-red-300',

  'bg-emerald-400/10 text-emerald-600 ring-1 ring-inset ring-emerald-400/20 dark:text-emerald-300',
  'bg-teal-400/10 text-teal-600 ring-1 ring-inset ring-teal-400/20 dark:text-teal-300',
  'bg-cyan-400/10 text-cyan-600 ring-1 ring-inset ring-cyan-400/20 dark:text-cyan-300',
  'bg-sky-400/10 text-sky-600 ring-1 ring-inset ring-sky-400/20 dark:text-sky-300',

  'bg-lime-400/10 text-lime-600 ring-1 ring-inset ring-lime-400/20 dark:text-lime-300',
  'bg-green-400/10 text-green-600 ring-1 ring-inset ring-green-400/20 dark:text-green-300',
  'bg-yellow-400/10 text-yellow-600 ring-1 ring-inset ring-yellow-400/20 dark:text-yellow-300',
  'bg-amber-400/10 text-amber-600 ring-1 ring-inset ring-amber-400/20 dark:text-amber-300',
  'bg-orange-400/10 text-orange-600 ring-1 ring-inset ring-orange-400/20 dark:text-orange-300',
];
export function getPillColor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Helper to format cell values
export function formatCell(value: unknown, type: string, colName: string) {
  if (value === null || value === undefined) return '';
  if (type.match(/date/im) && typeof value === 'number' && !isNaN(value)) {
    // Only return date part for display in pill, not full ISO
    return new Date(value).toISOString().slice(0, 10);
  }
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value;
  if (colName === 'id') return (value as string).toString();
  if (typeof value === 'number') {
    if (value > 1_000_000) {
      return Math.round(value / 1000) + 'k';
    }
    return Number.isFinite(value)
      ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(/\u00a0/g, ' ')
      : '';
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'symbol') {
    return value.description ? `Symbol(${value.description})` : value.toString();
  }
  if (typeof value === 'function') return '[function]';
  if (typeof value === 'object') return JSON.stringify(value);
  return '';
}

export function copyToClipboard(text: string) {
  if (!text) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // fall through
  }

  // Fallback
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  } catch {
    // ignore
  }
}

function getCellTheme(
  colName: string,
  typeRaw: string,
  display: string,
  summary: ColumnSummary | undefined
) {
  const nDistinct = summary?.uniq ?? 0;
  const isPill = nDistinct > 1 && typeRaw === 'UTF8' && nDistinct < 36 && !!display;

  if (isPill) {
    return {
      textClass: '',
      alignClass: '',
      pillClass: getPillColor(display),
      isPill: true,
    };
  }

  const type = (typeRaw ?? '').toUpperCase();
  const isNumeric = !!type.match(/INT|DOUBLE|FLOAT|DECIMAL|REAL|NUMERIC/);
  const isDate = !!type.match(/DATE|TIMESTAMP|TIME/);
  const isBoolean = !!type.match(/BOOLEAN|BOOL/);

  // Treat empty as "normal" but muted
  if (!display) {
    return {
      textClass: 'text-muted-foreground',
      alignClass: 'text-left',
      isPill: false,
    };
  }

  if (isBoolean) {
    // Node.js console.log style: amber/orange for booleans
    return {
      textClass: 'text-blue-600 dark:text-amber-400',
      alignClass: 'text-left font-semibold',
      isPill: false,
    };
  }

  if (isNumeric) {
    return {
      textClass: 'text-emerald-700 dark:text-foreground',
      alignClass: 'text-right tabular-nums',
      isPill: false,
    };
  }

  if (isDate) {
    return {
      textClass: 'text-violet-700 dark:text-foreground',
      alignClass: 'text-left',
      isPill: false,
    };
  }

  return {
    textClass: 'text-foreground',
    alignClass: 'text-left',
    isPill: false,
  };
}

type CellProps = {
  column: Column<Record<string, unknown>>;
  colName: string;
  type: string;
  pageData: { vectors: Map<string, Vector> } | undefined;
  pageRowIndex: number;
  rowIndex: number;
  summary: ColumnSummary | undefined;
  isRowIndex?: boolean;
  renderCell?: (ctx: {
    colName: string;
    type: string;
    rawValue: unknown;
    display: string;
    rowIndex: number;
    pageRowIndex: number;
  }) => React.ReactNode | undefined;
};

export function Cell({
  column,
  colName,
  type,
  pageData,
  pageRowIndex,
  rowIndex,
  summary,
  isRowIndex = false,
  renderCell,
}: CellProps) {
  let display = '';
  let isUUID = false;
  let isDate = false;
  let rawValue: unknown = null;

  // Handle row index column
  if (isRowIndex) {
    display = (rowIndex + 1).toLocaleString();
    rawValue = rowIndex + 1;
  } else if (pageData?.vectors) {
    if (colName.includes('.')) {
      const [parent, child] = colName.split('.');
      const v = pageData.vectors.get(parent!);
      if (v) {
        const val = v.get(pageRowIndex);
        rawValue = val && typeof val === 'object' ? val[child!] : undefined;
        display = formatCell(rawValue, type, colName);
      }
    } else {
      const v = pageData.vectors.get(colName);
      if (v) {
        rawValue = v.get(pageRowIndex);
        display = formatCell(rawValue, type, colName);
        isDate = !!type.match(/DATE|TIME|TIMESTAMP/i);
        if (colName.endsWith('id') && typeof rawValue === 'string' && rawValue.length === 36) {
          isUUID = true;
        }
      }
    }
  }

  const theme = getCellTheme(colName, type, display, summary);
  const custom = renderCell?.({ colName, type, rawValue, display, rowIndex, pageRowIndex });
  const hasCustom = custom !== undefined;

  const handleCopy = (e: React.MouseEvent, val: unknown) => {
    e.stopPropagation();

    // Process value for copy
    let textToCopy = String(val);
    if (typeof val === 'number' && Number.isFinite(val)) {
      textToCopy = new Date(val).toISOString();
    } else if (val instanceof Date) {
      textToCopy = val.toISOString();
    }

    copyToClipboard(textToCopy);

    // Trigger animation via data attribute
    const button = e.currentTarget as HTMLButtonElement;
    button.dataset.copied = 'true';
    setTimeout(() => {
      button.dataset.copied = 'false';
    }, 1500);
  };

  // Use simple sticky positioning for row index column (without TanStack pinning API)
  const stickyStyles: React.CSSProperties = isRowIndex
    ? {
        position: 'sticky',
        left: 0,
        zIndex: 10,
      }
    : {};

  return (
    <div
      className={`px-2 py-1 font-mono text-[11px] border-r last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis flex items-center ${
        isRowIndex
          ? 'justify-center text-muted-foreground tabular-nums bg-background/80 backdrop-blur-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] z-[10]'
          : theme.alignClass + ' bg-transparent'
      }`}
      style={{ width: column.getSize(), ...stickyStyles }}
      title={
        typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : display
      }
    >
      {hasCustom ? (
        custom
      ) : isRowIndex ? (
        <span className="text-muted-foreground">{display}</span>
      ) : isUUID && rawValue && typeof rawValue === 'string' ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300 relative group overflow-hidden"
          title="Click to copy full UUID"
          onClick={(e) => handleCopy(e, rawValue)}
        >
          <Hash className="h-2.5 w-2.5 opacity-50" />
          {rawValue.slice(-6)}

          {/* Feedback overlay with CSS animation */}
          <span className="absolute inset-0 flex items-center justify-center bg-black/90 text-white text-[10px] font-bold rounded opacity-0 pointer-events-none [button[data-copied='true']_&]:opacity-100 [button[data-copied='true']_&]:animate-fadeOut" />
        </button>
      ) : theme.isPill ? (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${theme.pillClass}`}
        >
          {display}
        </span>
      ) : isDate && rawValue != null && display ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-sm bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-500/25 hover:bg-violet-500/15 dark:text-violet-300 relative group overflow-hidden"
          title="Click to copy full value"
          onClick={(e) => handleCopy(e, rawValue)}
        >
          <Calendar className="h-2.5 w-2.5 opacity-50" />
          {display}

          {/* Feedback overlay with CSS animation */}
          <span className="absolute inset-0 flex items-center justify-center bg-black/90 text-white text-[10px] font-bold rounded opacity-0 pointer-events-none [button[data-copied='true']_&]:opacity-100 [button[data-copied='true']_&]:animate-fadeOut" />
        </button>
      ) : (
        <span className={theme.textClass || 'text-foreground'}>{display}</span>
      )}
    </div>
  );
}
