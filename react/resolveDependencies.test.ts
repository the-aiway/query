import { describe, it, expect } from 'bun:test';

import type { CacheEntry } from './DataCoordinator';
import {
  buildSubstitutionMap,
  resolveViewDependencies,
  resolveEntryAsSql,
} from './resolveDependencies';

// ---------------------------------------------------------------------------
// Helpers — build CacheEntry stubs
// ---------------------------------------------------------------------------

function makeTable(slug: string, id: string, path: string, query?: string, params?: Record<string, unknown>, deps: string[] = []): CacheEntry {
  return { id, slug, path, status: 'ready', lastUsed: 0, dependencies: deps, type: 'table', query, params };
}

function makeView(slug: string, id: string, query: string, params?: Record<string, unknown>, deps: string[] = []): CacheEntry {
  return { id, slug, path: '', status: 'ready', lastUsed: 0, dependencies: deps, type: 'view', query, params };
}

function makeFragment(slug: string, id: string, query: string, params?: Record<string, unknown>, deps: string[] = []): CacheEntry {
  return { id, slug, path: '', status: 'ready', lastUsed: 0, dependencies: deps, type: 'fragment', query, params };
}

// ---------------------------------------------------------------------------
// buildSubstitutionMap (used by useQueryBuilder at query-building time)
// ---------------------------------------------------------------------------

