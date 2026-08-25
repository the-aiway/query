# Query - DuckDB-Powered Data Table for React (EXPERIMENTAL)

A high-performance, feature-rich React data table component that brings SQL analytics directly to the browser using DuckDB WebAssembly. Query enables interactive data exploration with virtual scrolling, dynamic filtering, and real-time SQL execution — all without backend infrastructure.

## Installation

```bash
npm install @the-aiway/query
```

### Peer Dependencies

```bash
npm install react @tanstack/react-query @tanstack/react-table @tanstack/react-virtual apache-arrow nuqs
```

## Quick Start

### 1. Set Up Providers

```tsx
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DuckQueryWasmProvider, useDuckDB } from '@the-aiway/query/provider';
import { setRuntime } from '@the-aiway/query/reducks';
import type { Table } from 'apache-arrow';

const queryClient = new QueryClient();

// Bridge DuckDB pool to the reducks runtime
function RuntimeBridge({ children }: { children: React.ReactNode }) {
  const { pool } = useDuckDB();
  setRuntime({
    async exec(sql: string) {
      const table = await pool.queryIPCTable(sql);
      return {
        rows: () => table.toArray().map((r) => r?.toJSON?.() ?? { ...r }),
        row: () => {
          const first = table.get(0);
          return first?.toJSON?.() ?? (first ? { ...first } : null);
        },
        arrowTable: table,
        raw: table,
      };
    },
    async insertArrow(name: string, arrowTable: unknown) {
      const conn = await pool.acquire();
      try {
        await conn.insertArrowTable(arrowTable as Table, { name, create: true });
      } finally {
        pool.release(conn);
      }
    },
  });
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading DuckDB...</div>}>
        <DuckQueryWasmProvider bundlePath="/static/duckdb">
          <RuntimeBridge>
            <YourComponents />
          </RuntimeBridge>
        </DuckQueryWasmProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
```

### 2. Display Data with QueryTable

#### From JSON Data

```tsx
import { QueryTable } from '@the-aiway/query/table';

const data = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
];

function MyComponent() {
  return <QueryTable id="users" table={data} height={400} />;
}
```

#### From a SQL Query

```tsx
import { QueryTable } from '@the-aiway/query/table';

function MyComponent() {
  return (
    <QueryTable
      id="active-users"
      sql="SELECT * FROM users WHERE status = 'active'"
      height={400}
    />
  );
}
```

#### From Apache Arrow

```tsx
import { QueryTable } from '@the-aiway/query/table';
import { tableFromJSON } from 'apache-arrow';

const arrowTable = tableFromJSON([
  { product: 'Widget', sales: 1200 },
  { product: 'Gadget', sales: 850 },
]);

function MyComponent() {
  return <QueryTable id="sales" table={arrowTable} height={400} />;
}
```

#### Multiple Data Sources (Tabs)

```tsx
import { QueryTable } from '@the-aiway/query/table';
import { useTable } from '@the-aiway/query/reducks';

function Dashboard() {
  const orders = useTable((t) => `SELECT * FROM orders`);
  const customers = useTable((t) => `SELECT * FROM customers`);

  return (
    <QueryTable
      id="dashboard"
      table={{ orders, customers }}
      height={500}
    />
  );
}
```

## API Reference

### `<QueryTable>` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `table` | `QueryRef \| string \| Record<string, unknown>[] \| Table \| Record<string, QueryRef>` | - | Data source (JSON array, Arrow Table, QueryRef, or named source map for tabs) |
| `sql` | `string` | - | SQL query string (alternative to `table`) |
| `id` | `string` | - | Unique identifier for state persistence |
| `height` | `number` | `560` | Table height in pixels |
| `rowHeight` | `number` | `24` (compact) / `28` (normal) | Height of each row in pixels |
| `compact` | `boolean` | `true` | Enable compact column sizing based on content |
| `overscan` | `number` | `12` | Number of rows to render outside viewport |
| `enableFilters` | `boolean` | `true` | Enable column filtering |
| `showRowNumbers` | `boolean` | `false` | Show row index column |
| `colDefaultWidth` | `number` | `140` | Default column width |
| `colMinWidth` | `number` | `80` | Minimum column width |
| `colMaxWidth` | `number` | `180` | Maximum column width |
| `getRowClassName` | `(ctx: { get, rowIndex }) => string` | - | Custom row CSS class |
| `renderCell` | `(ctx: { colName, type, rawValue, display, rowIndex, pageRowIndex }) => ReactNode \| undefined` | - | Custom cell renderer (return `undefined` for default) |
| `title` | `string` | - | Display title |
| `footer` | `ReactNode` | - | Footer content |
| `persistStateInUrl` | `boolean` | `true` | Persist filters/sorting in URL |
| `resolutionStrategy` | `'direct' \| 'materialized' \| 'lazy'` | `'direct'` | How data is resolved from QueryRefs |

