# Query - DuckDB-Powered Data Table for React (EXPERIMENTAL)

A high-performance, feature-rich React data table component that brings SQL analytics directly to the browser using DuckDB WebAssembly. Query enables interactive data exploration with virtual scrolling, dynamic filtering, and real-time SQL execution—all without backend infrastructure.

## Features

### Data Handling
- **Multiple Data Sources**: SQL queries, JSON arrays, Apache Arrow tables
- **In-Browser SQL Analytics**: Full DuckDB SQL capabilities with zero backend setup
- **Type-Aware Rendering**: Automatic formatting for dates, numbers, booleans, UUIDs, and nested structures
- **Large Dataset Support**: Virtual scrolling and pagination for millions of rows

### Interactive Features
- **Dynamic Filtering**: Global text search and column-specific filters (categorical & range)
- **Column Management**: Show/hide, resize, pin, and reorder columns
- **Sorting**: Click headers to sort data
- **SQL Query Editing**: Edit queries inline with parameter support
- **CSV Export**: Download filtered/sorted data

### Performance
- **Virtual Scrolling**: Renders only visible rows using TanStack Virtual
- **Connection Pooling**: Reuses DuckDB connections for optimal performance
- **Smart Caching**: React Query integration with automatic deduplication
- **Optimized Queries**: Page-based data fetching (1000 rows per page)

### Developer Experience
- **TypeScript Native**: Full type inference for SQL queries
- **Flexible API**: Simple for basic use, powerful for advanced scenarios
- **Custom Cell Rendering**: Override default formatting with custom components
- **Headless UI**: Built with Radix UI primitives for accessibility

## Installation

```bash
npm install the-aiway/query#main # or better: the sha1 of the commit
```

### Peer Dependencies

You'll need to install these peer dependencies in your project:

```bash
npm install react @duckdb/duckdb-wasm @tanstack/react-query @tanstack/react-table @tanstack/react-virtual apache-arrow
```

## Quick Start

### 1. Wrap Your App with the Provider

```tsx
import { DuckQueryWasmProvider } from 'query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DuckQueryWasmProvider>
        <YourComponents />
      </DuckQueryWasmProvider>
    </QueryClientProvider>
  );
}
```

### 2. Display Data with QueryTable

#### From a SQL Query

```tsx
import { QueryTable, query } from 'query';

function MyComponent() {
  return (
    <QueryTable
      table={query('SELECT * FROM my_table WHERE status = ?', ['active'])}
      height={600}
    />
  );
}
```

#### From JSON Data

```tsx
import { QueryTable, fromJSON } from 'query';

function MyComponent() {
  const data = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 35 },
  ];

  return <QueryTable table={fromJSON(data)} height={600} />;
}
```

#### From Apache Arrow

```tsx
import { QueryTable } from 'query';
import { tableFromJSON } from 'apache-arrow';

function MyComponent() {
  const arrowTable = tableFromJSON([
    { product: 'Widget', sales: 1200 },
    { product: 'Gadget', sales: 850 },
  ]);

  return <QueryTable table={{ type: 'arrow', table: arrowTable }} height={600} />;
}
```

## API Reference

### `<QueryTable>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `table` | `DataTableSource \| string \| Record<string, unknown>[] \| Table` | - | Data source for the table |
| `sql` | `string` | - | SQL query (legacy, use `table` instead) |
| `params` | `unknown[]` | - | SQL parameters for parameterized queries |
| `height` | `number` | - | Table height in pixels |
| `rowHeight` | `number` | `35` | Height of each row in pixels |
| `overscan` | `number` | `10` | Number of rows to render outside viewport |
| `enableFilters` | `boolean` | `true` | Enable column filtering |
| `showRowNumbers` | `boolean` | `false` | Show fixed row number column |
| `colDefaultWidth` | `number` | `140` | Default column width |
| `colMinWidth` | `number` | `80` | Minimum column width |
| `colMaxWidth` | `number` | `180` | Maximum column width |
| `getRowClassName` | `function` | - | Custom row className function |
| `renderCell` | `function` | - | Custom cell renderer |

### Helper Functions

#### `query(sql, params?)`

Creates a SQL data source with optional parameters.

```tsx
query('SELECT * FROM users WHERE age > ?', [18])
```

#### `fromJSON(data, tableName?)`

Creates a data source from an array of objects.

```tsx
fromJSON([{ id: 1, name: 'Alice' }], 'users')
```

### Custom Cell Rendering

Override default cell rendering for specific use cases:

```tsx
<QueryTable
  table={query('SELECT * FROM products')}
  renderCell={({ colName, rawValue, display, type }) => {
    if (colName === 'status') {
      return (
        <span className={`status-${rawValue}`}>
          {display}
        </span>
      );
    }
    // Return undefined to use default rendering
    return undefined;
  }}
/>
```

### Custom Row Styling

Apply conditional styling to rows:

