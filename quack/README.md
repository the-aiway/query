# Quack Framework 🦆

> High-Performance Computation-Managed React Framework for DuckDB-Wasm

## The Philosophy

In modern high-performance analytical apps, moving 1M rows from WASM memory to the React thread is a performance "casse-tête". **Quack** solves this by keeping the data in binary memory and only passing **View Names (Scopes)** down the React tree.

- **Props are Pointers**: Components receive `QuackScope` objects (containing the view name), not the data array.
- **SQL-as-Inheritance**: Refinement happens via `useQuackScope`, which creates nested DuckDB views.
- **Lazy Materialization**: Data only touches the JS thread when explicitly requested via `useQuackMetric` (aggregates) or `useQuackCursor` (paged slices).

## Specs

1. **QuackClient**: Singleton managing the DuckDB connection and generating unique view IDs.
2. **useQuackSource**: Registers a root table.
3. **useQuackScope**:
   - Takes `parent: QuackScope`.
   - Returns `child: QuackScope`.
   - Reactive: Automatically runs `CREATE OR REPLACE VIEW` when parameters change.
   - Garbage Collected: Automatically runs `DROP VIEW` on unmount.
4. **useQuackMetric**: Returns a tiny JS object derived from a SQL aggregate.
5. **useQuackCursor**: Provides windowed access to rows for virtual lists.

## Performance Benchmark Goals

- **View Refinement**: < 5ms (DuckDB internal metadata op).
- **Metric Extraction**: < 50ms for 1M rows (DuckDB internal aggregation).
- **React Loop**: Fluid 60fps even with 1M rows, because React never sees more than 50 rows at a time.
