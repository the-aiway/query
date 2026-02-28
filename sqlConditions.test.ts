import { expect, test, describe } from 'bun:test';

import { sqlConditions } from './sqlConditions';

describe('sqlConditions', () => {
  test('simple equality', () => {
    expect(sqlConditions({ name: 'Alice' })).toBe("name = 'Alice'");
    expect(sqlConditions({ age: 30 })).toBe('age = 30');
  });

  test('escaping quotes', () => {
    expect(sqlConditions({ name: "O'Reilly" })).toBe("name = 'O''Reilly'");
    expect(sqlConditions({ city: { $in: ["L'Hay-les-Roses", 'Paris'] } })).toBe("(city IN ('L''Hay-les-Roses','Paris'))");
    expect(sqlConditions({ note: { $like: "%it's%" } })).toBe("(note LIKE '%it''s%')");
  });

  test('array defaults to IN clause', () => {
    expect(sqlConditions({ id: [1, 2, 3] })).toBe('id IN (1,2,3)');
    expect(sqlConditions({ city: ['Paris', 'Lyon'] })).toBe("city IN ('Paris','Lyon')");
  });

  test('empty array returns TRUE', () => {
    expect(sqlConditions({ id: [] })).toBe(' TRUE ');
  });

  test('null and undefined handling', () => {
    expect(sqlConditions({ name: null, age: undefined })).toBe(' TRUE ');
    expect(sqlConditions({ name: 'Alice', age: null })).toBe("name = 'Alice'");
  });

  test('falsy values handling', () => {
    // @ts-expect-error test falsy values
    expect(sqlConditions({ name: false && 'Bob', age: '' && 42 })).toBe(' TRUE ');
    expect(sqlConditions({ name: 'Alice', age: false })).toBe("name = 'Alice'");
    expect(sqlConditions({ name: 'Alice', age: '' })).toBe("name = 'Alice'");
  });

  test('$in operator', () => {
    expect(sqlConditions({ id: { $in: [1, 2] } })).toBe('(id IN (1,2))');
    expect(sqlConditions({ id: { $in: [] } })).toBe(' TRUE ');
  });

  test('$between operator', () => {
    expect(sqlConditions({ age: { $between: [18, 65] } })).toBe('(age BETWEEN 18 AND 65)');
    expect(sqlConditions({ price: { $between: [1.5, 99.9] } })).toBe('(price BETWEEN 1.5 AND 99.9)');
    expect(sqlConditions({ date: { $between: ['2024-01-01', '2024-12-31'] } })).toBe("(date BETWEEN '2024-01-01' AND '2024-12-31')");
  });

  test('$between with empty/invalid array', () => {
    expect(sqlConditions({ age: { $between: [] as unknown as [number, number] } })).toBe(' TRUE ');
    expect(sqlConditions({ age: { $between: [1] as unknown as [number, number] } })).toBe(' TRUE ');
  });

  test('comparison operators', () => {
    expect(sqlConditions({ age: { $gte: 18 } })).toBe('(age >= 18)');
    expect(sqlConditions({ age: { $lte: 100, $gt: 0 } })).toBe('(age <= 100 AND age > 0)');
  });

  test('simple equality handles null', () => {
    expect(sqlConditions({ age: null })).toBe(' TRUE ');
    expect(sqlConditions({ age: { $eq: null } })).toBe('(age IS NULL)');
  });

  test('empty array behavior', () => {
    expect(sqlConditions({ status: [] })).toBe(' TRUE ');
    expect(sqlConditions({ status: { $in: [] } })).toBe(' TRUE ');
  });

  test('undefined values are ignored', () => {
    expect(sqlConditions({ name: undefined, age: 42 })).toBe('age = 42');
    expect(sqlConditions({ filters: { $eq: undefined } })).toBe(' TRUE ');
  });

  test('escaping is robust', () => {
    expect(sqlConditions({ name: "'; DROP TABLE users; --" })).toBe("name = '''; DROP TABLE users; --'");
  });

  test('$like and $ilike', () => {
    expect(sqlConditions({ name: { $like: 'A%' } })).toBe("(name LIKE 'A%')");
    expect(sqlConditions({ name: { $ilike: 'a%' } })).toBe("(name ILIKE 'a%')");
  });

  test('multiple conditions', () => {
    const cond = sqlConditions({
      status: 'active',
      age: { $gte: 18 },
      tags: ['admin', 'user'],
    });
    expect(cond).toBe("status = 'active' AND (age >= 18) AND tags IN ('admin','user')");
  });
});
