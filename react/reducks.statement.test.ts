import { expect, test, describe } from 'bun:test';
import { statement, useStatement } from './reducks';
import { renderHook } from '@testing-library/react';

describe('statement', () => {
  test('returns a function', () => {
    const fn = statement((t) => `SELECT ${t.name}::varchar as name FROM (VALUES (1)) t`, {});
    expect(typeof fn).toBe('function');
  });

  test('returned function produces QueryRef with variable params', () => {
    const getUserInfo = statement<{ name: string }>((t) => `SELECT ${t.name}::varchar as name FROM (VALUES (1)) t`, {});
    const ref = getUserInfo({ name: 'alice' });
    expect(ref).toBeDefined();
    expect(ref.id).toBeDefined();
    expect(typeof ref.toArray).toBe('function');
    expect(typeof ref.row).toBe('function');
    expect(ref.type).toBe('fragment');
  });

  test('merges fixed and variable params', () => {
    const getUserInfo = statement<{ name: string }, { prefix: string }>((t) => `SELECT ${t.prefix} || ${t.name}::varchar as full FROM (VALUES (1)) t`, { prefix: 'user:' });
    const ref = getUserInfo({ name: 'bob' });
    expect(ref).toBeDefined();
    expect(ref.query).toContain('user:');
    expect(ref.query).toContain('bob');
  });
});

describe('useStatement', () => {
  test('returns a function', () => {
    const { result } = renderHook(() => useStatement<{ name: string }>((t) => `SELECT ${t.name}::varchar as name FROM (VALUES (1)) t`, {}));
    expect(typeof result.current).toBe('function');
  });

  test('returned function produces QueryRef', () => {
    const { result } = renderHook(() => useStatement<{ name: string }>((t) => `SELECT ${t.name}::varchar as name FROM (VALUES (1)) t`, {}));
    const fn = result.current;
    const ref = fn({ name: 'alice' });
    expect(ref).toBeDefined();
    expect(ref.id).toBeDefined();
    expect(typeof ref.toArray).toBe('function');
  });

  test('merges fixed and variable params', () => {
    const { result } = renderHook(() => useStatement<{ age: number }, { base: string }>((t) => `SELECT ${t.base}::varchar as base, ${t.age}::int as age FROM (VALUES (1)) t`, { base: 'fixed' }));
    const ref = result.current({ age: 25 });
    expect(ref.query).toContain('fixed');
    expect(ref.query).toContain('25');
  });
});
