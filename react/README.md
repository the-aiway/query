## Quick Start

### In React

```tsx
import { useSql, useTable, useValues } from '#query/react';
import { Materialize } from '#query/react/Materialize';

function SalesDashboard({ region }: { region: string }) {
  // useTable → materializes 500k rows to Parquet in OPFS once, reused by every query below
  // ${t.region} → scalar, auto-escaped to 'europe' (SQL-injection safe)
  const transactions = useTable((t) => `SELECT * FROM '/api/export/*/transactions.parquet' WHERE region = ${t.region}`, { region });

  // useValues → JS array becomes a SQL table — business config living in React state
  const targets = useValues([
    { category: 'electronics', goal: 50000 },
    { category: 'furniture', goal: 30000 },
  ]);

  // useSql → virtual ref, zero I/O. DuckDB inlines it as a subquery and optimizes the chain.
  // ${t.transactions} → ref, becomes FROM 'opfs://transactions.parquet'
  // ${t.targets} → ref, inlined as (VALUES ...)
  // ::int casts → free TypeScript inference: { category: unknown, revenue: number, goal: number }
  const byCategory = useSql(
    (t) => `SELECT
        tr.category, sum(tr.amount)::int as revenue, count(*)::int as sales, tg.goal::int
      FROM ${t.transactions} tr
      LEFT JOIN ${t.targets} tg ON tr.category = tg.category
      GROUP BY tr.category, tg.goal
      ORDER BY revenue DESC`,
    { transactions, targets }
  );

  // another virtual ref on the same base — DuckDB deduplicates the scan
  const kpi = useSql(
    (t) => `SELECT
        count(*)::int as total_sales,
        sum(amount)::int as total_revenue,
        count(DISTINCT customer_id)::int as unique_customers
      FROM ${t.transactions}`,
    { transactions }
  );

  return (
    <>
      {/* Materialize wraps Suspense — resolves the ref chain, shows fallback while loading */}
      {/* .row() → Promise<single row | null>, perfect for aggregates */}
      <Materialize source={{ kpi: kpi.row() }} fallback={<Spinner />}>
        {({ kpi }) => (
          <header>
            <Stat label="Revenue" value={`${kpi.total_revenue}€`} />
            <Stat label="Sales" value={kpi.total_sales} />
            <Stat label="Customers" value={kpi.unique_customers} />
          </header>
        )}
      </Materialize>
      {/* source resolves .rows() by default → typed array, use .map() */}
      <Materialize source={{ byCategory }} fallback={<Spinner />}>
        {({ byCategory }) => (
          <table>
            {byCategory.map((row) => (
              <tr key={row.category}>
                <td>{row.category}</td>
                <td>
                  {row.revenue}€ / {row.goal ?? '—'}€ target
                </td>
                <td>{row.sales} sales</td>
              </tr>
            ))}
          </table>
        )}
      </Materialize>
    </>
  );
}
```

## Consuming Data

### `Materialize` (recommended)

Wraps Suspense, resolves QueryRef and Promise sources, renders children with typed data.

```tsx
import { Materialize } from '#query/react/Materialize';

<Materialize source={{ orders, stats }} fallback={<Loading />}>
  {({ orders, stats }) => (
    <div>
      {orders.length} orders, total: {stats[0].total_cost}
    </div>
  )}
</Materialize>;
```

Props:

- `source` — object of QueryRef or Promise values
- `fallback` — optional ReactNode shown while loading
- `disabled` — if true, renders nothing
- `children` — render function receiving resolved arrays

Works with promises too:

```tsx
<Materialize source={{ orders, config: fetchConfig() }}>
  {({ orders, config }) => ...}
</Materialize>
```

### `DataCard`

Extends `Materialize` with a table view toggle. Users can click to inspect raw data in a `QueryTable`.

```tsx
import { DataCard } from '#query/react/DataCard';

<DataCard source={{ orders, stats }} className="p-4">
  {({ orders, stats }) => <MyChart data={orders} summary={stats} />}
</DataCard>;
```

