import { type AsyncDuckDB, type Logger, type LogEntryVariant, LogTopic, LogEvent, LogLevel, TokenType } from '@duckdb/duckdb-wasm';
import type { ConnectionPool } from './ConnectionPool';

const ANSI_RESET = '\x1b[0m';
const rgbToAnsi = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;

const COLORS: Record<TokenType, string> = {
  [TokenType.IDENTIFIER]: 'rgb(200, 200, 200)',
  [TokenType.NUMERIC_CONSTANT]: 'rgb(180, 150, 220)',
  [TokenType.STRING_CONSTANT]: 'rgb(150, 200, 150)',
  [TokenType.OPERATOR]: 'rgb(122, 130, 218)',
  [TokenType.KEYWORD]: 'rgb(16, 177, 254)',
  [TokenType.COMMENT]: 'rgb(100, 100, 100)',
};

const ANSI_COLORS: Record<TokenType, string> = {
  [TokenType.IDENTIFIER]: rgbToAnsi(200, 200, 200),
  [TokenType.NUMERIC_CONSTANT]: rgbToAnsi(180, 150, 220),
  [TokenType.STRING_CONSTANT]: rgbToAnsi(150, 200, 150),
  [TokenType.OPERATOR]: rgbToAnsi(122, 130, 218),
  [TokenType.KEYWORD]: rgbToAnsi(16, 177, 254),
  [TokenType.COMMENT]: rgbToAnsi(100, 100, 100),
};

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 35%, 65%)`;
}

function highlightAnsi(query: string, tokens: any): string {
  return tokens.offsets
    .map((offset: number, i: number) => {
      const nextOffset = tokens.offsets[i + 1] ?? query.length;
      const color = ANSI_COLORS[tokens.types[i] as TokenType] || '';
      return `${color}${query.substring(offset, nextOffset)}${ANSI_RESET}`;
    })
    .join('');
}

export class DumpLogger implements Logger {
  private count = 0;
  private level: LogLevel;
  private queryStates = new Map<string, any>();

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  public log(entry: LogEntryVariant) {
    if (entry.topic === LogTopic.QUERY) {
      return this.handleQuery(entry as any);
    }
    if (this.level < LogLevel.INFO && entry.event !== LogEvent.ERROR) return;
    console.log(`%c[${LogTopic[entry.topic]}]%c ${LogEvent[entry.event]}`, `color: #888; font-weight: bold`, 'color: inherit', entry.value ?? '');
  }

  private async handleQuery(entry: LogEntryVariant & { id?: string }) {
    const { event, value, id } = entry;
    if (!id) return;

    if (event === LogEvent.RUN && typeof value === 'string') {
      const match = value.match(/^--:re:(\w+):([\w-]+)/);
      const [tag, retype, reslug] = match || [];
      const query = tag ? value.replace(tag, '').trim() : value;
      const state = { start: performance.now(), query, localId: this.count++, retype, reslug, timer: null as any };

      state.timer = setTimeout(() => {
        const { fmt, args } = this.formatHeader(state, 0);
        const cleaned = this.preview(this.clean(state.query));
        console.log(`${fmt} %c⏳ Hanging: ${cleaned.text}`, ...args, 'color: #f59e0b; font-style: italic');
      }, 1492);
      this.queryStates.set(id, state);
    } else if (event === LogEvent.OK || event === LogEvent.ERROR) {
      const state = this.queryStates.get(id);
      if (!state) return;
      clearTimeout(state.timer);
      this.queryStates.delete(id);

      const duration = Math.round(performance.now() - state.start);
      const cleanSql = this.clean(state.query);
      const preview = this.preview(cleanSql);
      const { fmt, args } = this.formatHeader(state, duration);

      let highlighted = cleanSql;
      let previewFmt = '%c' + preview.text;
      let previewArgs = ['color: inherit'];
      const pool = typeof window === 'undefined' ? undefined : (window as Window & { pool?: ConnectionPool }).pool;
      const tokenizeFn = pool?.db?.tokenize?.bind(pool.db) as AsyncDuckDB['tokenize'] | undefined;

      if (tokenizeFn) {
        try {
          const fullTokensPromise = tokenizeFn(state.query);
          if (preview.isCompact) {
            const [headTokens, tailTokens, fullTokens] = await Promise.all([tokenizeFn(preview.head), tokenizeFn(preview.tail), fullTokensPromise]);
            const previewFmtParts: string[] = [];
            const previewArgParts: string[] = [];
            this.pushTokenizedPreview(previewFmtParts, previewArgParts, preview.head, headTokens);
            previewFmtParts.push('%c ... ');
            previewArgParts.push('color: inherit');
            this.pushTokenizedPreview(previewFmtParts, previewArgParts, preview.tail, tailTokens);
            previewFmt = previewFmtParts.join('');
            previewArgs = previewArgParts;
            highlighted = highlightAnsi(state.query, fullTokens);
          } else {
            const [pTokens, fullTokens] = await Promise.all([tokenizeFn(preview.head), fullTokensPromise]);
            const previewFmtParts: string[] = [];
            const previewArgParts: string[] = [];
            this.pushTokenizedPreview(previewFmtParts, previewArgParts, preview.head, pTokens);
            previewFmt = previewFmtParts.join('');
            previewArgs = previewArgParts;
            highlighted = highlightAnsi(state.query, fullTokens);
          }
        } catch (error) {
          console.debug('[DumpLogger] Tokenizer unavailable', error);
        }
      }

      const log = event === LogEvent.OK ? console.groupCollapsed : console.group;
      log(`${fmt} ${previewFmt}`, ...args, ...previewArgs);
      console.log(highlighted);
      if (event === LogEvent.ERROR) console.error(value);
      console.groupEnd();
    }
  }

  private clean(sql: string) {
    return sql
      .replace(/--sql/g, '')
      .replace(/--:re:\w+:[\w-]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private preview(sql: string) {
    const HEAD_CHARS = 60;
    const TAIL_CHARS = 60;
    const ELLIPSIS = ' ... ';
    const isCompact = sql.length > HEAD_CHARS + TAIL_CHARS + ELLIPSIS.length;
    const head = isCompact ? sql.slice(0, HEAD_CHARS) : sql;
    const tail = isCompact ? sql.slice(-TAIL_CHARS) : '';
    const text = isCompact ? `${head}${ELLIPSIS}${tail}` : sql;
    return { text, head, tail, isCompact };
  }

  private pushTokenizedPreview(
    fmtParts: string[],
    argParts: string[],
    sql: string,
    tokens: Awaited<ReturnType<AsyncDuckDB['tokenize']>>,
  ) {
    tokens.offsets.forEach((offset: number, i: number) => {
      const nextOffset = tokens.offsets[i + 1] ?? sql.length;
      fmtParts.push('%c' + sql.substring(offset, nextOffset));
      argParts.push(`color: ${COLORS[tokens.types[i] as TokenType] || 'inherit'}`);
    });
  }

  private formatHeader(s: any, ms: number) {
    const dur = `${ms}ms`.padStart(6);

    const t = Math.min(ms / 2000, 1);
    const saturation = Math.round(t * 65);
    const hue = Math.round(35 * (1 - t));
    const durColor = `hsl(${hue}, ${saturation}%, 50%)`;

    const typeLabel = (s.retype === 'fragment' ? 'sql' : s.retype || '').padEnd(5);
    const slug = s.reslug || `#${s.localId}`;
    const slugLabel = slug.padEnd(20);
    const typeColor = s.retype === 'fragment' ? '#c084fc' : s.retype === 'table' ? '#60a5fa' : '#444';
    const slugColor = stringToColor(slug);

    return {
      fmt: `%c${typeLabel}%c:%c${slugLabel}%c:%c${dur}%c:`,
      args: [`color: ${typeColor}`, 'color: #444', `color: ${slugColor}; font-family: monospace`, 'color: #444', `color: ${durColor}`, 'color: #444'],
    };
  }
}

