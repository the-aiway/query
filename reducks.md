# reducks

Reactive SQL for DuckDB-WASM. Compose SQL queries as a dependency graph, consume on demand. Works in React (hooks) or standalone (plain functions).

## Core Concepts

**QueryRef** — a lazy SQL specification. Creating one does nothing. It holds a SQL string, a type (`table` or `fragment`), and references to its dependencies. Data is only fetched when consumed.

**`useSql`** — creates a virtual ref. The SQL is inlined as a subquery when referenced by downstream queries. No disk I/O. Use this by default.

**`useTable`** — creates a persisted ref. When consumed, the query result is written to a Parquet file in OPFS via `COPY TO`. Downstream queries reference the file path. Use this for large intermediate results that benefit from being cached on disk.

**`useValues`** — creates a virtual ref from an in-memory JS array. Useful for injecting data into the SQL graph.

**`Materialize`** — the primary way to consume refs in React. Wraps Suspense and resolves sources automatically.

All hooks **always return a `QueryRef`** (never null). When scalar params are missing, the ref has `_status: 'pending'`. Ref dependencies that are pending propagate pending status without null cascading.

## Quick Start

### In React (recommended)

Use `Materialize` to consume refs. It handles Suspense boundaries and source resolution:

```tsx
import { useSql } from '#query/react/reducks';
import { Materialize } from '#query/react/Materialize';

function OrderStats() {
  const orders = useSql(`SELECT * FROM '/api/export/*/transport_orders.parquet'`);

  const stats = useSql(
    (t) => `SELECT count(*)::int as n, sum(weight)::int as total_weight FROM ${t.orders}`,
    { orders }
  );

  return (
    <Materialize source={{ stats }} fallback={<Spinner />}>
      {({ stats }) => (
        <div>{stats[0].n} orders, {stats[0].total_weight}kg total</div>
      )}
    </Materialize>
  );
}
```

Multiple sources:

```tsx
<Materialize source={{ orders, stats, carriers }}>
  {({ orders, stats, carriers }) => (
    <MyDashboard orders={orders} stats={stats} carriers={carriers} />
  )}
</Materialize>
```

Lazy source (re-evaluated on render):

```tsx
<Materialize source={() => ({ stats: statsRef })}>
  {({ stats }) => ...}
</Materialize>
```

### Alternative: Direct `use()` with manual Suspense

For more control, use React's `use()` directly:

```tsx
import { useSql } from '#query/react/reducks';
import { use, Suspense } from 'react';

function OrderStats() {
  const orders = useSql(`SELECT * FROM '/api/export/*/transport_orders.parquet'`);
  const stats = useSql(
    (t) => `SELECT count(*)::int as n, sum(weight)::int as total_weight FROM ${t.orders}`,
    { orders }
  );

  const rows = use(stats.toArray());
  return <div>{rows[0].n} orders, {rows[0].total_weight}kg total</div>;
}

// Must wrap in Suspense + ErrorBoundary yourself
<Suspense fallback={<Spinner />}>
  <ErrorBoundary fallback={<ErrorCard />}>
    <OrderStats />
  </ErrorBoundary>
</Suspense>
```

### Without React

```ts
import { sql, table } from '#query/react/reducks';

const orders = sql(`SELECT * FROM '/api/export/*/transport_orders.parquet'`);

const stats = sql(
  (t) => `SELECT count(*)::int as n, sum(weight)::int as total_weight FROM ${t.orders}`,
  { orders }
);

const rows = await stats.toArray();
console.log(rows[0].n, 'orders');
```

