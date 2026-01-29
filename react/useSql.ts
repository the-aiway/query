import { useSuspenseQuery } from '@tanstack/react-query';
import { useDuckDB } from './DuckDBProvider';
import type { InferSQL } from '../duck/inferSqlReturntype';
import { fnv1a32Hex } from '../sqlUtils';

function quoteIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

function quoteString(val: string) {
  return `'${val.replaceAll("'", "''")}'`;
}

function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return String(value);
  if (t !== 'object') return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
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

  const exists = Array.from(existsRes)?.length > 0;
  if (!exists) {
    await opts.conn.insertArrowTable(opts.table, {
      name: physicalName,
      create: true,
    });
  }

  // Always (re)bind the logical name for this query execution.
  await opts.conn.query(
    `CREATE OR REPLACE TEMP VIEW ${quoteIdent(opts.logicalName)} AS SELECT * FROM ${quoteIdent(
      physicalName
    )}`
  );
}

export function useSql<
  SQL extends string,
  Params extends Record<string, any> = Record<string, any>,
>(sql: SQL, params?: Params, deps: any[] = []): InferSQL<SQL> {
  const { pool } = useDuckDB();

  const depHashes = deps.map((d) => d?.hash || 'null').join('|');
  const paramHash = params ? fnv1a32Hex(stableStringify(params)) : 'null';
  const sqlHash = fnv1a32Hex(sql);

  const query = useSuspenseQuery({
    queryKey: ['duck', 'sql', sqlHash, paramHash, depHashes],
    queryFn: async () => {
      const conn = await pool.db.connect();
      try {
        // 1. Inject Dependencies
        for (const dep of deps) {
          if (dep && dep.table && dep.name) {
            await ensureInjectedTable({
              conn,
              logicalName: dep.name,
              hash: dep.hash || 'null',
              table: dep.table,
            });
          }
        }

        // 2. Execute Query
        let result;
        if (params && Object.keys(params).length > 0) {
          // Replace $param references with ? for positional arguments
          // We keep track of the order to pass values correctly
          const paramKeys: string[] = [];
          const processedSql = sql.replace(/\$([a-zA-Z0-9_]+)/g, (match, key) => {
            paramKeys.push(key);
            return '?';
          });

          const paramValues = paramKeys.map((k) => params[k]);

          const stmt = await conn.prepare(processedSql);
          try {
            result = await stmt.query(...paramValues);
          } finally {
            await stmt.close();
          }
        } else {
          result = await conn.query(sql);
        }

        // Convert to typed JSON
        return result.toArray().map((row: any) => row.toJSON()) as InferSQL<SQL>;
      } finally {
        await conn.close();
      }
    },
    staleTime: Infinity,
  });

  return query.data;
}
