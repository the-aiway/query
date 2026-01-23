// import '../demo/styles/globals.css';
export { ConnectionPool, type InferredArrowTable } from './duck/ConnectionPool';
export {
  DuckDBProvider,
  DuckDBContext,
  useDuckDB,
  type DuckDBConfig,
  type DBResource,
} from './duck/DuckDBProvider';
import QueryTable from './table/QueryTable';
export { QueryTable };
export { DataTable, query, fromJSON, type DataTableSource } from './table/QueryTable';
export type { InferSQL, Materialize, InferSQLStrict } from './duck/inferSqlReturntype';

export default QueryTable;
export * from './duck/DuckQueryContext';
export * from './duck/useFile';
export * from './duck/useTable';
export * from './duck/useSql';