`DataCard` also accepts `source` as a function for lazy evaluation:

```tsx
<DataCard source={() => ({ stats: statsRef })}>
  {({ stats }) => ...}
</DataCard>
```

### `QueryTable`

Accepts refs directly and renders an interactive data table with filtering, sorting, and export.

```tsx
import { QueryTable } from '#query/table';

<QueryTable table={{ orders: ordersRef }} resolutionStrategy="lazy" />;
```

Named sources become switchable tabs. `resolutionStrategy` controls how the ref is consumed:

- `"direct"` — query rows on demand (default)
- `"materialized"` — write to Parquet first, then query
- `"lazy"` — VIEW first, Parquet in background

### `use()` (manual Suspense)

For more control, use React's `use()` directly. You manage Suspense boundaries yourself:

```tsx
import { use, Suspense } from 'react';

function Stats({ statsRef }: { statsRef: QueryRef }) {
  const rows = use(statsRef.rows());
  return <div>{rows.length} results</div>;
}

<Suspense fallback={<Spinner />}>
  <ErrorBoundary fallback={<ErrorCard />}>
    <Stats statsRef={statsRef} />
  </ErrorBoundary>
</Suspense>;
```

For pending refs, `rows()` returns a never-resolving promise — `use()` keeps the component suspended until deps resolve and a new ref is produced.

### `useRows` / `useRow` (no Suspense)

React hooks that resolve a ref without Suspense boundaries. The non-Suspense equivalent of `use(ref.rows())`:

```tsx
import { useSql, useRows, useRow } from '#query/react/reducks';

function Stats() {
  const statsRef = useSql(() => `SELECT count(*)::int as total, sum(amount)::int as revenue FROM orders`);
  const [stats, { isLoading, error }] = useRow(statsRef);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorCard error={error} />;
  return <div>{stats.total} orders, {stats.revenue}€</div>;
}
```

Also available as methods on the ref itself:

```tsx
const [rows, { isLoading, error }] = ordersRef.useRows();
const [row,  { isLoading, error }] = statsRef.useRow();
```

| Context | Array | Single row |
|---|---|---|
| `await` | `ref.rows()` | `ref.row()` |
| Suspense | `use(ref.rows())` | `use(ref.row())` |
| No Suspense | `useRows(ref)` / `ref.useRows()` | `useRow(ref)` / `ref.useRow()` |

Return value: `[data, { isLoading, error }]`

- `data` is `undefined` while loading, typed array/row on success
- For `useRow`, `null` means the query returned no rows; `undefined` means still loading
- Pending refs (deps unresolved) stay in loading state until the ref resolves

### Event handlers

Just `await` directly:

```tsx
onClick={async () => {
  const data = await ref.rows();
  downloadAsCSV(data);
}}
```

### TanStack Query

```tsx
const ref = useSql(`SELECT * FROM orders`);

const { data, error, isLoading } = useQuery({
  queryKey: ['orders', ref.id],
  queryFn: () => ref.rows(),
  enabled: ref.status !== 'pending',
});
```

## Param Interpolation

Inside the `(t) => sql` callback, the proxy `t` provides several interpolation modes:

```tsx
useSql(
  (t) => `SELECT * FROM ${t.orders}              -- ref → FROM expression
    WHERE carrier = ${t.carrier}                  -- string → 'escaped'
    AND weight > ${t.minWeight}                   -- number → raw
    AND active = ${t.isActive}                    -- boolean → TRUE/FALSE
    AND ${t.raw.someExpression}                   -- raw interpolation (no escaping)
  `,
  { orders, carrier: 'heppner', minWeight: 100, isActive: true, someExpression: 'custom SQL' }
);
```

### Condition helpers

Available on the `t` proxy for inline condition building:

