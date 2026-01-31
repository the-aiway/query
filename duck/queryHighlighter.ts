import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import * as DuckDBBrowser from '@duckdb/duckdb-wasm';

const ANSI_RESET = '\x1b[0m';
const ANSI_BOLD = '\x1b[1m';

const rgbToAnsi = (r: number, g: number, b: number) => `${ANSI_BOLD}\x1b[38;2;${r};${g};${b}m`;

const colorMap: Record<DuckDBBrowser.TokenType, string> = {
  [DuckDBBrowser.TokenType.IDENTIFIER]: rgbToAnsi(63, 197, 107),
  [DuckDBBrowser.TokenType.NUMERIC_CONSTANT]: rgbToAnsi(255, 120, 248),
  [DuckDBBrowser.TokenType.STRING_CONSTANT]: rgbToAnsi(255, 120, 248),
  [DuckDBBrowser.TokenType.OPERATOR]: rgbToAnsi(122, 130, 218),
  [DuckDBBrowser.TokenType.KEYWORD]: rgbToAnsi(16, 177, 254),
  [DuckDBBrowser.TokenType.COMMENT]: rgbToAnsi(99, 109, 131),
};

type TokenizedQuery = Awaited<ReturnType<AsyncDuckDB['tokenize']>>;

export function highlightQuery(query: string, tokens: TokenizedQuery): string {
  return tokens.offsets
    .map((offset: number, i: number) => {
      const nextOffset = tokens.offsets[i + 1] ?? query.length;
      const value = query.substring(offset, nextOffset);
      const color = colorMap[tokens.types[i] as DuckDBBrowser.TokenType];
      return `${color}${value}${ANSI_RESET}`;
    })
    .join('');
}
