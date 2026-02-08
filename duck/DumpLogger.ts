
import { Table as ArrowTable } from 'apache-arrow';
import { highlightQuery } from './queryHighlighter';
import { 
    type AsyncDuckDB, 
    type Logger, 
    type LogEntryVariant, 
    LogTopic, 
    LogEvent, 
    LogLevel 
} from '@duckdb/duckdb-wasm';

export interface QueryLogger extends Logger {
  logQuery(query: string, queryFn: () => Promise<ArrowTable<any>>, db?: AsyncDuckDB): Promise<ArrowTable<any>>;
}

export class DumpLogger implements QueryLogger {
  private count = 0;
  private level: LogLevel;
  private queryStates = new Map<string, { start: number; id: number; highlighted?: string; queryShort?: string; timer?: any }>();

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  public log(entry: LogEntryVariant): void {
    if (entry.level < this.level) return;

    const { topic, event, value } = entry;

    if (topic === LogTopic.QUERY) {
        this.handleQueryEvent(entry);
    } else {
        const topicLabel = getLogTopicLabel(topic);
        const eventLabel = getLogEventLabel(event);
        const color = this.getTopicColor(topic);
        const logValue = value !== undefined && value !== null ? value : '';
        
        if (event === LogEvent.ERROR) {
            console.error(`%c[${topicLabel}]%c ❌ ${eventLabel}:`, `color: ${color}; font-weight: bold`, 'color: inherit', logValue);
        } else if (entry.level >= LogLevel.INFO) {
            console.log(`%c[${topicLabel}]%c ${eventLabel}`, `color: ${color}; font-weight: bold`, 'color: inherit', logValue);
        }
    }
  }

  private getTopicColor(topic: LogTopic): string {
    switch (topic) {
        case LogTopic.CONNECT: return '#3b82f6'; // blue
        case LogTopic.OPEN: return '#8b5cf6'; // violet
        case LogTopic.INSTANTIATE: return '#ec4899'; // pink
        case LogTopic.QUERY: return '#10b981'; // emerald
        default: return '#6b7280'; // gray
    }
  }

  private handleQueryEvent(entry: LogEntryVariant) {
    const { event, value } = entry;
    
    if (event === LogEvent.RUN && typeof value === 'string') {
        const _id = this.count++;
        const queryShort = value.replaceAll(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');
        
        // Note: we can't easily tokenize here because log() is synchronous and tokenize is async.
        // So we'll leave highlighting for logQuery() or do it lazily.
        
        this.queryStates.set(value, { 
            start: performance.now(), 
            id: _id,
            queryShort
        });
    } else if (event === LogEvent.OK || event === LogEvent.ERROR) {
        // Without a correlation ID, we attempt to match or just clear if it's the only one.
        // This is still better than nothing.
    }
  }

  private logResult(rtn: ArrowTable) {
    const resultsProxy = { clickToSeeMore: true };
    Object.defineProperty(resultsProxy, 'results', {
      get: () => Array.from(rtn).map((e) => e?.toJSON()),
      enumerable: true,
      configurable: true,
    });
    console.dir(resultsProxy, { showHidden: true, depth: 4 });
  }

  async logQuery(query: string, queryFn: () => Promise<ArrowTable<any>>, db?: AsyncDuckDB): Promise<ArrowTable<any>> {
    const _id = this.count++;
    
    // Attempt highlighting if DB is available for tokenization
    let highlightedQuery = query;
    let queryStart = query.replaceAll(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');

    if (db) {
        try {
            const tokens = await db.tokenize(query);
            highlightedQuery = highlightQuery(query, tokens);
            queryStart = highlightedQuery.replaceAll(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');
        } catch (e) {
            // Tokenization failed, proceed with raw query.
        }
    }

    const start = performance.now();

    const hangingTimer = setTimeout(() => {
      console.log(
        `%c${_id}%c ⏳ Hanging: ${queryStart}`,
        'color: #888; font-weight: bold',
        'color: #f59e0b; font-style: italic'
      );
    }, 1492);

    try {
      const rtn = await queryFn();
      clearTimeout(hangingTimer);
      const duration = (performance.now() - start).toFixed(1);

      console.groupCollapsed(
        `%c${_id}%c ✓ ${queryStart} %c(${duration}ms)`,
        'color: #888; font-weight: bold',
        'color: #10b981',
        'color: #666; font-style: italic'
      );
      console.log(highlightedQuery); 
      this.logResult(rtn);
      console.groupEnd();
      return rtn;
    } catch (error) {
      clearTimeout(hangingTimer);
      const duration = (performance.now() - start).toFixed(1);
      const errMessages = Array.from(
        new Set((error as Error).message.split('\n').filter((e: string) => e.trim()))
      );
      console.groupCollapsed(
        `%c${_id}%c ❌ Error: ${queryStart} %c(${duration}ms)`,
        'color: #888; font-weight: bold',
        'color: #ef4444',
        'color: #666; font-style: italic'
      );
      console.log(highlightedQuery);
      console.error(errMessages.join('\n'));
      console.trace();
      console.groupEnd();
      throw error;
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