```tsx
t.eq(col, val); // col = 'val'
t.neq(col, val); // col != 'val'
t.gt(col, val); // col > val
t.gte(col, val); // col >= val
t.lt(col, val); // col < val
t.lte(col, val); // col <= val
t.between(col, a, b); // col BETWEEN a AND b
t.in(col, [1, 2, 3]); // col IN (1, 2, 3)
t.like(col, '%pattern%'); // col LIKE '%pattern%'
t.ilike(col, '%pat%'); // col ILIKE '%pat%'
t.where({ col: val }); // builds WHERE clause from object
```

## API

Every hook has a plain function counterpart: `useSql`/`sql`, `useTable`/`table`, `useLazyTable`/`lazyTable`, `useValues`/`values`, `useArrow`/`fromArrow`, `usePipeline`/`pipeline`. Same cache, same materialization — hooks add React reactivity, plain functions work anywhere.

### `useSql` / `sql`

Creates a virtual ref (inlined as subquery). **Use this by default.** No I/O.

### `useTable` / `table`

Same API as `useSql`, but materializes to a Parquet file in OPFS. Downstream queries reference the file path. Use for large intermediate results that multiple downstream queries hit.

### `useLazyTable` / `lazyTable`

Same API as `useTable`, but returns immediately via a VIEW. Parquet materialization happens in the background.

1. Creates a VIEW — ref is ready instantly
2. Downstream queries work immediately (DuckDB pushes predicates through views)
3. Background: `COPY TO PARQUET` runs, then the VIEW swaps to point at the file
4. Subsequent queries silently hit the fast Parquet — no re-render

### `useValues` / `values`

Creates a virtual ref from JS data. Pass an explicit schema `{ col: 'VARCHAR' }` or column names `['col']`.

### `useStore`

Creates an in-memory DuckDB table with a schema. Returns a QueryRef plus an `insert()` method. Use the ref in `useSql` like any other ref.

- **Not reactive** — `insert()` writes to the table but does not invalidate caches or trigger re-renders.
- To refresh: add a dependency (e.g. `lastUpdate`) to `useSql` params and call `setState` when you want to re-query.

```tsx
const store = useStore({ numdept: 'INT', forced_carrier: 'VARCHAR' });
const [lastUpdate, setLastUpdate] = useState(0);
const ref = useSql((t) => `SELECT * FROM ${t.store} WHERE 1=1 AND ${t.lastUpdate} >= 0`, {
  store,
  lastUpdate,
});

store.insert({ numdept: 75, forced_carrier: 'UPS' });
store.insert([
  { numdept: 1, forced_carrier: 'A' },
  { numdept: 2, forced_carrier: 'B' },
]);

// when user clicks Reload:
setLastUpdate((n) => n + 1);
```

### `useArrow` / `fromArrow`

Creates a ref from an Apache Arrow `Table`. Registered in DuckDB lazily on first consumption. In React, pass `null` to get a pending ref: `useArrow(isReady ? table : null)`.

### `usePipeline` / `pipeline`

Runs a pipeline function — a plain function that takes a `ReEngine` and params, returns a bag of refs. This is the primary pattern for complex multi-step SQL DAGs.

Define the pipeline once:

```ts
import type { ReEngine, QueryRef } from '#query/react';

type AnalysisParams = { basePath: string; segment: string; cutoff: number };
type AnalysisResult = { orders: QueryRef; rates: QueryRef; stats: QueryRef };

export const analysisPipeline = (re: ReEngine, params: AnalysisParams): AnalysisResult => {
  const orders = re.sql(
    (t) => `--sql
      SELECT destination_department, actual_transport_cost
      FROM '${t.raw.basePath}/transport_orders.parquet'
      WHERE actual_segment = ${t.segment} AND actual_transport_cost > 0`,
    { basePath: params.basePath, segment: params.segment }
  );

  const rates = re.sql(
    (t) => `--sql
      SELECT * FROM '${t.raw.basePath}/carrier_rates.parquet'
      WHERE actual_segment = ${t.segment}`,
    { basePath: params.basePath, segment: params.segment }
  );

  const stats = re.sql(
    (t) => `--sql
      SELECT count(*)::int as total_orders, sum(actual_transport_cost)::int as total_cost
      FROM ${t.orders}`,
    { orders }
  );

  return { orders, rates, stats };
};
```

