# useSqlQuery Specification

## Overview

`useSqlQuery` is a React hook for executing DuckDB queries with optional dependency management, automatic table registration via context, and TanStack Query-like state handling.

Key features:
- **Named tables** are registered in a React context, allowing other queries to reference them by name
- **TanStack Query Integration** — uses `useQuery` internally for robust state management, caching, and deduplication
- **Transient query deduplication** — identical queries (same SQL, params, and dependencies) share the same execution and state
- **Alias = table name** — no SQL rewriting, what you write is what DuckDB sees
- **Named parameters** using `$name` syntax (e.g., `$city`) instead of positional `$1, $2`
- **Opt-in reactivity** via explicit dependency arrays
- **Zero-copy performance** using `insertArrowTable` instead of `CREATE TABLE AS`

---

## API

### Overload 1: Named Table Creation

```typescript
const orders = useSqlQuery({
  orders: `SELECT * FROM '/api/orders.parquet'`
});
```

**Parameters:**
- `queries: Record<string, string>` — Object with a single key (the alias) and SQL value.

**Returns:**
- `QueryHandle` — Handle for the query result, with `.alias` set to the key.

**Behavior:**
1. Checks if alias is already registered (see [Collision Handling](#collision-handling))
2. **Immediately registers** a pending handle with a promise in `SqlQueryContext`
3. Executes the SQL query → Arrow Table
4. Calls `insertArrowTable(table, { name: alias })`
5. Resolves the handle (updates status, data, updatedAt)
6. Returns the handle

**Key point:** Registration happens immediately (step 2), before execution completes. This allows sibling queries to reference the table while it's still loading — they await the handle's promise.

---

### Overload 2: Named Table with Dependencies

```typescript
const cityStats = useSqlQuery({
  city_stats: `SELECT city, COUNT(*) as cnt FROM orders GROUP BY city`
}, [orders]);
```

**Parameters:**
- `queries: Record<string, string>` — Object with alias and SQL.
- `dependencies: Dependency[]` — Array of handles and/or primitive keys.

**Returns:**
- `QueryHandle` — Handle with `.alias` set.

**Behavior:**
- Waits for all dependencies to resolve (their promises must complete).
- Executes the SQL query (table names are used as-is, no rewriting).
- Registers alias in context.
- **Reactive**: Re-executes when any dependency's `updatedAt` changes.

---

### Overload 3: Simple Query (Static)

```typescript
const result = useSqlQuery(`SELECT COUNT(*) FROM orders`);
```

**Parameters:**
- `sql: string` — The SQL query.

**Returns:**
- `QueryHandle` — Handle without `.alias` (transient query).

**Behavior:**
- Executes immediately (does NOT auto-detect or wait for tables in SQL).
- **Not reactive**: Runs once at mount.

**Important:** If the query references a table that doesn't exist yet, DuckDB will throw an error. To wait for a table, pass it as a dependency explicitly.

---

### Overload 4: Query with Dependencies (Reactive)

```typescript
const result = useSqlQuery(
  `SELECT COUNT(*) FROM orders`,
  [orders]
);
```

**Parameters:**
- `sql: string` — The SQL query.
- `dependencies: Dependency[]` — Array of handles and/or primitive keys.

**Returns:**
- `QueryHandle` — Handle without `.alias`.

**Behavior:**
- Waits for all dependencies to resolve.
- Executes the SQL query (table names are used as-is).
- **Reactive**: Re-executes when any dependency's `updatedAt` changes.

---

### Overload 5: Query with Named Params (Static)

```typescript
const result = useSqlQuery(
  `SELECT * FROM orders WHERE city = $city AND status = $status`,
  { city: 'Paris', status: 'active' }
);
```

**Parameters:**
- `sql: string` — SQL with named parameter placeholders (`$name`).
- `params: Record<string, unknown>` — Object mapping parameter names to values.

**Returns:**
- `QueryHandle`

**Behavior:**
- Executes immediately (does NOT auto-detect tables).
- Rewrites `$city` → `$1`, `$status` → `$2` internally (by scanning SQL in order).
- **Not reactive** to table changes, but re-runs if `params` change.

---

### Overload 6: Query with Named Params and Dependencies (Reactive)

```typescript
const result = useSqlQuery(
  `SELECT * FROM orders WHERE city = $city AND status = $status`,
  { city: 'Paris', status: 'active' },
  [orders]
);
```

**Parameters:**
- `sql: string` — SQL with named placeholders.
- `params: Record<string, unknown>` — Parameter object.
- `dependencies: Dependency[]` — Dependency handles and/or primitive keys.

**Returns:**
- `QueryHandle`

**Behavior:**
- **Reactive**: Re-runs when params or dependencies change.

---

## Overload Detection

The hook detects which overload based on argument types:
- First arg is **object** → named table creation
- Second arg is **object** → params; second arg is **array** → deps
- Third arg (if present) is always deps

```typescript
type Dependency = QueryHandle | string | number | boolean | null;

function isQueryHandle(d: Dependency): d is QueryHandle {
  return d !== null && typeof d === 'object' && 'tableId' in d && 'updatedAt' in d;
}
```

---

## QueryHandle Interface

```typescript
interface QueryHandle<T = unknown> {
  alias: string | null;               // User-provided name (null for transient queries)
  tableId: string;                    // DuckDB table name (same as alias)
  sql: string;                        // Original SQL
  params: Record<string, unknown>;    // Named parameters

  status: 'pending' | 'success' | 'error';
  isPending: boolean;       // True when loading and NO data yet
  isFetching: boolean;      // True when loading (initial or refetch)
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;

  table: Table | null;                // Apache Arrow Table
  data: T[] | null;                   // Materialized JS objects (lazy)

  duration: number | null;            // Execution time in ms
  updatedAt: number | null;           // Timestamp of last success

  promise: Promise<void>;             // For async chaining

  refetch(): Promise<void>;           // Re-execute the query
  toString(): string;                 // Returns tableId
}
```

---

## Named Parameters

Use `$name` in SQL, pass an object with matching keys:

```typescript
const result = useSqlQuery(
  `SELECT * FROM orders WHERE city = $city AND amount > $minAmount`,
  { city: 'Paris', minAmount: 100 }
);
```

A parameter can appear multiple times:

```typescript
`SELECT * FROM orders WHERE origin = $city OR destination = $city`
// Both use the same $1 binding
```

**Implementation:** Parameters are rewritten by scanning SQL in order of appearance. String literals and comments are masked first to avoid matching `$name` inside them.

```typescript
function rewriteNamedParams(
  sql: string,
  params: Record<string, unknown>
): { sql: string; values: unknown[] } {
  // Mask string literals and comments to avoid matching params inside them
  const masked_parts: string[] = [];
  let masked = sql
    // Mask single-line comments
    .replace(/--.*$/gm, (match) => {
      masked_parts.push(match);
      return `__MASK_${masked_parts.length - 1}__`;
    })
    // Mask multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, (match) => {
      masked_parts.push(match);
      return `__MASK_${masked_parts.length - 1}__`;
    })
    // Mask string literals
    .replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
      masked_parts.push(match);
      return `__MASK_${masked_parts.length - 1}__`;
    });

  const values: unknown[] = [];
  const nameToIndex = new Map<string, number>();
  const paramPattern = /\$([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  let match;
  
  while ((match = paramPattern.exec(masked)) !== null) {
    const name = match[1];
    if (!nameToIndex.has(name)) {
      if (!(name in params)) {
        throw new Error(`Parameter "$${name}" not found in params object`);
      }
      nameToIndex.set(name, values.length + 1);
      values.push(params[name]);
    }
  }

  for (const name of Object.keys(params)) {
    if (!nameToIndex.has(name)) {
      throw new Error(`Parameter "${name}" provided but not used in SQL`);
    }
  }

  // Rewrite params in masked SQL
  for (const [name, index] of nameToIndex) {
    masked = masked.replace(new RegExp(`\\$${name}\\b`, 'g'), `$${index}`);
  }

  // Restore masked parts (strings and comments)
  const rewrittenSql = masked.replace(/__MASK_(\d+)__/g, (_, i) => masked_parts[parseInt(i)]);

  return { sql: rewrittenSql, values };
}
```

---

## Alias Validation

Aliases must be valid DuckDB identifiers to prevent SQL injection and ensure compatibility:

```typescript
const VALID_ALIAS = /^[A-Za-z_][A-Za-z0-9_]*$/;

function validateAlias(alias: string): void {
  if (!VALID_ALIAS.test(alias)) {
    throw new Error(
      `Invalid alias "${alias}". ` +
      `Aliases must start with a letter or underscore, followed by letters, digits, or underscores.`
    );
  }
  
  // Optional: check against reserved words
  const RESERVED = ['select', 'from', 'where', 'table', 'index', ...];
  if (RESERVED.includes(alias.toLowerCase())) {
    throw new Error(`Alias "${alias}" is a reserved SQL keyword.`);
  }
}
```

This validation runs before any registration or query execution.

---

## Transient Query Deduplication

Transient queries (those without an alias) are automatically deduplicated using TanStack Query's caching mechanism.

### Mechanism

1. **Key Generation**: A unique `queryKey` is generated for each query:
   `['sql-query', lookupKey]` where `lookupKey` is either the alias or a hash-based key for transient queries.
2. **Sharing**: Multiple components calling `useSqlQuery` with the same key will share the same query state and execution.
3. **Lifecycle**: Queries are automatically cleaned up by TanStack Query's garbage collector when no longer in use.
4. **Execution**: The `queryFn` handles dependency awaiting, SQL parameter rewriting, and DuckDB execution.

### Example

```typescript
// Component A
const stats = useSqlQuery('SELECT COUNT(*) FROM orders', [orders]);

// Component B (same query)
const stats = useSqlQuery('SELECT COUNT(*) FROM orders', [orders]);

// Both share the same execution (refCount = 2)
```

---

## Collision Handling

### Same Name, Same SQL → Share

```typescript
// Component A
const orders = useSqlQuery({ orders: 'SELECT * FROM parquet_file' });

// Component B (same SQL)
const orders = useSqlQuery({ orders: 'SELECT * FROM parquet_file' });

// Both get the same handle (refCount = 2)
```

### Same Name, Different SQL → Error

```typescript
// Component A
const orders = useSqlQuery({ orders: 'SELECT * FROM file_v1' });

// Component B (different SQL!)
const orders = useSqlQuery({ orders: 'SELECT * FROM file_v2' }); // 💥 Error!
```

### SQL Normalization

Before comparing, SQL is normalized (preserving string literals):

```typescript
function normalizeSQL(sql: string): string {
  const strings: string[] = [];
  let normalized = sql.replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
    strings.push(match);
    return `__STR_${strings.length - 1}__`;
  });

  normalized = normalized
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/;\s*$/, '')
    .trim();

  normalized = normalized.replace(/__STR_(\d+)__/g, (_, i) => strings[parseInt(i)]);
  return normalized;
}
```

---

## Reactivity

### Static Queries (No Deps)

- Run once at mount, immediately
- Do NOT wait for tables (no implicit discovery)
- Do NOT re-run when tables update
- If a table doesn't exist, DuckDB throws an error

**To wait for a table, pass it as a dep:**
```typescript
// BAD: might fail if orders isn't ready
const stats = useSqlQuery('SELECT COUNT(*) FROM orders');

// GOOD: waits for orders, but still only runs once
const stats = useSqlQuery('SELECT COUNT(*) FROM orders', [orders]);
```

### Reactive Queries (With Deps)

- Run when mounted and when any dep changes
- Track changes via `updatedAt` timestamp

### Mixed Dependencies

Deps can be `QueryHandle` or primitives (`string | number | boolean | null`):

```typescript
const [refreshKey, setRefreshKey] = useState(0);
const stats = useSqlQuery('SELECT ...', [orders, refreshKey]);
// Re-runs when orders changes OR refreshKey changes
```

**Serialization:**
```typescript
const depsKey = deps.map(d => 
  isQueryHandle(d) ? `handle:${d.tableId}:${d.updatedAt}` : `val:${String(d)}`
).join(',');
```

**Why primitives only?** Objects require deep comparison or `JSON.stringify`, which is fragile (key order, cycles, undefined, BigInt).

---

## Lifecycle

### Registration

```typescript
interface RegisteredTable {
  handle: QueryHandle;
  normalizedSql: string;
  refCount: number;
}
```

1. **Mount** → Check for collision → Register pending handle → Execute → Update handle in place
2. **Concurrent mount (same SQL)** → Return existing handle, increment refCount
3. **Unmount** → Decrement refCount; if 0, drop table

### Refetch with Shared Tables

When one consumer calls `refetch()`:
- All consumers see the update (shared handle)
- `updatedAt` changes, triggering reactive dependents

**Concurrent refetch deduplication:** If `refetch()` is called while a refetch is already in-flight, the second call shares the same promise (no double-fetch):

```typescript
interface RegisteredTable {
  handle: QueryHandle;
  normalizedSql: string;
  refCount: number;
  inflight: Promise<void> | null;  // Current refetch promise
}

async function refetch(alias: string): Promise<void> {
  const entry = registry.get(alias);
  if (!entry) return;
  
  // If already refetching, return existing promise
  if (entry.inflight) {
    return entry.inflight;
  }
  
  // Start new refetch
  entry.inflight = executeQuery(entry.handle.sql).then(
    (result) => {
      entry.handle.table = result.table;
      entry.handle.updatedAt = Date.now();
      entry.handle.status = 'success';
    },
    (error) => {
      entry.handle.error = error;
      entry.handle.status = 'error';
    }
  ).finally(() => {
    entry.inflight = null;
  });
  
  return entry.inflight;
}
```

### Grace Period for Dropping

When refCount reaches 0, tables are not dropped immediately. A short grace period (e.g., 1000ms) allows for navigation scenarios where a table is unmounted and remounted quickly:

```typescript
function unregisterTable(alias: string) {
  const existing = registry.get(alias);
  if (existing) {
    existing.refCount--;
    if (existing.refCount === 0) {
      // Grace period: don't drop immediately
      setTimeout(() => {
        // Re-check: if still 0, drop it
        if (existing.refCount === 0) {
          registry.delete(alias);
          connection.query(`DROP TABLE IF EXISTS ${alias}`);
        }
      }, 1000);
    }
  }
}
```

This prevents unnecessary re-fetching when navigating between pages that share the same table.

---

## Context Provider

```typescript
<SqlQueryProvider>
  <App />
</SqlQueryProvider>
```

Tables are scoped to their provider. Different providers have independent registries.

---

## Table Storage

Uses `insertArrowTable` instead of `CREATE TABLE AS`:

| Approach | Speed | Memory |
|----------|-------|--------|
| `CREATE TABLE AS` | Slow (copies data) | 2x |
| `insertArrowTable` | Fast (zero-copy) | 1x |

```typescript
await connection.insertArrowTable(arrowTable, {
  name: alias,
  create: true,
  replace: true
});
```

---

## Error Handling

### Query Errors

```typescript
const result = useSqlQuery('SELECT * FROM nonexistent');
// result.status === 'error'
// result.error.message === 'Table nonexistent not found'
```

### Dependency Errors

```typescript
const orders = useSqlQuery({ orders: 'SELECT * FROM bad_source' }); // Fails
const stats = useSqlQuery('SELECT COUNT(*) FROM orders', [orders]);
// stats.status === 'error'
// stats.error.message === 'Dependency "orders" failed: ...'
```

---

## Usage Examples

### Basic

```typescript
function Stats() {
  const result = useSqlQuery('SELECT COUNT(*) as total FROM users');
  if (result.isPending) return <Spinner />;
  if (result.isError) return <Error error={result.error} />;
  return <div>{result.data?.[0]?.total}</div>;
}
```

### Named Table + Consumers

```typescript
function Dashboard({ orgId }) {
  const orders = useSqlQuery({
    orders: `SELECT * FROM '/api/export/${orgId}/orders.parquet'`
  });

  // Static: waits for orders, runs once
  const total = useSqlQuery('SELECT COUNT(*) FROM orders');

  // Reactive: re-runs when orders changes
  const stats = useSqlQuery('SELECT COUNT(*) FROM orders', [orders]);
}
```

### With Params

```typescript
const filtered = useSqlQuery(
  'SELECT * FROM orders WHERE city = $city AND amount > $min',
  { city: 'Paris', min: 100 },
  [orders]
);
```

### Chained

```typescript
const orders = useSqlQuery({ orders: 'SELECT ...' });
const cityStats = useSqlQuery({ city_stats: 'SELECT ... FROM orders' }, [orders]);
const top10 = useSqlQuery('SELECT * FROM city_stats LIMIT 10', [cityStats]);
```

---

## Debugging

In development mode, expose a debug helper on `window` to inspect registered tables:

```typescript
if (process.env.NODE_ENV === 'development') {
  window.__SQL_QUERY_DEBUG__ = {
    getTables: () => Array.from(registry.entries()).map(([alias, entry]) => ({
      alias,
      status: entry.handle.status,
      refCount: entry.refCount,
      sql: entry.normalizedSql.slice(0, 100) + '...',
    })),
    getTable: (alias: string) => registry.get(alias)?.handle,
  };
}
```

Usage in browser console:
```javascript
__SQL_QUERY_DEBUG__.getTables()
// [{ alias: 'orders', status: 'success', refCount: 2, sql: 'SELECT * FROM ...' }]
```

---

## Key Invariants

1. **Alias = Table Name** — No hashing, no prefixing. What you write is what DuckDB sees.

2. **Alias must be valid identifier** — `/^[A-Za-z_][A-Za-z0-9_]*$/`, no reserved words.

3. **Registration is immediate** — Handle registered in `pending` state before query executes.

4. **Handles update in place** — All consumers of a shared handle see the same state.

5. **No implicit table discovery** — Queries do NOT auto-detect tables from SQL. To wait for a table, pass it in `[deps]`.

6. **Reactivity requires deps** — Only re-runs if dependency is in `[deps]` array.

7. **Deps are primitives + handles** — No objects. Use `string | number | boolean | null | QueryHandle`.

8. **Same alias + same SQL = shared** — Multiple registrations share one handle.

9. **Same alias + different SQL = error** — Throws immediately.

10. **Concurrent refetch dedupes** — Multiple `refetch()` calls share the same in-flight promise.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Alias = table name** | Debuggable, no magic. Collisions caught via normalized SQL comparison. |
| **Named params (`$city`)** | Self-documenting, no array/array ambiguity, refactoring-safe. |
| **`insertArrowTable`** | Zero-copy, 10-100x faster than `CREATE TABLE AS`. |
| **Opt-in reactivity** | Explicit deps, no accidental re-renders. |
| **Primitives-only deps** | `JSON.stringify` on objects is fragile. Compute string keys if needed. |
| **Context + shared promises** | Scoped sharing, no double-fetch on concurrent mounts. |
| **Explicit state (not Suspense)** | Stale-while-revalidate UX, SQL editor stays visible during load. |
| **Structural type guard** | `QueryHandle` is interface, `instanceof` doesn't work across modules. |

