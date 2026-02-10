import { describe, it, expect } from 'bun:test';

import type { CacheEntry } from './DataCoordinator';
import {
  buildSubstitutionMap,
  resolveEntryAsSql,
} from './resolveDependencies';

function makeTable(slug: string, id: string, path: string, query?: string, deps: string[] = []): CacheEntry {
  return { id, slug, path, status: 'ready', lastUsed: 0, dependencies: deps, type: 'table', query };
}

function makeFragment(slug: string, id: string, query: string, deps: string[] = []): CacheEntry {
  return { id, slug, path: '', status: 'ready', lastUsed: 0, dependencies: deps, type: 'fragment', query };
}

describe('buildSubstitutionMap', () => {
  it('maps tables to their OPFS path', () => {
    const t = makeTable('orders', 'orders_t_abc', 'opfs://orders_t_abc.parquet');
    expect(buildSubstitutionMap([t], [t.id])).toEqual({ orders: "'opfs://orders_t_abc.parquet'" });
  });

  it('inlines fragments with resolved deps', () => {
    const f = makeFragment('filt', 'filt_f_1', "SELECT * WHERE org = 'acme'");
    expect(buildSubstitutionMap([f], [f.id])).toEqual({ filt: "(SELECT * WHERE org = 'acme')" });
  });

  it('resolves fragment deps before inlining', () => {
    const t = makeTable('users', 'users_t_1', 'opfs://users.parquet', 'SELECT * FROM raw_users');
    const f = makeFragment('active', 'active_f_1', 'SELECT * FROM $users WHERE active', [t.id]);
    expect(buildSubstitutionMap([t, f], [f.id])).toEqual({ active: "(SELECT * FROM 'opfs://users.parquet' WHERE active)" });
  });
});

describe('resolveEntryAsSql', () => {
  it('inlines table deps: replaces opfs path with table query', () => {
    const raw = makeTable('raw', 'raw_t_1', 'opfs://raw.parquet', 'SELECT * FROM source_api');
    const entry = makeFragment('report', 'report_f_1',
      "SELECT count(*) FROM 'opfs://raw.parquet'",
      [raw.id]);

    expect(resolveEntryAsSql([raw, entry], entry)).toBe(
      'SELECT count(*) FROM (SELECT * FROM source_api)'
    );
  });
});
