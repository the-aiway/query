import Editor from '@monaco-editor/react';
import { Code2, Database, GitBranch, Globe, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'sql-formatter';
import { Duckable, type QueryRef } from '../../react/reducks';
import { Button } from '../ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ScrollArea } from '../ui/ScrollArea';
import { SqlQueryEditorPopover } from './SqlQueryEditorPopover';
import { useTab } from './TabContext';

// --- Tree types ---

type TreeNode = {
  id: string;
  kind: 'ref' | 'path';
  entry?: QueryRef;
  path?: string;
  displaySql: string;
  children: TreeNode[];
};

// --- Helpers ---

const API_PATH_RE = /'(\/(?:api|data)\/[^']+)'/g;

function extractPathSources(sql: string): string[] {
  API_PATH_RE.lastIndex = 0;
  const paths: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = API_PATH_RE.exec(sql)) !== null) paths.push(m[1]!);
  return [...new Set(paths)];
}

function extractDirectPathSources(entry: QueryRef): string[] {
  if (!entry.query) return [];
  let sql = entry.query;
  for (const dep of entry.dependencies || []) {
    if (dep.type !== 'fragment' || !dep.query) continue;
    sql = sql.split(dep.query).join(' ');
  }
  return extractPathSources(sql);
}

function toDisplaySql(entry: QueryRef): string {
  if (!entry.query) {
    return entry.type === 'table' ? `SELECT * FROM ${entry.name || entry.id}` : '';
  }
  let sql = entry.query;
  for (const dep of entry.dependencies || []) {
    const name = dep.name || dep.id;
    sql = sql.split(dep.id).join(name);
  }
  return sql;
}

function buildTree(entry: QueryRef, visited = new Set<string>()): TreeNode {
  const children: TreeNode[] = [];

  const paths = extractDirectPathSources(entry);
  for (const p of paths) {
    children.push({
      id: `path:${p}`,
      kind: 'path',
      path: p,
      displaySql: `SELECT * FROM '${p}'`,
      children: [],
    });
  }

  for (const dep of entry.dependencies || []) {
    if (visited.has(dep.id)) continue;
    visited.add(dep.id);
    children.push(buildTree(dep, visited));
  }

  return {
    id: entry.id,
    kind: 'ref',
    entry,
    displaySql: toDisplaySql(entry),
    children,
  };
}

function flatFind(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = flatFind(child, id);
    if (found) return found;
  }
  return null;
}

function nodeLabel(node: TreeNode): string {
  if (node.kind === 'path') return node.path ?? 'source';
  return node.entry?.name || node.entry?.id || 'sql';
}

// --- Tree node row ---

function PathNodeRow({ node, depth, selectedId, onSelect }: { node: TreeNode; depth: number; selectedId: string | null; onSelect: (node: TreeNode) => void }) {
  const isSelected = selectedId === node.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className={`flex w-full items-center gap-2 rounded py-1.5 text-left font-mono text-[11px] transition-colors ${isSelected ? 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/30 ring-inset dark:text-sky-300' : 'hover:bg-muted/40 text-foreground/60'} `}
      style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: 8 }}
      title={node.path}
    >
      <Globe className="h-3 w-3 shrink-0 text-emerald-500" />
      <span className="flex-1 truncate">{node.path}</span>
      <span className="shrink-0 rounded bg-emerald-500/10 px-1 text-[9px] text-emerald-600">source</span>
    </button>
  );
}

