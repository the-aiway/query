import { AsyncDuckDB, TokenType } from '@duckdb/duckdb-wasm';
// import * as DuckDBBrowser from '@duckdb/duckdb-wasm';

const ANSI_RESET = '\x1b[0m';
const ANSI_BOLD = '\x1b[1m';

const rgbToAnsi = (r: number, g: number, b: number) => `${ANSI_BOLD}\x1b[38;2;${r};${g};${b}m`;

const colorMap: Record<TokenType, string> = {
  [TokenType.IDENTIFIER]: rgbToAnsi(63, 197, 107),
  [TokenType.NUMERIC_CONSTANT]: rgbToAnsi(255, 120, 248),
  [TokenType.STRING_CONSTANT]: rgbToAnsi(255, 120, 248),
  [TokenType.OPERATOR]: rgbToAnsi(122, 130, 218),
  [TokenType.KEYWORD]: rgbToAnsi(16, 177, 254),
  [TokenType.COMMENT]: rgbToAnsi(99, 109, 131),
};

type TokenizedQuery = Awaited<ReturnType<AsyncDuckDB['tokenize']>>;

export function highlightQuery(query: string, tokens: TokenizedQuery): string {
  return tokens.offsets
    .map((offset: number, i: number) => {
      const nextOffset = tokens.offsets[i + 1] ?? query.length;
      const value = query.substring(offset, nextOffset);
      const color = colorMap[tokens.types[i] as TokenType];
      return `${color}${value}${ANSI_RESET}`;
    })
    .join('');
}
