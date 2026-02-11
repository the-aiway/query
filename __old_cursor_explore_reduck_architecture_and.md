# Explore Reduck architecture and capabilities
_Exported on 08/02/2026 at 21:26:58 CET from Cursor (2.5.0-pre.50.patch.0)_

---

**Cursor**

Let me explore all the key files and directories systematically.

Now let me read all the core files in parallel.

Now let me read the remaining critical files - the table components and the other supporting files.

Now I have a complete picture. Here is the comprehensive analysis.

---

# Reducks: Architecture, Capabilities, and Demo-Worthy Features

## What Is Reducks?

Reducks is a **reactive SQL data coordination layer** that runs entirely in the browser. It combines DuckDB-WASM (multithreaded), OPFS (Origin Private File System), Apache Arrow, and React hooks into a system that treats the user's browser as a **local-first analytical data warehouse** — no server-side compute needed for queries.

The name is a portmanteau: **Re**(act) + **Duck**(DB) + (Redu)**x**-like state management.

## Architecture Overview

The system is organized across two directories:

### `query/` — The Library (standalone, reusable package)

```
query/
├── duck/                        # DuckDB primitives
│   ├── ConnectionPool.ts        # Multi-connection pool with acquire/release
│   ├── DumpLogger.ts            # Query logger with timing
│   ├── inferSqlReturntype.ts    # Compile-time SQL→TypeScript type inference
│   └── duckdb-wasm-node.ts      # Node shim
├── react/                       # React integration
│   ├── DataCoordinator.ts       # Core: cache, materialization, GC engine
│   ├── reducks.ts               # All hooks: useDerivedTable, useFragment, etc.
│   ├── resolveDependencies.ts   # DAG resolution & SQL inlining
│   ├── DataCard.tsx             # Render-boundary component
│   ├── DuckDBProvider.ts        # React context + Suspense initialization
│   └── DuckQueryContext.tsx      # Table/file registry
├── table/                       # Interactive table component
│   ├── QueryTable.tsx           # Full-featured data grid
│   ├── components/
│   │   ├── Datasource.tsx       # Schema, count, summary, paging hooks
│   │   ├── Headers.tsx          # Sortable/filterable column headers
│   │   ├── Cell.tsx             # Smart cell rendering
│   │   ├── OptionsFilter.tsx    # Categorical faceted filter (checkbox list)
│   │   ├── RangeFilter.tsx      # Numeric range filter with histogram
│   │   ├── SqlQueryEditorPopover.tsx  # Monaco SQL editor with formatting
│   │   └── sqlUtils.ts          # WHERE clause builder, quoting, hashing
│   └── ui/                      # Radix-based UI primitives
└── index.ts                     # Public exports
```

### `client/lib/AdaptiveDataCoordinator.ts` — Extended Coordinator

Adds scheduling intelligence: query cancellation for stale slugs, execution queue with backpressure, and JIT view injection.

---

## The 5 Pillars That Make Reducks Unique

### 1. Reactive SQL DAG (Directed Acyclic Graph)

This is the core innovation. SQL queries are declared as **React hooks**, and they form a dependency graph that auto-resolves:

```39:68:query/react/reducks.ts
export type ReducksQueryFn<TDeps extends (CacheEntry | null)[], TQuery extends string> = (
  t: DepsToMap<TDeps>
) => TQuery;

/**
 * Interface for hooks that derive a new view or table from existing dependencies.
 * Supports two syntaxes:
 * 1. Standard: (slug, queryFn, params, dependencies)
 * 2. Object: ({ [slug]: queryFn }, dependencies, params)
 */
export interface ReducksDerivedHook {
  /**
   * Registers a derived view/table using standard syntax.
   * @param slug - Unique identifier for the view/table
   * @param queryFn - Function that returns the SQL query, receiving a map of dependency slugs.
   * @param params - Parameters to be substituted into the query (e.g. $id).
   * @param dependencies - List of dependent CacheEntries (views or parquets).
   */
  <TSlug extends string, TDeps extends (CacheEntry | null)[], TQuery extends string>(
    slug: TSlug,
    queryFn: ReducksQueryFn<TDeps, TQuery>,
    params: ReducksParams,
    dependencies?: TDeps
  ): CacheEntry<TSlug, InferSQLStrict<TQuery>[number]> | null;
// ...
```