function TreeNodeRow({ node, depth, isRoot, selectedId, onSelect }: { node: TreeNode; depth: number; isRoot: boolean; selectedId: string | null; onSelect: (node: TreeNode) => void }) {
  if (node.kind === 'path') return <PathNodeRow node={node} depth={depth} selectedId={selectedId} onSelect={onSelect} />;

  const isTable = node.entry!.type === 'table';
  const isSelected = selectedId === node.id;
  const name = node.entry!.name || node.entry!.id;

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={`flex w-full items-center gap-2 rounded py-1.5 text-left font-mono text-[11px] transition-colors ${isSelected ? 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/30 ring-inset dark:text-sky-300' : 'hover:bg-muted/40 text-foreground/80'} ${isRoot ? 'font-bold' : ''} `}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: 8 }}
        title={node.displaySql.replace(/\s+/g, ' ').trim()}
      >
        {isTable ? <Database className="h-3 w-3 shrink-0 text-blue-500" /> : <Code2 className="h-3 w-3 shrink-0 text-amber-500" />}
        <span className="flex-1 truncate">{name}</span>
        <span className={`shrink-0 rounded px-1 text-[9px] ${isTable ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{isTable ? 'table' : 'sql'}</span>
      </button>
      {node.children.map((child) => (
        <TreeNodeRow key={child.id} node={child} depth={depth + 1} isRoot={false} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </>
  );
}

// --- SQL Preview ---

function formatSql(sql: string): string {
  try {
    return format(sql, { language: 'sql' });
  } catch {
    return sql;
  }
}

function buildTableCteSql(entry: QueryRef): string {
  const name = entry.name || entry.id;
  const escapedName = String(name).replace(/[^A-Za-z0-9_]/g, '_');
  const cteName = `_${escapedName}`;
  return `WITH\n  ${cteName} AS (\n    FROM\n      ${Duckable.toExpr(entry)}\n  )\nSELECT\n  *\nFROM\n  ${cteName}`;
}

function SqlPreview({ sql }: { sql: string }) {
  const formatted = useMemo(() => formatSql(sql), [sql]);
  const lineCount = formatted.split('\n').length;
  const height = Math.min(Math.max(lineCount * 18 + 16, 60), 200);

  return (
    <div className="border-border border-t">
      <Editor
        height={height}
        defaultLanguage="sql"
        value={formatted}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 11,
          lineNumbers: 'off',
          lineNumbersMinChars: 0,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          folding: false,
          glyphMargin: false,
          renderLineHighlight: 'none',
          scrollbar: { vertical: 'auto', horizontal: 'hidden', verticalScrollbarSize: 6 },
          padding: { top: 6, bottom: 6 },
          tabSize: 2,
          domReadOnly: true,
          contextmenu: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          cursorStyle: 'block',
          cursorBlinking: 'solid',
        }}
      />
    </div>
  );
}

// --- Main component ---

type DependencyTreeProps = {
  entry: QueryRef;
};

let dependencyPopoverOpenState = false;
let dependencySelectedIdState: string | null = null;
let dependencySelectedSqlState = '';

export function DependencyTree({ entry }: DependencyTreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(dependencySelectedIdState);
  const [selectedSql, setSelectedSql] = useState<string>(dependencySelectedSqlState);
  const [open, setOpen] = useState<boolean>(dependencyPopoverOpenState);
  const { setPreviewRef, setPreviewSql } = useTab();

  const tree = useMemo(() => buildTree(entry), [entry]);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return flatFind(tree, selectedId);
  }, [selectedId, tree]);

  const selectedLabel = selectedNode ? nodeLabel(selectedNode) : '';

  // Only resolves async CTE SQL for the display panel — never touches preview state.
  useEffect(() => {
    if (!selectedNode) {
      setSelectedSql('');
      return;
    }

    const fallbackSql = selectedNode.displaySql;
    setSelectedSql(fallbackSql);

    if (selectedNode.kind !== 'ref' || !selectedNode.entry) return;

    let cancelled = false;
    selectedNode.entry
      .toSql()
      .then((cteSql) => {
        if (cancelled) return;
        const resolved = selectedNode.entry?.type === 'table' ? buildTableCteSql(selectedNode.entry) : cteSql.trim() ? cteSql : fallbackSql;
        setSelectedSql(resolved);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setSelectedSql(`${fallbackSql}\n\n-- Failed to build CTE SQL: ${message}`);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNode]);

  // Auto-select root when opening with nothing valid selected.
  // Only updates selectedId — never touches preview state to avoid remount loops.
  useEffect(() => {
    if (!open) return;
    if (!selectedId || !flatFind(tree, selectedId)) {
      dependencySelectedIdState = tree.id;
      setSelectedId(tree.id);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist SQL for popover re-open.
  useEffect(() => {
    dependencySelectedSqlState = selectedSql;
  }, [selectedSql]);

  // Preview is applied directly in the click handler — never in an effect.
  const handleSelect = (node: TreeNode) => {
    dependencySelectedIdState = node.id;
    setSelectedId(node.id);
    const label = `Dependency: ${nodeLabel(node)}`;
    if (node.kind === 'ref' && node.entry) {
      setPreviewRef(node.entry, label);
    } else {
      setPreviewSql(node.displaySql, label);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        dependencyPopoverOpenState = nextOpen;
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 shrink-0 p-0" title="Dependency graph">
          <GitBranch className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} collisionPadding={12} className="max-h-[85vh] w-[min(28rem,calc(100vw-1rem))] overflow-hidden p-0">
        <div className="border-border bg-muted/30 flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Dependency Graph</span>
        </div>
        <ScrollArea className="max-h-[min(60vh,420px)]">
          <div className="p-1">
            <TreeNodeRow node={tree} depth={0} isRoot={true} selectedId={selectedId} onSelect={handleSelect} />
          </div>
        </ScrollArea>
        {selectedNode && (
          <div className="border-border bg-muted/20 flex items-center justify-between gap-2 border-t px-3 py-2">
            <span className="text-muted-foreground truncate font-mono text-[10px]">{selectedLabel}</span>
            <SqlQueryEditorPopover title={`Edit ${selectedLabel}`} sql={selectedSql || selectedNode.displaySql} onSave={(sql) => setPreviewSql(sql, `Dependency: ${selectedLabel}`)}>
              <Button variant="ghost" size="sm" className="h-6 shrink-0 px-2 font-mono text-[10px]" title="Edit dependency SQL">
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </SqlQueryEditorPopover>
          </div>
        )}
        {selectedNode && <SqlPreview sql={selectedSql || selectedNode.displaySql} />}
      </PopoverContent>
    </Popover>
  );
}
