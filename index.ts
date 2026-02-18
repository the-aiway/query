// import '../demo/styles/globals.css';
export { ConnectionPool, type InferredArrowTable } from './duck/ConnectionPool';
export { DuckQueryWasmProvider, DuckDBContext, useDuckDB, type DuckDBConfig, type DBResource } from './react/DuckDBProvider';
import QueryTable from './table/QueryTable';
export { QueryTable };
export { DataTable } from './table/QueryTable';
export type { InferSQL, Materialize, InferSQLStrict } from './duck/inferSqlReturntype';
export { toValues, toValuesSelect, type ValuesSchema } from './toValues';
export { DumpLogger } from './duck/DumpLogger';

export default QueryTable;
