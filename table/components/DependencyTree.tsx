import React, { useMemo, useState } from 'react';
import { GitBranch, Play, Database, Code2 } from 'lucide-react';
import { type QueryRef } from '../../react/reducks';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import type { ConnectionPool } from '../../duck/ConnectionPool';
import { useDuckDB } from '../../react/DuckDBProvider';

// --- Tree types ---

type TreeNode = {
  entry: QueryRef;
  displaySql: string;
  children: TreeNode[];
};

// --- Helpers ---

/** Replace internal IDs/paths with human-readable slugs for display */
function toDisplaySql(entry: QueryRef): string {
  if (!entry._query) {
    return entry._type === 'table' ? `SELECT * FROM ${entry._name || entry._id}` : '';
  }
  let sql = entry._query;
  // Replace dependencies
  for (const dep of entry._dependencies || []) {
    const name = dep._name || dep._id;
    // Replace ID
    sql = sql.split(dep._id).join(name);
    // Replace Path
    if (dep._path) {
      sql = sql.split(`'${dep._path}'`).join(name);
      sql = sql.split(dep._path).join(name);
    }
  }
  return sql;
}

function buildTree(
  entry: QueryRef,
  visited = new Set<string>(),
): TreeNode {
  const children: TreeNode[] = [];
  for (const dep of entry._dependencies || []) {
    if (visited.has(dep._id)) continue;
    visited.add(dep._id);
    children.push(buildTree(dep, visited));
  }
  return { entry, displaySql: toDisplaySql(entry), children };
}

function flatFind(node: TreeNode, id: string): TreeNode | null {
  if (node.entry._id === id) return node;
  for (const child of node.children) {
    const found = flatFind(child, id);
    if (found) return found;
  }
  return null;
}

// --- Tree node row ---

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
  const isTable = node.entry._type === 'table';
  const isSelected = selectedId === node.entry._id;
  const name = node.entry._name || node.entry._id;

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
          key={child.entry._id}
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

// --- Main component ---

type DependencyTreeProps = {
  entry: QueryRef;
  pool: ConnectionPool;
  onReplay: (sql: string) => void;
};

export function DependencyTree({ entry, onReplay }: DependencyTreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tree = useMemo(() => {
    return buildTree(entry);
  }, [entry]);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return flatFind(tree, selectedId);
  }, [selectedId, tree]);

  const handleReplay = () => {
    if (!selectedNode) return;
    onReplay(selectedNode.entry._query);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" title="Dependency graph">
          <GitBranch className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Dependency Graph
          </span>
          {selectedNode && selectedNode.entry._id !== entry._id && (
            <button
              type="button"
              onClick={handleReplay}
              className="flex items-center gap-1 text-[10px] font-mono font-medium text-primary hover:text-primary/80 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
            >
              <Play className="h-3 w-3" />
              Replay
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-1">
            <TreeNodeRow
              node={tree}
              depth={0}
              isRoot={true}
              selectedId={selectedId}
              onSelect={(node) => setSelectedId(node.entry._id)}
            />
          </div>
        </ScrollArea>
        {selectedNode && (
          <div className="border-t border-border bg-muted/10 px-3 py-2">
            <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-32 overflow-auto">
              {selectedNode.displaySql.replace(/\s+/g, ' ').trim()}
            </pre>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
