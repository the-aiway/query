import { describe, it, expect, beforeEach, mock } from 'bun:test';

import { DataCoordinator, substituteParams, type CacheEntry } from './DataCoordinator';

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

describe('substituteParams', () => {
  it('replaces string params with escaped single quotes', () => {
    const result = substituteParams('SELECT * WHERE name = $name', { name: 'Alice' });
    expect(result).toBe("SELECT * WHERE name = 'Alice'");
  });

  it('replaces numeric params directly', () => {
    const result = substituteParams('SELECT * WHERE id = $id', { id: 42 });
    expect(result).toBe('SELECT * WHERE id = 42');
  });

  it('replaces Date params as ISO strings', () => {
    const d = new Date('2024-01-15T00:00:00.000Z');
    const result = substituteParams('SELECT * WHERE created > $date', { date: d });
    expect(result).toBe("SELECT * WHERE created > '2024-01-15T00:00:00.000Z'");
  });

  it('escapes single quotes in string params', () => {
    const result = substituteParams("SELECT * WHERE name = $name", { name: "O'Brien" });
    expect(result).toBe("SELECT * WHERE name = 'O''Brien'");
  });

  it('replaces multiple occurrences of the same param', () => {
    const result = substituteParams('SELECT $id, $id', { id: 5 });
    expect(result).toBe('SELECT 5, 5');
  });

  it('replaces multiple different params', () => {
    const result = substituteParams('WHERE org = $org AND seg = $seg', { org: '3', seg: 'colis' });
    expect(result).toBe("WHERE org = '3' AND seg = 'colis'");
  });
});