### `<DuckQueryWasmProvider>` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `bundlePath` | `string` | `'/static/duckdb'` | Path to DuckDB WASM bundle files |
| `maxConnections` | `number` | `navigator.hardwareConcurrency` | Connection pool size |
| `debug` | `boolean` | `false` | Enable debug logging |
| `onInit` | `(pool: ConnectionPool) => Promise<void>` | - | Callback after initialization |
| `logger` | `Logger` | `VoidLogger` | DuckDB logger instance |

### `<Materialize>`

Low-level reactive boundary. Resolves QueryRef/Promise sources with Suspense and renders children with typed named data.

```tsx
import { Materialize } from '@the-aiway/query/react/Materialize';

const orders = useSql(() => `SELECT * FROM orders`);

<Materialize source={{ orders }} fallback={<div>Loading...</div>}>
  {({ orders }) => <MyChart data={orders} />}
</Materialize>
```

| Prop | Type | Description |
| --- | --- | --- |
| `source` | `Record<string, QueryRef \| Promise>` | Named data sources to resolve |
| `children` | `(data: ResolvedData) => ReactNode` | Render function with typed resolved data |
| `fallback` | `ReactNode` | Loading UI (shown during Suspense) |
| `disabled` | `boolean` | Skip rendering entirely |

## Reactive SQL Hooks

### `useSql`

Creates a SQL fragment QueryRef. Dependencies are resolved as subqueries.

```tsx
import { useSql } from '@the-aiway/query/reducks';

const active = useSql(
  (t) => `SELECT * FROM ${t.base} WHERE status = 'active'`,
  { base: someTableRef }
);

// Consume with Suspense
const rows = use(active.rows());

// Or with useRows (no Suspense)
const [rows, { isLoading, error }] = active.useRows();
```

### `useTable`

Creates a materialized table QueryRef (written to DuckDB as a temp table).

```tsx
import { useTable } from '@the-aiway/query/reducks';

const cached = useTable(
  (t) => `SELECT * FROM ${t.source} WHERE amount > 100`,
  { source: rawDataRef }
);
```

### `useValues`

Creates a QueryRef from an in-memory array.

```tsx
import { useValues } from '@the-aiway/query/reducks';

const cutoffs = useValues(
  [{ region: 'US', min: 100 }, { region: 'EU', min: 200 }],
  { region: 'VARCHAR', min: 'INT' }
);
```

### `useStore`

Creates a mutable store backed by a DuckDB table with a typed schema.

```tsx
import { useStore } from '@the-aiway/query/reducks';

const store = useStore({ name: 'VARCHAR', value: 'DOUBLE' });
// store.insert([{ name: 'x', value: 42 }])
// store.clear()
```

### `useRows` / `useRow`

Non-Suspense hooks that resolve a QueryRef with loading/error state.

```tsx
import { useRows, useRow } from '@the-aiway/query/reducks';

const [rows, { isLoading, error }] = useRows(myRef);
const [row, { isLoading, error }] = useRow(myRef);

// Also available as methods on the ref:
const [rows, meta] = myRef.useRows();
const [row, meta] = myRef.useRow();
```

### `fromArrow`

Creates a QueryRef from an existing Arrow Table (non-hook, for imperative use).

```tsx
import { fromArrow } from '@the-aiway/query/reducks';
import { tableFromJSON } from 'apache-arrow';

const ref = fromArrow(tableFromJSON(data));
```

### Imperative API (`re`)

For use outside React components (event handlers, server-side, scripts):

```tsx
import { re } from '@the-aiway/query';

const stats = re.sql(
  (t) => `SELECT COUNT(*) as n FROM ${t.orders}`,
  { orders: re.table(() => `SELECT * FROM raw_orders`) }
);

const rows = await stats.rows();
```

## QueryRef Consumption

| Context | Rows | Single Row |
| --- | --- | --- |
| `await` | `ref.rows()` | `ref.row()` |
| Suspense | `use(ref.rows())` | `use(ref.row())` |
| Hook | `ref.useRows()` | `ref.useRow()` |
| Arrow | `ref.arrowTable()` | - |

### Parameter Proxy

The template function receives a proxy with SQL-safe interpolation:

```tsx
const filtered = useSql(
  (t) => `SELECT * FROM ${t.base} ${t.where({ status: 'active', age: { $gte: 18 } })}`,
  { base: tableRef }
);
```

Available condition helpers: `t.eq()`, `t.neq()`, `t.gt()`, `t.gte()`, `t.lt()`, `t.lte()`, `t.between()`, `t.in()`, `t.like()`, `t.ilike()`, `t.where()`.

Raw (unescaped) values via `t.raw.paramName`.

## Runtime Setup

The reducks engine requires a `DuckRuntime` to execute SQL. Call `setRuntime()` once after the DuckDB instance is available:

```tsx
import { setRuntime } from '@the-aiway/query/reducks';

setRuntime({
  async exec(sql: string) {
    // Must return { rows?, toArray?, row?, arrowTable?, raw? }
    const table = await pool.queryIPCTable(sql);
    return { rows: () => table.toArray().map(r => r?.toJSON?.()), arrowTable: table, raw: table };
  },
  async insertArrow(name: string, arrowTable: unknown) {
    const conn = await pool.acquire();
    try { await conn.insertArrowTable(arrowTable, { name, create: true }); }
    finally { pool.release(conn); }
  },
});
```

## Custom Cell Rendering

```tsx
<QueryTable
  id="products"
  table={data}
  renderCell={({ colName, rawValue, display }) => {
    if (colName === 'status') {
      return <span className={`status-${rawValue}`}>{display}</span>;
    }
    return undefined; // default rendering
  }}
/>
```

## Custom Row Styling

```tsx
<QueryTable
  id="orders"
  table={data}
  getRowClassName={({ get, rowIndex }) => {
    if (get('status') === 'urgent') return 'bg-red-100';
    if (get('status') === 'completed') return 'bg-green-100';
    return '';
  }}
/>
```

## Styling

Query uses Tailwind CSS. Add the library's content path to your Tailwind config:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@the-aiway/query/**/*.{ts,tsx}',
  ],
};
```

## Storybook

```bash
bun run storybook
```

Interactive DataTable stories with a live DuckDB WASM instance at `http://localhost:6006`.

## Architecture

```
QueryClientProvider (@tanstack/react-query)
  └── DuckQueryWasmProvider
        ├── Initializes DuckDB-WASM (auto-selects best bundle)
        ├── Manages ConnectionPool
        └── Provides DuckDBContext
              └── RuntimeBridge (setRuntime)
                    └── QueryTable
                          ├── TabProvider (multi-source tabs)
                          ├── QueryTableProvider (state: filters, sorting, sizing)
                          ├── Datasource hooks (schema, count, summaries, sizes)
                          ├── VirtualizedViewport (@tanstack/react-virtual)
                          └── Headers + Cell + OptionsFilter/RangeFilter
```

## Key Concepts

- **QueryRef** (`Duckable`): Content-addressed SQL reference. Same SQL string = same ref = same cached result. Implements `Promise` — can be `await`ed directly for rows.
- **Fragment vs Table**: Fragments (`useSql`) are inlined as subqueries. Tables (`useTable`) are materialized into DuckDB temp tables.
- **Materialization chain**: Before executing, the engine walks the dependency tree and materializes any non-fragment refs (arrow tables, stores, opfs files).
- **Connection pool**: Reuses DuckDB connections. Queues requests when all connections are busy.
- **Page-based fetching**: VirtualizedViewport loads 1000-row pages on scroll.

## Contributing

Contributions are welcome! This component is built with:

- React 18/19
- DuckDB-WASM
- TanStack (Query, Table, Virtual)
- Radix UI
- Tailwind CSS

### Releasing

`main` is protected and has no bypass actors, so the version commit cannot be
pushed to it directly. A stable release is therefore two steps:

```sh
bun run release:major     # on main: bumps package.json on a branch, opens the PR
# ...merge that PR...
git checkout main && git pull
bun run release:publish   # tags the merge commit and publishes
```

`release:patch` and `release:minor` work the same way. `release:publish`
refuses to run if the tag already exists or the version is already on the
registry, so it is safe to re-run after a partial failure.

Release candidates skip the PR entirely — the ruleset only covers `main`, so an
rc is committed, tagged and published straight from a feature branch, which is
the point: try it against a consumer before it lands.

```sh
bun run release:rc        # on a feature branch -> x.y.z-rc.N, published under the beta tag
```

## License

MIT — see [LICENSE](./LICENSE) for details.

## Support

For issues and questions:

- Open an issue on GitHub
- Check existing discussions
- Review the API documentation above

---

Built with [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) and [TanStack](https://tanstack.com/)