Use in React:

```tsx
import { usePipeline } from '#query/react';
import { DataCard } from '#query/react/DataCard';

function Dashboard({ basePath, segment, cutoff }: AnalysisParams) {
  const { stats } = usePipeline(analysisPipeline, { basePath, segment, cutoff });

  return (
    <DataCard source={{ stats }}>
      {({ stats }) => (
        <div>
          {stats[0].total_orders} orders, {stats[0].total_cost}€
        </div>
      )}
    </DataCard>
  );
}
```

Use imperatively — same pipeline, event handler on the client:

```ts
import { pipeline } from '#query/node';

async function handleExport(basePath: string, segment: string, cutoff: number) {
  const { stats } = pipeline(analysisPipeline, { basePath, segment, cutoff });
  const rows = await stats.rows();
  downloadCSV(rows);
}
```

Same pipeline, server-side (future — same DAG runs against a real DuckDB instead of WASM):

```ts
import { pipeline } from '#query/react';

app.get('/api/analysis/:segment/stats', async (req) => {
  const { stats } = pipeline(analysisPipeline, {
    basePath: '/data/warehouse',
    segment: req.params.segment,
    cutoff: 250,
  });
  const sql = await stats.toSql({ cte: true });
  const rows = await db.query(sql);
  return Response.json(rows);
});
```

`ReEngine` provides `{ sql, table, values }` — the imperative builder functions. The pipeline pattern makes them composable and context-independent. Define the DAG once, run it in React, in a click handler, or on a server.

### Without React

Same API, same cache — `sql` / `table` / `values` instead of `useSql` / `useTable` / `useValues`:

```ts
import { sql, table, values } from '#query/react';

const transactions = table((t) => `SELECT * FROM '/api/export/*/transactions.parquet' WHERE region = ${t.region}`, { region: 'europe' });

const targets = values([{ category: 'electronics', goal: 50000 }], {
  category: 'VARCHAR',
  goal: 'INT',
});

const byCategory = sql(
  (t) => `SELECT tr.category, sum(tr.amount)::int as revenue, tg.goal::int
    FROM ${t.transactions} tr LEFT JOIN ${t.targets} tg ON tr.category = tg.category
    GROUP BY tr.category, tg.goal`,
  { transactions, targets }
);

const rows = await byCategory.rows(); // [{category, revenue, goal}, ...]
const first = await byCategory.row(); // {category, revenue, goal} | null
```

## API

Every hook has a plain function counterpart: `useSql`/`sql`, `useTable`/`table`, `useLazyTable`/`lazyTable`, `useValues`/`values`, `useArrow`/`fromArrow`, `usePipeline`/`pipeline`. Same cache, same materialization — hooks add React reactivity, plain functions work anywhere.

### `useSql` / `sql`

Creates a virtual ref (inlined as subquery). **Use this by default.** No I/O.

### `useTable` / `table`

Same API as `useSql`, but materializes to a Parquet file in OPFS. Downstream queries reference the file path. Use for large intermediate results that multiple downstream queries hit.

### `useLazyTable` / `lazyTable`

Same API as `useTable`, but returns immediately via a VIEW. Parquet materialization happens in the background.

1. Creates a VIEW — ref is ready instantly
2. Downstream queries work immediately (DuckDB pushes predicates through views)
3. Background: `COPY TO PARQUET` runs, then the VIEW swaps to point at the file
4. Subsequent queries silently hit the fast Parquet — no re-render

### `useValues` / `values`

Creates a virtual ref from JS data. Pass an explicit schema `{ col: 'VARCHAR' }` or column names `['col']`.

### `useStore`

Creates an in-memory DuckDB table with a schema. Returns a QueryRef plus an `insert()` method. Use the ref in `useSql` like any other ref.

