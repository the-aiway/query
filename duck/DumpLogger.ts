import { Table as ArrowTable } from 'apache-arrow';
import { highlightQuery } from './queryHighlighter';
import { type AsyncDuckDB, type Logger, type LogEntryVariant, LogTopic, LogEvent, LogLevel } from '@duckdb/duckdb-wasm';

export class DumpLogger implements Logger {
  private count = 0;
  private level: LogLevel;
  private tokenize?: AsyncDuckDB['tokenize'];
  private queryStates = new Map<
    string,
    { start: number; localId: number; query: string; timer: any }
  >();

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  public setTokenizer(tokenize: AsyncDuckDB['tokenize']): void {
    this.tokenize = tokenize;
  }

  public log(entry: LogEntryVariant): void {
    const { topic, event, value } = entry;
    // Cast to access id if present (from recent duckdb-wasm changes)
    const entryWithId = entry as LogEntryVariant & { id?: string };

    if (entry.topic === LogTopic.QUERY) {
      this.handleQueryEvent(entryWithId);
    } else {
      const topicLabel = getLogTopicLabel(topic);
      const eventLabel = getLogEventLabel(event);
      const color = this.getTopicColor(topic);
      const logValue = value !== undefined && value !== null ? value : '';

      if (event === LogEvent.ERROR) {
        console.error(`%c[${topicLabel}]%c ❌ ${eventLabel}:`, `color: ${color}; font-weight: bold`, 'color: inherit', logValue);
      } else if (this.level >= LogLevel.INFO) {
        console.log(`%c[${topicLabel}]%c ${eventLabel}`, `color: ${color}; font-weight: bold`, 'color: inherit', logValue);
      }
    }
  }

  private getTopicColor(topic: LogTopic): string {
    switch (topic) {
      case LogTopic.CONNECT: return '#3b82f6';
      case LogTopic.OPEN: return '#8b5cf6';
      case LogTopic.INSTANTIATE: return '#ec4899';
      case LogTopic.QUERY: return '#10b981';
      default: return '#6b7280';
    }
  }

  private async handleQueryEvent(entry: LogEntryVariant & { id?: string }) {
    console.log('HANDLE QUERY EVENT', getLogEventLabel(entry.event), getLogTopicLabel(entry.topic), entry)
    const { event, value, id } = entry;
    if (!id) return;

    if (event === LogEvent.RUN && typeof value === 'string') {
      const localId = this.count++;
      const query = value;
      const queryStart = query.replaceAll(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');

      const timer = setTimeout(() => {
        console.log(`%c${localId}%c ⏳ Hanging: ${queryStart}`, 'color: #888; font-weight: bold', 'color: #f59e0b; font-style: italic');
      }, 1492);

      this.queryStates.set(id, { start: performance.now(), localId, query, timer });
    } else if (event === LogEvent.OK || event === LogEvent.ERROR) {
      const state = this.queryStates.get(id);
      if (!state) return;
      clearTimeout(state.timer);
      this.queryStates.delete(id);

      const duration = (performance.now() - state.start).toFixed(1);
      const query = state.query;
      
      // Ultra simple tokenization using pool.db
      let highlightedQuery = query;
      let queryLabel = query.replaceAll(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');

      if (this.tokenize) {
        try {
          const tokens = await this.tokenize(query);
          highlightedQuery = highlightQuery(query, tokens);
          queryLabel = highlightedQuery.replaceAll(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');
        } catch {}
      }

      if (event === LogEvent.OK) {
        console.groupCollapsed(`%c${state.localId}%c ✓ ${queryLabel} %c(${duration}ms)`, 'color: #888; font-weight: bold', 'color: inherit', 'color: #666; font-style: italic');
        console.log(highlightedQuery);
        console.groupEnd();
      } else {
        const errMsg = typeof value === 'string' ? value : 'Unknown error';
        const errMessages = Array.from(new Set(errMsg.split('\n').filter((e: string) => e.trim())));
        console.groupCollapsed(`%c${state.localId}%c ❌ Error: ${queryLabel} %c(${duration}ms)`, 'color: #888; font-weight: bold', 'color: red', 'color: #666; font-style: italic');
        console.log(highlightedQuery);
        console.error(errMessages.join('\n'));
        console.trace();
        console.groupEnd();
      }
    }
  }
}

export function getLogTopicLabel(topic: LogTopic): string {
  switch (topic) {
    case LogTopic.CONNECT: return 'CONNECT';
    case LogTopic.DISCONNECT: return 'DISCONNECT';
    case LogTopic.INSTANTIATE: return 'INSTANTIATE';
    case LogTopic.OPEN: return 'OPEN';
    case LogTopic.QUERY: return 'QUERY';
    default: return 'DUCKDB';
  }
}

export function getLogEventLabel(event: LogEvent): string {
  switch (event) {
    case LogEvent.OK: return 'OK';
    case LogEvent.ERROR: return 'ERROR';
    case LogEvent.START: return 'START';
    case LogEvent.RUN: return 'RUN';
    case LogEvent.CAPTURE: return 'CAPTURE';
    default: return 'EVENT';
  }
}
