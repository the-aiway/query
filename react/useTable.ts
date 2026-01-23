
import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDuckDB } from './DuckDBProvider';
import { useDuckQueryContext } from './DuckQueryContext';
import { fnv1a32Hex } from '../sqlUtils';

function quoteIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

function quoteString(val: string) {
  return `'${val.replaceAll("'", "''")}'`;
}

async function ensureInjectedTable(opts: {
  conn: any;
  logicalName: string;
  hash: string;
  table: any;
}) {
  const physicalName = `_dq_${opts.logicalName}_${opts.hash}`;

  const existsRes = await opts.conn.query(
    `SELECT 1 AS ok FROM information_schema.tables WHERE table_name = ${quoteString(physicalName)} LIMIT 1`
  );
  const exists = Array.from(existsRes as any)?.length > 0;
  if (!exists) {
    await opts.conn.insertArrowTable(opts.table, {
      name: physicalName,
      create: true,
    });
  }

  await opts.conn.query(
    `CREATE OR REPLACE TEMP VIEW ${quoteIdent(opts.logicalName)} AS SELECT * FROM ${quoteIdent(
      physicalName
    )}`
  );
}

// Minimal hash function for table content or just use SQL hash?
// RFC says: "Hash computed from table content for cache invalidation" is ideal but maybe expensive?
// "Hash computed from table content" -- if we return a new Table object, we need a way to key it.
//
// Actually, `useTable` takes `sql`. 
// If `sql` changes, we get a new result.
// If the *data* behind the SQL changes (e.g. underlying file update), we might not know unless we invalidate.
//
// For now, let's assume determinism based on SQL + Dependencies.
// We need to implement the dependency injection logic in `useTable` too if we allow `useTable` to depend on others?
// RFC: "Child defines `dept_totals` when parent already has it."
// RFC example for `useTable` doesn't show deps explicitly, but `useSql` does.
// However, `useTable` SQL might query OTHER tables.
//
// Design decision: `useTable` *can* take deps, or we rely on them being available in context.
// But validtion: strict hash derivation needs deps.
//
// Let's stick to the RFC signature: `useTable(name, sql)`.
// Implicit dependencies: if SQL references other tables, they must be in DuckDB.
// Since `useTable` runs on render, parent tables *should* already be registered if they followed hooks waterfall?
//
// Wait, `useTable` suspends.
// If Parent calls `useTable('A')` and Child calls `useTable('B', 'select * from A')`.
// Parent suspends -> A registered -> render Child -> Child suspends -> B registered.
// This works.
//
// What about Hash?
// We can hash the SQL string.
// `useTable` returns `{ name, table, hash }`.
//
// Implementing `hash` over the content might be needed for *downstream* invalidation.
// e.g. A changes, but results in same data? B shouldn't re-run?
// That's an optimization. For now, if A changes, B re-runs (because B depends on A's hash).
//
// But `useTable` doesn't explicitly take deps in RFC signature?
// "useTable executes SQL ... Re-executes when SQL or upstream dependencies change"
// How does it know upstream deps changed?
//
// If we don't pass deps, react-query key is just `['duck', 'table', name, hash(sql)]`.
// This is missing dependency invalidation.
//
// RFC Open Question 3: "Should deps be explicit or auto-detected?"
// Mitigation: "Explicit deps array".
//
// I will add `deps` to `useTable` as well to be safe and consistent with `useSql`.
// `useTable(name, sql, deps?)`

export function useTable(name: string, sql: string, deps: any[] = []) {
    const { pool } = useDuckDB();
    const { registerTable } = useDuckQueryContext();

    // Compute dependency hash to part of the key
    // We assume deps are TableEntry objects or similar that have a hash property?
    // Or just use the values?
    // The RFC `useSql` example passes `[tables.dept_totals]`.
    // `tables.dept_totals` is a TableEntry `{ name, table, hash }`.

    const depHashes = deps.map(d => d?.hash || 'null').join('|');
    const sqlHash = fnv1a32Hex(sql);

    const query = useSuspenseQuery({
        queryKey: ['duck', 'table', name, sqlHash, depHashes],
        queryFn: async () => {
            // 1. Inject dependencies
            // We need to make sure the dependent tables exist in DuckDB as "temp tables" or "views"
            // If they were created by `useTable` upstream, they might already be registered?
            //
            // In `useTable` logic:
            // "Stores Arrow Table in Context"
            // The parent `useTable` creates a table in memory (JS side) and context.
            // But does it persist in DuckDB connection?
            //
            // If we use the same `pool`, we can keep them in DuckDB.
            // BUT: strict isolation suggested injection:
            // "pool.insertArrowTable(tables.dept_totals, { name: '_t_dept_totals_a8f3' })"
            //
            // If we rely on DuckDB-WASM's persistence, we risk collisions or stale state.
            // Injection is safer for functional purity.
            //
            // Let's implement injection for each query.

            const conn = await pool.db.connect();
            try {
                // Inject deps
                for (const dep of deps) {
                    if (dep && dep.table && dep.name) {
                        // We register it as its originally defined name so the SQL matches?
                        // SQL: "SELECT ... FROM dept_totals"
                        // So we must register as "dept_totals".
                        // collision risk: if "dept_totals" is already a VIEW from `useTable` upstream in same connection?
                        //
                        // If we use the SAME connection pool (singleton), "dept_totals" might exist.
                        // We should effectively overwrite it to be sure it's the version we want.
                        //
                        await ensureInjectedTable({
                          conn,
                          logicalName: dep.name,
                          hash: dep.hash || 'null',
                          table: dep.table,
                        });
                        // DuckDB-WASM `insertArrowTable` might append.
                        // Better to `CREATE OR REPLACE TABLE name AS SELECT * FROM arrow_scan(...)`?
                        // actually `insertArrowTable` implementation details vary.
                        //
                        // Safer: Register as random name, then Create View alias?
                        // "SELECT * FROM _injected_HASH"
                        // VIEW name "dept_totals" -> "SELECT * FROM _injected_HASH"
                    }
                }

                // Execute Query
                const arrowResult = await conn.query(sql);

                // We get an Arrow Table.
                // We should hash it for downstream invalidation.
                // Simple hack: hash the length + schema + first/last row?
                // Full content hash is slow.
                // Let's use a random ID for now or hash of SQL+Deps (which is the query key).
                // Since we want deterministic caching, query key is good enough as "content identity"
                // IF the query function is deterministic.
                //
                // NOTE: If the query uses `random()` or `now()`, it's not.
                // But for react-query, we identify results by input key.
                const resultHash = fnv1a32Hex(sqlHash + depHashes);

                const entry = {
                    name,
                    table: arrowResult,
                    hash: resultHash
                };
                return entry;
            } finally {
                await conn.close();
            }
        },
        staleTime: Infinity, // Computed data is immutable for these inputs
    });

    // Register after commit to avoid "state update on unmounted component" with Suspense.
    useEffect(() => {
      registerTable(query.data);
    }, [query.data, registerTable]);

    return query.data;
}