describe('buildSubstitutionMap', () => {
  it('maps tables to their OPFS path', () => {
    const t = makeTable('orders', 'orders_t_abc', 'opfs://orders_t_abc.parquet');
    expect(buildSubstitutionMap([t], [t.id])).toEqual({ orders: "'opfs://orders_t_abc.parquet'" });
  });

  it('maps views to their internal id', () => {
    const v = makeView('filtered', 'filtered_v_xyz', 'SELECT 1');
    expect(buildSubstitutionMap([v], [v.id])).toEqual({ filtered: 'filtered_v_xyz' });
  });

  it('inlines fragments with resolved deps and params', () => {
    const f = makeFragment('filt', 'filt_f_1', 'SELECT * WHERE org = $org', { org: 'acme' });
    expect(buildSubstitutionMap([f], [f.id])).toEqual({ filt: "(SELECT * WHERE org = 'acme')" });
  });

  it('resolves fragment deps before inlining', () => {
    const v = makeView('users', 'users_v_1', 'SELECT * FROM raw_users');
    const f = makeFragment('active', 'active_f_1', 'SELECT * FROM $users WHERE active', {}, [v.id]);
    expect(buildSubstitutionMap([v, f], [f.id])).toEqual({ active: '(SELECT * FROM users_v_1 WHERE active)' });
  });

  it('skips unknown dep IDs', () => {
    expect(buildSubstitutionMap([], ['non_existent'])).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// resolveViewDependencies (for execution — CREATE TEMP VIEW)
// ---------------------------------------------------------------------------

describe('resolveViewDependencies', () => {
  it('returns empty array for no deps', () => {
    expect(resolveViewDependencies([], [])).toEqual([]);
  });

  it('generates CREATE TEMP VIEW', () => {
    const v = makeView('v1', 'v1_v_1', 'SELECT 1');
    expect(resolveViewDependencies([v], [v.id])).toEqual([
      'CREATE OR REPLACE TEMP VIEW v1_v_1 AS SELECT 1;',
    ]);
  });

  it('resolves nested views depth-first', () => {
    const v1 = makeView('v1', 'v1_v_1', 'SELECT 1 as a');
    const v2 = makeView('v2', 'v2_v_1', 'SELECT * FROM $v1', {}, [v1.id]);
    expect(resolveViewDependencies([v1, v2], [v2.id])).toEqual([
      'CREATE OR REPLACE TEMP VIEW v1_v_1 AS SELECT 1 as a;',
      'CREATE OR REPLACE TEMP VIEW v2_v_1 AS SELECT * FROM v1_v_1;',
    ]);
  });

  it('does not emit tables', () => {
    const t = makeTable('t1', 't1_t_1', 'opfs://t1.parquet');
    expect(resolveViewDependencies([t], [t.id])).toEqual([]);
  });

  it('deduplicates shared deps', () => {
    const base = makeView('base', 'base_v_1', 'SELECT 1');
    const a = makeView('a', 'a_v_1', 'SELECT * FROM $base', {}, [base.id]);
    const b = makeView('b', 'b_v_1', 'SELECT * FROM $base', {}, [base.id]);
    expect(resolveViewDependencies([base, a, b], [a.id, b.id])).toEqual([
      'CREATE OR REPLACE TEMP VIEW base_v_1 AS SELECT 1;',
      'CREATE OR REPLACE TEMP VIEW a_v_1 AS SELECT * FROM base_v_1;',
      'CREATE OR REPLACE TEMP VIEW b_v_1 AS SELECT * FROM base_v_1;',
    ]);
  });
});

// ---------------------------------------------------------------------------
// resolveEntryAsSql (for DISPLAY — reverse-lookup inline)
// ---------------------------------------------------------------------------

describe('resolveEntryAsSql', () => {
  it('returns SELECT * FROM path for a table with no query', () => {
    const t = makeTable('t1', 't1_t_1', 'opfs://t1.parquet');
    expect(resolveEntryAsSql([], t)).toBe("SELECT * FROM 'opfs://t1.parquet'");
  });

  it('returns view query directly when no deps', () => {
    const v = makeView('v1', 'v1_v_1', 'SELECT 42 as answer');
    expect(resolveEntryAsSql([v], v)).toBe('SELECT 42 as answer');
  });

  it('inlines table deps: replaces opfs path with table query', () => {
    // useQueryBuilder resolved $raw → 'opfs://raw.parquet' and stored that query
    const raw = makeTable('raw', 'raw_t_1', 'opfs://raw.parquet', 'SELECT * FROM source_api');
    const entry = makeView('report', 'report_v_1',
      "SELECT count(*) FROM 'opfs://raw.parquet'",
      {}, [raw.id]);

    expect(resolveEntryAsSql([raw, entry], entry)).toBe(
      'SELECT count(*) FROM (SELECT * FROM source_api)'
    );
  });

  it('inlines view deps: replaces view_id with view query', () => {
    const v1 = makeView('clean', 'clean_v_1', 'SELECT * FROM users WHERE active');
    const entry = makeView('report', 'report_v_1',
      'SELECT count(*) FROM clean_v_1',
      {}, [v1.id]);

    expect(resolveEntryAsSql([v1, entry], entry)).toBe(
      'SELECT count(*) FROM (SELECT * FROM users WHERE active)'
    );
  });

  it('recursively inlines nested deps', () => {
    // raw table → clean view → report view
    const raw = makeTable('raw', 'raw_t_1', 'opfs://raw.parquet', 'SELECT * FROM api_export');
    // useQueryBuilder resolved clean's query: $raw → 'opfs://raw.parquet'
    const clean = makeView('clean', 'clean_v_1',
      "SELECT id, name FROM 'opfs://raw.parquet' WHERE valid",
      {}, [raw.id]);
    // useQueryBuilder resolved report's query: $clean → clean_v_1
    const entry = makeView('report', 'report_v_1',
      'SELECT count(*) FROM clean_v_1',
      {}, [clean.id]);

    expect(resolveEntryAsSql([raw, clean, entry], entry)).toBe(
      'SELECT count(*) FROM (SELECT id, name FROM (SELECT * FROM api_export) WHERE valid)'
    );
  });

  it('handles fragments (already inlined by buildSubstitutionMap)', () => {
    // Fragment was inlined by buildSubstitutionMap at query-building time
    // So the stored query contains (SELECT * FROM t WHERE active) literally
    const entry = makeView('report', 'report_v_1',
      'SELECT count(*) FROM (SELECT * FROM t WHERE active)');

    expect(resolveEntryAsSql([entry], entry)).toBe(
      'SELECT count(*) FROM (SELECT * FROM t WHERE active)'
    );
  });

  it('substitutes params in the final query', () => {
    const v = makeView('v1', 'v1_v_1', "SELECT * WHERE org = $org", { org: 'acme' });
    expect(resolveEntryAsSql([v], v)).toBe("SELECT * WHERE org = 'acme'");
  });

  it('full multi-layer inlining like QueryTable tooltip', () => {
    // Simulates a real DAG: raw table → current_state table → report view
    const rawSource = makeTable('raw', 'raw_t_1', 'opfs://raw.parquet', 'SELECT * FROM api_data');
    const currentState = makeTable('current_state', 'current_state_t_1', 'opfs://current_state.parquet',
      "SELECT numdept, cost FROM 'opfs://raw.parquet'",
      {}, [rawSource.id]);
    // useQueryBuilder resolved: $current_state → 'opfs://current_state.parquet'
    const entry = makeView('report', 'report_v_1',
      "SELECT numdept, best_carrier FROM 'opfs://current_state.parquet' WHERE best_carrier IS NOT NULL",
      {}, [currentState.id]);

    expect(resolveEntryAsSql([rawSource, currentState, entry], entry)).toBe(
      'SELECT numdept, best_carrier FROM (SELECT numdept, cost FROM (SELECT * FROM api_data)) WHERE best_carrier IS NOT NULL'
    );
  });

  it('falls back to path when table has no stored query', () => {
    const t = makeTable('legacy', 'legacy_t_1', 'opfs://legacy.parquet');
    const entry = makeView('report', 'report_v_1',
      "SELECT * FROM 'opfs://legacy.parquet'",
      {}, [t.id]);

    // No stored query → inlines as SELECT * FROM 'path' (fallback)
    expect(resolveEntryAsSql([t, entry], entry)).toBe(
      "SELECT * FROM (SELECT * FROM 'opfs://legacy.parquet')"
    );
  });
});