Each hook returns a `CacheEntry | null`. Downstream hooks gate on their dependencies — if any upstream is `null` (not ready), they short-circuit and return `null` themselves. When an upstream resolves, React re-renders the downstream, which then runs its own SQL. This creates an automatic **waterfall of SQL computations** that only recomputes the affected subgraph when parameters change.

### 2. Three Materialization Strategies

Reducks offers three types of "nodes" in the DAG:

| Hook | Type | Storage | When to Use |
|------|------|---------|-------------|
| `useDerivedTable` | `'table'` | OPFS Parquet file | Heavy computations, large intermediates, cross-connection sharing |
| `useFragment` | `'fragment'` | Inlined SQL subquery | Lightweight compositions, no I/O overhead, connection-safe |
| `useDerivedView` | `'view'` | `CREATE TEMP VIEW` | Deprecated — connection-local, breaks in pooled setups |

The key insight from the design doc:

```345:353:client/pages/explorer/ExploreOptimizer.tsx
  // --- REDUCKS DATA PIPELINE ---
  // Reducks turns a chain of SQL statements into a reactive DAG: each hook declares a node, and downstream
  // nodes only run when upstream nodes are ready (and only the affected subgraph recomputes on param changes).
  //
  // Why `useDerivedTable` writes OPFS Parquet instead of creating TEMP tables?
  // - In a pooled / multi-worker setup, TEMP TABLE/VIEW state is connection-local. OPFS (Origin Private File System)
  //   gives you a shared artifact (`opfs://*.parquet`) that every connection can read via `read_parquet(...)`.
  // - It's "zero-copy" across the JS boundary: we never materialize big intermediates as JS arrays just to pass
  //   them around. DuckDB streams results directly to Parquet on disk, and later queries consume them in-engine,
```

**Fragments** are the recommended approach for composition. They are resolved at query-build time into inlined subqueries:

```342:354:query/react/reducks.ts
export const useFragment: ReducksDerivedHook = (arg1: any, arg2?: any, arg3: any = {}, arg4: any = []): any => {
  const { slug, queryFn, params, dependencies } = normalizeArgs(arg1, arg2, arg3, arg4);
  const { coordinator, allDepsReady, query } = useReducksBase(queryFn, dependencies);

  return useMemo(() => {
    if (!allDepsReady || !query) return null;
    if (Object.values(params).some((v) => v === undefined)) return null;

    const depIds = dependencies.map((d) => d?.id).filter((id): id is string => !!id);
    return coordinator.registerView(slug!, query, params, depIds, 'fragment');
  }, [allDepsReady, query, slug, JSON.stringify(params), coordinator, ...dependencies]);
};
```

The substitution map in `resolveDependencies.ts` determines how each dependency type is referenced:

```39:65:query/react/resolveDependencies.ts
export function buildSubstitutionMap(
  cache: CacheEntry[],
  depIds: string[]
): Record<string, string> {
  const subs: Record<string, string> = {};

  for (const depId of depIds) {
    const dep = findById(cache, depId);
    if (!dep) continue;

    if (dep.type === 'fragment') {
      let fragQuery = dep.query || '';
      if (dep.dependencies.length > 0) {
        const fragDepSubs = buildSubstitutionMap(cache, dep.dependencies);
        fragQuery = substituteRaw(fragQuery, fragDepSubs);
      }
      if (dep.params) fragQuery = substituteParams(fragQuery, dep.params);
      subs[dep.slug] = `(${fragQuery})`;
    } else if (dep.type === 'table') {
      subs[dep.slug] = `'${dep.path}'`;
    } else {
      subs[dep.slug] = dep.id;
    }
  }

  return subs;
}
```

- **Tables** → substituted as `'opfs://slug_t_xxxxx.parquet'`
- **Fragments** → substituted as `(SELECT ... inlined SQL ...)`
- **Views** → substituted as `view_id_name`

### 3. Compile-Time SQL Type Inference

This is a genuinely impressive TypeScript feat. `inferSqlReturntype.ts` is a **pure type-level SQL parser** that extracts column names and types from SQL string literals at compile time:

```173:188:query/duck/inferSqlReturntype.ts
export type InferSql<T extends string> =
  ExtractSelect<T> extends infer SelectPart
    ? [SelectPart] extends [never]
      ? Record<string, unknown>[]
      : SelectPart extends string
        ? SplitInferredFields<SelectPart> extends infer Fields
          ? Fields extends string[]
            ? FieldsToObject<Fields>[]
            : Record<string, unknown>[]
          : Record<string, unknown>[]
        : Record<string, unknown>[]
    : Record<string, unknown>[];

