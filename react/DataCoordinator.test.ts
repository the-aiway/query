import { describe, it, expect, beforeEach, mock } from 'bun:test';

import { DataCoordinator } from './DataCoordinator';

function createMockPool() {
  return {
    db: {
      registerOPFSFileName: mock(() => Promise.resolve()),
      dropFile: mock(() => Promise.resolve()),
    },
    dump: mock(() => Promise.resolve([])),
    dumpIPCTable: mock(() => Promise.resolve()),
  } as ReturnType<typeof createMockPool>;
}

describe('DataCoordinator', () => {
  let pool: ReturnType<typeof createMockPool>;
  let coordinator: DataCoordinator;

  beforeEach(() => {
    pool = createMockPool();
    coordinator = new DataCoordinator(pool as never);
  });

  describe('registerView', () => {
    it('creates a fragment entry with status ready', () => {
      const entry = coordinator.registerView('my_frag', 'SELECT 1');
      expect(entry.slug).toBe('my_frag');
      expect(entry.status).toBe('ready');
      expect(entry.type).toBe('fragment');
      expect(entry.id).toContain('my_frag_f_');
    });

    it('returns the same entry on duplicate registration', () => {
      const a = coordinator.registerView('f1', 'SELECT 1');
      const b = coordinator.registerView('f1', 'SELECT 1');
      expect(a).toBe(b);
    });

    it('returns different entries for different queries', () => {
      const a = coordinator.registerView('f1', 'SELECT 1');
      const b = coordinator.registerView('f1', 'SELECT 2');
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('requestTable', () => {
    it('resolves with a ready entry after materialization', async () => {
      const entry = await coordinator.requestTable('tbl', 'SELECT 1');
      expect(entry.status).toBe('ready');
      expect(entry.slug).toBe('tbl');
      expect(entry.type).toBe('table');
      expect(entry.path).toContain('opfs://');
    });

    it('calls registerOPFSFileName and dumpIPCTable during materialization', async () => {
      await coordinator.requestTable('tbl', 'SELECT 1');
      expect(pool.db.registerOPFSFileName).toHaveBeenCalledTimes(1);
      expect(pool.dumpIPCTable).toHaveBeenCalledTimes(1);
    });

    it('uses the query in the COPY command', async () => {
      await coordinator.requestTable('tbl', 'SELECT * WHERE id = 42');
      const copyCall = pool.dumpIPCTable.mock.calls[0][0] as string;
      expect(copyCall).toContain('SELECT * WHERE id = 42');
      expect(copyCall).toContain('COPY');
      expect(copyCall).toContain('FORMAT PARQUET');
    });

    it('returns cached ready entry on duplicate request', async () => {
      const a = await coordinator.requestTable('tbl', 'SELECT 1');
      const b = await coordinator.requestTable('tbl', 'SELECT 1');
      expect(a).toBe(b);
      expect(pool.dumpIPCTable).toHaveBeenCalledTimes(1);
    });

    it('creates separate entries for different queries', async () => {
      const a = await coordinator.requestTable('tbl', 'SELECT 1');
      const b = await coordinator.requestTable('tbl', 'SELECT 2');
      expect(a.id).not.toBe(b.id);
      expect(pool.dumpIPCTable).toHaveBeenCalledTimes(2);
    });

    it('returns an error entry when materialization fails', async () => {
      pool.dumpIPCTable = mock(() => Promise.reject(new Error('boom')));
      const entry = await coordinator.requestTable('fail_tbl', 'BAD SQL');
      expect(entry.status).toBe('error');
      expect(entry.error?.message).toBe('boom');
    });
  });
});