Same cache, same materialization chain — just no hooks, no React dependency. All scalar params must be non-null (throws if any are missing, since there's no pending state outside React).

## API

### `useSql(sql)` / `useSql(t => sql, params)`

Creates a virtual ref (inlined as subquery).

```tsx
// Static SQL — no params
const orders = useSql(`SELECT * FROM '/api/export/*/transport_orders.parquet'`);

// Parameterized — refs are interpolated as FROM expressions, scalars are escaped
const filtered = useSql(
  (t) => `SELECT * FROM ${t.orders} WHERE weight > ${t.minWeight}`,
  { orders, minWeight: 100 }
);
```

### `useTable(t => sql, params)`

Same API as `useSql`, but materializes to a Parquet file in OPFS. Use for large intermediate results.

```tsx
const aggregated = useTable(
  (t) => `SELECT carrier, count(*) as n, sum(cost) as total
    FROM ${t.orders}
    GROUP BY carrier`,
  { orders }
);
```

### `useLazyTable(t => sql, params)` / `lazyTable(t => sql, params)`

Same API as `useTable`, but returns immediately via a VIEW. The Parquet materialization happens in the background.

1. Creates a `VIEW` pointing to the original SQL — ref is ready instantly
2. Downstream queries work immediately (DuckDB pushes predicates through views)
3. In the background: `COPY TO PARQUET` runs, then the view is swapped to point to the parquet file
4. Subsequent queries silently hit the fast parquet file — no re-render

Use this when you want fast first-render and can tolerate the first query running the original SQL.

```tsx
const aggregated = useLazyTable(
  (t) => `SELECT carrier, count(*) as n, sum(cost) as total
    FROM ${t.orders}
    GROUP BY carrier`,
  { orders }
);

// This works immediately — queries the VIEW (which runs the original SQL)
// After background COPY finishes, same VIEW silently reads from parquet
const rows = use(aggregated.toArray());
```

### `useValues(data, schema)`

Creates a virtual ref from JS data.

```tsx
// With explicit types
const cutoffs = useValues(
  [{ carrier: 'heppner', max_weight: 250 }, { carrier: 'geodist', max_weight: 300 }],
  { carrier: 'VARCHAR', max_weight: 'INT' }
);

// Or just column names (types inferred by DuckDB)
const cutoffs = useValues(
  [{ carrier: 'heppner', max_weight: 250 }],
  ['carrier', 'max_weight']
);

// Use in queries like any other ref
const joined = useSql(
  (t) => `SELECT o.*, c.max_weight
    FROM ${t.orders} o
    JOIN ${t.cutoffs} c ON o.carrier = c.carrier`,
  { orders, cutoffs }
);
```

### `useArrow(table)` / `arrow(table)`

Creates a ref from an Apache Arrow `Table`. The table is registered in DuckDB lazily on first consumption — no eager side effects.

```tsx
import { Table } from 'apache-arrow';

const arrowRef = useArrow(someArrowTable);

// Use in queries like any other ref
const filtered = useSql(
  (t) => `SELECT * FROM ${t.arrowRef} WHERE weight > 100`,
  { arrowRef }
);

const rows = use(filtered.toArray());
```

Pass `null` to disable (ref stays pending):

```tsx
const arrowRef = useArrow(isReady ? myTable : null);
```

Outside React, use `arrow()` directly:

```ts
import { arrow, sql } from '#query/react/reducks';

const ref = arrow(someArrowTable);
const rows = await sql((t) => `SELECT * FROM ${t.ref}`, { ref }).toArray();
```

### Low-level consumption methods

Each method returns a cached promise. Same call on the same ref returns the same promise — safe with `use()`. Prefer `Materialize` in React; use these for scripts, event handlers, or when you need the raw promise.

```tsx
// All rows as plain JS objects
const rows = await ref.toArray();

// Raw Arrow Table
const table = await ref.toArrow();

// First row as plain object (or null if empty)
const row = await ref.row();
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
    ${t.where({ carrier: 'heppner', weight: { gt: 100 } })}  -- WHERE clause builder
  `,
  { orders, carrier: 'heppner', minWeight: 100, isActive: true, someExpression: 'custom SQL' }
);
```

### Condition helpers

Available on the `t` proxy for inline condition building:

```tsx
t.eq(col, val)           // col = 'val'
t.neq(col, val)          // col != 'val'
t.gt(col, val)           // col > val
t.gte(col, val)          // col >= val
t.lt(col, val)           // col < val
t.lte(col, val)          // col <= val
t.between(col, a, b)     // col BETWEEN a AND b
t.in(col, [1, 2, 3])    // col IN (1, 2, 3)
t.like(col, '%pattern%') // col LIKE '%pattern%'
t.ilike(col, '%pat%')    // col ILIKE '%pat%'
t.where({ col: val })    // builds WHERE clause from object
```

## Plain API (no React)

`sql()`, `table()`, and `arrow()` are the non-hook equivalents of `useSql`, `useTable`, and `useArrow`. Same cache, same materialization — but callable anywhere: scripts, event handlers, server-side, tests.

```ts
import { sql, table, arrow } from '#query/react/reducks';

const orders = sql(`SELECT * FROM '/api/export/*/transport_orders.parquet'`);

const byCarrier = table(
  (t) => `SELECT carrier, count(*) as n FROM ${t.orders} GROUP BY carrier`,
  { orders }
);

const rows = await byCarrier.toArray();

// Arrow tables work too
const ref = arrow(someArrowTable);
const filtered = await sql((t) => `SELECT * FROM ${t.ref} WHERE weight > 100`, { ref }).toArray();
```

Key difference from hooks: scalar params **must** be non-null. There's no pending state outside React — passing a null scalar throws immediately, because there's no reactivity to recover later.

```ts
// This throws — use hooks if the value might be null
const ref = sql((t) => `SELECT * FROM t WHERE id = ${t.id}`, { id: null });
```

## Consuming Data

### With `Materialize` (recommended)

`Materialize` is the primary way to consume refs in React. It handles Suspense and resolves multiple sources:

```tsx
import { Materialize } from '#query/react/Materialize';

