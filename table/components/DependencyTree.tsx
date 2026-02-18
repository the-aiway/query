import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import React, { useMemo, useState } from 'react';
import { GitBranch, Database, Code2, Globe } from 'lucide-react';
import { type QueryRef } from '../../react/reducks';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';

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
  if (!entry._query) return [];
  let sql = entry._query;
  for (const dep of entry._dependencies || []) {
    if (dep._type !== 'fragment' || !dep._query) continue;
    sql = sql.split(dep._query).join(' ');
  }
  return extractPathSources(sql);
}

function toDisplaySql(entry: QueryRef): string {
  if (!entry._query) {
    return entry._type === 'table' ? `SELECT * FROM ${entry._name || entry._id}` : '';
  }
  let sql = entry._query;
  for (const dep of entry._dependencies || []) {
    const name = dep._name || dep._id;
    sql = sql.split(dep._id).join(name);
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

  for (const dep of entry._dependencies || []) {
    if (visited.has(dep._id)) continue;
    visited.add(dep._id);
    children.push(buildTree(dep, visited));
  }

  return {
    id: entry._id,
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

// --- Tree node row ---

function PathNodeRow({ node, depth, selectedId, onSelect }: { node: TreeNode; depth: number; selectedId: string | null; onSelect: (node: TreeNode) => void }) {
  const isSelected = selectedId === node.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className={`
        w-full flex items-center gap-2 py-1.5 rounded text-left text-[11px] font-mono transition-colors
        ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/40 text-foreground/60'}
      `}
      style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: 8 }}
      title={node.path}
    >
      <Globe className="h-3 w-3 shrink-0 text-emerald-500" />
      <span className="truncate flex-1">{node.path}</span>
      <span className="text-[9px] px-1 rounded shrink-0 bg-emerald-500/10 text-emerald-600">source</span>
    </button>
  );
}

function TreeNodeRow({
  node,
  depth,
  isRoot,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  isRoot: boolean;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}) {
  if (node.kind === 'path') return <PathNodeRow node={node} depth={depth} selectedId={selectedId} onSelect={onSelect} />;

  const isTable = node.entry!._type === 'table';
  const isSelected = selectedId === node.id;
  const name = node.entry!._name || node.entry!._id;

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={`
          w-full flex items-center gap-2 py-1.5 rounded text-left text-[11px] font-mono transition-colors
          ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/40 text-foreground/80'}
          ${isRoot ? 'font-bold' : ''}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: 8 }}
        title={node.displaySql.replace(/\s+/g, ' ').trim()}
      >
        {isTable ? (
          <Database className="h-3 w-3 shrink-0 text-blue-500" />
        ) : (
          <Code2 className="h-3 w-3 shrink-0 text-amber-500" />
        )}
        <span className="truncate flex-1">{name}</span>
        <span
          className={`text-[9px] px-1 rounded shrink-0 ${
            isTable ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
          }`}
        >
          {isTable ? 'table' : 'sql'}
        </span>
      </button>
      {node.children.map((child) => (
        <TreeNodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          isRoot={false}
          selectedId={selectedId}
          onSelect={onSelect}
        />
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

function SqlPreview({ sql }: { sql: string }) {
  const formatted = useMemo(() => formatSql(sql), [sql]);
  const lineCount = formatted.split('\n').length;
  const height = Math.min(Math.max(lineCount * 18 + 16, 60), 200);

  return (
    <div className="border-t border-border">
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

export function DependencyTree({ entry }: DependencyTreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(entry), [entry]);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return flatFind(tree, selectedId);
  }, [selectedId, tree]);

  const handleSelect = (node: TreeNode) => {
    setSelectedId(selectedId === node.id ? null : node.id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" title="Dependency graph">
          <GitBranch className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(28rem,calc(100vw-1rem))] max-h-[85vh] overflow-hidden p-0"
      >
        <div className="border-b border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Dependency Graph
          </span>
        </div>
        <ScrollArea className="max-h-[min(60vh,420px)]">
          <div className="p-1">
            <TreeNodeRow
              node={tree}
              depth={0}
              isRoot={true}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </ScrollArea>
        {selectedNode && <SqlPreview sql={selectedNode.displaySql} />}
      </PopoverContent>
    </Popover>
  );
}
