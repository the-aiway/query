"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/web-worker/cjs/browser.js
var require_browser = __commonJS({
  "../../node_modules/web-worker/cjs/browser.js"(exports, module2) {
    module2.exports = Worker;
  }
});

// src/targets/duckdb.ts
var duckdb_exports = {};
__export(duckdb_exports, {
  AsyncDuckDB: () => AsyncDuckDB,
  AsyncDuckDBConnection: () => AsyncDuckDBConnection,
  AsyncDuckDBDispatcher: () => AsyncDuckDBDispatcher,
  AsyncPreparedStatement: () => AsyncPreparedStatement,
  AsyncResultStreamIterator: () => AsyncResultStreamIterator,
  ConsoleLogger: () => ConsoleLogger,
  DuckDBAccessMode: () => DuckDBAccessMode,
  DuckDBDataProtocol: () => DuckDBDataProtocol,
  IsArrowBuffer: () => IsArrowBuffer,
  IsDuckDBWasmRetry: () => IsDuckDBWasmRetry,
  LogEvent: () => LogEvent,
  LogLevel: () => LogLevel,
  LogOrigin: () => LogOrigin,
  LogTopic: () => LogTopic,
  PACKAGE_NAME: () => PACKAGE_NAME,
  PACKAGE_VERSION: () => PACKAGE_VERSION,
  PACKAGE_VERSION_MAJOR: () => PACKAGE_VERSION_MAJOR,
  PACKAGE_VERSION_MINOR: () => PACKAGE_VERSION_MINOR,
  PACKAGE_VERSION_PATCH: () => PACKAGE_VERSION_PATCH,
  StatusCode: () => StatusCode,
  TokenType: () => TokenType,
  VoidLogger: () => VoidLogger,
  WorkerRequestType: () => WorkerRequestType,
  WorkerResponseType: () => WorkerResponseType,
  WorkerTask: () => WorkerTask,
  createWorker: () => createWorker,
  getJsDelivrBundles: () => getJsDelivrBundles,
  getLogEventLabel: () => getLogEventLabel,
  getLogLevelLabel: () => getLogLevelLabel,
  getLogOriginLabel: () => getLogOriginLabel,
  getLogTopicLabel: () => getLogTopicLabel,
  getPlatformFeatures: () => getPlatformFeatures,
  isFirefox: () => isFirefox,
  isNode: () => isNode,
  isSafari: () => isSafari,
  selectBundle: () => selectBundle
});
module.exports = __toCommonJS(duckdb_exports);

// src/bindings/config.ts
var DuckDBAccessMode = /* @__PURE__ */ ((DuckDBAccessMode2) => {
  DuckDBAccessMode2[DuckDBAccessMode2["UNDEFINED"] = 0] = "UNDEFINED";
  DuckDBAccessMode2[DuckDBAccessMode2["AUTOMATIC"] = 1] = "AUTOMATIC";
  DuckDBAccessMode2[DuckDBAccessMode2["READ_ONLY"] = 2] = "READ_ONLY";
  DuckDBAccessMode2[DuckDBAccessMode2["READ_WRITE"] = 3] = "READ_WRITE";
  return DuckDBAccessMode2;
})(DuckDBAccessMode || {});

// src/bindings/tokens.ts
var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2[TokenType2["IDENTIFIER"] = 0] = "IDENTIFIER";
  TokenType2[TokenType2["NUMERIC_CONSTANT"] = 1] = "NUMERIC_CONSTANT";
  TokenType2[TokenType2["STRING_CONSTANT"] = 2] = "STRING_CONSTANT";
  TokenType2[TokenType2["OPERATOR"] = 3] = "OPERATOR";
  TokenType2[TokenType2["KEYWORD"] = 4] = "KEYWORD";
  TokenType2[TokenType2["COMMENT"] = 5] = "COMMENT";
  return TokenType2;
})(TokenType || {});

// src/log.ts
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["NONE"] = 0] = "NONE";
  LogLevel2[LogLevel2["DEBUG"] = 1] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARNING"] = 3] = "WARNING";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
var LogTopic = /* @__PURE__ */ ((LogTopic2) => {
  LogTopic2[LogTopic2["NONE"] = 0] = "NONE";
  LogTopic2[LogTopic2["CONNECT"] = 1] = "CONNECT";
  LogTopic2[LogTopic2["DISCONNECT"] = 2] = "DISCONNECT";
  LogTopic2[LogTopic2["OPEN"] = 3] = "OPEN";
  LogTopic2[LogTopic2["QUERY"] = 4] = "QUERY";
  LogTopic2[LogTopic2["INSTANTIATE"] = 5] = "INSTANTIATE";
  return LogTopic2;
})(LogTopic || {});
var LogEvent = /* @__PURE__ */ ((LogEvent2) => {
  LogEvent2[LogEvent2["NONE"] = 0] = "NONE";
  LogEvent2[LogEvent2["OK"] = 1] = "OK";
  LogEvent2[LogEvent2["ERROR"] = 2] = "ERROR";
  LogEvent2[LogEvent2["START"] = 3] = "START";
  LogEvent2[LogEvent2["RUN"] = 4] = "RUN";
  LogEvent2[LogEvent2["CAPTURE"] = 5] = "CAPTURE";
  return LogEvent2;
})(LogEvent || {});
var LogOrigin = /* @__PURE__ */ ((LogOrigin2) => {
  LogOrigin2[LogOrigin2["NONE"] = 0] = "NONE";
  LogOrigin2[LogOrigin2["WEB_WORKER"] = 1] = "WEB_WORKER";
  LogOrigin2[LogOrigin2["NODE_WORKER"] = 2] = "NODE_WORKER";
  LogOrigin2[LogOrigin2["BINDINGS"] = 3] = "BINDINGS";
  LogOrigin2[LogOrigin2["ASYNC_DUCKDB"] = 4] = "ASYNC_DUCKDB";
  return LogOrigin2;
})(LogOrigin || {});
var VoidLogger = class {
  log(_entry) {
  }
};
var ConsoleLogger = class {
  constructor(level = 2 /* INFO */) {
    this.level = level;
  }
  log(entry) {
    if (entry.level >= this.level) {
      console.log(entry);
    }
  }
};
function getLogLevelLabel(level) {
  switch (level) {
    case 0 /* NONE */:
      return "NONE";
    case 1 /* DEBUG */:
      return "DEBUG";
    case 2 /* INFO */:
      return "INFO";
    case 3 /* WARNING */:
      return "WARNING";
    case 4 /* ERROR */:
      return "ERROR";
    default:
      return "?";
  }
}
function getLogEventLabel(event) {
  switch (event) {
    case 0 /* NONE */:
      return "NONE";
    case 1 /* OK */:
      return "OK";
    case 2 /* ERROR */:
      return "ERROR";
    case 3 /* START */:
      return "START";
    case 4 /* RUN */:
      return "RUN";
    case 5 /* CAPTURE */:
      return "CAPTURE";
    default:
      return "?";
  }
}
function getLogTopicLabel(topic) {
  switch (topic) {
    case 1 /* CONNECT */:
      return "CONNECT";
    case 2 /* DISCONNECT */:
      return "DISCONNECT";
    case 5 /* INSTANTIATE */:
      return "INSTANTIATE";
    case 3 /* OPEN */:
      return "OPEN";
    case 4 /* QUERY */:
      return "QUERY";
    default:
      return "?";
  }
}
function getLogOriginLabel(origin) {
  switch (origin) {
    case 0 /* NONE */:
      return "NONE";
    case 1 /* WEB_WORKER */:
      return "WEB WORKER";
    case 2 /* NODE_WORKER */:
      return "NODE WORKER";
    case 3 /* BINDINGS */:
      return "DUCKDB BINDINGS";
    case 4 /* ASYNC_DUCKDB */:
      return "DUCKDB";
    default:
      return "?";
  }
}

// src/status.ts
var StatusCode = /* @__PURE__ */ ((StatusCode2) => {
  StatusCode2[StatusCode2["SUCCESS"] = 0] = "SUCCESS";
  StatusCode2[StatusCode2["MAX_ARROW_ERROR"] = 255] = "MAX_ARROW_ERROR";
  StatusCode2[StatusCode2["DUCKDB_WASM_RETRY"] = 256] = "DUCKDB_WASM_RETRY";
  return StatusCode2;
})(StatusCode || {});
function IsArrowBuffer(status) {
  return status <= 255 /* MAX_ARROW_ERROR */;
}
function IsDuckDBWasmRetry(status) {
  return status === 256 /* DUCKDB_WASM_RETRY */;
}