<Materialize source={{ orders, stats }} fallback={<Loading />}>
  {({ orders, stats }) => (
    <div>{orders.length} orders, total: {stats[0].total_cost}</div>
  )}
</Materialize>
```

Props:
- `source` — object of `QueryRef` or `Promise` values (or a function returning one)
- `fallback` — optional React node shown while loading
- `disabled` — if true, renders nothing
- `children` — render function receiving resolved data

Works with promises too:

```tsx
<Materialize source={{ orders, config: fetchConfig() }}>
  {({ orders, config }) => ...}
</Materialize>
```

### With `DataCard`

`DataCard` extends `Materialize` with a table view toggle button. Use when you want users to inspect the raw data:

```tsx
import { DataCard } from '#query/react/DataCard';

<DataCard source={{ orders: ordersRef, stats: statsRef }} className="p-4">
  {({ orders, stats }) => (
    <MyChart data={orders} summary={stats} />
  )}
</DataCard>
```

Clicking the table icon switches to `QueryTable` view.

### With `QueryTable`

`QueryTable` accepts refs directly and handles consumption internally:

```tsx
<QueryTable table={{ orders: ordersRef }} />
```

### Alternative: Direct `use()` (manual Suspense)

For more control, use React's `use()` directly. You must manage Suspense boundaries yourself:

```tsx
function Stats({ statsRef }: { statsRef: QueryRef }) {
  const rows = use(statsRef.toArray());
  return <div>{rows.length} results</div>;
}
```

Suspends while pending, throws on error (caught by ErrorBoundary).

For pending refs (`_status === 'pending'`), `toArray()`/`row()`/`toArrow()` return a never-resolving promise — the component stays suspended until deps resolve and a new ref is produced.

### With TanStack Query

```tsx
const ref = useSql(`SELECT * FROM orders`);

const { data, error, isLoading } = useQuery({
  queryKey: ['orders', ref._id],
  queryFn: () => ref.toArray(),
  enabled: ref._status !== 'pending',
});
```

### In event handlers / scripts

```tsx
onClick={async () => {
  const data = await ref.toArray();
  downloadAsCSV(data);
}}

## Dependency Chains

Refs can depend on other refs, forming a DAG. Materialization walks the chain in topological order.

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
const rows = use(summary.toArray());
```

## Pending Refs & Null Handling

Hooks never return null. When scalar params are missing, the ref has `_status: 'pending'`:

```tsx
const [carrier, setCarrier] = useState<string | null>(null);

// carrier is null → ref is pending (not null)
const filtered = useSql(
  (t) => `SELECT * FROM ${t.orders} WHERE carrier = ${t.carrier}`,
  { orders, carrier }
);

// filtered._status === 'pending'
// filtered.toArray() returns a never-resolving promise → use() suspends
// When carrier becomes non-null, useSql returns a new resolved ref
```

Ref dependencies that are pending propagate pending status to downstream refs automatically — no null cascading through the chain.

## Type Inference

SQL return types are inferred from the query string at the type level via `InferSQLStrict`:

```tsx
const ref = useSql(() => `SELECT count(*)::int as total, name FROM t`);
// ref: QueryRef<{ total: number; name: unknown }>

const rows = await ref.toArray();
// rows: { total: number; name: unknown }[]

const row = await ref.row();
// row: { total: number; name: unknown } | null
```

Cast columns with `::int`, `::varchar`, `::bool`, etc. for better inference. Uncast columns default to `unknown`.

## SQL Validation

Queries must start with `SELECT`, `FROM`, `PIVOT`, or `--sql`. CTEs (`WITH`) are **forbidden** — split into separate `useSql` refs instead.

```tsx
// These work:
useSql(() => `SELECT * FROM t`);
useSql(() => `FROM t`);
useSql(() => `PIVOT t ON col USING sum(val)`);
useSql(() => `--sql\nSELECT 1`);

// These are compile-time errors:
useSql(() => `UPDATE t SET x = 1`);       // must start with SELECT/FROM/PIVOT/--sql
useSql(() => `WITH cte AS (...) SELECT *`); // CTEs forbidden
```

## QueryRef Status

```
pending  → scalar deps missing, ref is inert
idle     → persisted ref (useTable/useLazyTable/arrow), not yet materialized
writing  → materialization in progress (VIEW creation, COPY TO PARQUET, or Arrow registration)
ready    → virtual ref (useSql), lazy ref (VIEW created), or fully materialized ref
error    → materialization failed
```

## Cache

Refs are content-addressed: same SQL string → same `QueryRef` (same `_id`). Consumption promises are also cached by ref ID + method. Calling `.toArray()` multiple times on the same ref returns the same promise.
