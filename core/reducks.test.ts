import { describe, expect, test } from 'bun:test';
import { Duckable } from './reducks';

const queryOf = (input: string) => new Duckable('idle', 'fragment', input).query;

// Expected values were produced by the former `query.replace(/[;\n\s]*$/gm, "")`.
const cases: [string, string, string][] = [
  ['empty string', '', ''],
  ['no trailing chars', 'SELECT 1', 'SELECT 1'],
  ['single line with trailing ; and spaces', 'SELECT 1 ;  ; ', 'SELECT 1'],
  ['only semicolons and spaces', ' ; ;; ', ''],
  ['semicolon inside a line', "SELECT ';' AS a; SELECT 2", "SELECT ';' AS a; SELECT 2"],
  ['leading whitespace', '   \tSELECT 1;', '   \tSELECT 1'],
  ['semicolons at end of intermediate lines', 'SELECT 1;\nSELECT 2 ;;\nSELECT 3;', 'SELECT 1\nSELECT 2\nSELECT 3'],
  ['trailing spaces on intermediate lines', 'SELECT a,  \n  b \t\nFROM t', 'SELECT a,\n  b\nFROM t'],
  ['blank lines in the middle', 'SELECT 1\n\n\nFROM t', 'SELECT 1\nFROM t'],
  ['whitespace-only lines in the middle', 'SELECT 1\n  \n\t \n  FROM t', 'SELECT 1\n  FROM t'],
  ['blank and whitespace-only lines at the end', 'SELECT 1\n\n  \n\t\n', 'SELECT 1'],
  ['semicolon-only line in the middle', 'SELECT 1\n;\nFROM t', 'SELECT 1\nFROM t'],
  ['CRLF line endings', 'SELECT 1;\r\nFROM t ;\r\n\r\nWHERE x\r\n', 'SELECT 1\nFROM t\nWHERE x'],
  ['lone CR line endings', 'SELECT 1 ;\rFROM t\r\r', 'SELECT 1\rFROM t'],
  ['tabs', 'SELECT\t1;\t\n\tFROM\tt\t;\t', 'SELECT\t1\n\tFROM\tt'],
  ['unicode line and paragraph separators', 'SELECT 1 ; FROM t  WHERE x;', 'SELECT 1 FROM t WHERE x'],
  ['non-breaking and vertical whitespace', 'SELECT 1 ;\v\f\nFROM t﻿', 'SELECT 1\nFROM t'],
  ['indented multi-line query', '\n  SELECT *\n  FROM t\n  WHERE a = 1;\n', '\n  SELECT *\n  FROM t\n  WHERE a = 1'],
];

describe('Duckable query normalization', () => {
  for (const [name, input, expected] of cases) {
    test(name, () => {
      expect(queryOf(input)).toBe(expected);
    });
  }

  test('null query', () => {
    expect(queryOf(null as unknown as string)).toBe('');
  });

  test('undefined query', () => {
    expect(queryOf(undefined as unknown as string)).toBe('');
  });

  test('long runs before a non-trimmable char are kept, in linear time', () => {
    const size = 50_000;
    expect(queryOf(' '.repeat(size) + 'x')).toBe(' '.repeat(size) + 'x');
    expect(queryOf(';'.repeat(size) + 'x')).toBe(';'.repeat(size) + 'x');
    expect(queryOf(' ;\n ;'.repeat(size) + 'x')).toBe('\n ;x');
  });
});