export type InferSQL<T extends string, TOverride = unknown> = unknown extends TOverride ? Materialize<InferSql<T>[number] & Record<string, unknown>>[] : TOverride extends unknown[] ? TOverride : Materialize<TOverride>[];

export type InferSQLStrict<T extends string, TOverride = unknown> = unknown extends TOverride ? Materialize<InferSql<T>[number]>[] : TOverride extends unknown[] ? TOverride : Materialize<TOverride>[];
```

It handles:
- `::INT`, `::DOUBLE`, `::TEXT` casts → `number`, `number`, `string`
- `AS alias` → correct property names
- `WITH ... CTEs` → strips to main SELECT
- `count(*)`, `sum()`, `avg()` → infers `number`
- String/number literals → infers `string`/`number`
- `db.field` dot notation → extracts leaf name
- Block and line comment stripping
- Paren balancing for nested subqueries

This means the hooks carry **phantom row types** through the entire DAG:

```507:513:query/react/reducks.ts
  // Test 7: Aggregate Results with InferSQL
  const agg = useAggregateResults((t) => `SELECT count(*)::int as total FROM ${t.table_1}`, {}, [t1]);
  // Verify return type inference
  agg satisfies { total: number } | null;
  // @ts-expect-error - 'wrong' field does not exist
  agg satisfies { wrong: number } | null;
```

### 4. Content-Addressable Cache with LRU + Reference Counting

The `DataCoordinator` is a **Materialized View Manager** for the browser:

```222:260:query/react/DataCoordinator.ts
  protected async cleanup() {
    const tableEntries = Array.from(this.cache.entries()).filter(([, e]) => e.type === 'table');

    if (tableEntries.length <= this.maxFiles) return;

    // Sort by LRU (oldest used first)
    const sortedEntries = tableEntries.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

    // Calculate reference counts (how many other views/tables depend on this ID)
    const refCounts = new Map<string, number>();
    for (const entry of this.cache.values()) {
      for (const depId of entry.dependencies) {
        refCounts.set(depId, (refCounts.get(depId) || 0) + 1);
      }
    }

    const toDelete: string[] = [];
    for (const [key, entry] of sortedEntries) {
      if (tableEntries.length - toDelete.length <= this.maxFiles) break;

      // Only delete if NO active dependencies and NOT currently writing
      if (
        (refCounts.get(entry.id) || 0) === 0 &&
        entry.status !== 'writing' &&
        entry.status !== 'pending'
      ) {
        toDelete.push(key);
        try {
          await this.pool.db.dropFile(entry.path);
        } catch (e) {
          console.warn(`Failed to drop file ${entry.path}`, e);
        }
      }
    }
    // ...
```

Key behaviors:
- **Deduplication**: identical query+params+deps → same cache entry (no re-execution)
- **LRU eviction**: capped at 100 OPFS files, oldest-unused evicted first
- **Reference counting**: never evicts a file that an active downstream depends on
- **Subscriber pattern**: React hooks subscribe to coordinator notifications for re-renders

### 5. AdaptiveDataCoordinator — Scheduling Intelligence

The `AdaptiveDataCoordinator` extends the base with:

```82:140:client/lib/AdaptiveDataCoordinator.ts
  private async processQueue() {
    if (this.isProcessing || this.executionQueue.length === 0) return;

    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const item = this.executionQueue.shift()!;
      const slug = item.entry.slug;

      if (this.activeQueries.get(slug) !== item.key) {
        item.entry.status = 'error'; // Skip outdated
        continue;
      }
      // ... executes with JIT view injection and backpressure ...
      const duration = performance.now() - start;
      if (duration > 100 && this.executionQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(duration, 200)));
      }
    }

    this.isProcessing = false;
  }
