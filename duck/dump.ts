import { Table as ArrowTable } from 'apache-arrow';
import type { ConnectionPool } from './ConnectionPool';
import { highlightQuery } from './queryHighlighter';

let count = 0;

export interface DumpConsole {
  log(...args: any[]): void;
  error(...args: any[]): void;
  dir(obj: any, options?: any): void;
  groupCollapsed(...args: any[]): void;
  groupEnd(): void;
  trace(): void;
}

function logResults(rtn: ArrowTable, logger: DumpConsole) {
  const resultsProxy = { clickToSeeMore: true };
  Object.defineProperty(resultsProxy, 'results', {
    get: () => rtn.toArray().map((e) => (e as any)?.toJSON?.() ?? { ...e }),
    enumerable: true,
    configurable: true,
  });
  logger.dir(resultsProxy, { showHidden: true, depth: 4 });
}

export async function withDump<T>(
  query: string,
  pool: ConnectionPool,
  execute: () => Promise<T>,
  logger: DumpConsole = console
): Promise<T> {
  const _id = count++;
  const tokens = await pool.db.tokenize(query);
  const highlightedQuery = highlightQuery(query, tokens);
  const queryStart = highlightedQuery.replaceAll(/\n\s*/g, ' ').split(' ').slice(0, 15).join(' ');

  const start = performance.now();
  const hangingTimer = setTimeout(() => {
    logger.log(
      `%c${_id}%c ⏳ Hanging: ${queryStart}`,
      'color: #888; font-weight: bold',
      'color: #f59e0b; font-style: italic'
    );
  }, 1492);

  try {
    const rtn = await execute();
    clearTimeout(hangingTimer);
    const duration = (performance.now() - start).toFixed(1);

    logger.groupCollapsed(
      `%c${_id}%c ✓ ${queryStart} %c(${duration}ms)`,
      'color: #888; font-weight: bold',
      'color: inherit',
      'color: #666; font-style: italic'
    );
    logger.log(highlightedQuery);
    if (rtn instanceof ArrowTable) {
      logResults(rtn, logger);
    }
    logger.groupEnd();
    return rtn;
  } catch (error) {
    clearTimeout(hangingTimer);
    const duration = (performance.now() - start).toFixed(1);
    const errMessages = Array.from(
      new Set((error as Error).message.split('\n').filter((e: string) => e.trim()))
    );
    logger.groupCollapsed(
      `%c${_id}%c ❌ Error: ${queryStart} %c(${duration}ms)`,
      'color: #888; font-weight: bold',
      'color: red',
      'color: #666; font-style: italic'
    );
    logger.log(highlightedQuery);
    logger.error(errMessages.join('\n'));
    logger.trace();
    logger.groupEnd();
    throw error;
  }
}