- **Not reactive** — `insert()` writes to the table but does not invalidate caches or trigger re-renders.
- To refresh: add a dependency (e.g. `lastUpdate`) to `useSql` params and call `setState` when you want to re-query.

```tsx
const store = useStore({ numdept: 'INT', forced_carrier: 'VARCHAR' });
const [lastUpdate, setLastUpdate] = useState(0);
const ref = useSql((t) => `SELECT * FROM ${t.store} WHERE 1=1 AND ${t.lastUpdate} >= 0`, {
  store,
  lastUpdate,
});

store.insert({ numdept: 75, forced_carrier: 'UPS' });
store.insert([
  { numdept: 1, forced_carrier: 'A' },
  { numdept: 2, forced_carrier: 'B' },
]);

// when user clicks Reload:
setLastUpdate((n) => n + 1);
```

### `useArrow` / `fromArrow`

Creates a ref from an Apache Arrow `Table`. Registered in DuckDB lazily on first consumption. In React, pass `null` to get a pending ref: `useArrow(isReady ? table : null)`.

### `usePipeline` / `pipeline`

Runs a pipeline function — a plain function that takes a `ReEngine` and params, returns a bag of refs. This is the primary pattern for complex multi-step SQL DAGs.

Define the pipeline once:

```ts
import type { ReEngine, QueryRef } from '#query/react';

type AnalysisParams = { basePath: string; segment: string; cutoff: number };
type AnalysisResult = { orders: QueryRef; rates: QueryRef; stats: QueryRef };

export const analysisPipeline = (re: ReEngine, params: AnalysisParams): AnalysisResult => {
  const orders = re.sql(
    (t) => `--sql
      SELECT destination_department, actual_transport_cost
      FROM '${t.raw.basePath}/transport_orders.parquet'
      WHERE actual_segment = ${t.segment} AND actual_transport_cost > 0`,
    { basePath: params.basePath, segment: params.segment }
  );

  const rates = re.sql(
    (t) => `--sql
      SELECT * FROM '${t.raw.basePath}/carrier_rates.parquet'
      WHERE actual_segment = ${t.segment}`,
    { basePath: params.basePath, segment: params.segment }
  );

  const stats = re.sql(
    (t) => `--sql
      SELECT count(*)::int as total_orders, sum(actual_transport_cost)::int as total_cost
      FROM ${t.orders}`,
    { orders }
  );

  return { orders, rates, stats };
};
```

Use in React:

```tsx
import { usePipeline } from '#query/react';
import { DataCard } from '#query/react/DataCard';

function Dashboard({ basePath, segment, cutoff }: AnalysisParams) {
  const { stats } = usePipeline(analysisPipeline, { basePath, segment, cutoff });

  return (
    <DataCard source={{ stats }}>
      {({ stats }) => (
        <div>
          {stats[0].total_orders} orders, {stats[0].total_cost}€
        </div>
      )}
    </DataCard>
  );
}
```

Use imperatively — same pipeline, event handler on the client:

```ts
import { pipeline } from '#query/node';

async function handleExport(basePath: string, segment: string, cutoff: number) {
  const { stats } = pipeline(analysisPipeline, { basePath, segment, cutoff });
  const rows = await stats.rows();
  downloadCSV(rows);
}
```

Same pipeline, server-side (future — same DAG runs against a real DuckDB instead of WASM):

```ts
import { pipeline } from '#query/react';

app.get('/api/analysis/:segment/stats', async (req) => {
  const { stats } = pipeline(analysisPipeline, {
    basePath: '/data/warehouse',
    segment: req.params.segment,
    cutoff: 250,
  });
  const sql = await stats.toSql({ cte: true });
  const rows = await db.query(sql);
  return Response.json(rows);
});
```

`ReEngine` provides `{ sql, table, values }` — the imperative builder functions. The pipeline pattern makes them composable and context-independent. Define the DAG once, run it in React, in a click handler, or on a server.

## Dependency Chains

Refs form a DAG. Materialization walks the chain in topological order.