```tsx
<QueryTable
  table={query('SELECT * FROM orders')}
  getRowClassName={({ get, rowIndex }) => {
    const status = get('status');
    if (status === 'urgent') return 'bg-red-100';
    if (status === 'completed') return 'bg-green-100';
    return '';
  }}
/>
```

## Advanced Usage

### Using SQL Hooks (EXPERIMENTAL)

Query data directly in your components with type inference:

```tsx
import { useSql } from 'query';

function UserList() {
  const { data, isLoading, error } = useSql({
    sql: 'SELECT id, name, email FROM users WHERE status = ?',
    params: ['active'],
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name} - {user.email}</li>
      ))}
    </ul>
  );
}
```

### Creating Derived Tables (EXPERIMENTAL)

Create reusable, cached table views:

```tsx
import { useTable, useSql } from 'query';

function Dashboard() {
  // Register a derived table
  const { tableName } = useTable({
    tableName: 'active_users',
    sql: 'SELECT * FROM users WHERE status = ?',
    params: ['active'],
  });

  // Use it in subsequent queries
  const { data: summary } = useSql({
    sql: `SELECT COUNT(*) as count, AVG(age) as avg_age FROM ${tableName}`,
  });

  return <div>Active users: {summary?.[0]?.count}</div>;
}
```

### Loading External Files

Load CSV, Parquet, or JSON files:

```tsx
import { useFile } from 'query';

function FileAnalyzer() {
  
  const {
    data: { name: tableName },
    isLoading
  } = useFile(
    'sales_data',
    'https://example.com/data.csv'
  );

  if (isLoading) return <div>Loading file...</div>;

  return (
    <QueryTable
      table={query(`SELECT * FROM ${tableName}`)}
      height={600}
    />
  );
}
```

### Custom DuckDB Configuration

Configure DuckDB with custom settings:

```tsx
import { DuckQueryWasmProvider } from 'query';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';

function App() {
  return (
    <DuckQueryWasmProvider
      config={{
        mainModule: duckdb_wasm,
        mainWorker: duckdb_worker,
        logQueries: true, // Enable query logging
      }}
      connectionPoolSize={8} // Increase connection pool
    >
      <YourApp />
    </DuckQueryWasmProvider>
  );
}
```

## Type Safety

Query provides full TypeScript type inference for SQL results:

```tsx
import { useSql, type InferSQL } from 'query';

const query = 'SELECT id, name, email FROM users' as const;

function TypedComponent() {
  const { data } = useSql({ sql: query });

  // TypeScript knows the shape of data:
  // data: Array<{ id: number, name: string, email: string }>

  return data?.map(user => (
    <div key={user.id}>{user.name}</div>
  ));
}

// Or use explicit type inference
type User = InferSQL<typeof query>[number];
```

## Styling

Query uses Tailwind CSS for styling. Ensure Tailwind is configured in your project:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/query/**/*.{js,ts,jsx,tsx}', // Add this line
  ],
  // ... rest of config
};
```

## Performance Tips

1. **Use Pagination**: The component automatically paginates large datasets (1000 rows per page)
2. **Enable Filtering**: Filters are applied at the SQL level, not in memory
3. **Connection Pooling**: Increase `connectionPoolSize` for concurrent queries
4. **Column Summaries**: Disable if not needed for faster initial load
5. **Virtual Scrolling**: Adjust `overscan` based on row complexity

## Browser Support

- Chrome/Edge 89+
- Firefox 89+
- Safari 15.2+

Requires WebAssembly and SharedArrayBuffer support.

## Architecture

```
DuckQueryWasmProvider
  ├── Initializes DuckDB-WASM
  ├── Manages connection pool
  └── Provides database context
      └── QueryTable
          ├── Schema detection
          ├── Data fetching (paginated)
          ├── Virtual scrolling
          ├── Column management
          └── Filter/sort application
```

## Examples

Check out these common use cases:

### Analytics Dashboard

```tsx
function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <QueryTable
        table={query('SELECT date, SUM(revenue) as total FROM sales GROUP BY date')}
        height={400}
      />
      <QueryTable
        table={query('SELECT product, COUNT(*) as orders FROM sales GROUP BY product')}
        height={400}
      />
    </div>
  );
}
```

### Real-time Data Exploration

```tsx
function DataExplorer() {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM transactions');

  return (
    <div>
      <textarea
        value={sqlQuery}
        onChange={(e) => setSqlQuery(e.target.value)}
        className="w-full mb-4"
      />
      <QueryTable table={query(sqlQuery)} height={600} />
    </div>
  );
}
```

## Contributing

Contributions are welcome! This component is built with:

- React 18/19
- DuckDB-WASM
- TanStack (Query, Table, Virtual)
- Radix UI
- Tailwind CSS

## License

[Add your license here]

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing discussions
- Review the API documentation above

---

Built with [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) and [TanStack](https://tanstack.com/)