// src/parallel/async_connection.ts
var arrow = __toESM(require("apache-arrow"));
var queryIdCounter = 0;
function generateQueryId() {
  return "q_".concat(Date.now(), "_").concat(++queryIdCounter);
}
var AsyncDuckDBConnection = class {
  constructor(bindings, conn) {
    this._bindings = bindings;
    this._conn = conn;
  }
  /** Access the database bindings */
  get bindings() {
    return this._bindings;
  }
  /** Disconnect from the database */
  async close() {
    return this._bindings.disconnect(this._conn);
  }
  /** Brave souls may use this function to consume the underlying connection id */
  useUnsafe(callback) {
    return callback(this._bindings, this._conn);
  }
  /** Run a query */
  async query(text) {
    const queryId = generateQueryId();
    this._bindings.logger.log({
      timestamp: /* @__PURE__ */ new Date(),
      level: 2 /* INFO */,
      origin: 4 /* ASYNC_DUCKDB */,
      topic: 4 /* QUERY */,
      event: 4 /* RUN */,
      value: text,
      id: queryId
    });
    try {
      const buffer = await this._bindings.runQuery(this._conn, text);
      const reader = arrow.RecordBatchReader.from(buffer);
      console.assert(reader.isSync(), "Reader is not sync");
      console.assert(reader.isFile(), "Reader is not file");
      const table = new arrow.Table(reader);
      this._bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 2 /* INFO */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 1 /* OK */,
        value: void 0,
        id: queryId
      });
      return table;
    } catch (e) {
      this._bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 4 /* ERROR */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 2 /* ERROR */,
        value: String(e),
        id: queryId
      });
      throw e;
    }
  }
  /** Send a query */
  async send(text, allowStreamResult = false) {
    const queryId = generateQueryId();
    this._bindings.logger.log({
      timestamp: /* @__PURE__ */ new Date(),
      level: 2 /* INFO */,
      origin: 4 /* ASYNC_DUCKDB */,
      topic: 4 /* QUERY */,
      event: 4 /* RUN */,
      value: text,
      id: queryId
    });
    try {
      let header = await this._bindings.startPendingQuery(this._conn, text, allowStreamResult);
      while (header == null) {
        if (this._bindings.isDetached()) {
          const err = "cannot send a message since the worker is not set!";
          console.error(err);
          this._bindings.logger.log({
            timestamp: /* @__PURE__ */ new Date(),
            level: 4 /* ERROR */,
            origin: 4 /* ASYNC_DUCKDB */,
            topic: 4 /* QUERY */,
            event: 2 /* ERROR */,
            value: err,
            id: queryId
          });
          return void 0;
        }
        header = await this._bindings.pollPendingQuery(this._conn);
      }
      const iter = new AsyncResultStreamIterator(this._bindings, this._conn, header);
      const reader = await arrow.RecordBatchReader.from(iter);
      console.assert(reader.isAsync());
      console.assert(reader.isStream());
      this._bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 2 /* INFO */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 1 /* OK */,
        value: void 0,
        id: queryId
      });
      return reader;
    } catch (e) {
      this._bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 4 /* ERROR */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 2 /* ERROR */,
        value: String(e),
        id: queryId
      });
      throw e;
    }
  }
  /** Cancel a query that was sent earlier */
  async cancelSent() {
    return await this._bindings.cancelPendingQuery(this._conn);
  }
  /** Get table names */
  async getTableNames(query) {
    return await this._bindings.getTableNames(this._conn, query);
  }
  /** Create a prepared statement */
  async prepare(text) {
    const stmt = await this._bindings.createPrepared(this._conn, text);
    return new AsyncPreparedStatement(this._bindings, this._conn, stmt);
  }
  /** Insert an arrow table */
  async insertArrowTable(table, options) {
    const buffer = arrow.tableToIPC(table, "stream");
    await this.insertArrowFromIPCStream(buffer, options);
  }
  /** Insert an arrow table from an ipc stream */
  async insertArrowFromIPCStream(buffer, options) {
    await this._bindings.insertArrowFromIPCStream(this._conn, buffer, options);
  }
  /** Insert csv file from path */
  async insertCSVFromPath(text, options) {
    await this._bindings.insertCSVFromPath(this._conn, text, options);
  }
  /** Insert json file from path */
  async insertJSONFromPath(text, options) {
    await this._bindings.insertJSONFromPath(this._conn, text, options);
  }
};
var AsyncResultStreamIterator = class {
  constructor(db, conn, header) {
    this.db = db;
    this.conn = conn;
    this.header = header;
    this._first = true;
    this._depleted = false;
    this._inFlight = null;
  }
  async next() {
    if (this._first) {
      this._first = false;
      return { done: false, value: this.header };
    }
    if (this._depleted) {
      return { done: true, value: null };
    }
    let buffer = null;
    if (this._inFlight != null) {
      buffer = await this._inFlight;
      this._inFlight = null;
    }
    while (buffer == null) {
      buffer = await this.db.fetchQueryResults(this.conn);
    }
    this._depleted = buffer.length == 0;
    if (!this._depleted) {
      this._inFlight = this.db.fetchQueryResults(this.conn);
    }
    return {
      done: this._depleted,
      value: buffer
    };
  }
  [Symbol.asyncIterator]() {
    return this;
  }
};
var AsyncPreparedStatement = class {
  /** Constructor */
  constructor(bindings, connectionId, statementId) {
    this.bindings = bindings;
    this.connectionId = connectionId;
    this.statementId = statementId;
  }
  /** Close a prepared statement */
  async close() {
    await this.bindings.closePrepared(this.connectionId, this.statementId);
  }
  /** Run a prepared statement */
  async query(...params) {
    const queryId = generateQueryId();
    this.bindings.logger.log({
      timestamp: /* @__PURE__ */ new Date(),
      level: 2 /* INFO */,
      origin: 4 /* ASYNC_DUCKDB */,
      topic: 4 /* QUERY */,
      event: 4 /* RUN */,
      value: "Prepared statement ".concat(this.statementId),
      id: queryId
    });
    try {
      const buffer = await this.bindings.runPrepared(this.connectionId, this.statementId, params);
      const reader = arrow.RecordBatchReader.from(buffer);
      console.assert(reader.isSync());
      console.assert(reader.isFile());
      const table = new arrow.Table(reader);
      this.bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 2 /* INFO */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 1 /* OK */,
        value: void 0,
        id: queryId
      });
      return table;
    } catch (e) {
      this.bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 4 /* ERROR */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 2 /* ERROR */,
        value: String(e),
        id: queryId
      });
      throw e;
    }
  }
  /** Send a prepared statement */
  async send(...params) {
    const queryId = generateQueryId();
    this.bindings.logger.log({
      timestamp: /* @__PURE__ */ new Date(),
      level: 2 /* INFO */,
      origin: 4 /* ASYNC_DUCKDB */,
      topic: 4 /* QUERY */,
      event: 4 /* RUN */,
      value: "Prepared statement ".concat(this.statementId),
      id: queryId
    });
    try {
      const header = await this.bindings.sendPrepared(this.connectionId, this.statementId, params);
      const iter = new AsyncResultStreamIterator(this.bindings, this.connectionId, header);
      const reader = await arrow.RecordBatchReader.from(iter);
      console.assert(reader.isAsync());
      console.assert(reader.isStream());
      this.bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 2 /* INFO */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 1 /* OK */,
        value: void 0,
        id: queryId
      });
      return reader;
    } catch (e) {
      this.bindings.logger.log({
        timestamp: /* @__PURE__ */ new Date(),
        level: 4 /* ERROR */,
        origin: 4 /* ASYNC_DUCKDB */,
        topic: 4 /* QUERY */,
        event: 2 /* ERROR */,
        value: String(e),
        id: queryId
      });
      throw e;
    }
  }
};

