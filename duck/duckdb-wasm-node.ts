(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
import * as duckdb from '../dist/duckdb-browser';
import * as arrow from 'apache-arrow';
// @ts-expect-error
import wasmPath from '../dist/duckdb-eh.wasm' with { type: 'file' };
// @ts-expect-error
import workerPath from '../dist/duckdb-node-eh.worker.cjs' with { type: 'file' };

import { ConnectionPool } from '../duck/ConnectionPool';

export async function initDuckDB() {
  const worker = new Worker(workerPath, { type: 'module' });
  const wasmModule = await WebAssembly.compile(await Bun.file(wasmPath).bytes());
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(wasmModule as unknown as string);
  const conn = await db.connect();
  return { db, conn, worker };
}

export type DuckDBWasmServerPool = {
  db: duckdb.AsyncDuckDB;
  pool: ConnectionPool;
  worker: Worker;
  close: () => Promise<void>;
};

import { DataCoordinator } from '../react/DataCoordinator';

export async function initDuckDBPool(
  options: { poolSize?: number } = {}
): Promise<DuckDBWasmServerPool> {
  const { db, worker } = await initDuckDB();
  const coordinator = new DataCoordinator({ poolSize: options.poolSize || 4 });
  await coordinator.adopt(db as any);
  const pool = new ConnectionPool(coordinator);
  return {
    db,
    pool,
    worker,
    close: async () => {
      worker.terminate();
    },
  };
}

export async function initCoordinator(debug = false) {
    const coordinator = new DataCoordinator({ debug, poolSize: 4 });
    await coordinator.init({ workerPath, wasmPath });
    return { 
        coordinator,
        close: async () => {
            // Coordinator doesn't expose underlying worker terminate directly,
            // but we might want to add a close/terminate method to DataCoordinator?
            // For now, we can rely on process exit or add a method.
            // Let's add a terminate method to DataCoordinator (or just ignore for benchmarks)
        }
    };
}

if (import.meta.main) {
  const { conn, db, worker } = await initDuckDB();
  // 1. Benchmarks
  const sql = `SELECT * from duckdb_settings(), duckdb_functions()`;
  const resultBuffer = await conn.query(sql);

  if (process.argv.includes('--arrow')) {
    console.log('========== ARROW ==========');
    console.time('arrow.tableFromIPC()');
    const arrowTable = arrow.tableFromIPC(resultBuffer);
    console.timeEnd('arrow.tableFromIPC()');
    console.time('arrowTable.toArray()');
    arrowTable.toArray();
    console.timeEnd('arrowTable.toArray()');
    console.log('Arrow Rows:', arrowTable.numRows);
  }

  if (process.argv.includes('--insert')) {
    console.log('Testing Arrow Insertion with Format Conversion...');

    // Acquire data to insert
    console.time("conn.query('SELECT * from duckdb_settings(), duckdb_functions()')");
    const dataBuffer = await conn.query('SELECT * from duckdb_settings(), duckdb_functions()');
    console.timeEnd("conn.query('SELECT * from duckdb_settings(), duckdb_functions()')");

    // Convert FILE -> STREAM format (Zero-copy wrapping)
    console.time('arrow.tableFromIPC(dataBuffer)');
    const table = arrow.tableFromIPC(dataBuffer);
    console.timeEnd('arrow.tableFromIPC(dataBuffer)');

    console.time('arrow.RecordBatchStreamWriter.writeAll(table).toUint8Array()');
    const streamBuffer = await arrow.RecordBatchStreamWriter.writeAll(table).toUint8Array();
    console.timeEnd('arrow.RecordBatchStreamWriter.writeAll(table).toUint8Array()');

    console.time("conn.query('DROP TABLE IF EXISTS xxx')");
    await conn.query('DROP TABLE IF EXISTS xxx');
    console.timeEnd("conn.query('DROP TABLE IF EXISTS xxx')");

    console.time('conn.insertArrowFromIPCStream(streamBuffer, { name: "xxx", create: true })');
    await conn.insertArrowFromIPCStream(streamBuffer, {
      name: 'xxx',
      create: true,
    });
    console.timeEnd('conn.insertArrowFromIPCStream(streamBuffer, { name: "xxx", create: true })');

    console.time("conn.query('SELECT count(*) as total FROM xxx')");
    const resp = await conn.query('SELECT count(*) as total FROM xxx');
    console.timeEnd("conn.query('SELECT count(*) as total FROM xxx')");
    console.log('Final Row Count in xxx:', arrow.tableFromIPC(resp).getChildAt(0)?.get(0));
  }

  worker.terminate();
  // process.exit(0);
}
