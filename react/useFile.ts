import { useDuckDB } from '../duck/DuckDBProvider';
import { useDuckQueryContext } from '../duck/DuckQueryContext';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DuckDBDataProtocol } from '@duckdb/duckdb-wasm';
import { useEffect } from 'react';
import { Md5 } from 'ts-md5';

function quoteIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

function quoteString(val: string) {
  return `'${val.replaceAll("'", "''")}'`;
}

function inferUrlExtension(url: string) {
  const cleaned = url.split('#')[0]?.split('?')[0] ?? url;
  const ext = cleaned.split('.').pop();
  return ext ? ext.toLowerCase() : '';
}

function getReadFn(ext: string) {
  if (ext === 'parquet') return 'read_parquet';
  if (ext === 'csv') return 'read_csv_auto';
  if (ext === 'json' || ext === 'jsonl') return 'read_json_auto';
  return null;
}

const fileRegistrationPromises = new Map<string, Promise<void>>();

export function useFile(name: string, url: string) {
    const { pool } = useDuckDB();
    const { registerFile } = useDuckQueryContext();

    // We use useQuery to handle the async registration and potential caching/suspense if we wanted
    // But for now, we just want to ensure it's registered.
    // Actually, RFC says "registerFileURL", which is usually fast.
    // But we want it to align with Suspense if it takes time (checking headers?).

    // Note: `registerFileURL` in DuckDB-WASM usually just registers the name->url mapping.
    // It doesn't fetch data yet.

    const query = useSuspenseQuery({
        queryKey: ['duck', 'file', name, url],
        queryFn: async () => {
            const ext = inferUrlExtension(url);
            const readFn = getReadFn(ext);
            if (!readFn) {
              throw new Error(
                `[useFile] Unsupported file extension "${ext || '(none)'}" for "${url}". Supported: parquet, csv, json, jsonl`
              );
            }

            // Register a stable virtual filename (with extension) so the reader can open it.
            // Note: DuckDB will throw if a fileName is already registered, so we make this idempotent.
            const baseFileId = ext ? `${name}.${ext}` : name;
            const existing = await pool.db.globFiles('*');

            const existingBase = existing.find((f) => f.fileName === baseFileId);
            const isSameUrl = existingBase?.dataUrl === url;

            const fileId =
              !existingBase || isSameUrl
                ? baseFileId
                : `${name}.${Md5.hashStr(url).slice(0, 8)}.${ext}`;

            const registrationKey = `${fileId}|${url}`;
            const existingPromise = fileRegistrationPromises.get(registrationKey);
            if (existingPromise) {
              await existingPromise;
            } else if (!existing.find((f) => f.fileName === fileId && f.dataUrl === url)) {
              const p = pool.db.registerFileURL(fileId, url, DuckDBDataProtocol.HTTP, false);
              fileRegistrationPromises.set(registrationKey, p);
              await p;
            }

            // Create a view so downstream SQL can reference the table name directly: `FROM ${name}`
            await pool.dump(
              `CREATE OR REPLACE VIEW ${quoteIdent(name)} AS SELECT * FROM ${readFn}(${quoteString(fileId)})`
            );
            return { name, url };
        },
        // Stale time infinite - file registry shouldn't change often for same name+url
        staleTime: Infinity,
    });

    // Register after commit to avoid "state update on unmounted component" with Suspense.
    useEffect(() => {
      registerFile(name, url);
    }, [name, url, registerFile]);

    return query;
}