// src/parallel/worker_request.ts
var WorkerRequestType = /* @__PURE__ */ ((WorkerRequestType2) => {
  WorkerRequestType2["CANCEL_PENDING_QUERY"] = "CANCEL_PENDING_QUERY";
  WorkerRequestType2["CLOSE_PREPARED"] = "CLOSE_PREPARED";
  WorkerRequestType2["COLLECT_FILE_STATISTICS"] = "COLLECT_FILE_STATISTICS";
  WorkerRequestType2["REGISTER_OPFS_FILE_NAME"] = "REGISTER_OPFS_FILE_NAME";
  WorkerRequestType2["CONNECT"] = "CONNECT";
  WorkerRequestType2["COPY_FILE_TO_BUFFER"] = "COPY_FILE_TO_BUFFER";
  WorkerRequestType2["COPY_FILE_TO_PATH"] = "COPY_FILE_TO_PATH";
  WorkerRequestType2["CREATE_PREPARED"] = "CREATE_PREPARED";
  WorkerRequestType2["DISCONNECT"] = "DISCONNECT";
  WorkerRequestType2["DROP_FILE"] = "DROP_FILE";
  WorkerRequestType2["DROP_FILES"] = "DROP_FILES";
  WorkerRequestType2["EXPORT_FILE_STATISTICS"] = "EXPORT_FILE_STATISTICS";
  WorkerRequestType2["FETCH_QUERY_RESULTS"] = "FETCH_QUERY_RESULTS";
  WorkerRequestType2["FLUSH_FILES"] = "FLUSH_FILES";
  WorkerRequestType2["GET_FEATURE_FLAGS"] = "GET_FEATURE_FLAGS";
  WorkerRequestType2["GET_TABLE_NAMES"] = "GET_TABLE_NAMES";
  WorkerRequestType2["GET_VERSION"] = "GET_VERSION";
  WorkerRequestType2["GLOB_FILE_INFOS"] = "GLOB_FILE_INFOS";
  WorkerRequestType2["INSERT_ARROW_FROM_IPC_STREAM"] = "INSERT_ARROW_FROM_IPC_STREAM";
  WorkerRequestType2["INSERT_CSV_FROM_PATH"] = "IMPORT_CSV_FROM_PATH";
  WorkerRequestType2["INSERT_JSON_FROM_PATH"] = "IMPORT_JSON_FROM_PATH";
  WorkerRequestType2["INSTANTIATE"] = "INSTANTIATE";
  WorkerRequestType2["OPEN"] = "OPEN";
  WorkerRequestType2["PING"] = "PING";
  WorkerRequestType2["POLL_PENDING_QUERY"] = "POLL_PENDING_QUERY";
  WorkerRequestType2["REGISTER_FILE_BUFFER"] = "REGISTER_FILE_BUFFER";
  WorkerRequestType2["REGISTER_FILE_HANDLE"] = "REGISTER_FILE_HANDLE";
  WorkerRequestType2["REGISTER_FILE_URL"] = "REGISTER_FILE_URL";
  WorkerRequestType2["RESET"] = "RESET";
  WorkerRequestType2["RUN_PREPARED"] = "RUN_PREPARED";
  WorkerRequestType2["RUN_QUERY"] = "RUN_QUERY";
  WorkerRequestType2["SEND_PREPARED"] = "SEND_PREPARED";
  WorkerRequestType2["START_PENDING_QUERY"] = "START_PENDING_QUERY";
  WorkerRequestType2["TOKENIZE"] = "TOKENIZE";
  return WorkerRequestType2;
})(WorkerRequestType || {});
var WorkerResponseType = /* @__PURE__ */ ((WorkerResponseType2) => {
  WorkerResponseType2["CONNECTION_INFO"] = "CONNECTION_INFO";
  WorkerResponseType2["ERROR"] = "ERROR";
  WorkerResponseType2["FEATURE_FLAGS"] = "FEATURE_FLAGS";
  WorkerResponseType2["FILE_BUFFER"] = "FILE_BUFFER";
  WorkerResponseType2["FILE_INFOS"] = "FILE_INFOS";
  WorkerResponseType2["FILE_SIZE"] = "FILE_SIZE";
  WorkerResponseType2["FILE_STATISTICS"] = "FILE_STATISTICS";
  WorkerResponseType2["INSTANTIATE_PROGRESS"] = "INSTANTIATE_PROGRESS";
  WorkerResponseType2["LOG"] = "LOG";
  WorkerResponseType2["PROGRESS_UPDATE"] = "PROGRESS_UPDATE";
  WorkerResponseType2["OK"] = "OK";
  WorkerResponseType2["PREPARED_STATEMENT_ID"] = "PREPARED_STATEMENT_ID";
  WorkerResponseType2["QUERY_PLAN"] = "QUERY_PLAN";
  WorkerResponseType2["QUERY_RESULT"] = "QUERY_RESULT";
  WorkerResponseType2["QUERY_RESULT_CHUNK"] = "QUERY_RESULT_CHUNK";
  WorkerResponseType2["QUERY_RESULT_HEADER"] = "QUERY_RESULT_HEADER";
  WorkerResponseType2["QUERY_RESULT_HEADER_OR_NULL"] = "QUERY_RESULT_HEADER_OR_NULL";
  WorkerResponseType2["REGISTERED_FILE"] = "REGISTERED_FILE";
  WorkerResponseType2["SCRIPT_TOKENS"] = "SCRIPT_TOKENS";
  WorkerResponseType2["SUCCESS"] = "SUCCESS";
  WorkerResponseType2["TABLE_NAMES"] = "TABLE_NAMES";
  WorkerResponseType2["VERSION_STRING"] = "VERSION_STRING";
  return WorkerResponseType2;
})(WorkerResponseType || {});
var WorkerTask = class {
  constructor(type, data) {
    this.promiseResolver = () => {
    };
    this.promiseRejecter = () => {
    };
    this.type = type;
    this.data = data;
    this.promise = new Promise(
      (resolve, reject) => {
        this.promiseResolver = resolve;
        this.promiseRejecter = reject;
      }
    );
  }
};

// src/json_typedef.ts
var arrow2 = __toESM(require("apache-arrow"));
function arrowToSQLType(type) {
  switch (type.typeId) {
    case arrow2.Type.Binary:
      return { sqlType: "binary" };
    case arrow2.Type.Bool:
      return { sqlType: "bool" };
    case arrow2.Type.Date:
      return { sqlType: "date" };
    case arrow2.Type.DateDay:
      return { sqlType: "date32[d]" };
    case arrow2.Type.DateMillisecond:
      return { sqlType: "date64[ms]" };
    case arrow2.Type.Decimal: {
      const dec = type;
      return { sqlType: "decimal", precision: dec.precision, scale: dec.scale };
    }
    case arrow2.Type.Float:
      return { sqlType: "float" };
    case arrow2.Type.Float16:
      return { sqlType: "float16" };
    case arrow2.Type.Float32:
      return { sqlType: "float32" };
    case arrow2.Type.Float64:
      return { sqlType: "float64" };
    case arrow2.Type.Int:
      return { sqlType: "int32" };
    case arrow2.Type.Int16:
      return { sqlType: "int16" };
    case arrow2.Type.Int32:
      return { sqlType: "int32" };
    case arrow2.Type.Int64:
      return { sqlType: "int64" };
    case arrow2.Type.Uint16:
      return { sqlType: "uint16" };
    case arrow2.Type.Uint32:
      return { sqlType: "uint32" };
    case arrow2.Type.Uint64:
      return { sqlType: "uint64" };
    case arrow2.Type.Uint8:
      return { sqlType: "uint8" };
    case arrow2.Type.IntervalDayTime:
      return { sqlType: "interval[dt]" };
    case arrow2.Type.IntervalYearMonth:
      return { sqlType: "interval[m]" };
    case arrow2.Type.List: {
      const list = type;
      return {
        sqlType: "list",
        valueType: arrowToSQLType(list.valueType)
      };
    }
    case arrow2.Type.FixedSizeBinary: {
      const bin = type;
      return { sqlType: "fixedsizebinary", byteWidth: bin.byteWidth };
    }
    case arrow2.Type.Null:
      return { sqlType: "null" };
    case arrow2.Type.Utf8:
      return { sqlType: "utf8" };
    case arrow2.Type.Struct: {
      const struct_ = type;
      return {
        sqlType: "struct",
        fields: struct_.children.map((c) => arrowToSQLField(c.name, c.type))
      };
    }
    case arrow2.Type.Map: {
      const map_ = type;
      return {
        sqlType: "map",
        keyType: arrowToSQLType(map_.keyType),
        valueType: arrowToSQLType(map_.valueType)
      };
    }
    case arrow2.Type.Time:
      return { sqlType: "time[s]" };
    case arrow2.Type.TimeMicrosecond:
      return { sqlType: "time[us]" };
    case arrow2.Type.TimeMillisecond:
      return { sqlType: "time[ms]" };
    case arrow2.Type.TimeNanosecond:
      return { sqlType: "time[ns]" };
    case arrow2.Type.TimeSecond:
      return { sqlType: "time[s]" };
    case arrow2.Type.Timestamp: {
      const ts = type;
      return { sqlType: "timestamp", timezone: ts.timezone || void 0 };
    }
    case arrow2.Type.TimestampSecond: {
      const ts = type;
      return { sqlType: "timestamp[s]", timezone: ts.timezone || void 0 };
    }
    case arrow2.Type.TimestampMicrosecond: {
      const ts = type;
      return { sqlType: "timestamp[us]", timezone: ts.timezone || void 0 };
    }
    case arrow2.Type.TimestampNanosecond: {
      const ts = type;
      return { sqlType: "timestamp[ns]", timezone: ts.timezone || void 0 };
    }
    case arrow2.Type.TimestampMillisecond: {
      const ts = type;
      return { sqlType: "timestamp[ms]", timezone: ts.timezone || void 0 };
    }
  }
  throw new Error("unsupported arrow type: ".concat(type.toString()));
}
function arrowToSQLField(name, type) {
  const t = arrowToSQLType(type);
  t.name = name;
  return t;
}

