// import '../demo/styles/globals.css'; xx
console.log('hhhhhhhhere');
export { ConnectionPool, type InferredArrowTable } from './duck/ConnectionPool';
export {
  DuckQueryWasmProvider,
  DuckDBContext,
  useDuckDB,
  type DuckDBConfig,
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
export * from './react/useSqlQuery';
export * from './react/useSqlQuery.types';
export * from './react/SqlQueryContext';