```

- **Stale query cancellation**: if a new query for the same slug arrives, the old one is skipped
- **Serial execution queue**: prevents overloading DuckDB with concurrent COPY TO operations
- **Adaptive backpressure**: if a query takes >100ms, it yields to the event loop before the next one
- **JIT view injection**: recursively resolves view dependencies and prepends `CREATE TEMP VIEW` statements before materialization

---

## The QueryTable Component — Interactive Data Grid

`QueryTable` is a full-featured data exploration component built on TanStack Table + TanStack Virtual + DuckDB:

### Input Flexibility

```54:73:query/table/QueryTable.tsx
export type DataTableSource =
  | { type: 'sql'; sql: string; params?: unknown[] }
  | { type: 'data'; data: Record<string, unknown>[]; tableName?: string; sql?: string }
  | { type: 'arrow'; table: Table; tableName?: string; sql?: string }
  | { type: 'entry'; entry: CacheEntry };

/** Create a SQL data source */
export function query(sql: string, params?: unknown[]): DataTableSource {
  return { type: 'sql', sql, params };
}

/** Create a data source from in-memory objects */
export function fromJSON(data: Record<string, unknown>[], tableName?: string): DataTableSource {
  return { type: 'data', data, tableName };
}

/** Create a data source from a Reducks CacheEntry */
export function fromEntry(entry: CacheEntry): DataTableSource {
  return { type: 'entry', entry };
}
```

You can pass it a raw SQL string, a JavaScript array, an Arrow Table, or a Reducks `CacheEntry` — it handles everything.

### Interactive Features

1. **Virtual scrolling** — renders only visible rows using `useVirtualizer`, pages data in 1000-row chunks via `useQueries`
2. **Server-side sorting** — `ORDER BY` pushed into SQL, not client-side
3. **Categorical filters** (`OptionsFilter`) — checkbox list with counts, percentages, search, and frequency bars
4. **Numeric range filters** (`RangeFilter`) — interactive SVG histogram with:
   - Log-scale distribution visualization
   - Drag-to-select and drag-to-move range brushing
   - Zoom/focus windowing (double-click to reset)
   - Statistical summary strip (min, p01, median, p99, max)
   - Dual slider + manual input
5. **Global text search** — `ILIKE` across all columns
6. **Column visibility toggle** — show/hide columns with checkboxes
7. **Column resizing** — drag headers, auto-sized from p80 of data length
8. **Auto-hide empty columns** — columns with all NULLs are hidden by default
9. **Inline SQL editor** — Monaco editor popover with:
   - SQL formatting via `sql-formatter`
   - Cmd+Enter to execute
   - CTE ↔ inline subquery toggle
   - Live query editing (modifying the SQL re-runs everything)
10. **CSV export** — native DuckDB `COPY TO CSV` with all active filters applied
11. **Fullscreen mode** — toggle to fill the viewport
12. **STRUCT expansion** — nested struct fields are flattened into sub-columns

### Smart Data Summaries

```117:168:query/table/components/Datasource.tsx
export function useColumnSummaries(opts: QueryBase) {
  // ...
  // Uses DuckDB's COLUMNS(*) macro with UNPIVOT to compute per-column stats in a single query:
  // approx_count_distinct, null count, total count — for every column at once
}

export function useColumnSizes(opts: QueryBase) {
  // ...
  // Samples 1000 rows and computes p80 of string length per column
  // Used to auto-size column widths
}
```

---

## DataCard — The Render Boundary

`DataCard` is a React component that materializes `CacheEntry` sources and isolates re-renders:

```84:118:query/react/DataCard.tsx
/**
 * Reactive data boundary component. Materializes CacheEntry sources and renders
 * children with typed data. Isolates re-renders to only the consuming subtree.
 *
 * Features a table/chart toggle icon in the top-right corner (single source only).
 * In table mode, renders a full QueryTable powered by the source CacheEntry,
 * with editable SQL and virtual scrolling.
 */
```

Every `DataCard` has a built-in **table/chart toggle** — click the table icon and it switches to a full `QueryTable` with editable SQL, powered by the same `CacheEntry`. This means any chart can instantly be explored as a data grid.

---

## Real-World Usage: ExploreOptimizer

`ExploreOptimizer.tsx` is a carrier cost optimization dashboard that demonstrates the full power of Reducks:

```356:412:client/pages/explorer/ExploreOptimizer.tsx
  const currentStateTable = useDerivedTable(
    'current_state_v',
    () => `SELECT ... FROM '/api/export/*/transport_orders.parquet' WHERE ...`,
    { orgId, segment, cutoff }
  );

  const bestOptionsView = useDerivedTable(
    'best_options_v',
    (t) => `SELECT ... FROM '/api/export/*/order_carrier_costs.parquet' occ
      JOIN ${t.current_state_v} c ON occ.numdept = c.numdept ...`,
    { orgId, segment },
    [currentStateTable]
  );

  const optimizedView = useFragment(
    'optimized_v',
    (t) => `SELECT ... FROM ${t.current_state_v} c
      LEFT JOIN ${t.best_options_v} b ON c.numdept = b.numdept
      QUALIFY ROW_NUMBER() OVER (...) = 1`,
    { threshold },
    [currentStateTable, bestOptionsView]
  );