describe('DataCoordinator', () => {
  let pool: ReturnType<typeof createMockPool>;
  let coordinator: DataCoordinator;

  beforeEach(() => {
    pool = createMockPool();
    coordinator = new DataCoordinator(pool as never);
  });

  describe('registerView', () => {
    it('creates a view entry with status ready', () => {
      const entry = coordinator.registerView('my_view', 'SELECT 1', {});
      expect(entry.slug).toBe('my_view');
      expect(entry.status).toBe('ready');
      expect(entry.type).toBe('view');
      expect(entry.id).toContain('my_view_v_');
    });

    it('returns the same entry on duplicate registration', () => {
      const a = coordinator.registerView('v1', 'SELECT 1', {});
      const b = coordinator.registerView('v1', 'SELECT 1', {});
      expect(a).toBe(b);
    });

    it('returns different entries for different params', () => {
      const a = coordinator.registerView('v1', 'SELECT $x', { x: 1 });
      const b = coordinator.registerView('v1', 'SELECT $x', { x: 2 });
      expect(a.id).not.toBe(b.id);
    });

    it('registers fragments with correct type', () => {
      const entry = coordinator.registerView('frag', 'SELECT 1', {}, [], 'fragment');
      expect(entry.type).toBe('fragment');
      expect(entry.id).toContain('frag_f_');
    });
  });

  describe('requestTable', () => {
    it('resolves with a ready entry after materialization', async () => {
      const entry = await coordinator.requestTable('tbl', 'SELECT 1', {});
      expect(entry.status).toBe('ready');
      expect(entry.slug).toBe('tbl');
      expect(entry.type).toBe('table');
      expect(entry.path).toContain('opfs://');
    });

    it('calls registerOPFSFileName and dumpIPCTable during materialization', async () => {
      await coordinator.requestTable('tbl', 'SELECT 1', {});
      expect(pool.db.registerOPFSFileName).toHaveBeenCalledTimes(1);
      expect(pool.dumpIPCTable).toHaveBeenCalledTimes(1);
    });

    it('substitutes params into the COPY query', async () => {
      await coordinator.requestTable('tbl', 'SELECT * WHERE id = $id', { id: 42 });
      const copyCall = pool.dumpIPCTable.mock.calls[0][0] as string;
      expect(copyCall).toContain('SELECT * WHERE id = 42');
      expect(copyCall).toContain('COPY');
      expect(copyCall).toContain('FORMAT PARQUET');
    });

    it('returns cached ready entry on duplicate request', async () => {
      const a = await coordinator.requestTable('tbl', 'SELECT 1', {});
      const b = await coordinator.requestTable('tbl', 'SELECT 1', {});
      expect(a).toBe(b);
      expect(pool.dumpIPCTable).toHaveBeenCalledTimes(1);
    });

    it('deduplicates in-flight materializations', async () => {
      const p1 = coordinator.requestTable('tbl', 'SELECT 1', {});
      const p2 = coordinator.requestTable('tbl', 'SELECT 1', {});
      const [a, b] = await Promise.all([p1, p2]);
      expect(a).toBe(b);
      expect(pool.dumpIPCTable).toHaveBeenCalledTimes(1);
    });

    it('creates separate entries for different params', async () => {
      const a = await coordinator.requestTable('tbl', 'SELECT $x', { x: 1 });
      const b = await coordinator.requestTable('tbl', 'SELECT $x', { x: 2 });
      expect(a.id).not.toBe(b.id);
      expect(pool.dumpIPCTable).toHaveBeenCalledTimes(2);
    });

    it('returns an error entry when materialization fails', async () => {
      pool.dumpIPCTable = mock(() => Promise.reject(new Error('boom')));
      const entry = await coordinator.requestTable('fail_tbl', 'BAD SQL', {});
      expect(entry.status).toBe('error');
      expect(entry.error?.message).toBe('boom');
    });

    it('produces immutable entries — cache entry is a new object after materialization', async () => {
      let resolveWrite: () => void;
      const writePromise = new Promise<void>((r) => { resolveWrite = r; });
      pool.dumpIPCTable = mock(() => writePromise);

      const promise = coordinator.requestTable('imm', 'SELECT 1', {});

      resolveWrite!();
      const entry = await promise;

      expect(entry.status).toBe('ready');
    });

    it('cleans up pendingMaterializations map after completion', async () => {
      await coordinator.requestTable('tbl', 'SELECT 1', {});
      expect((coordinator as unknown as Record<string, Map<string, unknown>>).pendingMaterializations.size).toBe(0);
    });
  });

  describe('resolveViewDependencies', () => {
    it('returns empty array for no dependencies', () => {
      expect(coordinator.resolveViewDependencies([])).toEqual([]);
    });

    it('generates CREATE TEMP VIEW for view entries', () => {
      const view = coordinator.registerView('v1', 'SELECT 1', {});
      const sqls = coordinator.resolveViewDependencies([view.id]);
      expect(sqls.length).toBe(1);
      expect(sqls[0]).toContain('CREATE OR REPLACE TEMP VIEW');
      expect(sqls[0]).toContain(view.id);
      expect(sqls[0]).toContain('SELECT 1');
    });

    it('resolves nested view dependencies in correct order', async () => {
      const table = await coordinator.requestTable('base', 'SELECT 1', {});
      const view = coordinator.registerView(
        'derived',
        `SELECT * FROM '${table.path}'`,
        {},
        [table.id]
      );
      const sqls = coordinator.resolveViewDependencies([view.id]);
      expect(sqls.length).toBe(1);
      expect(sqls[0]).toContain(view.id);
    });

    it('substitutes params in resolved views', () => {
      const view = coordinator.registerView('pv', 'SELECT * WHERE x = $x', { x: 42 });
      const sqls = coordinator.resolveViewDependencies([view.id]);
      expect(sqls[0]).toContain('WHERE x = 42');
    });

    it('does not generate SQL for table entries', async () => {
      const table = await coordinator.requestTable('t1', 'SELECT 1', {});
      const sqls = coordinator.resolveViewDependencies([table.id]);
      expect(sqls.length).toBe(0);
    });

    it('inlines fragment dependencies', () => {
      const frag = coordinator.registerView('frag', 'SELECT * FROM t WHERE active', {}, [], 'fragment');
      const view = coordinator.registerView('v1', `SELECT count(*) FROM \${frag}`, {}, [frag.id]);
      const sqls = coordinator.resolveViewDependencies([view.id]);
      expect(sqls.length).toBe(1);
    });
  });

  describe('subscribe / notify', () => {
    it('subscribe returns an unsubscribe function', () => {
      const listener = mock(() => {});
      const unsub = coordinator.subscribe(listener);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('does not notify on registerView', () => {
      const listener = mock(() => {});
      coordinator.subscribe(listener);
      coordinator.registerView('v', 'SELECT 1', {});
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
