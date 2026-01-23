// import '../demo/styles/globals.css';
export { ConnectionPool, type InferredArrowTable } from './duck/ConnectionPool';
export {
  DuckQueryProvider,
  DuckDBContext,
  useDuckDB,
  type DuckQueryConfig,
  type DBResource,
} from './react/DuckDBProvider';
import QueryTable from './table/QueryTable';
export { QueryTable };
export { DataTable, query, fromJSON, type DataTableSource } from './table/QueryTable';
export type { InferSQL, Materialize, InferSQLStrict } from './duck/inferSqlReturntype';

export default QueryTable;
export * from './react/DuckQueryContext';
export * from './react/useFile';
export * from './react/useTable';
export * from './react/useSql';
