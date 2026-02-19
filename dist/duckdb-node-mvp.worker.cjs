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

// src/bindings/duckdb-mvp.js
var require_duckdb_mvp = __commonJS({
  "src/bindings/duckdb-mvp.js"(exports2, module2) {
    "use strict";
    var DuckDB2 = (() => {
      var _a;
      var _scriptDir = typeof document != "undefined" ? (_a = document.currentScript) == null ? void 0 : _a.src : void 0;
      if (typeof __filename != "undefined")
        _scriptDir || (_scriptDir = __filename);
      return function(moduleArg = {}) {
        var Module = moduleArg;
        var readyPromiseResolve, readyPromiseReject;
        var readyPromise = new Promise((resolve, reject) => {
          readyPromiseResolve = resolve;
          readyPromiseReject = reject;
        });
        var moduleOverrides = Object.assign({}, Module);
        var arguments_ = [];
        var thisProgram = "./this.program";
        var quit_ = (status, toThrow) => {
          throw toThrow;
        };
        var ENVIRONMENT_IS_WEB = typeof window == "object";
        var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
        var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
        var scriptDirectory = "";
        function locateFile(path) {
          if (Module["locateFile"]) {
            return Module["locateFile"](path, scriptDirectory);
          }
          return scriptDirectory + path;
        }
        var read_, readAsync, readBinary;
        if (ENVIRONMENT_IS_NODE) {
          var fs3 = require("fs");
          var nodePath = require("path");
          if (ENVIRONMENT_IS_WORKER) {
            scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
          } else {
            scriptDirectory = __dirname + "/";
          }
          read_ = (filename, binary) => {
            filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
            return fs3.readFileSync(filename, binary ? void 0 : "utf8");
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
            fs3.readFile(filename, binary ? void 0 : "utf8", (err2, data) => {
              if (err2)
                onerror(err2);
              else
                onload(binary ? data.buffer : data);
            });
          };
          if (!Module["thisProgram"] && process.argv.length > 1) {
            thisProgram = process.argv[1].replace(/\\/g, "/");
          }
          arguments_ = process.argv.slice(2);
          quit_ = (status, toThrow) => {
            process.exitCode = status;
            throw toThrow;
          };
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
          {
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
        var out = Module["print"] || console.log.bind(console);
        var err = Module["printErr"] || console.error.bind(console);
        Object.assign(Module, moduleOverrides);
        moduleOverrides = null;
        if (Module["arguments"])
          arguments_ = Module["arguments"];
        if (Module["thisProgram"])
          thisProgram = Module["thisProgram"];
        if (Module["quit"])
          quit_ = Module["quit"];
        var wasmBinary;
        if (Module["wasmBinary"])
          wasmBinary = Module["wasmBinary"];
        var wasmMemory;
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
          Module["HEAP8"] = HEAP8 = new Int8Array(b);
          Module["HEAP16"] = HEAP16 = new Int16Array(b);
          Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
          Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
          Module["HEAP32"] = HEAP32 = new Int32Array(b);
          Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
          Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
          Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
        }
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATMAIN__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
        function preRun() {
          if (Module["preRun"]) {
            if (typeof Module["preRun"] == "function")
              Module["preRun"] = [Module["preRun"]];
            while (Module["preRun"].length) {
              addOnPreRun(Module["preRun"].shift());
            }
          }
          callRuntimeCallbacks(__ATPRERUN__);
        }
        function initRuntime() {
          runtimeInitialized = true;
          callRuntimeCallbacks(__ATINIT__);
        }
        function preMain() {
          callRuntimeCallbacks(__ATMAIN__);
        }
        function postRun() {
          if (Module["postRun"]) {
            if (typeof Module["postRun"] == "function")
              Module["postRun"] = [Module["postRun"]];
            while (Module["postRun"].length) {
              addOnPostRun(Module["postRun"].shift());
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
          (_a2 = Module["monitorRunDependencies"]) == null ? void 0 : _a2.call(Module, runDependencies);
        }
        function removeRunDependency(id) {
          var _a2;
          runDependencies--;
          (_a2 = Module["monitorRunDependencies"]) == null ? void 0 : _a2.call(Module, runDependencies);
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
          (_a2 = Module["onAbort"]) == null ? void 0 : _a2.call(Module, what);
          what = "Aborted(" + what + ")";
          err(what);
          ABORT = true;
          EXITSTATUS = 1;
          what += ". Build with -sASSERTIONS for more info.";
          var e = new WebAssembly.RuntimeError(what);
          readyPromiseReject(e);
          throw e;
        }
        var dataURIPrefix = "data:application/octet-stream;base64,";
        var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
        var isFileURI = (filename) => filename.startsWith("file://");
        var wasmBinaryFile;
        wasmBinaryFile = "./duckdb-mvp.wasm";
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
                  throw `failed to load wasm binary file at '${binaryFile}'`;
                }
                return response["arrayBuffer"]();
              }).catch(() => getBinarySync(binaryFile));
            }
          }
          return Promise.resolve().then(() => getBinarySync(binaryFile));
        }
        function instantiateArrayBuffer(binaryFile, imports, receiver) {
          return getBinaryPromise(binaryFile).then((binary) => WebAssembly.instantiate(binary, imports)).then(receiver, (reason) => {
            err(`failed to asynchronously prepare wasm: ${reason}`);
            abort(reason);
          });
        }
        function instantiateAsync(binary, binaryFile, imports, callback) {
          if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
            return fetch(binaryFile, {
              credentials: "same-origin"
            }).then((response) => {
              var result = WebAssembly.instantiateStreaming(response, imports);
              return result.then(callback, function(reason) {
                err(`wasm streaming compile failed: ${reason}`);
                err("falling back to ArrayBuffer instantiation");
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
          function receiveInstance(instance, module3) {
            wasmExports = instance.exports;
            wasmExports = applySignatureConversions(wasmExports);
            wasmMemory = wasmExports["yh"];
            updateMemoryViews();
            wasmTable = wasmExports["Bh"];
            addOnInit(wasmExports["zh"]);
            removeRunDependency("wasm-instantiate");
            return wasmExports;
          }
          addRunDependency("wasm-instantiate");
          function receiveInstantiationResult(result) {
            receiveInstance(result["instance"]);
          }
          if (Module["instantiateWasm"]) {
            try {
              return Module["instantiateWasm"](info, receiveInstance);
            } catch (e) {
              err(`Module.instantiateWasm callback failed with error: ${e}`);
              readyPromiseReject(e);
            }
          }
          instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
          return {};
        }
        var tempDouble;
        var tempI64;
        var ASM_CONSTS = {
          2500929: ($0, $1, $2, $3) => {
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
              var ptr1 = HEAP32[$2 / 4 + i >>> 0];
              var ptr2 = HEAP32[$2 / 4 + i + 1 >>> 0];
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
            } catch {
              return 0;
            }
            if (xhr.status >= 400)
              return 0;
            var uInt8Array = xhr.response;
            var len = uInt8Array.byteLength;
            var fileOnWasmHeap = _malloc(len + 4);
            var properArray = new Uint8Array(uInt8Array);
            for (var iii = 0; iii < len; iii++) {
              Module.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
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
            Module.HEAPU8.set(LEN123, fileOnWasmHeap);
            return fileOnWasmHeap;
          },
          2502336: ($0, $1, $2, $3, $4, $5) => {
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
              var ptr1 = HEAP32[$2 / 4 + i >>> 0];
              var ptr2 = HEAP32[$2 / 4 + i + 1 >>> 0];
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
                post_payload[iii] = Module.HEAPU8[iii + $4];
              }
              xhr.send(post_payload);
            } catch {
              return 0;
            }
            if (xhr.status >= 400)
              return 0;
            var uInt8Array = Uint8Array.from(Array.from(xhr.getResponseHeader("Etag")).map((letter) => letter.charCodeAt(0)));
            var len = uInt8Array.byteLength;
            var fileOnWasmHeap = _malloc(len + 4);
            var properArray = new Uint8Array(uInt8Array);
            for (var iii = 0; iii < len; iii++) {
              Module.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
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
            Module.HEAPU8.set(LEN123, fileOnWasmHeap);
            return fileOnWasmHeap;
          },
          2503956: ($0, $1, $2, $3) => {
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
              var ptr1 = HEAP32[$2 / 4 + i >>> 0];
              var ptr2 = HEAP32[$2 / 4 + i + 1 >>> 0];
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
            } catch {
              return 0;
            }
            if (xhr.status >= 400)
              return 0;
            var uInt8Array = xhr.response;
            var len = uInt8Array.byteLength;
            var fileOnWasmHeap = _malloc(len + 8);
            var properArray = new Uint8Array(uInt8Array);
            for (var iii = 0; iii < len; iii++) {
              Module.HEAPU8[iii + fileOnWasmHeap + 8] = properArray[iii];
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
            Module.HEAPU8.set(LEN123, fileOnWasmHeap + 4);
            var headers = Uint8Array.from(Array.from(xhr.getAllResponseHeaders()).map((letter) => letter.charCodeAt(0)));
            len = headers.byteLength;
            var headersOnWasmHeap = _malloc(len + 8);
            for (var iii = 0; iii < len; iii++) {
              Module.HEAPU8[iii + headersOnWasmHeap + 8] = headers[iii];
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
            Module.HEAPU8.set(LEN123, headersOnWasmHeap + 4);
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
            Module.HEAPU8.set(LEN123, fileOnWasmHeap);
            return fileOnWasmHeap;
          },
          2506240: ($0, $1, $2, $3) => {
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
              var ptr1 = HEAP32[$2 / 4 + i >>> 0];
              var ptr2 = HEAP32[$2 / 4 + i + 1 >>> 0];
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
            } catch {
              return 0;
            }
            if (xhr.status >= 400)
              return 0;
            var uInt8Array = xhr.response;
            var len = uInt8Array.byteLength;
            var fileOnWasmHeap = _malloc(len + 4);
            var properArray = new Uint8Array(uInt8Array);
            for (var iii = 0; iii < len; iii++) {
              Module.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
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
            Module.HEAPU8.set(LEN123, fileOnWasmHeap);
            return fileOnWasmHeap;
          },
          2507647: ($0, $1, $2, $3, $4, $5) => {
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
              var ptr1 = HEAP32[$2 / 4 + i >>> 0];
              var ptr2 = HEAP32[$2 / 4 + i + 1 >>> 0];
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
                post_payload[iii] = Module.HEAPU8[iii + $4];
              }
              xhr.send(post_payload);
            } catch {
              return 0;
            }
            if (xhr.status >= 400)
              return 0;
            var uInt8Array = xhr.response;
            var len = uInt8Array.byteLength;
            var fileOnWasmHeap = _malloc(len + 4);
            var properArray = new Uint8Array(uInt8Array);
            for (var iii = 0; iii < len; iii++) {
              Module.HEAPU8[iii + fileOnWasmHeap + 4] = properArray[iii];
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
            Module.HEAPU8.set(LEN123, fileOnWasmHeap);
            return fileOnWasmHeap;
          }
        };
        function ExitStatus(status) {
          this.name = "ExitStatus";
          this.message = `Program terminated with exit(${status})`;
          this.status = status;
        }
        var callRuntimeCallbacks = (callbacks) => {
          while (callbacks.length > 0) {
            callbacks.shift()(Module);
          }
        };
        var noExitRuntime = Module["noExitRuntime"] || true;
        var stackRestore = (val) => __emscripten_stack_restore(val);
        var stackSave = () => _emscripten_stack_get_current();
        var exceptionCaught = [];
        var uncaughtExceptionCount = 0;
        var convertI32PairToI53Checked = (lo, hi) => hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
        function ___cxa_begin_catch(ptr) {
          ptr >>>= 0;
          var info = new ExceptionInfo(ptr);
          if (!info.get_caught()) {
            info.set_caught(true);
            uncaughtExceptionCount--;
          }
          info.set_rethrown(false);
          exceptionCaught.push(info);
          ___cxa_increment_exception_refcount(info.excPtr);
          return info.get_exception_ptr();
        }
        function ___cxa_current_primary_exception() {
          if (!exceptionCaught.length) {
            return 0;
          }
          var info = exceptionCaught[exceptionCaught.length - 1];
          ___cxa_increment_exception_refcount(info.excPtr);
          return info.excPtr;
        }
        var exceptionLast = 0;
        var ___cxa_end_catch = () => {
          _setThrew(0, 0);
          var info = exceptionCaught.pop();
          ___cxa_decrement_exception_refcount(info.excPtr);
          exceptionLast = 0;
        };
        class ExceptionInfo {
          constructor(excPtr) {
            this.excPtr = excPtr;
            this.ptr = excPtr - 24;
          }
          set_type(type) {
            HEAPU32[this.ptr + 4 >>> 2 >>> 0] = type;
          }
          get_type() {
            return HEAPU32[this.ptr + 4 >>> 2 >>> 0];
          }
          set_destructor(destructor) {
            HEAPU32[this.ptr + 8 >>> 2 >>> 0] = destructor;
          }
          get_destructor() {
            return HEAPU32[this.ptr + 8 >>> 2 >>> 0];
          }
          set_caught(caught) {
            caught = caught ? 1 : 0;
            HEAP8[this.ptr + 12 >>> 0] = caught;
          }
          get_caught() {
            return HEAP8[this.ptr + 12 >>> 0] != 0;
          }
          set_rethrown(rethrown) {
            rethrown = rethrown ? 1 : 0;
            HEAP8[this.ptr + 13 >>> 0] = rethrown;
          }
          get_rethrown() {
            return HEAP8[this.ptr + 13 >>> 0] != 0;
          }
          init(type, destructor) {
            this.set_adjusted_ptr(0);
            this.set_type(type);
            this.set_destructor(destructor);
          }
          set_adjusted_ptr(adjustedPtr) {
            HEAPU32[this.ptr + 16 >>> 2 >>> 0] = adjustedPtr;
          }
          get_adjusted_ptr() {
            return HEAPU32[this.ptr + 16 >>> 2 >>> 0];
          }
          get_exception_ptr() {
            var isPointer = ___cxa_is_pointer_type(this.get_type());
            if (isPointer) {
              return HEAPU32[this.excPtr >>> 2 >>> 0];
            }
            var adjusted = this.get_adjusted_ptr();
            if (adjusted !== 0)
              return adjusted;
            return this.excPtr;
          }
        }
        function ___resumeException(ptr) {
          ptr >>>= 0;
          if (!exceptionLast) {
            exceptionLast = ptr;
          }
          throw exceptionLast;
        }
        var setTempRet0 = (val) => __emscripten_tempret_set(val);
        var findMatchingCatch = (args) => {
          var thrown = exceptionLast;
          if (!thrown) {
            setTempRet0(0);
            return 0;
          }
          var info = new ExceptionInfo(thrown);
          info.set_adjusted_ptr(thrown);
          var thrownType = info.get_type();
          if (!thrownType) {
            setTempRet0(0);
            return thrown;
          }
          for (var arg in args) {
            var caughtType = args[arg];
            if (caughtType === 0 || caughtType === thrownType) {
              break;
            }
            var adjusted_ptr_addr = info.ptr + 16;
            if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
              setTempRet0(caughtType);
              return thrown;
            }
          }
          setTempRet0(thrownType);
          return thrown;
        };
        function ___cxa_find_matching_catch_2() {
          return findMatchingCatch([]);
        }
        function ___cxa_find_matching_catch_3(arg0) {
          arg0 >>>= 0;
          return findMatchingCatch([arg0]);
        }
        function ___cxa_find_matching_catch_4(arg0, arg1) {
          arg0 >>>= 0;
          arg1 >>>= 0;
          return findMatchingCatch([arg0, arg1]);
        }
        function ___cxa_find_matching_catch_5(arg0, arg1, arg2) {
          arg0 >>>= 0;
          arg1 >>>= 0;
          arg2 >>>= 0;
          return findMatchingCatch([arg0, arg1, arg2]);
        }
        var ___cxa_rethrow = () => {
          var info = exceptionCaught.pop();
          if (!info) {
            abort("no exception to throw");
          }
          var ptr = info.excPtr;
          if (!info.get_rethrown()) {
            exceptionCaught.push(info);
            info.set_rethrown(true);
            info.set_caught(false);
            uncaughtExceptionCount++;
          }
          exceptionLast = ptr;
          throw exceptionLast;
        };
        function ___cxa_rethrow_primary_exception(ptr) {
          ptr >>>= 0;
          if (!ptr)
            return;
          var info = new ExceptionInfo(ptr);
          exceptionCaught.push(info);
          info.set_rethrown(true);
          ___cxa_rethrow();
        }
        function ___cxa_throw(ptr, type, destructor) {
          ptr >>>= 0;
          type >>>= 0;
          destructor >>>= 0;
          var info = new ExceptionInfo(ptr);
          info.init(type, destructor);
          exceptionLast = ptr;
          uncaughtExceptionCount++;
          throw exceptionLast;
        }
        var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;
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
          var family = HEAP16[sa >>> 1 >>> 0];
          var port = _ntohs(HEAPU16[sa + 2 >>> 1 >>> 0]);
          var addr;
          switch (family) {
            case 2:
              if (salen !== 16) {
                return {
                  errno: 28
                };
              }
              addr = HEAP32[sa + 4 >>> 2 >>> 0];
              addr = inetNtop4(addr);
              break;
            case 10:
              if (salen !== 28) {
                return {
                  errno: 28
                };
              }
              addr = [HEAP32[sa + 8 >>> 2 >>> 0], HEAP32[sa + 12 >>> 2 >>> 0], HEAP32[sa + 16 >>> 2 >>> 0], HEAP32[sa + 20 >>> 2 >>> 0]];
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
          lookup_name(name) {
            var res = inetPton4(name);
            if (res !== null) {
              return name;
            }
            res = inetPton6(name);
            if (res !== null) {
              return name;
            }
            var addr;
            if (DNS.address_map.addrs[name]) {
              addr = DNS.address_map.addrs[name];
            } else {
              var id = DNS.address_map.id++;
              assert(id < 65535, "exceeded max address mappings of 65535");
              addr = "172.29." + (id & 255) + "." + (id & 65280);
              DNS.address_map.names[addr] = name;
              DNS.address_map.addrs[name] = addr;
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
          addr >>>= 0;
          addrlen >>>= 0;
          var sock = getSocketFromFD(fd);
          var info = getSocketAddress(addr, addrlen);
          sock.sock_ops.bind(sock, info.addr, info.port);
          return 0;
        }
        function ___syscall_connect(fd, addr, addrlen, d1, d2, d3) {
          addr >>>= 0;
          addrlen >>>= 0;
          var sock = getSocketFromFD(fd);
          var info = getSocketAddress(addr, addrlen);
          sock.sock_ops.connect(sock, info.addr, info.port);
          return 0;
        }
        function ___syscall_faccessat(dirfd, path, amode, flags) {
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
            return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
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
          return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
        };
        var SYSCALLS = {
          varargs: void 0,
          getStr(ptr) {
            var ret = UTF8ToString(ptr);
            return ret;
          }
        };
        function ___syscall_fcntl64(fd, cmd, varargs) {
          varargs >>>= 0;
          SYSCALLS.varargs = varargs;
          return 0;
        }
        function ___syscall_fstat64(fd, buf) {
          buf >>>= 0;
        }
        function ___syscall_ftruncate64(fd, length_low, length_high) {
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
        Module["lengthBytesUTF8"] = lengthBytesUTF8;
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
        var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
        Module["stringToUTF8"] = stringToUTF8;
        function ___syscall_getcwd(buf, size) {
          buf >>>= 0;
          size >>>= 0;
        }
        function ___syscall_getdents64(fd, dirp, count) {
          dirp >>>= 0;
          count >>>= 0;
        }
        var zeroMemory = (address, size) => {
          HEAPU8.fill(0, address, address + size);
          return address;
        };
        var writeSockaddr = (sa, family, addr, port, addrlen) => {
          switch (family) {
            case 2:
              addr = inetPton4(addr);
              zeroMemory(sa, 16);
              if (addrlen) {
                HEAP32[addrlen >>> 2 >>> 0] = 16;
              }
              HEAP16[sa >>> 1 >>> 0] = family;
              HEAP32[sa + 4 >>> 2 >>> 0] = addr;
              HEAP16[sa + 2 >>> 1 >>> 0] = _htons(port);
              break;
            case 10:
              addr = inetPton6(addr);
              zeroMemory(sa, 28);
              if (addrlen) {
                HEAP32[addrlen >>> 2 >>> 0] = 28;
              }
              HEAP32[sa >>> 2 >>> 0] = family;
              HEAP32[sa + 8 >>> 2 >>> 0] = addr[0];
              HEAP32[sa + 12 >>> 2 >>> 0] = addr[1];
              HEAP32[sa + 16 >>> 2 >>> 0] = addr[2];
              HEAP32[sa + 20 >>> 2 >>> 0] = addr[3];
              HEAP16[sa + 2 >>> 1 >>> 0] = _htons(port);
              break;
            default:
              return 5;
          }
          return 0;
        };
        function ___syscall_getpeername(fd, addr, addrlen, d1, d2, d3) {
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
          addr >>>= 0;
          addrlen >>>= 0;
          var sock = getSocketFromFD(fd);
          var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport, addrlen);
          return 0;
        }
        function ___syscall_getsockopt(fd, level, optname, optval, optlen, d1) {
          optval >>>= 0;
          optlen >>>= 0;
          var sock = getSocketFromFD(fd);
          if (level === 1) {
            if (optname === 4) {
              HEAP32[optval >>> 2 >>> 0] = sock.error;
              HEAP32[optlen >>> 2 >>> 0] = 4;
              sock.error = null;
              return 0;
            }
          }
          return -50;
        }
        function ___syscall_ioctl(fd, op, varargs) {
          varargs >>>= 0;
          SYSCALLS.varargs = varargs;
          return 0;
        }
        function ___syscall_lstat64(path, buf) {
          path >>>= 0;
          buf >>>= 0;
        }
        function ___syscall_mkdirat(dirfd, path, mode) {
          path >>>= 0;
        }
        function ___syscall_newfstatat(dirfd, path, buf, flags) {
          path >>>= 0;
          buf >>>= 0;
        }
        function ___syscall_openat(dirfd, path, flags, varargs) {
          path >>>= 0;
          varargs >>>= 0;
          SYSCALLS.varargs = varargs;
        }
        function ___syscall_poll(fds, nfds, timeout) {
          fds >>>= 0;
        }
        function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {
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
          HEAPU8.set(msg.buffer, buf >>> 0);
          return msg.buffer.byteLength;
        }
        function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
          oldpath >>>= 0;
          newpath >>>= 0;
        }
        function ___syscall_rmdir(path) {
          path >>>= 0;
        }
        function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {
          message >>>= 0;
          length >>>= 0;
          addr >>>= 0;
          addr_len >>>= 0;
        }
        var ___syscall_socket = (domain, type, protocol) => {
        };
        function ___syscall_stat64(path, buf) {
          path >>>= 0;
          buf >>>= 0;
        }
        function ___syscall_statfs64(path, size, buf) {
          path >>>= 0;
          size >>>= 0;
          buf >>>= 0;
        }
        function ___syscall_unlinkat(dirfd, path, flags) {
          path >>>= 0;
        }
        var nowIsMonotonic = 1;
        var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
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
          HEAP32[tmPtr >>> 2 >>> 0] = date.getSeconds();
          HEAP32[tmPtr + 4 >>> 2 >>> 0] = date.getMinutes();
          HEAP32[tmPtr + 8 >>> 2 >>> 0] = date.getHours();
          HEAP32[tmPtr + 12 >>> 2 >>> 0] = date.getDate();
          HEAP32[tmPtr + 16 >>> 2 >>> 0] = date.getMonth();
          HEAP32[tmPtr + 20 >>> 2 >>> 0] = date.getFullYear() - 1900;
          HEAP32[tmPtr + 24 >>> 2 >>> 0] = date.getDay();
          var yday = ydayFromDate(date) | 0;
          HEAP32[tmPtr + 28 >>> 2 >>> 0] = yday;
          HEAP32[tmPtr + 36 >>> 2 >>> 0] = -(date.getTimezoneOffset() * 60);
          var start = new Date(date.getFullYear(), 0, 1);
          var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
          var winterOffset = start.getTimezoneOffset();
          var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
          HEAP32[tmPtr + 32 >>> 2 >>> 0] = dst;
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
          HEAPU32[timezone >>> 2 >>> 0] = stdTimezoneOffset * 60;
          HEAP32[daylight >>> 2 >>> 0] = Number(winterOffset != summerOffset);
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
          return globalThis.DUCKDB_RUNTIME.createDirectory(Module, path, pathLen);
        }
        function _duckdb_web_fs_directory_exists(path, pathLen) {
          path >>>= 0;
          return globalThis.DUCKDB_RUNTIME.checkDirectory(Module, path, pathLen);
        }
        function _duckdb_web_fs_directory_list_files(path, pathLen) {
          path >>>= 0;
          return globalThis.DUCKDB_RUNTIME.listDirectoryEntries(Module, path, pathLen);
        }
        function _duckdb_web_fs_directory_remove(path, pathLen) {
          path >>>= 0;
          return globalThis.DUCKDB_RUNTIME.removeDirectory(Module, path, pathLen);
        }
        function _duckdb_web_fs_file_close(fileId) {
          return globalThis.DUCKDB_RUNTIME.closeFile(Module, fileId);
        }
        function _duckdb_web_fs_file_drop_file(fileName, fileNameLen) {
          fileName >>>= 0;
          return globalThis.DUCKDB_RUNTIME.dropFile(Module, fileName, fileNameLen);
        }
        function _duckdb_web_fs_file_exists(path, pathLen) {
          path >>>= 0;
          return globalThis.DUCKDB_RUNTIME.checkFile(Module, path, pathLen);
        }
        function _duckdb_web_fs_file_move(from, fromLen, to, toLen) {
          from >>>= 0;
          to >>>= 0;
          return globalThis.DUCKDB_RUNTIME.moveFile(Module, from, fromLen, to, toLen);
        }
        function _duckdb_web_fs_file_open(fileId, flags) {
          return globalThis.DUCKDB_RUNTIME.openFile(Module, fileId, flags);
        }
        function _duckdb_web_fs_file_read(fileId, buf, size, location) {
          buf >>>= 0;
          return globalThis.DUCKDB_RUNTIME.readFile(Module, fileId, buf, size, location);
        }
        function _duckdb_web_fs_file_truncate(fileId, newSize) {
          return globalThis.DUCKDB_RUNTIME.truncateFile(Module, fileId, newSize);
        }
        function _duckdb_web_fs_file_write(fileId, buf, size, location) {
          buf >>>= 0;
          return globalThis.DUCKDB_RUNTIME.writeFile(Module, fileId, buf, size, location);
        }
        function _duckdb_web_fs_get_default_data_protocol(Module2) {
          return globalThis.DUCKDB_RUNTIME.getDefaultDataProtocol(Module2);
        }
        function _duckdb_web_fs_glob(path, pathLen) {
          path >>>= 0;
          return globalThis.DUCKDB_RUNTIME.glob(Module, path, pathLen);
        }
        function _duckdb_web_test_platform_feature(feature) {
          return globalThis.DUCKDB_RUNTIME.testPlatformFeature(Module, feature);
        }
        function _duckdb_web_udf_scalar_call(funcId, descPtr, descSize, ptrsPtr, ptrsSize, response) {
          funcId >>>= 0;
          descSize >>>= 0;
          ptrsSize >>>= 0;
          return globalThis.DUCKDB_RUNTIME.callScalarUDF(Module, funcId, descPtr, descSize, ptrsPtr, ptrsSize, response);
        }
        var readEmAsmArgsArray = [];
        var readEmAsmArgs = (sigPtr, buf) => {
          readEmAsmArgsArray.length = 0;
          var ch;
          while (ch = HEAPU8[sigPtr++ >>> 0]) {
            var wide = ch != 105;
            wide &= ch != 112;
            buf += wide && buf % 8 ? 4 : 0;
            readEmAsmArgsArray.push(ch == 112 ? HEAPU32[buf >>> 2 >>> 0] : ch == 105 ? HEAP32[buf >>> 2 >>> 0] : HEAPF64[buf >>> 3 >>> 0]);
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
        var _emscripten_date_now = () => Date.now();
        var getHeapMax = () => 4294901760;
        function _emscripten_get_heap_max() {
          return getHeapMax();
        }
        var _emscripten_get_now;
        _emscripten_get_now = () => performance.now();
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
          var oldSize = HEAPU8.length;
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
              strings.push(`${x}=${env[x]}`);
            }
            getEnvStrings.strings = strings;
          }
          return getEnvStrings.strings;
        };
        var stringToAscii = (str, buffer) => {
          for (var i = 0; i < str.length; ++i) {
            HEAP8[buffer++ >>> 0] = str.charCodeAt(i);
          }
          HEAP8[buffer >>> 0] = 0;
        };
        var _environ_get = function(__environ, environ_buf) {
          __environ >>>= 0;
          environ_buf >>>= 0;
          var bufSize = 0;
          getEnvStrings().forEach((string, i) => {
            var ptr = environ_buf + bufSize;
            HEAPU32[__environ + i * 4 >>> 2 >>> 0] = ptr;
            stringToAscii(string, ptr);
            bufSize += string.length + 1;
          });
          return 0;
        };
        var _environ_sizes_get = function(penviron_count, penviron_buf_size) {
          penviron_count >>>= 0;
          penviron_buf_size >>>= 0;
          var strings = getEnvStrings();
          HEAPU32[penviron_count >>> 2 >>> 0] = strings.length;
          var bufSize = 0;
          strings.forEach((string) => bufSize += string.length + 1);
          HEAPU32[penviron_buf_size >>> 2 >>> 0] = bufSize;
          return 0;
        };
        var runtimeKeepaliveCounter = 0;
        var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
        var _proc_exit = (code) => {
          var _a2;
          EXITSTATUS = code;
          if (!keepRuntimeAlive()) {
            (_a2 = Module["onExit"]) == null ? void 0 : _a2.call(Module, code);
            ABORT = true;
          }
          quit_(code, new ExitStatus(code));
        };
        var exitJS = (status, implicit) => {
          EXITSTATUS = status;
          _proc_exit(status);
        };
        var _exit = exitJS;
        var _fd_close = (fd) => 52;
        function _fd_fdstat_get(fd, pbuf) {
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
          HEAP8[pbuf >>> 0] = type;
          HEAP16[pbuf + 2 >>> 1 >>> 0] = flags;
          tempI64 = [rightsBase >>> 0, (tempDouble = rightsBase, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[pbuf + 8 >>> 2 >>> 0] = tempI64[0], HEAP32[pbuf + 12 >>> 2 >>> 0] = tempI64[1];
          tempI64 = [rightsInheriting >>> 0, (tempDouble = rightsInheriting, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[pbuf + 16 >>> 2 >>> 0] = tempI64[0], HEAP32[pbuf + 20 >>> 2 >>> 0] = tempI64[1];
          return 0;
        }
        function _fd_pread(fd, iov, iovcnt, offset_low, offset_high, pnum) {
          iov >>>= 0;
          iovcnt >>>= 0;
          var offset = convertI32PairToI53Checked(offset_low, offset_high);
          pnum >>>= 0;
          return 52;
        }
        function _fd_pwrite(fd, iov, iovcnt, offset_low, offset_high, pnum) {
          iov >>>= 0;
          iovcnt >>>= 0;
          var offset = convertI32PairToI53Checked(offset_low, offset_high);
          pnum >>>= 0;
          return 52;
        }
        function _fd_read(fd, iov, iovcnt, pnum) {
          iov >>>= 0;
          iovcnt >>>= 0;
          pnum >>>= 0;
          return 52;
        }
        function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
          var offset = convertI32PairToI53Checked(offset_low, offset_high);
          newOffset >>>= 0;
          return 70;
        }
        var _fd_sync = (fd) => 52;
        var printCharBuffers = [
          null,
          [],
          []
        ];
        var printChar = (stream, curr) => {
          var buffer = printCharBuffers[stream];
          if (curr === 0 || curr === 10) {
            (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        };
        function _fd_write(fd, iov, iovcnt, pnum) {
          iov >>>= 0;
          iovcnt >>>= 0;
          pnum >>>= 0;
          var num = 0;
          for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAPU32[iov >>> 2 >>> 0];
            var len = HEAPU32[iov + 4 >>> 2 >>> 0];
            iov += 8;
            for (var j = 0; j < len; j++) {
              printChar(fd, HEAPU8[ptr + j >>> 0]);
            }
            num += len;
          }
          HEAPU32[pnum >>> 2 >>> 0] = num;
          return 0;
        }
        function _getaddrinfo(node, service, hint, out2) {
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
            HEAP32[ai2 + 4 >>> 2 >>> 0] = family2;
            HEAP32[ai2 + 8 >>> 2 >>> 0] = type2;
            HEAP32[ai2 + 12 >>> 2 >>> 0] = proto2;
            HEAPU32[ai2 + 24 >>> 2 >>> 0] = canon;
            HEAPU32[ai2 + 20 >>> 2 >>> 0] = sa;
            if (family2 === 10) {
              HEAP32[ai2 + 16 >>> 2 >>> 0] = 28;
            } else {
              HEAP32[ai2 + 16 >>> 2 >>> 0] = 16;
            }
            HEAP32[ai2 + 28 >>> 2 >>> 0] = 0;
            return ai2;
          }
          if (hint) {
            flags = HEAP32[hint >>> 2 >>> 0];
            family = HEAP32[hint + 4 >>> 2 >>> 0];
            type = HEAP32[hint + 8 >>> 2 >>> 0];
            proto = HEAP32[hint + 12 >>> 2 >>> 0];
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
          if (hint !== 0 && HEAP32[hint >>> 2 >>> 0] & 2 && !node) {
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
            HEAPU32[out2 >>> 2 >>> 0] = ai;
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
            HEAPU32[out2 >>> 2 >>> 0] = ai;
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
          HEAPU32[out2 >>> 2 >>> 0] = ai;
          return 0;
        }
        var initRandomFill = () => {
          if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
            return (view) => crypto.getRandomValues(view);
          } else if (ENVIRONMENT_IS_NODE) {
            try {
              var crypto_module = require("crypto");
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
          randomFill(HEAPU8.subarray(buffer >>> 0, buffer + size >>> 0));
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
        function _llvm_eh_typeid_for(type) {
          type >>>= 0;
          return type;
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
          HEAP8.set(array, buffer >>> 0);
        };
        function _strftime(s, maxsize, format, tm) {
          s >>>= 0;
          maxsize >>>= 0;
          format >>>= 0;
          tm >>>= 0;
          var tm_zone = HEAPU32[tm + 40 >>> 2 >>> 0];
          var date = {
            tm_sec: HEAP32[tm >>> 2 >>> 0],
            tm_min: HEAP32[tm + 4 >>> 2 >>> 0],
            tm_hour: HEAP32[tm + 8 >>> 2 >>> 0],
            tm_mday: HEAP32[tm + 12 >>> 2 >>> 0],
            tm_mon: HEAP32[tm + 16 >>> 2 >>> 0],
            tm_year: HEAP32[tm + 20 >>> 2 >>> 0],
            tm_wday: HEAP32[tm + 24 >>> 2 >>> 0],
            tm_yday: HEAP32[tm + 28 >>> 2 >>> 0],
            tm_isdst: HEAP32[tm + 32 >>> 2 >>> 0],
            tm_gmtoff: HEAP32[tm + 36 >>> 2 >>> 0],
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
        var handleException = (e) => {
          if (e instanceof ExitStatus || e == "unwind") {
            return EXITSTATUS;
          }
          quit_(1, e);
        };
        var wasmTable;
        var getWasmTableEntry = (funcPtr) => wasmTable.get(funcPtr);
        var getCFunc = (ident) => {
          var func = Module["_" + ident];
          return func;
        };
        var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
        Module["stackAlloc"] = stackAlloc;
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
          var module3 = new WebAssembly.Module(bytes);
          var instance = new WebAssembly.Instance(module3, {
            "e": {
              "t": wasmTable,
              "r": setTempRet0
            }
          });
          var wrappedFunc = instance.exports["f"];
          return wrappedFunc;
        };
        var getTempRet0 = (val) => __emscripten_tempret_get();
        var wasmImports = {
          q: ___cxa_begin_catch,
          Db: ___cxa_current_primary_exception,
          s: ___cxa_end_catch,
          a: ___cxa_find_matching_catch_2,
          k: ___cxa_find_matching_catch_3,
          C: ___cxa_find_matching_catch_4,
          ia: ___cxa_find_matching_catch_5,
          Ga: ___cxa_rethrow,
          sb: ___cxa_rethrow_primary_exception,
          r: ___cxa_throw,
          M: ___cxa_uncaught_exceptions,
          c: ___resumeException,
          _a: ___syscall_bind,
          Za: ___syscall_connect,
          uh: ___syscall_faccessat,
          X: ___syscall_fcntl64,
          th: ___syscall_fstat64,
          Sb: ___syscall_ftruncate64,
          vh: ___syscall_getcwd,
          oh: ___syscall_getdents64,
          Ua: ___syscall_getpeername,
          Ta: ___syscall_getsockname,
          Xa: ___syscall_getsockopt,
          wa: ___syscall_ioctl,
          qh: ___syscall_lstat64,
          ph: ___syscall_mkdirat,
          rh: ___syscall_newfstatat,
          Ea: ___syscall_openat,
          Ya: ___syscall_poll,
          Va: ___syscall_recvfrom,
          mh: ___syscall_renameat,
          Pa: ___syscall_rmdir,
          Wa: ___syscall_sendto,
          Da: ___syscall_socket,
          sh: ___syscall_stat64,
          wh: ___syscall_statfs64,
          Qa: ___syscall_unlinkat,
          ab: __emscripten_get_now_is_monotonic,
          Tg: __emval_call_method,
          Ug: __emval_decref,
          Vg: __emval_get_global,
          Sg: __emval_get_method_caller,
          Rg: __emval_run_destructors,
          Pb: __localtime_js,
          kh: __tzset_js,
          P: _abort,
          $g: _duckdb_web_fs_directory_create,
          ah: _duckdb_web_fs_directory_exists,
          Zg: _duckdb_web_fs_directory_list_files,
          _g: _duckdb_web_fs_directory_remove,
          Ka: _duckdb_web_fs_file_close,
          dh: _duckdb_web_fs_file_drop_file,
          Xg: _duckdb_web_fs_file_exists,
          Yg: _duckdb_web_fs_file_move,
          ch: _duckdb_web_fs_file_open,
          ra: _duckdb_web_fs_file_read,
          bh: _duckdb_web_fs_file_truncate,
          ya: _duckdb_web_fs_file_write,
          eh: _duckdb_web_fs_get_default_data_protocol,
          Wg: _duckdb_web_fs_glob,
          Ia: _duckdb_web_test_platform_feature,
          fh: _duckdb_web_udf_scalar_call,
          ka: _emscripten_asm_const_ptr,
          bb: _emscripten_date_now,
          cb: _emscripten_get_heap_max,
          qa: _emscripten_get_now,
          Wf: _emscripten_resize_heap,
          wd: _environ_get,
          Hd: _environ_sizes_get,
          zg: _exit,
          ga: _fd_close,
          Oe: _fd_fdstat_get,
          Ub: _fd_pread,
          Tb: _fd_pwrite,
          Ha: _fd_read,
          Og: _fd_seek,
          nh: _fd_sync,
          xa: _fd_write,
          $a: _getaddrinfo,
          lh: _getentropy,
          Ca: _getnameinfo,
          K: invoke_dd,
          ba: invoke_df,
          E: invoke_di,
          Ra: invoke_didd,
          Z: invoke_dii,
          Ja: invoke_diii,
          ea: invoke_diiii,
          Y: invoke_diiiid,
          R: invoke_diiiiid,
          te: invoke_diij,
          ic: invoke_diiji,
          db: invoke_diijj,
          gc: invoke_dij,
          _e: invoke_dijjj,
          Ge: invoke_dijjjj,
          De: invoke_dijjjjij,
          re: invoke_dj,
          se: invoke_djij,
          V: invoke_fi,
          La: invoke_fiii,
          sa: invoke_fiiii,
          jc: invoke_fiiji,
          He: invoke_fijjjj,
          Ee: invoke_fijjjjij,
          p: invoke_i,
          D: invoke_id,
          ih: invoke_idd,
          gh: invoke_idi,
          T: invoke_idii,
          na: invoke_idiii,
          va: invoke_idiiii,
          Q: invoke_if,
          jh: invoke_iff,
          hh: invoke_ifi,
          _: invoke_ifii,
          d: invoke_ii,
          N: invoke_iid,
          F: invoke_iidd,
          Oa: invoke_iidi,
          z: invoke_iidii,
          Na: invoke_iidiii,
          Ma: invoke_iidiiii,
          ac: invoke_iidj,
          za: invoke_iif,
          ha: invoke_iifii,
          b: invoke_iii,
          aa: invoke_iiid,
          xd: invoke_iiidj,
          g: invoke_iiii,
          Sa: invoke_iiiid,
          j: invoke_iiiii,
          Fa: invoke_iiiiid,
          o: invoke_iiiiii,
          xh: invoke_iiiiiid,
          w: invoke_iiiiiii,
          v: invoke_iiiiiiii,
          H: invoke_iiiiiiiii,
          $: invoke_iiiiiiiiii,
          ca: invoke_iiiiiiiiiii,
          fa: invoke_iiiiiiiiiiii,
          t: invoke_iiiiiiiiiiiii,
          A: invoke_iiiiiiiiiiiiii,
          W: invoke_iiiiiiiiiiiiiiiii,
          x: invoke_iiiiiiiiiiiiiiiiii,
          Ld: invoke_iiiiiiiiiiiji,
          ud: invoke_iiiiiiiiiiijiii,
          gb: invoke_iiiiiiiiiiijjidjiii,
          sd: invoke_iiiiiiiiiiji,
          zd: invoke_iiiiiiiiij,
          Gd: invoke_iiiiiiiiiji,
          ff: invoke_iiiiiiiiijii,
          td: invoke_iiiiiiiiijiiiiiiii,
          Pd: invoke_iiiiiiiij,
          Fd: invoke_iiiiiiiiji,
          Vd: invoke_iiiiiiiijii,
          Md: invoke_iiiiiiiijj,
          gf: invoke_iiiiiiij,
          vd: invoke_iiiiiiiji,
          Kd: invoke_iiiiiiijji,
          Ff: invoke_iiiiiiijjjjjjii,
          $f: invoke_iiiiiij,
          ae: invoke_iiiiiiji,
          Ie: invoke_iiiiiijii,
          Yd: invoke_iiiiiijji,
          dd: invoke_iiiiiijjiiiiiiiji,
          Qc: invoke_iiiiiijjiijjji,
          Mg: invoke_iiiiij,
          Ye: invoke_iiiiiji,
          Vf: invoke_iiiiijii,
          fg: invoke_iiiiijiii,
          be: invoke_iiiiijiiii,
          Sd: invoke_iiiiijiiiii,
          Dd: invoke_iiiiijij,
          Lg: invoke_iiiiijj,
          rd: invoke_iiiiijjii,
          qd: invoke_iiiiijjij,
          Gc: invoke_iiiiijjj,
          ug: invoke_iiiij,
          cf: invoke_iiiiji,
          df: invoke_iiiijii,
          Rd: invoke_iiiijiii,
          pd: invoke_iiiijiiiij,
          od: invoke_iiiijiiij,
          id: invoke_iiiijiijjiii,
          jb: invoke_iiiijijj,
          Xf: invoke_iiiijj,
          Jd: invoke_iiiijji,
          Oc: invoke_iiiijjii,
          hf: invoke_iiiijjiii,
          kg: invoke_iiiijjj,
          kb: invoke_iiiijjjj,
          qb: invoke_iiiijjjji,
          Ig: invoke_iiij,
          tg: invoke_iiiji,
          ag: invoke_iiijii,
          nc: invoke_iiijiii,
          fb: invoke_iiijiiiii,
          yb: invoke_iiijiiiijj,
          wb: invoke_iiijiiij,
          tc: invoke_iiijiiiji,
          Hb: invoke_iiijiiijj,
          Kb: invoke_iiijiij,
          Gb: invoke_iiijiijj,
          pg: invoke_iiijij,
          Xe: invoke_iiijijj,
          Jg: invoke_iiijj,
          de: invoke_iiijji,
          Nc: invoke_iiijjii,
          Nf: invoke_iiijjiii,
          yd: invoke_iiijjijj,
          Pc: invoke_iiijjijjiii,
          Ae: invoke_iiijjj,
          rc: invoke_iiijjji,
          _d: invoke_iiijjjijj,
          Lc: invoke_iiijjjj,
          Zd: invoke_iiijjjjj,
          Yc: invoke_iiijjjjjiiiii,
          Eg: invoke_iij,
          lb: invoke_iijd,
          rg: invoke_iiji,
          eg: invoke_iijii,
          qg: invoke_iijiii,
          Sf: invoke_iijiiii,
          fe: invoke_iijiiiii,
          hd: invoke_iijiiiiiij,
          xb: invoke_iijiiijj,
          zb: invoke_iijiijj,
          kc: invoke_iijij,
          lf: invoke_iijiji,
          ng: invoke_iijj,
          Mf: invoke_iijji,
          uc: invoke_iijjii,
          Of: invoke_iijjiiiii,
          Od: invoke_iijjj,
          Zb: invoke_iijjji,
          _b: invoke_iijjjii,
          yf: invoke_iijjjj,
          jg: invoke_ij,
          sf: invoke_iji,
          pe: invoke_ijii,
          ve: invoke_ijij,
          bd: invoke_ijji,
          mg: invoke_ijjiii,
          If: invoke_ijjj,
          Kf: invoke_j,
          vg: invoke_jd,
          wg: invoke_jf,
          Fg: invoke_ji,
          Cg: invoke_jii,
          ef: invoke_jiii,
          Qg: invoke_jiiii,
          Tf: invoke_jiiiii,
          Td: invoke_jiiiiii,
          Bd: invoke_jiiiiiii,
          $b: invoke_jiiiiiiii,
          Wd: invoke_jiiiiiji,
          bc: invoke_jiiiiijiiii,
          mf: invoke_jiiiij,
          jf: invoke_jiiiiji,
          dc: invoke_jiiiijii,
          fc: invoke_jiiiijiii,
          yc: invoke_jiiiijji,
          Hf: invoke_jiiij,
          Uc: invoke_jiiiji,
          bf: invoke_jiiijii,
          wf: invoke_jiiijiii,
          Pe: invoke_jiiijiijiii,
          Sc: invoke_jiiijij,
          $d: invoke_jiiijj,
          Ed: invoke_jiiijjj,
          me: invoke_jiij,
          Rc: invoke_jiiji,
          Qd: invoke_jiijii,
          Qb: invoke_jiijiii,
          cc: invoke_jiijiiii,
          Rb: invoke_jiijiiiii,
          Tc: invoke_jiijiij,
          Ad: invoke_jiijj,
          ec: invoke_jiijjiii,
          og: invoke_jij,
          wc: invoke_jiji,
          ub: invoke_jijiii,
          Ce: invoke_jijij,
          lg: invoke_jijj,
          pb: invoke_jijji,
          Hc: invoke_jijjij,
          $e: invoke_jijjj,
          vb: invoke_jijjjj,
          Bg: invoke_jj,
          zf: invoke_jji,
          we: invoke_jjij,
          Ef: invoke_jjj,
          qe: invoke_jjjd,
          Af: invoke_jjjii,
          ne: invoke_jjjij,
          Bf: invoke_jjjji,
          l: invoke_v,
          h: invoke_vi,
          G: invoke_vid,
          Ba: invoke_viddddi,
          L: invoke_vidi,
          ta: invoke_vidii,
          U: invoke_vif,
          I: invoke_vifi,
          ua: invoke_vifii,
          f: invoke_vii,
          da: invoke_viid,
          la: invoke_viidii,
          Kg: invoke_viif,
          ma: invoke_viifii,
          e: invoke_viii,
          i: invoke_viiii,
          m: invoke_viiiii,
          n: invoke_viiiiii,
          B: invoke_viiiiiii,
          u: invoke_viiiiiiii,
          O: invoke_viiiiiiiii,
          J: invoke_viiiiiiiiii,
          oa: invoke_viiiiiiiiiii,
          Aa: invoke_viiiiiiiiiiii,
          ja: invoke_viiiiiiiiiiiii,
          pa: invoke_viiiiiiiiiiiiiii,
          Wb: invoke_viiiiiiiijjjji,
          Pf: invoke_viiiiiiij,
          _c: invoke_viiiiiiijij,
          nf: invoke_viiiiiij,
          vc: invoke_viiiiiiji,
          Xb: invoke_viiiiiijii,
          Fc: invoke_viiiiiijij,
          $c: invoke_viiiiiijj,
          mb: invoke_viiiiiijji,
          of: invoke_viiiiij,
          Ud: invoke_viiiiiji,
          Gf: invoke_viiiiijii,
          Be: invoke_viiiiijiiii,
          Zc: invoke_viiiiijij,
          bg: invoke_viiiiijj,
          Yb: invoke_viiiiijjii,
          Mb: invoke_viiiiijjji,
          Dg: invoke_viiiij,
          pf: invoke_viiiiji,
          ad: invoke_viiiijii,
          Eb: invoke_viiiijiii,
          ie: invoke_viiiijiiii,
          je: invoke_viiiijiiiii,
          kf: invoke_viiiijiiiiiiii,
          ed: invoke_viiiijiijjii,
          Ec: invoke_viiiijij,
          ib: invoke_viiiijijj,
          Me: invoke_viiiijijji,
          Fe: invoke_viiiijj,
          xc: invoke_viiiijji,
          Je: invoke_viiiijjii,
          Le: invoke_viiiijjij,
          tb: invoke_viiiijjj,
          mc: invoke_viiiijjjii,
          hb: invoke_viiiijjjj,
          sg: invoke_viiij,
          Jf: invoke_viiijd,
          eb: invoke_viiijdjji,
          xg: invoke_viiiji,
          ig: invoke_viiijii,
          ce: invoke_viiijiii,
          sc: invoke_viiijiiii,
          zc: invoke_viiijiiiii,
          Se: invoke_viiijiiiijjj,
          Ke: invoke_viiijiiijii,
          Qe: invoke_viiijiij,
          Vc: invoke_viiijiiji,
          jd: invoke_viiijij,
          af: invoke_viiijiji,
          We: invoke_viiijijj,
          Fb: invoke_viiijijjj,
          Hg: invoke_viiijj,
          hg: invoke_viiijji,
          Mc: invoke_viiijjii,
          Id: invoke_viiijjiii,
          Ac: invoke_viiijjiiiii,
          Ve: invoke_viiijjij,
          rf: invoke_viiijjj,
          oc: invoke_viiijjji,
          Bc: invoke_viiijjjiiiii,
          Xd: invoke_viiijjjijj,
          tf: invoke_viiijjjj,
          md: invoke_viiijjjjii,
          Cc: invoke_viiijjjjiiiii,
          Dc: invoke_viiijjjjjiiiii,
          Gg: invoke_viij,
          hc: invoke_viijd,
          dg: invoke_viiji,
          Ng: invoke_viijii,
          Rf: invoke_viijiii,
          cd: invoke_viijiiii,
          Df: invoke_viijiiiii,
          Kc: invoke_viijiiiiii,
          Te: invoke_viijiiiij,
          Jc: invoke_viijiiij,
          Jb: invoke_viijiij,
          Lb: invoke_viijiijj,
          fd: invoke_viijiijji,
          xf: invoke_viijij,
          Cb: invoke_viijiji,
          Ne: invoke_viijijiiii,
          Re: invoke_viijijiiiijjj,
          qc: invoke_viijijij,
          kd: invoke_viijijijij,
          nd: invoke_viijijijiji,
          Nb: invoke_viijijj,
          Pg: invoke_viijj,
          vf: invoke_viijji,
          Cd: invoke_viijjii,
          gd: invoke_viijjiiij,
          Zf: invoke_viijjj,
          qf: invoke_viijjji,
          rb: invoke_viijjjiii,
          ld: invoke_viijjjji,
          Xc: invoke_viijjjjjiiiii,
          Ag: invoke_vij,
          yg: invoke_viji,
          Uf: invoke_vijii,
          Qf: invoke_vijiii,
          gg: invoke_vijiiii,
          he: invoke_vijiiiii,
          ge: invoke_vijiiiiii,
          ob: invoke_vijiiiiiiii,
          nb: invoke_vijiiiij,
          Bb: invoke_vijiiiiji,
          Ic: invoke_vijiiiji,
          Ib: invoke_vijiij,
          lc: invoke_vijiiji,
          ue: invoke_vijij,
          ye: invoke_vijiji,
          Nd: invoke_vijijiiiijjj,
          Ue: invoke_vijijiij,
          uf: invoke_vijijj,
          Ze: invoke_vijijjd,
          Ob: invoke_vijijjji,
          _f: invoke_vijj,
          Lf: invoke_vijji,
          Ab: invoke_vijjiii,
          xe: invoke_vijjij,
          ze: invoke_vijjj,
          ke: invoke_vijjji,
          cg: invoke_vj,
          Vb: invoke_vji,
          oe: invoke_vjii,
          Cf: invoke_vjiiii,
          ee: invoke_vjiiij,
          le: invoke_vjij,
          pc: invoke_vjj,
          Yf: invoke_vjjii,
          Wc: invoke_vjjijij,
          y: _llvm_eh_typeid_for,
          S: _strftime_l
        };
        var wasmExports = createWasm();
        var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["Ah"])(a0, a1);
        var _duckdb_web_fs_glob_add_path = Module["_duckdb_web_fs_glob_add_path"] = (a0) => (_duckdb_web_fs_glob_add_path = Module["_duckdb_web_fs_glob_add_path"] = wasmExports["Ch"])(a0);
        var _duckdb_web_clear_response = Module["_duckdb_web_clear_response"] = () => (_duckdb_web_clear_response = Module["_duckdb_web_clear_response"] = wasmExports["Dh"])();
        var _duckdb_web_fail_with = Module["_duckdb_web_fail_with"] = (a0) => (_duckdb_web_fail_with = Module["_duckdb_web_fail_with"] = wasmExports["Eh"])(a0);
        var _duckdb_web_reset = Module["_duckdb_web_reset"] = (a0) => (_duckdb_web_reset = Module["_duckdb_web_reset"] = wasmExports["Fh"])(a0);
        var _duckdb_web_connect = Module["_duckdb_web_connect"] = () => (_duckdb_web_connect = Module["_duckdb_web_connect"] = wasmExports["Gh"])();
        var _duckdb_web_disconnect = Module["_duckdb_web_disconnect"] = (a0) => (_duckdb_web_disconnect = Module["_duckdb_web_disconnect"] = wasmExports["Hh"])(a0);
        var _duckdb_web_flush_files = Module["_duckdb_web_flush_files"] = () => (_duckdb_web_flush_files = Module["_duckdb_web_flush_files"] = wasmExports["Ih"])();
        var _duckdb_web_flush_file = Module["_duckdb_web_flush_file"] = (a0) => (_duckdb_web_flush_file = Module["_duckdb_web_flush_file"] = wasmExports["Jh"])(a0);
        var _duckdb_web_open = Module["_duckdb_web_open"] = (a0, a1) => (_duckdb_web_open = Module["_duckdb_web_open"] = wasmExports["Kh"])(a0, a1);
        var _duckdb_web_get_global_file_info = Module["_duckdb_web_get_global_file_info"] = (a0, a1) => (_duckdb_web_get_global_file_info = Module["_duckdb_web_get_global_file_info"] = wasmExports["Lh"])(a0, a1);
        var _duckdb_web_collect_file_stats = Module["_duckdb_web_collect_file_stats"] = (a0, a1, a2) => (_duckdb_web_collect_file_stats = Module["_duckdb_web_collect_file_stats"] = wasmExports["Mh"])(a0, a1, a2);
        var _duckdb_web_export_file_stats = Module["_duckdb_web_export_file_stats"] = (a0, a1) => (_duckdb_web_export_file_stats = Module["_duckdb_web_export_file_stats"] = wasmExports["Nh"])(a0, a1);
        var _duckdb_web_fs_drop_file = Module["_duckdb_web_fs_drop_file"] = (a0, a1) => (_duckdb_web_fs_drop_file = Module["_duckdb_web_fs_drop_file"] = wasmExports["Oh"])(a0, a1);
        var _duckdb_web_fs_drop_files = Module["_duckdb_web_fs_drop_files"] = (a0, a1, a2) => (_duckdb_web_fs_drop_files = Module["_duckdb_web_fs_drop_files"] = wasmExports["Ph"])(a0, a1, a2);
        var _duckdb_web_fs_glob_file_infos = Module["_duckdb_web_fs_glob_file_infos"] = (a0, a1) => (_duckdb_web_fs_glob_file_infos = Module["_duckdb_web_fs_glob_file_infos"] = wasmExports["Qh"])(a0, a1);
        var _duckdb_web_fs_get_file_info_by_id = Module["_duckdb_web_fs_get_file_info_by_id"] = (a0, a1, a2) => (_duckdb_web_fs_get_file_info_by_id = Module["_duckdb_web_fs_get_file_info_by_id"] = wasmExports["Rh"])(a0, a1, a2);
        var _duckdb_web_fs_get_file_info_by_name = Module["_duckdb_web_fs_get_file_info_by_name"] = (a0, a1, a2) => (_duckdb_web_fs_get_file_info_by_name = Module["_duckdb_web_fs_get_file_info_by_name"] = wasmExports["Sh"])(a0, a1, a2);
        var _duckdb_web_fs_register_file_url = Module["_duckdb_web_fs_register_file_url"] = (a0, a1, a2, a3, a4) => (_duckdb_web_fs_register_file_url = Module["_duckdb_web_fs_register_file_url"] = wasmExports["Th"])(a0, a1, a2, a3, a4);
        var _duckdb_web_fs_register_file_buffer = Module["_duckdb_web_fs_register_file_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_fs_register_file_buffer = Module["_duckdb_web_fs_register_file_buffer"] = wasmExports["Uh"])(a0, a1, a2, a3);
        var _duckdb_web_copy_file_to_buffer = Module["_duckdb_web_copy_file_to_buffer"] = (a0, a1) => (_duckdb_web_copy_file_to_buffer = Module["_duckdb_web_copy_file_to_buffer"] = wasmExports["Vh"])(a0, a1);
        var _duckdb_web_copy_file_to_path = Module["_duckdb_web_copy_file_to_path"] = (a0, a1, a2) => (_duckdb_web_copy_file_to_path = Module["_duckdb_web_copy_file_to_path"] = wasmExports["Wh"])(a0, a1, a2);
        var _duckdb_web_get_version = Module["_duckdb_web_get_version"] = (a0) => (_duckdb_web_get_version = Module["_duckdb_web_get_version"] = wasmExports["Xh"])(a0);
        var _duckdb_web_get_feature_flags = Module["_duckdb_web_get_feature_flags"] = () => (_duckdb_web_get_feature_flags = Module["_duckdb_web_get_feature_flags"] = wasmExports["Yh"])();
        var _duckdb_web_tokenize = Module["_duckdb_web_tokenize"] = (a0, a1) => (_duckdb_web_tokenize = Module["_duckdb_web_tokenize"] = wasmExports["Zh"])(a0, a1);
        var _duckdb_web_tokenize_buffer = Module["_duckdb_web_tokenize_buffer"] = (a0, a1, a2) => (_duckdb_web_tokenize_buffer = Module["_duckdb_web_tokenize_buffer"] = wasmExports["_h"])(a0, a1, a2);
        var _duckdb_web_udf_scalar_create = Module["_duckdb_web_udf_scalar_create"] = (a0, a1, a2) => (_duckdb_web_udf_scalar_create = Module["_duckdb_web_udf_scalar_create"] = wasmExports["$h"])(a0, a1, a2);
        var _duckdb_web_prepared_create = Module["_duckdb_web_prepared_create"] = (a0, a1, a2) => (_duckdb_web_prepared_create = Module["_duckdb_web_prepared_create"] = wasmExports["ai"])(a0, a1, a2);
        var _duckdb_web_prepared_create_buffer = Module["_duckdb_web_prepared_create_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_create_buffer = Module["_duckdb_web_prepared_create_buffer"] = wasmExports["bi"])(a0, a1, a2, a3);
        var _duckdb_web_prepared_close = Module["_duckdb_web_prepared_close"] = (a0, a1, a2) => (_duckdb_web_prepared_close = Module["_duckdb_web_prepared_close"] = wasmExports["ci"])(a0, a1, a2);
        var _duckdb_web_prepared_run = Module["_duckdb_web_prepared_run"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_run = Module["_duckdb_web_prepared_run"] = wasmExports["di"])(a0, a1, a2, a3);
        var _duckdb_web_prepared_send = Module["_duckdb_web_prepared_send"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_send = Module["_duckdb_web_prepared_send"] = wasmExports["ei"])(a0, a1, a2, a3);
        var _duckdb_web_query_run = Module["_duckdb_web_query_run"] = (a0, a1, a2) => (_duckdb_web_query_run = Module["_duckdb_web_query_run"] = wasmExports["fi"])(a0, a1, a2);
        var _duckdb_web_query_run_buffer = Module["_duckdb_web_query_run_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_query_run_buffer = Module["_duckdb_web_query_run_buffer"] = wasmExports["gi"])(a0, a1, a2, a3);
        var _duckdb_web_pending_query_start = Module["_duckdb_web_pending_query_start"] = (a0, a1, a2, a3) => (_duckdb_web_pending_query_start = Module["_duckdb_web_pending_query_start"] = wasmExports["hi"])(a0, a1, a2, a3);
        var _duckdb_web_pending_query_start_buffer = Module["_duckdb_web_pending_query_start_buffer"] = (a0, a1, a2, a3, a4) => (_duckdb_web_pending_query_start_buffer = Module["_duckdb_web_pending_query_start_buffer"] = wasmExports["ii"])(a0, a1, a2, a3, a4);
        var _duckdb_web_pending_query_poll = Module["_duckdb_web_pending_query_poll"] = (a0, a1, a2) => (_duckdb_web_pending_query_poll = Module["_duckdb_web_pending_query_poll"] = wasmExports["ji"])(a0, a1, a2);
        var _duckdb_web_pending_query_cancel = Module["_duckdb_web_pending_query_cancel"] = (a0, a1) => (_duckdb_web_pending_query_cancel = Module["_duckdb_web_pending_query_cancel"] = wasmExports["ki"])(a0, a1);
        var _duckdb_web_query_fetch_results = Module["_duckdb_web_query_fetch_results"] = (a0, a1) => (_duckdb_web_query_fetch_results = Module["_duckdb_web_query_fetch_results"] = wasmExports["li"])(a0, a1);
        var _duckdb_web_get_tablenames = Module["_duckdb_web_get_tablenames"] = (a0, a1, a2) => (_duckdb_web_get_tablenames = Module["_duckdb_web_get_tablenames"] = wasmExports["mi"])(a0, a1, a2);
        var _duckdb_web_get_tablenames_buffer = Module["_duckdb_web_get_tablenames_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_get_tablenames_buffer = Module["_duckdb_web_get_tablenames_buffer"] = wasmExports["ni"])(a0, a1, a2, a3);
        var _duckdb_web_insert_arrow_from_ipc_stream = Module["_duckdb_web_insert_arrow_from_ipc_stream"] = (a0, a1, a2, a3, a4) => (_duckdb_web_insert_arrow_from_ipc_stream = Module["_duckdb_web_insert_arrow_from_ipc_stream"] = wasmExports["oi"])(a0, a1, a2, a3, a4);
        var _duckdb_web_insert_csv_from_path = Module["_duckdb_web_insert_csv_from_path"] = (a0, a1, a2, a3) => (_duckdb_web_insert_csv_from_path = Module["_duckdb_web_insert_csv_from_path"] = wasmExports["pi"])(a0, a1, a2, a3);
        var _duckdb_web_insert_json_from_path = Module["_duckdb_web_insert_json_from_path"] = (a0, a1, a2, a3) => (_duckdb_web_insert_json_from_path = Module["_duckdb_web_insert_json_from_path"] = wasmExports["qi"])(a0, a1, a2, a3);
        var _malloc = Module["_malloc"] = (a0) => (_malloc = Module["_malloc"] = wasmExports["ui"])(a0);
        var _free = Module["_free"] = (a0) => (_free = Module["_free"] = wasmExports["vi"])(a0);
        var _calloc = Module["_calloc"] = (a0, a1) => (_calloc = Module["_calloc"] = wasmExports["wi"])(a0, a1);
        var __emscripten_tempret_set = (a0) => (__emscripten_tempret_set = wasmExports["yi"])(a0);
        var __emscripten_tempret_get = () => (__emscripten_tempret_get = wasmExports["zi"])();
        var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["Ai"])(a0);
        var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["Bi"])(a0);
        var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["Ci"])();
        function invoke_iii(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_v(index) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)();
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vii(index, a1, a2) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_fiii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_diii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viif(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viid(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ii(index, a1) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vi(index, a1) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_i(index) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)();
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_fi(index, a1) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_di(index, a1) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_idiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiid(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vid(index, a1, a2) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_id(index, a1) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_dd(index, a1) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_if(index, a1) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_dii(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viddddi(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_diiiid(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_diiiiid(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiid(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_idii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iid(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iidii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_didd(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vifi(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vif(index, a1, a2) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vidi(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iidd(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_df(index, a1) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viifii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viidii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_diiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiid(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iff(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_idd(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ifii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ifi(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_idi(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_idiiii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iif(index, a1, a2) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iidi(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iidiii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iidiiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iifii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vifii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vidii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_fiiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return getWasmTableEntry(index)(a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_jiiii(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijj(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_viijj(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_viijii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiij(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_iiiiij(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijj(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_iiijj(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiij(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_iiij(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijj(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_viiijj(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viij(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            dynCall_viij(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ji(index, a1) {
          var sp = stackSave();
          try {
            return dynCall_ji(index, a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iij(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return dynCall_iij(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiij(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_viiiij(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jii(index, a1, a2) {
          var sp = stackSave();
          try {
            return dynCall_jii(index, a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jj(index, a1, a2) {
          var sp = stackSave();
          try {
            return dynCall_jj(index, a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vij(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            dynCall_vij(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viji(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            dynCall_viji(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiji(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_viiiji(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jf(index, a1) {
          var sp = stackSave();
          try {
            return dynCall_jf(index, a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jd(index, a1) {
          var sp = stackSave();
          try {
            return dynCall_jd(index, a1);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiij(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_iiiij(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiji(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_iiiji(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiij(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            dynCall_viiij(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiji(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_iiji(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_iijiii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijij(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iiijij(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jij(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return dynCall_jij(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijj(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_iijj(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ijjiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_ijjiii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jijj(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_jijj(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ij(index, a1, a2) {
          var sp = stackSave();
          try {
            return dynCall_ij(index, a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_viiijii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viiijji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_vijiiii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_iijii(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiji(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            dynCall_viiji(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vj(index, a1, a2) {
          var sp = stackSave();
          try {
            dynCall_vj(index, a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_iiijii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiij(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiij(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijj(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            dynCall_vijj(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijjj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viijjj(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vjjii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_vjjii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijj(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iiiijj(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            dynCall_vijii(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_jiiiii(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iijiiii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_viijiii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_vijiii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iijjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijji(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_iijji(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijji(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_vijji(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_j(index) {
          var sp = stackSave();
          try {
            return dynCall_j(index);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijd(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_viiijd(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ijjj(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_ijjj(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiij(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_jiiij(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiijjjjjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiijjjjjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jjj(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_jjj(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vjiiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_vjiiii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jjjji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jjjji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jjjii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jjjii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jji(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return dynCall_jji(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijij(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_viijij(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_viijji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijijj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_vijijj(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iji(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return dynCall_iji(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_viiiiji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiij(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_viiiiij(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiij(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jiiiij(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijiji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iijiji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          var sp = stackSave();
          try {
            dynCall_viiiijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiiji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jiiiiji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return dynCall_jiii(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iiiijii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiji(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_iiiiji(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiijii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jiiijii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiijiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jijjj(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jijjj(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_dijjj(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_dijjj(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijijjd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_vijijjd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijijiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_vijijiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viijiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
          var sp = stackSave();
          try {
            dynCall_viiijiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijijiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
          var sp = stackSave();
          try {
            dynCall_viijijiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiijiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiijiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_jiiijiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viijijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiiijijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiijiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_fijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_fijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_dijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_dijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_fijjjjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_fijjjjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_dijjjjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_dijjjjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jijij(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jijij(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijjj(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_vijjj(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_vijiji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijjij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_vijjij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jjij(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_jjij(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ijij(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_ijij(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijij(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            dynCall_vijij(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_diij(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_diij(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_djij(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_djij(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_dj(index, a1, a2) {
          var sp = stackSave();
          try {
            return dynCall_dj(index, a1, a2);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jjjd(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_jjjd(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ijii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_ijii(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vjii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            dynCall_vjii(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jjjij(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jjjij(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiij(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_jiij(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vjij(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            dynCall_vjij(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijjji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_vijjji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_vijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_vijiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vjiiij(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_vjiiij(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijji(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iiijji(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiijj(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jiiijj(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjjijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
          var sp = stackSave();
          try {
            return dynCall_iiijjjijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_iiijjjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjjijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          var sp = stackSave();
          try {
            dynCall_viiijjjijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jiiiiii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiijii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jiijii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijjj(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iijjj(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijijiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
          var sp = stackSave();
          try {
            dynCall_vijijiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_jiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijjii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viijjii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jiiiiiii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiijj(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jiijj(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiijjijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiidj(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_iiidj(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiijiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiijiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijijijiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          var sp = stackSave();
          try {
            dynCall_viijijijiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
          var sp = stackSave();
          try {
            dynCall_viiijjjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijjjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viijjjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijijijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
          var sp = stackSave();
          try {
            dynCall_viijijijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viiijij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          var sp = stackSave();
          try {
            return dynCall_iiiijiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iijiiiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijjiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viijjiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viijiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          var sp = stackSave();
          try {
            dynCall_viiiijiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiijjiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiijjiiiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_ijji(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_ijji(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiiiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
          var sp = stackSave();
          try {
            return dynCall_iiijjjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijjjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
          var sp = stackSave();
          try {
            dynCall_viijjjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vjjijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_vjjijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiijiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiji(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jiiiji(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiijiij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jiijiij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiji(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_jiiji(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiijjiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiijjiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          var sp = stackSave();
          try {
            return dynCall_iiijjijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viijiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viijiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_vijiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jijjij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jijjij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiiiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiiijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18) {
          var sp = stackSave();
          try {
            dynCall_viiijjjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
          var sp = stackSave();
          try {
            dynCall_viiijjjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          var sp = stackSave();
          try {
            dynCall_viiijjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiijjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_jiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiji(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_jiji(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijjii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iijjii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiijiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viijijij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vjj(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            dynCall_vjj(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_iiijiii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiiijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_vijiiji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijij(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_iijij(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_fiiji(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_fiiji(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_diiji(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            return dynCall_diiji(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijd(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
            dynCall_viijd(index, a1, a2, a3, a4, a5);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_dij(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            return dynCall_dij(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_jiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_jiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_jiiiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iidj(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_iidj(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_jiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijjji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iijjji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiiiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiiiijjjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
          var sp = stackSave();
          try {
            dynCall_viiiiiiiijjjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vji(index, a1, a2, a3) {
          var sp = stackSave();
          try {
            dynCall_vji(index, a1, a2, a3);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_jiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jiijiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            return dynCall_jiijiii(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_vijijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiiiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viijiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            return dynCall_iiijiij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viijiij(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiij(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
            dynCall_vijiij(index, a1, a2, a3, a4, a5, a6, a7);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiijiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiijiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiijijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_viiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijiji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_viijiji(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_vijiiiiji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
          var sp = stackSave();
          try {
            dynCall_vijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iijiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_iiijiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iijiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiijiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_jijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jijiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jijiii(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            dynCall_viiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viijjjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viijjjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijjjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            return dynCall_iiiijjjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_jijji(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_jijji(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_vijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_vijiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            dynCall_vijiiiij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiiiiijji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iijd(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
            return dynCall_iijd(index, a1, a2, a3, a4);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            return dynCall_iiiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
            return dynCall_iiiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiiijijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
          var sp = stackSave();
          try {
            dynCall_viiiijjjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiiiiiiiiiijjidjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21) {
          var sp = stackSave();
          try {
            return dynCall_iiiiiiiiiiijjidjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_iiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
            return dynCall_iiijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_viiijdjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
            dynCall_viiijdjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function invoke_diijj(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
            return dynCall_diijj(index, a1, a2, a3, a4, a5, a6);
          } catch (e) {
            stackRestore(sp);
            if (e !== e + 0)
              throw e;
            _setThrew(1, 0);
          }
        }
        function applySignatureConversions(wasmExports2) {
          wasmExports2 = Object.assign({}, wasmExports2);
          var makeWrapper_pp = (f) => (a0) => f(a0) >>> 0;
          var makeWrapper_p = (f) => () => f() >>> 0;
          wasmExports2["ui"] = makeWrapper_pp(wasmExports2["ui"]);
          wasmExports2["Bi"] = makeWrapper_pp(wasmExports2["Bi"]);
          wasmExports2["Ci"] = makeWrapper_p(wasmExports2["Ci"]);
          return wasmExports2;
        }
        Module["stackSave"] = stackSave;
        Module["stackRestore"] = stackRestore;
        Module["stackAlloc"] = stackAlloc;
        Module["getTempRet0"] = getTempRet0;
        Module["setTempRet0"] = setTempRet0;
        Module["ccall"] = ccall;
        Module["createDyncallWrapper"] = createDyncallWrapper;
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
          preRun();
          if (runDependencies > 0) {
            return;
          }
          function doRun() {
            if (calledRun)
              return;
            calledRun = true;
            Module["calledRun"] = true;
            if (ABORT)
              return;
            initRuntime();
            preMain();
            readyPromiseResolve(Module);
            if (Module["onRuntimeInitialized"])
              Module["onRuntimeInitialized"]();
            if (shouldRunNow)
              callMain();
            postRun();
          }
          if (Module["setStatus"]) {
            Module["setStatus"]("Running...");
            setTimeout(function() {
              setTimeout(function() {
                Module["setStatus"]("");
              }, 1);
              doRun();
            }, 1);
          } else {
            doRun();
          }
        }
        if (Module["preInit"]) {
          if (typeof Module["preInit"] == "function")
            Module["preInit"] = [Module["preInit"]];
          while (Module["preInit"].length > 0) {
            Module["preInit"].pop()();
          }
        }
        var shouldRunNow = true;
        if (Module["noInitialRun"])
          shouldRunNow = false;
        run();
        return readyPromise;
      };
    })();
    if (typeof exports2 === "object" && typeof module2 === "object")
      module2.exports = DuckDB2;
    else if (typeof define === "function" && define["amd"])
      define([], () => DuckDB2);
  }
});

// ../../node_modules/fast-glob/out/utils/array.js
var require_array = __commonJS({
  "../../node_modules/fast-glob/out/utils/array.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.splitWhen = exports2.flatten = void 0;
    function flatten(items) {
      return items.reduce((collection, item) => [].concat(collection, item), []);
    }
    exports2.flatten = flatten;
    function splitWhen(items, predicate) {
      const result = [[]];
      let groupIndex = 0;
      for (const item of items) {
        if (predicate(item)) {
          groupIndex++;
          result[groupIndex] = [];
        } else {
          result[groupIndex].push(item);
        }
      }
      return result;
    }
    exports2.splitWhen = splitWhen;
  }
});

// ../../node_modules/fast-glob/out/utils/errno.js
var require_errno = __commonJS({
  "../../node_modules/fast-glob/out/utils/errno.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isEnoentCodeError = void 0;
    function isEnoentCodeError(error) {
      return error.code === "ENOENT";
    }
    exports2.isEnoentCodeError = isEnoentCodeError;
  }
});

// ../../node_modules/fast-glob/out/utils/fs.js
var require_fs = __commonJS({
  "../../node_modules/fast-glob/out/utils/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createDirentFromStats = void 0;
    var DirentFromStats = class {
      constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
      }
    };
    function createDirentFromStats(name, stats) {
      return new DirentFromStats(name, stats);
    }
    exports2.createDirentFromStats = createDirentFromStats;
  }
});

// ../../node_modules/fast-glob/out/utils/path.js
var require_path = __commonJS({
  "../../node_modules/fast-glob/out/utils/path.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.convertPosixPathToPattern = exports2.convertWindowsPathToPattern = exports2.convertPathToPattern = exports2.escapePosixPath = exports2.escapeWindowsPath = exports2.escape = exports2.removeLeadingDotSegment = exports2.makeAbsolute = exports2.unixify = void 0;
    var os = require("os");
    var path = require("path");
    var IS_WINDOWS_PLATFORM = os.platform() === "win32";
    var LEADING_DOT_SEGMENT_CHARACTERS_COUNT = 2;
    var POSIX_UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\()|\\(?![!()*+?@[\]{|}]))/g;
    var WINDOWS_UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()[\]{}]|^!|[!+@](?=\())/g;
    var DOS_DEVICE_PATH_RE = /^\\\\([.?])/;
    var WINDOWS_BACKSLASHES_RE = /\\(?![!()+@[\]{}])/g;
    function unixify(filepath) {
      return filepath.replace(/\\/g, "/");
    }
    exports2.unixify = unixify;
    function makeAbsolute(cwd, filepath) {
      return path.resolve(cwd, filepath);
    }
    exports2.makeAbsolute = makeAbsolute;
    function removeLeadingDotSegment(entry) {
      if (entry.charAt(0) === ".") {
        const secondCharactery = entry.charAt(1);
        if (secondCharactery === "/" || secondCharactery === "\\") {
          return entry.slice(LEADING_DOT_SEGMENT_CHARACTERS_COUNT);
        }
      }
      return entry;
    }
    exports2.removeLeadingDotSegment = removeLeadingDotSegment;
    exports2.escape = IS_WINDOWS_PLATFORM ? escapeWindowsPath : escapePosixPath;
    function escapeWindowsPath(pattern) {
      return pattern.replace(WINDOWS_UNESCAPED_GLOB_SYMBOLS_RE, "\\$2");
    }
    exports2.escapeWindowsPath = escapeWindowsPath;
    function escapePosixPath(pattern) {
      return pattern.replace(POSIX_UNESCAPED_GLOB_SYMBOLS_RE, "\\$2");
    }
    exports2.escapePosixPath = escapePosixPath;
    exports2.convertPathToPattern = IS_WINDOWS_PLATFORM ? convertWindowsPathToPattern : convertPosixPathToPattern;
    function convertWindowsPathToPattern(filepath) {
      return escapeWindowsPath(filepath).replace(DOS_DEVICE_PATH_RE, "//$1").replace(WINDOWS_BACKSLASHES_RE, "/");
    }
    exports2.convertWindowsPathToPattern = convertWindowsPathToPattern;
    function convertPosixPathToPattern(filepath) {
      return escapePosixPath(filepath);
    }
    exports2.convertPosixPathToPattern = convertPosixPathToPattern;
  }
});

// ../../node_modules/is-extglob/index.js
var require_is_extglob = __commonJS({
  "../../node_modules/is-extglob/index.js"(exports2, module2) {
    module2.exports = function isExtglob(str) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      var match;
      while (match = /(\\).|([@?!+*]\(.*\))/g.exec(str)) {
        if (match[2])
          return true;
        str = str.slice(match.index + match[0].length);
      }
      return false;
    };
  }
});

// ../../node_modules/is-glob/index.js
var require_is_glob = __commonJS({
  "../../node_modules/is-glob/index.js"(exports2, module2) {
    var isExtglob = require_is_extglob();
    var chars = { "{": "}", "(": ")", "[": "]" };
    var strictCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      var pipeIndex = -2;
      var closeSquareIndex = -2;
      var closeCurlyIndex = -2;
      var closeParenIndex = -2;
      var backSlashIndex = -2;
      while (index < str.length) {
        if (str[index] === "*") {
          return true;
        }
        if (str[index + 1] === "?" && /[\].+)]/.test(str[index])) {
          return true;
        }
        if (closeSquareIndex !== -1 && str[index] === "[" && str[index + 1] !== "]") {
          if (closeSquareIndex < index) {
            closeSquareIndex = str.indexOf("]", index);
          }
          if (closeSquareIndex > index) {
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
          }
        }
        if (closeCurlyIndex !== -1 && str[index] === "{" && str[index + 1] !== "}") {
          closeCurlyIndex = str.indexOf("}", index);
          if (closeCurlyIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeCurlyIndex) {
              return true;
            }
          }
        }
        if (closeParenIndex !== -1 && str[index] === "(" && str[index + 1] === "?" && /[:!=]/.test(str[index + 2]) && str[index + 3] !== ")") {
          closeParenIndex = str.indexOf(")", index);
          if (closeParenIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
              return true;
            }
          }
        }
        if (pipeIndex !== -1 && str[index] === "(" && str[index + 1] !== "|") {
          if (pipeIndex < index) {
            pipeIndex = str.indexOf("|", index);
          }
          if (pipeIndex !== -1 && str[pipeIndex + 1] !== ")") {
            closeParenIndex = str.indexOf(")", pipeIndex);
            if (closeParenIndex > pipeIndex) {
              backSlashIndex = str.indexOf("\\", pipeIndex);
              if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
                return true;
              }
            }
          }
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n = str.indexOf(close, index);
            if (n !== -1) {
              index = n + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    var relaxedCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      while (index < str.length) {
        if (/[*?{}()[\]]/.test(str[index])) {
          return true;
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n = str.indexOf(close, index);
            if (n !== -1) {
              index = n + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    module2.exports = function isGlob(str, options) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      if (isExtglob(str)) {
        return true;
      }
      var check = strictCheck;
      if (options && options.strict === false) {
        check = relaxedCheck;
      }
      return check(str);
    };
  }
});

// ../../node_modules/glob-parent/index.js
var require_glob_parent = __commonJS({
  "../../node_modules/glob-parent/index.js"(exports2, module2) {
    "use strict";
    var isGlob = require_is_glob();
    var pathPosixDirname = require("path").posix.dirname;
    var isWin32 = require("os").platform() === "win32";
    var slash = "/";
    var backslash = /\\/g;
    var enclosure = /[\{\[].*[\}\]]$/;
    var globby = /(^|[^\\])([\{\[]|\([^\)]+$)/;
    var escaped = /\\([\!\*\?\|\[\]\(\)\{\}])/g;
    module2.exports = function globParent(str, opts) {
      var options = Object.assign({ flipBackslashes: true }, opts);
      if (options.flipBackslashes && isWin32 && str.indexOf(slash) < 0) {
        str = str.replace(backslash, slash);
      }
      if (enclosure.test(str)) {
        str += slash;
      }
      str += "a";
      do {
        str = pathPosixDirname(str);
      } while (isGlob(str) || globby.test(str));
      return str.replace(escaped, "$1");
    };
  }
});

// ../../node_modules/braces/lib/utils.js
var require_utils = __commonJS({
  "../../node_modules/braces/lib/utils.js"(exports2) {
    "use strict";
    exports2.isInteger = (num) => {
      if (typeof num === "number") {
        return Number.isInteger(num);
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isInteger(Number(num));
      }
      return false;
    };
    exports2.find = (node, type) => node.nodes.find((node2) => node2.type === type);
    exports2.exceedsLimit = (min, max, step = 1, limit) => {
      if (limit === false)
        return false;
      if (!exports2.isInteger(min) || !exports2.isInteger(max))
        return false;
      return (Number(max) - Number(min)) / Number(step) >= limit;
    };
    exports2.escapeNode = (block, n = 0, type) => {
      let node = block.nodes[n];
      if (!node)
        return;
      if (type && node.type === type || node.type === "open" || node.type === "close") {
        if (node.escaped !== true) {
          node.value = "\\" + node.value;
          node.escaped = true;
        }
      }
    };
    exports2.encloseBrace = (node) => {
      if (node.type !== "brace")
        return false;
      if (node.commas >> 0 + node.ranges >> 0 === 0) {
        node.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isInvalidBrace = (block) => {
      if (block.type !== "brace")
        return false;
      if (block.invalid === true || block.dollar)
        return true;
      if (block.commas >> 0 + block.ranges >> 0 === 0) {
        block.invalid = true;
        return true;
      }
      if (block.open !== true || block.close !== true) {
        block.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isOpenOrClose = (node) => {
      if (node.type === "open" || node.type === "close") {
        return true;
      }
      return node.open === true || node.close === true;
    };
    exports2.reduce = (nodes) => nodes.reduce((acc, node) => {
      if (node.type === "text")
        acc.push(node.value);
      if (node.type === "range")
        node.type = "text";
      return acc;
    }, []);
    exports2.flatten = (...args) => {
      const result = [];
      const flat = (arr) => {
        for (let i = 0; i < arr.length; i++) {
          let ele = arr[i];
          Array.isArray(ele) ? flat(ele, result) : ele !== void 0 && result.push(ele);
        }
        return result;
      };
      flat(args);
      return result;
    };
  }
});

// ../../node_modules/braces/lib/stringify.js
var require_stringify = __commonJS({
  "../../node_modules/braces/lib/stringify.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = (ast, options = {}) => {
      let stringify = (node, parent = {}) => {
        let invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
        let invalidNode = node.invalid === true && options.escapeInvalid === true;
        let output = "";
        if (node.value) {
          if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
            return "\\" + node.value;
          }
          return node.value;
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes) {
          for (let child of node.nodes) {
            output += stringify(child);
          }
        }
        return output;
      };
      return stringify(ast);
    };
  }
});

// ../../node_modules/is-number/index.js
var require_is_number = __commonJS({
  "../../node_modules/is-number/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function(num) {
      if (typeof num === "number") {
        return num - num === 0;
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
      }
      return false;
    };
  }
});

// ../../node_modules/to-regex-range/index.js
var require_to_regex_range = __commonJS({
  "../../node_modules/to-regex-range/index.js"(exports2, module2) {
    "use strict";
    var isNumber = require_is_number();
    var toRegexRange = (min, max, options) => {
      if (isNumber(min) === false) {
        throw new TypeError("toRegexRange: expected the first argument to be a number");
      }
      if (max === void 0 || min === max) {
        return String(min);
      }
      if (isNumber(max) === false) {
        throw new TypeError("toRegexRange: expected the second argument to be a number.");
      }
      let opts = { relaxZeros: true, ...options };
      if (typeof opts.strictZeros === "boolean") {
        opts.relaxZeros = opts.strictZeros === false;
      }
      let relax = String(opts.relaxZeros);
      let shorthand = String(opts.shorthand);
      let capture = String(opts.capture);
      let wrap = String(opts.wrap);
      let cacheKey = min + ":" + max + "=" + relax + shorthand + capture + wrap;
      if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
        return toRegexRange.cache[cacheKey].result;
      }
      let a = Math.min(min, max);
      let b = Math.max(min, max);
      if (Math.abs(a - b) === 1) {
        let result = min + "|" + max;
        if (opts.capture) {
          return `(${result})`;
        }
        if (opts.wrap === false) {
          return result;
        }
        return `(?:${result})`;
      }
      let isPadded = hasPadding(min) || hasPadding(max);
      let state = { min, max, a, b };
      let positives = [];
      let negatives = [];
      if (isPadded) {
        state.isPadded = isPadded;
        state.maxLen = String(state.max).length;
      }
      if (a < 0) {
        let newMin = b < 0 ? Math.abs(b) : 1;
        negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
        a = state.a = 0;
      }
      if (b >= 0) {
        positives = splitToPatterns(a, b, state, opts);
      }
      state.negatives = negatives;
      state.positives = positives;
      state.result = collatePatterns(negatives, positives, opts);
      if (opts.capture === true) {
        state.result = `(${state.result})`;
      } else if (opts.wrap !== false && positives.length + negatives.length > 1) {
        state.result = `(?:${state.result})`;
      }
      toRegexRange.cache[cacheKey] = state;
      return state.result;
    };
    function collatePatterns(neg, pos, options) {
      let onlyNegative = filterPatterns(neg, pos, "-", false, options) || [];
      let onlyPositive = filterPatterns(pos, neg, "", false, options) || [];
      let intersected = filterPatterns(neg, pos, "-?", true, options) || [];
      let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
      return subpatterns.join("|");
    }
    function splitToRanges(min, max) {
      let nines = 1;
      let zeros = 1;
      let stop = countNines(min, nines);
      let stops = /* @__PURE__ */ new Set([max]);
      while (min <= stop && stop <= max) {
        stops.add(stop);
        nines += 1;
        stop = countNines(min, nines);
      }
      stop = countZeros(max + 1, zeros) - 1;
      while (min < stop && stop <= max) {
        stops.add(stop);
        zeros += 1;
        stop = countZeros(max + 1, zeros) - 1;
      }
      stops = [...stops];
      stops.sort(compare);
      return stops;
    }
    function rangeToPattern(start, stop, options) {
      if (start === stop) {
        return { pattern: start, count: [], digits: 0 };
      }
      let zipped = zip(start, stop);
      let digits = zipped.length;
      let pattern = "";
      let count = 0;
      for (let i = 0; i < digits; i++) {
        let [startDigit, stopDigit] = zipped[i];
        if (startDigit === stopDigit) {
          pattern += startDigit;
        } else if (startDigit !== "0" || stopDigit !== "9") {
          pattern += toCharacterClass(startDigit, stopDigit, options);
        } else {
          count++;
        }
      }
      if (count) {
        pattern += options.shorthand === true ? "\\d" : "[0-9]";
      }
      return { pattern, count: [count], digits };
    }
    function splitToPatterns(min, max, tok, options) {
      let ranges = splitToRanges(min, max);
      let tokens = [];
      let start = min;
      let prev;
      for (let i = 0; i < ranges.length; i++) {
        let max2 = ranges[i];
        let obj = rangeToPattern(String(start), String(max2), options);
        let zeros = "";
        if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
          if (prev.count.length > 1) {
            prev.count.pop();
          }
          prev.count.push(obj.count[0]);
          prev.string = prev.pattern + toQuantifier(prev.count);
          start = max2 + 1;
          continue;
        }
        if (tok.isPadded) {
          zeros = padZeros(max2, tok, options);
        }
        obj.string = zeros + obj.pattern + toQuantifier(obj.count);
        tokens.push(obj);
        start = max2 + 1;
        prev = obj;
      }
      return tokens;
    }
    function filterPatterns(arr, comparison, prefix, intersection, options) {
      let result = [];
      for (let ele of arr) {
        let { string } = ele;
        if (!intersection && !contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
        if (intersection && contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
      }
      return result;
    }
    function zip(a, b) {
      let arr = [];
      for (let i = 0; i < a.length; i++)
        arr.push([a[i], b[i]]);
      return arr;
    }
    function compare(a, b) {
      return a > b ? 1 : b > a ? -1 : 0;
    }
    function contains(arr, key, val) {
      return arr.some((ele) => ele[key] === val);
    }
    function countNines(min, len) {
      return Number(String(min).slice(0, -len) + "9".repeat(len));
    }
    function countZeros(integer, zeros) {
      return integer - integer % Math.pow(10, zeros);
    }
    function toQuantifier(digits) {
      let [start = 0, stop = ""] = digits;
      if (stop || start > 1) {
        return `{${start + (stop ? "," + stop : "")}}`;
      }
      return "";
    }
    function toCharacterClass(a, b, options) {
      return `[${a}${b - a === 1 ? "" : "-"}${b}]`;
    }
    function hasPadding(str) {
      return /^-?(0+)\d/.test(str);
    }
    function padZeros(value, tok, options) {
      if (!tok.isPadded) {
        return value;
      }
      let diff = Math.abs(tok.maxLen - String(value).length);
      let relax = options.relaxZeros !== false;
      switch (diff) {
        case 0:
          return "";
        case 1:
          return relax ? "0?" : "0";
        case 2:
          return relax ? "0{0,2}" : "00";
        default: {
          return relax ? `0{0,${diff}}` : `0{${diff}}`;
        }
      }
    }
    toRegexRange.cache = {};
    toRegexRange.clearCache = () => toRegexRange.cache = {};
    module2.exports = toRegexRange;
  }
});

// ../../node_modules/fill-range/index.js
var require_fill_range = __commonJS({
  "../../node_modules/fill-range/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var toRegexRange = require_to_regex_range();
    var isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    var transform = (toNumber) => {
      return (value) => toNumber === true ? Number(value) : String(value);
    };
    var isValidValue = (value) => {
      return typeof value === "number" || typeof value === "string" && value !== "";
    };
    var isNumber = (num) => Number.isInteger(+num);
    var zeros = (input) => {
      let value = `${input}`;
      let index = -1;
      if (value[0] === "-")
        value = value.slice(1);
      if (value === "0")
        return false;
      while (value[++index] === "0")
        ;
      return index > 0;
    };
    var stringify = (start, end, options) => {
      if (typeof start === "string" || typeof end === "string") {
        return true;
      }
      return options.stringify === true;
    };
    var pad = (input, maxLength, toNumber) => {
      if (maxLength > 0) {
        let dash = input[0] === "-" ? "-" : "";
        if (dash)
          input = input.slice(1);
        input = dash + input.padStart(dash ? maxLength - 1 : maxLength, "0");
      }
      if (toNumber === false) {
        return String(input);
      }
      return input;
    };
    var toMaxLen = (input, maxLength) => {
      let negative = input[0] === "-" ? "-" : "";
      if (negative) {
        input = input.slice(1);
        maxLength--;
      }
      while (input.length < maxLength)
        input = "0" + input;
      return negative ? "-" + input : input;
    };
    var toSequence = (parts, options) => {
      parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      let prefix = options.capture ? "" : "?:";
      let positives = "";
      let negatives = "";
      let result;
      if (parts.positives.length) {
        positives = parts.positives.join("|");
      }
      if (parts.negatives.length) {
        negatives = `-(${prefix}${parts.negatives.join("|")})`;
      }
      if (positives && negatives) {
        result = `${positives}|${negatives}`;
      } else {
        result = positives || negatives;
      }
      if (options.wrap) {
        return `(${prefix}${result})`;
      }
      return result;
    };
    var toRange = (a, b, isNumbers, options) => {
      if (isNumbers) {
        return toRegexRange(a, b, { wrap: false, ...options });
      }
      let start = String.fromCharCode(a);
      if (a === b)
        return start;
      let stop = String.fromCharCode(b);
      return `[${start}-${stop}]`;
    };
    var toRegex = (start, end, options) => {
      if (Array.isArray(start)) {
        let wrap = options.wrap === true;
        let prefix = options.capture ? "" : "?:";
        return wrap ? `(${prefix}${start.join("|")})` : start.join("|");
      }
      return toRegexRange(start, end, options);
    };
    var rangeError = (...args) => {
      return new RangeError("Invalid range arguments: " + util.inspect(...args));
    };
    var invalidRange = (start, end, options) => {
      if (options.strictRanges === true)
        throw rangeError([start, end]);
      return [];
    };
    var invalidStep = (step, options) => {
      if (options.strictRanges === true) {
        throw new TypeError(`Expected step "${step}" to be a number`);
      }
      return [];
    };
    var fillNumbers = (start, end, step = 1, options = {}) => {
      let a = Number(start);
      let b = Number(end);
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        if (options.strictRanges === true)
          throw rangeError([start, end]);
        return [];
      }
      if (a === 0)
        a = 0;
      if (b === 0)
        b = 0;
      let descending = a > b;
      let startString = String(start);
      let endString = String(end);
      let stepString = String(step);
      step = Math.max(Math.abs(step), 1);
      let padded = zeros(startString) || zeros(endString) || zeros(stepString);
      let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
      let toNumber = padded === false && stringify(start, end, options) === false;
      let format = options.transform || transform(toNumber);
      if (options.toRegex && step === 1) {
        return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
      }
      let parts = { negatives: [], positives: [] };
      let push = (num) => parts[num < 0 ? "negatives" : "positives"].push(Math.abs(num));
      let range = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        if (options.toRegex === true && step > 1) {
          push(a);
        } else {
          range.push(pad(format(a, index), maxLen, toNumber));
        }
        a = descending ? a - step : a + step;
        index++;
      }
      if (options.toRegex === true) {
        return step > 1 ? toSequence(parts, options) : toRegex(range, null, { wrap: false, ...options });
      }
      return range;
    };
    var fillLetters = (start, end, step = 1, options = {}) => {
      if (!isNumber(start) && start.length > 1 || !isNumber(end) && end.length > 1) {
        return invalidRange(start, end, options);
      }
      let format = options.transform || ((val) => String.fromCharCode(val));
      let a = `${start}`.charCodeAt(0);
      let b = `${end}`.charCodeAt(0);
      let descending = a > b;
      let min = Math.min(a, b);
      let max = Math.max(a, b);
      if (options.toRegex && step === 1) {
        return toRange(min, max, false, options);
      }
      let range = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        range.push(format(a, index));
        a = descending ? a - step : a + step;
        index++;
      }
      if (options.toRegex === true) {
        return toRegex(range, null, { wrap: false, options });
      }
      return range;
    };
    var fill = (start, end, step, options = {}) => {
      if (end == null && isValidValue(start)) {
        return [start];
      }
      if (!isValidValue(start) || !isValidValue(end)) {
        return invalidRange(start, end, options);
      }
      if (typeof step === "function") {
        return fill(start, end, 1, { transform: step });
      }
      if (isObject(step)) {
        return fill(start, end, 0, step);
      }
      let opts = { ...options };
      if (opts.capture === true)
        opts.wrap = true;
      step = step || opts.step || 1;
      if (!isNumber(step)) {
        if (step != null && !isObject(step))
          return invalidStep(step, opts);
        return fill(start, end, 1, step);
      }
      if (isNumber(start) && isNumber(end)) {
        return fillNumbers(start, end, step, opts);
      }
      return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
    };
    module2.exports = fill;
  }
});

// ../../node_modules/braces/lib/compile.js
var require_compile = __commonJS({
  "../../node_modules/braces/lib/compile.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var utils = require_utils();
    var compile = (ast, options = {}) => {
      let walk = (node, parent = {}) => {
        let invalidBlock = utils.isInvalidBrace(parent);
        let invalidNode = node.invalid === true && options.escapeInvalid === true;
        let invalid = invalidBlock === true || invalidNode === true;
        let prefix = options.escapeInvalid === true ? "\\" : "";
        let output = "";
        if (node.isOpen === true) {
          return prefix + node.value;
        }
        if (node.isClose === true) {
          return prefix + node.value;
        }
        if (node.type === "open") {
          return invalid ? prefix + node.value : "(";
        }
        if (node.type === "close") {
          return invalid ? prefix + node.value : ")";
        }
        if (node.type === "comma") {
          return node.prev.type === "comma" ? "" : invalid ? node.value : "|";
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes && node.ranges > 0) {
          let args = utils.reduce(node.nodes);
          let range = fill(...args, { ...options, wrap: false, toRegex: true });
          if (range.length !== 0) {
            return args.length > 1 && range.length > 1 ? `(${range})` : range;
          }
        }
        if (node.nodes) {
          for (let child of node.nodes) {
            output += walk(child, node);
          }
        }
        return output;
      };
      return walk(ast);
    };
    module2.exports = compile;
  }
});

// ../../node_modules/braces/lib/expand.js
var require_expand = __commonJS({
  "../../node_modules/braces/lib/expand.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var stringify = require_stringify();
    var utils = require_utils();
    var append = (queue = "", stash = "", enclose = false) => {
      let result = [];
      queue = [].concat(queue);
      stash = [].concat(stash);
      if (!stash.length)
        return queue;
      if (!queue.length) {
        return enclose ? utils.flatten(stash).map((ele) => `{${ele}}`) : stash;
      }
      for (let item of queue) {
        if (Array.isArray(item)) {
          for (let value of item) {
            result.push(append(value, stash, enclose));
          }
        } else {
          for (let ele of stash) {
            if (enclose === true && typeof ele === "string")
              ele = `{${ele}}`;
            result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
          }
        }
      }
      return utils.flatten(result);
    };
    var expand = (ast, options = {}) => {
      let rangeLimit = options.rangeLimit === void 0 ? 1e3 : options.rangeLimit;
      let walk = (node, parent = {}) => {
        node.queue = [];
        let p = parent;
        let q = parent.queue;
        while (p.type !== "brace" && p.type !== "root" && p.parent) {
          p = p.parent;
          q = p.queue;
        }
        if (node.invalid || node.dollar) {
          q.push(append(q.pop(), stringify(node, options)));
          return;
        }
        if (node.type === "brace" && node.invalid !== true && node.nodes.length === 2) {
          q.push(append(q.pop(), ["{}"]));
          return;
        }
        if (node.nodes && node.ranges > 0) {
          let args = utils.reduce(node.nodes);
          if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
            throw new RangeError("expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.");
          }
          let range = fill(...args, options);
          if (range.length === 0) {
            range = stringify(node, options);
          }
          q.push(append(q.pop(), range));
          node.nodes = [];
          return;
        }
        let enclose = utils.encloseBrace(node);
        let queue = node.queue;
        let block = node;
        while (block.type !== "brace" && block.type !== "root" && block.parent) {
          block = block.parent;
          queue = block.queue;
        }
        for (let i = 0; i < node.nodes.length; i++) {
          let child = node.nodes[i];
          if (child.type === "comma" && node.type === "brace") {
            if (i === 1)
              queue.push("");
            queue.push("");
            continue;
          }
          if (child.type === "close") {
            q.push(append(q.pop(), queue, enclose));
            continue;
          }
          if (child.value && child.type !== "open") {
            queue.push(append(queue.pop(), child.value));
            continue;
          }
          if (child.nodes) {
            walk(child, node);
          }
        }
        return queue;
      };
      return utils.flatten(walk(ast));
    };
    module2.exports = expand;
  }
});

// ../../node_modules/braces/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/braces/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      MAX_LENGTH: 1024 * 64,
      // Digits
      CHAR_0: "0",
      /* 0 */
      CHAR_9: "9",
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: "A",
      /* A */
      CHAR_LOWERCASE_A: "a",
      /* a */
      CHAR_UPPERCASE_Z: "Z",
      /* Z */
      CHAR_LOWERCASE_Z: "z",
      /* z */
      CHAR_LEFT_PARENTHESES: "(",
      /* ( */
      CHAR_RIGHT_PARENTHESES: ")",
      /* ) */
      CHAR_ASTERISK: "*",
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: "&",
      /* & */
      CHAR_AT: "@",
      /* @ */
      CHAR_BACKSLASH: "\\",
      /* \ */
      CHAR_BACKTICK: "`",
      /* ` */
      CHAR_CARRIAGE_RETURN: "\r",
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: "^",
      /* ^ */
      CHAR_COLON: ":",
      /* : */
      CHAR_COMMA: ",",
      /* , */
      CHAR_DOLLAR: "$",
      /* . */
      CHAR_DOT: ".",
      /* . */
      CHAR_DOUBLE_QUOTE: '"',
      /* " */
      CHAR_EQUAL: "=",
      /* = */
      CHAR_EXCLAMATION_MARK: "!",
      /* ! */
      CHAR_FORM_FEED: "\f",
      /* \f */
      CHAR_FORWARD_SLASH: "/",
      /* / */
      CHAR_HASH: "#",
      /* # */
      CHAR_HYPHEN_MINUS: "-",
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: "<",
      /* < */
      CHAR_LEFT_CURLY_BRACE: "{",
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: "[",
      /* [ */
      CHAR_LINE_FEED: "\n",
      /* \n */
      CHAR_NO_BREAK_SPACE: "\xA0",
      /* \u00A0 */
      CHAR_PERCENT: "%",
      /* % */
      CHAR_PLUS: "+",
      /* + */
      CHAR_QUESTION_MARK: "?",
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: ">",
      /* > */
      CHAR_RIGHT_CURLY_BRACE: "}",
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: "]",
      /* ] */
      CHAR_SEMICOLON: ";",
      /* ; */
      CHAR_SINGLE_QUOTE: "'",
      /* ' */
      CHAR_SPACE: " ",
      /*   */
      CHAR_TAB: "	",
      /* \t */
      CHAR_UNDERSCORE: "_",
      /* _ */
      CHAR_VERTICAL_LINE: "|",
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: "\uFEFF"
      /* \uFEFF */
    };
  }
});

// ../../node_modules/braces/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/braces/lib/parse.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var {
      MAX_LENGTH,
      CHAR_BACKSLASH,
      /* \ */
      CHAR_BACKTICK,
      /* ` */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_RIGHT_SQUARE_BRACKET,
      /* ] */
      CHAR_DOUBLE_QUOTE,
      /* " */
      CHAR_SINGLE_QUOTE,
      /* ' */
      CHAR_NO_BREAK_SPACE,
      CHAR_ZERO_WIDTH_NOBREAK_SPACE
    } = require_constants();
    var parse = (input, options = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      let opts = options || {};
      let max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      if (input.length > max) {
        throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
      }
      let ast = { type: "root", input, nodes: [] };
      let stack = [ast];
      let block = ast;
      let prev = ast;
      let brackets = 0;
      let length = input.length;
      let index = 0;
      let depth = 0;
      let value;
      let memo = {};
      const advance = () => input[index++];
      const push = (node) => {
        if (node.type === "text" && prev.type === "dot") {
          prev.type = "text";
        }
        if (prev && prev.type === "text" && node.type === "text") {
          prev.value += node.value;
          return;
        }
        block.nodes.push(node);
        node.parent = block;
        node.prev = prev;
        prev = node;
        return node;
      };
      push({ type: "bos" });
      while (index < length) {
        block = stack[stack.length - 1];
        value = advance();
        if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
          continue;
        }
        if (value === CHAR_BACKSLASH) {
          push({ type: "text", value: (options.keepEscaping ? value : "") + advance() });
          continue;
        }
        if (value === CHAR_RIGHT_SQUARE_BRACKET) {
          push({ type: "text", value: "\\" + value });
          continue;
        }
        if (value === CHAR_LEFT_SQUARE_BRACKET) {
          brackets++;
          let closed = true;
          let next;
          while (index < length && (next = advance())) {
            value += next;
            if (next === CHAR_LEFT_SQUARE_BRACKET) {
              brackets++;
              continue;
            }
            if (next === CHAR_BACKSLASH) {
              value += advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              brackets--;
              if (brackets === 0) {
                break;
              }
            }
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_PARENTHESES) {
          block = push({ type: "paren", nodes: [] });
          stack.push(block);
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_RIGHT_PARENTHESES) {
          if (block.type !== "paren") {
            push({ type: "text", value });
            continue;
          }
          block = stack.pop();
          push({ type: "text", value });
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
          let open = value;
          let next;
          if (options.keepQuotes !== true) {
            value = "";
          }
          while (index < length && (next = advance())) {
            if (next === CHAR_BACKSLASH) {
              value += next + advance();
              continue;
            }
            if (next === open) {
              if (options.keepQuotes === true)
                value += next;
              break;
            }
            value += next;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_CURLY_BRACE) {
          depth++;
          let dollar = prev.value && prev.value.slice(-1) === "$" || block.dollar === true;
          let brace = {
            type: "brace",
            open: true,
            close: false,
            dollar,
            depth,
            commas: 0,
            ranges: 0,
            nodes: []
          };
          block = push(brace);
          stack.push(block);
          push({ type: "open", value });
          continue;
        }
        if (value === CHAR_RIGHT_CURLY_BRACE) {
          if (block.type !== "brace") {
            push({ type: "text", value });
            continue;
          }
          let type = "close";
          block = stack.pop();
          block.close = true;
          push({ type, value });
          depth--;
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_COMMA && depth > 0) {
          if (block.ranges > 0) {
            block.ranges = 0;
            let open = block.nodes.shift();
            block.nodes = [open, { type: "text", value: stringify(block) }];
          }
          push({ type: "comma", value });
          block.commas++;
          continue;
        }
        if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
          let siblings = block.nodes;
          if (depth === 0 || siblings.length === 0) {
            push({ type: "text", value });
            continue;
          }
          if (prev.type === "dot") {
            block.range = [];
            prev.value += value;
            prev.type = "range";
            if (block.nodes.length !== 3 && block.nodes.length !== 5) {
              block.invalid = true;
              block.ranges = 0;
              prev.type = "text";
              continue;
            }
            block.ranges++;
            block.args = [];
            continue;
          }
          if (prev.type === "range") {
            siblings.pop();
            let before = siblings[siblings.length - 1];
            before.value += prev.value + value;
            prev = before;
            block.ranges--;
            continue;
          }
          push({ type: "dot", value });
          continue;
        }
        push({ type: "text", value });
      }
      do {
        block = stack.pop();
        if (block.type !== "root") {
          block.nodes.forEach((node) => {
            if (!node.nodes) {
              if (node.type === "open")
                node.isOpen = true;
              if (node.type === "close")
                node.isClose = true;
              if (!node.nodes)
                node.type = "text";
              node.invalid = true;
            }
          });
          let parent = stack[stack.length - 1];
          let index2 = parent.nodes.indexOf(block);
          parent.nodes.splice(index2, 1, ...block.nodes);
        }
      } while (stack.length > 0);
      push({ type: "eos" });
      return ast;
    };
    module2.exports = parse;
  }
});

// ../../node_modules/braces/index.js
var require_braces = __commonJS({
  "../../node_modules/braces/index.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var compile = require_compile();
    var expand = require_expand();
    var parse = require_parse();
    var braces = (input, options = {}) => {
      let output = [];
      if (Array.isArray(input)) {
        for (let pattern of input) {
          let result = braces.create(pattern, options);
          if (Array.isArray(result)) {
            output.push(...result);
          } else {
            output.push(result);
          }
        }
      } else {
        output = [].concat(braces.create(input, options));
      }
      if (options && options.expand === true && options.nodupes === true) {
        output = [...new Set(output)];
      }
      return output;
    };
    braces.parse = (input, options = {}) => parse(input, options);
    braces.stringify = (input, options = {}) => {
      if (typeof input === "string") {
        return stringify(braces.parse(input, options), options);
      }
      return stringify(input, options);
    };
    braces.compile = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      return compile(input, options);
    };
    braces.expand = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      let result = expand(input, options);
      if (options.noempty === true) {
        result = result.filter(Boolean);
      }
      if (options.nodupes === true) {
        result = [...new Set(result)];
      }
      return result;
    };
    braces.create = (input, options = {}) => {
      if (input === "" || input.length < 3) {
        return [input];
      }
      return options.expand !== true ? braces.compile(input, options) : braces.expand(input, options);
    };
    module2.exports = braces;
  }
});

// ../../node_modules/picomatch/lib/constants.js
var require_constants2 = __commonJS({
  "../../node_modules/picomatch/lib/constants.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
    };
    var POSIX_REGEX_SOURCE = {
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module2.exports = {
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      SEP: path.sep,
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// ../../node_modules/picomatch/lib/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/picomatch/lib/utils.js"(exports2) {
    "use strict";
    var path = require("path");
    var win32 = process.platform === "win32";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants2();
    exports2.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports2.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports2.isRegexChar = (str) => str.length === 1 && exports2.hasRegexChars(str);
    exports2.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports2.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports2.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports2.supportsLookbehinds = () => {
      const segs = process.version.slice(1).split(".").map(Number);
      if (segs.length === 3 && segs[0] >= 9 || segs[0] === 8 && segs[1] >= 10) {
        return true;
      }
      return false;
    };
    exports2.isWindows = (options) => {
      if (options && typeof options.windows === "boolean") {
        return options.windows;
      }
      return win32 === true || path.sep === "\\";
    };
    exports2.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1)
        return input;
      if (input[idx - 1] === "\\")
        return exports2.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports2.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports2.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
  }
});

// ../../node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "../../node_modules/picomatch/lib/scan.js"(exports2, module2) {
    "use strict";
    var utils = require_utils2();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants2();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true)
            continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  isGlob = token.isGlob = true;
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK)
            isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_LEFT_PARENTHESES) {
                backslashes = token.backslashes = true;
                code = advance();
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob)
          glob = utils.removeBackslashes(glob);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n = prevIndex ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value = input.slice(n, i);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (idx !== 0 || value !== "") {
            parts.push(value);
          }
          prevIndex = i;
        }
        if (prevIndex && prevIndex + 1 < input.length) {
          const value = input.slice(prevIndex + 1);
          parts.push(value);
          if (opts.tokens) {
            tokens[tokens.length - 1].value = value;
            depth(tokens[tokens.length - 1]);
            state.maxDepth += tokens[tokens.length - 1].depth;
          }
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module2.exports = scan;
  }
});

// ../../node_modules/picomatch/lib/parse.js
var require_parse2 = __commonJS({
  "../../node_modules/picomatch/lib/parse.js"(exports2, module2) {
    "use strict";
    var constants = require_constants2();
    var utils = require_utils2();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const win32 = utils.isWindows(options);
      const PLATFORM_CHARS = constants.globChars(win32);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n = 1) => input[state.index + n];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output)
          append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.value += tok.value;
          prev.output = (prev.output || "") + tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            output = token.close = `)${rest})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star : "");
            }
            return star;
          }
          return esc ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range.unshift(arr[i].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".")
              prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (next === "<" && !utils.supportsLookbehinds()) {
              throw new Error("Node.js v10 or higher is required for regex lookbehinds");
            }
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true)
          throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true)
          throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true)
          throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const win32 = utils.isWindows(options);
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants.globChars(win32);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true)
          return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match)
              return;
            const source2 = create(match[1]);
            if (!source2)
              return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module2.exports = parse;
  }
});

// ../../node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "../../node_modules/picomatch/lib/picomatch.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var scan = require_scan();
    var parse = require_parse2();
    var utils = require_utils2();
    var constants = require_constants2();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch = (glob, options, returnState = false) => {
      if (Array.isArray(glob)) {
        const fns = glob.map((input) => picomatch(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2)
              return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix = utils.isWindows(options);
      const regex = isState ? picomatch.compileRe(glob, options) : picomatch.makeRe(glob, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
        const result = { glob, state, regex, posix, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch.test = (input, regex, options, { glob, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix ? utils.toPosixSlashes : null);
      let match = input === glob;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch.matchBase(input, regex, options, posix);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch.matchBase = (input, glob, options, posix = utils.isWindows(options)) => {
      const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
      return regex.test(path.basename(input));
    };
    picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    picomatch.parse = (pattern, options) => {
      if (Array.isArray(pattern))
        return pattern.map((p) => picomatch.parse(p, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch.scan = (input, options) => scan(input, options);
    picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err) {
        if (options && options.debug === true)
          throw err;
        return /$^/;
      }
    };
    picomatch.constants = constants;
    module2.exports = picomatch;
  }
});

// ../../node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "../../node_modules/picomatch/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_picomatch();
  }
});

// ../../node_modules/micromatch/index.js
var require_micromatch = __commonJS({
  "../../node_modules/micromatch/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var braces = require_braces();
    var picomatch = require_picomatch2();
    var utils = require_utils2();
    var isEmptyString = (val) => val === "" || val === "./";
    var micromatch = (list, patterns, options) => {
      patterns = [].concat(patterns);
      list = [].concat(list);
      let omit = /* @__PURE__ */ new Set();
      let keep = /* @__PURE__ */ new Set();
      let items = /* @__PURE__ */ new Set();
      let negatives = 0;
      let onResult = (state) => {
        items.add(state.output);
        if (options && options.onResult) {
          options.onResult(state);
        }
      };
      for (let i = 0; i < patterns.length; i++) {
        let isMatch = picomatch(String(patterns[i]), { ...options, onResult }, true);
        let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
        if (negated)
          negatives++;
        for (let item of list) {
          let matched = isMatch(item, true);
          let match = negated ? !matched.isMatch : matched.isMatch;
          if (!match)
            continue;
          if (negated) {
            omit.add(matched.output);
          } else {
            omit.delete(matched.output);
            keep.add(matched.output);
          }
        }
      }
      let result = negatives === patterns.length ? [...items] : [...keep];
      let matches = result.filter((item) => !omit.has(item));
      if (options && matches.length === 0) {
        if (options.failglob === true) {
          throw new Error(`No matches found for "${patterns.join(", ")}"`);
        }
        if (options.nonull === true || options.nullglob === true) {
          return options.unescape ? patterns.map((p) => p.replace(/\\/g, "")) : patterns;
        }
      }
      return matches;
    };
    micromatch.match = micromatch;
    micromatch.matcher = (pattern, options) => picomatch(pattern, options);
    micromatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    micromatch.any = micromatch.isMatch;
    micromatch.not = (list, patterns, options = {}) => {
      patterns = [].concat(patterns).map(String);
      let result = /* @__PURE__ */ new Set();
      let items = [];
      let onResult = (state) => {
        if (options.onResult)
          options.onResult(state);
        items.push(state.output);
      };
      let matches = micromatch(list, patterns, { ...options, onResult });
      for (let item of items) {
        if (!matches.includes(item)) {
          result.add(item);
        }
      }
      return [...result];
    };
    micromatch.contains = (str, pattern, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      if (Array.isArray(pattern)) {
        return pattern.some((p) => micromatch.contains(str, p, options));
      }
      if (typeof pattern === "string") {
        if (isEmptyString(str) || isEmptyString(pattern)) {
          return false;
        }
        if (str.includes(pattern) || str.startsWith("./") && str.slice(2).includes(pattern)) {
          return true;
        }
      }
      return micromatch.isMatch(str, pattern, { ...options, contains: true });
    };
    micromatch.matchKeys = (obj, patterns, options) => {
      if (!utils.isObject(obj)) {
        throw new TypeError("Expected the first argument to be an object");
      }
      let keys = micromatch(Object.keys(obj), patterns, options);
      let res = {};
      for (let key of keys)
        res[key] = obj[key];
      return res;
    };
    micromatch.some = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (items.some((item) => isMatch(item))) {
          return true;
        }
      }
      return false;
    };
    micromatch.every = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (!items.every((item) => isMatch(item))) {
          return false;
        }
      }
      return true;
    };
    micromatch.all = (str, patterns, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      return [].concat(patterns).every((p) => picomatch(p, options)(str));
    };
    micromatch.capture = (glob, input, options) => {
      let posix = utils.isWindows(options);
      let regex = picomatch.makeRe(String(glob), { ...options, capture: true });
      let match = regex.exec(posix ? utils.toPosixSlashes(input) : input);
      if (match) {
        return match.slice(1).map((v) => v === void 0 ? "" : v);
      }
    };
    micromatch.makeRe = (...args) => picomatch.makeRe(...args);
    micromatch.scan = (...args) => picomatch.scan(...args);
    micromatch.parse = (patterns, options) => {
      let res = [];
      for (let pattern of [].concat(patterns || [])) {
        for (let str of braces(String(pattern), options)) {
          res.push(picomatch.parse(str, options));
        }
      }
      return res;
    };
    micromatch.braces = (pattern, options) => {
      if (typeof pattern !== "string")
        throw new TypeError("Expected a string");
      if (options && options.nobrace === true || !/\{.*\}/.test(pattern)) {
        return [pattern];
      }
      return braces(pattern, options);
    };
    micromatch.braceExpand = (pattern, options) => {
      if (typeof pattern !== "string")
        throw new TypeError("Expected a string");
      return micromatch.braces(pattern, { ...options, expand: true });
    };
    module2.exports = micromatch;
  }
});

// ../../node_modules/fast-glob/out/utils/pattern.js
var require_pattern = __commonJS({
  "../../node_modules/fast-glob/out/utils/pattern.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeDuplicateSlashes = exports2.matchAny = exports2.convertPatternsToRe = exports2.makeRe = exports2.getPatternParts = exports2.expandBraceExpansion = exports2.expandPatternsWithBraceExpansion = exports2.isAffectDepthOfReadingPattern = exports2.endsWithSlashGlobStar = exports2.hasGlobStar = exports2.getBaseDirectory = exports2.isPatternRelatedToParentDirectory = exports2.getPatternsOutsideCurrentDirectory = exports2.getPatternsInsideCurrentDirectory = exports2.getPositivePatterns = exports2.getNegativePatterns = exports2.isPositivePattern = exports2.isNegativePattern = exports2.convertToNegativePattern = exports2.convertToPositivePattern = exports2.isDynamicPattern = exports2.isStaticPattern = void 0;
    var path = require("path");
    var globParent = require_glob_parent();
    var micromatch = require_micromatch();
    var GLOBSTAR = "**";
    var ESCAPE_SYMBOL = "\\";
    var COMMON_GLOB_SYMBOLS_RE = /[*?]|^!/;
    var REGEX_CHARACTER_CLASS_SYMBOLS_RE = /\[[^[]*]/;
    var REGEX_GROUP_SYMBOLS_RE = /(?:^|[^!*+?@])\([^(]*\|[^|]*\)/;
    var GLOB_EXTENSION_SYMBOLS_RE = /[!*+?@]\([^(]*\)/;
    var BRACE_EXPANSION_SEPARATORS_RE = /,|\.\./;
    var DOUBLE_SLASH_RE = /(?!^)\/{2,}/g;
    function isStaticPattern(pattern, options = {}) {
      return !isDynamicPattern(pattern, options);
    }
    exports2.isStaticPattern = isStaticPattern;
    function isDynamicPattern(pattern, options = {}) {
      if (pattern === "") {
        return false;
      }
      if (options.caseSensitiveMatch === false || pattern.includes(ESCAPE_SYMBOL)) {
        return true;
      }
      if (COMMON_GLOB_SYMBOLS_RE.test(pattern) || REGEX_CHARACTER_CLASS_SYMBOLS_RE.test(pattern) || REGEX_GROUP_SYMBOLS_RE.test(pattern)) {
        return true;
      }
      if (options.extglob !== false && GLOB_EXTENSION_SYMBOLS_RE.test(pattern)) {
        return true;
      }
      if (options.braceExpansion !== false && hasBraceExpansion(pattern)) {
        return true;
      }
      return false;
    }
    exports2.isDynamicPattern = isDynamicPattern;
    function hasBraceExpansion(pattern) {
      const openingBraceIndex = pattern.indexOf("{");
      if (openingBraceIndex === -1) {
        return false;
      }
      const closingBraceIndex = pattern.indexOf("}", openingBraceIndex + 1);
      if (closingBraceIndex === -1) {
        return false;
      }
      const braceContent = pattern.slice(openingBraceIndex, closingBraceIndex);
      return BRACE_EXPANSION_SEPARATORS_RE.test(braceContent);
    }
    function convertToPositivePattern(pattern) {
      return isNegativePattern(pattern) ? pattern.slice(1) : pattern;
    }
    exports2.convertToPositivePattern = convertToPositivePattern;
    function convertToNegativePattern(pattern) {
      return "!" + pattern;
    }
    exports2.convertToNegativePattern = convertToNegativePattern;
    function isNegativePattern(pattern) {
      return pattern.startsWith("!") && pattern[1] !== "(";
    }
    exports2.isNegativePattern = isNegativePattern;
    function isPositivePattern(pattern) {
      return !isNegativePattern(pattern);
    }
    exports2.isPositivePattern = isPositivePattern;
    function getNegativePatterns(patterns) {
      return patterns.filter(isNegativePattern);
    }
    exports2.getNegativePatterns = getNegativePatterns;
    function getPositivePatterns(patterns) {
      return patterns.filter(isPositivePattern);
    }
    exports2.getPositivePatterns = getPositivePatterns;
    function getPatternsInsideCurrentDirectory(patterns) {
      return patterns.filter((pattern) => !isPatternRelatedToParentDirectory(pattern));
    }
    exports2.getPatternsInsideCurrentDirectory = getPatternsInsideCurrentDirectory;
    function getPatternsOutsideCurrentDirectory(patterns) {
      return patterns.filter(isPatternRelatedToParentDirectory);
    }
    exports2.getPatternsOutsideCurrentDirectory = getPatternsOutsideCurrentDirectory;
    function isPatternRelatedToParentDirectory(pattern) {
      return pattern.startsWith("..") || pattern.startsWith("./..");
    }
    exports2.isPatternRelatedToParentDirectory = isPatternRelatedToParentDirectory;
    function getBaseDirectory(pattern) {
      return globParent(pattern, { flipBackslashes: false });
    }
    exports2.getBaseDirectory = getBaseDirectory;
    function hasGlobStar(pattern) {
      return pattern.includes(GLOBSTAR);
    }
    exports2.hasGlobStar = hasGlobStar;
    function endsWithSlashGlobStar(pattern) {
      return pattern.endsWith("/" + GLOBSTAR);
    }
    exports2.endsWithSlashGlobStar = endsWithSlashGlobStar;
    function isAffectDepthOfReadingPattern(pattern) {
      const basename = path.basename(pattern);
      return endsWithSlashGlobStar(pattern) || isStaticPattern(basename);
    }
    exports2.isAffectDepthOfReadingPattern = isAffectDepthOfReadingPattern;
    function expandPatternsWithBraceExpansion(patterns) {
      return patterns.reduce((collection, pattern) => {
        return collection.concat(expandBraceExpansion(pattern));
      }, []);
    }
    exports2.expandPatternsWithBraceExpansion = expandPatternsWithBraceExpansion;
    function expandBraceExpansion(pattern) {
      const patterns = micromatch.braces(pattern, { expand: true, nodupes: true, keepEscaping: true });
      patterns.sort((a, b) => a.length - b.length);
      return patterns.filter((pattern2) => pattern2 !== "");
    }
    exports2.expandBraceExpansion = expandBraceExpansion;
    function getPatternParts(pattern, options) {
      let { parts } = micromatch.scan(pattern, Object.assign(Object.assign({}, options), { parts: true }));
      if (parts.length === 0) {
        parts = [pattern];
      }
      if (parts[0].startsWith("/")) {
        parts[0] = parts[0].slice(1);
        parts.unshift("");
      }
      return parts;
    }
    exports2.getPatternParts = getPatternParts;
    function makeRe(pattern, options) {
      return micromatch.makeRe(pattern, options);
    }
    exports2.makeRe = makeRe;
    function convertPatternsToRe(patterns, options) {
      return patterns.map((pattern) => makeRe(pattern, options));
    }
    exports2.convertPatternsToRe = convertPatternsToRe;
    function matchAny(entry, patternsRe) {
      return patternsRe.some((patternRe) => patternRe.test(entry));
    }
    exports2.matchAny = matchAny;
    function removeDuplicateSlashes(pattern) {
      return pattern.replace(DOUBLE_SLASH_RE, "/");
    }
    exports2.removeDuplicateSlashes = removeDuplicateSlashes;
  }
});

// ../../node_modules/merge2/index.js
var require_merge2 = __commonJS({
  "../../node_modules/merge2/index.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream");
    var PassThrough = Stream.PassThrough;
    var slice = Array.prototype.slice;
    module2.exports = merge2;
    function merge2() {
      const streamsQueue = [];
      const args = slice.call(arguments);
      let merging = false;
      let options = args[args.length - 1];
      if (options && !Array.isArray(options) && options.pipe == null) {
        args.pop();
      } else {
        options = {};
      }
      const doEnd = options.end !== false;
      const doPipeError = options.pipeError === true;
      if (options.objectMode == null) {
        options.objectMode = true;
      }
      if (options.highWaterMark == null) {
        options.highWaterMark = 64 * 1024;
      }
      const mergedStream = PassThrough(options);
      function addStream() {
        for (let i = 0, len = arguments.length; i < len; i++) {
          streamsQueue.push(pauseStreams(arguments[i], options));
        }
        mergeStream();
        return this;
      }
      function mergeStream() {
        if (merging) {
          return;
        }
        merging = true;
        let streams = streamsQueue.shift();
        if (!streams) {
          process.nextTick(endStream);
          return;
        }
        if (!Array.isArray(streams)) {
          streams = [streams];
        }
        let pipesCount = streams.length + 1;
        function next() {
          if (--pipesCount > 0) {
            return;
          }
          merging = false;
          mergeStream();
        }
        function pipe(stream) {
          function onend() {
            stream.removeListener("merge2UnpipeEnd", onend);
            stream.removeListener("end", onend);
            if (doPipeError) {
              stream.removeListener("error", onerror);
            }
            next();
          }
          function onerror(err) {
            mergedStream.emit("error", err);
          }
          if (stream._readableState.endEmitted) {
            return next();
          }
          stream.on("merge2UnpipeEnd", onend);
          stream.on("end", onend);
          if (doPipeError) {
            stream.on("error", onerror);
          }
          stream.pipe(mergedStream, { end: false });
          stream.resume();
        }
        for (let i = 0; i < streams.length; i++) {
          pipe(streams[i]);
        }
        next();
      }
      function endStream() {
        merging = false;
        mergedStream.emit("queueDrain");
        if (doEnd) {
          mergedStream.end();
        }
      }
      mergedStream.setMaxListeners(0);
      mergedStream.add = addStream;
      mergedStream.on("unpipe", function(stream) {
        stream.emit("merge2UnpipeEnd");
      });
      if (args.length) {
        addStream.apply(null, args);
      }
      return mergedStream;
    }
    function pauseStreams(streams, options) {
      if (!Array.isArray(streams)) {
        if (!streams._readableState && streams.pipe) {
          streams = streams.pipe(PassThrough(options));
        }
        if (!streams._readableState || !streams.pause || !streams.pipe) {
          throw new Error("Only readable stream can be merged.");
        }
        streams.pause();
      } else {
        for (let i = 0, len = streams.length; i < len; i++) {
          streams[i] = pauseStreams(streams[i], options);
        }
      }
      return streams;
    }
  }
});

// ../../node_modules/fast-glob/out/utils/stream.js
var require_stream = __commonJS({
  "../../node_modules/fast-glob/out/utils/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.merge = void 0;
    var merge2 = require_merge2();
    function merge(streams) {
      const mergedStream = merge2(streams);
      streams.forEach((stream) => {
        stream.once("error", (error) => mergedStream.emit("error", error));
      });
      mergedStream.once("close", () => propagateCloseEventToSources(streams));
      mergedStream.once("end", () => propagateCloseEventToSources(streams));
      return mergedStream;
    }
    exports2.merge = merge;
    function propagateCloseEventToSources(streams) {
      streams.forEach((stream) => stream.emit("close"));
    }
  }
});

// ../../node_modules/fast-glob/out/utils/string.js
var require_string = __commonJS({
  "../../node_modules/fast-glob/out/utils/string.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isEmpty = exports2.isString = void 0;
    function isString(input) {
      return typeof input === "string";
    }
    exports2.isString = isString;
    function isEmpty(input) {
      return input === "";
    }
    exports2.isEmpty = isEmpty;
  }
});

// ../../node_modules/fast-glob/out/utils/index.js
var require_utils3 = __commonJS({
  "../../node_modules/fast-glob/out/utils/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.string = exports2.stream = exports2.pattern = exports2.path = exports2.fs = exports2.errno = exports2.array = void 0;
    var array = require_array();
    exports2.array = array;
    var errno = require_errno();
    exports2.errno = errno;
    var fs3 = require_fs();
    exports2.fs = fs3;
    var path = require_path();
    exports2.path = path;
    var pattern = require_pattern();
    exports2.pattern = pattern;
    var stream = require_stream();
    exports2.stream = stream;
    var string = require_string();
    exports2.string = string;
  }
});

// ../../node_modules/fast-glob/out/managers/tasks.js
var require_tasks = __commonJS({
  "../../node_modules/fast-glob/out/managers/tasks.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.convertPatternGroupToTask = exports2.convertPatternGroupsToTasks = exports2.groupPatternsByBaseDirectory = exports2.getNegativePatternsAsPositive = exports2.getPositivePatterns = exports2.convertPatternsToTasks = exports2.generate = void 0;
    var utils = require_utils3();
    function generate(input, settings) {
      const patterns = processPatterns(input, settings);
      const ignore = processPatterns(settings.ignore, settings);
      const positivePatterns = getPositivePatterns(patterns);
      const negativePatterns = getNegativePatternsAsPositive(patterns, ignore);
      const staticPatterns = positivePatterns.filter((pattern) => utils.pattern.isStaticPattern(pattern, settings));
      const dynamicPatterns = positivePatterns.filter((pattern) => utils.pattern.isDynamicPattern(pattern, settings));
      const staticTasks = convertPatternsToTasks(
        staticPatterns,
        negativePatterns,
        /* dynamic */
        false
      );
      const dynamicTasks = convertPatternsToTasks(
        dynamicPatterns,
        negativePatterns,
        /* dynamic */
        true
      );
      return staticTasks.concat(dynamicTasks);
    }
    exports2.generate = generate;
    function processPatterns(input, settings) {
      let patterns = input;
      if (settings.braceExpansion) {
        patterns = utils.pattern.expandPatternsWithBraceExpansion(patterns);
      }
      if (settings.baseNameMatch) {
        patterns = patterns.map((pattern) => pattern.includes("/") ? pattern : `**/${pattern}`);
      }
      return patterns.map((pattern) => utils.pattern.removeDuplicateSlashes(pattern));
    }
    function convertPatternsToTasks(positive, negative, dynamic) {
      const tasks = [];
      const patternsOutsideCurrentDirectory = utils.pattern.getPatternsOutsideCurrentDirectory(positive);
      const patternsInsideCurrentDirectory = utils.pattern.getPatternsInsideCurrentDirectory(positive);
      const outsideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsOutsideCurrentDirectory);
      const insideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsInsideCurrentDirectory);
      tasks.push(...convertPatternGroupsToTasks(outsideCurrentDirectoryGroup, negative, dynamic));
      if ("." in insideCurrentDirectoryGroup) {
        tasks.push(convertPatternGroupToTask(".", patternsInsideCurrentDirectory, negative, dynamic));
      } else {
        tasks.push(...convertPatternGroupsToTasks(insideCurrentDirectoryGroup, negative, dynamic));
      }
      return tasks;
    }
    exports2.convertPatternsToTasks = convertPatternsToTasks;
    function getPositivePatterns(patterns) {
      return utils.pattern.getPositivePatterns(patterns);
    }
    exports2.getPositivePatterns = getPositivePatterns;
    function getNegativePatternsAsPositive(patterns, ignore) {
      const negative = utils.pattern.getNegativePatterns(patterns).concat(ignore);
      const positive = negative.map(utils.pattern.convertToPositivePattern);
      return positive;
    }
    exports2.getNegativePatternsAsPositive = getNegativePatternsAsPositive;
    function groupPatternsByBaseDirectory(patterns) {
      const group = {};
      return patterns.reduce((collection, pattern) => {
        const base = utils.pattern.getBaseDirectory(pattern);
        if (base in collection) {
          collection[base].push(pattern);
        } else {
          collection[base] = [pattern];
        }
        return collection;
      }, group);
    }
    exports2.groupPatternsByBaseDirectory = groupPatternsByBaseDirectory;
    function convertPatternGroupsToTasks(positive, negative, dynamic) {
      return Object.keys(positive).map((base) => {
        return convertPatternGroupToTask(base, positive[base], negative, dynamic);
      });
    }
    exports2.convertPatternGroupsToTasks = convertPatternGroupsToTasks;
    function convertPatternGroupToTask(base, positive, negative, dynamic) {
      return {
        dynamic,
        positive,
        negative,
        base,
        patterns: [].concat(positive, negative.map(utils.pattern.convertToNegativePattern))
      };
    }
    exports2.convertPatternGroupToTask = convertPatternGroupToTask;
  }
});

// ../../node_modules/@nodelib/fs.stat/out/providers/async.js
var require_async = __commonJS({
  "../../node_modules/@nodelib/fs.stat/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.read = void 0;
    function read(path, settings, callback) {
      settings.fs.lstat(path, (lstatError, lstat) => {
        if (lstatError !== null) {
          callFailureCallback(callback, lstatError);
          return;
        }
        if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
          callSuccessCallback(callback, lstat);
          return;
        }
        settings.fs.stat(path, (statError, stat) => {
          if (statError !== null) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              callFailureCallback(callback, statError);
              return;
            }
            callSuccessCallback(callback, lstat);
            return;
          }
          if (settings.markSymbolicLink) {
            stat.isSymbolicLink = () => true;
          }
          callSuccessCallback(callback, stat);
        });
      });
    }
    exports2.read = read;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, result) {
      callback(null, result);
    }
  }
});

// ../../node_modules/@nodelib/fs.stat/out/providers/sync.js
var require_sync = __commonJS({
  "../../node_modules/@nodelib/fs.stat/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.read = void 0;
    function read(path, settings) {
      const lstat = settings.fs.lstatSync(path);
      if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
        return lstat;
      }
      try {
        const stat = settings.fs.statSync(path);
        if (settings.markSymbolicLink) {
          stat.isSymbolicLink = () => true;
        }
        return stat;
      } catch (error) {
        if (!settings.throwErrorOnBrokenSymbolicLink) {
          return lstat;
        }
        throw error;
      }
    }
    exports2.read = read;
  }
});

// ../../node_modules/@nodelib/fs.stat/out/adapters/fs.js
var require_fs2 = __commonJS({
  "../../node_modules/@nodelib/fs.stat/out/adapters/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createFileSystemAdapter = exports2.FILE_SYSTEM_ADAPTER = void 0;
    var fs3 = require("fs");
    exports2.FILE_SYSTEM_ADAPTER = {
      lstat: fs3.lstat,
      stat: fs3.stat,
      lstatSync: fs3.lstatSync,
      statSync: fs3.statSync
    };
    function createFileSystemAdapter(fsMethods) {
      if (fsMethods === void 0) {
        return exports2.FILE_SYSTEM_ADAPTER;
      }
      return Object.assign(Object.assign({}, exports2.FILE_SYSTEM_ADAPTER), fsMethods);
    }
    exports2.createFileSystemAdapter = createFileSystemAdapter;
  }
});

// ../../node_modules/@nodelib/fs.stat/out/settings.js
var require_settings = __commonJS({
  "../../node_modules/@nodelib/fs.stat/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fs3 = require_fs2();
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.followSymbolicLink = this._getValue(this._options.followSymbolicLink, true);
        this.fs = fs3.createFileSystemAdapter(this._options.fs);
        this.markSymbolicLink = this._getValue(this._options.markSymbolicLink, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports2.default = Settings;
  }
});

// ../../node_modules/@nodelib/fs.stat/out/index.js
var require_out = __commonJS({
  "../../node_modules/@nodelib/fs.stat/out/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.statSync = exports2.stat = exports2.Settings = void 0;
    var async = require_async();
    var sync2 = require_sync();
    var settings_1 = require_settings();
    exports2.Settings = settings_1.default;
    function stat(path, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        async.read(path, getSettings(), optionsOrSettingsOrCallback);
        return;
      }
      async.read(path, getSettings(optionsOrSettingsOrCallback), callback);
    }
    exports2.stat = stat;
    function statSync(path, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      return sync2.read(path, settings);
    }
    exports2.statSync = statSync;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// ../../node_modules/queue-microtask/index.js
var require_queue_microtask = __commonJS({
  "../../node_modules/queue-microtask/index.js"(exports2, module2) {
    var promise;
    module2.exports = typeof queueMicrotask === "function" ? queueMicrotask.bind(typeof window !== "undefined" ? window : global) : (cb) => (promise || (promise = Promise.resolve())).then(cb).catch((err) => setTimeout(() => {
      throw err;
    }, 0));
  }
});

// ../../node_modules/run-parallel/index.js
var require_run_parallel = __commonJS({
  "../../node_modules/run-parallel/index.js"(exports2, module2) {
    module2.exports = runParallel;
    var queueMicrotask2 = require_queue_microtask();
    function runParallel(tasks, cb) {
      let results, pending, keys;
      let isSync = true;
      if (Array.isArray(tasks)) {
        results = [];
        pending = tasks.length;
      } else {
        keys = Object.keys(tasks);
        results = {};
        pending = keys.length;
      }
      function done(err) {
        function end() {
          if (cb)
            cb(err, results);
          cb = null;
        }
        if (isSync)
          queueMicrotask2(end);
        else
          end();
      }
      function each(i, err, result) {
        results[i] = result;
        if (--pending === 0 || err) {
          done(err);
        }
      }
      if (!pending) {
        done(null);
      } else if (keys) {
        keys.forEach(function(key) {
          tasks[key](function(err, result) {
            each(key, err, result);
          });
        });
      } else {
        tasks.forEach(function(task, i) {
          task(function(err, result) {
            each(i, err, result);
          });
        });
      }
      isSync = false;
    }
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/constants.js
var require_constants3 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.IS_SUPPORT_READDIR_WITH_FILE_TYPES = void 0;
    var NODE_PROCESS_VERSION_PARTS = process.versions.node.split(".");
    if (NODE_PROCESS_VERSION_PARTS[0] === void 0 || NODE_PROCESS_VERSION_PARTS[1] === void 0) {
      throw new Error(`Unexpected behavior. The 'process.versions.node' variable has invalid value: ${process.versions.node}`);
    }
    var MAJOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[0], 10);
    var MINOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[1], 10);
    var SUPPORTED_MAJOR_VERSION = 10;
    var SUPPORTED_MINOR_VERSION = 10;
    var IS_MATCHED_BY_MAJOR = MAJOR_VERSION > SUPPORTED_MAJOR_VERSION;
    var IS_MATCHED_BY_MAJOR_AND_MINOR = MAJOR_VERSION === SUPPORTED_MAJOR_VERSION && MINOR_VERSION >= SUPPORTED_MINOR_VERSION;
    exports2.IS_SUPPORT_READDIR_WITH_FILE_TYPES = IS_MATCHED_BY_MAJOR || IS_MATCHED_BY_MAJOR_AND_MINOR;
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/utils/fs.js
var require_fs3 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/utils/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createDirentFromStats = void 0;
    var DirentFromStats = class {
      constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
      }
    };
    function createDirentFromStats(name, stats) {
      return new DirentFromStats(name, stats);
    }
    exports2.createDirentFromStats = createDirentFromStats;
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/utils/index.js
var require_utils4 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/utils/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fs = void 0;
    var fs3 = require_fs3();
    exports2.fs = fs3;
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/providers/common.js
var require_common = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/providers/common.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.joinPathSegments = void 0;
    function joinPathSegments(a, b, separator) {
      if (a.endsWith(separator)) {
        return a + b;
      }
      return a + separator + b;
    }
    exports2.joinPathSegments = joinPathSegments;
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/providers/async.js
var require_async2 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.readdir = exports2.readdirWithFileTypes = exports2.read = void 0;
    var fsStat = require_out();
    var rpl = require_run_parallel();
    var constants_1 = require_constants3();
    var utils = require_utils4();
    var common = require_common();
    function read(directory, settings, callback) {
      if (!settings.stats && constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        readdirWithFileTypes(directory, settings, callback);
        return;
      }
      readdir(directory, settings, callback);
    }
    exports2.read = read;
    function readdirWithFileTypes(directory, settings, callback) {
      settings.fs.readdir(directory, { withFileTypes: true }, (readdirError, dirents) => {
        if (readdirError !== null) {
          callFailureCallback(callback, readdirError);
          return;
        }
        const entries = dirents.map((dirent) => ({
          dirent,
          name: dirent.name,
          path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        }));
        if (!settings.followSymbolicLinks) {
          callSuccessCallback(callback, entries);
          return;
        }
        const tasks = entries.map((entry) => makeRplTaskEntry(entry, settings));
        rpl(tasks, (rplError, rplEntries) => {
          if (rplError !== null) {
            callFailureCallback(callback, rplError);
            return;
          }
          callSuccessCallback(callback, rplEntries);
        });
      });
    }
    exports2.readdirWithFileTypes = readdirWithFileTypes;
    function makeRplTaskEntry(entry, settings) {
      return (done) => {
        if (!entry.dirent.isSymbolicLink()) {
          done(null, entry);
          return;
        }
        settings.fs.stat(entry.path, (statError, stats) => {
          if (statError !== null) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              done(statError);
              return;
            }
            done(null, entry);
            return;
          }
          entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
          done(null, entry);
        });
      };
    }
    function readdir(directory, settings, callback) {
      settings.fs.readdir(directory, (readdirError, names) => {
        if (readdirError !== null) {
          callFailureCallback(callback, readdirError);
          return;
        }
        const tasks = names.map((name) => {
          const path = common.joinPathSegments(directory, name, settings.pathSegmentSeparator);
          return (done) => {
            fsStat.stat(path, settings.fsStatSettings, (error, stats) => {
              if (error !== null) {
                done(error);
                return;
              }
              const entry = {
                name,
                path,
                dirent: utils.fs.createDirentFromStats(name, stats)
              };
              if (settings.stats) {
                entry.stats = stats;
              }
              done(null, entry);
            });
          };
        });
        rpl(tasks, (rplError, entries) => {
          if (rplError !== null) {
            callFailureCallback(callback, rplError);
            return;
          }
          callSuccessCallback(callback, entries);
        });
      });
    }
    exports2.readdir = readdir;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, result) {
      callback(null, result);
    }
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/providers/sync.js
var require_sync2 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.readdir = exports2.readdirWithFileTypes = exports2.read = void 0;
    var fsStat = require_out();
    var constants_1 = require_constants3();
    var utils = require_utils4();
    var common = require_common();
    function read(directory, settings) {
      if (!settings.stats && constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        return readdirWithFileTypes(directory, settings);
      }
      return readdir(directory, settings);
    }
    exports2.read = read;
    function readdirWithFileTypes(directory, settings) {
      const dirents = settings.fs.readdirSync(directory, { withFileTypes: true });
      return dirents.map((dirent) => {
        const entry = {
          dirent,
          name: dirent.name,
          path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        };
        if (entry.dirent.isSymbolicLink() && settings.followSymbolicLinks) {
          try {
            const stats = settings.fs.statSync(entry.path);
            entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
          } catch (error) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              throw error;
            }
          }
        }
        return entry;
      });
    }
    exports2.readdirWithFileTypes = readdirWithFileTypes;
    function readdir(directory, settings) {
      const names = settings.fs.readdirSync(directory);
      return names.map((name) => {
        const entryPath = common.joinPathSegments(directory, name, settings.pathSegmentSeparator);
        const stats = fsStat.statSync(entryPath, settings.fsStatSettings);
        const entry = {
          name,
          path: entryPath,
          dirent: utils.fs.createDirentFromStats(name, stats)
        };
        if (settings.stats) {
          entry.stats = stats;
        }
        return entry;
      });
    }
    exports2.readdir = readdir;
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/adapters/fs.js
var require_fs4 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/adapters/fs.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createFileSystemAdapter = exports2.FILE_SYSTEM_ADAPTER = void 0;
    var fs3 = require("fs");
    exports2.FILE_SYSTEM_ADAPTER = {
      lstat: fs3.lstat,
      stat: fs3.stat,
      lstatSync: fs3.lstatSync,
      statSync: fs3.statSync,
      readdir: fs3.readdir,
      readdirSync: fs3.readdirSync
    };
    function createFileSystemAdapter(fsMethods) {
      if (fsMethods === void 0) {
        return exports2.FILE_SYSTEM_ADAPTER;
      }
      return Object.assign(Object.assign({}, exports2.FILE_SYSTEM_ADAPTER), fsMethods);
    }
    exports2.createFileSystemAdapter = createFileSystemAdapter;
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/settings.js
var require_settings2 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var fsStat = require_out();
    var fs3 = require_fs4();
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, false);
        this.fs = fs3.createFileSystemAdapter(this._options.fs);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path.sep);
        this.stats = this._getValue(this._options.stats, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
        this.fsStatSettings = new fsStat.Settings({
          followSymbolicLink: this.followSymbolicLinks,
          fs: this.fs,
          throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink
        });
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports2.default = Settings;
  }
});

// ../../node_modules/@nodelib/fs.scandir/out/index.js
var require_out2 = __commonJS({
  "../../node_modules/@nodelib/fs.scandir/out/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Settings = exports2.scandirSync = exports2.scandir = void 0;
    var async = require_async2();
    var sync2 = require_sync2();
    var settings_1 = require_settings2();
    exports2.Settings = settings_1.default;
    function scandir(path, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        async.read(path, getSettings(), optionsOrSettingsOrCallback);
        return;
      }
      async.read(path, getSettings(optionsOrSettingsOrCallback), callback);
    }
    exports2.scandir = scandir;
    function scandirSync(path, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      return sync2.read(path, settings);
    }
    exports2.scandirSync = scandirSync;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// ../../node_modules/reusify/reusify.js
var require_reusify = __commonJS({
  "../../node_modules/reusify/reusify.js"(exports2, module2) {
    "use strict";
    function reusify(Constructor) {
      var head = new Constructor();
      var tail = head;
      function get() {
        var current = head;
        if (current.next) {
          head = current.next;
        } else {
          head = new Constructor();
          tail = head;
        }
        current.next = null;
        return current;
      }
      function release(obj) {
        tail.next = obj;
        tail = obj;
      }
      return {
        get,
        release
      };
    }
    module2.exports = reusify;
  }
});

// ../../node_modules/fastq/queue.js
var require_queue = __commonJS({
  "../../node_modules/fastq/queue.js"(exports2, module2) {
    "use strict";
    var reusify = require_reusify();
    function fastqueue(context, worker, concurrency) {
      if (typeof context === "function") {
        concurrency = worker;
        worker = context;
        context = null;
      }
      if (concurrency < 1) {
        throw new Error("fastqueue concurrency must be greater than 1");
      }
      var cache = reusify(Task);
      var queueHead = null;
      var queueTail = null;
      var _running = 0;
      var errorHandler = null;
      var self2 = {
        push,
        drain: noop,
        saturated: noop,
        pause,
        paused: false,
        concurrency,
        running,
        resume,
        idle,
        length,
        getQueue,
        unshift,
        empty: noop,
        kill,
        killAndDrain,
        error
      };
      return self2;
      function running() {
        return _running;
      }
      function pause() {
        self2.paused = true;
      }
      function length() {
        var current = queueHead;
        var counter = 0;
        while (current) {
          current = current.next;
          counter++;
        }
        return counter;
      }
      function getQueue() {
        var current = queueHead;
        var tasks = [];
        while (current) {
          tasks.push(current.value);
          current = current.next;
        }
        return tasks;
      }
      function resume() {
        if (!self2.paused)
          return;
        self2.paused = false;
        for (var i = 0; i < self2.concurrency; i++) {
          _running++;
          release();
        }
      }
      function idle() {
        return _running === 0 && self2.length() === 0;
      }
      function push(value, done) {
        var current = cache.get();
        current.context = context;
        current.release = release;
        current.value = value;
        current.callback = done || noop;
        current.errorHandler = errorHandler;
        if (_running === self2.concurrency || self2.paused) {
          if (queueTail) {
            queueTail.next = current;
            queueTail = current;
          } else {
            queueHead = current;
            queueTail = current;
            self2.saturated();
          }
        } else {
          _running++;
          worker.call(context, current.value, current.worked);
        }
      }
      function unshift(value, done) {
        var current = cache.get();
        current.context = context;
        current.release = release;
        current.value = value;
        current.callback = done || noop;
        if (_running === self2.concurrency || self2.paused) {
          if (queueHead) {
            current.next = queueHead;
            queueHead = current;
          } else {
            queueHead = current;
            queueTail = current;
            self2.saturated();
          }
        } else {
          _running++;
          worker.call(context, current.value, current.worked);
        }
      }
      function release(holder) {
        if (holder) {
          cache.release(holder);
        }
        var next = queueHead;
        if (next) {
          if (!self2.paused) {
            if (queueTail === queueHead) {
              queueTail = null;
            }
            queueHead = next.next;
            next.next = null;
            worker.call(context, next.value, next.worked);
            if (queueTail === null) {
              self2.empty();
            }
          } else {
            _running--;
          }
        } else if (--_running === 0) {
          self2.drain();
        }
      }
      function kill() {
        queueHead = null;
        queueTail = null;
        self2.drain = noop;
      }
      function killAndDrain() {
        queueHead = null;
        queueTail = null;
        self2.drain();
        self2.drain = noop;
      }
      function error(handler) {
        errorHandler = handler;
      }
    }
    function noop() {
    }
    function Task() {
      this.value = null;
      this.callback = noop;
      this.next = null;
      this.release = noop;
      this.context = null;
      this.errorHandler = null;
      var self2 = this;
      this.worked = function worked(err, result) {
        var callback = self2.callback;
        var errorHandler = self2.errorHandler;
        var val = self2.value;
        self2.value = null;
        self2.callback = noop;
        if (self2.errorHandler) {
          errorHandler(err, val);
        }
        callback.call(self2.context, err, result);
        self2.release(self2);
      };
    }
    function queueAsPromised(context, worker, concurrency) {
      if (typeof context === "function") {
        concurrency = worker;
        worker = context;
        context = null;
      }
      function asyncWrapper(arg, cb) {
        worker.call(this, arg).then(function(res) {
          cb(null, res);
        }, cb);
      }
      var queue = fastqueue(context, asyncWrapper, concurrency);
      var pushCb = queue.push;
      var unshiftCb = queue.unshift;
      queue.push = push;
      queue.unshift = unshift;
      queue.drained = drained;
      return queue;
      function push(value) {
        var p = new Promise(function(resolve, reject) {
          pushCb(value, function(err, result) {
            if (err) {
              reject(err);
              return;
            }
            resolve(result);
          });
        });
        p.catch(noop);
        return p;
      }
      function unshift(value) {
        var p = new Promise(function(resolve, reject) {
          unshiftCb(value, function(err, result) {
            if (err) {
              reject(err);
              return;
            }
            resolve(result);
          });
        });
        p.catch(noop);
        return p;
      }
      function drained() {
        var previousDrain = queue.drain;
        var p = new Promise(function(resolve) {
          queue.drain = function() {
            previousDrain();
            resolve();
          };
        });
        return p;
      }
    }
    module2.exports = fastqueue;
    module2.exports.promise = queueAsPromised;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/readers/common.js
var require_common2 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/readers/common.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.joinPathSegments = exports2.replacePathSegmentSeparator = exports2.isAppliedFilter = exports2.isFatalError = void 0;
    function isFatalError(settings, error) {
      if (settings.errorFilter === null) {
        return true;
      }
      return !settings.errorFilter(error);
    }
    exports2.isFatalError = isFatalError;
    function isAppliedFilter(filter, value) {
      return filter === null || filter(value);
    }
    exports2.isAppliedFilter = isAppliedFilter;
    function replacePathSegmentSeparator(filepath, separator) {
      return filepath.split(/[/\\]/).join(separator);
    }
    exports2.replacePathSegmentSeparator = replacePathSegmentSeparator;
    function joinPathSegments(a, b, separator) {
      if (a === "") {
        return b;
      }
      if (a.endsWith(separator)) {
        return a + b;
      }
      return a + separator + b;
    }
    exports2.joinPathSegments = joinPathSegments;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/readers/reader.js
var require_reader = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/readers/reader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var common = require_common2();
    var Reader = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._root = common.replacePathSegmentSeparator(_root, _settings.pathSegmentSeparator);
      }
    };
    exports2.default = Reader;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/readers/async.js
var require_async3 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/readers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var events_1 = require("events");
    var fsScandir = require_out2();
    var fastq = require_queue();
    var common = require_common2();
    var reader_1 = require_reader();
    var AsyncReader = class extends reader_1.default {
      constructor(_root, _settings) {
        super(_root, _settings);
        this._settings = _settings;
        this._scandir = fsScandir.scandir;
        this._emitter = new events_1.EventEmitter();
        this._queue = fastq(this._worker.bind(this), this._settings.concurrency);
        this._isFatalError = false;
        this._isDestroyed = false;
        this._queue.drain = () => {
          if (!this._isFatalError) {
            this._emitter.emit("end");
          }
        };
      }
      read() {
        this._isFatalError = false;
        this._isDestroyed = false;
        setImmediate(() => {
          this._pushToQueue(this._root, this._settings.basePath);
        });
        return this._emitter;
      }
      get isDestroyed() {
        return this._isDestroyed;
      }
      destroy() {
        if (this._isDestroyed) {
          throw new Error("The reader is already destroyed");
        }
        this._isDestroyed = true;
        this._queue.killAndDrain();
      }
      onEntry(callback) {
        this._emitter.on("entry", callback);
      }
      onError(callback) {
        this._emitter.once("error", callback);
      }
      onEnd(callback) {
        this._emitter.once("end", callback);
      }
      _pushToQueue(directory, base) {
        const queueItem = { directory, base };
        this._queue.push(queueItem, (error) => {
          if (error !== null) {
            this._handleError(error);
          }
        });
      }
      _worker(item, done) {
        this._scandir(item.directory, this._settings.fsScandirSettings, (error, entries) => {
          if (error !== null) {
            done(error, void 0);
            return;
          }
          for (const entry of entries) {
            this._handleEntry(entry, item.base);
          }
          done(null, void 0);
        });
      }
      _handleError(error) {
        if (this._isDestroyed || !common.isFatalError(this._settings, error)) {
          return;
        }
        this._isFatalError = true;
        this._isDestroyed = true;
        this._emitter.emit("error", error);
      }
      _handleEntry(entry, base) {
        if (this._isDestroyed || this._isFatalError) {
          return;
        }
        const fullpath = entry.path;
        if (base !== void 0) {
          entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
          this._emitEntry(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
          this._pushToQueue(fullpath, base === void 0 ? void 0 : entry.path);
        }
      }
      _emitEntry(entry) {
        this._emitter.emit("entry", entry);
      }
    };
    exports2.default = AsyncReader;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/providers/async.js
var require_async4 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var async_1 = require_async3();
    var AsyncProvider = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new async_1.default(this._root, this._settings);
        this._storage = [];
      }
      read(callback) {
        this._reader.onError((error) => {
          callFailureCallback(callback, error);
        });
        this._reader.onEntry((entry) => {
          this._storage.push(entry);
        });
        this._reader.onEnd(() => {
          callSuccessCallback(callback, this._storage);
        });
        this._reader.read();
      }
    };
    exports2.default = AsyncProvider;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, entries) {
      callback(null, entries);
    }
  }
});

// ../../node_modules/@nodelib/fs.walk/out/providers/stream.js
var require_stream2 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/providers/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var async_1 = require_async3();
    var StreamProvider = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new async_1.default(this._root, this._settings);
        this._stream = new stream_1.Readable({
          objectMode: true,
          read: () => {
          },
          destroy: () => {
            if (!this._reader.isDestroyed) {
              this._reader.destroy();
            }
          }
        });
      }
      read() {
        this._reader.onError((error) => {
          this._stream.emit("error", error);
        });
        this._reader.onEntry((entry) => {
          this._stream.push(entry);
        });
        this._reader.onEnd(() => {
          this._stream.push(null);
        });
        this._reader.read();
        return this._stream;
      }
    };
    exports2.default = StreamProvider;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/readers/sync.js
var require_sync3 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/readers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fsScandir = require_out2();
    var common = require_common2();
    var reader_1 = require_reader();
    var SyncReader = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._scandir = fsScandir.scandirSync;
        this._storage = [];
        this._queue = /* @__PURE__ */ new Set();
      }
      read() {
        this._pushToQueue(this._root, this._settings.basePath);
        this._handleQueue();
        return this._storage;
      }
      _pushToQueue(directory, base) {
        this._queue.add({ directory, base });
      }
      _handleQueue() {
        for (const item of this._queue.values()) {
          this._handleDirectory(item.directory, item.base);
        }
      }
      _handleDirectory(directory, base) {
        try {
          const entries = this._scandir(directory, this._settings.fsScandirSettings);
          for (const entry of entries) {
            this._handleEntry(entry, base);
          }
        } catch (error) {
          this._handleError(error);
        }
      }
      _handleError(error) {
        if (!common.isFatalError(this._settings, error)) {
          return;
        }
        throw error;
      }
      _handleEntry(entry, base) {
        const fullpath = entry.path;
        if (base !== void 0) {
          entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
          this._pushToStorage(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
          this._pushToQueue(fullpath, base === void 0 ? void 0 : entry.path);
        }
      }
      _pushToStorage(entry) {
        this._storage.push(entry);
      }
    };
    exports2.default = SyncReader;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/providers/sync.js
var require_sync4 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var sync_1 = require_sync3();
    var SyncProvider = class {
      constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new sync_1.default(this._root, this._settings);
      }
      read() {
        return this._reader.read();
      }
    };
    exports2.default = SyncProvider;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/settings.js
var require_settings3 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var fsScandir = require_out2();
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.basePath = this._getValue(this._options.basePath, void 0);
        this.concurrency = this._getValue(this._options.concurrency, Number.POSITIVE_INFINITY);
        this.deepFilter = this._getValue(this._options.deepFilter, null);
        this.entryFilter = this._getValue(this._options.entryFilter, null);
        this.errorFilter = this._getValue(this._options.errorFilter, null);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path.sep);
        this.fsScandirSettings = new fsScandir.Settings({
          followSymbolicLinks: this._options.followSymbolicLinks,
          fs: this._options.fs,
          pathSegmentSeparator: this._options.pathSegmentSeparator,
          stats: this._options.stats,
          throwErrorOnBrokenSymbolicLink: this._options.throwErrorOnBrokenSymbolicLink
        });
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports2.default = Settings;
  }
});

// ../../node_modules/@nodelib/fs.walk/out/index.js
var require_out3 = __commonJS({
  "../../node_modules/@nodelib/fs.walk/out/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Settings = exports2.walkStream = exports2.walkSync = exports2.walk = void 0;
    var async_1 = require_async4();
    var stream_1 = require_stream2();
    var sync_1 = require_sync4();
    var settings_1 = require_settings3();
    exports2.Settings = settings_1.default;
    function walk(directory, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        new async_1.default(directory, getSettings()).read(optionsOrSettingsOrCallback);
        return;
      }
      new async_1.default(directory, getSettings(optionsOrSettingsOrCallback)).read(callback);
    }
    exports2.walk = walk;
    function walkSync(directory, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      const provider = new sync_1.default(directory, settings);
      return provider.read();
    }
    exports2.walkSync = walkSync;
    function walkStream(directory, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      const provider = new stream_1.default(directory, settings);
      return provider.read();
    }
    exports2.walkStream = walkStream;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// ../../node_modules/fast-glob/out/readers/reader.js
var require_reader2 = __commonJS({
  "../../node_modules/fast-glob/out/readers/reader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var fsStat = require_out();
    var utils = require_utils3();
    var Reader = class {
      constructor(_settings) {
        this._settings = _settings;
        this._fsStatSettings = new fsStat.Settings({
          followSymbolicLink: this._settings.followSymbolicLinks,
          fs: this._settings.fs,
          throwErrorOnBrokenSymbolicLink: this._settings.followSymbolicLinks
        });
      }
      _getFullEntryPath(filepath) {
        return path.resolve(this._settings.cwd, filepath);
      }
      _makeEntry(stats, pattern) {
        const entry = {
          name: pattern,
          path: pattern,
          dirent: utils.fs.createDirentFromStats(pattern, stats)
        };
        if (this._settings.stats) {
          entry.stats = stats;
        }
        return entry;
      }
      _isFatalError(error) {
        return !utils.errno.isEnoentCodeError(error) && !this._settings.suppressErrors;
      }
    };
    exports2.default = Reader;
  }
});

// ../../node_modules/fast-glob/out/readers/stream.js
var require_stream3 = __commonJS({
  "../../node_modules/fast-glob/out/readers/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var fsStat = require_out();
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var ReaderStream = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkStream = fsWalk.walkStream;
        this._stat = fsStat.stat;
      }
      dynamic(root, options) {
        return this._walkStream(root, options);
      }
      static(patterns, options) {
        const filepaths = patterns.map(this._getFullEntryPath, this);
        const stream = new stream_1.PassThrough({ objectMode: true });
        stream._write = (index, _enc, done) => {
          return this._getEntry(filepaths[index], patterns[index], options).then((entry) => {
            if (entry !== null && options.entryFilter(entry)) {
              stream.push(entry);
            }
            if (index === filepaths.length - 1) {
              stream.end();
            }
            done();
          }).catch(done);
        };
        for (let i = 0; i < filepaths.length; i++) {
          stream.write(i);
        }
        return stream;
      }
      _getEntry(filepath, pattern, options) {
        return this._getStat(filepath).then((stats) => this._makeEntry(stats, pattern)).catch((error) => {
          if (options.errorFilter(error)) {
            return null;
          }
          throw error;
        });
      }
      _getStat(filepath) {
        return new Promise((resolve, reject) => {
          this._stat(filepath, this._fsStatSettings, (error, stats) => {
            return error === null ? resolve(stats) : reject(error);
          });
        });
      }
    };
    exports2.default = ReaderStream;
  }
});

// ../../node_modules/fast-glob/out/readers/async.js
var require_async5 = __commonJS({
  "../../node_modules/fast-glob/out/readers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var stream_1 = require_stream3();
    var ReaderAsync = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkAsync = fsWalk.walk;
        this._readerStream = new stream_1.default(this._settings);
      }
      dynamic(root, options) {
        return new Promise((resolve, reject) => {
          this._walkAsync(root, options, (error, entries) => {
            if (error === null) {
              resolve(entries);
            } else {
              reject(error);
            }
          });
        });
      }
      async static(patterns, options) {
        const entries = [];
        const stream = this._readerStream.static(patterns, options);
        return new Promise((resolve, reject) => {
          stream.once("error", reject);
          stream.on("data", (entry) => entries.push(entry));
          stream.once("end", () => resolve(entries));
        });
      }
    };
    exports2.default = ReaderAsync;
  }
});

// ../../node_modules/fast-glob/out/providers/matchers/matcher.js
var require_matcher = __commonJS({
  "../../node_modules/fast-glob/out/providers/matchers/matcher.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var Matcher = class {
      constructor(_patterns, _settings, _micromatchOptions) {
        this._patterns = _patterns;
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this._storage = [];
        this._fillStorage();
      }
      _fillStorage() {
        for (const pattern of this._patterns) {
          const segments = this._getPatternSegments(pattern);
          const sections = this._splitSegmentsIntoSections(segments);
          this._storage.push({
            complete: sections.length <= 1,
            pattern,
            segments,
            sections
          });
        }
      }
      _getPatternSegments(pattern) {
        const parts = utils.pattern.getPatternParts(pattern, this._micromatchOptions);
        return parts.map((part) => {
          const dynamic = utils.pattern.isDynamicPattern(part, this._settings);
          if (!dynamic) {
            return {
              dynamic: false,
              pattern: part
            };
          }
          return {
            dynamic: true,
            pattern: part,
            patternRe: utils.pattern.makeRe(part, this._micromatchOptions)
          };
        });
      }
      _splitSegmentsIntoSections(segments) {
        return utils.array.splitWhen(segments, (segment) => segment.dynamic && utils.pattern.hasGlobStar(segment.pattern));
      }
    };
    exports2.default = Matcher;
  }
});

// ../../node_modules/fast-glob/out/providers/matchers/partial.js
var require_partial = __commonJS({
  "../../node_modules/fast-glob/out/providers/matchers/partial.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var matcher_1 = require_matcher();
    var PartialMatcher = class extends matcher_1.default {
      match(filepath) {
        const parts = filepath.split("/");
        const levels = parts.length;
        const patterns = this._storage.filter((info) => !info.complete || info.segments.length > levels);
        for (const pattern of patterns) {
          const section = pattern.sections[0];
          if (!pattern.complete && levels > section.length) {
            return true;
          }
          const match = parts.every((part, index) => {
            const segment = pattern.segments[index];
            if (segment.dynamic && segment.patternRe.test(part)) {
              return true;
            }
            if (!segment.dynamic && segment.pattern === part) {
              return true;
            }
            return false;
          });
          if (match) {
            return true;
          }
        }
        return false;
      }
    };
    exports2.default = PartialMatcher;
  }
});

// ../../node_modules/fast-glob/out/providers/filters/deep.js
var require_deep = __commonJS({
  "../../node_modules/fast-glob/out/providers/filters/deep.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var partial_1 = require_partial();
    var DeepFilter = class {
      constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
      }
      getFilter(basePath, positive, negative) {
        const matcher = this._getMatcher(positive);
        const negativeRe = this._getNegativePatternsRe(negative);
        return (entry) => this._filter(basePath, entry, matcher, negativeRe);
      }
      _getMatcher(patterns) {
        return new partial_1.default(patterns, this._settings, this._micromatchOptions);
      }
      _getNegativePatternsRe(patterns) {
        const affectDepthOfReadingPatterns = patterns.filter(utils.pattern.isAffectDepthOfReadingPattern);
        return utils.pattern.convertPatternsToRe(affectDepthOfReadingPatterns, this._micromatchOptions);
      }
      _filter(basePath, entry, matcher, negativeRe) {
        if (this._isSkippedByDeep(basePath, entry.path)) {
          return false;
        }
        if (this._isSkippedSymbolicLink(entry)) {
          return false;
        }
        const filepath = utils.path.removeLeadingDotSegment(entry.path);
        if (this._isSkippedByPositivePatterns(filepath, matcher)) {
          return false;
        }
        return this._isSkippedByNegativePatterns(filepath, negativeRe);
      }
      _isSkippedByDeep(basePath, entryPath) {
        if (this._settings.deep === Infinity) {
          return false;
        }
        return this._getEntryLevel(basePath, entryPath) >= this._settings.deep;
      }
      _getEntryLevel(basePath, entryPath) {
        const entryPathDepth = entryPath.split("/").length;
        if (basePath === "") {
          return entryPathDepth;
        }
        const basePathDepth = basePath.split("/").length;
        return entryPathDepth - basePathDepth;
      }
      _isSkippedSymbolicLink(entry) {
        return !this._settings.followSymbolicLinks && entry.dirent.isSymbolicLink();
      }
      _isSkippedByPositivePatterns(entryPath, matcher) {
        return !this._settings.baseNameMatch && !matcher.match(entryPath);
      }
      _isSkippedByNegativePatterns(entryPath, patternsRe) {
        return !utils.pattern.matchAny(entryPath, patternsRe);
      }
    };
    exports2.default = DeepFilter;
  }
});

// ../../node_modules/fast-glob/out/providers/filters/entry.js
var require_entry = __commonJS({
  "../../node_modules/fast-glob/out/providers/filters/entry.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var EntryFilter = class {
      constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this.index = /* @__PURE__ */ new Map();
      }
      getFilter(positive, negative) {
        const positiveRe = utils.pattern.convertPatternsToRe(positive, this._micromatchOptions);
        const negativeRe = utils.pattern.convertPatternsToRe(negative, Object.assign(Object.assign({}, this._micromatchOptions), { dot: true }));
        return (entry) => this._filter(entry, positiveRe, negativeRe);
      }
      _filter(entry, positiveRe, negativeRe) {
        const filepath = utils.path.removeLeadingDotSegment(entry.path);
        if (this._settings.unique && this._isDuplicateEntry(filepath)) {
          return false;
        }
        if (this._onlyFileFilter(entry) || this._onlyDirectoryFilter(entry)) {
          return false;
        }
        if (this._isSkippedByAbsoluteNegativePatterns(filepath, negativeRe)) {
          return false;
        }
        const isDirectory = entry.dirent.isDirectory();
        const isMatched = this._isMatchToPatterns(filepath, positiveRe, isDirectory) && !this._isMatchToPatterns(filepath, negativeRe, isDirectory);
        if (this._settings.unique && isMatched) {
          this._createIndexRecord(filepath);
        }
        return isMatched;
      }
      _isDuplicateEntry(filepath) {
        return this.index.has(filepath);
      }
      _createIndexRecord(filepath) {
        this.index.set(filepath, void 0);
      }
      _onlyFileFilter(entry) {
        return this._settings.onlyFiles && !entry.dirent.isFile();
      }
      _onlyDirectoryFilter(entry) {
        return this._settings.onlyDirectories && !entry.dirent.isDirectory();
      }
      _isSkippedByAbsoluteNegativePatterns(entryPath, patternsRe) {
        if (!this._settings.absolute) {
          return false;
        }
        const fullpath = utils.path.makeAbsolute(this._settings.cwd, entryPath);
        return utils.pattern.matchAny(fullpath, patternsRe);
      }
      _isMatchToPatterns(filepath, patternsRe, isDirectory) {
        const isMatched = utils.pattern.matchAny(filepath, patternsRe);
        if (!isMatched && isDirectory) {
          return utils.pattern.matchAny(filepath + "/", patternsRe);
        }
        return isMatched;
      }
    };
    exports2.default = EntryFilter;
  }
});

// ../../node_modules/fast-glob/out/providers/filters/error.js
var require_error = __commonJS({
  "../../node_modules/fast-glob/out/providers/filters/error.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var ErrorFilter = class {
      constructor(_settings) {
        this._settings = _settings;
      }
      getFilter() {
        return (error) => this._isNonFatalError(error);
      }
      _isNonFatalError(error) {
        return utils.errno.isEnoentCodeError(error) || this._settings.suppressErrors;
      }
    };
    exports2.default = ErrorFilter;
  }
});

// ../../node_modules/fast-glob/out/providers/transformers/entry.js
var require_entry2 = __commonJS({
  "../../node_modules/fast-glob/out/providers/transformers/entry.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils3();
    var EntryTransformer = class {
      constructor(_settings) {
        this._settings = _settings;
      }
      getTransformer() {
        return (entry) => this._transform(entry);
      }
      _transform(entry) {
        let filepath = entry.path;
        if (this._settings.absolute) {
          filepath = utils.path.makeAbsolute(this._settings.cwd, filepath);
          filepath = utils.path.unixify(filepath);
        }
        if (this._settings.markDirectories && entry.dirent.isDirectory()) {
          filepath += "/";
        }
        if (!this._settings.objectMode) {
          return filepath;
        }
        return Object.assign(Object.assign({}, entry), { path: filepath });
      }
    };
    exports2.default = EntryTransformer;
  }
});

// ../../node_modules/fast-glob/out/providers/provider.js
var require_provider = __commonJS({
  "../../node_modules/fast-glob/out/providers/provider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path = require("path");
    var deep_1 = require_deep();
    var entry_1 = require_entry();
    var error_1 = require_error();
    var entry_2 = require_entry2();
    var Provider = class {
      constructor(_settings) {
        this._settings = _settings;
        this.errorFilter = new error_1.default(this._settings);
        this.entryFilter = new entry_1.default(this._settings, this._getMicromatchOptions());
        this.deepFilter = new deep_1.default(this._settings, this._getMicromatchOptions());
        this.entryTransformer = new entry_2.default(this._settings);
      }
      _getRootDirectory(task) {
        return path.resolve(this._settings.cwd, task.base);
      }
      _getReaderOptions(task) {
        const basePath = task.base === "." ? "" : task.base;
        return {
          basePath,
          pathSegmentSeparator: "/",
          concurrency: this._settings.concurrency,
          deepFilter: this.deepFilter.getFilter(basePath, task.positive, task.negative),
          entryFilter: this.entryFilter.getFilter(task.positive, task.negative),
          errorFilter: this.errorFilter.getFilter(),
          followSymbolicLinks: this._settings.followSymbolicLinks,
          fs: this._settings.fs,
          stats: this._settings.stats,
          throwErrorOnBrokenSymbolicLink: this._settings.throwErrorOnBrokenSymbolicLink,
          transform: this.entryTransformer.getTransformer()
        };
      }
      _getMicromatchOptions() {
        return {
          dot: this._settings.dot,
          matchBase: this._settings.baseNameMatch,
          nobrace: !this._settings.braceExpansion,
          nocase: !this._settings.caseSensitiveMatch,
          noext: !this._settings.extglob,
          noglobstar: !this._settings.globstar,
          posix: true,
          strictSlashes: false
        };
      }
    };
    exports2.default = Provider;
  }
});

// ../../node_modules/fast-glob/out/providers/async.js
var require_async6 = __commonJS({
  "../../node_modules/fast-glob/out/providers/async.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var async_1 = require_async5();
    var provider_1 = require_provider();
    var ProviderAsync = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new async_1.default(this._settings);
      }
      async read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const entries = await this.api(root, task, options);
        return entries.map((entry) => options.transform(entry));
      }
      api(root, task, options) {
        if (task.dynamic) {
          return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
      }
    };
    exports2.default = ProviderAsync;
  }
});

// ../../node_modules/fast-glob/out/providers/stream.js
var require_stream4 = __commonJS({
  "../../node_modules/fast-glob/out/providers/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var stream_2 = require_stream3();
    var provider_1 = require_provider();
    var ProviderStream = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new stream_2.default(this._settings);
      }
      read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const source = this.api(root, task, options);
        const destination = new stream_1.Readable({ objectMode: true, read: () => {
        } });
        source.once("error", (error) => destination.emit("error", error)).on("data", (entry) => destination.emit("data", options.transform(entry))).once("end", () => destination.emit("end"));
        destination.once("close", () => source.destroy());
        return destination;
      }
      api(root, task, options) {
        if (task.dynamic) {
          return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
      }
    };
    exports2.default = ProviderStream;
  }
});

// ../../node_modules/fast-glob/out/readers/sync.js
var require_sync5 = __commonJS({
  "../../node_modules/fast-glob/out/readers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fsStat = require_out();
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var ReaderSync = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkSync = fsWalk.walkSync;
        this._statSync = fsStat.statSync;
      }
      dynamic(root, options) {
        return this._walkSync(root, options);
      }
      static(patterns, options) {
        const entries = [];
        for (const pattern of patterns) {
          const filepath = this._getFullEntryPath(pattern);
          const entry = this._getEntry(filepath, pattern, options);
          if (entry === null || !options.entryFilter(entry)) {
            continue;
          }
          entries.push(entry);
        }
        return entries;
      }
      _getEntry(filepath, pattern, options) {
        try {
          const stats = this._getStat(filepath);
          return this._makeEntry(stats, pattern);
        } catch (error) {
          if (options.errorFilter(error)) {
            return null;
          }
          throw error;
        }
      }
      _getStat(filepath) {
        return this._statSync(filepath, this._fsStatSettings);
      }
    };
    exports2.default = ReaderSync;
  }
});

// ../../node_modules/fast-glob/out/providers/sync.js
var require_sync6 = __commonJS({
  "../../node_modules/fast-glob/out/providers/sync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var sync_1 = require_sync5();
    var provider_1 = require_provider();
    var ProviderSync = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new sync_1.default(this._settings);
      }
      read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const entries = this.api(root, task, options);
        return entries.map(options.transform);
      }
      api(root, task, options) {
        if (task.dynamic) {
          return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
      }
    };
    exports2.default = ProviderSync;
  }
});

// ../../node_modules/fast-glob/out/settings.js
var require_settings4 = __commonJS({
  "../../node_modules/fast-glob/out/settings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DEFAULT_FILE_SYSTEM_ADAPTER = void 0;
    var fs3 = require("fs");
    var os = require("os");
    var CPU_COUNT = Math.max(os.cpus().length, 1);
    exports2.DEFAULT_FILE_SYSTEM_ADAPTER = {
      lstat: fs3.lstat,
      lstatSync: fs3.lstatSync,
      stat: fs3.stat,
      statSync: fs3.statSync,
      readdir: fs3.readdir,
      readdirSync: fs3.readdirSync
    };
    var Settings = class {
      constructor(_options = {}) {
        this._options = _options;
        this.absolute = this._getValue(this._options.absolute, false);
        this.baseNameMatch = this._getValue(this._options.baseNameMatch, false);
        this.braceExpansion = this._getValue(this._options.braceExpansion, true);
        this.caseSensitiveMatch = this._getValue(this._options.caseSensitiveMatch, true);
        this.concurrency = this._getValue(this._options.concurrency, CPU_COUNT);
        this.cwd = this._getValue(this._options.cwd, process.cwd());
        this.deep = this._getValue(this._options.deep, Infinity);
        this.dot = this._getValue(this._options.dot, false);
        this.extglob = this._getValue(this._options.extglob, true);
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, true);
        this.fs = this._getFileSystemMethods(this._options.fs);
        this.globstar = this._getValue(this._options.globstar, true);
        this.ignore = this._getValue(this._options.ignore, []);
        this.markDirectories = this._getValue(this._options.markDirectories, false);
        this.objectMode = this._getValue(this._options.objectMode, false);
        this.onlyDirectories = this._getValue(this._options.onlyDirectories, false);
        this.onlyFiles = this._getValue(this._options.onlyFiles, true);
        this.stats = this._getValue(this._options.stats, false);
        this.suppressErrors = this._getValue(this._options.suppressErrors, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, false);
        this.unique = this._getValue(this._options.unique, true);
        if (this.onlyDirectories) {
          this.onlyFiles = false;
        }
        if (this.stats) {
          this.objectMode = true;
        }
        this.ignore = [].concat(this.ignore);
      }
      _getValue(option, value) {
        return option === void 0 ? value : option;
      }
      _getFileSystemMethods(methods = {}) {
        return Object.assign(Object.assign({}, exports2.DEFAULT_FILE_SYSTEM_ADAPTER), methods);
      }
    };
    exports2.default = Settings;
  }
});

// ../../node_modules/fast-glob/out/index.js
var require_out4 = __commonJS({
  "../../node_modules/fast-glob/out/index.js"(exports2, module2) {
    "use strict";
    var taskManager = require_tasks();
    var async_1 = require_async6();
    var stream_1 = require_stream4();
    var sync_1 = require_sync6();
    var settings_1 = require_settings4();
    var utils = require_utils3();
    async function FastGlob(source, options) {
      assertPatternsInput(source);
      const works = getWorks(source, async_1.default, options);
      const result = await Promise.all(works);
      return utils.array.flatten(result);
    }
    (function(FastGlob2) {
      FastGlob2.glob = FastGlob2;
      FastGlob2.globSync = sync2;
      FastGlob2.globStream = stream;
      FastGlob2.async = FastGlob2;
      function sync2(source, options) {
        assertPatternsInput(source);
        const works = getWorks(source, sync_1.default, options);
        return utils.array.flatten(works);
      }
      FastGlob2.sync = sync2;
      function stream(source, options) {
        assertPatternsInput(source);
        const works = getWorks(source, stream_1.default, options);
        return utils.stream.merge(works);
      }
      FastGlob2.stream = stream;
      function generateTasks(source, options) {
        assertPatternsInput(source);
        const patterns = [].concat(source);
        const settings = new settings_1.default(options);
        return taskManager.generate(patterns, settings);
      }
      FastGlob2.generateTasks = generateTasks;
      function isDynamicPattern(source, options) {
        assertPatternsInput(source);
        const settings = new settings_1.default(options);
        return utils.pattern.isDynamicPattern(source, settings);
      }
      FastGlob2.isDynamicPattern = isDynamicPattern;
      function escapePath(source) {
        assertPatternsInput(source);
        return utils.path.escape(source);
      }
      FastGlob2.escapePath = escapePath;
      function convertPathToPattern(source) {
        assertPatternsInput(source);
        return utils.path.convertPathToPattern(source);
      }
      FastGlob2.convertPathToPattern = convertPathToPattern;
      let posix;
      (function(posix2) {
        function escapePath2(source) {
          assertPatternsInput(source);
          return utils.path.escapePosixPath(source);
        }
        posix2.escapePath = escapePath2;
        function convertPathToPattern2(source) {
          assertPatternsInput(source);
          return utils.path.convertPosixPathToPattern(source);
        }
        posix2.convertPathToPattern = convertPathToPattern2;
      })(posix = FastGlob2.posix || (FastGlob2.posix = {}));
      let win32;
      (function(win322) {
        function escapePath2(source) {
          assertPatternsInput(source);
          return utils.path.escapeWindowsPath(source);
        }
        win322.escapePath = escapePath2;
        function convertPathToPattern2(source) {
          assertPatternsInput(source);
          return utils.path.convertWindowsPathToPattern(source);
        }
        win322.convertPathToPattern = convertPathToPattern2;
      })(win32 = FastGlob2.win32 || (FastGlob2.win32 = {}));
    })(FastGlob || (FastGlob = {}));
    function getWorks(source, _Provider, options) {
      const patterns = [].concat(source);
      const settings = new settings_1.default(options);
      const tasks = taskManager.generate(patterns, settings);
      const provider = new _Provider(settings);
      return tasks.map(provider.read, provider);
    }
    function assertPatternsInput(input) {
      const source = [].concat(input);
      const isValidSource = source.every((item) => utils.string.isString(item) && !utils.string.isEmpty(item));
      if (!isValidSource) {
        throw new TypeError("Patterns must be a string (non empty) or an array of strings");
      }
    }
    module2.exports = FastGlob;
  }
});

// src/targets/duckdb-node-mvp.worker.ts
var duckdb_node_mvp_worker_exports = {};
__export(duckdb_node_mvp_worker_exports, {
  registerWorker: () => registerWorker
});
module.exports = __toCommonJS(duckdb_node_mvp_worker_exports);

// src/json_typedef.ts
var arrow = __toESM(require("apache-arrow"));
function arrowToSQLType(type) {
  switch (type.typeId) {
    case arrow.Type.Binary:
      return { sqlType: "binary" };
    case arrow.Type.Bool:
      return { sqlType: "bool" };
    case arrow.Type.Date:
      return { sqlType: "date" };
    case arrow.Type.DateDay:
      return { sqlType: "date32[d]" };
    case arrow.Type.DateMillisecond:
      return { sqlType: "date64[ms]" };
    case arrow.Type.Decimal: {
      const dec = type;
      return { sqlType: "decimal", precision: dec.precision, scale: dec.scale };
    }
    case arrow.Type.Float:
      return { sqlType: "float" };
    case arrow.Type.Float16:
      return { sqlType: "float16" };
    case arrow.Type.Float32:
      return { sqlType: "float32" };
    case arrow.Type.Float64:
      return { sqlType: "float64" };
    case arrow.Type.Int:
      return { sqlType: "int32" };
    case arrow.Type.Int16:
      return { sqlType: "int16" };
    case arrow.Type.Int32:
      return { sqlType: "int32" };
    case arrow.Type.Int64:
      return { sqlType: "int64" };
    case arrow.Type.Uint16:
      return { sqlType: "uint16" };
    case arrow.Type.Uint32:
      return { sqlType: "uint32" };
    case arrow.Type.Uint64:
      return { sqlType: "uint64" };
    case arrow.Type.Uint8:
      return { sqlType: "uint8" };
    case arrow.Type.IntervalDayTime:
      return { sqlType: "interval[dt]" };
    case arrow.Type.IntervalYearMonth:
      return { sqlType: "interval[m]" };
    case arrow.Type.List: {
      const list = type;
      return {
        sqlType: "list",
        valueType: arrowToSQLType(list.valueType)
      };
    }
    case arrow.Type.FixedSizeBinary: {
      const bin = type;
      return { sqlType: "fixedsizebinary", byteWidth: bin.byteWidth };
    }
    case arrow.Type.Null:
      return { sqlType: "null" };
    case arrow.Type.Utf8:
      return { sqlType: "utf8" };
    case arrow.Type.Struct: {
      const struct_ = type;
      return {
        sqlType: "struct",
        fields: struct_.children.map((c) => arrowToSQLField(c.name, c.type))
      };
    }
    case arrow.Type.Map: {
      const map_ = type;
      return {
        sqlType: "map",
        keyType: arrowToSQLType(map_.keyType),
        valueType: arrowToSQLType(map_.valueType)
      };
    }
    case arrow.Type.Time:
      return { sqlType: "time[s]" };
    case arrow.Type.TimeMicrosecond:
      return { sqlType: "time[us]" };
    case arrow.Type.TimeMillisecond:
      return { sqlType: "time[ms]" };
    case arrow.Type.TimeNanosecond:
      return { sqlType: "time[ns]" };
    case arrow.Type.TimeSecond:
      return { sqlType: "time[s]" };
    case arrow.Type.Timestamp: {
      const ts = type;
      return { sqlType: "timestamp", timezone: ts.timezone || void 0 };
    }
    case arrow.Type.TimestampSecond: {
      const ts = type;
      return { sqlType: "timestamp[s]", timezone: ts.timezone || void 0 };
    }
    case arrow.Type.TimestampMicrosecond: {
      const ts = type;
      return { sqlType: "timestamp[us]", timezone: ts.timezone || void 0 };
    }
    case arrow.Type.TimestampNanosecond: {
      const ts = type;
      return { sqlType: "timestamp[ns]", timezone: ts.timezone || void 0 };
    }
    case arrow.Type.TimestampMillisecond: {
      const ts = type;
      return { sqlType: "timestamp[ms]", timezone: ts.timezone || void 0 };
    }
  }
  throw new Error(`unsupported arrow type: ${type.toString()}`);
}
function arrowToSQLField(name, type) {
  const t = arrowToSQLType(type);
  t.name = name;
  return t;
}

// src/bindings/connection.ts
var arrow2 = __toESM(require("apache-arrow"));
var DuckDBConnection = class {
  /** Constructor */
  constructor(bindings, conn) {
    this._bindings = bindings;
    this._conn = conn;
  }
  /** Close a connection */
  close() {
    this._bindings.disconnect(this._conn);
  }
  /** Brave souls may use this function to consume the underlying connection id */
  useUnsafe(callback) {
    return callback(this._bindings, this._conn);
  }
  /** Run a query */
  query(text) {
    const buffer = this._bindings.runQuery(this._conn, text);
    const reader = arrow2.RecordBatchReader.from(buffer);
    console.assert(reader.isSync());
    console.assert(reader.isFile());
    return new arrow2.Table(reader);
  }
  /** Send a query */
  async send(text, allowStreamResult = false) {
    let header = this._bindings.startPendingQuery(this._conn, text, allowStreamResult);
    while (header == null) {
      header = await new Promise((resolve, reject) => {
        try {
          resolve(this._bindings.pollPendingQuery(this._conn));
        } catch (e) {
          console.log(e);
          if (e.message.includes("worker is not set!")) {
            reject(new Error("Worker has been terminated"));
          } else {
            reject(e);
          }
        }
      });
    }
    const iter = new ResultStreamIterator(this._bindings, this._conn, header);
    const reader = arrow2.RecordBatchReader.from(iter);
    console.assert(reader.isSync());
    console.assert(reader.isStream());
    return reader;
  }
  /** Cancel a query that was sent earlier */
  cancelSent() {
    return this._bindings.cancelPendingQuery(this._conn);
  }
  /** Get table names */
  getTableNames(query) {
    return this._bindings.getTableNames(this._conn, query);
  }
  /** Create a prepared statement */
  prepare(text) {
    const stmt = this._bindings.createPrepared(this._conn, text);
    return new PreparedStatement(this._bindings, this._conn, stmt);
  }
  /** Create a scalar function */
  createScalarFunction(name, returns, func) {
    this._bindings.createScalarFunction(this._conn, name, returns, func);
  }
  /** Insert an arrow table */
  insertArrowTable(table, options) {
    const buffer = arrow2.tableToIPC(table, "stream");
    this.insertArrowFromIPCStream(buffer, options);
  }
  /** Insert an arrow table from an ipc stream */
  insertArrowFromIPCStream(buffer, options) {
    this._bindings.insertArrowFromIPCStream(this._conn, buffer, options);
  }
  /** Inesrt csv file from path */
  insertCSVFromPath(path, options) {
    this._bindings.insertCSVFromPath(this._conn, path, options);
  }
  /** Insert json file from path */
  insertJSONFromPath(path, options) {
    this._bindings.insertJSONFromPath(this._conn, path, options);
  }
};
var ResultStreamIterator = class {
  constructor(bindings, conn, header) {
    this.bindings = bindings;
    this.conn = conn;
    this.header = header;
    this._first = true;
    this._depleted = false;
  }
  next() {
    if (this._first) {
      this._first = false;
      return { done: false, value: this.header };
    }
    if (this._depleted) {
      return { done: true, value: null };
    }
    let bufferI8 = null;
    do {
      bufferI8 = this.bindings.fetchQueryResults(this.conn);
    } while (bufferI8 == null);
    this._depleted = bufferI8.length == 0;
    return {
      done: this._depleted,
      value: bufferI8
    };
  }
  [Symbol.iterator]() {
    return this;
  }
};
var PreparedStatement = class {
  /** Constructor */
  constructor(bindings, connectionId, statementId) {
    this.bindings = bindings;
    this.connectionId = connectionId;
    this.statementId = statementId;
  }
  /** Close a prepared statement */
  close() {
    this.bindings.closePrepared(this.connectionId, this.statementId);
  }
  /** Run a prepared statement */
  query(...params) {
    const buffer = this.bindings.runPrepared(this.connectionId, this.statementId, params);
    const reader = arrow2.RecordBatchReader.from(buffer);
    console.assert(reader.isSync());
    console.assert(reader.isFile());
    return new arrow2.Table(reader);
  }
  /** Send a prepared statement */
  send(...params) {
    const header = this.bindings.sendPrepared(this.connectionId, this.statementId, params);
    const iter = new ResultStreamIterator(this.bindings, this.connectionId, header);
    const reader = arrow2.RecordBatchReader.from(iter);
    console.assert(reader.isSync());
    console.assert(reader.isStream());
    return reader;
  }
};

// src/status.ts
function IsArrowBuffer(status) {
  return status <= 255 /* MAX_ARROW_ERROR */;
}
function IsDuckDBWasmRetry(status) {
  return status === 256 /* DUCKDB_WASM_RETRY */;
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
  console.error(`FAIL WITH: ${msg}`);
  mod.ccall("duckdb_web_fail_with", null, ["string"], [msg]);
}
function copyBuffer(mod, begin, length) {
  const buffer = mod.HEAPU8.subarray(begin, begin + length);
  const copy = new Uint8Array(new ArrayBuffer(buffer.byteLength));
  copy.set(buffer);
  return copy;
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

// src/bindings/file_stats.ts
var FileStatistics = class {
  constructor(u8array) {
    const f64 = new Float64Array(u8array.buffer, u8array.byteOffset, u8array.byteLength / 8);
    const blocks = new Uint8Array(new ArrayBuffer(u8array.byteLength));
    blocks.set(u8array.subarray(7 * 8));
    this.totalFileReadsCold = f64[0];
    this.totalFileReadsAhead = f64[1];
    this.totalFileReadsCached = f64[2];
    this.totalFileWrites = f64[3];
    this.totalPageAccesses = f64[4];
    this.totalPageLoads = f64[5];
    this.blockSize = f64[6];
    this.blockStats = blocks;
  }
  /** The block stats */
  getBlockStats(index, out) {
    out = out || {
      file_reads_cold: 0,
      file_reads_ahead: 0,
      file_reads_cached: 0,
      file_writes: 0,
      page_accesses: 0,
      page_loads: 0
    };
    out.file_writes = this.blockStats[index * 3 + 0] & 15;
    out.file_reads_cold = this.blockStats[index * 3 + 0] >> 4;
    out.file_reads_ahead = this.blockStats[index * 3 + 1] & 15;
    out.file_reads_cached = this.blockStats[index * 3 + 1] >> 4;
    out.page_accesses = this.blockStats[index * 3 + 1] & 15;
    out.page_loads = this.blockStats[index * 3 + 1] >> 4;
    return out;
  }
};

// src/bindings/bindings_base.ts
var TEXT_ENCODER2 = new TextEncoder();
var DuckDBBindingsBase = class {
  constructor(logger, runtime) {
    /** The instance */
    this._instance = null;
    /** The loading promise */
    this._initPromise = null;
    /** The resolver for the open promise (called by onRuntimeInitialized) */
    this._initPromiseResolver = () => {
    };
    /** Instantiate the module */
    this.onInstantiationProgress = [];
    this._logger = logger;
    this._runtime = runtime;
    this._nextUDFId = 1;
  }
  /** Get the logger */
  get logger() {
    return this._logger;
  }
  /** Get the instance */
  get mod() {
    return this._instance;
  }
  /** Get the instance */
  get pthread() {
    return this.mod.PThread || null;
  }
  /** Instantiate the database */
  async instantiate(onProgress = (_) => {
  }) {
    if (this._instance != null) {
      return this;
    }
    if (this._initPromise != null) {
      this.onInstantiationProgress.push(onProgress);
      await this._initPromise;
    }
    this._initPromise = new Promise((resolve) => {
      this._initPromiseResolver = resolve;
    });
    this.onInstantiationProgress = [onProgress];
    this._instance = await this.instantiateImpl({
      print: console.log.bind(console),
      printErr: console.log.bind(console),
      onRuntimeInitialized: this._initPromiseResolver
    });
    await this._initPromise;
    this._initPromise = null;
    this.onInstantiationProgress = this.onInstantiationProgress.filter((x) => x != onProgress);
    globalThis.DUCKDB_BINDINGS = this;
    return this;
  }
  /** Open a database with a config */
  open(config) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_open", ["string"], [JSON.stringify(config)]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Reset the database */
  reset() {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_reset", [], []);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Get the version */
  getVersion() {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_get_version", [], []);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const version = readString(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return version;
  }
  /** Get the feature flags */
  getFeatureFlags() {
    return this.mod.ccall("duckdb_web_get_feature_flags", "number", [], []);
  }
  /** Tokenize a script */
  tokenize(text) {
    const BUF = TEXT_ENCODER2.encode(text);
    const bufferPtr = this.mod._malloc(BUF.length);
    const bufferOfs = this.mod.HEAPU8.subarray(bufferPtr, bufferPtr + BUF.length);
    bufferOfs.set(BUF);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_tokenize_buffer",
      ["number", "number"],
      [bufferPtr, BUF.length]
    );
    this.mod._free(bufferPtr);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const res = readString(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return JSON.parse(res);
  }
  /** Connect to database */
  connect() {
    const conn = this.mod.ccall("duckdb_web_connect", "number", [], []);
    return new DuckDBConnection(this, conn);
  }
  /** Disconnect from database */
  disconnect(conn) {
    this.mod.ccall("duckdb_web_disconnect", null, ["number"], [conn]);
    if (this.pthread) {
      for (const worker of [...this.pthread.runningWorkers, ...this.pthread.unusedWorkers]) {
        worker.postMessage({
          cmd: "dropUDFFunctions",
          connectionId: conn
        });
      }
    }
  }
  /** Send a query and return the full result */
  runQuery(conn, text) {
    const BUF = TEXT_ENCODER2.encode(text);
    const bufferPtr = this.mod._malloc(BUF.length);
    const bufferOfs = this.mod.HEAPU8.subarray(bufferPtr, bufferPtr + BUF.length);
    bufferOfs.set(BUF);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_query_run_buffer",
      ["number", "number", "number"],
      [conn, bufferPtr, BUF.length]
    );
    this.mod._free(bufferPtr);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const res = copyBuffer(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return res;
  }
  /**
   *  Start a pending query asynchronously.
   *  This method returns either the arrow ipc schema or null.
   *  On null, the query has to be executed using `pollPendingQuery` until that returns != null.
   *  Results can then be fetched using `fetchQueryResults`
   */
  startPendingQuery(conn, text, allowStreamResult = false) {
    const BUF = TEXT_ENCODER2.encode(text);
    const bufferPtr = this.mod._malloc(BUF.length);
    const bufferOfs = this.mod.HEAPU8.subarray(bufferPtr, bufferPtr + BUF.length);
    bufferOfs.set(BUF);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_pending_query_start_buffer",
      ["number", "number", "number", "boolean"],
      [conn, bufferPtr, BUF.length, allowStreamResult]
    );
    this.mod._free(bufferPtr);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    if (d == 0) {
      return null;
    }
    const res = copyBuffer(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return res;
  }
  /** Poll a pending query */
  pollPendingQuery(conn) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_pending_query_poll", ["number"], [conn]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    if (d == 0) {
      return null;
    }
    const res = copyBuffer(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return res;
  }
  /** Cancel a pending query */
  cancelPendingQuery(conn) {
    return this.mod.ccall("duckdb_web_pending_query_cancel", "boolean", ["number"], [conn]);
  }
  /** Fetch query results */
  fetchQueryResults(conn) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_query_fetch_results", ["number"], [conn]);
    if (IsDuckDBWasmRetry(s)) {
      dropResponseBuffers(this.mod);
      return null;
    }
    if (!IsArrowBuffer(s)) {
      throw new Error(
        "Unexpected StatusCode from duckdb_web_query_fetch_results (" + s + ") and with self reported error as" + readString(this.mod, d, n)
      );
    }
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const res = copyBuffer(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return res;
  }
  /** Get table names */
  getTableNames(conn, text) {
    const BUF = TEXT_ENCODER2.encode(text);
    const bufferPtr = this.mod._malloc(BUF.length);
    const bufferOfs = this.mod.HEAPU8.subarray(bufferPtr, bufferPtr + BUF.length);
    bufferOfs.set(BUF);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_get_tablenames_buffer",
      ["number", "number", "number"],
      [conn, bufferPtr, BUF.length]
    );
    this.mod._free(bufferPtr);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const res = readString(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return JSON.parse(res);
  }
  /** Create a scalar function */
  createScalarFunction(conn, name, returns, func) {
    const decl = {
      functionId: this._nextUDFId,
      name,
      returnType: arrowToSQLType(returns)
    };
    const def = {
      functionId: decl.functionId,
      connectionId: conn,
      name,
      returnType: returns,
      func
    };
    this._nextUDFId += 1;
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_udf_scalar_create",
      ["number", "string"],
      [conn, JSON.stringify(decl)]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
    globalThis.DUCKDB_RUNTIME._udfFunctions = (globalThis.DUCKDB_RUNTIME._udfFunctions || /* @__PURE__ */ new Map()).set(
      def.functionId,
      def
    );
    if (this.pthread) {
      for (const worker of [...this.pthread.runningWorkers, ...this.pthread.unusedWorkers]) {
        worker.postMessage({
          cmd: "registerUDFFunction",
          udf: def
        });
      }
    }
  }
  /** Prepare a statement and return its identifier */
  createPrepared(conn, text) {
    const BUF = TEXT_ENCODER2.encode(text);
    const bufferPtr = this.mod._malloc(BUF.length);
    const bufferOfs = this.mod.HEAPU8.subarray(bufferPtr, bufferPtr + BUF.length);
    bufferOfs.set(BUF);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_prepared_create_buffer",
      ["number", "number", "number"],
      [conn, bufferPtr, BUF.length]
    );
    this.mod._free(bufferPtr);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
    return d;
  }
  /** Close a prepared statement */
  closePrepared(conn, statement) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_prepared_close", ["number", "number"], [conn, statement]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Execute a prepared statement and return the full result */
  runPrepared(conn, statement, params) {
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_prepared_run",
      ["number", "number", "string"],
      [conn, statement, JSON.stringify(params)]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const res = copyBuffer(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return res;
  }
  /** Execute a prepared statement and stream the result */
  sendPrepared(conn, statement, params) {
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_prepared_send",
      ["number", "number", "string"],
      [conn, statement, JSON.stringify(params)]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const res = copyBuffer(this.mod, d, n);
    dropResponseBuffers(this.mod);
    return res;
  }
  /** Insert record batches from an arrow ipc stream */
  insertArrowFromIPCStream(conn, buffer, options) {
    if (buffer.length == 0)
      return;
    const bufferPtr = this.mod._malloc(buffer.length);
    const bufferOfs = this.mod.HEAPU8.subarray(bufferPtr, bufferPtr + buffer.length);
    bufferOfs.set(buffer);
    const optJSON = options ? JSON.stringify(options) : "";
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_insert_arrow_from_ipc_stream",
      ["number", "number", "number", "string"],
      [conn, bufferPtr, buffer.length, optJSON]
    );
    this.mod._free(bufferPtr);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
  }
  /** Insert csv from path */
  insertCSVFromPath(conn, path, options) {
    if (options.columns !== void 0) {
      options.columnsFlat = [];
      for (const k in options.columns) {
        options.columnsFlat.push(arrowToSQLField(k, options.columns[k]));
      }
    }
    const opt = { ...options };
    opt.columns = opt.columnsFlat;
    delete opt.columnsFlat;
    const optJSON = JSON.stringify(opt);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_insert_csv_from_path",
      ["number", "string", "string"],
      [conn, path, optJSON]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
  }
  /** Insert json from path */
  insertJSONFromPath(conn, path, options) {
    if (options.columns !== void 0) {
      options.columnsFlat = [];
      for (const k in options.columns) {
        options.columnsFlat.push(arrowToSQLField(k, options.columns[k]));
      }
    }
    const opt = { ...options };
    opt.columns = opt.columnsFlat;
    delete opt.columnsFlat;
    const optJSON = JSON.stringify(opt);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_insert_json_from_path",
      ["number", "string", "string"],
      [conn, path, optJSON]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
  }
  /** Glob file infos */
  globFiles(path) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_fs_glob_file_infos", ["string"], [path]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const infoStr = readString(this.mod, d, n);
    dropResponseBuffers(this.mod);
    const info = JSON.parse(infoStr);
    if (info == null) {
      return [];
    }
    return info;
  }
  /** Register a file object URL */
  registerFileURL(name, url, proto, directIO = false) {
    if (url === void 0) {
      url = name;
    }
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_fs_register_file_url",
      ["string", "string"],
      [name, url, proto, directIO]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Register file text */
  registerFileText(name, text) {
    const buffer = TEXT_ENCODER2.encode(text);
    this.registerFileBuffer(name, buffer);
  }
  /** Register a file buffer */
  registerFileBuffer(name, buffer) {
    const ptr = this.mod._malloc(buffer.length);
    const dst = this.mod.HEAPU8.subarray(ptr, ptr + buffer.length);
    dst.set(buffer);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_fs_register_file_buffer",
      ["string", "number", "number"],
      [name, ptr, buffer.length]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  async prepareFileHandle(fileName, protocol) {
    if (protocol === 3 /* BROWSER_FSACCESS */ && this._runtime.prepareFileHandles) {
      const list = await this._runtime.prepareFileHandles([fileName], 3 /* BROWSER_FSACCESS */);
      for (const item of list) {
        const { handle, path: filePath, fromCached } = item;
        if (!fromCached && handle.getSize()) {
          await this.registerFileHandleAsync(filePath, handle, 3 /* BROWSER_FSACCESS */, true);
        }
      }
      return;
    }
    throw new Error(`prepareFileHandle: unsupported protocol ${protocol}`);
  }
  /** Prepare a file handle that could only be acquired aschronously */
  async prepareDBFileHandle(path, protocol) {
    if (protocol === 3 /* BROWSER_FSACCESS */ && this._runtime.prepareDBFileHandle) {
      const list = await this._runtime.prepareDBFileHandle(path, 3 /* BROWSER_FSACCESS */);
      for (const item of list) {
        const { handle, path: filePath, fromCached } = item;
        if (!fromCached && handle.getSize()) {
          await this.registerFileHandleAsync(filePath, handle, 3 /* BROWSER_FSACCESS */, true);
        }
      }
      return;
    }
    throw new Error(`prepareDBFileHandle: unsupported protocol ${protocol}`);
  }
  /** Prepare a file object URL */
  async prepareFileHandleAsync(name, handle, protocol, directIO) {
    if (protocol === 3 /* BROWSER_FSACCESS */) {
      if (handle instanceof FileSystemSyncAccessHandle) {
      } else if (handle instanceof FileSystemFileHandle) {
        const fileHandle = handle;
        try {
          handle = await fileHandle.createSyncAccessHandle();
        } catch (e) {
          throw new Error(e.message + ":" + name);
        }
      } else if (name != null) {
        try {
          const opfsRoot = await navigator.storage.getDirectory();
          const fileHandle = await opfsRoot.getFileHandle(name);
          handle = await fileHandle.createSyncAccessHandle();
        } catch (e) {
          throw new Error(e.message + ":" + name);
        }
      }
    }
    return handle;
  }
  /** Register a file object URL async */
  async registerFileHandleAsync(name, handle, protocol, directIO) {
    const handle_inner = await this.prepareFileHandleAsync(name, handle, protocol, directIO);
    this.registerFileHandle(name, handle_inner, protocol, directIO);
  }
  /** Register a file object URL */
  registerFileHandle(name, handle, protocol, directIO) {
    var _a;
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_fs_register_file_url",
      ["string", "string", "number", "boolean"],
      [name, name, protocol, directIO]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
    globalThis.DUCKDB_RUNTIME._files = (globalThis.DUCKDB_RUNTIME._files || /* @__PURE__ */ new Map()).set(name, handle);
    if ((_a = globalThis.DUCKDB_RUNTIME._preparedHandles) == null ? void 0 : _a[name]) {
      delete globalThis.DUCKDB_RUNTIME._preparedHandles[name];
    }
    if (this.pthread) {
      for (const worker of this.pthread.runningWorkers) {
        worker.postMessage({
          cmd: "registerFileHandle",
          fileName: name,
          fileHandle: handle
        });
      }
      for (const worker of this.pthread.unusedWorkers) {
        worker.postMessage({
          cmd: "dropFileHandle",
          fileName: name
        });
      }
    }
  }
  /** Drop file */
  dropFile(name) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_fs_drop_file", ["string"], [name]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Drop files */
  dropFiles(names) {
    const pointers = [];
    let pointerOfArray = -1;
    try {
      for (const str of names ?? []) {
        if (str !== null && str !== void 0 && str.length > 0) {
          const size = this.mod.lengthBytesUTF8(str) + 1;
          const ret = this.mod._malloc(size);
          if (!ret) {
            throw new Error(`Failed to allocate memory for string: ${str}`);
          }
          this.mod.stringToUTF8(str, ret, size);
          pointers.push(ret);
        }
      }
      pointerOfArray = this.mod._malloc(pointers.length * 4);
      if (!pointerOfArray) {
        throw new Error(`Failed to allocate memory for pointers array`);
      }
      for (let i = 0; i < pointers.length; i++) {
        this.mod.HEAP32[(pointerOfArray >> 2) + i] = pointers[i];
      }
      const [s, d, n] = callSRet(
        this.mod,
        "duckdb_web_fs_drop_files",
        [
          "number",
          "number"
        ],
        [
          pointerOfArray,
          pointers.length
        ]
      );
      if (s !== 0 /* SUCCESS */) {
        throw new Error(readString(this.mod, d, n));
      }
      dropResponseBuffers(this.mod);
    } finally {
      for (const pointer of pointers) {
        this.mod._free(pointer);
      }
      if (pointerOfArray > 0) {
        this.mod._free(pointerOfArray);
      }
    }
  }
  /** Flush all files */
  flushFiles() {
    this.mod.ccall("duckdb_web_flush_files", null, [], []);
  }
  /** Write a file to a path */
  copyFileToPath(name, path) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_copy_file_to_path", ["string", "string"], [name, path]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Write a file to a buffer */
  copyFileToBuffer(name) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_copy_file_to_buffer", ["string"], [name]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    const buffer = this.mod.HEAPU8.subarray(d, d + n);
    const copy = new Uint8Array(buffer.length);
    copy.set(buffer);
    dropResponseBuffers(this.mod);
    return copy;
  }
  /** Enable tracking of file statistics */
  async registerOPFSFileName(file) {
    if (file.startsWith("opfs://")) {
      return this.prepareFileHandle(file, 3 /* BROWSER_FSACCESS */);
    } else {
      throw new Error("Not an OPFS file name: " + file);
    }
  }
  collectFileStatistics(file, enable) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_collect_file_stats", ["string", "boolean"], [file, enable]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
  }
  /** Export file statistics */
  exportFileStatistics(file) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_export_file_stats", ["string"], [file]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    return new FileStatistics(this.mod.HEAPU8.subarray(d, d + n));
  }
};

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

// src/bindings/bindings_node_mvp.ts
var import_duckdb_mvp2 = __toESM(require_duckdb_mvp());

// src/bindings/bindings_node_base.ts
var import_duckdb_mvp = __toESM(require_duckdb_mvp());
var import_fs = __toESM(require("fs"));
var DuckDBNodeBindings = class extends DuckDBBindingsBase {
  /** Constructor */
  constructor(logger, runtime, mainModulePath, pthreadWorkerPath) {
    super(logger, runtime);
    this.mainModulePath = mainModulePath;
    this.pthreadWorkerPath = pthreadWorkerPath;
  }
  /** Locate a file */
  locateFile(path, prefix) {
    if (path.endsWith(".wasm")) {
      return this.mainModulePath;
    }
    if (path.endsWith(".worker.js")) {
      if (!this.pthreadWorkerPath) {
        throw new Error("Missing DuckDB worker path!");
      }
      return this.pthreadWorkerPath;
    }
    throw new Error(`WASM instantiation requested unexpected file: prefix=${prefix} path=${path}`);
  }
  /** Instantiate the wasm module */
  instantiateWasm(imports, success) {
    globalThis.DUCKDB_RUNTIME = {};
    for (const func of Object.getOwnPropertyNames(this._runtime)) {
      if (func == "constructor")
        continue;
      globalThis.DUCKDB_RUNTIME[func] = Object.getOwnPropertyDescriptor(this._runtime, func).value;
    }
    const buf = import_fs.default.readFileSync(this.mainModulePath);
    WebAssembly.instantiate(buf, imports).then((output) => {
      success(output.instance, output.module);
    });
    return [];
  }
  /** Instantiate the bindings */
  instantiateImpl(moduleOverrides) {
    return (0, import_duckdb_mvp.default)({
      ...moduleOverrides,
      instantiateWasm: this.instantiateWasm.bind(this)
    });
  }
};

// src/bindings/bindings_node_mvp.ts
var DuckDB = class extends DuckDBNodeBindings {
  /** Constructor */
  constructor(logger, runtime, mainModulePath, pthreadWorkerPath = null) {
    super(logger, runtime, mainModulePath, pthreadWorkerPath);
  }
  /** Instantiate the bindings */
  instantiateImpl(moduleOverrides) {
    return (0, import_duckdb_mvp2.default)({
      ...moduleOverrides,
      instantiateWasm: this.instantiateWasm.bind(this),
      locateFile: this.locateFile.bind(this)
    });
  }
};

// src/bindings/runtime_node.ts
var import_fs2 = __toESM(require("fs"));
var fg = __toESM(require_out4());
var NODE_RUNTIME = {
  _files: /* @__PURE__ */ new Map(),
  _filesById: /* @__PURE__ */ new Map(),
  _fileInfoCache: /* @__PURE__ */ new Map(),
  _udfFunctions: /* @__PURE__ */ new Map(),
  resolveFileInfo(mod, fileId) {
    try {
      const cached = NODE_RUNTIME._fileInfoCache.get(fileId);
      const [s, d, n] = callSRet(
        mod,
        "duckdb_web_fs_get_file_info_by_id",
        ["number", "number"],
        [fileId, (cached == null ? void 0 : cached.cacheEpoch) || 0]
      );
      if (s !== 0 /* SUCCESS */) {
        failWith(mod, readString(mod, d, n));
        return null;
      } else if (n === 0) {
        dropResponseBuffers(mod);
        return cached;
      }
      const infoStr = readString(mod, d, n);
      dropResponseBuffers(mod);
      const info = JSON.parse(infoStr);
      if (info == null)
        return null;
      NODE_RUNTIME._fileInfoCache.set(fileId, info);
      return info;
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
      return null;
    }
  },
  testPlatformFeature: (_mod, feature) => {
    switch (feature) {
      case 1:
        return typeof BigInt64Array !== "undefined";
      default:
        console.warn(`test for unknown feature: ${feature}`);
        return false;
    }
  },
  getDefaultDataProtocol(mod) {
    return 1 /* NODE_FS */;
  },
  openFile(mod, fileId, flags) {
    var _a, _b;
    try {
      NODE_RUNTIME._fileInfoCache.delete(fileId);
      const file = NODE_RUNTIME.resolveFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 1 /* NODE_FS */: {
          let fd = (_a = NODE_RUNTIME._files) == null ? void 0 : _a.get(file.dataUrl);
          if (fd === null || fd === void 0) {
            if (flags & 128 /* FILE_FLAGS_NULL_IF_NOT_EXISTS */) {
              return 0;
            }
            fd = import_fs2.default.openSync(
              file.dataUrl,
              import_fs2.default.constants.O_CREAT | import_fs2.default.constants.O_RDWR,
              import_fs2.default.constants.S_IRUSR | import_fs2.default.constants.S_IWUSR
            );
            (_b = NODE_RUNTIME._filesById) == null ? void 0 : _b.set(file.fileId, fd);
          }
          const fileSize = import_fs2.default.fstatSync(fd).size;
          const result = mod._malloc(2 * 8);
          mod.HEAPF64[(result >> 3) + 0] = +fileSize;
          mod.HEAPF64[(result >> 3) + 1] = 0;
          return result;
        }
        case 2 /* BROWSER_FILEREADER */:
        case 3 /* BROWSER_FSACCESS */:
        case 4 /* HTTP */:
        case 5 /* S3 */:
          failWith(mod, "Unsupported data protocol");
      }
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
    }
    return 0;
  },
  syncFile: (_mod, _fileId) => {
  },
  closeFile: (mod, fileId) => {
    try {
      const fileInfo = NODE_RUNTIME._fileInfoCache.get(fileId);
      NODE_RUNTIME._fileInfoCache.delete(fileId);
      switch (fileInfo == null ? void 0 : fileInfo.dataProtocol) {
        case 1 /* NODE_FS */: {
          const fileHandle = NODE_RUNTIME._filesById.get(fileId);
          NODE_RUNTIME._filesById.delete(fileId);
          if (fileHandle !== null && fileHandle !== void 0) {
            import_fs2.default.closeSync(fileHandle);
          }
          break;
        }
        case 2 /* BROWSER_FILEREADER */:
        case 3 /* BROWSER_FSACCESS */:
        case 4 /* HTTP */:
        case 5 /* S3 */:
          break;
      }
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
    }
    return 0;
  },
  dropFile: (mod, _fileNamePtr, _fileNameLen) => {
  },
  truncateFile: (mod, fileId, newSize) => {
    try {
      const file = NODE_RUNTIME.resolveFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 1 /* NODE_FS */: {
          import_fs2.default.truncateSync(file.dataUrl, newSize);
          break;
        }
        case 2 /* BROWSER_FILEREADER */:
        case 3 /* BROWSER_FSACCESS */:
        case 4 /* HTTP */:
        case 5 /* S3 */:
          failWith(mod, "Unsupported data protocol");
      }
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
    }
    return 0;
  },
  readFile: (mod, fileId, buf, bytes, location) => {
    try {
      const file = NODE_RUNTIME.resolveFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 1 /* NODE_FS */: {
          const fileHandle = NODE_RUNTIME._filesById.get(fileId);
          if (fileHandle === null || fileHandle === void 0) {
            failWith(mod, `File ${fileId} is missing a file descriptor`);
            return 0;
          }
          return import_fs2.default.readSync(fileHandle, mod.HEAPU8, buf, bytes, location);
        }
        case 2 /* BROWSER_FILEREADER */:
        case 3 /* BROWSER_FSACCESS */:
        case 4 /* HTTP */:
        case 5 /* S3 */:
          failWith(mod, "Unsupported data protocol");
      }
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
    }
    return 0;
  },
  writeFile: (mod, fileId, buf, bytes, location) => {
    try {
      const file = NODE_RUNTIME.resolveFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 1 /* NODE_FS */: {
          const fileHandle = NODE_RUNTIME._filesById.get(fileId);
          if (fileHandle === null || fileHandle === void 0) {
            failWith(mod, `File ${fileId} is missing a file descriptor`);
            return 0;
          }
          const src = mod.HEAPU8.subarray(buf, buf + bytes);
          return import_fs2.default.writeSync(fileHandle, src, 0, src.length, location);
        }
        case 2 /* BROWSER_FILEREADER */:
        case 3 /* BROWSER_FSACCESS */:
        case 4 /* HTTP */:
        case 5 /* S3 */:
          failWith(mod, "Unsupported data protocol");
      }
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
    }
    return 0;
  },
  progressUpdate: (_final, _percentage, _iteration) => {
    return;
  },
  getLastFileModificationTime: (mod, fileId) => {
    try {
      const file = NODE_RUNTIME.resolveFileInfo(mod, fileId);
      switch (file == null ? void 0 : file.dataProtocol) {
        case 1 /* NODE_FS */: {
          const fileHandle = NODE_RUNTIME._filesById.get(fileId);
          if (fileHandle === null || fileHandle === void 0) {
            failWith(mod, `File ${fileId} is missing a file descriptor`);
            return 0;
          }
          return import_fs2.default.fstatSync(fileHandle).mtime.getTime() / 1e3;
        }
        case 2 /* BROWSER_FILEREADER */:
        case 3 /* BROWSER_FSACCESS */:
        case 4 /* HTTP */:
        case 5 /* S3 */:
          failWith(mod, "Unsupported data protocol");
      }
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
    }
    return 0;
  },
  checkDirectory: (mod, pathPtr, pathLen) => {
    try {
      const path = decodeText(mod.HEAPU8.subarray(pathPtr, pathPtr + pathLen));
      return import_fs2.default.existsSync(path);
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
      return false;
    }
  },
  createDirectory: (mod, pathPtr, pathLen) => {
    try {
      const path = decodeText(mod.HEAPU8.subarray(pathPtr, pathPtr + pathLen));
      return import_fs2.default.mkdirSync(path);
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
      return 0;
    }
  },
  removeDirectory: (mod, pathPtr, pathLen) => {
    try {
      const path = decodeText(mod.HEAPU8.subarray(pathPtr, pathPtr + pathLen));
      return import_fs2.default.rmdirSync(path);
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
      return 0;
    }
  },
  listDirectoryEntries: (mod, _pathPtr, _pathLen) => {
    failWith(mod, "Not Implemented");
    return false;
  },
  glob: (mod, pathPtr, pathLen) => {
    try {
      const path = readString(mod, pathPtr, pathLen);
      const entries = fg.sync([path], { dot: true });
      for (const entry of entries) {
        mod.ccall("duckdb_web_fs_glob_add_path", null, ["string"], [entry]);
      }
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
      return 0;
    }
  },
  moveFile: (mod, fromPtr, fromLen, toPtr, toLen) => {
    var _a, _b;
    const from = readString(mod, fromPtr, fromLen);
    const to = readString(mod, toPtr, toLen);
    const handle = (_a = NODE_RUNTIME._files) == null ? void 0 : _a.get(from);
    if (handle !== void 0) {
      NODE_RUNTIME._files.delete(handle);
      NODE_RUNTIME._files.set(to, handle);
    }
    for (const [key, value] of ((_b = NODE_RUNTIME._fileInfoCache) == null ? void 0 : _b.entries()) || []) {
      if (value.dataUrl == from) {
        NODE_RUNTIME._fileInfoCache.delete(key);
        break;
      }
    }
    return true;
  },
  checkFile: (mod, pathPtr, pathLen) => {
    try {
      const path = decodeText(mod.HEAPU8.subarray(pathPtr, pathPtr + pathLen));
      return import_fs2.default.existsSync(path);
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
      return false;
    }
  },
  removeFile: (mod, pathPtr, pathLen) => {
    try {
      const path = decodeText(mod.HEAPU8.subarray(pathPtr, pathPtr + pathLen));
      return import_fs2.default.rmSync(path);
    } catch (e) {
      console.log(e);
      failWith(mod, e.toString());
      return 0;
    }
  },
  callScalarUDF: (mod, response, funcId, descPtr, descSize, ptrsPtr, ptrsSize) => {
    callScalarUDF(NODE_RUNTIME, mod, response, funcId, descPtr, descSize, ptrsPtr, ptrsSize);
  }
};

// src/targets/duckdb-node-mvp.worker.ts
var NodeWorker = class extends AsyncDuckDBDispatcher {
  /** Post a response back to the main thread */
  postMessage(response, transfer) {
    globalThis.postMessage(response, transfer);
  }
  /** Instantiate the wasm module */
  async instantiate(mainModulePath, pthreadWorkerPath, progress) {
    const bindings = new DuckDB(this, NODE_RUNTIME, mainModulePath, pthreadWorkerPath);
    return await bindings.instantiate(progress);
  }
};
function registerWorker() {
  const api = new NodeWorker();
  globalThis.onmessage = async (event) => {
    await api.onMessage(event.data);
  };
}
registerWorker();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerWorker
});
/*! Bundled license information:

is-extglob/index.js:
  (*!
   * is-extglob <https://github.com/jonschlinkert/is-extglob>
   *
   * Copyright (c) 2014-2016, Jon Schlinkert.
   * Licensed under the MIT License.
   *)

is-glob/index.js:
  (*!
   * is-glob <https://github.com/jonschlinkert/is-glob>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   *)

is-number/index.js:
  (*!
   * is-number <https://github.com/jonschlinkert/is-number>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

to-regex-range/index.js:
  (*!
   * to-regex-range <https://github.com/micromatch/to-regex-range>
   *
   * Copyright (c) 2015-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

fill-range/index.js:
  (*!
   * fill-range <https://github.com/jonschlinkert/fill-range>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Licensed under the MIT License.
   *)

queue-microtask/index.js:
  (*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)

run-parallel/index.js:
  (*! run-parallel. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
//# sourceMappingURL=duckdb-node-mvp.worker.cjs.map