// src/utils/opfs_util.ts
var REGEX_OPFS_FILE = /'(opfs:\/\/\S*?)'/g;
var REGEX_OPFS_PROTOCOL = /(opfs:\/\/\S*?)/g;
function isOPFSProtocol(path) {
  return path.search(REGEX_OPFS_PROTOCOL) > -1;
}
function searchOPFSFiles(text) {
  return [...text.matchAll(REGEX_OPFS_FILE)].map((match) => match[1]);
}

// src/parallel/async_bindings.ts
var TEXT_ENCODER = new TextEncoder();
var AsyncDuckDB = class {
  constructor(logger, worker = null) {
    /** Instantiate the module */
    this._onInstantiationProgress = [];
    /** Progress callbacks */
    this._onExecutionProgress = [];
    /** The worker */
    this._worker = null;
    /** The promise for the worker shutdown */
    this._workerShutdownPromise = null;
    /** Make the worker as terminated */
    this._workerShutdownResolver = () => {
    };
    /** The next message id */
    this._nextMessageId = 0;
    /** The pending requests */
    this._pendingRequests = /* @__PURE__ */ new Map();
    /** The DuckDBConfig */
    this._config = {};
    this._logger = logger;
    this._onMessageHandler = this.onMessage.bind(this);
    this._onErrorHandler = this.onError.bind(this);
    this._onCloseHandler = this.onClose.bind(this);
    if (worker != null)
      this.attach(worker);
  }
  /** Get the logger */
  get logger() {
    return this._logger;
  }
  /** Get the logger */
  get config() {
    return this._config;
  }
  /** Attach to worker */
  attach(worker) {
    this._worker = worker;
    this._worker.addEventListener("message", this._onMessageHandler);
    this._worker.addEventListener("error", this._onErrorHandler);
    this._worker.addEventListener("close", this._onCloseHandler);
    this._workerShutdownPromise = new Promise(
      (resolve, _reject) => {
        this._workerShutdownResolver = resolve;
      }
    );
  }
  /** Detach from worker */
  detach() {
    if (!this._worker)
      return;
    this._worker.removeEventListener("message", this._onMessageHandler);
    this._worker.removeEventListener("error", this._onErrorHandler);
    this._worker.removeEventListener("close", this._onCloseHandler);
    this._worker = null;
    this._workerShutdownResolver(null);
    this._workerShutdownPromise = null;
    this._workerShutdownResolver = () => {
    };
  }
  /** Kill the worker */
  async terminate() {
    if (!this._worker)
      return;
    this._worker.terminate();
    this._worker = null;
    this._workerShutdownPromise = null;
    this._workerShutdownResolver = () => {
    };
  }
  /** Post a task */
  async postTask(task, transfer = []) {
    if (!this._worker) {
      console.error("cannot send a message since the worker is not set!:" + task.type + "," + task.data);
      return void 0;
    }
    const mid = this._nextMessageId++;
    this._pendingRequests.set(mid, task);
    this._worker.postMessage(
      {
        messageId: mid,
        type: task.type,
        data: task.data
      },
      transfer
    );
    return await task.promise;
  }
  /** Received a message */
  onMessage(event) {
    var _a;
    const response = event.data;
    switch (response.type) {
      case "PROGRESS_UPDATE" /* PROGRESS_UPDATE */: {
        for (const p of this._onExecutionProgress) {
          p(response.data);
        }
        return;
      }
      case "LOG" /* LOG */: {
        this._logger.log(response.data);
        return;
      }
      case "INSTANTIATE_PROGRESS" /* INSTANTIATE_PROGRESS */: {
        for (const p of this._onInstantiationProgress) {
          p(response.data);
        }
        return;
      }
    }
    const task = this._pendingRequests.get(response.requestId);
    if (!task) {
      console.warn("unassociated response: [".concat(response.requestId, ", ").concat(response.type.toString(), "]"));
      return;
    }
    this._pendingRequests.delete(response.requestId);
    if (response.type == "ERROR" /* ERROR */) {
      const e = new Error(response.data.message);
      e.name = response.data.name;
      if ((_a = Object.getOwnPropertyDescriptor(e, "stack")) == null ? void 0 : _a.writable) {
        e.stack = response.data.stack;
      }
      task.promiseRejecter(e);
      return;
    }
    switch (task.type) {
      case "CLOSE_PREPARED" /* CLOSE_PREPARED */:
      case "COLLECT_FILE_STATISTICS" /* COLLECT_FILE_STATISTICS */:
      case "REGISTER_OPFS_FILE_NAME" /* REGISTER_OPFS_FILE_NAME */:
      case "COPY_FILE_TO_PATH" /* COPY_FILE_TO_PATH */:
      case "DISCONNECT" /* DISCONNECT */:
      case "DROP_FILE" /* DROP_FILE */:
      case "DROP_FILES" /* DROP_FILES */:
      case "FLUSH_FILES" /* FLUSH_FILES */:
      case "INSERT_ARROW_FROM_IPC_STREAM" /* INSERT_ARROW_FROM_IPC_STREAM */:
      case "IMPORT_CSV_FROM_PATH" /* INSERT_CSV_FROM_PATH */:
      case "IMPORT_JSON_FROM_PATH" /* INSERT_JSON_FROM_PATH */:
      case "OPEN" /* OPEN */:
      case "PING" /* PING */:
      case "REGISTER_FILE_BUFFER" /* REGISTER_FILE_BUFFER */:
      case "REGISTER_FILE_HANDLE" /* REGISTER_FILE_HANDLE */:
      case "REGISTER_FILE_URL" /* REGISTER_FILE_URL */:
      case "RESET" /* RESET */:
        if (response.type == "OK" /* OK */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "INSTANTIATE" /* INSTANTIATE */:
        this._onInstantiationProgress = [];
        if (response.type == "OK" /* OK */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "GLOB_FILE_INFOS" /* GLOB_FILE_INFOS */:
        if (response.type == "FILE_INFOS" /* FILE_INFOS */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "GET_VERSION" /* GET_VERSION */:
        if (response.type == "VERSION_STRING" /* VERSION_STRING */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "GET_FEATURE_FLAGS" /* GET_FEATURE_FLAGS */:
        if (response.type == "FEATURE_FLAGS" /* FEATURE_FLAGS */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "GET_TABLE_NAMES" /* GET_TABLE_NAMES */:
        if (response.type == "TABLE_NAMES" /* TABLE_NAMES */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "TOKENIZE" /* TOKENIZE */:
        if (response.type == "SCRIPT_TOKENS" /* SCRIPT_TOKENS */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "COPY_FILE_TO_BUFFER" /* COPY_FILE_TO_BUFFER */:
        if (response.type == "FILE_BUFFER" /* FILE_BUFFER */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "EXPORT_FILE_STATISTICS" /* EXPORT_FILE_STATISTICS */:
        if (response.type == "FILE_STATISTICS" /* FILE_STATISTICS */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "CONNECT" /* CONNECT */:
        if (response.type == "CONNECTION_INFO" /* CONNECTION_INFO */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "RUN_PREPARED" /* RUN_PREPARED */:
      case "RUN_QUERY" /* RUN_QUERY */:
        if (response.type == "QUERY_RESULT" /* QUERY_RESULT */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "SEND_PREPARED" /* SEND_PREPARED */:
        if (response.type == "QUERY_RESULT_HEADER" /* QUERY_RESULT_HEADER */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "START_PENDING_QUERY" /* START_PENDING_QUERY */:
        if (response.type == "QUERY_RESULT_HEADER_OR_NULL" /* QUERY_RESULT_HEADER_OR_NULL */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "POLL_PENDING_QUERY" /* POLL_PENDING_QUERY */:
        if (response.type == "QUERY_RESULT_HEADER_OR_NULL" /* QUERY_RESULT_HEADER_OR_NULL */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "CANCEL_PENDING_QUERY" /* CANCEL_PENDING_QUERY */:
        this._onInstantiationProgress = [];
        if (response.type == "SUCCESS" /* SUCCESS */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "FETCH_QUERY_RESULTS" /* FETCH_QUERY_RESULTS */:
        if (response.type == "QUERY_RESULT_CHUNK" /* QUERY_RESULT_CHUNK */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
      case "CREATE_PREPARED" /* CREATE_PREPARED */:
        if (response.type == "PREPARED_STATEMENT_ID" /* PREPARED_STATEMENT_ID */) {
          task.promiseResolver(response.data);
          return;
        }
        break;
    }
    task.promiseRejecter(new Error("unexpected response type: ".concat(response.type.toString())));
  }
  /** Received an error */
  onError(event) {
    console.error(event);
    console.error("error in duckdb worker: ".concat(event.message));
    this._pendingRequests.clear();
  }
  /** The worker was closed */
  onClose() {
    this._workerShutdownResolver(null);
    if (this._pendingRequests.size != 0) {
      console.warn("worker terminated with ".concat(this._pendingRequests.size, " pending requests"));
      return;
    }
    this._pendingRequests.clear();
  }
  /** Is in detached state, no worker defined */
  isDetached() {
    return !this._worker;
  }
  /** Reset the duckdb */
  async reset() {
    const task = new WorkerTask("RESET" /* RESET */, null);
    return await this.postTask(task);
  }
  /** Ping the worker thread */
  async ping() {
    const task = new WorkerTask("PING" /* PING */, null);
    await this.postTask(task);
  }
  /** Try to drop a file */
  async dropFile(name) {
    const task = new WorkerTask("DROP_FILE" /* DROP_FILE */, name);
    return await this.postTask(task);
  }
  /** Try to drop files */
  async dropFiles(names) {
    const task = new WorkerTask("DROP_FILES" /* DROP_FILES */, names);
    return await this.postTask(task);
  }
  /** Flush all files */
  async flushFiles() {
    const task = new WorkerTask("FLUSH_FILES" /* FLUSH_FILES */, null);
    return await this.postTask(task);
  }
  /** Open the database */
  async instantiate(mainModuleURL, pthreadWorkerURL = null, progress = (_p) => {
  }) {
    this._onInstantiationProgress.push(progress);
    const task = new WorkerTask(
      "INSTANTIATE" /* INSTANTIATE */,
      [mainModuleURL, pthreadWorkerURL]
    );
    return await this.postTask(task);
  }
  /** Get the version */
  async getVersion() {
    const task = new WorkerTask("GET_VERSION" /* GET_VERSION */, null);
    const version = await this.postTask(task);
    return version;
  }
  /** Get the feature flags */
  async getFeatureFlags() {
    const task = new WorkerTask(
      "GET_FEATURE_FLAGS" /* GET_FEATURE_FLAGS */,
      null
    );
    const feature = await this.postTask(task);
    return feature;
  }
  /** Open a new database */
  async open(config) {
    this._config = config;
    const task = new WorkerTask("OPEN" /* OPEN */, config);
    await this.postTask(task);
  }
  /** Tokenize a script text */
  async tokenize(text) {
    const task = new WorkerTask("TOKENIZE" /* TOKENIZE */, text);
    const tokens = await this.postTask(task);
    return tokens;
  }
  /** Connect to the database */
  async connectInternal() {
    const task = new WorkerTask("CONNECT" /* CONNECT */, null);
    return await this.postTask(task);
  }
  /** Connect to the database */
  async connect() {
    const cid = await this.connectInternal();
    return new AsyncDuckDBConnection(this, cid);
  }
  /** Disconnect from the database */
  async disconnect(conn) {
    const task = new WorkerTask(
      "DISCONNECT" /* DISCONNECT */,
      conn
    );
    await this.postTask(task);
  }
  /** Run a query */
  async runQuery(conn, text) {
    if (this.shouldOPFSFileHandling()) {
      const files = await this.registerOPFSFileFromSQL(text);
      try {
        return await this._runQueryAsync(conn, text);
      } finally {
        if (files.length > 0) {
          await this.dropFiles(files);
        }
      }
    } else {
      return await this._runQueryAsync(conn, text);
    }
  }
  async _runQueryAsync(conn, text) {
    const task = new WorkerTask(
      "RUN_QUERY" /* RUN_QUERY */,
      [conn, text]
    );
    return await this.postTask(task);
  }
  /** Start a pending query */
  async startPendingQuery(conn, text, allowStreamResult = false) {
    if (this.shouldOPFSFileHandling()) {
      const files = await this.registerOPFSFileFromSQL(text);
      try {
        return await this._startPendingQueryAsync(conn, text, allowStreamResult);
      } finally {
        if (files.length > 0) {
          await this.dropFiles(files);
        }
      }
    } else {
      return await this._startPendingQueryAsync(conn, text, allowStreamResult);
    }
  }
  async _startPendingQueryAsync(conn, text, allowStreamResult = false) {
    const task = new WorkerTask("START_PENDING_QUERY" /* START_PENDING_QUERY */, [conn, text, allowStreamResult]);
    return await this.postTask(task);
  }
  /** Poll a pending query */
  async pollPendingQuery(conn) {
    const task = new WorkerTask(
      "POLL_PENDING_QUERY" /* POLL_PENDING_QUERY */,
      conn
    );
    return await this.postTask(task);
  }
  /** Cancel a pending query */
  async cancelPendingQuery(conn) {
    const task = new WorkerTask(
      "CANCEL_PENDING_QUERY" /* CANCEL_PENDING_QUERY */,
      conn
    );
    return await this.postTask(task);
  }
  /** Fetch query results */
  async fetchQueryResults(conn) {
    const task = new WorkerTask(
      "FETCH_QUERY_RESULTS" /* FETCH_QUERY_RESULTS */,
      conn
    );
    return await this.postTask(task);
  }
  /** Get table names */
  async getTableNames(conn, text) {
    const task = new WorkerTask(
      "GET_TABLE_NAMES" /* GET_TABLE_NAMES */,
      [conn, text]
    );
    return await this.postTask(task);
  }
  /** Prepare a statement and return its identifier */
  async createPrepared(conn, text) {
    const task = new WorkerTask(
      "CREATE_PREPARED" /* CREATE_PREPARED */,
      [conn, text]
    );
    return await this.postTask(task);
  }
  /** Close a prepared statement */
  async closePrepared(conn, statement) {
    const task = new WorkerTask(
      "CLOSE_PREPARED" /* CLOSE_PREPARED */,
      [conn, statement]
    );
    await this.postTask(task);
  }
  /** Execute a prepared statement and return the full result */
  async runPrepared(conn, statement, params) {
    const task = new WorkerTask(
      "RUN_PREPARED" /* RUN_PREPARED */,
      [conn, statement, params]
    );
    return await this.postTask(task);
  }
  /** Execute a prepared statement and stream the result */
  async sendPrepared(conn, statement, params) {
    const task = new WorkerTask(
      "SEND_PREPARED" /* SEND_PREPARED */,
      [conn, statement, params]
    );
    return await this.postTask(task);
  }
  /** Glob file infos */
  async globFiles(path) {
    const task = new WorkerTask(
      "GLOB_FILE_INFOS" /* GLOB_FILE_INFOS */,
      path
    );
    return await this.postTask(task);
  }
  /** Register file text */
  async registerFileText(name, text) {
    const buffer = TEXT_ENCODER.encode(text);
    await this.registerFileBuffer(name, buffer);
  }
  /** Register a file path. */
  async registerFileURL(name, url, proto, directIO) {
    if (url === void 0) {
      url = name;
    }
    const task = new WorkerTask("REGISTER_FILE_URL" /* REGISTER_FILE_URL */, [name, url, proto, directIO]);
    await this.postTask(task);
  }
  /** Register an empty file buffer. */
  async registerEmptyFileBuffer(name) {
  }
  /** Register a file buffer. */
  async registerFileBuffer(name, buffer) {
    const task = new WorkerTask(
      "REGISTER_FILE_BUFFER" /* REGISTER_FILE_BUFFER */,
      [name, buffer]
    );
    await this.postTask(task, [buffer.buffer]);
  }
  /** Register a file handle. */
  async registerFileHandle(name, handle, protocol, directIO) {
    const task = new WorkerTask("REGISTER_FILE_HANDLE" /* REGISTER_FILE_HANDLE */, [name, handle, protocol, directIO]);
    await this.postTask(task, []);
  }
  /** Enable file statistics */
  async registerOPFSFileName(name) {
    const task = new WorkerTask(
      "REGISTER_OPFS_FILE_NAME" /* REGISTER_OPFS_FILE_NAME */,
      [name]
    );
    await this.postTask(task, []);
  }
  /** Enable file statistics */
  async collectFileStatistics(name, enable) {
    const task = new WorkerTask(
      "COLLECT_FILE_STATISTICS" /* COLLECT_FILE_STATISTICS */,
      [name, enable]
    );
    await this.postTask(task, []);
  }
  /** Export file statistics */
  async exportFileStatistics(name) {
    const task = new WorkerTask(
      "EXPORT_FILE_STATISTICS" /* EXPORT_FILE_STATISTICS */,
      name
    );
    return await this.postTask(task, []);
  }
  /** Copy a file to a buffer. */
  async copyFileToBuffer(name) {
    const task = new WorkerTask(
      "COPY_FILE_TO_BUFFER" /* COPY_FILE_TO_BUFFER */,
      name
    );
    return await this.postTask(task);
  }
  /** Copy a file to a path. */
  async copyFileToPath(name, path) {
    const task = new WorkerTask(
      "COPY_FILE_TO_PATH" /* COPY_FILE_TO_PATH */,
      [name, path]
    );
    await this.postTask(task);
  }
  /** Insert arrow from an ipc stream */
  async insertArrowFromIPCStream(conn, buffer, options) {
    if (buffer.length == 0)
      return;
    const task = new WorkerTask("INSERT_ARROW_FROM_IPC_STREAM" /* INSERT_ARROW_FROM_IPC_STREAM */, [conn, buffer, options]);
    await this.postTask(task, [buffer.buffer]);
  }
  /** Insert a csv file */
  async insertCSVFromPath(conn, path, options) {
    if (options.columns !== void 0) {
      const out = [];
      for (const k in options.columns) {
        const type = options.columns[k];
        out.push(arrowToSQLField(k, type));
      }
      options.columnsFlat = out;
      delete options.columns;
    }
    const task = new WorkerTask(
      "IMPORT_CSV_FROM_PATH" /* INSERT_CSV_FROM_PATH */,
      [conn, path, options]
    );
    await this.postTask(task);
  }
  /** Insert a json file */
  async insertJSONFromPath(conn, path, options) {
    if (options.columns !== void 0) {
      const out = [];
      for (const k in options.columns) {
        const type = options.columns[k];
        out.push(arrowToSQLField(k, type));
      }
      options.columnsFlat = out;
      delete options.columns;
    }
    const task = new WorkerTask(
      "IMPORT_JSON_FROM_PATH" /* INSERT_JSON_FROM_PATH */,
      [conn, path, options]
    );
    await this.postTask(task);
  }
  shouldOPFSFileHandling() {
    var _a, _b;
    if (isOPFSProtocol((_a = this.config.path) != null ? _a : "")) {
      return ((_b = this.config.opfs) == null ? void 0 : _b.fileHandling) == "auto";
    }
    return false;
  }
  async registerOPFSFileFromSQL(text) {
    const files = searchOPFSFiles(text);
    const result = [];
    for (const file of files) {
      try {
        await this.registerOPFSFileName(file);
        result.push(file);
      } catch (e) {
        console.error(e);
        throw new Error("File Not found:" + file);
      }
    }
    return result;
  }
};

// src/bindings/runtime.ts
function TextDecoderWrapper() {
  const decoder = new TextDecoder();
  return (data) => {
    if (typeof SharedArrayBuffer !== "undefined" && data.buffer instanceof SharedArrayBuffer) {
      data = new Uint8Array(data);
    }
    return decoder.decode(data);
  };
}
var decodeText = TextDecoderWrapper();
var DuckDBDataProtocol = /* @__PURE__ */ ((DuckDBDataProtocol2) => {
  DuckDBDataProtocol2[DuckDBDataProtocol2["BUFFER"] = 0] = "BUFFER";
  DuckDBDataProtocol2[DuckDBDataProtocol2["NODE_FS"] = 1] = "NODE_FS";
  DuckDBDataProtocol2[DuckDBDataProtocol2["BROWSER_FILEREADER"] = 2] = "BROWSER_FILEREADER";
  DuckDBDataProtocol2[DuckDBDataProtocol2["BROWSER_FSACCESS"] = 3] = "BROWSER_FSACCESS";
  DuckDBDataProtocol2[DuckDBDataProtocol2["HTTP"] = 4] = "HTTP";
  DuckDBDataProtocol2[DuckDBDataProtocol2["S3"] = 5] = "S3";
  return DuckDBDataProtocol2;
})(DuckDBDataProtocol || {});

// src/parallel/worker_dispatcher.ts
var AsyncDuckDBDispatcher = class {
  constructor() {
    /** The bindings */
    this._bindings = null;
    /** The next message id */
    this._nextMessageId = 0;
  }
  /** Send log entry to the main thread */
  log(entry) {
    this.postMessage(
      {
        messageId: this._nextMessageId++,
        requestId: 0,
        type: "LOG" /* LOG */,
        data: entry
      },
      []
    );
  }
  /** Send plain OK without further data */
  sendOK(request) {
    this.postMessage(
      {
        messageId: this._nextMessageId++,
        requestId: request.messageId,
        type: "OK" /* OK */,
        data: null
      },
      []
    );
  }
  /** Fail with an error */
  failWith(request, e) {
    const obj = {
      name: e.name,
      message: e.message,
      stack: e.stack || void 0
    };
    this.postMessage(
      {
        messageId: this._nextMessageId++,
        requestId: request.messageId,
        type: "ERROR" /* ERROR */,
        data: obj
      },
      []
    );
    return;
  }
  /** Process a request from the main thread */
  async onMessage(request) {
    switch (request.type) {
      case "PING" /* PING */:
        this.sendOK(request);
        return;
      case "INSTANTIATE" /* INSTANTIATE */:
        if (this._bindings != null) {
          this.failWith(request, new Error("duckdb already initialized"));
        }
        try {
          this._bindings = await this.instantiate(request.data[0], request.data[1], (p) => {
            this.postMessage(
              {
                messageId: this._nextMessageId++,
                requestId: request.messageId,
                type: "INSTANTIATE_PROGRESS" /* INSTANTIATE_PROGRESS */,
                data: p
              },
              []
            );
          });
          this.sendOK(request);
        } catch (e) {
          console.log(e);
          this._bindings = null;
          this.failWith(request, e);
        }
        return;
      default:
        break;
    }
    if (!this._bindings) {
      return this.failWith(request, new Error("duckdb is not initialized"));
    }
    try {
      switch (request.type) {
        case "GET_VERSION" /* GET_VERSION */:
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "VERSION_STRING" /* VERSION_STRING */,
              data: this._bindings.getVersion()
            },
            []
          );
          break;
        case "GET_FEATURE_FLAGS" /* GET_FEATURE_FLAGS */:
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "FEATURE_FLAGS" /* FEATURE_FLAGS */,
              data: this._bindings.getFeatureFlags()
            },
            []
          );
          break;
        case "RESET" /* RESET */:
          this._bindings.reset();
          this.sendOK(request);
          break;
        case "OPEN" /* OPEN */: {
          const path = request.data.path;
          if (path == null ? void 0 : path.startsWith("opfs://")) {
            await this._bindings.prepareDBFileHandle(path, 3 /* BROWSER_FSACCESS */);
            request.data.useDirectIO = true;
          }
          this._bindings.open(request.data);
          this.sendOK(request);
          break;
        }
        case "DROP_FILE" /* DROP_FILE */:
          this._bindings.dropFile(request.data);
          this.sendOK(request);
          break;
        case "DROP_FILES" /* DROP_FILES */:
          this._bindings.dropFiles(request.data);
          this.sendOK(request);
          break;
        case "FLUSH_FILES" /* FLUSH_FILES */:
          this._bindings.flushFiles();
          this.sendOK(request);
          break;
        case "CONNECT" /* CONNECT */: {
          const conn = this._bindings.connect();
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "CONNECTION_INFO" /* CONNECTION_INFO */,
              data: conn.useUnsafe((_, c) => c)
            },
            []
          );
          break;
        }
        case "DISCONNECT" /* DISCONNECT */:
          this._bindings.disconnect(request.data);
          this.sendOK(request);
          break;
        case "CREATE_PREPARED" /* CREATE_PREPARED */: {
          const result = this._bindings.createPrepared(request.data[0], request.data[1]);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "PREPARED_STATEMENT_ID" /* PREPARED_STATEMENT_ID */,
              data: result
            },
            []
          );
          break;
        }
        case "CLOSE_PREPARED" /* CLOSE_PREPARED */: {
          this._bindings.closePrepared(request.data[0], request.data[1]);
          this.sendOK(request);
          break;
        }
        case "RUN_PREPARED" /* RUN_PREPARED */: {
          const result = this._bindings.runPrepared(request.data[0], request.data[1], request.data[2]);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "QUERY_RESULT" /* QUERY_RESULT */,
              data: result
            },
            [result.buffer]
          );
          break;
        }
        case "RUN_QUERY" /* RUN_QUERY */: {
          const result = this._bindings.runQuery(request.data[0], request.data[1]);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "QUERY_RESULT" /* QUERY_RESULT */,
              data: result
            },
            [result.buffer]
          );
          break;
        }
        case "SEND_PREPARED" /* SEND_PREPARED */: {
          const result = this._bindings.sendPrepared(request.data[0], request.data[1], request.data[2]);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "QUERY_RESULT_HEADER" /* QUERY_RESULT_HEADER */,
              data: result
            },
            [result.buffer]
          );
          break;
        }
        case "START_PENDING_QUERY" /* START_PENDING_QUERY */: {
          const result = this._bindings.startPendingQuery(request.data[0], request.data[1], request.data[2]);
          const transfer = [];
          if (result) {
            transfer.push(result.buffer);
          }
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "QUERY_RESULT_HEADER_OR_NULL" /* QUERY_RESULT_HEADER_OR_NULL */,
              data: result
            },
            transfer
          );
          break;
        }
        case "POLL_PENDING_QUERY" /* POLL_PENDING_QUERY */: {
          const result = this._bindings.pollPendingQuery(request.data);
          const transfer = [];
          if (result) {
            transfer.push(result.buffer);
          }
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "QUERY_RESULT_HEADER_OR_NULL" /* QUERY_RESULT_HEADER_OR_NULL */,
              data: result
            },
            transfer
          );
          break;
        }
        case "CANCEL_PENDING_QUERY" /* CANCEL_PENDING_QUERY */: {
          const result = this._bindings.cancelPendingQuery(request.data);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "SUCCESS" /* SUCCESS */,
              data: result
            },
            []
          );
          break;
        }
        case "FETCH_QUERY_RESULTS" /* FETCH_QUERY_RESULTS */: {
          const result = this._bindings.fetchQueryResults(request.data);
          const transfer = result ? [result.buffer] : [];
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "QUERY_RESULT_CHUNK" /* QUERY_RESULT_CHUNK */,
              data: result
            },
            transfer
          );
          break;
        }
        case "GET_TABLE_NAMES" /* GET_TABLE_NAMES */: {
          const result = this._bindings.getTableNames(request.data[0], request.data[1]);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "TABLE_NAMES" /* TABLE_NAMES */,
              data: result
            },
            []
          );
          break;
        }
        case "GLOB_FILE_INFOS" /* GLOB_FILE_INFOS */: {
          const infos = this._bindings.globFiles(request.data);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "FILE_INFOS" /* FILE_INFOS */,
              data: infos
            },
            []
          );
          break;
        }
        case "REGISTER_FILE_URL" /* REGISTER_FILE_URL */:
          this._bindings.registerFileURL(request.data[0], request.data[1], request.data[2], request.data[3]);
          this.sendOK(request);
          break;
        case "REGISTER_FILE_BUFFER" /* REGISTER_FILE_BUFFER */:
          this._bindings.registerFileBuffer(request.data[0], request.data[1]);
          this.sendOK(request);
          break;
        case "REGISTER_FILE_HANDLE" /* REGISTER_FILE_HANDLE */:
          await this._bindings.registerFileHandleAsync(
            request.data[0],
            request.data[1],
            request.data[2],
            request.data[3]
          );
          this.sendOK(request);
          break;
        case "COPY_FILE_TO_PATH" /* COPY_FILE_TO_PATH */:
          this._bindings.copyFileToPath(request.data[0], request.data[1]);
          this.sendOK(request);
          break;
        case "COPY_FILE_TO_BUFFER" /* COPY_FILE_TO_BUFFER */: {
          const buffer = this._bindings.copyFileToBuffer(request.data);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "FILE_BUFFER" /* FILE_BUFFER */,
              data: buffer
            },
            []
          );
          break;
        }
        case "COLLECT_FILE_STATISTICS" /* COLLECT_FILE_STATISTICS */:
          this._bindings.collectFileStatistics(request.data[0], request.data[1]);
          this.sendOK(request);
          break;
        case "REGISTER_OPFS_FILE_NAME" /* REGISTER_OPFS_FILE_NAME */:
          await this._bindings.registerOPFSFileName(request.data[0]);
          this.sendOK(request);
          break;
        case "EXPORT_FILE_STATISTICS" /* EXPORT_FILE_STATISTICS */: {
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "FILE_STATISTICS" /* FILE_STATISTICS */,
              data: this._bindings.exportFileStatistics(request.data)
            },
            []
          );
          break;
        }
        case "INSERT_ARROW_FROM_IPC_STREAM" /* INSERT_ARROW_FROM_IPC_STREAM */: {
          this._bindings.insertArrowFromIPCStream(request.data[0], request.data[1], request.data[2]);
          this.sendOK(request);
          break;
        }
        case "IMPORT_CSV_FROM_PATH" /* INSERT_CSV_FROM_PATH */: {
          this._bindings.insertCSVFromPath(request.data[0], request.data[1], request.data[2]);
          this.sendOK(request);
          break;
        }
        case "IMPORT_JSON_FROM_PATH" /* INSERT_JSON_FROM_PATH */: {
          this._bindings.insertJSONFromPath(request.data[0], request.data[1], request.data[2]);
          this.sendOK(request);
          break;
        }
        case "TOKENIZE" /* TOKENIZE */: {
          const result = this._bindings.tokenize(request.data);
          this.postMessage(
            {
              messageId: this._nextMessageId++,
              requestId: request.messageId,
              type: "SCRIPT_TOKENS" /* SCRIPT_TOKENS */,
              data: result
            },
            []
          );
          break;
        }
      }
    } catch (e) {
      console.log(e);
      return this.failWith(request, e);
    }
  }
};

