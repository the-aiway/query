"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

  // (disabled):worker_threads
  var require_worker_threads = __commonJS({
    "(disabled):worker_threads"() {
    }
  });

  // (disabled):fs
  var require_fs = __commonJS({
    "(disabled):fs"() {
    }
  });

  // (disabled):path
  var require_path = __commonJS({
    "(disabled):path"() {
    }
  });

  // (disabled):perf_hooks
  var require_perf_hooks = __commonJS({
    "(disabled):perf_hooks"() {
    }
  });

  // (disabled):os
  var require_os = __commonJS({
    "(disabled):os"() {
    }
  });

  // src/bindings/duckdb-coi.js
  var require_duckdb_coi = __commonJS({
    "src/bindings/duckdb-coi.js"(exports, module) {
      "use strict";
      var DuckDB3 = (() => {
        var _a;
        var _scriptDir = typeof document != "undefined" ? (_a = document.currentScript) == null ? void 0 : _a.src : void 0;
        if (typeof __filename != "undefined")
          _scriptDir || (_scriptDir = __filename);
        return function(moduleArg = {}) {
          function GROWABLE_HEAP_I8() {
            if (wasmMemory.buffer != HEAP8.buffer) {
              updateMemoryViews();
            }
            return HEAP8;
          }
          function GROWABLE_HEAP_U8() {
            if (wasmMemory.buffer != HEAP8.buffer) {
              updateMemoryViews();
            }
            return HEAPU8;
          }
          function GROWABLE_HEAP_I16() {
            if (wasmMemory.buffer != HEAP8.buffer) {
              updateMemoryViews();
            }
            return HEAP16;
          }
          function GROWABLE_HEAP_U16() {
            if (wasmMemory.buffer != HEAP8.buffer) {
              updateMemoryViews();
            }
            return HEAPU16;
          }
          function GROWABLE_HEAP_I32() {
            if (wasmMemory.buffer != HEAP8.buffer) {
              updateMemoryViews();
            }
            return HEAP32;
          }
          function GROWABLE_HEAP_U32() {
            if (wasmMemory.buffer != HEAP8.buffer) {
              updateMemoryViews();
            }
            return HEAPU32;
          }
          function GROWABLE_HEAP_F64() {
            if (wasmMemory.buffer != HEAP8.buffer) {
              updateMemoryViews();
            }
            return HEAPF64;
          }
          var Module2 = moduleArg;
          var readyPromiseResolve, readyPromiseReject;
          var readyPromise = new Promise((resolve, reject) => {
            readyPromiseResolve = resolve;
            readyPromiseReject = reject;
          });
          var moduleOverrides = Object.assign({}, Module2);
          var arguments_ = [];
          var thisProgram = "./this.program";
          var quit_ = (status, toThrow) => {
            throw toThrow;
          };
          var ENVIRONMENT_IS_WEB = typeof window == "object";
          var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
          var ENVIRONMENT_IS_NODE2 = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
          var ENVIRONMENT_IS_PTHREAD = Module2["ENVIRONMENT_IS_PTHREAD"] || false;
          var scriptDirectory = "";
          function locateFile(path) {
            if (Module2["locateFile"]) {
              return Module2["locateFile"](path, scriptDirectory);
            }
            return scriptDirectory + path;
          }
          var read_, readAsync, readBinary;
          if (ENVIRONMENT_IS_NODE2) {
            var fs = require_fs();
            var nodePath = require_path();
            if (ENVIRONMENT_IS_WORKER) {
              scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
            } else {
              scriptDirectory = __dirname + "/";
            }
            read_ = (filename, binary) => {
              filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
              return fs.readFileSync(filename, binary ? void 0 : "utf8");
            };
            readBinary = (filename) => {
              var ret = read_(filename, true);
              if (!ret.buffer) {
                ret = new Uint8Array(ret);
              }
              return ret;
            };
            readAsync = (filename, onload, onerror, binary = true) => {
              filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
              fs.readFile(filename, binary ? void 0 : "utf8", (err3, data) => {
                if (err3)
                  onerror(err3);
                else
                  onload(binary ? data.buffer : data);
              });
            };
            if (!Module2["thisProgram"] && process.argv.length > 1) {
              thisProgram = process.argv[1].replace(/\\/g, "/");
            }
            arguments_ = process.argv.slice(2);
            quit_ = (status, toThrow) => {
              process.exitCode = status;
              throw toThrow;
            };
            global.Worker = require_worker_threads().Worker;
          } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
              scriptDirectory = self.location.href;
            } else if (typeof document != "undefined" && document.currentScript) {
              scriptDirectory = document.currentScript.src;
            }
            if (_scriptDir) {
              scriptDirectory = _scriptDir;
            }
            if (scriptDirectory.startsWith("blob:")) {
              scriptDirectory = "";
            } else {
              scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
            }
            if (!ENVIRONMENT_IS_NODE2) {
              read_ = (url) => {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                xhr.send(null);
                return xhr.responseText;
              };
              if (ENVIRONMENT_IS_WORKER) {
                readBinary = (url) => {
                  var xhr = new XMLHttpRequest();
                  xhr.open("GET", url, false);
                  xhr.responseType = "arraybuffer";
                  xhr.send(null);
                  return new Uint8Array(xhr.response);
                };
              }
              readAsync = (url, onload, onerror) => {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);
                xhr.responseType = "arraybuffer";
                xhr.onload = () => {
                  if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return;
                  }
                  onerror();
                };
                xhr.onerror = onerror;
                xhr.send(null);
              };
            }
          } else {
          }
          if (ENVIRONMENT_IS_NODE2) {
            if (typeof performance == "undefined") {
              global.performance = require_perf_hooks().performance;
            }
          }
          var defaultPrint = console.log.bind(console);
          var defaultPrintErr = console.error.bind(console);
          if (ENVIRONMENT_IS_NODE2) {
            defaultPrint = (...args) => fs.writeSync(1, args.join(" ") + "\n");
            defaultPrintErr = (...args) => fs.writeSync(2, args.join(" ") + "\n");
          }
          var out = Module2["print"] || defaultPrint;
          var err2 = Module2["printErr"] || defaultPrintErr;
          Object.assign(Module2, moduleOverrides);
          moduleOverrides = null;
          if (Module2["arguments"])
            arguments_ = Module2["arguments"];
          if (Module2["thisProgram"])
            thisProgram = Module2["thisProgram"];
          if (Module2["quit"])
            quit_ = Module2["quit"];
          var wasmBinary;
          if (Module2["wasmBinary"])
            wasmBinary = Module2["wasmBinary"];
          var wasmMemory;
          var wasmModule;
          var ABORT = false;
          var EXITSTATUS;
          function assert(condition, text) {
            if (!condition) {
              abort(text);
            }
          }
          var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
          function updateMemoryViews() {
            var b = wasmMemory.buffer;
            Module2["HEAP8"] = HEAP8 = new Int8Array(b);
            Module2["HEAP16"] = HEAP16 = new Int16Array(b);
            Module2["HEAPU8"] = HEAPU8 = new Uint8Array(b);
            Module2["HEAPU16"] = HEAPU16 = new Uint16Array(b);
            Module2["HEAP32"] = HEAP32 = new Int32Array(b);
            Module2["HEAPU32"] = HEAPU32 = new Uint32Array(b);
            Module2["HEAPF32"] = HEAPF32 = new Float32Array(b);
            Module2["HEAPF64"] = HEAPF64 = new Float64Array(b);
          }
          var INITIAL_MEMORY = Module2["INITIAL_MEMORY"] || 16777216;
          if (ENVIRONMENT_IS_PTHREAD) {
            wasmMemory = Module2["wasmMemory"];
          } else {
            if (Module2["wasmMemory"]) {
              wasmMemory = Module2["wasmMemory"];
            } else {
              wasmMemory = new WebAssembly.Memory({
                "initial": INITIAL_MEMORY / 65536,
                "maximum": 4294967296 / 65536,
                "shared": true
              });
              if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
                err2("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag");
                if (ENVIRONMENT_IS_NODE2) {
                  err2("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and/or recent version)");
                }
                throw Error("bad memory");
              }
            }
          }
          updateMemoryViews();
          INITIAL_MEMORY = wasmMemory.buffer.byteLength;
          var __ATPRERUN__ = [];
          var __ATINIT__ = [];
          var __ATMAIN__ = [];
          var __ATPOSTRUN__ = [];
          var runtimeInitialized = false;
          function preRun() {
            if (Module2["preRun"]) {
              if (typeof Module2["preRun"] == "function")
                Module2["preRun"] = [Module2["preRun"]];
              while (Module2["preRun"].length) {
                addOnPreRun(Module2["preRun"].shift());
              }
            }
            callRuntimeCallbacks(__ATPRERUN__);
          }
          function initRuntime() {
            runtimeInitialized = true;
            if (ENVIRONMENT_IS_PTHREAD)
              return;
            callRuntimeCallbacks(__ATINIT__);
          }
          function preMain() {
            if (ENVIRONMENT_IS_PTHREAD)
              return;
            callRuntimeCallbacks(__ATMAIN__);
          }
          function postRun() {
            if (ENVIRONMENT_IS_PTHREAD)
              return;
            if (Module2["postRun"]) {
              if (typeof Module2["postRun"] == "function")
                Module2["postRun"] = [Module2["postRun"]];
              while (Module2["postRun"].length) {
                addOnPostRun(Module2["postRun"].shift());
              }
            }
            callRuntimeCallbacks(__ATPOSTRUN__);
          }
          function addOnPreRun(cb) {
            __ATPRERUN__.unshift(cb);
          }
          function addOnInit(cb) {
            __ATINIT__.unshift(cb);
          }
          function addOnPostRun(cb) {
            __ATPOSTRUN__.unshift(cb);
          }
          var runDependencies = 0;
          var runDependencyWatcher = null;
          var dependenciesFulfilled = null;
          function addRunDependency(id) {
            var _a2;
            runDependencies++;
            (_a2 = Module2["monitorRunDependencies"]) == null ? void 0 : _a2.call(Module2, runDependencies);
          }
          function removeRunDependency(id) {
            var _a2;
            runDependencies--;
            (_a2 = Module2["monitorRunDependencies"]) == null ? void 0 : _a2.call(Module2, runDependencies);
            if (runDependencies == 0) {
              if (runDependencyWatcher !== null) {
                clearInterval(runDependencyWatcher);
                runDependencyWatcher = null;
              }
              if (dependenciesFulfilled) {
                var callback = dependenciesFulfilled;
                dependenciesFulfilled = null;
                callback();
              }
            }
          }
          function abort(what) {
            var _a2;
            (_a2 = Module2["onAbort"]) == null ? void 0 : _a2.call(Module2, what);
            what = "Aborted(" + what + ")";
            err2(what);
            ABORT = true;
            EXITSTATUS = 1;
            what += ". Build with -sASSERTIONS for more info.";
            if (runtimeInitialized) {
              ___trap();
            }
            var e = new WebAssembly.RuntimeError(what);
            readyPromiseReject(e);
            throw e;
          }
          var dataURIPrefix = "data:application/octet-stream;base64,";
          var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
          var isFileURI = (filename) => filename.startsWith("file://");
          var wasmBinaryFile;
          wasmBinaryFile = "./duckdb-coi.wasm";
          if (!isDataURI(wasmBinaryFile)) {
            wasmBinaryFile = locateFile(wasmBinaryFile);
          }
          function getBinarySync(file) {
            if (file == wasmBinaryFile && wasmBinary) {
              return new Uint8Array(wasmBinary);
            }
            if (readBinary) {
              return readBinary(file);
            }
            throw "both async and sync fetching of the wasm failed";
          }
          function getBinaryPromise(binaryFile) {
            if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
              if (typeof fetch == "function") {
                return fetch(binaryFile, {
                  credentials: "same-origin"
                }).then((response) => {
                  if (!response["ok"]) {
                    throw "failed to load wasm binary file at '".concat(binaryFile, "'");
                  }
                  return response["arrayBuffer"]();
                }).catch(() => getBinarySync(binaryFile));
              }
            }
            return Promise.resolve().then(() => getBinarySync(binaryFile));
          }
          function instantiateArrayBuffer(binaryFile, imports, receiver) {
            return getBinaryPromise(binaryFile).then((binary) => WebAssembly.instantiate(binary, imports)).then(receiver, (reason) => {
              err2("failed to asynchronously prepare wasm: ".concat(reason));
              abort(reason);
            });
          }
          function instantiateAsync(binary, binaryFile, imports, callback) {
            if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !ENVIRONMENT_IS_NODE2 && typeof fetch == "function") {
              return fetch(binaryFile, {
                credentials: "same-origin"
              }).then((response) => {
                var result = WebAssembly.instantiateStreaming(response, imports);
                return result.then(callback, function(reason) {
                  err2("wasm streaming compile failed: ".concat(reason));
                  err2("falling back to ArrayBuffer instantiation");
                  return instantiateArrayBuffer(binaryFile, imports, callback);
                });
              });
            }
            return instantiateArrayBuffer(binaryFile, imports, callback);
          }
          function createWasm() {
            var info = {
              "a": wasmImports
            };
            function receiveInstance(instance, module2) {
              wasmExports = instance.exports;
              wasmExports = applySignatureConversions(wasmExports);
              registerTLSInit(wasmExports["tb"]);
              wasmTable = wasmExports["Da"];
              addOnInit(wasmExports["Ba"]);
              wasmModule = module2;
              removeRunDependency("wasm-instantiate");
              return wasmExports;
            }
            addRunDependency("wasm-instantiate");
            function receiveInstantiationResult(result) {
              receiveInstance(result["instance"], result["module"]);
            }
            if (Module2["instantiateWasm"]) {
              try {
                return Module2["instantiateWasm"](info, receiveInstance);
              } catch (e) {
                err2("Module.instantiateWasm callback failed with error: ".concat(e));
                readyPromiseReject(e);
              }
            }
            instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
            return {};
          }
          var tempDouble;
          var tempI64;
          var ASM_CONSTS = {
            2506609: ($0, $1, $2, $3) => {
              var url = UTF8ToString($0);
              if (typeof XMLHttpRequest === "undefined") {
                return 0;
              }
              const xhr = new XMLHttpRequest();
              if (false) {
                url = "https://" + url.substr(7);
              }
              xhr.open(UTF8ToString($3), url, false);
              xhr.responseType = "arraybuffer";
              var i = 0;
              var len = $1;
              while (i < len * 2) {
                var ptr1 = GROWABLE_HEAP_I32()[$2 / 4 + i >>> 0];
                var ptr2 = GROWABLE_HEAP_I32()[$2 / 4 + i + 1 >>> 0];
                try {
                  var z = encodeURI(UTF8ToString(ptr1));
                  if (z === "Host")
                    z = "X-Host-Override";
                  if (z === "User-Agent")
                    z = "X-user-agent";
                  if (z === "Authorization") {
                    xhr.setRequestHeader(z, UTF8ToString(ptr2));
                  } else {
                    xhr.setRequestHeader(z, encodeURI(UTF8ToString(ptr2)));
                  }
                } catch (error) {
                  console.warn("Error while performing XMLHttpRequest.setRequestHeader()", error);
                }
                i += 2;
              }
              try {
                xhr.send(null);
              } catch (e) {
                return 0;
              }
              if (xhr.status >= 400)
                return 0;
              var uInt8Array = xhr.response;
              var len = uInt8Array.byteLength;
              var fileOnWasmHeap = _malloc(len + 4);
              var properArray = new Uint8Array(uInt8Array);
              for (var iii = 0; iii < len; iii++) {
                Module2.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
              }
              var LEN123 = new Uint8Array(4);
              LEN123[0] = len % 256;
              len -= LEN123[0];
              len /= 256;
              LEN123[1] = len % 256;
              len -= LEN123[1];
              len /= 256;
              LEN123[2] = len % 256;
              len -= LEN123[2];
              len /= 256;
              LEN123[3] = len % 256;
              len -= LEN123[3];
              len /= 256;
              Module2.HEAPU8.set(LEN123, fileOnWasmHeap);
              return fileOnWasmHeap;
            },
            2508016: ($0, $1, $2, $3, $4, $5) => {
              var url = UTF8ToString($0);
              if (typeof XMLHttpRequest === "undefined") {
                return 0;
              }
              const xhr = new XMLHttpRequest();
              if (false) {
                url = "https://" + url.substr(7);
              }
              xhr.open(UTF8ToString($3), url, false);
              xhr.responseType = "arraybuffer";
              var i = 0;
              var len = $1;
              while (i < len * 2) {
                var ptr1 = GROWABLE_HEAP_I32()[$2 / 4 + i >>> 0];
                var ptr2 = GROWABLE_HEAP_I32()[$2 / 4 + i + 1 >>> 0];
                try {
                  var z = encodeURI(UTF8ToString(ptr1));
                  if (z === "Host")
                    z = "X-Host-Override";
                  if (z === "User-Agent")
                    z = "X-user-agent";
                  if (z === "Authorization") {
                    xhr.setRequestHeader(z, UTF8ToString(ptr2));
                  } else {
                    xhr.setRequestHeader(z, encodeURI(UTF8ToString(ptr2)));
                  }
                } catch (error) {
                  console.warn("Error while performing XMLHttpRequest.setRequestHeader()", error);
                }
                i += 2;
              }
              try {
                var post_payload = new Uint8Array($5);
                for (var iii = 0; iii < $5; iii++) {
                  post_payload[iii] = Module2.HEAPU8[iii + $4];
                }
                xhr.send(post_payload);
              } catch (e) {
                return 0;
              }
              if (xhr.status >= 400)
                return 0;
              var uInt8Array = Uint8Array.from(Array.from(xhr.getResponseHeader("Etag")).map((letter) => letter.charCodeAt(0)));
              var len = uInt8Array.byteLength;
              var fileOnWasmHeap = _malloc(len + 4);
              var properArray = new Uint8Array(uInt8Array);
              for (var iii = 0; iii < len; iii++) {
                Module2.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
              }
              var LEN123 = new Uint8Array(4);
              LEN123[0] = len % 256;
              len -= LEN123[0];
              len /= 256;
              LEN123[1] = len % 256;
              len -= LEN123[1];
              len /= 256;
              LEN123[2] = len % 256;
              len -= LEN123[2];
              len /= 256;
              LEN123[3] = len % 256;
              len -= LEN123[3];
              len /= 256;
              Module2.HEAPU8.set(LEN123, fileOnWasmHeap);
              return fileOnWasmHeap;
            },
            2509636: ($0, $1, $2, $3) => {
              var url = UTF8ToString($0);
              if (typeof XMLHttpRequest === "undefined") {
                return 0;
              }
              const xhr = new XMLHttpRequest();
              if (false) {
                url = "https://" + url.substr(7);
              }
              xhr.open(UTF8ToString($3), url, false);
              xhr.responseType = "arraybuffer";
              var i = 0;
              var len = $1;
              while (i < len * 2) {
                var ptr1 = GROWABLE_HEAP_I32()[$2 / 4 + i >>> 0];
                var ptr2 = GROWABLE_HEAP_I32()[$2 / 4 + i + 1 >>> 0];
                try {
                  var z = encodeURI(UTF8ToString(ptr1));
                  if (z === "Host")
                    z = "X-Host-Override";
                  if (z === "User-Agent")
                    z = "X-user-agent";
                  if (z === "Authorization") {
                    xhr.setRequestHeader(z, UTF8ToString(ptr2));
                  } else {
                    xhr.setRequestHeader(z, encodeURI(UTF8ToString(ptr2)));
                  }
                } catch (error) {
                  console.warn("Error while performing XMLHttpRequest.setRequestHeader()", error);
                }
                i += 2;
              }
              try {
                xhr.send(null);
              } catch (e) {
                return 0;
              }
              if (xhr.status >= 400)
                return 0;
              var uInt8Array = xhr.response;
              var len = uInt8Array.byteLength;
              var fileOnWasmHeap = _malloc(len + 8);
              var properArray = new Uint8Array(uInt8Array);
              for (var iii = 0; iii < len; iii++) {
                Module2.HEAPU8[iii + fileOnWasmHeap + 8] = properArray[iii];
              }
              var LEN123 = new Uint8Array(4);
              LEN123[0] = len % 256;
              len -= LEN123[0];
              len /= 256;
              LEN123[1] = len % 256;
              len -= LEN123[1];
              len /= 256;
              LEN123[2] = len % 256;
              len -= LEN123[2];
              len /= 256;
              LEN123[3] = len % 256;
              len -= LEN123[3];
              len /= 256;
              Module2.HEAPU8.set(LEN123, fileOnWasmHeap + 4);
              var headers = Uint8Array.from(Array.from(xhr.getAllResponseHeaders()).map((letter) => letter.charCodeAt(0)));
              len = headers.byteLength;
              var headersOnWasmHeap = _malloc(len + 8);
              for (var iii = 0; iii < len; iii++) {
                Module2.HEAPU8[iii + headersOnWasmHeap + 8] = headers[iii];
              }
              LEN123 = new Uint8Array(4);
              LEN123[0] = len % 256;
              len -= LEN123[0];
              len /= 256;
              LEN123[1] = len % 256;
              len -= LEN123[1];
              len /= 256;
              LEN123[2] = len % 256;
              len -= LEN123[2];
              len /= 256;
              LEN123[3] = len % 256;
              len -= LEN123[3];
              len /= 256;
              Module2.HEAPU8.set(LEN123, headersOnWasmHeap + 4);
              len = headersOnWasmHeap;
              LEN123 = new Uint8Array(4);
              LEN123[0] = len % 256;
              len -= LEN123[0];
              len /= 256;
              LEN123[1] = len % 256;
              len -= LEN123[1];
              len /= 256;
              LEN123[2] = len % 256;
              len -= LEN123[2];
              len /= 256;
              LEN123[3] = len % 256;
              len -= LEN123[3];
              len /= 256;
              Module2.HEAPU8.set(LEN123, fileOnWasmHeap);
              return fileOnWasmHeap;
            },
            2511920: ($0, $1, $2, $3) => {
              var url = UTF8ToString($0);
              if (typeof XMLHttpRequest === "undefined") {
                return 0;
              }
              const xhr = new XMLHttpRequest();
              if (false) {
                url = "https://" + url.substr(7);
              }
              xhr.open(UTF8ToString($3), url, false);
              xhr.responseType = "arraybuffer";
              var i = 0;
              var len = $1;
              while (i < len * 2) {
                var ptr1 = GROWABLE_HEAP_I32()[$2 / 4 + i >>> 0];
                var ptr2 = GROWABLE_HEAP_I32()[$2 / 4 + i + 1 >>> 0];
                try {
                  var z = encodeURI(UTF8ToString(ptr1));
                  if (z === "Host")
                    z = "X-Host-Override";
                  if (z === "User-Agent")
                    z = "X-user-agent";
                  if (z === "Authorization") {
                    xhr.setRequestHeader(z, UTF8ToString(ptr2));
                  } else {
                    xhr.setRequestHeader(z, encodeURI(UTF8ToString(ptr2)));
                  }
                } catch (error) {
                  console.warn("Error while performing XMLHttpRequest.setRequestHeader()", error);
                }
                i += 2;
              }
              try {
                xhr.send(null);
              } catch (e) {
                return 0;
              }
              if (xhr.status >= 400)
                return 0;
              var uInt8Array = xhr.response;
              var len = uInt8Array.byteLength;
              var fileOnWasmHeap = _malloc(len + 4);
              var properArray = new Uint8Array(uInt8Array);
              for (var iii = 0; iii < len; iii++) {
                Module2.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
              }
              var LEN123 = new Uint8Array(4);
              LEN123[0] = len % 256;
              len -= LEN123[0];
              len /= 256;
              LEN123[1] = len % 256;
              len -= LEN123[1];
              len /= 256;
              LEN123[2] = len % 256;
              len -= LEN123[2];
              len /= 256;
              LEN123[3] = len % 256;
              len -= LEN123[3];
              len /= 256;
              Module2.HEAPU8.set(LEN123, fileOnWasmHeap);
              return fileOnWasmHeap;
            },
            2513327: ($0, $1, $2, $3, $4, $5) => {
              var url = UTF8ToString($0);
              if (typeof XMLHttpRequest === "undefined") {
                return 0;
              }
              const xhr = new XMLHttpRequest();
              if (false) {
                url = "https://" + url.substr(7);
              }
              xhr.open(UTF8ToString($3), url, false);
              xhr.responseType = "arraybuffer";
              var i = 0;
              var len = $1;
              while (i < len * 2) {
                var ptr1 = GROWABLE_HEAP_I32()[$2 / 4 + i >>> 0];
                var ptr2 = GROWABLE_HEAP_I32()[$2 / 4 + i + 1 >>> 0];
                try {
                  var z = encodeURI(UTF8ToString(ptr1));
                  if (z === "Host")
                    z = "X-Host-Override";
                  if (z === "User-Agent")
                    z = "X-user-agent";
                  if (z === "Authorization") {
                    xhr.setRequestHeader(z, UTF8ToString(ptr2));
                  } else {
                    xhr.setRequestHeader(z, encodeURI(UTF8ToString(ptr2)));
                  }
                } catch (error) {
                  console.warn("Error while performing XMLHttpRequest.setRequestHeader()", error);
                }
                i += 2;
              }
              try {
                var post_payload = new Uint8Array($5);
                for (var iii = 0; iii < $5; iii++) {
                  post_payload[iii] = Module2.HEAPU8[iii + $4];
                }
                xhr.send(post_payload);
              } catch (e) {
                return 0;
              }
              if (xhr.status >= 400)
                return 0;
              var uInt8Array = xhr.response;
              var len = uInt8Array.byteLength;
              var fileOnWasmHeap = _malloc(len + 4);
              var properArray = new Uint8Array(uInt8Array);
              for (var iii = 0; iii < len; iii++) {
                Module2.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
              }
              var LEN123 = new Uint8Array(4);
              LEN123[0] = len % 256;
              len -= LEN123[0];
              len /= 256;
              LEN123[1] = len % 256;
              len -= LEN123[1];
              len /= 256;
              LEN123[2] = len % 256;
              len -= LEN123[2];
              len /= 256;
              LEN123[3] = len % 256;
              len -= LEN123[3];
              len /= 256;
              Module2.HEAPU8.set(LEN123, fileOnWasmHeap);
              return fileOnWasmHeap;
            }
          };
          function ExitStatus(status) {
            this.name = "ExitStatus";
            this.message = "Program terminated with exit(".concat(status, ")");
            this.status = status;
          }
          var terminateWorker = (worker) => {
            worker.terminate();
            worker.onmessage = (e) => {
            };
          };
          var killThread = (pthread_ptr) => {
            var worker = PThread.pthreads[pthread_ptr];
            delete PThread.pthreads[pthread_ptr];
            terminateWorker(worker);
            __emscripten_thread_free_data(pthread_ptr);
            PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
            worker.pthread_ptr = 0;
          };
          var cancelThread = (pthread_ptr) => {
            var worker = PThread.pthreads[pthread_ptr];
            worker.postMessage({
              "cmd": "cancel"
            });
          };
          var cleanupThread = (pthread_ptr) => {
            var worker = PThread.pthreads[pthread_ptr];
            PThread.returnWorkerToPool(worker);
          };
          var zeroMemory = (address, size) => {
            GROWABLE_HEAP_U8().fill(0, address, address + size);
            return address;
          };
          var spawnThread = (threadParams) => {
            var worker = PThread.getNewWorker();
            if (!worker) {
              return 6;
            }
            PThread.runningWorkers.push(worker);
            PThread.pthreads[threadParams.pthread_ptr] = worker;
            worker.pthread_ptr = threadParams.pthread_ptr;
            var msg = {
              "cmd": "run",
              "start_routine": threadParams.startRoutine,
              "arg": threadParams.arg,
              "pthread_ptr": threadParams.pthread_ptr
            };
            if (ENVIRONMENT_IS_NODE2) {
              worker.unref();
            }
            worker.postMessage(msg, threadParams.transferList);
            return 0;
          };
          var runtimeKeepaliveCounter = 0;
          var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
          var stackSave = () => _emscripten_stack_get_current();
          var stackRestore = (val) => __emscripten_stack_restore(val);
          var withStackSave = (f) => {
            var stack = stackSave();
            var ret = f();
            stackRestore(stack);
            return ret;
          };
          var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
          Module2["stackAlloc"] = stackAlloc;
          var convertI32PairToI53Checked = (lo, hi) => hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
          var proxyToMainThread = (funcIndex, emAsmAddr, sync, ...callArgs) => withStackSave(() => {
            var serializedNumCallArgs = callArgs.length;
            var args = stackAlloc(serializedNumCallArgs * 8);
            var b = args >>> 3;
            for (var i = 0; i < callArgs.length; i++) {
              var arg = callArgs[i];
              GROWABLE_HEAP_F64()[b + i >>> 0] = arg;
            }
            return __emscripten_run_on_main_thread_js(funcIndex, emAsmAddr, serializedNumCallArgs, args, sync);
          });
          function _proc_exit(code) {
            var _a2;
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(0, 0, 1, code);
            EXITSTATUS = code;
            if (!keepRuntimeAlive()) {
              PThread.terminateAllThreads();
              (_a2 = Module2["onExit"]) == null ? void 0 : _a2.call(Module2, code);
              ABORT = true;
            }
            quit_(code, new ExitStatus(code));
          }
          var exitJS = (status, implicit) => {
            EXITSTATUS = status;
            if (ENVIRONMENT_IS_PTHREAD) {
              exitOnMainThread(status);
              throw "unwind";
            }
            _proc_exit(status);
          };
          var _exit = exitJS;
          var handleException = (e) => {
            if (e instanceof ExitStatus || e == "unwind") {
              return EXITSTATUS;
            }
            quit_(1, e);
          };
          var PThread = {
            unusedWorkers: [],
            runningWorkers: [],
            tlsInitFunctions: [],
            pthreads: {},
            init() {
              if (ENVIRONMENT_IS_PTHREAD) {
                PThread.initWorker();
              } else {
                PThread.initMainThread();
              }
            },
            initMainThread() {
              var pthreadPoolSize = 8;
              while (pthreadPoolSize--) {
                PThread.allocateUnusedWorker();
              }
              addOnPreRun(() => {
                addRunDependency("loading-workers");
                PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("loading-workers"));
              });
            },
            initWorker() {
              noExitRuntime = false;
            },
            setExitStatus: (status) => EXITSTATUS = status,
            terminateAllThreads__deps: ["$terminateWorker"],
            terminateAllThreads: () => {
              for (var worker of PThread.runningWorkers) {
                terminateWorker(worker);
              }
              for (var worker of PThread.unusedWorkers) {
                terminateWorker(worker);
              }
              PThread.unusedWorkers = [];
              PThread.runningWorkers = [];
              PThread.pthreads = [];
            },
            returnWorkerToPool: (worker) => {
              var pthread_ptr = worker.pthread_ptr;
              delete PThread.pthreads[pthread_ptr];
              PThread.unusedWorkers.push(worker);
              PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
              worker.pthread_ptr = 0;
              __emscripten_thread_free_data(pthread_ptr);
            },
            receiveObjectTransfer(data) {
            },
            threadInitTLS() {
              PThread.tlsInitFunctions.forEach((f) => f());
            },
            loadWasmModuleToWorker: (worker) => new Promise((onFinishedLoading) => {
              worker.onmessage = (e) => {
                var d = e["data"];
                var cmd = d["cmd"];
                if (d["targetThread"] && d["targetThread"] != _pthread_self()) {
                  var targetWorker = PThread.pthreads[d["targetThread"]];
                  if (targetWorker) {
                    targetWorker.postMessage(d, d["transferList"]);
                  } else {
                    err2('Internal error! Worker sent a message "'.concat(cmd, '" to target pthread ').concat(d["targetThread"], ", but that thread no longer exists!"));
                  }
                  return;
                }
                if (cmd === "checkMailbox") {
                  checkMailbox();
                } else if (cmd === "spawnThread") {
                  spawnThread(d);
                } else if (cmd === "cleanupThread") {
                  cleanupThread(d["thread"]);
                } else if (cmd === "killThread") {
                  killThread(d["thread"]);
                } else if (cmd === "cancelThread") {
                  cancelThread(d["thread"]);
                } else if (cmd === "loaded") {
                  worker.loaded = true;
                  if (ENVIRONMENT_IS_NODE2 && !worker.pthread_ptr) {
                    worker.unref();
                  }
                  onFinishedLoading(worker);
                } else if (cmd === "alert") {
                  alert("Thread ".concat(d["threadId"], ": ").concat(d["text"]));
                } else if (d.target === "setimmediate") {
                  worker.postMessage(d);
                } else if (cmd === "callHandler") {
                  Module2[d["handler"]](...d["args"]);
                } else if (cmd) {
                  err2("worker sent an unknown command ".concat(cmd));
                }
              };
              worker.onerror = (e) => {
                var message = "worker sent an error!";
                err2("".concat(message, " ").concat(e.filename, ":").concat(e.lineno, ": ").concat(e.message));
                throw e;
              };
              if (ENVIRONMENT_IS_NODE2) {
                worker.on("message", (data) => worker.onmessage({
                  data
                }));
                worker.on("error", (e) => worker.onerror(e));
              }
              var handlers = [];
              var knownHandlers = ["onExit", "onAbort", "print", "printErr"];
              for (var handler of knownHandlers) {
                if (Module2.hasOwnProperty(handler)) {
                  handlers.push(handler);
                }
              }
              worker.postMessage({
                "cmd": "load",
                "handlers": handlers,
                "urlOrBlob": Module2["mainScriptUrlOrBlob"] || _scriptDir,
                "wasmMemory": wasmMemory,
                "wasmModule": wasmModule
              });
            }),
            loadWasmModuleToAllWorkers(onMaybeReady) {
              if (ENVIRONMENT_IS_PTHREAD) {
                return onMaybeReady();
              }
              let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
              pthreadPoolReady.then(onMaybeReady);
            },
            allocateUnusedWorker() {
              var worker;
              var pthreadMainJs = locateFile("duckdb_wasm.worker.js");
              worker = new Worker(pthreadMainJs);
              PThread.unusedWorkers.push(worker);
            },
            getNewWorker() {
              if (PThread.unusedWorkers.length == 0) {
                PThread.allocateUnusedWorker();
                PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
              }
              return PThread.unusedWorkers.pop();
            }
          };
          Module2["PThread"] = PThread;
          var callRuntimeCallbacks = (callbacks) => {
            while (callbacks.length > 0) {
              callbacks.shift()(Module2);
            }
          };
          var establishStackSpace = () => {
            var pthread_ptr = _pthread_self();
            var stackHigh = GROWABLE_HEAP_U32()[pthread_ptr + 52 >>> 2 >>> 0];
            var stackSize = GROWABLE_HEAP_U32()[pthread_ptr + 56 >>> 2 >>> 0];
            var stackLow = stackHigh - stackSize;
            _emscripten_stack_set_limits(stackHigh, stackLow);
            stackRestore(stackHigh);
          };
          Module2["establishStackSpace"] = establishStackSpace;
          function exitOnMainThread(returnCode) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(1, 0, 0, returnCode);
            _exit(returnCode);
          }
          var wasmTable;
          var getWasmTableEntry = (funcPtr) => wasmTable.get(funcPtr);
          var invokeEntryPoint = (ptr, arg) => {
            runtimeKeepaliveCounter = 0;
            var result = getWasmTableEntry(ptr)(arg);
            function finish(result2) {
              if (keepRuntimeAlive()) {
                PThread.setExitStatus(result2);
              } else {
                __emscripten_thread_exit(result2);
              }
            }
            finish(result);
          };
          Module2["invokeEntryPoint"] = invokeEntryPoint;
          var noExitRuntime = Module2["noExitRuntime"] || true;
          var registerTLSInit = (tlsInitFunc) => PThread.tlsInitFunctions.push(tlsInitFunc);
          function ___emscripten_init_main_thread_js(tb) {
            tb >>>= 0;
            __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1, !ENVIRONMENT_IS_WEB, 1048576, false);
            PThread.threadInitTLS();
          }
          function ___emscripten_thread_cleanup(thread) {
            thread >>>= 0;
            if (!ENVIRONMENT_IS_PTHREAD)
              cleanupThread(thread);
            else
              postMessage({
                "cmd": "cleanupThread",
                "thread": thread
              });
          }
          function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
            return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
          }
          function ___pthread_create_js(pthread_ptr, attr, startRoutine, arg) {
            pthread_ptr >>>= 0;
            attr >>>= 0;
            startRoutine >>>= 0;
            arg >>>= 0;
            if (typeof SharedArrayBuffer == "undefined") {
              err2("Current environment does not support SharedArrayBuffer, pthreads are not available!");
              return 6;
            }
            var transferList = [];
            var error = 0;
            if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
              return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
            }
            if (error)
              return error;
            var threadParams = {
              startRoutine,
              pthread_ptr,
              arg,
              transferList
            };
            if (ENVIRONMENT_IS_PTHREAD) {
              threadParams.cmd = "spawnThread";
              postMessage(threadParams, transferList);
              return 0;
            }
            return spawnThread(threadParams);
          }
          function SOCKFS() {
            abort("missing function: $SOCKFS");
          }
          SOCKFS.stub = true;
          function FS() {
            abort("missing function: $FS");
          }
          FS.stub = true;
          var getSocketFromFD = (fd) => {
            var socket = SOCKFS.getSocket(fd);
            if (!socket)
              throw new FS.ErrnoError(8);
            return socket;
          };
          var inetNtop4 = (addr) => (addr & 255) + "." + (addr >> 8 & 255) + "." + (addr >> 16 & 255) + "." + (addr >> 24 & 255);
          var inetNtop6 = (ints) => {
            var str = "";
            var word = 0;
            var longest = 0;
            var lastzero = 0;
            var zstart = 0;
            var len = 0;
            var i = 0;
            var parts = [ints[0] & 65535, ints[0] >> 16, ints[1] & 65535, ints[1] >> 16, ints[2] & 65535, ints[2] >> 16, ints[3] & 65535, ints[3] >> 16];
            var hasipv4 = true;
            var v4part = "";
            for (i = 0; i < 5; i++) {
              if (parts[i] !== 0) {
                hasipv4 = false;
                break;
              }
            }
            if (hasipv4) {
              v4part = inetNtop4(parts[6] | parts[7] << 16);
              if (parts[5] === -1) {
                str = "::ffff:";
                str += v4part;
                return str;
              }
              if (parts[5] === 0) {
                str = "::";
                if (v4part === "0.0.0.0")
                  v4part = "";
                if (v4part === "0.0.0.1")
                  v4part = "1";
                str += v4part;
                return str;
              }
            }
            for (word = 0; word < 8; word++) {
              if (parts[word] === 0) {
                if (word - lastzero > 1) {
                  len = 0;
                }
                lastzero = word;
                len++;
              }
              if (len > longest) {
                longest = len;
                zstart = word - longest + 1;
              }
            }
            for (word = 0; word < 8; word++) {
              if (longest > 1) {
                if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
                  if (word === zstart) {
                    str += ":";
                    if (zstart === 0)
                      str += ":";
                  }
                  continue;
                }
              }
              str += Number(_ntohs(parts[word] & 65535)).toString(16);
              str += word < 7 ? ":" : "";
            }
            return str;
          };
          var readSockaddr = (sa, salen) => {
            var family = GROWABLE_HEAP_I16()[sa >>> 1 >>> 0];
            var port = _ntohs(GROWABLE_HEAP_U16()[sa + 2 >>> 1 >>> 0]);
            var addr;
            switch (family) {
              case 2:
                if (salen !== 16) {
                  return {
                    errno: 28
                  };
                }
                addr = GROWABLE_HEAP_I32()[sa + 4 >>> 2 >>> 0];
                addr = inetNtop4(addr);
                break;
              case 10:
                if (salen !== 28) {
                  return {
                    errno: 28
                  };
                }
                addr = [GROWABLE_HEAP_I32()[sa + 8 >>> 2 >>> 0], GROWABLE_HEAP_I32()[sa + 12 >>> 2 >>> 0], GROWABLE_HEAP_I32()[sa + 16 >>> 2 >>> 0], GROWABLE_HEAP_I32()[sa + 20 >>> 2 >>> 0]];
                addr = inetNtop6(addr);
                break;
              default:
                return {
                  errno: 5
                };
            }
            return {
              family,
              addr,
              port
            };
          };
          var inetPton4 = (str) => {
            var b = str.split(".");
            for (var i = 0; i < 4; i++) {
              var tmp = Number(b[i]);
              if (isNaN(tmp))
                return null;
              b[i] = tmp;
            }
            return (b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24) >>> 0;
          };
          var jstoi_q = (str) => parseInt(str);
          var inetPton6 = (str) => {
            var words;
            var w, offset, z;
            var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
            var parts = [];
            if (!valid6regx.test(str)) {
              return null;
            }
            if (str === "::") {
              return [0, 0, 0, 0, 0, 0, 0, 0];
            }
            if (str.startsWith("::")) {
              str = str.replace("::", "Z:");
            } else {
              str = str.replace("::", ":Z:");
            }
            if (str.indexOf(".") > 0) {
              str = str.replace(new RegExp("[.]", "g"), ":");
              words = str.split(":");
              words[words.length - 4] = jstoi_q(words[words.length - 4]) + jstoi_q(words[words.length - 3]) * 256;
              words[words.length - 3] = jstoi_q(words[words.length - 2]) + jstoi_q(words[words.length - 1]) * 256;
              words = words.slice(0, words.length - 2);
            } else {
              words = str.split(":");
            }
            offset = 0;
            z = 0;
            for (w = 0; w < words.length; w++) {
              if (typeof words[w] == "string") {
                if (words[w] === "Z") {
                  for (z = 0; z < 8 - words.length + 1; z++) {
                    parts[w + z] = 0;
                  }
                  offset = z - 1;
                } else {
                  parts[w + offset] = _htons(parseInt(words[w], 16));
                }
              } else {
                parts[w + offset] = words[w];
              }
            }
            return [parts[1] << 16 | parts[0], parts[3] << 16 | parts[2], parts[5] << 16 | parts[4], parts[7] << 16 | parts[6]];
          };
          var DNS = {
            address_map: {
              id: 1,
              addrs: {},
              names: {}
            },
            lookup_name(name2) {
              var res = inetPton4(name2);
              if (res !== null) {
                return name2;
              }
              res = inetPton6(name2);
              if (res !== null) {
                return name2;
              }
              var addr;
              if (DNS.address_map.addrs[name2]) {
                addr = DNS.address_map.addrs[name2];
              } else {
                var id = DNS.address_map.id++;
                assert(id < 65535, "exceeded max address mappings of 65535");
                addr = "172.29." + (id & 255) + "." + (id & 65280);
                DNS.address_map.names[addr] = name2;
                DNS.address_map.addrs[name2] = addr;
              }
              return addr;
            },
            lookup_addr(addr) {
              if (DNS.address_map.names[addr]) {
                return DNS.address_map.names[addr];
              }
              return null;
            }
          };
          var getSocketAddress = (addrp, addrlen, allowNull) => {
            if (allowNull && addrp === 0)
              return null;
            var info = readSockaddr(addrp, addrlen);
            if (info.errno)
              throw new FS.ErrnoError(info.errno);
            info.addr = DNS.lookup_addr(info.addr) || info.addr;
            return info;
          };
          function ___syscall_bind(fd, addr, addrlen, d1, d2, d3) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(3, 0, 1, fd, addr, addrlen, d1, d2, d3);
            addr >>>= 0;
            addrlen >>>= 0;
            var sock = getSocketFromFD(fd);
            var info = getSocketAddress(addr, addrlen);
            sock.sock_ops.bind(sock, info.addr, info.port);
            return 0;
          }
          function ___syscall_connect(fd, addr, addrlen, d1, d2, d3) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(4, 0, 1, fd, addr, addrlen, d1, d2, d3);
            addr >>>= 0;
            addrlen >>>= 0;
            var sock = getSocketFromFD(fd);
            var info = getSocketAddress(addr, addrlen);
            sock.sock_ops.connect(sock, info.addr, info.port);
            return 0;
          }
          function ___syscall_faccessat(dirfd, path, amode, flags) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(5, 0, 1, dirfd, path, amode, flags);
            path >>>= 0;
          }
          var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : void 0;
          var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
            idx >>>= 0;
            var endIdx = idx + maxBytesToRead;
            var endPtr = idx;
            while (heapOrArray[endPtr] && !(endPtr >= endIdx))
              ++endPtr;
            if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
              return UTF8Decoder.decode(heapOrArray.slice(idx, endPtr));
            }
            var str = "";
            while (idx < endPtr) {
              var u0 = heapOrArray[idx++];
              if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue;
              }
              var u1 = heapOrArray[idx++] & 63;
              if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue;
              }
              var u2 = heapOrArray[idx++] & 63;
              if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2;
              } else {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
              }
              if (u0 < 65536) {
                str += String.fromCharCode(u0);
              } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
              }
            }
            return str;
          };
          var UTF8ToString = (ptr, maxBytesToRead) => {
            ptr >>>= 0;
            return ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : "";
          };
          var SYSCALLS = {
            varargs: void 0,
            getStr(ptr) {
              var ret = UTF8ToString(ptr);
              return ret;
            }
          };
          function ___syscall_fcntl64(fd, cmd, varargs) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(6, 0, 1, fd, cmd, varargs);
            varargs >>>= 0;
            SYSCALLS.varargs = varargs;
            return 0;
          }
          function ___syscall_fstat64(fd, buf) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(7, 0, 1, fd, buf);
            buf >>>= 0;
          }
          function ___syscall_ftruncate64(fd, length_low, length_high) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(8, 0, 1, fd, length_low, length_high);
            var length = convertI32PairToI53Checked(length_low, length_high);
          }
          var lengthBytesUTF8 = (str) => {
            var len = 0;
            for (var i = 0; i < str.length; ++i) {
              var c = str.charCodeAt(i);
              if (c <= 127) {
                len++;
              } else if (c <= 2047) {
                len += 2;
              } else if (c >= 55296 && c <= 57343) {
                len += 4;
                ++i;
              } else {
                len += 3;
              }
            }
            return len;
          };
          Module2["lengthBytesUTF8"] = lengthBytesUTF8;
          var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
            outIdx >>>= 0;
            if (!(maxBytesToWrite > 0))
              return 0;
            var startIdx = outIdx;
            var endIdx = outIdx + maxBytesToWrite - 1;
            for (var i = 0; i < str.length; ++i) {
              var u = str.charCodeAt(i);
              if (u >= 55296 && u <= 57343) {
                var u1 = str.charCodeAt(++i);
                u = 65536 + ((u & 1023) << 10) | u1 & 1023;
              }
              if (u <= 127) {
                if (outIdx >= endIdx)
                  break;
                heap[outIdx++ >>> 0] = u;
              } else if (u <= 2047) {
                if (outIdx + 1 >= endIdx)
                  break;
                heap[outIdx++ >>> 0] = 192 | u >> 6;
                heap[outIdx++ >>> 0] = 128 | u & 63;
              } else if (u <= 65535) {
                if (outIdx + 2 >= endIdx)
                  break;
                heap[outIdx++ >>> 0] = 224 | u >> 12;
                heap[outIdx++ >>> 0] = 128 | u >> 6 & 63;
                heap[outIdx++ >>> 0] = 128 | u & 63;
              } else {
                if (outIdx + 3 >= endIdx)
                  break;
                heap[outIdx++ >>> 0] = 240 | u >> 18;
                heap[outIdx++ >>> 0] = 128 | u >> 12 & 63;
                heap[outIdx++ >>> 0] = 128 | u >> 6 & 63;
                heap[outIdx++ >>> 0] = 128 | u & 63;
              }
            }
            heap[outIdx >>> 0] = 0;
            return outIdx - startIdx;
          };
          var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite);
          Module2["stringToUTF8"] = stringToUTF8;
          function ___syscall_getcwd(buf, size) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(9, 0, 1, buf, size);
            buf >>>= 0;
            size >>>= 0;
          }
          function ___syscall_getdents64(fd, dirp, count) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(10, 0, 1, fd, dirp, count);
            dirp >>>= 0;
            count >>>= 0;
          }
          var writeSockaddr = (sa, family, addr, port, addrlen) => {
            switch (family) {
              case 2:
                addr = inetPton4(addr);
                zeroMemory(sa, 16);
                if (addrlen) {
                  GROWABLE_HEAP_I32()[addrlen >>> 2 >>> 0] = 16;
                }
                GROWABLE_HEAP_I16()[sa >>> 1 >>> 0] = family;
                GROWABLE_HEAP_I32()[sa + 4 >>> 2 >>> 0] = addr;
                GROWABLE_HEAP_I16()[sa + 2 >>> 1 >>> 0] = _htons(port);
                break;
              case 10:
                addr = inetPton6(addr);
                zeroMemory(sa, 28);
                if (addrlen) {
                  GROWABLE_HEAP_I32()[addrlen >>> 2 >>> 0] = 28;
                }
                GROWABLE_HEAP_I32()[sa >>> 2 >>> 0] = family;
                GROWABLE_HEAP_I32()[sa + 8 >>> 2 >>> 0] = addr[0];
                GROWABLE_HEAP_I32()[sa + 12 >>> 2 >>> 0] = addr[1];
                GROWABLE_HEAP_I32()[sa + 16 >>> 2 >>> 0] = addr[2];
                GROWABLE_HEAP_I32()[sa + 20 >>> 2 >>> 0] = addr[3];
                GROWABLE_HEAP_I16()[sa + 2 >>> 1 >>> 0] = _htons(port);
                break;
              default:
                return 5;
            }
            return 0;
          };
          function ___syscall_getpeername(fd, addr, addrlen, d1, d2, d3) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(11, 0, 1, fd, addr, addrlen, d1, d2, d3);
            addr >>>= 0;
            addrlen >>>= 0;
            var sock = getSocketFromFD(fd);
            if (!sock.daddr) {
              return -53;
            }
            var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(sock.daddr), sock.dport, addrlen);
            return 0;
          }
          function ___syscall_getsockname(fd, addr, addrlen, d1, d2, d3) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(12, 0, 1, fd, addr, addrlen, d1, d2, d3);
            addr >>>= 0;
            addrlen >>>= 0;
            var sock = getSocketFromFD(fd);
            var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport, addrlen);
            return 0;
          }
          function ___syscall_getsockopt(fd, level, optname, optval, optlen, d1) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(13, 0, 1, fd, level, optname, optval, optlen, d1);
            optval >>>= 0;
            optlen >>>= 0;
            var sock = getSocketFromFD(fd);
            if (level === 1) {
              if (optname === 4) {
                GROWABLE_HEAP_I32()[optval >>> 2 >>> 0] = sock.error;
                GROWABLE_HEAP_I32()[optlen >>> 2 >>> 0] = 4;
                sock.error = null;
                return 0;
              }
            }
            return -50;
          }
          function ___syscall_ioctl(fd, op, varargs) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(14, 0, 1, fd, op, varargs);
            varargs >>>= 0;
            SYSCALLS.varargs = varargs;
            return 0;
          }
          function ___syscall_lstat64(path, buf) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(15, 0, 1, path, buf);
            path >>>= 0;
            buf >>>= 0;
          }
          function ___syscall_mkdirat(dirfd, path, mode) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(16, 0, 1, dirfd, path, mode);
            path >>>= 0;
          }
          function ___syscall_newfstatat(dirfd, path, buf, flags) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(17, 0, 1, dirfd, path, buf, flags);
            path >>>= 0;
            buf >>>= 0;
          }
          function ___syscall_openat(dirfd, path, flags, varargs) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(18, 0, 1, dirfd, path, flags, varargs);
            path >>>= 0;
            varargs >>>= 0;
            SYSCALLS.varargs = varargs;
          }
          function ___syscall_poll(fds, nfds, timeout) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(19, 0, 1, fds, nfds, timeout);
            fds >>>= 0;
          }
          function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(20, 0, 1, fd, buf, len, flags, addr, addrlen);
            buf >>>= 0;
            len >>>= 0;
            addr >>>= 0;
            addrlen >>>= 0;
            var sock = getSocketFromFD(fd);
            var msg = sock.sock_ops.recvmsg(sock, len);
            if (!msg)
              return 0;
            if (addr) {
              var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen);
            }
            GROWABLE_HEAP_U8().set(msg.buffer, buf >>> 0);
            return msg.buffer.byteLength;
          }
          function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(21, 0, 1, olddirfd, oldpath, newdirfd, newpath);
            oldpath >>>= 0;
            newpath >>>= 0;
          }
          function ___syscall_rmdir(path) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(22, 0, 1, path);
            path >>>= 0;
          }
          function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(23, 0, 1, fd, message, length, flags, addr, addr_len);
            message >>>= 0;
            length >>>= 0;
            addr >>>= 0;
            addr_len >>>= 0;
          }
          function ___syscall_socket(domain, type, protocol) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(24, 0, 1, domain, type, protocol);
          }
          function ___syscall_stat64(path, buf) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(25, 0, 1, path, buf);
            path >>>= 0;
            buf >>>= 0;
          }
          function ___syscall_statfs64(path, size, buf) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(26, 0, 1, path, size, buf);
            path >>>= 0;
            size >>>= 0;
            buf >>>= 0;
          }
          function ___syscall_unlinkat(dirfd, path, flags) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(27, 0, 1, dirfd, path, flags);
            path >>>= 0;
          }
          var nowIsMonotonic = 1;
          var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
          var maybeExit = () => {
            if (!keepRuntimeAlive()) {
              try {
                if (ENVIRONMENT_IS_PTHREAD)
                  __emscripten_thread_exit(EXITSTATUS);
                else
                  _exit(EXITSTATUS);
              } catch (e) {
                handleException(e);
              }
            }
          };
          var callUserCallback = (func) => {
            if (ABORT) {
              return;
            }
            try {
              func();
              maybeExit();
            } catch (e) {
              handleException(e);
            }
          };
          function __emscripten_thread_mailbox_await(pthread_ptr) {
            pthread_ptr >>>= 0;
            if (typeof Atomics.waitAsync === "function") {
              var wait = Atomics.waitAsync(GROWABLE_HEAP_I32(), pthread_ptr >>> 2, pthread_ptr);
              wait.value.then(checkMailbox);
              var waitingAsync = pthread_ptr + 128;
              Atomics.store(GROWABLE_HEAP_I32(), waitingAsync >>> 2, 1);
            }
          }
          Module2["__emscripten_thread_mailbox_await"] = __emscripten_thread_mailbox_await;
          var checkMailbox = () => {
            var pthread_ptr = _pthread_self();
            if (pthread_ptr) {
              __emscripten_thread_mailbox_await(pthread_ptr);
              callUserCallback(__emscripten_check_mailbox);
            }
          };
          Module2["checkMailbox"] = checkMailbox;
          function __emscripten_notify_mailbox_postmessage(targetThreadId, currThreadId, mainThreadId) {
            targetThreadId >>>= 0;
            currThreadId >>>= 0;
            mainThreadId >>>= 0;
            if (targetThreadId == currThreadId) {
              setTimeout(checkMailbox);
            } else if (ENVIRONMENT_IS_PTHREAD) {
              postMessage({
                "targetThread": targetThreadId,
                "cmd": "checkMailbox"
              });
            } else {
              var worker = PThread.pthreads[targetThreadId];
              if (!worker) {
                return;
              }
              worker.postMessage({
                "cmd": "checkMailbox"
              });
            }
          }
          var proxiedJSCallArgs = [];
          function __emscripten_receive_on_main_thread_js(funcIndex, emAsmAddr, callingThread, numCallArgs, args) {
            emAsmAddr >>>= 0;
            callingThread >>>= 0;
            args >>>= 0;
            proxiedJSCallArgs.length = numCallArgs;
            var b = args >>> 3;
            for (var i = 0; i < numCallArgs; i++) {
              proxiedJSCallArgs[i] = GROWABLE_HEAP_F64()[b + i >>> 0];
            }
            var func = emAsmAddr ? ASM_CONSTS[emAsmAddr] : proxiedFunctionTable[funcIndex];
            PThread.currentProxiedOperationCallerThread = callingThread;
            var rtn = func(...proxiedJSCallArgs);
            PThread.currentProxiedOperationCallerThread = 0;
            return rtn;
          }
          function __emscripten_thread_set_strongref(thread) {
            thread >>>= 0;
            if (ENVIRONMENT_IS_NODE2) {
              PThread.pthreads[thread].ref();
            }
          }
          function __emval_call_method() {
            abort("missing function: _emval_call_method");
          }
          __emval_call_method.stub = true;
          function __emval_decref() {
            abort("missing function: _emval_decref");
          }
          __emval_decref.stub = true;
          function __emval_get_global() {
            abort("missing function: _emval_get_global");
          }
          __emval_get_global.stub = true;
          function __emval_get_method_caller() {
            abort("missing function: _emval_get_method_caller");
          }
          __emval_get_method_caller.stub = true;
          function __emval_run_destructors() {
            abort("missing function: _emval_run_destructors");
          }
          __emval_run_destructors.stub = true;
          var isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
          var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
          var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
          var ydayFromDate = (date) => {
            var leap = isLeapYear(date.getFullYear());
            var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
            var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
            return yday;
          };
          function __localtime_js(time_low, time_high, tmPtr) {
            var time = convertI32PairToI53Checked(time_low, time_high);
            tmPtr >>>= 0;
            var date = new Date(time * 1e3);
            GROWABLE_HEAP_I32()[tmPtr >>> 2 >>> 0] = date.getSeconds();
            GROWABLE_HEAP_I32()[tmPtr + 4 >>> 2 >>> 0] = date.getMinutes();
            GROWABLE_HEAP_I32()[tmPtr + 8 >>> 2 >>> 0] = date.getHours();
            GROWABLE_HEAP_I32()[tmPtr + 12 >>> 2 >>> 0] = date.getDate();
            GROWABLE_HEAP_I32()[tmPtr + 16 >>> 2 >>> 0] = date.getMonth();
            GROWABLE_HEAP_I32()[tmPtr + 20 >>> 2 >>> 0] = date.getFullYear() - 1900;
            GROWABLE_HEAP_I32()[tmPtr + 24 >>> 2 >>> 0] = date.getDay();
            var yday = ydayFromDate(date) | 0;
            GROWABLE_HEAP_I32()[tmPtr + 28 >>> 2 >>> 0] = yday;
            GROWABLE_HEAP_I32()[tmPtr + 36 >>> 2 >>> 0] = -(date.getTimezoneOffset() * 60);
            var start = new Date(date.getFullYear(), 0, 1);
            var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
            var winterOffset = start.getTimezoneOffset();
            var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
            GROWABLE_HEAP_I32()[tmPtr + 32 >>> 2 >>> 0] = dst;
          }
          var __tzset_js = function(timezone, daylight, std_name, dst_name) {
            timezone >>>= 0;
            daylight >>>= 0;
            std_name >>>= 0;
            dst_name >>>= 0;
            var currentYear = (/* @__PURE__ */ new Date()).getFullYear();
            var winter = new Date(currentYear, 0, 1);
            var summer = new Date(currentYear, 6, 1);
            var winterOffset = winter.getTimezoneOffset();
            var summerOffset = summer.getTimezoneOffset();
            var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
            GROWABLE_HEAP_U32()[timezone >>> 2 >>> 0] = stdTimezoneOffset * 60;
            GROWABLE_HEAP_I32()[daylight >>> 2 >>> 0] = Number(winterOffset != summerOffset);
            var extractZone = (date) => date.toLocaleTimeString(void 0, {
              hour12: false,
              timeZoneName: "short"
            }).split(" ")[1];
            var winterName = extractZone(winter);
            var summerName = extractZone(summer);
            if (summerOffset < winterOffset) {
              stringToUTF8(winterName, std_name, 17);
              stringToUTF8(summerName, dst_name, 17);
            } else {
              stringToUTF8(winterName, dst_name, 17);
              stringToUTF8(summerName, std_name, 17);
            }
          };
          var _abort = () => {
            abort("");
          };
          function _duckdb_web_fs_directory_create(path, pathLen) {
            path >>>= 0;
            return globalThis.DUCKDB_RUNTIME.createDirectory(Module2, path, pathLen);
          }
          function _duckdb_web_fs_directory_exists(path, pathLen) {
            path >>>= 0;
            return globalThis.DUCKDB_RUNTIME.checkDirectory(Module2, path, pathLen);
          }
          function _duckdb_web_fs_directory_list_files(path, pathLen) {
            path >>>= 0;
            return globalThis.DUCKDB_RUNTIME.listDirectoryEntries(Module2, path, pathLen);
          }
          function _duckdb_web_fs_directory_remove(path, pathLen) {
            path >>>= 0;
            return globalThis.DUCKDB_RUNTIME.removeDirectory(Module2, path, pathLen);
          }
          function _duckdb_web_fs_file_close(fileId) {
            return globalThis.DUCKDB_RUNTIME.closeFile(Module2, fileId);
          }
          function _duckdb_web_fs_file_drop_file(fileName, fileNameLen) {
            fileName >>>= 0;
            return globalThis.DUCKDB_RUNTIME.dropFile(Module2, fileName, fileNameLen);
          }
          function _duckdb_web_fs_file_exists(path, pathLen) {
            path >>>= 0;
            return globalThis.DUCKDB_RUNTIME.checkFile(Module2, path, pathLen);
          }
          function _duckdb_web_fs_file_move(from, fromLen, to, toLen) {
            from >>>= 0;
            to >>>= 0;
            return globalThis.DUCKDB_RUNTIME.moveFile(Module2, from, fromLen, to, toLen);
          }
          function _duckdb_web_fs_file_open(fileId, flags) {
            return globalThis.DUCKDB_RUNTIME.openFile(Module2, fileId, flags);
          }
          function _duckdb_web_fs_file_read(fileId, buf, size, location) {
            buf >>>= 0;
            return globalThis.DUCKDB_RUNTIME.readFile(Module2, fileId, buf, size, location);
          }
          function _duckdb_web_fs_file_truncate(fileId, newSize) {
            return globalThis.DUCKDB_RUNTIME.truncateFile(Module2, fileId, newSize);
          }
          function _duckdb_web_fs_file_write(fileId, buf, size, location) {
            buf >>>= 0;
            return globalThis.DUCKDB_RUNTIME.writeFile(Module2, fileId, buf, size, location);
          }
          function _duckdb_web_fs_get_default_data_protocol(Module3) {
            return globalThis.DUCKDB_RUNTIME.getDefaultDataProtocol(Module3);
          }
          function _duckdb_web_fs_glob(path, pathLen) {
            path >>>= 0;
            return globalThis.DUCKDB_RUNTIME.glob(Module2, path, pathLen);
          }
          function _duckdb_web_test_platform_feature(feature) {
            return globalThis.DUCKDB_RUNTIME.testPlatformFeature(Module2, feature);
          }
          function _duckdb_web_udf_scalar_call(funcId, descPtr, descSize, ptrsPtr, ptrsSize, response) {
            funcId >>>= 0;
            descSize >>>= 0;
            ptrsSize >>>= 0;
            return globalThis.DUCKDB_RUNTIME.callScalarUDF(Module2, funcId, descPtr, descSize, ptrsPtr, ptrsSize, response);
          }
          var readEmAsmArgsArray = [];
          var readEmAsmArgs = (sigPtr, buf) => {
            readEmAsmArgsArray.length = 0;
            var ch;
            while (ch = GROWABLE_HEAP_U8()[sigPtr++ >>> 0]) {
              var wide = ch != 105;
              wide &= ch != 112;
              buf += wide && buf % 8 ? 4 : 0;
              readEmAsmArgsArray.push(ch == 112 ? GROWABLE_HEAP_U32()[buf >>> 2 >>> 0] : ch == 105 ? GROWABLE_HEAP_I32()[buf >>> 2 >>> 0] : GROWABLE_HEAP_F64()[buf >>> 3 >>> 0]);
              buf += wide ? 8 : 4;
            }
            return readEmAsmArgsArray;
          };
          var runEmAsmFunction = (code, sigPtr, argbuf) => {
            var args = readEmAsmArgs(sigPtr, argbuf);
            return ASM_CONSTS[code](...args);
          };
          function _emscripten_asm_const_ptr(code, sigPtr, argbuf) {
            code >>>= 0;
            sigPtr >>>= 0;
            argbuf >>>= 0;
            return runEmAsmFunction(code, sigPtr, argbuf);
          }
          var warnOnce = (text) => {
            warnOnce.shown || (warnOnce.shown = {});
            if (!warnOnce.shown[text]) {
              warnOnce.shown[text] = 1;
              if (ENVIRONMENT_IS_NODE2)
                text = "warning: " + text;
              err2(text);
            }
          };
          var _emscripten_check_blocking_allowed = () => {
          };
          var _emscripten_date_now = () => Date.now();
          var runtimeKeepalivePush = () => {
            runtimeKeepaliveCounter += 1;
          };
          var _emscripten_exit_with_live_runtime = () => {
            runtimeKeepalivePush();
            throw "unwind";
          };
          var getHeapMax = () => 4294901760;
          function _emscripten_get_heap_max() {
            return getHeapMax();
          }
          var _emscripten_get_now;
          _emscripten_get_now = () => performance.timeOrigin + performance.now();
          var _emscripten_num_logical_cores = () => ENVIRONMENT_IS_NODE2 ? require_os().cpus().length : navigator["hardwareConcurrency"];
          var growMemory = (size) => {
            var b = wasmMemory.buffer;
            var pages = (size - b.byteLength + 65535) / 65536;
            try {
              wasmMemory.grow(pages);
              updateMemoryViews();
              return 1;
            } catch (e) {
            }
          };
          function _emscripten_resize_heap(requestedSize) {
            requestedSize >>>= 0;
            var oldSize = GROWABLE_HEAP_U8().length;
            if (requestedSize <= oldSize) {
              return false;
            }
            var maxHeapSize = getHeapMax();
            if (requestedSize > maxHeapSize) {
              return false;
            }
            var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
            for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
              var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
              overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
              var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
              var replacement = growMemory(newSize);
              if (replacement) {
                return true;
              }
            }
            return false;
          }
          var ENV = {};
          var getExecutableName = () => thisProgram || "./this.program";
          var getEnvStrings = () => {
            if (!getEnvStrings.strings) {
              var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
              var env = {
                "USER": "web_user",
                "LOGNAME": "web_user",
                "PATH": "/",
                "PWD": "/",
                "HOME": "/home/web_user",
                "LANG": lang,
                "_": getExecutableName()
              };
              for (var x in ENV) {
                if (ENV[x] === void 0)
                  delete env[x];
                else
                  env[x] = ENV[x];
              }
              var strings = [];
              for (var x in env) {
                strings.push("".concat(x, "=").concat(env[x]));
              }
              getEnvStrings.strings = strings;
            }
            return getEnvStrings.strings;
          };
          var stringToAscii = (str, buffer) => {
            for (var i = 0; i < str.length; ++i) {
              GROWABLE_HEAP_I8()[buffer++ >>> 0] = str.charCodeAt(i);
            }
            GROWABLE_HEAP_I8()[buffer >>> 0] = 0;
          };
          var _environ_get = function(__environ, environ_buf) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(28, 0, 1, __environ, environ_buf);
            __environ >>>= 0;
            environ_buf >>>= 0;
            var bufSize = 0;
            getEnvStrings().forEach((string, i) => {
              var ptr = environ_buf + bufSize;
              GROWABLE_HEAP_U32()[__environ + i * 4 >>> 2 >>> 0] = ptr;
              stringToAscii(string, ptr);
              bufSize += string.length + 1;
            });
            return 0;
          };
          var _environ_sizes_get = function(penviron_count, penviron_buf_size) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(29, 0, 1, penviron_count, penviron_buf_size);
            penviron_count >>>= 0;
            penviron_buf_size >>>= 0;
            var strings = getEnvStrings();
            GROWABLE_HEAP_U32()[penviron_count >>> 2 >>> 0] = strings.length;
            var bufSize = 0;
            strings.forEach((string) => bufSize += string.length + 1);
            GROWABLE_HEAP_U32()[penviron_buf_size >>> 2 >>> 0] = bufSize;
            return 0;
          };
          function _fd_close(fd) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(30, 0, 1, fd);
            return 52;
          }
          function _fd_fdstat_get(fd, pbuf) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(31, 0, 1, fd, pbuf);
            pbuf >>>= 0;
            var rightsBase = 0;
            var rightsInheriting = 0;
            var flags = 0;
            {
              var type = 2;
              if (fd == 0) {
                rightsBase = 2;
              } else if (fd == 1 || fd == 2) {
                rightsBase = 64;
              }
              flags = 1;
            }
            GROWABLE_HEAP_I8()[pbuf >>> 0] = type;
            GROWABLE_HEAP_I16()[pbuf + 2 >>> 1 >>> 0] = flags;
            tempI64 = [rightsBase >>> 0, (tempDouble = rightsBase, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], GROWABLE_HEAP_I32()[pbuf + 8 >>> 2 >>> 0] = tempI64[0], GROWABLE_HEAP_I32()[pbuf + 12 >>> 2 >>> 0] = tempI64[1];
            tempI64 = [rightsInheriting >>> 0, (tempDouble = rightsInheriting, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], GROWABLE_HEAP_I32()[pbuf + 16 >>> 2 >>> 0] = tempI64[0], GROWABLE_HEAP_I32()[pbuf + 20 >>> 2 >>> 0] = tempI64[1];
            return 0;
          }
          function _fd_pread(fd, iov, iovcnt, offset_low, offset_high, pnum) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(32, 0, 1, fd, iov, iovcnt, offset_low, offset_high, pnum);
            iov >>>= 0;
            iovcnt >>>= 0;
            var offset = convertI32PairToI53Checked(offset_low, offset_high);
            pnum >>>= 0;
            return 52;
          }
          function _fd_pwrite(fd, iov, iovcnt, offset_low, offset_high, pnum) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(33, 0, 1, fd, iov, iovcnt, offset_low, offset_high, pnum);
            iov >>>= 0;
            iovcnt >>>= 0;
            var offset = convertI32PairToI53Checked(offset_low, offset_high);
            pnum >>>= 0;
            return 52;
          }
          function _fd_read(fd, iov, iovcnt, pnum) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(34, 0, 1, fd, iov, iovcnt, pnum);
            iov >>>= 0;
            iovcnt >>>= 0;
            pnum >>>= 0;
            return 52;
          }
          function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(35, 0, 1, fd, offset_low, offset_high, whence, newOffset);
            var offset = convertI32PairToI53Checked(offset_low, offset_high);
            newOffset >>>= 0;
            return 70;
          }
          function _fd_sync(fd) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(36, 0, 1, fd);
            return 52;
          }
          var printCharBuffers = [
            null,
            [],
            []
          ];
          var printChar = (stream, curr) => {
            var buffer = printCharBuffers[stream];
            if (curr === 0 || curr === 10) {
              (stream === 1 ? out : err2)(UTF8ArrayToString(buffer, 0));
              buffer.length = 0;
            } else {
              buffer.push(curr);
            }
          };
          function _fd_write(fd, iov, iovcnt, pnum) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(37, 0, 1, fd, iov, iovcnt, pnum);
            iov >>>= 0;
            iovcnt >>>= 0;
            pnum >>>= 0;
            var num = 0;
            for (var i = 0; i < iovcnt; i++) {
              var ptr = GROWABLE_HEAP_U32()[iov >>> 2 >>> 0];
              var len = GROWABLE_HEAP_U32()[iov + 4 >>> 2 >>> 0];
              iov += 8;
              for (var j = 0; j < len; j++) {
                printChar(fd, GROWABLE_HEAP_U8()[ptr + j >>> 0]);
              }
              num += len;
            }
            GROWABLE_HEAP_U32()[pnum >>> 2 >>> 0] = num;
            return 0;
          }
          function _getaddrinfo(node, service, hint, out2) {
            if (ENVIRONMENT_IS_PTHREAD)
              return proxyToMainThread(38, 0, 1, node, service, hint, out2);
            node >>>= 0;
            service >>>= 0;
            hint >>>= 0;
            out2 >>>= 0;
            var addr = 0;
            var port = 0;
            var flags = 0;
            var family = 0;
            var type = 0;
            var proto = 0;
            var ai;
            function allocaddrinfo(family2, type2, proto2, canon, addr2, port2) {
              var sa, salen, ai2;
              var errno;
              salen = family2 === 10 ? 28 : 16;
              addr2 = family2 === 10 ? inetNtop6(addr2) : inetNtop4(addr2);
              sa = _malloc(salen);
              errno = writeSockaddr(sa, family2, addr2, port2);
              assert(!errno);
              ai2 = _malloc(32);
              GROWABLE_HEAP_I32()[ai2 + 4 >>> 2 >>> 0] = family2;
              GROWABLE_HEAP_I32()[ai2 + 8 >>> 2 >>> 0] = type2;
              GROWABLE_HEAP_I32()[ai2 + 12 >>> 2 >>> 0] = proto2;
              GROWABLE_HEAP_U32()[ai2 + 24 >>> 2 >>> 0] = canon;
              GROWABLE_HEAP_U32()[ai2 + 20 >>> 2 >>> 0] = sa;
              if (family2 === 10) {
                GROWABLE_HEAP_I32()[ai2 + 16 >>> 2 >>> 0] = 28;
              } else {
                GROWABLE_HEAP_I32()[ai2 + 16 >>> 2 >>> 0] = 16;
              }
              GROWABLE_HEAP_I32()[ai2 + 28 >>> 2 >>> 0] = 0;
              return ai2;
            }
            if (hint) {
              flags = GROWABLE_HEAP_I32()[hint >>> 2 >>> 0];
              family = GROWABLE_HEAP_I32()[hint + 4 >>> 2 >>> 0];
              type = GROWABLE_HEAP_I32()[hint + 8 >>> 2 >>> 0];
              proto = GROWABLE_HEAP_I32()[hint + 12 >>> 2 >>> 0];
            }
            if (type && !proto) {
              proto = type === 2 ? 17 : 6;
            }
            if (!type && proto) {
              type = proto === 17 ? 2 : 1;
            }
            if (proto === 0) {
              proto = 6;
            }
            if (type === 0) {
              type = 1;
            }
            if (!node && !service) {
              return -2;
            }
            if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
              return -1;
            }
            if (hint !== 0 && GROWABLE_HEAP_I32()[hint >>> 2 >>> 0] & 2 && !node) {
              return -1;
            }
            if (flags & 32) {
              return -2;
            }
            if (type !== 0 && type !== 1 && type !== 2) {
              return -7;
            }
            if (family !== 0 && family !== 2 && family !== 10) {
              return -6;
            }
            if (service) {
              service = UTF8ToString(service);
              port = parseInt(service, 10);
              if (isNaN(port)) {
                if (flags & 1024) {
                  return -2;
                }
                return -8;
              }
            }
            if (!node) {
              if (family === 0) {
                family = 2;
              }
              if ((flags & 1) === 0) {
                if (family === 2) {
                  addr = _htonl(2130706433);
                } else {
                  addr = [0, 0, 0, 1];
                }
              }
              ai = allocaddrinfo(family, type, proto, null, addr, port);
              GROWABLE_HEAP_U32()[out2 >>> 2 >>> 0] = ai;
              return 0;
            }
            node = UTF8ToString(node);
            addr = inetPton4(node);
            if (addr !== null) {
              if (family === 0 || family === 2) {
                family = 2;
              } else if (family === 10 && flags & 8) {
                addr = [0, 0, _htonl(65535), addr];
                family = 10;
              } else {
                return -2;
              }
            } else {
              addr = inetPton6(node);
              if (addr !== null) {
                if (family === 0 || family === 10) {
                  family = 10;
                } else {
                  return -2;
                }
              }
            }
            if (addr != null) {
              ai = allocaddrinfo(family, type, proto, node, addr, port);
              GROWABLE_HEAP_U32()[out2 >>> 2 >>> 0] = ai;
              return 0;
            }
            if (flags & 4) {
              return -2;
            }
            node = DNS.lookup_name(node);
            addr = inetPton4(node);
            if (family === 0) {
              family = 2;
            } else if (family === 10) {
              addr = [0, 0, _htonl(65535), addr];
            }
            ai = allocaddrinfo(family, type, proto, null, addr, port);
            GROWABLE_HEAP_U32()[out2 >>> 2 >>> 0] = ai;
            return 0;
          }
          var initRandomFill = () => {
            if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
              return (view) => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), view);
            } else if (ENVIRONMENT_IS_NODE2) {
              try {
                var crypto_module = __require("crypto");
                var randomFillSync = crypto_module["randomFillSync"];
                if (randomFillSync) {
                  return (view) => crypto_module["randomFillSync"](view);
                }
                var randomBytes = crypto_module["randomBytes"];
                return (view) => (view.set(randomBytes(view.byteLength)), view);
              } catch (e) {
              }
            }
            abort("initRandomDevice");
          };
          var randomFill = (view) => (randomFill = initRandomFill())(view);
          function _getentropy(buffer, size) {
            buffer >>>= 0;
            size >>>= 0;
            randomFill(GROWABLE_HEAP_U8().subarray(buffer >>> 0, buffer + size >>> 0));
            return 0;
          }
          function _getnameinfo(sa, salen, node, nodelen, serv, servlen, flags) {
            sa >>>= 0;
            node >>>= 0;
            serv >>>= 0;
            var info = readSockaddr(sa, salen);
            if (info.errno) {
              return -6;
            }
            var port = info.port;
            var addr = info.addr;
            var overflowed = false;
            if (node && nodelen) {
              var lookup;
              if (flags & 1 || !(lookup = DNS.lookup_addr(addr))) {
                if (flags & 8) {
                  return -2;
                }
              } else {
                addr = lookup;
              }
              var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);
              if (numBytesWrittenExclNull + 1 >= nodelen) {
                overflowed = true;
              }
            }
            if (serv && servlen) {
              port = "" + port;
              var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);
              if (numBytesWrittenExclNull + 1 >= servlen) {
                overflowed = true;
              }
            }
            if (overflowed) {
              return -12;
            }
            return 0;
          }
          var arraySum = (array, index) => {
            var sum = 0;
            for (var i = 0; i <= index; sum += array[i++]) {
            }
            return sum;
          };
          var MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          var MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          var addDays = (date, days) => {
            var newDate = new Date(date.getTime());
            while (days > 0) {
              var leap = isLeapYear(newDate.getFullYear());
              var currentMonth = newDate.getMonth();
              var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
              if (days > daysInCurrentMonth - newDate.getDate()) {
                days -= daysInCurrentMonth - newDate.getDate() + 1;
                newDate.setDate(1);
                if (currentMonth < 11) {
                  newDate.setMonth(currentMonth + 1);
                } else {
                  newDate.setMonth(0);
                  newDate.setFullYear(newDate.getFullYear() + 1);
                }
              } else {
                newDate.setDate(newDate.getDate() + days);
                return newDate;
              }
            }
            return newDate;
          };
          function intArrayFromString(stringy, dontAddNull, length) {
            var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
            var u8array = new Array(len);
            var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
            if (dontAddNull)
              u8array.length = numBytesWritten;
            return u8array;
          }
          var writeArrayToMemory = (array, buffer) => {
            GROWABLE_HEAP_I8().set(array, buffer >>> 0);
          };
          function _strftime(s, maxsize, format, tm) {
            s >>>= 0;
            maxsize >>>= 0;
            format >>>= 0;
            tm >>>= 0;
            var tm_zone = GROWABLE_HEAP_U32()[tm + 40 >>> 2 >>> 0];
            var date = {
              tm_sec: GROWABLE_HEAP_I32()[tm >>> 2 >>> 0],
              tm_min: GROWABLE_HEAP_I32()[tm + 4 >>> 2 >>> 0],
              tm_hour: GROWABLE_HEAP_I32()[tm + 8 >>> 2 >>> 0],
              tm_mday: GROWABLE_HEAP_I32()[tm + 12 >>> 2 >>> 0],
              tm_mon: GROWABLE_HEAP_I32()[tm + 16 >>> 2 >>> 0],
              tm_year: GROWABLE_HEAP_I32()[tm + 20 >>> 2 >>> 0],
              tm_wday: GROWABLE_HEAP_I32()[tm + 24 >>> 2 >>> 0],
              tm_yday: GROWABLE_HEAP_I32()[tm + 28 >>> 2 >>> 0],
              tm_isdst: GROWABLE_HEAP_I32()[tm + 32 >>> 2 >>> 0],
              tm_gmtoff: GROWABLE_HEAP_I32()[tm + 36 >>> 2 >>> 0],
              tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
            };
            var pattern = UTF8ToString(format);
            var EXPANSION_RULES_1 = {
              "%c": "%a %b %d %H:%M:%S %Y",
              "%D": "%m/%d/%y",
              "%F": "%Y-%m-%d",
              "%h": "%b",
              "%r": "%I:%M:%S %p",
              "%R": "%H:%M",
              "%T": "%H:%M:%S",
              "%x": "%m/%d/%y",
              "%X": "%H:%M:%S",
              "%Ec": "%c",
              "%EC": "%C",
              "%Ex": "%m/%d/%y",
              "%EX": "%H:%M:%S",
              "%Ey": "%y",
              "%EY": "%Y",
              "%Od": "%d",
              "%Oe": "%e",
              "%OH": "%H",
              "%OI": "%I",
              "%Om": "%m",
              "%OM": "%M",
              "%OS": "%S",
              "%Ou": "%u",
              "%OU": "%U",
              "%OV": "%V",
              "%Ow": "%w",
              "%OW": "%W",
              "%Oy": "%y"
            };
            for (var rule in EXPANSION_RULES_1) {
              pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
            }
            var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            function leadingSomething(value, digits, character) {
              var str = typeof value == "number" ? value.toString() : value || "";
              while (str.length < digits) {
                str = character[0] + str;
              }
              return str;
            }
            function leadingNulls(value, digits) {
              return leadingSomething(value, digits, "0");
            }
            function compareByDay(date1, date2) {
              function sgn(value) {
                return value < 0 ? -1 : value > 0 ? 1 : 0;
              }
              var compare;
              if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                  compare = sgn(date1.getDate() - date2.getDate());
                }
              }
              return compare;
            }
            function getFirstWeekStartDate(janFourth) {
              switch (janFourth.getDay()) {
                case 0:
                  return new Date(janFourth.getFullYear() - 1, 11, 29);
                case 1:
                  return janFourth;
                case 2:
                  return new Date(janFourth.getFullYear(), 0, 3);
                case 3:
                  return new Date(janFourth.getFullYear(), 0, 2);
                case 4:
                  return new Date(janFourth.getFullYear(), 0, 1);
                case 5:
                  return new Date(janFourth.getFullYear() - 1, 11, 31);
                case 6:
                  return new Date(janFourth.getFullYear() - 1, 11, 30);
              }
            }
            function getWeekBasedYear(date2) {
              var thisDate = addDays(new Date(date2.tm_year + 1900, 0, 1), date2.tm_yday);
              var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
              var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
              var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
              var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
              if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                  return thisDate.getFullYear() + 1;
                }
                return thisDate.getFullYear();
              }
              return thisDate.getFullYear() - 1;
            }
            var EXPANSION_RULES_2 = {
              "%a": (date2) => WEEKDAYS[date2.tm_wday].substring(0, 3),
              "%A": (date2) => WEEKDAYS[date2.tm_wday],
              "%b": (date2) => MONTHS[date2.tm_mon].substring(0, 3),
              "%B": (date2) => MONTHS[date2.tm_mon],
              "%C": (date2) => {
                var year = date2.tm_year + 1900;
                return leadingNulls(year / 100 | 0, 2);
              },
              "%d": (date2) => leadingNulls(date2.tm_mday, 2),
              "%e": (date2) => leadingSomething(date2.tm_mday, 2, " "),
              "%g": (date2) => getWeekBasedYear(date2).toString().substring(2),
              "%G": getWeekBasedYear,
              "%H": (date2) => leadingNulls(date2.tm_hour, 2),
              "%I": (date2) => {
                var twelveHour = date2.tm_hour;
                if (twelveHour == 0)
                  twelveHour = 12;
                else if (twelveHour > 12)
                  twelveHour -= 12;
                return leadingNulls(twelveHour, 2);
              },
              "%j": (date2) => leadingNulls(date2.tm_mday + arraySum(isLeapYear(date2.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date2.tm_mon - 1), 3),
              "%m": (date2) => leadingNulls(date2.tm_mon + 1, 2),
              "%M": (date2) => leadingNulls(date2.tm_min, 2),
              "%n": () => "\n",
              "%p": (date2) => {
                if (date2.tm_hour >= 0 && date2.tm_hour < 12) {
                  return "AM";
                }
                return "PM";
              },
              "%S": (date2) => leadingNulls(date2.tm_sec, 2),
              "%t": () => "	",
              "%u": (date2) => date2.tm_wday || 7,
              "%U": (date2) => {
                var days = date2.tm_yday + 7 - date2.tm_wday;
                return leadingNulls(Math.floor(days / 7), 2);
              },
              "%V": (date2) => {
                var val = Math.floor((date2.tm_yday + 7 - (date2.tm_wday + 6) % 7) / 7);
                if ((date2.tm_wday + 371 - date2.tm_yday - 2) % 7 <= 2) {
                  val++;
                }
                if (!val) {
                  val = 52;
                  var dec31 = (date2.tm_wday + 7 - date2.tm_yday - 1) % 7;
                  if (dec31 == 4 || dec31 == 5 && isLeapYear(date2.tm_year % 400 - 1)) {
                    val++;
                  }
                } else if (val == 53) {
                  var jan1 = (date2.tm_wday + 371 - date2.tm_yday) % 7;
                  if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date2.tm_year)))
                    val = 1;
                }
                return leadingNulls(val, 2);
              },
              "%w": (date2) => date2.tm_wday,
              "%W": (date2) => {
                var days = date2.tm_yday + 7 - (date2.tm_wday + 6) % 7;
                return leadingNulls(Math.floor(days / 7), 2);
              },
              "%y": (date2) => (date2.tm_year + 1900).toString().substring(2),
              "%Y": (date2) => date2.tm_year + 1900,
              "%z": (date2) => {
                var off = date2.tm_gmtoff;
                var ahead = off >= 0;
                off = Math.abs(off) / 60;
                off = off / 60 * 100 + off % 60;
                return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
              },
              "%Z": (date2) => date2.tm_zone,
              "%%": () => "%"
            };
            pattern = pattern.replace(/%%/g, "\0\0");
            for (var rule in EXPANSION_RULES_2) {
              if (pattern.includes(rule)) {
                pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
              }
            }
            pattern = pattern.replace(/\0\0/g, "%");
            var bytes = intArrayFromString(pattern, false);
            if (bytes.length > maxsize) {
              return 0;
            }
            writeArrayToMemory(bytes, s);
            return bytes.length - 1;
          }
          function _strftime_l(s, maxsize, format, tm, loc) {
            s >>>= 0;
            maxsize >>>= 0;
            format >>>= 0;
            tm >>>= 0;
            loc >>>= 0;
            return _strftime(s, maxsize, format, tm);
          }
          var getCFunc = (ident) => {
            var func = Module2["_" + ident];
            return func;
          };
          var stringToUTF8OnStack = (str) => {
            var size = lengthBytesUTF8(str) + 1;
            var ret = stackAlloc(size);
            stringToUTF8(str, ret, size);
            return ret;
          };
          var ccall = (ident, returnType, argTypes, args, opts) => {
            var toC = {
              "string": (str) => {
                var ret2 = 0;
                if (str !== null && str !== void 0 && str !== 0) {
                  ret2 = stringToUTF8OnStack(str);
                }
                return ret2;
              },
              "array": (arr) => {
                var ret2 = stackAlloc(arr.length);
                writeArrayToMemory(arr, ret2);
                return ret2;
              }
            };
            function convertReturnValue(ret2) {
              if (returnType === "string") {
                return UTF8ToString(ret2);
              }
              if (returnType === "boolean")
                return Boolean(ret2);
              return ret2;
            }
            var func = getCFunc(ident);
            var cArgs = [];
            var stack = 0;
            if (args) {
              for (var i = 0; i < args.length; i++) {
                var converter = toC[argTypes[i]];
                if (converter) {
                  if (stack === 0)
                    stack = stackSave();
                  cArgs[i] = converter(args[i]);
                } else {
                  cArgs[i] = args[i];
                }
              }
            }
            var ret = func(...cArgs);
            function onDone(ret2) {
              if (stack !== 0)
                stackRestore(stack);
              return convertReturnValue(ret2);
            }
            ret = onDone(ret);
            return ret;
          };
          var uleb128Encode = (n, target) => {
            if (n < 128) {
              target.push(n);
            } else {
              target.push(n % 128 | 128, n >> 7);
            }
          };
          var generateFuncType = (sig, target) => {
            var sigRet = sig.slice(0, 1);
            var sigParam = sig.slice(1);
            var typeCodes = {
              "i": 127,
              "p": 127,
              "j": 126,
              "f": 125,
              "d": 124,
              "e": 111
            };
            target.push(96);
            uleb128Encode(sigParam.length, target);
            for (var i = 0; i < sigParam.length; ++i) {
              target.push(typeCodes[sigParam[i]]);
            }
            if (sigRet == "v") {
              target.push(0);
            } else {
              target.push(1, typeCodes[sigRet]);
            }
          };
          var setTempRet0 = (val) => __emscripten_tempret_set(val);
          var createDyncallWrapper = (sig) => {
            var sections = [];
            var prelude = [0, 97, 115, 109, 1, 0, 0, 0];
            sections.push(prelude);
            var wrappersig = [sig[0].replace("j", "i"), "i", sig.slice(1).replace(/j/g, "ii")].join("");
            var typeSectionBody = [3];
            generateFuncType(wrappersig, typeSectionBody);
            generateFuncType(sig, typeSectionBody);
            generateFuncType("vi", typeSectionBody);
            var typeSection = [1];
            uleb128Encode(typeSectionBody.length, typeSection);
            typeSection.push(...typeSectionBody);
            sections.push(typeSection);
            var importSection = [2, 15, 2, 1, 101, 1, 116, 1, 112, 0, 0, 1, 101, 1, 114, 0, 2];
            sections.push(importSection);
            var functionSection = [3, 2, 1, 0];
            sections.push(functionSection);
            var exportSection = [7, 5, 1, 1, 102, 0, 1];
            sections.push(exportSection);
            var convert_code = [];
            if (sig[0] === "j") {
              convert_code = [1, 1, 126];
            } else {
              convert_code.push(0);
            }
            function localGet(j2) {
              convert_code.push(32);
              uleb128Encode(j2, convert_code);
            }
            var j = 1;
            for (var i = 1; i < sig.length; i++) {
              if (sig[i] == "j") {
                localGet(j + 1);
                convert_code.push(173, 66, 32, 134);
                localGet(j);
                convert_code.push(172, 132);
                j += 2;
              } else {
                localGet(j);
                j++;
              }
            }
            convert_code.push(32, 0, 17, 1, 0);
            if (sig[0] === "j") {
              convert_code.push(34);
              uleb128Encode(j, convert_code);
              convert_code.push(66, 32, 136, 167, 16, 0);
              localGet(j);
              convert_code.push(167);
            }
            convert_code.push(11);
            var codeBody = [1];
            uleb128Encode(convert_code.length, codeBody);
            codeBody.push(...convert_code);
            var codeSection = [10];
            uleb128Encode(codeBody.length, codeSection);
            codeSection.push(...codeBody);
            sections.push(codeSection);
            var bytes = new Uint8Array([].concat.apply([], sections));
            var module2 = new WebAssembly.Module(bytes);
            var instance = new WebAssembly.Instance(module2, {
              "e": {
                "t": wasmTable,
                "r": setTempRet0
              }
            });
            var wrappedFunc = instance.exports["f"];
            return wrappedFunc;
          };
          var getTempRet0 = (val) => __emscripten_tempret_get();
          PThread.init();
          var proxiedFunctionTable = [_proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall_bind, ___syscall_connect, ___syscall_faccessat, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_ftruncate64, ___syscall_getcwd, ___syscall_getdents64, ___syscall_getpeername, ___syscall_getsockname, ___syscall_getsockopt, ___syscall_ioctl, ___syscall_lstat64, ___syscall_mkdirat, ___syscall_newfstatat, ___syscall_openat, ___syscall_poll, ___syscall_recvfrom, ___syscall_renameat, ___syscall_rmdir, ___syscall_sendto, ___syscall_socket, ___syscall_stat64, ___syscall_statfs64, ___syscall_unlinkat, _environ_get, _environ_sizes_get, _fd_close, _fd_fdstat_get, _fd_pread, _fd_pwrite, _fd_read, _fd_seek, _fd_sync, _fd_write, _getaddrinfo];
          var wasmImports = {
            S: ___emscripten_init_main_thread_js,
            u: ___emscripten_thread_cleanup,
            sa: ___pthread_create_js,
            ra: ___syscall_bind,
            pa: ___syscall_connect,
            ga: ___syscall_faccessat,
            d: ___syscall_fcntl64,
            fa: ___syscall_fstat64,
            A: ___syscall_ftruncate64,
            ha: ___syscall_getcwd,
            aa: ___syscall_getdents64,
            ka: ___syscall_getpeername,
            ja: ___syscall_getsockname,
            na: ___syscall_getsockopt,
            j: ___syscall_ioctl,
            ca: ___syscall_lstat64,
            ba: ___syscall_mkdirat,
            da: ___syscall_newfstatat,
            v: ___syscall_openat,
            oa: ___syscall_poll,
            la: ___syscall_recvfrom,
            Z: ___syscall_renameat,
            n: ___syscall_rmdir,
            ma: ___syscall_sendto,
            s: ___syscall_socket,
            ea: ___syscall_stat64,
            ia: ___syscall_statfs64,
            o: ___syscall_unlinkat,
            za: __emscripten_get_now_is_monotonic,
            qa: __emscripten_notify_mailbox_postmessage,
            _: __emscripten_receive_on_main_thread_js,
            I: __emscripten_thread_mailbox_await,
            y: __emscripten_thread_set_strongref,
            G: __emval_call_method,
            H: __emval_decref,
            J: __emval_get_global,
            F: __emval_get_method_caller,
            E: __emval_run_destructors,
            z: __localtime_js,
            X: __tzset_js,
            b: _abort,
            P: _duckdb_web_fs_directory_create,
            Q: _duckdb_web_fs_directory_exists,
            N: _duckdb_web_fs_directory_list_files,
            O: _duckdb_web_fs_directory_remove,
            m: _duckdb_web_fs_file_close,
            U: _duckdb_web_fs_file_drop_file,
            L: _duckdb_web_fs_file_exists,
            M: _duckdb_web_fs_file_move,
            T: _duckdb_web_fs_file_open,
            h: _duckdb_web_fs_file_read,
            R: _duckdb_web_fs_file_truncate,
            i: _duckdb_web_fs_file_write,
            V: _duckdb_web_fs_get_default_data_protocol,
            K: _duckdb_web_fs_glob,
            l: _duckdb_web_test_platform_feature,
            W: _duckdb_web_udf_scalar_call,
            g: _emscripten_asm_const_ptr,
            p: _emscripten_check_blocking_allowed,
            Aa: _emscripten_date_now,
            x: _emscripten_exit_with_live_runtime,
            ta: _emscripten_get_heap_max,
            e: _emscripten_get_now,
            ua: _emscripten_num_logical_cores,
            ya: _emscripten_resize_heap,
            va: _environ_get,
            wa: _environ_sizes_get,
            t: _exit,
            f: _fd_close,
            xa: _fd_fdstat_get,
            C: _fd_pread,
            B: _fd_pwrite,
            w: _fd_read,
            D: _fd_seek,
            $: _fd_sync,
            k: _fd_write,
            r: _getaddrinfo,
            Y: _getentropy,
            q: _getnameinfo,
            a: wasmMemory || Module2["wasmMemory"],
            c: _strftime_l
          };
          var wasmExports = createWasm();
          var _main = Module2["_main"] = (a0, a1) => (_main = Module2["_main"] = wasmExports["Ca"])(a0, a1);
          var _duckdb_web_fs_glob_add_path = Module2["_duckdb_web_fs_glob_add_path"] = (a0) => (_duckdb_web_fs_glob_add_path = Module2["_duckdb_web_fs_glob_add_path"] = wasmExports["Ea"])(a0);
          var _duckdb_web_clear_response = Module2["_duckdb_web_clear_response"] = () => (_duckdb_web_clear_response = Module2["_duckdb_web_clear_response"] = wasmExports["Fa"])();
          var _duckdb_web_fail_with = Module2["_duckdb_web_fail_with"] = (a0) => (_duckdb_web_fail_with = Module2["_duckdb_web_fail_with"] = wasmExports["Ga"])(a0);
          var _duckdb_web_reset = Module2["_duckdb_web_reset"] = (a0) => (_duckdb_web_reset = Module2["_duckdb_web_reset"] = wasmExports["Ha"])(a0);
          var _duckdb_web_connect = Module2["_duckdb_web_connect"] = () => (_duckdb_web_connect = Module2["_duckdb_web_connect"] = wasmExports["Ia"])();
          var _duckdb_web_disconnect = Module2["_duckdb_web_disconnect"] = (a0) => (_duckdb_web_disconnect = Module2["_duckdb_web_disconnect"] = wasmExports["Ja"])(a0);
          var _duckdb_web_flush_files = Module2["_duckdb_web_flush_files"] = () => (_duckdb_web_flush_files = Module2["_duckdb_web_flush_files"] = wasmExports["Ka"])();
          var _duckdb_web_flush_file = Module2["_duckdb_web_flush_file"] = (a0) => (_duckdb_web_flush_file = Module2["_duckdb_web_flush_file"] = wasmExports["La"])(a0);
          var _duckdb_web_open = Module2["_duckdb_web_open"] = (a0, a1) => (_duckdb_web_open = Module2["_duckdb_web_open"] = wasmExports["Ma"])(a0, a1);
          var _duckdb_web_get_global_file_info = Module2["_duckdb_web_get_global_file_info"] = (a0, a1) => (_duckdb_web_get_global_file_info = Module2["_duckdb_web_get_global_file_info"] = wasmExports["Na"])(a0, a1);
          var _duckdb_web_collect_file_stats = Module2["_duckdb_web_collect_file_stats"] = (a0, a1, a2) => (_duckdb_web_collect_file_stats = Module2["_duckdb_web_collect_file_stats"] = wasmExports["Oa"])(a0, a1, a2);
          var _duckdb_web_export_file_stats = Module2["_duckdb_web_export_file_stats"] = (a0, a1) => (_duckdb_web_export_file_stats = Module2["_duckdb_web_export_file_stats"] = wasmExports["Pa"])(a0, a1);
          var _duckdb_web_fs_drop_file = Module2["_duckdb_web_fs_drop_file"] = (a0, a1) => (_duckdb_web_fs_drop_file = Module2["_duckdb_web_fs_drop_file"] = wasmExports["Qa"])(a0, a1);
          var _duckdb_web_fs_drop_files = Module2["_duckdb_web_fs_drop_files"] = (a0, a1, a2) => (_duckdb_web_fs_drop_files = Module2["_duckdb_web_fs_drop_files"] = wasmExports["Ra"])(a0, a1, a2);
          var _duckdb_web_fs_glob_file_infos = Module2["_duckdb_web_fs_glob_file_infos"] = (a0, a1) => (_duckdb_web_fs_glob_file_infos = Module2["_duckdb_web_fs_glob_file_infos"] = wasmExports["Sa"])(a0, a1);
          var _duckdb_web_fs_get_file_info_by_id = Module2["_duckdb_web_fs_get_file_info_by_id"] = (a0, a1, a2) => (_duckdb_web_fs_get_file_info_by_id = Module2["_duckdb_web_fs_get_file_info_by_id"] = wasmExports["Ta"])(a0, a1, a2);
          var _duckdb_web_fs_get_file_info_by_name = Module2["_duckdb_web_fs_get_file_info_by_name"] = (a0, a1, a2) => (_duckdb_web_fs_get_file_info_by_name = Module2["_duckdb_web_fs_get_file_info_by_name"] = wasmExports["Ua"])(a0, a1, a2);
          var _duckdb_web_fs_register_file_url = Module2["_duckdb_web_fs_register_file_url"] = (a0, a1, a2, a3, a4) => (_duckdb_web_fs_register_file_url = Module2["_duckdb_web_fs_register_file_url"] = wasmExports["Va"])(a0, a1, a2, a3, a4);
          var _duckdb_web_fs_register_file_buffer = Module2["_duckdb_web_fs_register_file_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_fs_register_file_buffer = Module2["_duckdb_web_fs_register_file_buffer"] = wasmExports["Wa"])(a0, a1, a2, a3);
          var _duckdb_web_copy_file_to_buffer = Module2["_duckdb_web_copy_file_to_buffer"] = (a0, a1) => (_duckdb_web_copy_file_to_buffer = Module2["_duckdb_web_copy_file_to_buffer"] = wasmExports["Xa"])(a0, a1);
          var _duckdb_web_copy_file_to_path = Module2["_duckdb_web_copy_file_to_path"] = (a0, a1, a2) => (_duckdb_web_copy_file_to_path = Module2["_duckdb_web_copy_file_to_path"] = wasmExports["Ya"])(a0, a1, a2);
          var _duckdb_web_get_version = Module2["_duckdb_web_get_version"] = (a0) => (_duckdb_web_get_version = Module2["_duckdb_web_get_version"] = wasmExports["Za"])(a0);
          var _duckdb_web_get_feature_flags = Module2["_duckdb_web_get_feature_flags"] = () => (_duckdb_web_get_feature_flags = Module2["_duckdb_web_get_feature_flags"] = wasmExports["_a"])();
          var _duckdb_web_tokenize = Module2["_duckdb_web_tokenize"] = (a0, a1) => (_duckdb_web_tokenize = Module2["_duckdb_web_tokenize"] = wasmExports["$a"])(a0, a1);
          var _duckdb_web_tokenize_buffer = Module2["_duckdb_web_tokenize_buffer"] = (a0, a1, a2) => (_duckdb_web_tokenize_buffer = Module2["_duckdb_web_tokenize_buffer"] = wasmExports["ab"])(a0, a1, a2);
          var _duckdb_web_udf_scalar_create = Module2["_duckdb_web_udf_scalar_create"] = (a0, a1, a2) => (_duckdb_web_udf_scalar_create = Module2["_duckdb_web_udf_scalar_create"] = wasmExports["bb"])(a0, a1, a2);
          var _duckdb_web_prepared_create = Module2["_duckdb_web_prepared_create"] = (a0, a1, a2) => (_duckdb_web_prepared_create = Module2["_duckdb_web_prepared_create"] = wasmExports["cb"])(a0, a1, a2);
          var _duckdb_web_prepared_create_buffer = Module2["_duckdb_web_prepared_create_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_create_buffer = Module2["_duckdb_web_prepared_create_buffer"] = wasmExports["db"])(a0, a1, a2, a3);
          var _duckdb_web_prepared_close = Module2["_duckdb_web_prepared_close"] = (a0, a1, a2) => (_duckdb_web_prepared_close = Module2["_duckdb_web_prepared_close"] = wasmExports["eb"])(a0, a1, a2);
          var _duckdb_web_prepared_run = Module2["_duckdb_web_prepared_run"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_run = Module2["_duckdb_web_prepared_run"] = wasmExports["fb"])(a0, a1, a2, a3);
          var _duckdb_web_prepared_send = Module2["_duckdb_web_prepared_send"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_send = Module2["_duckdb_web_prepared_send"] = wasmExports["gb"])(a0, a1, a2, a3);
          var _duckdb_web_query_run = Module2["_duckdb_web_query_run"] = (a0, a1, a2) => (_duckdb_web_query_run = Module2["_duckdb_web_query_run"] = wasmExports["hb"])(a0, a1, a2);
          var _duckdb_web_query_run_buffer = Module2["_duckdb_web_query_run_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_query_run_buffer = Module2["_duckdb_web_query_run_buffer"] = wasmExports["ib"])(a0, a1, a2, a3);
          var _duckdb_web_pending_query_start = Module2["_duckdb_web_pending_query_start"] = (a0, a1, a2, a3) => (_duckdb_web_pending_query_start = Module2["_duckdb_web_pending_query_start"] = wasmExports["jb"])(a0, a1, a2, a3);
          var _duckdb_web_pending_query_start_buffer = Module2["_duckdb_web_pending_query_start_buffer"] = (a0, a1, a2, a3, a4) => (_duckdb_web_pending_query_start_buffer = Module2["_duckdb_web_pending_query_start_buffer"] = wasmExports["kb"])(a0, a1, a2, a3, a4);
          var _duckdb_web_pending_query_poll = Module2["_duckdb_web_pending_query_poll"] = (a0, a1, a2) => (_duckdb_web_pending_query_poll = Module2["_duckdb_web_pending_query_poll"] = wasmExports["lb"])(a0, a1, a2);
          var _duckdb_web_pending_query_cancel = Module2["_duckdb_web_pending_query_cancel"] = (a0, a1) => (_duckdb_web_pending_query_cancel = Module2["_duckdb_web_pending_query_cancel"] = wasmExports["mb"])(a0, a1);
          var _duckdb_web_query_fetch_results = Module2["_duckdb_web_query_fetch_results"] = (a0, a1) => (_duckdb_web_query_fetch_results = Module2["_duckdb_web_query_fetch_results"] = wasmExports["nb"])(a0, a1);
          var _duckdb_web_get_tablenames = Module2["_duckdb_web_get_tablenames"] = (a0, a1, a2) => (_duckdb_web_get_tablenames = Module2["_duckdb_web_get_tablenames"] = wasmExports["ob"])(a0, a1, a2);
          var _duckdb_web_get_tablenames_buffer = Module2["_duckdb_web_get_tablenames_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_get_tablenames_buffer = Module2["_duckdb_web_get_tablenames_buffer"] = wasmExports["pb"])(a0, a1, a2, a3);
          var _duckdb_web_insert_arrow_from_ipc_stream = Module2["_duckdb_web_insert_arrow_from_ipc_stream"] = (a0, a1, a2, a3, a4) => (_duckdb_web_insert_arrow_from_ipc_stream = Module2["_duckdb_web_insert_arrow_from_ipc_stream"] = wasmExports["qb"])(a0, a1, a2, a3, a4);
          var _duckdb_web_insert_csv_from_path = Module2["_duckdb_web_insert_csv_from_path"] = (a0, a1, a2, a3) => (_duckdb_web_insert_csv_from_path = Module2["_duckdb_web_insert_csv_from_path"] = wasmExports["rb"])(a0, a1, a2, a3);
          var _duckdb_web_insert_json_from_path = Module2["_duckdb_web_insert_json_from_path"] = (a0, a1, a2, a3) => (_duckdb_web_insert_json_from_path = Module2["_duckdb_web_insert_json_from_path"] = wasmExports["sb"])(a0, a1, a2, a3);
          var __emscripten_tls_init = Module2["__emscripten_tls_init"] = () => (__emscripten_tls_init = Module2["__emscripten_tls_init"] = wasmExports["tb"])();
          var _pthread_self = Module2["_pthread_self"] = () => (_pthread_self = Module2["_pthread_self"] = wasmExports["ub"])();
          var __emscripten_thread_init = Module2["__emscripten_thread_init"] = (a0, a1, a2, a3, a4, a5) => (__emscripten_thread_init = Module2["__emscripten_thread_init"] = wasmExports["vb"])(a0, a1, a2, a3, a4, a5);
          var __emscripten_thread_crashed = Module2["__emscripten_thread_crashed"] = () => (__emscripten_thread_crashed = Module2["__emscripten_thread_crashed"] = wasmExports["wb"])();
          var _emscripten_main_runtime_thread_id = () => (_emscripten_main_runtime_thread_id = wasmExports["emscripten_main_runtime_thread_id"])();
          var _emscripten_main_thread_process_queued_calls = () => (_emscripten_main_thread_process_queued_calls = wasmExports["emscripten_main_thread_process_queued_calls"])();
          var __emscripten_run_on_main_thread_js = (a0, a1, a2, a3, a4) => (__emscripten_run_on_main_thread_js = wasmExports["Ab"])(a0, a1, a2, a3, a4);
          var __emscripten_thread_free_data = (a0) => (__emscripten_thread_free_data = wasmExports["Bb"])(a0);
          var __emscripten_thread_exit = Module2["__emscripten_thread_exit"] = (a0) => (__emscripten_thread_exit = Module2["__emscripten_thread_exit"] = wasmExports["Cb"])(a0);
          var __emscripten_check_mailbox = () => (__emscripten_check_mailbox = wasmExports["Db"])();
          var _malloc = Module2["_malloc"] = (a0) => (_malloc = Module2["_malloc"] = wasmExports["Eb"])(a0);
          var _free = Module2["_free"] = (a0) => (_free = Module2["_free"] = wasmExports["Fb"])(a0);
          var _calloc = Module2["_calloc"] = (a0, a1) => (_calloc = Module2["_calloc"] = wasmExports["Gb"])(a0, a1);
          var __emscripten_tempret_set = (a0) => (__emscripten_tempret_set = wasmExports["Ib"])(a0);
          var __emscripten_tempret_get = () => (__emscripten_tempret_get = wasmExports["Jb"])();
          var _emscripten_stack_set_limits = (a0, a1) => (_emscripten_stack_set_limits = wasmExports["Kb"])(a0, a1);
          var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["Lb"])(a0);
          var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["Mb"])(a0);
          var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["Nb"])();
          function applySignatureConversions(wasmExports2) {
            wasmExports2 = Object.assign({}, wasmExports2);
            var makeWrapper_p = (f) => () => f() >>> 0;
            var makeWrapper_pp = (f) => (a0) => f(a0) >>> 0;
            wasmExports2["ub"] = makeWrapper_p(wasmExports2["ub"]);
            wasmExports2["emscripten_main_runtime_thread_id"] = makeWrapper_p(wasmExports2["emscripten_main_runtime_thread_id"]);
            wasmExports2["Eb"] = makeWrapper_pp(wasmExports2["Eb"]);
            wasmExports2["Mb"] = makeWrapper_pp(wasmExports2["Mb"]);
            wasmExports2["Nb"] = makeWrapper_p(wasmExports2["Nb"]);
            return wasmExports2;
          }
          Module2["wasmMemory"] = wasmMemory;
          Module2["stackSave"] = stackSave;
          Module2["stackRestore"] = stackRestore;
          Module2["stackAlloc"] = stackAlloc;
          Module2["getTempRet0"] = getTempRet0;
          Module2["setTempRet0"] = setTempRet0;
          Module2["keepRuntimeAlive"] = keepRuntimeAlive;
          Module2["ccall"] = ccall;
          Module2["ExitStatus"] = ExitStatus;
          Module2["createDyncallWrapper"] = createDyncallWrapper;
          Module2["PThread"] = PThread;
          var calledRun;
          dependenciesFulfilled = function runCaller() {
            if (!calledRun)
              run();
            if (!calledRun)
              dependenciesFulfilled = runCaller;
          };
          function callMain() {
            var entryFunction = _main;
            var argc = 0;
            var argv = 0;
            try {
              var ret = entryFunction(argc, argv);
              exitJS(ret, true);
              return ret;
            } catch (e) {
              return handleException(e);
            }
          }
          function run() {
            if (runDependencies > 0) {
              return;
            }
            if (ENVIRONMENT_IS_PTHREAD) {
              readyPromiseResolve(Module2);
              initRuntime();
              startWorker(Module2);
              return;
            }
            preRun();
            if (runDependencies > 0) {
              return;
            }
            function doRun() {
              if (calledRun)
                return;
              calledRun = true;
              Module2["calledRun"] = true;
              if (ABORT)
                return;
              initRuntime();
              preMain();
              readyPromiseResolve(Module2);
              if (Module2["onRuntimeInitialized"])
                Module2["onRuntimeInitialized"]();
              if (shouldRunNow)
                callMain();
              postRun();
            }
            if (Module2["setStatus"]) {
              Module2["setStatus"]("Running...");
              setTimeout(function() {
                setTimeout(function() {
                  Module2["setStatus"]("");
                }, 1);
                doRun();
              }, 1);
            } else {
              doRun();
            }
          }
          if (Module2["preInit"]) {
            if (typeof Module2["preInit"] == "function")
              Module2["preInit"] = [Module2["preInit"]];
            while (Module2["preInit"].length > 0) {
              Module2["preInit"].pop()();
            }
          }
          var shouldRunNow = true;
          if (Module2["noInitialRun"])
            shouldRunNow = false;
          run();
          return readyPromise;
        };
      })();
      if (typeof exports === "object" && typeof module === "object")
        module.exports = DuckDB3;
      else if (typeof define === "function" && define["amd"])
        define([], () => DuckDB3);
    }
  });

  // (disabled):crypto
  var require_crypto = __commonJS({
    "(disabled):crypto"() {
    }
  });

  // (disabled):../../node_modules/buffer/index.js
  var require_buffer = __commonJS({
    "(disabled):../../node_modules/buffer/index.js"() {
    }
  });

  // ../../node_modules/js-sha256/src/sha256.js
  var require_sha256 = __commonJS({
    "../../node_modules/js-sha256/src/sha256.js"(exports, module) {
      (function() {
        "use strict";
        var ERROR = "input is invalid type";
        var WINDOW = typeof window === "object";
        var root = WINDOW ? window : {};
        if (root.JS_SHA256_NO_WINDOW) {
          WINDOW = false;
        }
        var WEB_WORKER = !WINDOW && typeof self === "object";
        var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === "object" && process.versions && process.versions.node && process.type != "renderer";
        if (NODE_JS) {
          root = global;
        } else if (WEB_WORKER) {
          root = self;
        }
        var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && typeof module === "object" && module.exports;
        var AMD = typeof define === "function" && define.amd;
        var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== "undefined";
        var HEX_CHARS = "0123456789abcdef".split("");
        var EXTRA = [-2147483648, 8388608, 32768, 128];
        var SHIFT = [24, 16, 8, 0];
        var K = [
          1116352408,
          1899447441,
          3049323471,
          3921009573,
          961987163,
          1508970993,
          2453635748,
          2870763221,
          3624381080,
          310598401,
          607225278,
          1426881987,
          1925078388,
          2162078206,
          2614888103,
          3248222580,
          3835390401,
          4022224774,
          264347078,
          604807628,
          770255983,
          1249150122,
          1555081692,
          1996064986,
          2554220882,
          2821834349,
          2952996808,
          3210313671,
          3336571891,
          3584528711,
          113926993,
          338241895,
          666307205,
          773529912,
          1294757372,
          1396182291,
          1695183700,
          1986661051,
          2177026350,
          2456956037,
          2730485921,
          2820302411,
          3259730800,
          3345764771,
          3516065817,
          3600352804,
          4094571909,
          275423344,
          430227734,
          506948616,
          659060556,
          883997877,
          958139571,
          1322822218,
          1537002063,
          1747873779,
          1955562222,
          2024104815,
          2227730452,
          2361852424,
          2428436474,
          2756734187,
          3204031479,
          3329325298
        ];
        var OUTPUT_TYPES = ["hex", "array", "digest", "arrayBuffer"];
        var blocks = [];
        if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
          Array.isArray = function(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
          };
        }
        if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
          ArrayBuffer.isView = function(obj) {
            return typeof obj === "object" && obj.buffer && obj.buffer.constructor === ArrayBuffer;
          };
        }
        var createOutputMethod = function(outputType, is224) {
          return function(message) {
            return new Sha256(is224, true).update(message)[outputType]();
          };
        };
        var createMethod = function(is224) {
          var method = createOutputMethod("hex", is224);
          if (NODE_JS) {
            method = nodeWrap(method, is224);
          }
          method.create = function() {
            return new Sha256(is224);
          };
          method.update = function(message) {
            return method.create().update(message);
          };
          for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createOutputMethod(type, is224);
          }
          return method;
        };
        var nodeWrap = function(method, is224) {
          var crypto2 = require_crypto();
          var Buffer2 = require_buffer().Buffer;
          var algorithm = is224 ? "sha224" : "sha256";
          var bufferFrom;
          if (Buffer2.from && !root.JS_SHA256_NO_BUFFER_FROM) {
            bufferFrom = Buffer2.from;
          } else {
            bufferFrom = function(message) {
              return new Buffer2(message);
            };
          }
          var nodeMethod = function(message) {
            if (typeof message === "string") {
              return crypto2.createHash(algorithm).update(message, "utf8").digest("hex");
            } else {
              if (message === null || message === void 0) {
                throw new Error(ERROR);
              } else if (message.constructor === ArrayBuffer) {
                message = new Uint8Array(message);
              }
            }
            if (Array.isArray(message) || ArrayBuffer.isView(message) || message.constructor === Buffer2) {
              return crypto2.createHash(algorithm).update(bufferFrom(message)).digest("hex");
            } else {
              return method(message);
            }
          };
          return nodeMethod;
        };
        var createHmacOutputMethod = function(outputType, is224) {
          return function(key, message) {
            return new HmacSha256(key, is224, true).update(message)[outputType]();
          };
        };
        var createHmacMethod = function(is224) {
          var method = createHmacOutputMethod("hex", is224);
          method.create = function(key) {
            return new HmacSha256(key, is224);
          };
          method.update = function(key, message) {
            return method.create(key).update(message);
          };
          for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createHmacOutputMethod(type, is224);
          }
          return method;
        };
        function Sha256(is224, sharedMemory) {
          if (sharedMemory) {
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.blocks = blocks;
          } else {
            this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
          if (is224) {
            this.h0 = 3238371032;
            this.h1 = 914150663;
            this.h2 = 812702999;
            this.h3 = 4144912697;
            this.h4 = 4290775857;
            this.h5 = 1750603025;
            this.h6 = 1694076839;
            this.h7 = 3204075428;
          } else {
            this.h0 = 1779033703;
            this.h1 = 3144134277;
            this.h2 = 1013904242;
            this.h3 = 2773480762;
            this.h4 = 1359893119;
            this.h5 = 2600822924;
            this.h6 = 528734635;
            this.h7 = 1541459225;
          }
          this.block = this.start = this.bytes = this.hBytes = 0;
          this.finalized = this.hashed = false;
          this.first = true;
          this.is224 = is224;
        }
        Sha256.prototype.update = function(message) {
          if (this.finalized) {
            return;
          }
          var notString, type = typeof message;
          if (type !== "string") {
            if (type === "object") {
              if (message === null) {
                throw new Error(ERROR);
              } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
                message = new Uint8Array(message);
              } else if (!Array.isArray(message)) {
                if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
                  throw new Error(ERROR);
                }
              }
            } else {
              throw new Error(ERROR);
            }
            notString = true;
          }
          var code, index = 0, i, length = message.length, blocks2 = this.blocks;
          while (index < length) {
            if (this.hashed) {
              this.hashed = false;
              blocks2[0] = this.block;
              this.block = blocks2[16] = blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = 0;
            }
            if (notString) {
              for (i = this.start; index < length && i < 64; ++index) {
                blocks2[i >>> 2] |= message[index] << SHIFT[i++ & 3];
              }
            } else {
              for (i = this.start; index < length && i < 64; ++index) {
                code = message.charCodeAt(index);
                if (code < 128) {
                  blocks2[i >>> 2] |= code << SHIFT[i++ & 3];
                } else if (code < 2048) {
                  blocks2[i >>> 2] |= (192 | code >>> 6) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                } else if (code < 55296 || code >= 57344) {
                  blocks2[i >>> 2] |= (224 | code >>> 12) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 6 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                } else {
                  code = 65536 + ((code & 1023) << 10 | message.charCodeAt(++index) & 1023);
                  blocks2[i >>> 2] |= (240 | code >>> 18) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 12 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code >>> 6 & 63) << SHIFT[i++ & 3];
                  blocks2[i >>> 2] |= (128 | code & 63) << SHIFT[i++ & 3];
                }
              }
            }
            this.lastByteIndex = i;
            this.bytes += i - this.start;
            if (i >= 64) {
              this.block = blocks2[16];
              this.start = i - 64;
              this.hash();
              this.hashed = true;
            } else {
              this.start = i;
            }
          }
          if (this.bytes > 4294967295) {
            this.hBytes += this.bytes / 4294967296 << 0;
            this.bytes = this.bytes % 4294967296;
          }
          return this;
        };
        Sha256.prototype.finalize = function() {
          if (this.finalized) {
            return;
          }
          this.finalized = true;
          var blocks2 = this.blocks, i = this.lastByteIndex;
          blocks2[16] = this.block;
          blocks2[i >>> 2] |= EXTRA[i & 3];
          this.block = blocks2[16];
          if (i >= 56) {
            if (!this.hashed) {
              this.hash();
            }
            blocks2[0] = this.block;
            blocks2[16] = blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = 0;
          }
          blocks2[14] = this.hBytes << 3 | this.bytes >>> 29;
          blocks2[15] = this.bytes << 3;
          this.hash();
        };
        Sha256.prototype.hash = function() {
          var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6, h = this.h7, blocks2 = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;
          for (j = 16; j < 64; ++j) {
            t1 = blocks2[j - 15];
            s0 = (t1 >>> 7 | t1 << 25) ^ (t1 >>> 18 | t1 << 14) ^ t1 >>> 3;
            t1 = blocks2[j - 2];
            s1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
            blocks2[j] = blocks2[j - 16] + s0 + blocks2[j - 7] + s1 << 0;
          }
          bc = b & c;
          for (j = 0; j < 64; j += 4) {
            if (this.first) {
              if (this.is224) {
                ab = 300032;
                t1 = blocks2[0] - 1413257819;
                h = t1 - 150054599 << 0;
                d = t1 + 24177077 << 0;
              } else {
                ab = 704751109;
                t1 = blocks2[0] - 210244248;
                h = t1 - 1521486534 << 0;
                d = t1 + 143694565 << 0;
              }
              this.first = false;
            } else {
              s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
              s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
              ab = a & b;
              maj = ab ^ a & c ^ bc;
              ch = e & f ^ ~e & g;
              t1 = h + s1 + ch + K[j] + blocks2[j];
              t2 = s0 + maj;
              h = d + t1 << 0;
              d = t1 + t2 << 0;
            }
            s0 = (d >>> 2 | d << 30) ^ (d >>> 13 | d << 19) ^ (d >>> 22 | d << 10);
            s1 = (h >>> 6 | h << 26) ^ (h >>> 11 | h << 21) ^ (h >>> 25 | h << 7);
            da = d & a;
            maj = da ^ d & b ^ ab;
            ch = h & e ^ ~h & f;
            t1 = g + s1 + ch + K[j + 1] + blocks2[j + 1];
            t2 = s0 + maj;
            g = c + t1 << 0;
            c = t1 + t2 << 0;
            s0 = (c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10);
            s1 = (g >>> 6 | g << 26) ^ (g >>> 11 | g << 21) ^ (g >>> 25 | g << 7);
            cd = c & d;
            maj = cd ^ c & a ^ da;
            ch = g & h ^ ~g & e;
            t1 = f + s1 + ch + K[j + 2] + blocks2[j + 2];
            t2 = s0 + maj;
            f = b + t1 << 0;
            b = t1 + t2 << 0;
            s0 = (b >>> 2 | b << 30) ^ (b >>> 13 | b << 19) ^ (b >>> 22 | b << 10);
            s1 = (f >>> 6 | f << 26) ^ (f >>> 11 | f << 21) ^ (f >>> 25 | f << 7);
            bc = b & c;
            maj = bc ^ b & d ^ cd;
            ch = f & g ^ ~f & h;
            t1 = e + s1 + ch + K[j + 3] + blocks2[j + 3];
            t2 = s0 + maj;
            e = a + t1 << 0;
            a = t1 + t2 << 0;
            this.chromeBugWorkAround = true;
          }
          this.h0 = this.h0 + a << 0;
          this.h1 = this.h1 + b << 0;
          this.h2 = this.h2 + c << 0;
          this.h3 = this.h3 + d << 0;
          this.h4 = this.h4 + e << 0;
          this.h5 = this.h5 + f << 0;
          this.h6 = this.h6 + g << 0;
          this.h7 = this.h7 + h << 0;
        };
        Sha256.prototype.hex = function() {
          this.finalize();
          var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5, h6 = this.h6, h7 = this.h7;
          var hex = HEX_CHARS[h0 >>> 28 & 15] + HEX_CHARS[h0 >>> 24 & 15] + HEX_CHARS[h0 >>> 20 & 15] + HEX_CHARS[h0 >>> 16 & 15] + HEX_CHARS[h0 >>> 12 & 15] + HEX_CHARS[h0 >>> 8 & 15] + HEX_CHARS[h0 >>> 4 & 15] + HEX_CHARS[h0 & 15] + HEX_CHARS[h1 >>> 28 & 15] + HEX_CHARS[h1 >>> 24 & 15] + HEX_CHARS[h1 >>> 20 & 15] + HEX_CHARS[h1 >>> 16 & 15] + HEX_CHARS[h1 >>> 12 & 15] + HEX_CHARS[h1 >>> 8 & 15] + HEX_CHARS[h1 >>> 4 & 15] + HEX_CHARS[h1 & 15] + HEX_CHARS[h2 >>> 28 & 15] + HEX_CHARS[h2 >>> 24 & 15] + HEX_CHARS[h2 >>> 20 & 15] + HEX_CHARS[h2 >>> 16 & 15] + HEX_CHARS[h2 >>> 12 & 15] + HEX_CHARS[h2 >>> 8 & 15] + HEX_CHARS[h2 >>> 4 & 15] + HEX_CHARS[h2 & 15] + HEX_CHARS[h3 >>> 28 & 15] + HEX_CHARS[h3 >>> 24 & 15] + HEX_CHARS[h3 >>> 20 & 15] + HEX_CHARS[h3 >>> 16 & 15] + HEX_CHARS[h3 >>> 12 & 15] + HEX_CHARS[h3 >>> 8 & 15] + HEX_CHARS[h3 >>> 4 & 15] + HEX_CHARS[h3 & 15] + HEX_CHARS[h4 >>> 28 & 15] + HEX_CHARS[h4 >>> 24 & 15] + HEX_CHARS[h4 >>> 20 & 15] + HEX_CHARS[h4 >>> 16 & 15] + HEX_CHARS[h4 >>> 12 & 15] + HEX_CHARS[h4 >>> 8 & 15] + HEX_CHARS[h4 >>> 4 & 15] + HEX_CHARS[h4 & 15] + HEX_CHARS[h5 >>> 28 & 15] + HEX_CHARS[h5 >>> 24 & 15] + HEX_CHARS[h5 >>> 20 & 15] + HEX_CHARS[h5 >>> 16 & 15] + HEX_CHARS[h5 >>> 12 & 15] + HEX_CHARS[h5 >>> 8 & 15] + HEX_CHARS[h5 >>> 4 & 15] + HEX_CHARS[h5 & 15] + HEX_CHARS[h6 >>> 28 & 15] + HEX_CHARS[h6 >>> 24 & 15] + HEX_CHARS[h6 >>> 20 & 15] + HEX_CHARS[h6 >>> 16 & 15] + HEX_CHARS[h6 >>> 12 & 15] + HEX_CHARS[h6 >>> 8 & 15] + HEX_CHARS[h6 >>> 4 & 15] + HEX_CHARS[h6 & 15];
          if (!this.is224) {
            hex += HEX_CHARS[h7 >>> 28 & 15] + HEX_CHARS[h7 >>> 24 & 15] + HEX_CHARS[h7 >>> 20 & 15] + HEX_CHARS[h7 >>> 16 & 15] + HEX_CHARS[h7 >>> 12 & 15] + HEX_CHARS[h7 >>> 8 & 15] + HEX_CHARS[h7 >>> 4 & 15] + HEX_CHARS[h7 & 15];
          }
          return hex;
        };
        Sha256.prototype.toString = Sha256.prototype.hex;
        Sha256.prototype.digest = function() {
          this.finalize();
          var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5, h6 = this.h6, h7 = this.h7;
          var arr = [
            h0 >>> 24 & 255,
            h0 >>> 16 & 255,
            h0 >>> 8 & 255,
            h0 & 255,
            h1 >>> 24 & 255,
            h1 >>> 16 & 255,
            h1 >>> 8 & 255,
            h1 & 255,
            h2 >>> 24 & 255,
            h2 >>> 16 & 255,
            h2 >>> 8 & 255,
            h2 & 255,
            h3 >>> 24 & 255,
            h3 >>> 16 & 255,
            h3 >>> 8 & 255,
            h3 & 255,
            h4 >>> 24 & 255,
            h4 >>> 16 & 255,
            h4 >>> 8 & 255,
            h4 & 255,
            h5 >>> 24 & 255,
            h5 >>> 16 & 255,
            h5 >>> 8 & 255,
            h5 & 255,
            h6 >>> 24 & 255,
            h6 >>> 16 & 255,
            h6 >>> 8 & 255,
            h6 & 255
          ];
          if (!this.is224) {
            arr.push(h7 >>> 24 & 255, h7 >>> 16 & 255, h7 >>> 8 & 255, h7 & 255);
          }
          return arr;
        };
        Sha256.prototype.array = Sha256.prototype.digest;
        Sha256.prototype.arrayBuffer = function() {
          this.finalize();
          var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
          var dataView = new DataView(buffer);
          dataView.setUint32(0, this.h0);
          dataView.setUint32(4, this.h1);
          dataView.setUint32(8, this.h2);
          dataView.setUint32(12, this.h3);
          dataView.setUint32(16, this.h4);
          dataView.setUint32(20, this.h5);
          dataView.setUint32(24, this.h6);
          if (!this.is224) {
            dataView.setUint32(28, this.h7);
          }
          return buffer;
        };
        function HmacSha256(key, is224, sharedMemory) {
          var i, type = typeof key;
          if (type === "string") {
            var bytes = [], length = key.length, index = 0, code;
            for (i = 0; i < length; ++i) {
              code = key.charCodeAt(i);
              if (code < 128) {
                bytes[index++] = code;
              } else if (code < 2048) {
                bytes[index++] = 192 | code >>> 6;
                bytes[index++] = 128 | code & 63;
              } else if (code < 55296 || code >= 57344) {
                bytes[index++] = 224 | code >>> 12;
                bytes[index++] = 128 | code >>> 6 & 63;
                bytes[index++] = 128 | code & 63;
              } else {
                code = 65536 + ((code & 1023) << 10 | key.charCodeAt(++i) & 1023);
                bytes[index++] = 240 | code >>> 18;
                bytes[index++] = 128 | code >>> 12 & 63;
                bytes[index++] = 128 | code >>> 6 & 63;
                bytes[index++] = 128 | code & 63;
              }
            }
            key = bytes;
          } else {
            if (type === "object") {
              if (key === null) {
                throw new Error(ERROR);
              } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
                key = new Uint8Array(key);
              } else if (!Array.isArray(key)) {
                if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
                  throw new Error(ERROR);
                }
              }
            } else {
              throw new Error(ERROR);
            }
          }
          if (key.length > 64) {
            key = new Sha256(is224, true).update(key).array();
          }
          var oKeyPad = [], iKeyPad = [];
          for (i = 0; i < 64; ++i) {
            var b = key[i] || 0;
            oKeyPad[i] = 92 ^ b;
            iKeyPad[i] = 54 ^ b;
          }
          Sha256.call(this, is224, sharedMemory);
          this.update(iKeyPad);
          this.oKeyPad = oKeyPad;
          this.inner = true;
          this.sharedMemory = sharedMemory;
        }
        HmacSha256.prototype = new Sha256();
        HmacSha256.prototype.finalize = function() {
          Sha256.prototype.finalize.call(this);
          if (this.inner) {
            this.inner = false;
            var innerHash = this.array();
            Sha256.call(this, this.is224, this.sharedMemory);
            this.update(this.oKeyPad);
            this.update(innerHash);
            Sha256.prototype.finalize.call(this);
          }
        };
        var exports2 = createMethod();
        exports2.sha256 = exports2;
        exports2.sha224 = createMethod(true);
        exports2.sha256.hmac = createHmacMethod();
        exports2.sha224.hmac = createHmacMethod(true);
        if (COMMON_JS) {
          module.exports = exports2;
        } else {
          root.sha256 = exports2.sha256;
          root.sha224 = exports2.sha224;
          if (AMD) {
            define(function() {
              return exports2;
            });
          }
        }
      })();
    }
  });

  // src/bindings/duckdb-coi.pthread.js
  var Module = {};
  var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
  if (ENVIRONMENT_IS_NODE) {
    nodeWorkerThreads = require_worker_threads();
    parentPort = nodeWorkerThreads.parentPort;
    parentPort.on("message", (data) => onmessage({ data }));
    fs = require_fs();
    vm = ["vm"].map(__require);
    Object.assign(global, { self: global, require: __require, Module, location: { href: __filename }, Worker: nodeWorkerThreads.Worker, importScripts: (f) => vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }), postMessage: (msg) => parentPort.postMessage(msg), performance: global.performance || { now: Date.now } });
  }
  var nodeWorkerThreads;
  var parentPort;
  var fs;
  var vm;
  var initializedJS = false;
  function threadPrintErr(...args) {
    var text = args.join(" ");
    if (ENVIRONMENT_IS_NODE) {
      fs.writeSync(2, text + "\n");
      return;
    }
    console.error(text);
  }
  function threadAlert(...args) {
    var text = args.join(" ");
    postMessage({ cmd: "alert", text, threadId: Module["_pthread_self"]() });
  }
  var err = threadPrintErr;
  self.alert = threadAlert;
  Module["instantiateWasm"] = (info, receiveInstance) => {
    var module = Module["wasmModule"];
    Module["wasmModule"] = null;
    var instance = new WebAssembly.Instance(module, info);
    return receiveInstance(instance);
  };
  self.onunhandledrejection = (e) => {
    throw e.reason || e;
  };
  function handleMessage(e) {
    var _a;
    try {
      if (e.data.cmd === "load") {
        let messageQueue = [];
        self.onmessage = (e2) => messageQueue.push(e2);
        self.startWorker = (instance) => {
          Module = instance;
          postMessage({ "cmd": "loaded" });
          for (let msg of messageQueue) {
            handleMessage(msg);
          }
          self.onmessage = handleMessage;
        };
        Module["wasmModule"] = e.data.wasmModule;
        for (const handler of e.data.handlers) {
          Module[handler] = (...args) => {
            postMessage({ cmd: "callHandler", handler, args });
          };
        }
        Module["wasmMemory"] = e.data.wasmMemory;
        Module["buffer"] = Module["wasmMemory"].buffer;
        Module["ENVIRONMENT_IS_PTHREAD"] = true;
        if (typeof e.data.urlOrBlob == "string") {
          importScripts(e.data.urlOrBlob);
        } else {
          var objectUrl = URL.createObjectURL(e.data.urlOrBlob);
          importScripts(objectUrl);
          URL.revokeObjectURL(objectUrl);
        }
        DuckDB(Module);
      } else if (e.data.cmd === "run") {
        Module["__emscripten_thread_init"](e.data.pthread_ptr, 0, 0, 1);
        Module["__emscripten_thread_mailbox_await"](e.data.pthread_ptr);
        Module["establishStackSpace"]();
        Module["PThread"].receiveObjectTransfer(e.data);
        Module["PThread"].threadInitTLS();
        if (!initializedJS) {
          initializedJS = true;
        }
        try {
          Module["invokeEntryPoint"](e.data.start_routine, e.data.arg);
        } catch (ex) {
          if (ex != "unwind") {
            throw ex;
          }
        }
      } else if (e.data.cmd === "cancel") {
        if (Module["_pthread_self"]()) {
          Module["__emscripten_thread_exit"](-1);
        }
      } else if (e.data.target === "setimmediate") {
      } else if (e.data.cmd === "checkMailbox") {
        if (initializedJS) {
          Module["checkMailbox"]();
        }
      } else if (e.data.cmd) {
        err("worker.js received unknown command ".concat(e.data.cmd));
        err(e.data);
      }
    } catch (ex) {
      (_a = Module["__emscripten_thread_crashed"]) == null ? void 0 : _a.call(Module);
      throw ex;
    }
  }
  self.onmessage = handleMessage;
  var onmessage = self.onmessage;
  function getModule() {
    return Module;
  }
  function setModule(m) {
    Module = m;
  }

  // src/targets/duckdb-browser-coi.pthread.worker.ts
  var import_duckdb_coi = __toESM(require_duckdb_coi());

  // src/utils/s3_helper.ts
  var import_js_sha256 = __toESM(require_sha256());
  var getHTTPHost = function(config, url, bucket) {
    var _a;
    if ((_a = config == null ? void 0 : config.endpoint) == null ? void 0 : _a.startsWith("http")) {
      const endpointUrl = new URL(config.endpoint);
      return endpointUrl.host;
    } else if (config == null ? void 0 : config.endpoint) {
      return "".concat(bucket, ".").concat(config == null ? void 0 : config.endpoint);
    } else {
      return "".concat(bucket, ".s3.amazonaws.com");
    }
  };
  function getS3Params(config, url, method) {
    var _a, _b, _c, _d;
    const parsedS3Url = parseS3Url(url);
    let path = parsedS3Url.path;
    if (isPathStyleAccess(config)) {
      let endpointPath = "";
      if (config == null ? void 0 : config.endpoint) {
        const endpointUrl = new URL(config.endpoint);
        if (endpointUrl.pathname !== "/") {
          endpointPath = endpointUrl.pathname;
        }
      }
      path = "".concat(endpointPath, "/").concat(parsedS3Url.bucket).concat(path);
    }
    return {
      url: path,
      query: "",
      host: getHTTPHost(config, url, parsedS3Url.bucket),
      region: (_a = config == null ? void 0 : config.region) != null ? _a : "",
      service: "s3",
      method,
      accessKeyId: (_b = config == null ? void 0 : config.accessKeyId) != null ? _b : "",
      secretAccessKey: (_c = config == null ? void 0 : config.secretAccessKey) != null ? _c : "",
      sessionToken: (_d = config == null ? void 0 : config.sessionToken) != null ? _d : "",
      dateNow: (/* @__PURE__ */ new Date()).toISOString().replace(/-/g, "").split("T")[0],
      datetimeNow: (/* @__PURE__ */ new Date()).toISOString().replace(/-/g, "").replace(/:/g, "").split(".")[0] + "Z"
    };
  }
  function uriEncode(input, encode_slash = false) {
    const hexDigit = "0123456789ABCDEF";
    let result = "";
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch >= "A" && ch <= "Z" || ch >= "a" && ch <= "z" || ch >= "0" && ch <= "9" || ch == "_" || ch == "-" || ch == "~" || ch == ".") {
        result += ch;
      } else if (ch == "/") {
        if (encode_slash) {
          result += "%2F";
        } else {
          result += ch;
        }
      } else {
        result += "%";
        result += hexDigit[ch.charCodeAt(0) >> 4];
        result += hexDigit[ch.charCodeAt(0) & 15];
      }
    }
    return result;
  }
  function createS3Headers(params, payloadParams = null) {
    var _a;
    const payloadHash = (_a = payloadParams == null ? void 0 : payloadParams.contentHash) != null ? _a : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const res = /* @__PURE__ */ new Map();
    res.set("x-amz-date", params.datetimeNow);
    res.set("x-amz-content-sha256", payloadHash);
    if (params.sessionToken) {
      res.set("x-amz-security-token", params.sessionToken);
    }
    let signedHeaders = "";
    if (payloadParams == null ? void 0 : payloadParams.contentType) {
      signedHeaders += "content-type;";
    }
    signedHeaders += "host;x-amz-content-sha256;x-amz-date";
    if (params.sessionToken) {
      signedHeaders += ";x-amz-security-token";
    }
    let canonicalRequest = params.method + "\n" + uriEncode(params.url) + "\n" + params.query;
    if (payloadParams == null ? void 0 : payloadParams.contentType) {
      canonicalRequest += "\ncontent-type:" + (payloadParams == null ? void 0 : payloadParams.contentType);
    }
    canonicalRequest += "\nhost:" + params.host + "\nx-amz-content-sha256:" + payloadHash + "\nx-amz-date:" + params.datetimeNow;
    if (params.sessionToken && params.sessionToken.length > 0) {
      canonicalRequest += "\nx-amz-security-token:" + params.sessionToken;
    }
    canonicalRequest += "\n\n" + signedHeaders + "\n" + payloadHash;
    const canonicalRequestHashStr = (0, import_js_sha256.sha256)(canonicalRequest);
    const stringToSign = "AWS4-HMAC-SHA256\n" + params.datetimeNow + "\n" + params.dateNow + "/" + params.region + "/" + params.service + "/aws4_request\n" + canonicalRequestHashStr;
    const signKey = "AWS4" + params.secretAccessKey;
    const kDate = import_js_sha256.sha256.hmac.arrayBuffer(signKey, params.dateNow);
    const kRegion = import_js_sha256.sha256.hmac.arrayBuffer(kDate, params.region);
    const kService = import_js_sha256.sha256.hmac.arrayBuffer(kRegion, params.service);
    const signingKey = import_js_sha256.sha256.hmac.arrayBuffer(kService, "aws4_request");
    const signature = import_js_sha256.sha256.hmac(signingKey, stringToSign);
    res.set(
      "Authorization",
      "AWS4-HMAC-SHA256 Credential=" + params.accessKeyId + "/" + params.dateNow + "/" + params.region + "/" + params.service + "/aws4_request, SignedHeaders=" + signedHeaders + ", Signature=" + signature
    );
    return res;
  }
  var createS3HeadersFromS3Config = function(config, url, method, contentType = null, payload = null) {
    const params = getS3Params(config, url, method);
    const payloadParams = {
      contentType,
      contentHash: payload ? import_js_sha256.sha256.hex(payload) : null
    };
    return createS3Headers(params, payloadParams);
  };
  function addS3Headers(xhr, config, url, method, contentType = null, payload = null) {
    if ((config == null ? void 0 : config.accessKeyId) || (config == null ? void 0 : config.sessionToken)) {
      const headers = createS3HeadersFromS3Config(config, url, method, contentType, payload);
      headers.forEach((value, header) => {
        xhr.setRequestHeader(header, value);
      });
      if (contentType) {
        xhr.setRequestHeader("content-type", contentType);
      }
    }
  }
  function parseS3Url(url) {
    if (url.indexOf("s3://") != 0) {
      throw new Error("URL needs to start with s3://");
    }
    const slashPos = url.indexOf("/", 5);
    if (slashPos == -1) {
      throw new Error("URL needs to contain a '/' after the host");
    }
    const bucket = url.substring(5, slashPos);
    if (!bucket) {
      throw new Error("URL needs to contain a bucket name");
    }
    const path = url.substring(slashPos);
    if (!path) {
      throw new Error("URL needs to contain key");
    }
    return { bucket, path };
  }
  function isPathStyleAccess(config) {
    var _a;
    if ((_a = config == null ? void 0 : config.endpoint) == null ? void 0 : _a.startsWith("http")) {
      return true;
    }
    return false;
  }
  function getHTTPUrl(config, url) {
    const parsedUrl = parseS3Url(url);
    if (isPathStyleAccess(config)) {
      return "".concat(config == null ? void 0 : config.endpoint, "/").concat(parsedUrl.bucket) + parsedUrl.path;
    }
    return "https://" + getHTTPHost(config, url, parsedUrl.bucket) + parsedUrl.path;
  }

  // src/bindings/udf_runtime.ts
  var TEXT_ENCODER = new TextEncoder();
  var TEXT_DECODER = new TextDecoder("utf-8");
  function storeError(mod, response, message) {
    const msgBuffer = TEXT_ENCODER.encode(message);
    const heapAddr = mod._malloc(msgBuffer.byteLength);
    const heapArray = mod.HEAPU8.subarray(heapAddr, heapAddr + msgBuffer.byteLength);
    heapArray.set(msgBuffer);
    mod.HEAPF64[(response >> 3) + 0] = 1;
    mod.HEAPF64[(response >> 3) + 1] = heapAddr;
    mod.HEAPF64[(response >> 3) + 2] = heapArray.byteLength;
  }
  function getTypeSize(ptype) {
    switch (ptype) {
      case "UINT8":
      case "INT8":
        return 1;
      case "INT32":
      case "FLOAT":
        return 4;
      case "INT64":
      case "UINT64":
      case "DOUBLE":
      case "VARCHAR":
        return 8;
      default:
        return 0;
    }
  }
  function ptrToArray(mod, ptr, ptype, n) {
    const heap = mod.HEAPU8.subarray(ptr, ptr + n * getTypeSize(ptype));
    switch (ptype) {
      case "UINT8":
        return new Uint8Array(heap.buffer, heap.byteOffset, n);
      case "INT8":
        return new Int8Array(heap.buffer, heap.byteOffset, n);
      case "INT32":
        return new Int32Array(heap.buffer, heap.byteOffset, n);
      case "FLOAT":
        return new Float32Array(heap.buffer, heap.byteOffset, n);
      case "DOUBLE":
        return new Float64Array(heap.buffer, heap.byteOffset, n);
      case "VARCHAR":
        return new Float64Array(heap.buffer, heap.byteOffset, n);
      default:
        return new Array(0);
    }
  }
  function ptrToUint8Array(mod, ptr, n) {
    const heap = mod.HEAPU8.subarray(ptr, ptr + n);
    return new Uint8Array(heap.buffer, heap.byteOffset, n);
  }
  function ptrToFloat64Array(mod, ptr, n) {
    const heap = mod.HEAPU8.subarray(ptr, ptr + n * 8);
    return new Float64Array(heap.buffer, heap.byteOffset, n);
  }
  function callScalarUDF(runtime, mod, response, funcId, descPtr, descSize, ptrsPtr, ptrsSize) {
    try {
      const udf = runtime._udfFunctions.get(funcId);
      if (!udf) {
        storeError(mod, response, "Unknown UDF with id: " + funcId);
        return;
      }
      const rawDesc = TEXT_DECODER.decode(mod.HEAPU8.subarray(descPtr, descPtr + descSize));
      const desc = JSON.parse(rawDesc);
      const ptrs = ptrToFloat64Array(mod, ptrsPtr, ptrsSize / 8);
      const buildResolver = (arg) => {
        var _a;
        let validity = null;
        if (arg.validityBuffer !== void 0) {
          validity = ptrToUint8Array(mod, ptrs[arg.validityBuffer], desc.rows);
        }
        switch (arg.physicalType) {
          case "VARCHAR": {
            if (arg.dataBuffer === null || arg.dataBuffer === void 0) {
              throw new Error("malformed data view, expected data buffer for VARCHAR argument");
            }
            if (arg.lengthBuffer === null || arg.lengthBuffer === void 0) {
              throw new Error("malformed data view, expected data length buffer for VARCHAR argument");
            }
            const raw = ptrToArray(mod, ptrs[arg.dataBuffer], arg.physicalType, desc.rows);
            const strings = [];
            const stringLengths = ptrToFloat64Array(mod, ptrs[arg.lengthBuffer], desc.rows);
            for (let j = 0; j < desc.rows; ++j) {
              if (validity != null && !validity[j]) {
                strings.push(null);
                continue;
              }
              const subarray = mod.HEAPU8.subarray(
                raw[j],
                raw[j] + stringLengths[j]
              );
              const str = TEXT_DECODER.decode(subarray);
              strings.push(str);
            }
            return (row) => strings[row];
          }
          case "STRUCT": {
            const tmp = {};
            const children = [];
            for (let j = 0; j < (((_a = arg.children) == null ? void 0 : _a.length) || 0); ++j) {
              const attr = arg.children[j];
              const child = buildResolver(attr);
              children.push((row) => {
                tmp[attr.name] = child(row);
              });
            }
            if (validity != null) {
              return (row) => {
                if (!validity[row]) {
                  return null;
                }
                for (const resolver of children) {
                  resolver(row);
                }
                return tmp;
              };
            } else {
              return (row) => {
                for (const resolver of children) {
                  resolver(row);
                }
                return tmp;
              };
            }
          }
          default: {
            if (arg.dataBuffer === void 0) {
              throw new Error(
                "malformed data view, expected data buffer for argument of type: " + arg.physicalType
              );
            }
            const data = ptrToArray(mod, ptrs[arg.dataBuffer], arg.physicalType, desc.rows);
            if (validity != null) {
              return (row) => !validity[row] ? null : data[row];
            } else {
              return (row) => data[row];
            }
          }
        }
      };
      const argResolvers = [];
      for (let i = 0; i < desc.args.length; ++i) {
        argResolvers.push(buildResolver(desc.args[i]));
      }
      const resultDataLen = desc.rows * getTypeSize(desc.ret.physicalType);
      const resultDataPtr = mod._malloc(resultDataLen);
      const resultData = ptrToArray(mod, resultDataPtr, desc.ret.physicalType, desc.rows);
      const resultValidityPtr = mod._malloc(desc.rows);
      const resultValidity = ptrToUint8Array(mod, resultValidityPtr, desc.rows);
      if (resultData.length == 0 || resultValidity.length == 0) {
        storeError(mod, response, "Can't create physical arrays for result");
        return;
      }
      let rawResultData = resultData;
      if (desc.ret.physicalType == "VARCHAR") {
        rawResultData = new Array(desc.rows);
      }
      const args = [];
      for (let i = 0; i < desc.args.length; ++i) {
        args.push(null);
      }
      for (let i = 0; i < desc.rows; ++i) {
        for (let j = 0; j < desc.args.length; ++j) {
          args[j] = argResolvers[j](i);
        }
        const res = udf.func(...args);
        rawResultData[i] = res;
        resultValidity[i] = res === void 0 || res === null ? 0 : 1;
      }
      let resultLengthsPtr = 0;
      switch (desc.ret.physicalType) {
        case "VARCHAR": {
          const resultDataUTF8 = new Array(0);
          resultLengthsPtr = mod._malloc(desc.rows * getTypeSize("DOUBLE"));
          const resultLengths = ptrToFloat64Array(mod, resultLengthsPtr, desc.rows);
          let totalLength = 0;
          for (let row = 0; row < desc.rows; ++row) {
            const utf8 = TEXT_ENCODER.encode(rawResultData[row] || "");
            resultDataUTF8.push(utf8);
            resultLengths[row] = utf8.length;
            totalLength += utf8.length;
          }
          const resultStringPtr = mod._malloc(totalLength);
          const resultStringBuf = mod.HEAPU8.subarray(resultStringPtr, resultStringPtr + totalLength);
          let writerOffset = 0;
          for (let row = 0; row < desc.rows; ++row) {
            resultData[row] = writerOffset;
            const resultUTF8 = resultDataUTF8[row];
            const writer = resultStringBuf.subarray(writerOffset, writerOffset + resultUTF8.length);
            writer.set(resultUTF8);
            writerOffset += resultUTF8.length;
          }
        }
      }
      const retLen = 3 * 8;
      const retPtr = mod._malloc(retLen);
      const retBuffer = ptrToFloat64Array(mod, retPtr, 3);
      retBuffer[0] = resultDataPtr;
      retBuffer[1] = resultValidityPtr;
      retBuffer[2] = resultLengthsPtr;
      mod.HEAPF64[(response >> 3) + 0] = 0;
      mod.HEAPF64[(response >> 3) + 1] = retPtr;
      mod.HEAPF64[(response >> 3) + 2] = 0;
    } catch (e) {
      storeError(mod, response, e.toString());
    }
  }

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
  function failWith(mod, msg) {
    console.error("FAIL WITH: ".concat(msg));
    mod.ccall("duckdb_web_fail_with", null, ["string"], [msg]);
  }
  function readString(mod, begin, length) {
    return decodeText(mod.HEAPU8.subarray(begin, begin + length));
  }
  function callSRet(mod, funcName, argTypes, args) {
    const stackPointer = mod.stackSave();
    const response = mod.stackAlloc(3 * 8);
    argTypes.unshift("number");
    args.unshift(response);
    mod.ccall(funcName, null, argTypes, args);
    const status = mod.HEAPF64[(response >> 3) + 0];
    const data = mod.HEAPF64[(response >> 3) + 1];
    const dataSize = mod.HEAPF64[(response >> 3) + 2];
    mod.stackRestore(stackPointer);
    return [status, data, dataSize];
  }
  function dropResponseBuffers(mod) {
    mod.ccall("duckdb_web_clear_response", null, [], []);
  }

  // src/bindings/runtime_browser.ts
  var OPFS_PREFIX_LEN = "opfs://".length;
  var PATH_SEP_REGEX = /\/|\\/;
  var BROWSER_RUNTIME = {
    _files: /* @__PURE__ */ new Map(),
    _fileInfoCache: /* @__PURE__ */ new Map(),
    _udfFunctions: /* @__PURE__ */ new Map(),
    _globalFileInfo: null,
    _preparedHandles: {},
    _opfsRoot: null,
    getFileInfo(mod, fileId) {
      try {
        const cached = BROWSER_RUNTIME._fileInfoCache.get(fileId);
        const [s, d, n] = callSRet(
          mod,
          "duckdb_web_fs_get_file_info_by_id",
          ["number", "number"],
          [fileId, (cached == null ? void 0 : cached.cacheEpoch) || 0]
        );
        if (s !== 0 /* SUCCESS */) {
          return null;
        } else if (n === 0) {
          return cached;
        }
        const infoStr = readString(mod, d, n);
        dropResponseBuffers(mod);
        try {
          const info = JSON.parse(infoStr);
          if (info == null) {
            return null;
          }
          const file = { ...info, blob: null };
          BROWSER_RUNTIME._fileInfoCache.set(fileId, file);
          if (!BROWSER_RUNTIME._files.has(file.fileName) && BROWSER_RUNTIME._preparedHandles[file.fileName]) {
            BROWSER_RUNTIME._files.set(file.fileName, BROWSER_RUNTIME._preparedHandles[file.fileName]);
            delete BROWSER_RUNTIME._preparedHandles[file.fileName];
          }
          return file;
        } catch (error) {
          console.warn(error);
          return null;
        }
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    getGlobalFileInfo(mod) {
      var _a;
      try {
        const [s, d, n] = callSRet(
          mod,
          "duckdb_web_get_global_file_info",
          ["number"],
          [((_a = BROWSER_RUNTIME._globalFileInfo) == null ? void 0 : _a.cacheEpoch) || 0]
        );
        if (s !== 0 /* SUCCESS */) {
          return null;
        } else if (n === 0) {
          return BROWSER_RUNTIME._globalFileInfo;
        }
        const infoStr = readString(mod, d, n);
        dropResponseBuffers(mod);
        const info = JSON.parse(infoStr);
        if (info == null) {
          return null;
        }
        BROWSER_RUNTIME._globalFileInfo = { ...info, blob: null };
        return BROWSER_RUNTIME._globalFileInfo;
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    async assignOPFSRoot() {
      if (!BROWSER_RUNTIME._opfsRoot) {
        BROWSER_RUNTIME._opfsRoot = await navigator.storage.getDirectory();
      }
    },
    /** Prepare a file handle that could only be acquired aschronously */
    async prepareFileHandles(filePaths, protocol) {
      if (protocol === 3 /* BROWSER_FSACCESS */) {
        await BROWSER_RUNTIME.assignOPFSRoot();
        const prepare = async (path) => {
          if (BROWSER_RUNTIME._files.has(path)) {
            return {
              path,
              handle: BROWSER_RUNTIME._files.get(path),
              fromCached: true
            };
          }
          const opfsRoot = BROWSER_RUNTIME._opfsRoot;
          let dirHandle = opfsRoot;
          const opfsPath = path.slice(OPFS_PREFIX_LEN);
          let fileName = opfsPath;
          if (PATH_SEP_REGEX.test(opfsPath)) {
            const folders = opfsPath.split(PATH_SEP_REGEX);
            if (folders.length === 0) {
              throw new Error("Invalid path ".concat(opfsPath));
            }
            fileName = folders[folders.length - 1];
            if (!fileName) {
              throw new Error("Invalid path ".concat(opfsPath, ". File Not Found."));
            }
            folders.pop();
            for (const folder of folders) {
              dirHandle = await dirHandle.getDirectoryHandle(folder, { create: true });
            }
          }
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: false }).catch((e) => {
            if ((e == null ? void 0 : e.name) === "NotFoundError") {
              console.debug("File ".concat(path, " does not exists yet, creating..."));
              return dirHandle.getFileHandle(fileName, { create: true });
            }
            throw e;
          });
          try {
            const handle = await fileHandle.createSyncAccessHandle();
            BROWSER_RUNTIME._preparedHandles[path] = handle;
            return {
              path,
              handle,
              fromCached: false
            };
          } catch (e) {
            throw new Error(e.message + ":" + name);
          }
        };
        const result = [];
        for (const filePath of filePaths) {
          const res = await prepare(filePath);
          result.push(res);
        }
        return result;
      }
      throw new Error("Unsupported protocol ".concat(protocol, " for paths ").concat(filePaths, " with protocol ").concat(protocol));
    },
    /** Prepare a file handle that could only be acquired aschronously */
    async prepareDBFileHandle(dbPath, protocol) {
      if (protocol === 3 /* BROWSER_FSACCESS */ && this.prepareFileHandles) {
        const filePaths = [dbPath, "".concat(dbPath, ".wal")];
        return this.prepareFileHandles(filePaths, protocol);
      }
      throw new Error("Unsupported protocol ".concat(protocol, " for path ").concat(dbPath, " with protocol ").concat(protocol));
    },
    testPlatformFeature: (_mod, feature) => {
      switch (feature) {
        case 1:
          return typeof BigInt64Array !== "undefined";
        default:
          console.warn("test for unknown feature: ".concat(feature));
          return false;
      }
    },
    getDefaultDataProtocol(mod) {
      return 2 /* BROWSER_FILEREADER */;
    },
    openFile: (mod, fileId, flags) => {
      var _a, _b, _c, _d, _e, _f;
      try {
        BROWSER_RUNTIME._fileInfoCache.delete(fileId);
        const file = BROWSER_RUNTIME.getFileInfo(mod, fileId);
        switch (file == null ? void 0 : file.dataProtocol) {
          case 4 /* HTTP */:
          case 5 /* S3 */: {
            if (flags & 1 /* FILE_FLAGS_READ */ && flags & 2 /* FILE_FLAGS_WRITE */) {
              throw new Error(
                "Opening file ".concat(file.fileName, " failed: cannot open file with both read and write flags set")
              );
            } else if (flags & 32 /* FILE_FLAGS_APPEND */) {
              throw new Error(
                "Opening file ".concat(file.fileName, " failed: appending to HTTP/S3 files is not supported")
              );
            } else if (flags & 2 /* FILE_FLAGS_WRITE */) {
              const xhr = new XMLHttpRequest();
              if (file.dataProtocol == 5 /* S3 */) {
                xhr.open("HEAD", getHTTPUrl(file.s3Config, file.dataUrl), false);
                addS3Headers(xhr, file.s3Config, file.dataUrl, "HEAD");
              } else {
                xhr.open("HEAD", file.dataUrl, false);
              }
              xhr.send(null);
              if (xhr.status != 200 && xhr.status != 404) {
                throw new Error(
                  "Opening file ".concat(file.fileName, " failed: Unexpected return status from server (").concat(xhr.status, ")")
                );
              } else if (xhr.status == 404 && !(flags & 8 /* FILE_FLAGS_FILE_CREATE */ || flags & 16 /* FILE_FLAGS_FILE_CREATE_NEW */)) {
                throw new Error(
                  "Opening file ".concat(file.fileName, " failed: Cannot write to non-existent file without FILE_FLAGS_FILE_CREATE or FILE_FLAGS_FILE_CREATE_NEW flag.")
                );
              }
              const data = mod._malloc(1);
              const src = new Uint8Array();
              mod.HEAPU8.set(src, data);
              const result = mod._malloc(3 * 8);
              mod.HEAPF64[(result >> 3) + 0] = 1;
              mod.HEAPF64[(result >> 3) + 1] = data;
              mod.HEAPF64[(result >> 3) + 2] = (/* @__PURE__ */ new Date()).getTime() / 1e3;
              return result;
            } else if ((flags & 1 /* FILE_FLAGS_READ */) == 0) {
              throw new Error("Opening file ".concat(file.fileName, " failed: unsupported file flags: ").concat(flags));
            }
            let contentLength = null;
            let error = null;
            if (!file.forceFullHttpReads && (file.reliableHeadRequests || !file.allowFullHttpReads)) {
              try {
                const xhr = new XMLHttpRequest();
                if (file.dataProtocol == 5 /* S3 */) {
                  xhr.open("HEAD", getHTTPUrl(file.s3Config, file.dataUrl), false);
                  addS3Headers(xhr, file.s3Config, file.dataUrl, "HEAD");
                } else {
                  xhr.open("HEAD", file.dataUrl, false);
                }
                xhr.setRequestHeader("Range", "bytes=0-");
                xhr.send(null);
                contentLength = null;
                try {
                  contentLength = xhr.getResponseHeader("Content-Length");
                } catch (e) {
                  console.warn("Failed to get Content-Length on request");
                }
                if (contentLength !== null && xhr.status == 206) {
                  const result = mod._malloc(3 * 8);
                  mod.HEAPF64[(result >> 3) + 0] = +contentLength;
                  mod.HEAPF64[(result >> 3) + 1] = 0;
                  let modification_time = 0;
                  try {
                    modification_time = new Date((_a = xhr.getResponseHeader("Last-Modified")) != null ? _a : "").getTime() / 1e3;
                  } catch (e) {
                    console.warn("Failed to get Last-Modified on request");
                  }
                  mod.HEAPF64[(result >> 3) + 2] = +modification_time;
                  return result;
                }
              } catch (e) {
                error = e;
                console.warn("HEAD request with range header failed: ".concat(e));
              }
            }
            if (file.allowFullHttpReads) {
              if (!file.forceFullHttpReads) {
                const xhr2 = new XMLHttpRequest();
                if (file.dataProtocol == 5 /* S3 */) {
                  xhr2.open("GET", getHTTPUrl(file.s3Config, file.dataUrl), false);
                  addS3Headers(xhr2, file.s3Config, file.dataUrl, "GET");
                } else {
                  xhr2.open("GET", file.dataUrl, false);
                }
                xhr2.responseType = "arraybuffer";
                xhr2.setRequestHeader("Range", "bytes=0-0");
                xhr2.send(null);
                let actualContentLength = null;
                try {
                  actualContentLength = xhr2.getResponseHeader("Content-Length");
                } catch (e) {
                  console.warn("Failed to get Content-Length on request");
                }
                const contentRange = actualContentLength == null ? void 0 : actualContentLength.split("/")[1];
                const contentLength2 = actualContentLength;
                let presumedLength = null;
                if (contentRange !== void 0) {
                  presumedLength = contentRange;
                } else if (!file.reliableHeadRequests) {
                  const head = new XMLHttpRequest();
                  if (file.dataProtocol == 5 /* S3 */) {
                    head.open("HEAD", getHTTPUrl(file.s3Config, file.dataUrl), false);
                    addS3Headers(head, file.s3Config, file.dataUrl, "HEAD");
                  } else {
                    head.open("HEAD", file.dataUrl, false);
                  }
                  head.setRequestHeader("Range", "bytes=0-");
                  head.send(null);
                  contentLength = null;
                  try {
                    contentLength = head.getResponseHeader("Content-Length");
                  } catch (e) {
                    console.warn("Failed to get Content-Length on request");
                  }
                  if (contentLength !== null && +contentLength > 1) {
                    presumedLength = contentLength;
                  }
                }
                if (xhr2.status == 206 && contentLength2 !== null && +contentLength2 == 1 && presumedLength !== null) {
                  const result = mod._malloc(3 * 8);
                  mod.HEAPF64[(result >> 3) + 0] = +presumedLength;
                  mod.HEAPF64[(result >> 3) + 1] = 0;
                  let modification_time = 0;
                  try {
                    modification_time = new Date((_b = xhr2.getResponseHeader("Last-Modified")) != null ? _b : "").getTime() / 1e3;
                  } catch (e) {
                    console.warn("Failed to get Last-Modified on request");
                  }
                  mod.HEAPF64[(result >> 3) + 2] = +modification_time;
                  return result;
                }
                if (xhr2.status == 200 && contentLength2 !== null && contentLength !== null && +contentLength2 == +contentLength) {
                  console.warn("fall back to full HTTP read for: ".concat(file.dataUrl));
                  const data = mod._malloc(xhr2.response.byteLength);
                  const src = new Uint8Array(xhr2.response, 0, xhr2.response.byteLength);
                  mod.HEAPU8.set(src, data);
                  const result = mod._malloc(3 * 8);
                  mod.HEAPF64[(result >> 3) + 0] = xhr2.response.byteLength;
                  mod.HEAPF64[(result >> 3) + 1] = data;
                  let modification_time = 0;
                  try {
                    modification_time = new Date((_c = xhr2.getResponseHeader("Last-Modified")) != null ? _c : "").getTime() / 1e3;
                  } catch (e) {
                    console.warn("Failed to get Last-Modified on request");
                  }
                  mod.HEAPF64[(result >> 3) + 2] = +modification_time;
                  return result;
                }
                console.warn("falling back to full HTTP read for: ".concat(file.dataUrl));
              }
              const xhr = new XMLHttpRequest();
              if (file.dataProtocol == 5 /* S3 */) {
                xhr.open("GET", getHTTPUrl(file.s3Config, file.dataUrl), false);
                addS3Headers(xhr, file.s3Config, file.dataUrl, "GET");
              } else {
                xhr.open("GET", file.dataUrl, false);
              }
              xhr.responseType = "arraybuffer";
              xhr.send(null);
              if (xhr.status == 200) {
                const data = mod._malloc(xhr.response.byteLength);
                const src = new Uint8Array(xhr.response, 0, xhr.response.byteLength);
                mod.HEAPU8.set(src, data);
                const result = mod._malloc(3 * 8);
                mod.HEAPF64[(result >> 3) + 0] = xhr.response.byteLength;
                mod.HEAPF64[(result >> 3) + 1] = data;
                let modification_time = 0;
                try {
                  modification_time = new Date((_d = xhr.getResponseHeader("Last-Modified")) != null ? _d : "").getTime() / 1e3;
                } catch (e) {
                  console.warn("Failed to get Last-Modified on request");
                }
                mod.HEAPF64[(result >> 3) + 2] = +modification_time;
                return result;
              }
            }
            if (error != null) {
              throw new Error("Reading file ".concat(file.fileName, " failed with error: ").concat(error));
            }
            return 0;
          }
          case 2 /* BROWSER_FILEREADER */: {
            const handle = (_e = BROWSER_RUNTIME._files) == null ? void 0 : _e.get(file.fileName);
            if (handle) {
              const result2 = mod._malloc(3 * 8);
              mod.HEAPF64[(result2 >> 3) + 0] = handle.size;
              mod.HEAPF64[(result2 >> 3) + 1] = 0;
              mod.HEAPF64[(result2 >> 3) + 2] = 0;
              return result2;
            }
            if (flags & 128 /* FILE_FLAGS_NULL_IF_NOT_EXISTS */) {
              return 0;
            }
            console.warn("Buffering missing file: ".concat(file.fileName));
            const result = mod._malloc(3 * 8);
            const buffer = mod._malloc(1);
            mod.HEAPF64[(result >> 3) + 0] = 1;
            mod.HEAPF64[(result >> 3) + 1] = buffer;
            mod.HEAPF64[(result >> 3) + 2] = 0;
            return result;
          }
          case 3 /* BROWSER_FSACCESS */: {
            const handle = (_f = BROWSER_RUNTIME._files) == null ? void 0 : _f.get(file.fileName);
            if (!handle) {
              throw new Error("No OPFS access handle registered with name: ".concat(file.fileName));
            }
            if (flags & 16 /* FILE_FLAGS_FILE_CREATE_NEW */) {
              handle.truncate(0);
            }
            const result = mod._malloc(3 * 8);
            const fileSize = handle.getSize();
            mod.HEAPF64[(result >> 3) + 0] = fileSize;
            mod.HEAPF64[(result >> 3) + 1] = 0;
            mod.HEAPF64[(result >> 3) + 2] = 0;
            return result;
          }
        }
      } catch (e) {
        console.error(e.toString());
        failWith(mod, e.toString());
      }
      return 0;
    },
    glob: (mod, pathPtr, pathLen) => {
      var _a;
      try {
        const path = readString(mod, pathPtr, pathLen);
        if (path.startsWith("http") || path.startsWith("s3://")) {
          const xhr = new XMLHttpRequest();
          if (path.startsWith("s3://")) {
            const globalInfo = BROWSER_RUNTIME.getGlobalFileInfo(mod);
            xhr.open("HEAD", getHTTPUrl(globalInfo == null ? void 0 : globalInfo.s3Config, path), false);
            addS3Headers(xhr, globalInfo == null ? void 0 : globalInfo.s3Config, path, "HEAD");
          } else {
            xhr.open("HEAD", path, false);
          }
          xhr.send(null);
          if (xhr.status != 200 && xhr.status !== 206) {
            if (!((_a = BROWSER_RUNTIME.getGlobalFileInfo(mod)) == null ? void 0 : _a.allowFullHttpReads)) {
              console.log("HEAD request failed: ".concat(path, ", with full http reads are disabled"));
              return 0;
            }
            const xhr2 = new XMLHttpRequest();
            if (path.startsWith("s3://")) {
              const globalInfo = BROWSER_RUNTIME.getGlobalFileInfo(mod);
              xhr2.open("GET", getHTTPUrl(globalInfo == null ? void 0 : globalInfo.s3Config, path), false);
              addS3Headers(xhr2, globalInfo == null ? void 0 : globalInfo.s3Config, path, "HEAD");
            } else {
              xhr2.open("GET", path, false);
            }
            xhr2.setRequestHeader("Range", "bytes=0-0");
            xhr2.send(null);
            if (xhr2.status != 200 && xhr2.status !== 206) {
              console.log("HEAD and GET requests failed: ".concat(path));
              return 0;
            }
            let contentLength = null;
            try {
              contentLength = xhr2.getResponseHeader("Content-Length");
            } catch (e) {
              console.warn("Failed to get Content-Length on request");
            }
            if (contentLength && +contentLength > 1) {
              console.warn(
                "Range request for ".concat(path, " did not return a partial response: ").concat(xhr2.status, ' "').concat(xhr2.statusText, '"')
              );
            }
          }
          mod.ccall("duckdb_web_fs_glob_add_path", null, ["string"], [path]);
        } else {
          for (const [filePath] of BROWSER_RUNTIME._files.entries() || []) {
            if (filePath.startsWith(path)) {
              mod.ccall("duckdb_web_fs_glob_add_path", null, ["string"], [filePath]);
            }
          }
        }
      } catch (e) {
        console.log(e);
        failWith(mod, e.toString());
        return 0;
      }
    },
    checkFile: (mod, pathPtr, pathLen) => {
      try {
        const path = readString(mod, pathPtr, pathLen);
        if (path.startsWith("http") || path.startsWith("s3://")) {
          const xhr = new XMLHttpRequest();
          if (path.startsWith("s3://")) {
            const globalInfo = BROWSER_RUNTIME.getGlobalFileInfo(mod);
            xhr.open("HEAD", getHTTPUrl(globalInfo == null ? void 0 : globalInfo.s3Config, path), false);
            addS3Headers(xhr, globalInfo == null ? void 0 : globalInfo.s3Config, path, "HEAD");
          } else {
            xhr.open("HEAD", path, false);
          }
          xhr.send(null);
          return xhr.status == 206 || xhr.status == 200;
        } else {
          return BROWSER_RUNTIME._files.has(path);
        }
      } catch (e) {
        console.log(e);
        return false;
      }
      return false;
    },
    syncFile: (_mod, _fileId) => {
    },
    closeFile: (mod, fileId) => {
      var _a;
      const file = BROWSER_RUNTIME.getFileInfo(mod, fileId);
      BROWSER_RUNTIME._fileInfoCache.delete(fileId);
      try {
        switch (file == null ? void 0 : file.dataProtocol) {
          case 0 /* BUFFER */:
          case 4 /* HTTP */:
          case 5 /* S3 */:
            break;
          case 1 /* NODE_FS */:
          case 2 /* BROWSER_FILEREADER */:
            return;
          case 3 /* BROWSER_FSACCESS */: {
            const handle = (_a = BROWSER_RUNTIME._files) == null ? void 0 : _a.get(file.fileName);
            if (!handle) {
              throw new Error("No OPFS access handle registered with name: ".concat(file.fileName));
            }
            return handle.flush();
          }
        }
      } catch (e) {
        console.log(e);
        failWith(mod, e.toString());
      }
    },
    dropFile: (mod, fileNamePtr, fileNameLen) => {
      var _a;
      const fileName = readString(mod, fileNamePtr, fileNameLen);
      const handle = (_a = BROWSER_RUNTIME._files) == null ? void 0 : _a.get(fileName);
      if (handle) {
        BROWSER_RUNTIME._files.delete(fileName);
        if (handle instanceof FileSystemSyncAccessHandle) {
          try {
            handle.flush();
            handle.close();
          } catch (e) {
            throw new Error("Cannot drop file with name: ".concat(fileName));
          }
        }
        if (handle instanceof Blob) {
        }
      }
    },
    truncateFile: (mod, fileId, newSize) => {
      var _a;
      const file = BROWSER_RUNTIME.getFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 4 /* HTTP */:
          failWith(mod, "Cannot truncate a http file");
          return;
        case 5 /* S3 */:
          failWith(mod, "Cannot truncate an s3 file");
          return;
        case 0 /* BUFFER */:
        case 1 /* NODE_FS */:
        case 2 /* BROWSER_FILEREADER */:
          failWith(mod, "truncateFile not implemented");
          return;
        case 3 /* BROWSER_FSACCESS */: {
          const handle = (_a = BROWSER_RUNTIME._files) == null ? void 0 : _a.get(file.fileName);
          if (!handle) {
            throw new Error("No OPFS access handle registered with name: ".concat(file.fileName));
          }
          return handle.truncate(newSize);
        }
      }
      return 0;
    },
    readFile(mod, fileId, buf, bytes, location) {
      var _a;
      if (bytes == 0) {
        return 0;
      }
      try {
        const file = BROWSER_RUNTIME.getFileInfo(mod, fileId);
        switch (file == null ? void 0 : file.dataProtocol) {
          case 4 /* HTTP */:
          case 5 /* S3 */: {
            if (!file.dataUrl) {
              throw new Error("Missing data URL for file ".concat(fileId));
            }
            try {
              const xhr = new XMLHttpRequest();
              if (file.dataProtocol == 5 /* S3 */) {
                xhr.open("GET", getHTTPUrl(file == null ? void 0 : file.s3Config, file.dataUrl), false);
                addS3Headers(xhr, file == null ? void 0 : file.s3Config, file.dataUrl, "GET");
              } else {
                xhr.open("GET", file.dataUrl, false);
              }
              xhr.responseType = "arraybuffer";
              xhr.setRequestHeader("Range", "bytes=".concat(location, "-").concat(location + bytes - 1));
              xhr.send(null);
              if (xhr.status == 206 || xhr.status == 200 && bytes == xhr.response.byteLength && location == 0) {
                const src = new Uint8Array(xhr.response, 0, Math.min(xhr.response.byteLength, bytes));
                mod.HEAPU8.set(src, buf);
                return src.byteLength;
              } else if (xhr.status == 200) {
                console.warn(
                  "Range request for ".concat(file.dataUrl, " did not return a partial response: ").concat(xhr.status, ' "').concat(xhr.statusText, '"')
                );
                const src = new Uint8Array(
                  xhr.response,
                  location,
                  Math.min(xhr.response.byteLength - location, bytes)
                );
                mod.HEAPU8.set(src, buf);
                return src.byteLength;
              } else {
                throw new Error(
                  "Range request for ".concat(file.dataUrl, " did returned non-success status: ").concat(xhr.status, ' "').concat(xhr.statusText, '"')
                );
              }
            } catch (e) {
              console.log(e);
              throw new Error("Range request for ".concat(file.dataUrl, " failed with error: ").concat(e, '"'));
            }
          }
          case 2 /* BROWSER_FILEREADER */: {
            const handle = (_a = BROWSER_RUNTIME._files) == null ? void 0 : _a.get(file.fileName);
            if (!handle) {
              throw new Error("No HTML5 file registered with name: ".concat(file.fileName));
            }
            const sliced = handle.slice(location, location + bytes);
            const data = new Uint8Array(new FileReaderSync().readAsArrayBuffer(sliced));
            mod.HEAPU8.set(data, buf);
            return data.byteLength;
          }
          case 3 /* BROWSER_FSACCESS */: {
            const handle = BROWSER_RUNTIME._files.get(file.fileName);
            if (!handle) {
              throw new Error("No OPFS access handle registered with name: ".concat(file.fileName));
            }
            const out = mod.HEAPU8.subarray(buf, buf + bytes);
            return handle.read(out, { at: location });
          }
        }
        return 0;
      } catch (e) {
        console.log(e);
        failWith(mod, e.toString());
        return 0;
      }
    },
    writeFile: (mod, fileId, buf, bytes, location) => {
      var _a;
      const file = BROWSER_RUNTIME.getFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 4 /* HTTP */:
          failWith(mod, "Cannot write to HTTP file");
          return 0;
        case 5 /* S3 */: {
          const buffer = mod.HEAPU8.subarray(buf, buf + bytes);
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", getHTTPUrl(file == null ? void 0 : file.s3Config, file.dataUrl), false);
          addS3Headers(xhr, file == null ? void 0 : file.s3Config, file.dataUrl, "PUT", "", buffer);
          xhr.send(buffer);
          if (xhr.status !== 200) {
            failWith(mod, "Failed writing file: HTTP " + xhr.status);
            return 0;
          }
          return bytes;
        }
        case 2 /* BROWSER_FILEREADER */:
          failWith(mod, "cannot write using the html5 file reader api");
          return 0;
        case 3 /* BROWSER_FSACCESS */: {
          const handle = (_a = BROWSER_RUNTIME._files) == null ? void 0 : _a.get(file.fileName);
          if (!handle) {
            throw new Error("No OPFS access handle registered with name: ".concat(file.fileName));
          }
          const input = mod.HEAPU8.subarray(buf, buf + bytes);
          return handle.write(input, { at: location });
        }
      }
      return 0;
    },
    getLastFileModificationTime: (mod, fileId) => {
      var _a;
      const file = BROWSER_RUNTIME.getFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 2 /* BROWSER_FILEREADER */: {
          const handle = (_a = BROWSER_RUNTIME._files) == null ? void 0 : _a.get(file.fileName);
          if (!handle) {
            throw Error("No handle available for file: ".concat(file.fileName));
          }
          return 0;
        }
        case 4 /* HTTP */:
        case 5 /* S3 */:
          return (/* @__PURE__ */ new Date()).getTime() / 1e3;
      }
      return 0;
    },
    progressUpdate: (done, percentage, repeat) => {
      if (postMessage) {
        postMessage({
          requestId: 0,
          type: "PROGRESS_UPDATE" /* PROGRESS_UPDATE */,
          data: { status: done ? "completed" : "in-progress", percentage, repetitions: repeat }
        });
      }
    },
    checkDirectory: (mod, pathPtr, pathLen) => {
      const path = readString(mod, pathPtr, pathLen);
      console.log("checkDirectory: ".concat(path));
      return false;
    },
    createDirectory: (mod, pathPtr, pathLen) => {
      const path = readString(mod, pathPtr, pathLen);
      console.log("createDirectory: ".concat(path));
    },
    removeDirectory: (mod, pathPtr, pathLen) => {
      const path = readString(mod, pathPtr, pathLen);
      console.log("removeDirectory: ".concat(path));
    },
    listDirectoryEntries: (mod, pathPtr, pathLen) => {
      const path = readString(mod, pathPtr, pathLen);
      console.log("listDirectoryEntries: ".concat(path));
      return false;
    },
    moveFile: (mod, fromPtr, fromLen, toPtr, toLen) => {
      var _a, _b;
      const from = readString(mod, fromPtr, fromLen);
      const to = readString(mod, toPtr, toLen);
      const handle = (_a = BROWSER_RUNTIME._files) == null ? void 0 : _a.get(from);
      if (handle !== void 0) {
        BROWSER_RUNTIME._files.delete(handle);
        BROWSER_RUNTIME._files.set(to, handle);
      }
      for (const [key, value] of ((_b = BROWSER_RUNTIME._fileInfoCache) == null ? void 0 : _b.entries()) || []) {
        if (value.dataUrl == from) {
          BROWSER_RUNTIME._fileInfoCache.delete(key);
          break;
        }
      }
      return true;
    },
    removeFile: (_mod, _pathPtr, _pathLen) => {
    },
    callScalarUDF: (mod, response, funcId, descPtr, descSize, ptrsPtr, ptrsSize) => {
      callScalarUDF(BROWSER_RUNTIME, mod, response, funcId, descPtr, descSize, ptrsPtr, ptrsSize);
    }
  };

  // src/targets/duckdb-browser-coi.pthread.worker.ts
  globalThis.DUCKDB_RUNTIME = {};
  for (const func of Object.getOwnPropertyNames(BROWSER_RUNTIME)) {
    if (func == "constructor")
      continue;
    globalThis.DUCKDB_RUNTIME[func] = Object.getOwnPropertyDescriptor(BROWSER_RUNTIME, func).value;
  }
  globalThis.onmessage = (e) => {
    if (e.data.cmd === "load") {
      let m = getModule();
      globalThis.startWorker = (instance) => {
        m = instance;
        postMessage({ cmd: "loaded" });
      };
      m["wasmModule"] = e.data.wasmModule;
      m["wasmMemory"] = e.data.wasmMemory;
      m["buffer"] = m["wasmMemory"].buffer;
      m["ENVIRONMENT_IS_PTHREAD"] = true;
      (0, import_duckdb_coi.default)(m).then((instance) => {
        setModule(instance);
      });
    } else if (e.data.cmd === "registerFileHandle") {
      globalThis.DUCKDB_RUNTIME._files = globalThis.DUCKDB_RUNTIME._files || /* @__PURE__ */ new Map();
      globalThis.DUCKDB_RUNTIME._files.set(e.data.fileName, e.data.fileHandle);
    } else if (e.data.cmd === "dropFileHandle") {
      globalThis.DUCKDB_RUNTIME._files = globalThis.DUCKDB_RUNTIME._files || /* @__PURE__ */ new Map();
      globalThis.DUCKDB_RUNTIME._files.delete(e.data.fileName);
    } else if (e.data.cmd === "registerUDFFunction") {
      globalThis.DUCKDB_RUNTIME._udfFunctions = globalThis.DUCKDB_RUNTIME._files || /* @__PURE__ */ new Map();
      globalThis.DUCKDB_RUNTIME._udfFunctions.set(e.data.udf.name, e.data.udf);
    } else if (e.data.cmd === "dropUDFFunctions") {
      globalThis.DUCKDB_RUNTIME._udfFunctions = globalThis.DUCKDB_RUNTIME._files || /* @__PURE__ */ new Map();
      for (const key of globalThis.DUCKDB_RUNTIME._udfFunctions.keys()) {
        if (globalThis.DUCKDB_RUNTIME._udfFunctions.get(key).connection_id == e.data.connectionId) {
          globalThis.DUCKDB_RUNTIME._udfFunctions.delete(key);
        }
      }
    } else {
      onmessage(e);
    }
  };
})();
/*! Bundled license information:

js-sha256/src/sha256.js:
  (**
   * [js-sha256]{@link https://github.com/emn178/js-sha256}
   *
   * @version 0.11.1
   * @author Chen, Yi-Cyuan [emn178@gmail.com]
   * @copyright Chen, Yi-Cyuan 2014-2025
   * @license MIT
   *)
*/
//# sourceMappingURL=duckdb-browser-coi.pthread.worker.js.map