```tsx
// Layer 0: raw data
const orders = useSql(`SELECT * FROM '/api/export/*/transport_orders.parquet'`);
const carriers = useSql(`SELECT * FROM '/api/export/*/reference_carriers.parquet'`);

// Layer 1: join
const enriched = useSql(
  (t) => `SELECT o.*, c.code as carrier_code
    FROM ${t.orders} o
    LEFT JOIN ${t.carriers} c ON o.carrier_id = c.id`,
  { orders, carriers }
);

// Layer 2: aggregate
const summary = useSql(
  (t) => `SELECT carrier_code, count(*) as n, sum(cost) as total
    FROM ${t.enriched} GROUP BY carrier_code`,
  { enriched }
);

// Only this triggers execution of the entire chain:
const rows = use(summary.rows());
```

## Pending Refs

Hooks never return null. A ref becomes pending when one of its **ref dependencies** is pending. Scalar params never cause pending — `null` escapes to `NULL`, `undefined` to empty string.

```tsx
// useArrow with null → pending ref
const arrowRef = useArrow(isReady ? someTable : null);

// arrowRef is pending → filtered is also pending (automatic propagation)
const filtered = useSql((t) => `SELECT * FROM ${t.arrowRef} WHERE weight > 100`, { arrowRef });

// filtered.rows() returns a never-resolving promise → use() suspends
// Materialize shows fallback
// When arrowRef resolves, the chain re-evaluates
```

Pending propagation is automatic through the DAG — no null checks needed at each layer.

Scalar nulls are **not** pending, they become SQL `NULL`:

```tsx
const [carrier, setCarrier] = useState<string | null>(null);

// carrier is null → escapes to NULL in SQL, ref is NOT pending
// generates: WHERE carrier = NULL (which matches nothing — use IS NULL if intended)
const filtered = useSql((t) => `SELECT * FROM ${t.orders} WHERE carrier = ${t.carrier}`, {
  orders,
  carrier,
});
```

## Type Inference

SQL return types are inferred at the type level via `InferSQLStrict`. Cast columns for better inference:

```tsx
const ref = useSql(() => `SELECT count(*)::int as total, name FROM t`);
// ref: QueryRef<{ total: number; name: unknown }>

const rows = await ref.rows();
// rows: { total: number; name: unknown }[]

const row = await ref.row();
// row: { total: number; name: unknown } | null
```

Supported casts: `::int`, `::integer`, `::bigint`, `::float`, `::double`, `::varchar`, `::text`, `::bool`, `::boolean`, `::date`, `::timestamp`, `::decimal`. Uncast columns default to `unknown`.

## QueryRef

```ts
interface QueryRef<TRow = unknown> {
  readonly id: string;
  readonly status: QueryStatus;
  readonly type: QueryType;
  readonly query: string;
  readonly name?: string;
  readonly error?: Error;
  readonly dependencies: readonly QueryRef[];
  rows(): Promise<NonNullable<TRow>[]>;
  toArrow(): Promise<Table>;
  row(): Promise<NonNullable<TRow> | null>;
  toSql(options?: { cte?: boolean }): Promise<string>;
  useRows(): [NonNullable<TRow>[] | undefined, { isLoading: boolean; error: Error | undefined }];
  useRow(): [NonNullable<TRow> | null | undefined, { isLoading: boolean; error: Error | undefined }];
}
```

### Status lifecycle

```
pending  → scalar deps missing, ref is inert
idle     → persisted ref (useTable/useLazyTable/useArrow), not yet materialized
writing  → materialization in progress (COPY TO PARQUET, VIEW creation, or Arrow registration)
ready    → virtual ref (useSql), lazy ref (VIEW created), or fully materialized ref
error    → materialization failed
```

### Consumption methods

Each method returns a cached promise. Same call on the same ref returns the same promise — safe with `use()`.

