import { type AsyncDuckDB, type Logger, type LogEntryVariant, LogTopic, LogEvent, LogLevel, TokenType } from '@duckdb/duckdb-wasm';

// We import the registry to pick up a-posteriori names
import { _nameRegistry } from '../react/reducks';

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

export function logReslug(reslug: string, type?: 'fragment' | 'table') {
  const isFrag = type === 'fragment';
  const label = (isFrag ? 'sql' : type || 'node').padEnd(5);
  const color = isFrag ? '#c084fc' : '#60a5fa';
  console.log(`%c${label} %c${reslug}`, `color: ${color}`, `color: ${stringToColor(reslug)}; font-weight: bold`);
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
  private tokenizeFn?: AsyncDuckDB['tokenize'];
  private queryStates = new Map<string, any>();

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }
  public setTokenizer(t: any) {
    this.tokenizeFn = t;
  }

  private async waitIdle() {
    // Wait for all pending queries to finish
    while (this.queryStates.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    // Then wait for the browser to be idle
    if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
      await new Promise((resolve) => (window as any).requestIdleCallback(resolve, { timeout: 1000 }));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
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
      const match = value.match(/^\-\-:re:(\w+):([\w\-]+)/);
      const [tag, retype, reslug] = match || [];
      const query = tag ? value.replace(tag, '').trim() : value;
      const state = { start: performance.now(), query, localId: this.count++, retype, reslug, timer: null as any };

      // If reslug is a UID, try to look up a real name immediately
      if (state.reslug && state.reslug.match(/^[tf]_\d+_[a-z0-9]+$/)) {
        const registeredName = _nameRegistry.get(state.reslug);
        if (registeredName) state.reslug = registeredName;
      }

      state.timer = setTimeout(() => {
        const { fmt, args } = this.formatHeader(state, 0);
        console.log(`${fmt} %c⏳ Hanging: ${this.clean(state.query).slice(0, 60)}`, ...args, 'color: #f59e0b; font-style: italic');
      }, 1492);
      this.queryStates.set(id, state);
    } else if (event === LogEvent.OK || event === LogEvent.ERROR) {
      const state = this.queryStates.get(id);
      if (!state) return;
      clearTimeout(state.timer);
      this.queryStates.delete(id);

      const duration = Math.round(performance.now() - state.start);

      // Wait for all pending queries to finish and for the browser to be idle.
      // This ensures we don't block the main thread with tokenization/logging
      // while DuckDB is still processing other queries, and gives a-posteriori
      // naming a chance to propagate.
      await this.waitIdle();

      // Pick up a-posteriori name if it was assigned after the query started
      if (state.reslug && !state.reslug.match(/^[tf]_\d+_[a-z0-9]+$/)) {
        // Already has a "real" name
      } else if (state.reslug) {
        const registeredName = _nameRegistry.get(state.reslug);
        if (registeredName) state.reslug = registeredName;
      }
      const cleanSql = this.clean(state.query);
      const { fmt, args } = this.formatHeader(state, duration);

      let highlighted = cleanSql;
      let previewFmt = '%c' + cleanSql.slice(0, 135);
      let previewArgs = ['color: inherit'];

      if (this.tokenizeFn) {
        try {
          const previewSql = cleanSql.slice(0, 120);
          const [pTokens, fullTokens] = await Promise.all([this.tokenizeFn(previewSql), this.tokenizeFn(state.query)]);

          previewFmt = '';
          previewArgs = [];
          pTokens.offsets.forEach((offset: number, i: number) => {
            const nextOffset = pTokens.offsets[i + 1] ?? previewSql.length;
            previewFmt += '%c' + previewSql.substring(offset, nextOffset);
            previewArgs.push(`color: ${COLORS[pTokens.types[i] as TokenType] || 'inherit'}`);
          });

          highlighted = highlightAnsi(state.query, fullTokens);
        } catch (e) {}
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
      .replace(/\-\-sql/g, '')
      .replace(/\-\-:re:\w+:[\w\-]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatHeader(s: any, ms: number) {
    const dur = `${ms}ms`.padStart(6);

    // Progressive coloring: 0ms (grey) -> 2000ms (muted red)
    const t = Math.min(ms / 2000, 1);
    const saturation = Math.round(t * 65);
    const hue = Math.round(35 * (1 - t)); // Muted Orange (35) -> Red (0)
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

export function getLogTopicLabel(t: LogTopic): string {
  return { [LogTopic.CONNECT]: 'CONNECT', [LogTopic.DISCONNECT]: 'DISCONNECT', [LogTopic.INSTANTIATE]: 'INSTANTIATE', [LogTopic.OPEN]: 'OPEN', [LogTopic.QUERY]: 'QUERY' }[t] || 'DUCKDB';
}
export function getLogEventLabel(e: LogEvent): string {
  return { [LogEvent.OK]: 'OK', [LogEvent.ERROR]: 'ERROR', [LogEvent.START]: 'START', [LogEvent.RUN]: 'RUN', [LogEvent.CAPTURE]: 'CAPTURE' }[e] || 'EVENT';
}