// ../../node_modules/wasm-feature-detect/dist/esm/index.js
var bulkMemory = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 3, 1, 0, 1, 10, 14, 1, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0, 11]));
var exceptions = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 8, 1, 6, 0, 6, 64, 25, 11, 11]));
var simd = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
var threads = () => (async (e) => {
  try {
    return "undefined" != typeof MessageChannel && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(e);
  } catch (e2) {
    return false;
  }
})(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11]));

// package.json
var package_default = {
  name: "@duckdb/duckdb-wasm",
  version: "1.11.0",
  description: "DuckDB powered by WebAssembly",
  license: "MIT",
  repository: {
    type: "git",
    url: "https://github.com/duckdb/duckdb-wasm.git"
  },
  keywords: [
    "sql",
    "duckdb",
    "relational",
    "database",
    "data",
    "query",
    "wasm",
    "analytics",
    "olap",
    "arrow",
    "parquet",
    "json",
    "csv"
  ],
  dependencies: {
    "apache-arrow": "^17.0.0",
    qs: "^6.14.1"
  },
  devDependencies: {
    "@types/emscripten": "^1.39.10",
    "@types/jasmine": "^5.1.13",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    esbuild: "^0.20.2",
    eslint: "^8.57.0",
    "eslint-plugin-jasmine": "^4.1.3",
    "eslint-plugin-react": "^7.37.5",
    "fast-glob": "^3.3.2",
    jasmine: "^5.13.0",
    "jasmine-core": "^5.1.2",
    "jasmine-spec-reporter": "^7.0.0",
    "js-sha256": "^0.11.1",
    karma: "^6.4.2",
    "karma-chrome-launcher": "^3.2.0",
    "karma-coverage": "^2.2.1",
    "karma-firefox-launcher": "^2.1.3",
    "karma-jasmine": "^5.1.0",
    "karma-jasmine-html-reporter": "^2.1.0",
    "karma-sourcemap-loader": "^0.4.0",
    "karma-spec-reporter": "^0.0.36",
    "make-dir": "^4.0.0",
    nyc: "^15.1.0",
    prettier: "^3.2.5",
    puppeteer: "^22.8.0",
    rimraf: "^5.0.5",
    s3rver: "^3.7.1",
    typedoc: "^0.28.15",
    typescript: "^5.3.3",
    "wasm-feature-detect": "^1.6.1",
    "web-worker": "^1.2.0"
  },
  scripts: {
    "build:debug": "node bundle.mjs debug && tsc --emitDeclarationOnly",
    "build:release": "node bundle.mjs release && tsc --emitDeclarationOnly",
    docs: "typedoc",
    format: 'prettier --write "**/*.+(js|ts)"',
    report: "node ./coverage.mjs",
    "test:node": "node --enable-source-maps ../../node_modules/jasmine/bin/jasmine ./dist/tests-node.cjs",
    "test:node:debug": "node --inspect-brk --enable-source-maps ../../node_modules/jasmine/bin/jasmine ./dist/tests-node.cjs",
    "test:node:coverage": "nyc -r json --report-dir ./coverage/node node ../../node_modules/jasmine/bin/jasmine ./dist/tests-node.cjs",
    "test:firefox": "karma start ./karma/tests-firefox.cjs",
    "test:chrome": "karma start ./karma/tests-chrome.cjs",
    "test:chrome:eh": "karma start ./karma/tests-chrome-eh.cjs",
    "test:chrome:coverage": "karma start ./karma/tests-chrome-coverage.cjs",
    "test:browser": "karma start ./karma/tests-all.cjs",
    "test:browser:debug": "karma start ./karma/tests-debug.cjs",
    test: "npm run test:chrome && npm run test:node",
    "test:coverage": "npm run test:chrome:coverage && npm run test:node:coverage && npm run report",
    lint: "eslint src test"
  },
  files: [
    "dist",
    "!dist/tests-*",
    "!dist/duckdb-browser-mvp.worker.js.map",
    "!dist/types/test"
  ],
  main: "dist/duckdb-browser.cjs",
  module: "dist/duckdb-browser.mjs",
  types: "dist/duckdb-browser.d.ts",
  jsdelivr: "dist/duckdb-browser.cjs",
  unpkg: "dist/duckdb-browser.mjs",
  sideEffects: false,
  browser: {
    fs: false,
    path: false,
    perf_hooks: false,
    os: false,
    worker_threads: false
  },
  exports: {
    "./src/*": "./src/*",
    "./dist/duckdb-mvp.wasm": "./dist/duckdb-mvp.wasm",
    "./dist/duckdb-eh.wasm": "./dist/duckdb-eh.wasm",
    "./dist/duckdb-coi.wasm": "./dist/duckdb-coi.wasm",
    "./dist/duckdb-browser": "./dist/duckdb-browser.mjs",
    "./dist/duckdb-browser.cjs": "./dist/duckdb-browser.cjs",
    "./dist/duckdb-browser.mjs": "./dist/duckdb-browser.mjs",
    "./dist/duckdb-browser-coi.pthread.worker.js": "./dist/duckdb-browser-coi.pthread.worker.js",
    "./dist/duckdb-browser-coi.worker.js": "./dist/duckdb-browser-coi.worker.js",
    "./dist/duckdb-browser-eh.worker.js": "./dist/duckdb-browser-eh.worker.js",
    "./dist/duckdb-browser-mvp.worker.js": "./dist/duckdb-browser-mvp.worker.js",
    "./dist/duckdb-node": "./dist/duckdb-node.cjs",
    "./dist/duckdb-node.cjs": "./dist/duckdb-node.cjs",
    "./dist/duckdb-node-blocking": "./dist/duckdb-node-blocking.cjs",
    "./dist/duckdb-node-blocking.cjs": "./dist/duckdb-node-blocking.cjs",
    "./dist/duckdb-node-eh.worker.cjs": "./dist/duckdb-node-eh.worker.cjs",
    "./dist/duckdb-node-mvp.worker.cjs": "./dist/duckdb-node-mvp.worker.cjs",
    "./blocking": {
      bun: "./src/targets/duckdb-node-blocking.ts",
      node: {
        types: "./dist/duckdb-node-blocking.d.ts",
        require: "./dist/duckdb-node-blocking.cjs",
        import: "./dist/duckdb-node-blocking.cjs"
      },
      types: "./dist/duckdb-node-blocking.d.ts",
      import: "./dist/duckdb-node-blocking.mjs",
      require: "./dist/duckdb-node-blocking.cjs"
    },
    ".": {
      bun: "./src/index.ts",
      browser: {
        types: "./dist/duckdb-browser.d.ts",
        import: "./dist/duckdb-browser.mjs",
        require: "./dist/duckdb-browser.cjs"
      },
      node: {
        types: "./dist/duckdb-node.d.ts",
        import: "./dist/duckdb-node.cjs",
        require: "./dist/duckdb-node.cjs"
      },
      types: "./dist/duckdb-browser.d.ts",
      import: "./dist/duckdb-browser.mjs",
      require: "./dist/duckdb-browser.cjs"
    }
  }
};

