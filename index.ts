// import '../demo/styles/globals.css';
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
