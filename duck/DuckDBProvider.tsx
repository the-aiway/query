import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import * as DuckDBBrowser from '@duckdb/duckdb-wasm';
import React, { createContext, useContext, type ReactNode } from 'react';

import { ConnectionPool } from './ConnectionPool';

const duckdb = DuckDBBrowser as unknown as typeof import('@duckdb/duckdb-wasm') & {};

export interface DuckDBConfig {
  bundlePath?: string;
  maxConnections?: number;
  onInit?: (pool: ConnectionPool) => Promise<void>;
  getAuthToken?: () => string | null;
}

export interface DBResource {
  instance: AsyncDuckDB;
  pool: ConnectionPool;
  createInstance: () => Promise<AsyncDuckDB>;
  selectedBundle: string;
}

const DEFAULT_MAX_CONNECTIONS =
  typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

function resolveBundleBasePath(bundlePath: string) {
  if (bundlePath.startsWith('http://') || bundlePath.startsWith('https://')) {
    return bundlePath.replace(/\/$/, '');
  }
  const path = bundlePath.startsWith('/') ? bundlePath : `/${bundlePath}`;
  return `${location.origin}${path}`.replace(/\/$/, '');
}

function getRelevantBundle(bundlePath: string) {
  const origin = resolveBundleBasePath(bundlePath);
  return duckdb.selectBundle({
    mvp: {
      mainModule: `${origin}/duckdb-mvp.wasm`,
      mainWorker: `${origin}/duckdb-browser-mvp.worker.js`,
    },
    eh: {
      mainModule: `${origin}/duckdb-eh.wasm`,
      mainWorker: `${origin}/duckdb-browser-eh.worker.js`,
    },
    coi: {
      mainModule: `${origin}/duckdb-coi.wasm`,
      mainWorker: `${origin}/duckdb-browser-coi.worker.js`,
      pthreadWorker: `${origin}/duckdb-browser-coi.pthread.worker.js`,
    },
  });
}

// Global memoized promise and cache - runs only once
let dbResourcePromise: Promise<DBResource> | null = null;
let dbResourceCache: DBResource | null = null;

export function getDBResource(config?: DuckDBConfig): Promise<DBResource> {
  if (dbResourceCache) {
    return Promise.resolve(dbResourceCache);
  }
  if (dbResourcePromise) {
    return dbResourcePromise;
  }

  dbResourcePromise = (async () => {
    console.log('[DuckDB] Initializing...');
    const bundlePath = config?.bundlePath ?? '/static/duckdb';
    console.log('[DuckDB] Using bundle path:', bundlePath);
    const bundle = await getRelevantBundle(bundlePath);
    console.log('[DuckDB] Bundle resolved:', bundle);
    const match = bundle.mainModule.match(/duckdb-(\w+).wasm/);
    const selectedBundle = (match && match[1]) || 'unknown';

    // Create worker URL for the main worker
    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: 'text/javascript',
      })
    );
    console.log('[DuckDB] Worker URL created:', workerUrl);

    const maxConnections = config?.maxConnections ?? DEFAULT_MAX_CONNECTIONS;

    const createInstance = async () => {
      console.log('[DuckDB] Creating instance...');
      const worker = new Worker(workerUrl);
      const logger = new duckdb.VoidLogger();
      const database = new duckdb.AsyncDuckDB(logger, worker);

      // Instantiate with the bundle (pthreadWorker enables multi-threading)
      console.log('[DuckDB] Instantiating...', bundle.mainModule);
      await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
      console.log('[DuckDB] Instantiated.');
      
      const maximumThreads = bundle.pthreadWorker ? maxConnections : 1;
      const authToken = config?.getAuthToken?.() ?? undefined;

      console.log('[DuckDB] Opening database...');
      await database.open({
        // @ts-expect-error - added in fork of duckdb-wasm
        authToken,
        maximumThreads,
        useDirectIO: true,
        filesystem: {
          reliableHeadRequests: true,
          allowFullHTTPReads: true,
          forceFullHTTPReads: true,
        },
        query: { castBigIntToDouble: true, castTimestampToDate: true, castDecimalToDouble: true },
      });
      console.log('[DuckDB] Database opened.');
      URL.revokeObjectURL(workerUrl);
      return database;
    };

    const database = await createInstance();
    const pool = new ConnectionPool(database, maxConnections);
    if (typeof globalThis !== 'undefined') {
      // @ts-expect-error - globalThis is not typed
      globalThis.pool = pool;
    }

    if (config?.onInit) {
      await config.onInit(pool);
    }

    const resource = { instance: database, pool, selectedBundle, createInstance };

    // Cache the resolved value
    dbResourceCache = resource;
    console.log('[DuckDB] Ready.');
    return resource;
  })();

  return dbResourcePromise;
}

export const dbResource = {
  read(config?: DuckDBConfig): DBResource {
    // If cached, return immediately
    if (dbResourceCache) {
      return dbResourceCache;
    }
    // Otherwise, get the promise and throw it to trigger Suspense
    const promise = getDBResource(config);
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw promise;
  },
};

export const DuckDBContext = createContext<DBResource | null>(null);

export function useDuckDB() {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error('useDuckDB must be used within a DuckDBProvider');
  }
  return context;
}

import { DuckQueryProvider } from './DuckQueryContext';

export function DuckQueryWasmProvider({
  config,
  children,
}: {
  config?: DuckDBConfig;
  children: ReactNode;
}) {
  // This will suspend until DB is ready and files are registered
  const resource = dbResource.read(config);

  return React.createElement(
    DuckDBContext.Provider,
    { value: resource },
    React.createElement(DuckQueryProvider, null, children)
  );
}