- `rows()` — all rows as plain JS objects
- `toArrow()` — raw Arrow Table
- `row()` — first row or null
- `toSql()` — the SQL string for this ref
- `toSql({ cte: true })` — standalone SQL with the entire dependency chain expressed as CTEs (useful for debugging or copying to a SQL editor)
- `useRows()` — React hook returning `[data, { isLoading, error }]` without Suspense
- `useRow()` — same, but for a single row (`null` = no rows, `undefined` = loading)

# reducks

Reactive SQL for DuckDB-WASM. Compose SQL queries as a dependency graph, consume on demand. Works in React (hooks) or standalone (plain functions).

## Why Refs, Not Queries

reducks builds SQL query graphs where nothing executes until you explicitly consume. This matters because:

**Stay in DuckDB as long as possible.** When you compose `useSql` refs, nested subqueries are inlined. DuckDB's optimizer unnests them, pushes predicates, reorders joins — you get CTE-like composition without writing `WITH`. The engine does the heavy lifting, not your JavaScript.

**Materialization is expensive.** `useTable` writes a Parquet file to OPFS — that's serialization, disk I/O, and file registration. Only pay this cost for large intermediate results referenced by multiple downstream queries. Default to `useSql` (zero I/O, pure subquery inlining).

**DuckDB-WASM can't share tables across connections.** The connection pool dispatches queries to different connections. A `CREATE TABLE` on one connection is invisible to others. reducks works around this by writing Parquet files to OPFS — visible to all connections, queryable by path.

**Never pull data into JS just to push it back.** The `useEffect` + `rows()` + `setState` pattern is an anti-pattern: data leaves DuckDB, sits in JS memory, and can't be composed with other refs. Keep everything as refs until the final render boundary.

## Core Concepts

**QueryRef** — a lazy SQL specification. Creating one does nothing. It holds a SQL string, a type, and references to its dependencies. Data is only fetched when consumed.

**`useSql` / `sql`** — virtual ref. SQL is inlined as a subquery. No disk I/O. Use this by default.

**`useTable` / `table`** — persisted ref. Result is written to Parquet in OPFS. Use for large intermediate results.

**`useLazyTable` / `lazyTable`** — VIEW immediately, Parquet in the background. Fast first-render, fast subsequent reads.

**`useValues` / `values`** — virtual ref from a JS array. Injects data into the SQL graph.

**`useStore`** — in-memory DuckDB table with imperative `insert()`. Not reactive: inserts do not invalidate caches or trigger re-renders. Use a dependency (e.g. `lastUpdate` in `useSql` params) and `setState` when you need to refresh.

**`useArrow` / `fromArrow`** — ref from an Apache Arrow Table.

**`usePipeline` / `pipeline`** — runs a pipeline function that builds a DAG of refs.

**`Materialize`** — the primary React consumer. Wraps Suspense, resolves refs, renders children with data.

All hooks always return a `QueryRef` (never null). When a ref dependency has `status: 'pending'`, downstream refs become pending too — propagation is automatic. Scalar params are never pending: `null` is escaped to `NULL`, `undefined` to an empty string.

### Cache

Refs are content-addressed: same SQL string → same QueryRef (same `id`). Consumption promises are also cached by ref ID + method. Calling `.rows()` multiple times returns the same promise.

## When to Materialize

|           | `useSql`                             | `useTable`                                | `useLazyTable`                               |
| --------- | ------------------------------------ | ----------------------------------------- | -------------------------------------------- |
| I/O       | None — inlined as subquery           | Writes Parquet to OPFS                    | VIEW first, Parquet in background            |
| Speed     | Instant (no materialization)         | Slow (disk I/O on first use)              | Instant first, fast after                    |
| Use when  | Default. Transforms, filters, joins  | Large result used by many downstream refs | Large result, fast first-render matters      |
| Trade-off | DuckDB re-executes the SQL each time | One-time cost, fast subsequent reads      | First query runs full SQL, then hits Parquet |

**Rule of thumb:** start with `useSql`. Switch to `useTable` or `useLazyTable` only when profiling shows a bottleneck from repeated subquery execution.