```

The DAG looks like:

```
transport_orders.parquet ─────┐
                              ├── currentStateTable (OPFS Parquet)
                              │        │
order_carrier_costs.parquet ──┘        ├── bestOptionsView (OPFS Parquet)
                                       │        │
                                       ├────────┼── optimizedView (fragment)
                                       │        │           │
                                       │        │           ├── statsFrag
                                       │        │           ├── marketShareFrag
                                       │        │           ├── topSavingsFrag
                                       │        │           └── deptCarrierFrag
                                       │        │
                                       ├────────┼── coverageSweepFrag → coverageAnalysisFrag
                                       │        │
                                       └────────┴── cutoff analysis chain
```

When the user moves the **threshold slider**, only `optimizedView` and its downstream fragments recompute — `currentStateTable` and `bestOptionsView` are untouched (cached in OPFS). When the user changes the **segment** (messagerie/colis/lot), the entire DAG recomputes from the root.

---

## What Would Be Impressive to Demo

1. **Slider reactivity**: Move the coverage threshold slider — watch the savings, map, and charts update in real-time as DuckDB re-runs only the affected SQL subgraph in the browser. No API calls, no server.

2. **Click any chart → instant table view**: Every `DataCard` has a table toggle. Click it and you get a full data grid with virtual scrolling, sorting, filtering, and an editable SQL query — all from the same underlying `CacheEntry`.

3. **Edit the SQL live**: In the QueryTable toolbar, click the SQL preview to open a Monaco editor. Modify the query (add a filter, change an aggregation) and press Cmd+Enter. The table re-renders instantly.

4. **Range filter histogram**: Open a numeric column filter — you get an 80-bucket log-scale histogram with drag-to-select brushing, zoom, and real-time count updates. All computed by DuckDB in the browser.

5. **Type inference in IDE**: Hover over `useAggregateResults((t) => 'SELECT count(*)::int as total...')` — TypeScript knows the return type is `{ total: number } | null` without any manual type annotations, inferred purely from the SQL string.

6. **Scale**: Load millions of rows of Parquet data over HTTP, materialize intermediate results to OPFS, and query them with sub-second latency. The JS heap stays clean because data never crosses the WASM boundary as JavaScript objects until the final small aggregate.

7. **The cutoff sweep**: Click "Find Optimal Cutoffs" — Reducks builds a cross-join of 20 cutoff values × all departments × all carriers, computes optimal costs for each combination, and renders a multi-carrier line chart. All in the browser, from a `useFragment` chain.

---

## Essential Files for Understanding Reducks

| File | Purpose |
|------|---------|
| `query/react/DataCoordinator.ts` | Core engine: cache, materialization, LRU, subscriptions |
| `query/react/reducks.ts` | All hooks: `useDerivedTable`, `useFragment`, `useAggregateResults`, `useSlice`, `useMaterialize` |
| `query/react/resolveDependencies.ts` | DAG resolution: substitution map, view SQL generation, recursive inlining |
| `query/duck/inferSqlReturntype.ts` | Compile-time SQL→TypeScript type parser |
| `query/duck/ConnectionPool.ts` | Multi-connection pool with query hook support |
| `query/table/QueryTable.tsx` | Interactive data grid with virtual scroll, filters, SQL editor |
| `query/table/components/Datasource.tsx` | Schema/count/summary/paging hooks for QueryTable |
| `query/table/components/RangeFilter.tsx` | Histogram-based numeric range filter with brushing |
| `query/react/DataCard.tsx` | Render boundary with chart/table toggle |
| `client/lib/AdaptiveDataCoordinator.ts` | Extended coordinator with scheduling and cancellation |
| `client/pages/explorer/ExploreOptimizer.tsx` | Best real-world usage example |
| `reducks-design.md` | Design conversation documenting architectural decisions |

