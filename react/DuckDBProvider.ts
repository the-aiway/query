import type { AsyncDuckDB, Logger } from '@duckdb/duckdb-wasm';
import * as DuckDBBrowser from '../dist/duckdb-browser';
import React, { createContext, useContext, } from 'react';

import { ConnectionPool } from '../duck/ConnectionPool';

const duckdb = DuckDBBrowser as unknown as typeof import('@duckdb/duckdb-wasm') & {};

type DuckDBOpenConfig = Parameters<AsyncDuckDB['open']>[0];

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

export interface DuckDBConfig {
  bundlePath?: string;
  debug?: boolean;
  maxConnections?: number;
  onInit?: (pool: ConnectionPool) => Promise<void>;
  customHttpHeaders?: Record<string, string>;
  logger?: Logger;
  path?: DuckDBOpenConfig['path'];
  accessMode?: DuckDBOpenConfig['accessMode'];
  maximumThreads?: DuckDBOpenConfig['maximumThreads'];
  opfs?: DeepPartial<DuckDBOpenConfig['opfs']>;
  useDirectIO?: DuckDBOpenConfig['useDirectIO'];
  filesystem?: DeepPartial<DuckDBOpenConfig['filesystem']>;
  query?: DeepPartial<DuckDBOpenConfig['query']>;
}

export interface DBResource {
  instance: AsyncDuckDB;
  pool: ConnectionPool;
  createInstance: () => Promise<AsyncDuckDB>;
  selectedBundle: string;
}

const DEFAULT_MAX_CONNECTIONS = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result: Record<string, unknown> = { ...base };
  for (const [key, overrideValue] of Object.entries(override)) {
    if (overrideValue === undefined) {
      continue;
    }
    const baseValue = result[key];
    if (isObject(baseValue) && isObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
      continue;
    }
    result[key] = overrideValue;
  }
  return result as T;
}

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
    const debug = config?.debug ? console.log : () => {};
    debug('[DuckDB] Initializing...');
    const bundlePath = config?.bundlePath ?? '/static/duckdb';
    debug('[DuckDB] Using bundle path:', bundlePath);
    const bundle = await getRelevantBundle(bundlePath);
    debug('[DuckDB] Bundle resolved:', bundle);
    const match = bundle.mainModule.match(/duckdb-(\w+).wasm/);
    const selectedBundle = (match && match[1]) || 'unknown';

    // Create worker URL for the main worker
    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: 'text/javascript',
      })
    );
    debug('[DuckDB] Worker URL created:', workerUrl);

    const maxConnections = config?.maxConnections ?? DEFAULT_MAX_CONNECTIONS;

    const createInstance = async () => {
      console.log('%c[DuckDB] 🛠️ createInstance() started', 'color: #3b82f6; font-weight: bold');
      debug('[DuckDB] Creating instance...');
      const worker = new Worker(workerUrl);

      const logger = config?.logger ?? new duckdb.VoidLogger();
      const database = new duckdb.AsyncDuckDB(logger, worker);

      // Instantiate with the bundle (pthreadWorker enables multi-threading)
      debug('[DuckDB] Instantiating...', bundle.mainModule);
      await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
      debug('[DuckDB] Instantiated.');

      const maximumThreads = bundle.pthreadWorker ? maxConnections : 1;
      const authToken = config?.customHttpHeaders?.['Authorization']?.split(' ').pop();
      debug('[DuckDB] Auth token:', authToken);

      debug('[DuckDB] Opening database...');
      const defaultOpenConfig: DuckDBOpenConfig = {
        maximumThreads,
        accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
        opfs: {
          fileHandling: 'auto'
        },
        useDirectIO: true,
        filesystem: {
          reliableHeadRequests: true,
          allowFullHTTPReads: true,
          forceFullHTTPReads: true,
        },
        query: {
          castBigIntToDouble: true,
          castTimestampToDate: true,
          castDecimalToDouble: true,
        },
      };
      const {
        bundlePath: _bundlePath,
        debug: _debug,
        maxConnections: _maxConnections,
        onInit: _onInit,
        customHttpHeaders: _customHttpHeaders,
        logger: _logger,
        ...openOverrides
      } = config ?? {};
      const openConfig = deepMerge(defaultOpenConfig as Record<string, unknown>, openOverrides as Record<string, unknown>) as DuckDBOpenConfig;
      await database.open(openConfig);
      debug('[DuckDB] Database opened.');
      URL.revokeObjectURL(workerUrl);
      return database;
    };

    const database = await createInstance();
    const pool = new ConnectionPool(database, maxConnections);
    if (typeof window !== 'undefined') {
      (window as Window & { pool?: ConnectionPool }).pool = pool;
    }
    await config?.onInit?.(pool);
    const resource = {
      instance: database,
      pool,
      selectedBundle,
      createInstance,
    };

    // Cache the resolved value
    dbResourceCache = resource;
    debug('[DuckDB] Ready.');
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

export function DuckQueryWasmProvider({
  children,
  ...config
}: DuckDBConfig & {
  children: React.ReactNode;
}) {
  // This will suspend until DB is ready and files are registered
  const resource = dbResource.read(config);

  return React.createElement(DuckDBContext.Provider, { value: resource }, children);
}
