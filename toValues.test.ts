import { expect, test, describe } from 'bun:test';
import { toValues, toValuesSelect } from './toValues';

describe('escapeJsonForSql', () => {
  test('simple object', () => {
    expect(toValues([{ payload: { a: 1 } }], ['payload'])).toBe("({'a':1})");
  });

  test('object with string value', () => {
    expect(toValues([{ payload: { name: 'Alice' } }], ['payload'])).toBe(
      "({'name':'Alice'})"
    );
  });

  test('escapes single quotes in values', () => {
    expect(toValues([{ payload: { name: "O'Reilly" } }], ['payload'])).toBe(
      "({'name':'O''Reilly'})"
    );
  });

  test('nested object', () => {
    expect(toValues([{ payload: { a: { b: 2 } } }], ['payload'])).toBe(
      "({'a':{'b':2}})"
    );
  });

  test('array', () => {
    expect(toValues([{ arr: [1, 2, 3] }], ['arr'])).toBe('([1,2,3])');
  });

  test('preserves escaped double quotes', () => {
    expect(toValues([{ payload: { msg: 'say "hello"' } }], ['payload'])).toBe(
      "({'msg':'say \"hello\"'})"
    );
  });
});

describe('toValues', () => {
  test('single row with one column', () => {
    expect(toValues([{ xx: 42 }], ['xx'])).toBe('(42)');
  });

  test('single row with schema object', () => {
    expect(toValues([{ xx: 42 }], { xx: 'INTEGER' })).toBe('(42)');
  });

  test('multiple rows', () => {
    expect(toValues([{ xx: 42 }, { xx: 43 }], ['xx'])).toBe('(42),(43)');
  });

  test('multiple columns', () => {
    expect(toValues([{ a: 1, b: 'x' }], ['a', 'b'])).toBe("(1,'x')");
  });

  test('string escaping', () => {
    expect(toValues([{ name: "O'Reilly" }], ['name'])).toBe("('O''Reilly')");
  });

  test('null and boolean', () => {
    expect(toValues([{ x: null, y: true }], ['x', 'y'])).toBe('(NULL,TRUE)');
  });

  test('empty data returns empty string', () => {
    expect(toValues([], ['xx'])).toBe('');
  });

  test('infers keys from data when schema not specified', () => {
    expect(toValues([{ xx: 42 }])).toBe('(42)');
    expect(toValues([{ a: 1, b: 'x' }])).toBe("(1,'x')");
    expect(toValues([{ xx: 42 }, { xx: 43 }])).toBe('(42),(43)');
  });

  test('infers keys from multiple rows with different keys', () => {
    expect(toValues([{ a: 1 }, { a: 2, b: 'y' }])).toBe("(1,NULL),(2,'y')");
  });

  test('empty data without schema returns empty string', () => {
    expect(toValues([])).toBe('');
  });
});

describe('toValuesSelect', () => {
  test('single row with one column', () => {
    expect(toValuesSelect([{ xx: 42 }], ['xx'])).toBe(
      'SELECT * FROM (VALUES (42)) AS _v(xx)'
    );
  });

  test('single row with schema object and type cast', () => {
    expect(toValuesSelect([{ xx: 42 }], { xx: 'INTEGER' })).toBe(
      'SELECT xx::INTEGER AS xx FROM (VALUES (42)) AS _v(xx)'
    );
  });

  test('multiple rows', () => {
    expect(toValuesSelect([{ xx: 42 }, { xx: 43 }], ['xx'])).toBe(
      'SELECT * FROM (VALUES (42),(43)) AS _v(xx)'
    );
  });

  test('empty data with array schema', () => {
    expect(toValuesSelect([], ['xx'])).toBe('SELECT NULL AS xx WHERE FALSE');
  });

  test('empty data with typed schema', () => {
    expect(toValuesSelect([], { xx: 'INTEGER' })).toBe(
      'SELECT NULL::INTEGER AS xx WHERE FALSE'
    );
  });

  test('full transform toValues([{xx:42}]) in SELECT', () => {
    const data = [{ xx: 42 }];
    const schema = ['xx'];
    const valuesPart = toValues(data, schema);
    expect(valuesPart).toBe('(42)');
    const fullSelect = toValuesSelect(data, schema);
    expect(fullSelect).toBe('SELECT * FROM (VALUES (42)) AS _v(xx)');
  });

  test('infers keys when schema not specified', () => {
    expect(toValuesSelect([{ xx: 42 }])).toBe(
      'SELECT * FROM (VALUES (42)) AS _v(xx)'
    );
    expect(toValuesSelect([{ a: 1, b: 'x' }])).toBe(
      "SELECT * FROM (VALUES (1,'x')) AS _v(a,b)"
    );
  });

  test('empty data without schema returns minimal empty select', () => {
    expect(toValuesSelect([])).toBe('SELECT 1 WHERE FALSE');
  });
});
