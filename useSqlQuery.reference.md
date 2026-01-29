# useSqlQuery Specification

## Overview

`useSqlQuery` is a React hook for executing DuckDB queries with:
- **Named tables** registered in context, referenceable by alias
- **TanStack Query** powered state management and caching
- **Transient query deduplication** via hash-based caching
- **Named parameters** (`$city`) instead of positional (`$1`)
- **Opt-in reactivity** via dependency arrays
- **Zero-copy performance** via `insertArrowTable`

---

## API

### Named Table

```typescript
const orders = useSqlQuery({ orders: 'SELECT * FROM parquet_file' });
const cityStats = useSqlQuery({ city_stats: 'SELECT ...' }, [orders]);
```

### Query

```typescript
// Static (runs once)
useSqlQuery('SELECT COUNT(*) FROM orders')
useSqlQuery('SELECT * FROM orders WHERE city = $city', { city: 'Paris' })

// Reactive (re-runs when deps change)
useSqlQuery('SELECT COUNT(*) FROM orders', [orders])
useSqlQuery('SELECT * FROM orders WHERE city = $city', { city: 'Paris' }, [orders])
```

### Overload Detection

- First arg is **object** → named table creation
- Second arg is **object** → params; **array** → deps
- Third arg is always deps

```typescript
type Dependency = QueryHandle | string | number | boolean | null;

function isQueryHandle(d: Dependency): d is QueryHandle {
  return d !== null && typeof d === 'object' && 'tableId' in d && 'updatedAt' in d;
}
```

---

## QueryHandle

```typescript
interface QueryHandle<T = unknown> {
  alias: string | null;
  tableId: string;                    // Same as alias
  sql: string;
  params: Record<string, unknown>;

  status: 'pending' | 'success' | 'error';
  isPending: boolean;       // No data yet
  isFetching: boolean;      // Loading (initial or refetch)
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;

  table: Table | null;                // Arrow Table
  data: T[] | null;                   // Materialized (lazy)
  duration: number | null;
  updatedAt: number | null;
  promise: Promise<void>;

  refetch(): Promise<void>;
  toString(): string;                 // Returns alias
}
```

---

## Key Invariants

1. **Alias = Table Name** — No hashing. `orders` in code = `orders` in DuckDB.

2. **Alias must be valid identifier** — `/^[A-Za-z_][A-Za-z0-9_]*$/`

3. **Registration is immediate** — Handle is registered in `pending` state before query executes.

4. **Handles update in place** — All consumers of a shared handle see the same state.

5. **No implicit table discovery** — Queries do NOT auto-detect tables. Pass deps explicitly.

6. **Reactivity requires deps** — Only re-runs if dependency is in `[deps]` array.

7. **Deps are primitives + handles** — No objects. Use `string | number | boolean | null | QueryHandle`.

8. **Same alias + same SQL = shared** — Multiple registrations share one handle.

9. **Same alias + different SQL = error** — Throws immediately.

10. **Concurrent refetch dedupes** — Multiple `refetch()` calls share in-flight promise.

---

## Named Parameters

```typescript
useSqlQuery(
  'SELECT * FROM orders WHERE city = $city AND amount > $min',
  { city: 'Paris', min: 100 }
)
```

**Rewriting:** Scans SQL in order, maps `$city` → `$1`, `$min` → `$2`. Same param used multiple times gets same index.

**Validation:** Throws if param in SQL not in object, or param in object not in SQL.

---

## Collision Handling

**Same SQL** (after normalization) → share table, increment refCount.

**Different SQL** → throw error with both SQL strings.

**Normalization:**
- Collapse whitespace
- Remove comments
- Remove trailing semicolon
- Preserve string literals and case

---

## Reactivity

| Query Type | Waits for deps? | Re-runs on change? |
|------------|-----------------|-------------------|
| Static (no deps) | N/A | No |
| With deps | Yes | Yes |

**No implicit table discovery.** Queries do NOT auto-detect tables from SQL. To wait for a table, pass it in deps.

**Deps are invalidation signals, not data dependencies.** Use QueryHandles or primitive keys — never derived data.

**Deps serialization:**
```typescript
const depsKey = deps.map(d => 
  isQueryHandle(d) ? `${d.tableId}:${d.updatedAt}` : String(d)
).join(',');
```

---

## Transient Query Deduplication

Identical transient queries (same SQL, params, and deps) share the same `QueryHandle` and execution via TanStack Query.

- **Key**: `['sql-query', lookupKey]`
- **Sharing**: Multiple call sites get the same state and promise.
- **Cleanup**: Managed by TanStack Query GC.

---

## Lifecycle

1. **Mount** → Register pending handle → Execute → Update handle in place
2. **Share** → Same alias + SQL returns existing handle, refCount++
3. **Unmount** → refCount--; if 0 after grace period (1s), drop table
4. **Refetch** → All consumers see update (shared handle)

---

## Context

```typescript
<SqlQueryProvider>
  <App />
</SqlQueryProvider>
```

Tables are scoped to their provider. Different providers = independent registries.

---

## Examples

### Basic

```typescript
function Stats() {
  const result = useSqlQuery('SELECT COUNT(*) as total FROM users');
  if (result.isPending) return <Spinner />;
  return <div>{result.data?.[0]?.total}</div>;
}
```

### Named Table + Consumer

```typescript
function Dashboard({ orgId }) {
  const orders = useSqlQuery({
    orders: `SELECT * FROM '/api/export/${orgId}/orders.parquet'`
  });

  // Static: runs once when orders is ready
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
const cityStats = useSqlQuery({ city_stats: 'SELECT ... FROM orders ...' }, [orders]);
const top10 = useSqlQuery('SELECT * FROM city_stats LIMIT 10', [cityStats]);
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Alias = table name** | Debuggable, no magic. Collisions caught via normalized SQL comparison. |
| **Named params** | Self-documenting, no array/array ambiguity, refactoring-safe. |
| **`insertArrowTable`** | Zero-copy, 10-100x faster than `CREATE TABLE AS`. |
| **Opt-in reactivity** | Explicit deps, no accidental re-renders. |
| **Primitives-only deps** | `JSON.stringify` on objects is fragile. Compute string keys if needed. |
| **Context + shared promises** | Scoped sharing, no double-fetch on concurrent mounts. |
| **Explicit state (not Suspense)** | Stale-while-revalidate UX, SQL editor stays visible during load. |
| **Structural type guard** | `QueryHandle` is interface, `instanceof` doesn't work across modules. |