// src/version.ts
var PACKAGE_NAME = package_default.name;
var PACKAGE_VERSION = package_default.version;
var VERSION_PARTS = package_default.version.split(".");
var PACKAGE_VERSION_MAJOR = VERSION_PARTS[0];
var PACKAGE_VERSION_MINOR = VERSION_PARTS[1];
var PACKAGE_VERSION_PATCH = VERSION_PARTS[2];

// src/platform.ts
var isNode = () => typeof navigator === "undefined" ? true : false;
var userAgent = () => isNode() ? "node" : navigator.userAgent;
var isFirefox = () => userAgent().includes("Firefox");
var isSafari = () => /^((?!chrome|android).)*safari/i.test(userAgent());
function getJsDelivrBundles() {
  const jsdelivr_dist_url = "https://cdn.jsdelivr.net/npm/".concat(PACKAGE_NAME, "@").concat(PACKAGE_VERSION, "/dist/");
  return {
    mvp: {
      mainModule: "".concat(jsdelivr_dist_url, "duckdb-mvp.wasm"),
      mainWorker: "".concat(jsdelivr_dist_url, "duckdb-browser-mvp.worker.js")
    },
    eh: {
      mainModule: "".concat(jsdelivr_dist_url, "duckdb-eh.wasm"),
      mainWorker: "".concat(jsdelivr_dist_url, "duckdb-browser-eh.worker.js")
    }
    // COI is still experimental, let the user opt in explicitly
  };
}
var bigInt64Array = null;
var wasmExceptions = null;
var wasmThreads = null;
var wasmSIMD = null;
var wasmBulkMemory = null;
async function getPlatformFeatures() {
  if (bigInt64Array == null) {
    bigInt64Array = typeof BigInt64Array != "undefined";
  }
  if (wasmExceptions == null) {
    wasmExceptions = await exceptions();
  }
  if (wasmThreads == null) {
    wasmThreads = await threads();
  }
  if (wasmSIMD == null) {
    wasmSIMD = await simd();
  }
  if (wasmBulkMemory == null) {
    wasmBulkMemory = await bulkMemory();
  }
  return {
    bigInt64Array,
    crossOriginIsolated: isNode() || globalThis.crossOriginIsolated || false,
    wasmExceptions,
    wasmSIMD,
    wasmThreads,
    wasmBulkMemory
  };
}
async function selectBundle(bundles) {
  const platform = await getPlatformFeatures();
  if (platform.wasmExceptions) {
    if (platform.wasmSIMD && platform.wasmThreads && platform.crossOriginIsolated && bundles.coi) {
      return {
        mainModule: bundles.coi.mainModule,
        mainWorker: bundles.coi.mainWorker,
        pthreadWorker: bundles.coi.pthreadWorker
      };
    }
    if (bundles.eh) {
      return {
        mainModule: bundles.eh.mainModule,
        mainWorker: bundles.eh.mainWorker,
        pthreadWorker: null
      };
    }
  }
  return {
    mainModule: bundles.mvp.mainModule,
    mainWorker: bundles.mvp.mainWorker,
    pthreadWorker: null
  };
}

// src/worker.ts
var import_web_worker = __toESM(require_browser());
async function createWorker(url) {
  const request = new Request(url);
  const workerScript = await fetch(request);
  const workerURL = URL.createObjectURL(await workerScript.blob());
  return new import_web_worker.default(workerURL);
}
//# sourceMappingURL=duckdb-browser.cjs.map
