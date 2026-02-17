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
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
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
  "../../node_modules/js-sha256/src/sha256.js"(exports, module2) {
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
      var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && typeof module2 === "object" && module2.exports;
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
        module2.exports = exports2;
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

// src/bindings/duckdb-mvp.js
var require_duckdb_mvp = __commonJS({
  "src/bindings/duckdb-mvp.js"(exports, module2) {
    "use strict";
    var DuckDB3 = (() => {
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
            fs.readFile(filename, binary ? void 0 : "utf8", (err2, data) => {
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
            err("failed to asynchronously prepare wasm: ".concat(reason));
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
                err("wasm streaming compile failed: ".concat(reason));
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
              err("Module.instantiateWasm callback failed with error: ".concat(e));
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
          this.message = "Program terminated with exit(".concat(status, ")");
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
              strings.push("".concat(x, "=").concat(env[x]));
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
    if (typeof exports === "object" && typeof module2 === "object")
      module2.exports = DuckDB3;
    else if (typeof define === "function" && define["amd"])
      define([], () => DuckDB3);
  }
});

// src/bindings/duckdb-eh.js
var require_duckdb_eh = __commonJS({
  "src/bindings/duckdb-eh.js"(exports, module2) {
    "use strict";
    var DuckDB3 = (() => {
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
            fs.readFile(filename, binary ? void 0 : "utf8", (err2, data) => {
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
        wasmBinaryFile = "./duckdb-eh.wasm";
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
            err("failed to asynchronously prepare wasm: ".concat(reason));
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
                err("wasm streaming compile failed: ".concat(reason));
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
            wasmMemory = wasmExports["qa"];
            updateMemoryViews();
            wasmTable = wasmExports["ta"];
            addOnInit(wasmExports["ra"]);
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
              err("Module.instantiateWasm callback failed with error: ".concat(e));
              readyPromiseReject(e);
            }
          }
          instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
          return {};
        }
        var tempDouble;
        var tempI64;
        var ASM_CONSTS = {
          2503857: ($0, $1, $2, $3) => {
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
          2505264: ($0, $1, $2, $3, $4, $5) => {
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
          2506884: ($0, $1, $2, $3) => {
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
          2509168: ($0, $1, $2, $3) => {
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
          2510575: ($0, $1, $2, $3, $4, $5) => {
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
          this.message = "Program terminated with exit(".concat(status, ")");
          this.status = status;
        }
        var callRuntimeCallbacks = (callbacks) => {
          while (callbacks.length > 0) {
            callbacks.shift()(Module);
          }
        };
        var noExitRuntime = Module["noExitRuntime"] || true;
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
        var convertI32PairToI53Checked = (lo, hi) => hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
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
              strings.push("".concat(x, "=").concat(env[x]));
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
        var stackSave = () => _emscripten_stack_get_current();
        var stackRestore = (val) => __emscripten_stack_restore(val);
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
        var wasmTable;
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
          la: ___syscall_bind,
          ja: ___syscall_connect,
          aa: ___syscall_faccessat,
          d: ___syscall_fcntl64,
          $: ___syscall_fstat64,
          w: ___syscall_ftruncate64,
          ba: ___syscall_getcwd,
          W: ___syscall_getdents64,
          ea: ___syscall_getpeername,
          da: ___syscall_getsockname,
          ha: ___syscall_getsockopt,
          j: ___syscall_ioctl,
          Y: ___syscall_lstat64,
          X: ___syscall_mkdirat,
          Z: ___syscall_newfstatat,
          s: ___syscall_openat,
          ia: ___syscall_poll,
          fa: ___syscall_recvfrom,
          U: ___syscall_renameat,
          n: ___syscall_rmdir,
          ga: ___syscall_sendto,
          r: ___syscall_socket,
          _: ___syscall_stat64,
          ca: ___syscall_statfs64,
          o: ___syscall_unlinkat,
          ma: __emscripten_get_now_is_monotonic,
          C: __emval_call_method,
          D: __emval_decref,
          F: __emval_get_global,
          B: __emval_get_method_caller,
          A: __emval_run_destructors,
          v: __localtime_js,
          S: __tzset_js,
          a: _abort,
          L: _duckdb_web_fs_directory_create,
          M: _duckdb_web_fs_directory_exists,
          J: _duckdb_web_fs_directory_list_files,
          K: _duckdb_web_fs_directory_remove,
          m: _duckdb_web_fs_file_close,
          P: _duckdb_web_fs_file_drop_file,
          H: _duckdb_web_fs_file_exists,
          I: _duckdb_web_fs_file_move,
          O: _duckdb_web_fs_file_open,
          g: _duckdb_web_fs_file_read,
          N: _duckdb_web_fs_file_truncate,
          i: _duckdb_web_fs_file_write,
          Q: _duckdb_web_fs_get_default_data_protocol,
          G: _duckdb_web_fs_glob,
          k: _duckdb_web_test_platform_feature,
          R: _duckdb_web_udf_scalar_call,
          f: _emscripten_asm_const_ptr,
          na: _emscripten_date_now,
          oa: _emscripten_get_heap_max,
          c: _emscripten_get_now,
          pa: _emscripten_resize_heap,
          t: _environ_get,
          u: _environ_sizes_get,
          ka: _exit,
          e: _fd_close,
          E: _fd_fdstat_get,
          y: _fd_pread,
          x: _fd_pwrite,
          l: _fd_read,
          z: _fd_seek,
          V: _fd_sync,
          h: _fd_write,
          q: _getaddrinfo,
          T: _getentropy,
          p: _getnameinfo,
          b: _strftime_l
        };
        var wasmExports = createWasm();
        var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["sa"])(a0, a1);
        var _duckdb_web_fs_glob_add_path = Module["_duckdb_web_fs_glob_add_path"] = (a0) => (_duckdb_web_fs_glob_add_path = Module["_duckdb_web_fs_glob_add_path"] = wasmExports["ua"])(a0);
        var _duckdb_web_clear_response = Module["_duckdb_web_clear_response"] = () => (_duckdb_web_clear_response = Module["_duckdb_web_clear_response"] = wasmExports["va"])();
        var _duckdb_web_fail_with = Module["_duckdb_web_fail_with"] = (a0) => (_duckdb_web_fail_with = Module["_duckdb_web_fail_with"] = wasmExports["wa"])(a0);
        var _duckdb_web_reset = Module["_duckdb_web_reset"] = (a0) => (_duckdb_web_reset = Module["_duckdb_web_reset"] = wasmExports["xa"])(a0);
        var _duckdb_web_connect = Module["_duckdb_web_connect"] = () => (_duckdb_web_connect = Module["_duckdb_web_connect"] = wasmExports["ya"])();
        var _duckdb_web_disconnect = Module["_duckdb_web_disconnect"] = (a0) => (_duckdb_web_disconnect = Module["_duckdb_web_disconnect"] = wasmExports["za"])(a0);
        var _duckdb_web_flush_files = Module["_duckdb_web_flush_files"] = () => (_duckdb_web_flush_files = Module["_duckdb_web_flush_files"] = wasmExports["Aa"])();
        var _duckdb_web_flush_file = Module["_duckdb_web_flush_file"] = (a0) => (_duckdb_web_flush_file = Module["_duckdb_web_flush_file"] = wasmExports["Ba"])(a0);
        var _duckdb_web_open = Module["_duckdb_web_open"] = (a0, a1) => (_duckdb_web_open = Module["_duckdb_web_open"] = wasmExports["Ca"])(a0, a1);
        var _duckdb_web_get_global_file_info = Module["_duckdb_web_get_global_file_info"] = (a0, a1) => (_duckdb_web_get_global_file_info = Module["_duckdb_web_get_global_file_info"] = wasmExports["Da"])(a0, a1);
        var _duckdb_web_collect_file_stats = Module["_duckdb_web_collect_file_stats"] = (a0, a1, a2) => (_duckdb_web_collect_file_stats = Module["_duckdb_web_collect_file_stats"] = wasmExports["Ea"])(a0, a1, a2);
        var _duckdb_web_export_file_stats = Module["_duckdb_web_export_file_stats"] = (a0, a1) => (_duckdb_web_export_file_stats = Module["_duckdb_web_export_file_stats"] = wasmExports["Fa"])(a0, a1);
        var _duckdb_web_fs_drop_file = Module["_duckdb_web_fs_drop_file"] = (a0, a1) => (_duckdb_web_fs_drop_file = Module["_duckdb_web_fs_drop_file"] = wasmExports["Ga"])(a0, a1);
        var _duckdb_web_fs_drop_files = Module["_duckdb_web_fs_drop_files"] = (a0, a1, a2) => (_duckdb_web_fs_drop_files = Module["_duckdb_web_fs_drop_files"] = wasmExports["Ha"])(a0, a1, a2);
        var _duckdb_web_fs_glob_file_infos = Module["_duckdb_web_fs_glob_file_infos"] = (a0, a1) => (_duckdb_web_fs_glob_file_infos = Module["_duckdb_web_fs_glob_file_infos"] = wasmExports["Ia"])(a0, a1);
        var _duckdb_web_fs_get_file_info_by_id = Module["_duckdb_web_fs_get_file_info_by_id"] = (a0, a1, a2) => (_duckdb_web_fs_get_file_info_by_id = Module["_duckdb_web_fs_get_file_info_by_id"] = wasmExports["Ja"])(a0, a1, a2);
        var _duckdb_web_fs_get_file_info_by_name = Module["_duckdb_web_fs_get_file_info_by_name"] = (a0, a1, a2) => (_duckdb_web_fs_get_file_info_by_name = Module["_duckdb_web_fs_get_file_info_by_name"] = wasmExports["Ka"])(a0, a1, a2);
        var _duckdb_web_fs_register_file_url = Module["_duckdb_web_fs_register_file_url"] = (a0, a1, a2, a3, a4) => (_duckdb_web_fs_register_file_url = Module["_duckdb_web_fs_register_file_url"] = wasmExports["La"])(a0, a1, a2, a3, a4);
        var _duckdb_web_fs_register_file_buffer = Module["_duckdb_web_fs_register_file_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_fs_register_file_buffer = Module["_duckdb_web_fs_register_file_buffer"] = wasmExports["Ma"])(a0, a1, a2, a3);
        var _duckdb_web_copy_file_to_buffer = Module["_duckdb_web_copy_file_to_buffer"] = (a0, a1) => (_duckdb_web_copy_file_to_buffer = Module["_duckdb_web_copy_file_to_buffer"] = wasmExports["Na"])(a0, a1);
        var _duckdb_web_copy_file_to_path = Module["_duckdb_web_copy_file_to_path"] = (a0, a1, a2) => (_duckdb_web_copy_file_to_path = Module["_duckdb_web_copy_file_to_path"] = wasmExports["Oa"])(a0, a1, a2);
        var _duckdb_web_get_version = Module["_duckdb_web_get_version"] = (a0) => (_duckdb_web_get_version = Module["_duckdb_web_get_version"] = wasmExports["Pa"])(a0);
        var _duckdb_web_get_feature_flags = Module["_duckdb_web_get_feature_flags"] = () => (_duckdb_web_get_feature_flags = Module["_duckdb_web_get_feature_flags"] = wasmExports["Qa"])();
        var _duckdb_web_tokenize = Module["_duckdb_web_tokenize"] = (a0, a1) => (_duckdb_web_tokenize = Module["_duckdb_web_tokenize"] = wasmExports["Ra"])(a0, a1);
        var _duckdb_web_tokenize_buffer = Module["_duckdb_web_tokenize_buffer"] = (a0, a1, a2) => (_duckdb_web_tokenize_buffer = Module["_duckdb_web_tokenize_buffer"] = wasmExports["Sa"])(a0, a1, a2);
        var _duckdb_web_udf_scalar_create = Module["_duckdb_web_udf_scalar_create"] = (a0, a1, a2) => (_duckdb_web_udf_scalar_create = Module["_duckdb_web_udf_scalar_create"] = wasmExports["Ta"])(a0, a1, a2);
        var _duckdb_web_prepared_create = Module["_duckdb_web_prepared_create"] = (a0, a1, a2) => (_duckdb_web_prepared_create = Module["_duckdb_web_prepared_create"] = wasmExports["Ua"])(a0, a1, a2);
        var _duckdb_web_prepared_create_buffer = Module["_duckdb_web_prepared_create_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_create_buffer = Module["_duckdb_web_prepared_create_buffer"] = wasmExports["Va"])(a0, a1, a2, a3);
        var _duckdb_web_prepared_close = Module["_duckdb_web_prepared_close"] = (a0, a1, a2) => (_duckdb_web_prepared_close = Module["_duckdb_web_prepared_close"] = wasmExports["Wa"])(a0, a1, a2);
        var _duckdb_web_prepared_run = Module["_duckdb_web_prepared_run"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_run = Module["_duckdb_web_prepared_run"] = wasmExports["Xa"])(a0, a1, a2, a3);
        var _duckdb_web_prepared_send = Module["_duckdb_web_prepared_send"] = (a0, a1, a2, a3) => (_duckdb_web_prepared_send = Module["_duckdb_web_prepared_send"] = wasmExports["Ya"])(a0, a1, a2, a3);
        var _duckdb_web_query_run = Module["_duckdb_web_query_run"] = (a0, a1, a2) => (_duckdb_web_query_run = Module["_duckdb_web_query_run"] = wasmExports["Za"])(a0, a1, a2);
        var _duckdb_web_query_run_buffer = Module["_duckdb_web_query_run_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_query_run_buffer = Module["_duckdb_web_query_run_buffer"] = wasmExports["_a"])(a0, a1, a2, a3);
        var _duckdb_web_pending_query_start = Module["_duckdb_web_pending_query_start"] = (a0, a1, a2, a3) => (_duckdb_web_pending_query_start = Module["_duckdb_web_pending_query_start"] = wasmExports["$a"])(a0, a1, a2, a3);
        var _duckdb_web_pending_query_start_buffer = Module["_duckdb_web_pending_query_start_buffer"] = (a0, a1, a2, a3, a4) => (_duckdb_web_pending_query_start_buffer = Module["_duckdb_web_pending_query_start_buffer"] = wasmExports["ab"])(a0, a1, a2, a3, a4);
        var _duckdb_web_pending_query_poll = Module["_duckdb_web_pending_query_poll"] = (a0, a1, a2) => (_duckdb_web_pending_query_poll = Module["_duckdb_web_pending_query_poll"] = wasmExports["bb"])(a0, a1, a2);
        var _duckdb_web_pending_query_cancel = Module["_duckdb_web_pending_query_cancel"] = (a0, a1) => (_duckdb_web_pending_query_cancel = Module["_duckdb_web_pending_query_cancel"] = wasmExports["cb"])(a0, a1);
        var _duckdb_web_query_fetch_results = Module["_duckdb_web_query_fetch_results"] = (a0, a1) => (_duckdb_web_query_fetch_results = Module["_duckdb_web_query_fetch_results"] = wasmExports["db"])(a0, a1);
        var _duckdb_web_get_tablenames = Module["_duckdb_web_get_tablenames"] = (a0, a1, a2) => (_duckdb_web_get_tablenames = Module["_duckdb_web_get_tablenames"] = wasmExports["eb"])(a0, a1, a2);
        var _duckdb_web_get_tablenames_buffer = Module["_duckdb_web_get_tablenames_buffer"] = (a0, a1, a2, a3) => (_duckdb_web_get_tablenames_buffer = Module["_duckdb_web_get_tablenames_buffer"] = wasmExports["fb"])(a0, a1, a2, a3);
        var _duckdb_web_insert_arrow_from_ipc_stream = Module["_duckdb_web_insert_arrow_from_ipc_stream"] = (a0, a1, a2, a3, a4) => (_duckdb_web_insert_arrow_from_ipc_stream = Module["_duckdb_web_insert_arrow_from_ipc_stream"] = wasmExports["gb"])(a0, a1, a2, a3, a4);
        var _duckdb_web_insert_csv_from_path = Module["_duckdb_web_insert_csv_from_path"] = (a0, a1, a2, a3) => (_duckdb_web_insert_csv_from_path = Module["_duckdb_web_insert_csv_from_path"] = wasmExports["hb"])(a0, a1, a2, a3);
        var _duckdb_web_insert_json_from_path = Module["_duckdb_web_insert_json_from_path"] = (a0, a1, a2, a3) => (_duckdb_web_insert_json_from_path = Module["_duckdb_web_insert_json_from_path"] = wasmExports["ib"])(a0, a1, a2, a3);
        var _malloc = Module["_malloc"] = (a0) => (_malloc = Module["_malloc"] = wasmExports["mb"])(a0);
        var _free = Module["_free"] = (a0) => (_free = Module["_free"] = wasmExports["nb"])(a0);
        var _calloc = Module["_calloc"] = (a0, a1) => (_calloc = Module["_calloc"] = wasmExports["ob"])(a0, a1);
        var __emscripten_tempret_set = (a0) => (__emscripten_tempret_set = wasmExports["qb"])(a0);
        var __emscripten_tempret_get = () => (__emscripten_tempret_get = wasmExports["rb"])();
        var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["sb"])(a0);
        var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["tb"])(a0);
        var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["ub"])();
        function applySignatureConversions(wasmExports2) {
          wasmExports2 = Object.assign({}, wasmExports2);
          var makeWrapper_pp = (f) => (a0) => f(a0) >>> 0;
          var makeWrapper_p = (f) => () => f() >>> 0;
          wasmExports2["mb"] = makeWrapper_pp(wasmExports2["mb"]);
          wasmExports2["tb"] = makeWrapper_pp(wasmExports2["tb"]);
          wasmExports2["ub"] = makeWrapper_p(wasmExports2["ub"]);
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
    if (typeof exports === "object" && typeof module2 === "object")
      module2.exports = DuckDB3;
    else if (typeof define === "function" && define["amd"])
      define([], () => DuckDB3);
  }
});

// src/targets/duckdb-browser-blocking.ts
var duckdb_browser_blocking_exports = {};
__export(duckdb_browser_blocking_exports, {
  BROWSER_RUNTIME: () => BROWSER_RUNTIME,
  ConsoleLogger: () => ConsoleLogger,
  DEFAULT_RUNTIME: () => DEFAULT_RUNTIME,
  DuckDBAccessMode: () => DuckDBAccessMode,
  DuckDBBindingsBase: () => DuckDBBindingsBase,
  DuckDBConnection: () => DuckDBConnection,
  DuckDBDataProtocol: () => DuckDBDataProtocol,
  DuckDBFeature: () => DuckDBFeature,
  FileFlags: () => FileFlags,
  FileStatistics: () => FileStatistics,
  IsArrowBuffer: () => IsArrowBuffer,
  IsDuckDBWasmRetry: () => IsDuckDBWasmRetry,
  JSONTableShape: () => JSONTableShape,
  LogEvent: () => LogEvent,
  LogLevel: () => LogLevel,
  LogOrigin: () => LogOrigin,
  LogTopic: () => LogTopic,
  PACKAGE_NAME: () => PACKAGE_NAME,
  PACKAGE_VERSION: () => PACKAGE_VERSION,
  PACKAGE_VERSION_MAJOR: () => PACKAGE_VERSION_MAJOR,
  PACKAGE_VERSION_MINOR: () => PACKAGE_VERSION_MINOR,
  PACKAGE_VERSION_PATCH: () => PACKAGE_VERSION_PATCH,
  PreparedStatement: () => PreparedStatement,
  ResultStreamIterator: () => ResultStreamIterator,
  StatusCode: () => StatusCode,
  TokenType: () => TokenType,
  VoidLogger: () => VoidLogger,
  callSRet: () => callSRet,
  copyBuffer: () => copyBuffer,
  createDuckDB: () => createDuckDB,
  decodeText: () => decodeText,
  dropResponseBuffers: () => dropResponseBuffers,
  failWith: () => failWith,
  getJsDelivrBundles: () => getJsDelivrBundles,
  getLogEventLabel: () => getLogEventLabel,
  getLogLevelLabel: () => getLogLevelLabel,
  getLogOriginLabel: () => getLogOriginLabel,
  getLogTopicLabel: () => getLogTopicLabel,
  getPlatformFeatures: () => getPlatformFeatures,
  isFirefox: () => isFirefox,
  isNode: () => isNode,
  isSafari: () => isSafari,
  readString: () => readString,
  selectBundle: () => selectBundle
});
module.exports = __toCommonJS(duckdb_browser_blocking_exports);

// src/bindings/connection.ts
var arrow = __toESM(require("apache-arrow"));
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
    const reader = arrow.RecordBatchReader.from(buffer);
    console.assert(reader.isSync());
    console.assert(reader.isFile());
    return new arrow.Table(reader);
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
    const reader = arrow.RecordBatchReader.from(iter);
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
  createScalarFunction(name2, returns, func) {
    this._bindings.createScalarFunction(this._conn, name2, returns, func);
  }
  /** Insert an arrow table */
  insertArrowTable(table, options) {
    const buffer = arrow.tableToIPC(table, "stream");
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
    const reader = arrow.RecordBatchReader.from(buffer);
    console.assert(reader.isSync());
    console.assert(reader.isFile());
    return new arrow.Table(reader);
  }
  /** Send a prepared statement */
  send(...params) {
    const header = this.bindings.sendPrepared(this.connectionId, this.statementId, params);
    const iter = new ResultStreamIterator(this.bindings, this.connectionId, header);
    const reader = arrow.RecordBatchReader.from(iter);
    console.assert(reader.isSync());
    console.assert(reader.isStream());
    return reader;
  }
};

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
function copyBuffer(mod, begin, length) {
  const buffer = mod.HEAPU8.subarray(begin, begin + length);
  const copy = new Uint8Array(new ArrayBuffer(buffer.byteLength));
  copy.set(buffer);
  return copy;
}
function readString(mod, begin, length) {
  return decodeText(mod.HEAPU8.subarray(begin, begin + length));
}
var DuckDBDataProtocol = /* @__PURE__ */ ((DuckDBDataProtocol2) => {
  DuckDBDataProtocol2[DuckDBDataProtocol2["BUFFER"] = 0] = "BUFFER";
  DuckDBDataProtocol2[DuckDBDataProtocol2["NODE_FS"] = 1] = "NODE_FS";
  DuckDBDataProtocol2[DuckDBDataProtocol2["BROWSER_FILEREADER"] = 2] = "BROWSER_FILEREADER";
  DuckDBDataProtocol2[DuckDBDataProtocol2["BROWSER_FSACCESS"] = 3] = "BROWSER_FSACCESS";
  DuckDBDataProtocol2[DuckDBDataProtocol2["HTTP"] = 4] = "HTTP";
  DuckDBDataProtocol2[DuckDBDataProtocol2["S3"] = 5] = "S3";
  return DuckDBDataProtocol2;
})(DuckDBDataProtocol || {});
var FileFlags = /* @__PURE__ */ ((FileFlags2) => {
  FileFlags2[FileFlags2["FILE_FLAGS_READ"] = 1] = "FILE_FLAGS_READ";
  FileFlags2[FileFlags2["FILE_FLAGS_WRITE"] = 2] = "FILE_FLAGS_WRITE";
  FileFlags2[FileFlags2["FILE_FLAGS_DIRECT_IO"] = 4] = "FILE_FLAGS_DIRECT_IO";
  FileFlags2[FileFlags2["FILE_FLAGS_FILE_CREATE"] = 8] = "FILE_FLAGS_FILE_CREATE";
  FileFlags2[FileFlags2["FILE_FLAGS_FILE_CREATE_NEW"] = 16] = "FILE_FLAGS_FILE_CREATE_NEW";
  FileFlags2[FileFlags2["FILE_FLAGS_APPEND"] = 32] = "FILE_FLAGS_APPEND";
  FileFlags2[FileFlags2["FILE_FLAGS_PRIVATE"] = 64] = "FILE_FLAGS_PRIVATE";
  FileFlags2[FileFlags2["FILE_FLAGS_NULL_IF_NOT_EXISTS"] = 128] = "FILE_FLAGS_NULL_IF_NOT_EXISTS";
  FileFlags2[FileFlags2["FILE_FLAGS_PARALLEL_ACCESS"] = 256] = "FILE_FLAGS_PARALLEL_ACCESS";
  FileFlags2[FileFlags2["FILE_FLAGS_EXCLUSIVE_CREATE"] = 512] = "FILE_FLAGS_EXCLUSIVE_CREATE";
  FileFlags2[FileFlags2["FILE_FLAGS_NULL_IF_EXISTS"] = 1024] = "FILE_FLAGS_NULL_IF_EXISTS";
  return FileFlags2;
})(FileFlags || {});
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
var DEFAULT_RUNTIME = {
  _udfFunctions: /* @__PURE__ */ new Map(),
  testPlatformFeature: (_mod, _feature) => false,
  getDefaultDataProtocol: (_mod) => 0 /* BUFFER */,
  openFile: (_mod, _fileId, flags) => {
  },
  syncFile: (_mod, _fileId) => {
  },
  closeFile: (_mod, _fileId) => {
  },
  dropFile: (_mod, _fileNamePtr, _fileNameLen) => {
  },
  getLastFileModificationTime: (_mod, _fileId) => {
    return 0;
  },
  progressUpdate: (_final, _percentage, _iteration) => {
    return;
  },
  truncateFile: (_mod, _fileId, _newSize) => {
  },
  readFile: (_mod, _fileId, _buffer, _bytes, _location) => {
    return 0;
  },
  writeFile: (_mod, _fileId, _buffer, _bytes, _location) => {
    return 0;
  },
  removeDirectory: (_mod, _pathPtr, _pathLen) => {
  },
  checkDirectory: (_mod, _pathPtr, _pathLen) => {
    return false;
  },
  createDirectory: (_mod, _pathPtr, _pathLen) => {
  },
  listDirectoryEntries: (_mod, _pathPtr, _pathLen) => {
    return false;
  },
  glob: (_mod, _pathPtr, _pathLen) => {
  },
  moveFile: (_mod, _fromPtr, _fromLen, _toPtr, _toLen) => {
  },
  checkFile: (_mod, _pathPtr, _pathLen) => {
    return false;
  },
  removeFile: (_mod, _pathPtr, _pathLen) => {
  },
  callScalarUDF: (mod, response, funcId, descPtr, descSize, ptrsPtr, ptrsSize) => {
    callScalarUDF(DEFAULT_RUNTIME, mod, response, funcId, descPtr, descSize, ptrsPtr, ptrsSize);
  }
};

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
function arrowToSQLField(name2, type) {
  const t = arrowToSQLType(type);
  t.name = name2;
  return t;
}

// src/bindings/bindings_base.ts
var TEXT_ENCODER2 = new TextEncoder();
var DuckDBFeature = /* @__PURE__ */ ((DuckDBFeature2) => {
  DuckDBFeature2[DuckDBFeature2["WASM_EXCEPTIONS"] = 1] = "WASM_EXCEPTIONS";
  DuckDBFeature2[DuckDBFeature2["WASM_THREADS"] = 2] = "WASM_THREADS";
  DuckDBFeature2[DuckDBFeature2["WASM_SIMD"] = 4] = "WASM_SIMD";
  DuckDBFeature2[DuckDBFeature2["WASM_BULK_MEMORY"] = 8] = "WASM_BULK_MEMORY";
  DuckDBFeature2[DuckDBFeature2["EMIT_BIGINT"] = 16] = "EMIT_BIGINT";
  return DuckDBFeature2;
})(DuckDBFeature || {});
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
  createScalarFunction(conn, name2, returns, func) {
    const decl = {
      functionId: this._nextUDFId,
      name: name2,
      returnType: arrowToSQLType(returns)
    };
    const def = {
      functionId: decl.functionId,
      connectionId: conn,
      name: name2,
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
  registerFileURL(name2, url, proto, directIO = false) {
    if (url === void 0) {
      url = name2;
    }
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_fs_register_file_url",
      ["string", "string"],
      [name2, url, proto, directIO]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Register file text */
  registerFileText(name2, text) {
    const buffer = TEXT_ENCODER2.encode(text);
    this.registerFileBuffer(name2, buffer);
  }
  /** Register a file buffer */
  registerFileBuffer(name2, buffer) {
    const ptr = this.mod._malloc(buffer.length);
    const dst = this.mod.HEAPU8.subarray(ptr, ptr + buffer.length);
    dst.set(buffer);
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_fs_register_file_buffer",
      ["string", "number", "number"],
      [name2, ptr, buffer.length]
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
    throw new Error("prepareFileHandle: unsupported protocol ".concat(protocol));
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
    throw new Error("prepareDBFileHandle: unsupported protocol ".concat(protocol));
  }
  /** Prepare a file object URL */
  async prepareFileHandleAsync(name2, handle, protocol, directIO) {
    if (protocol === 3 /* BROWSER_FSACCESS */) {
      if (handle instanceof FileSystemSyncAccessHandle) {
      } else if (handle instanceof FileSystemFileHandle) {
        const fileHandle = handle;
        try {
          handle = await fileHandle.createSyncAccessHandle();
        } catch (e) {
          throw new Error(e.message + ":" + name2);
        }
      } else if (name2 != null) {
        try {
          const opfsRoot = await navigator.storage.getDirectory();
          const fileHandle = await opfsRoot.getFileHandle(name2);
          handle = await fileHandle.createSyncAccessHandle();
        } catch (e) {
          throw new Error(e.message + ":" + name2);
        }
      }
    }
    return handle;
  }
  /** Register a file object URL async */
  async registerFileHandleAsync(name2, handle, protocol, directIO) {
    const handle_inner = await this.prepareFileHandleAsync(name2, handle, protocol, directIO);
    this.registerFileHandle(name2, handle_inner, protocol, directIO);
  }
  /** Register a file object URL */
  registerFileHandle(name2, handle, protocol, directIO) {
    var _a;
    const [s, d, n] = callSRet(
      this.mod,
      "duckdb_web_fs_register_file_url",
      ["string", "string", "number", "boolean"],
      [name2, name2, protocol, directIO]
    );
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
    globalThis.DUCKDB_RUNTIME._files = (globalThis.DUCKDB_RUNTIME._files || /* @__PURE__ */ new Map()).set(name2, handle);
    if ((_a = globalThis.DUCKDB_RUNTIME._preparedHandles) == null ? void 0 : _a[name2]) {
      delete globalThis.DUCKDB_RUNTIME._preparedHandles[name2];
    }
    if (this.pthread) {
      for (const worker of this.pthread.runningWorkers) {
        worker.postMessage({
          cmd: "registerFileHandle",
          fileName: name2,
          fileHandle: handle
        });
      }
      for (const worker of this.pthread.unusedWorkers) {
        worker.postMessage({
          cmd: "dropFileHandle",
          fileName: name2
        });
      }
    }
  }
  /** Drop file */
  dropFile(name2) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_fs_drop_file", ["string"], [name2]);
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
      for (const str of names != null ? names : []) {
        if (str !== null && str !== void 0 && str.length > 0) {
          const size = this.mod.lengthBytesUTF8(str) + 1;
          const ret = this.mod._malloc(size);
          if (!ret) {
            throw new Error("Failed to allocate memory for string: ".concat(str));
          }
          this.mod.stringToUTF8(str, ret, size);
          pointers.push(ret);
        }
      }
      pointerOfArray = this.mod._malloc(pointers.length * 4);
      if (!pointerOfArray) {
        throw new Error("Failed to allocate memory for pointers array");
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
  copyFileToPath(name2, path) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_copy_file_to_path", ["string", "string"], [name2, path]);
    if (s !== 0 /* SUCCESS */) {
      throw new Error(readString(this.mod, d, n));
    }
    dropResponseBuffers(this.mod);
  }
  /** Write a file to a buffer */
  copyFileToBuffer(name2) {
    const [s, d, n] = callSRet(this.mod, "duckdb_web_copy_file_to_buffer", ["string"], [name2]);
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

// src/bindings/config.ts
var DuckDBAccessMode = /* @__PURE__ */ ((DuckDBAccessMode2) => {
  DuckDBAccessMode2[DuckDBAccessMode2["UNDEFINED"] = 0] = "UNDEFINED";
  DuckDBAccessMode2[DuckDBAccessMode2["AUTOMATIC"] = 1] = "AUTOMATIC";
  DuckDBAccessMode2[DuckDBAccessMode2["READ_ONLY"] = 2] = "READ_ONLY";
  DuckDBAccessMode2[DuckDBAccessMode2["READ_WRITE"] = 3] = "READ_WRITE";
  return DuckDBAccessMode2;
})(DuckDBAccessMode || {});

// src/bindings/insert_options.ts
var JSONTableShape = /* @__PURE__ */ ((JSONTableShape2) => {
  JSONTableShape2["ROW_ARRAY"] = "row-array";
  JSONTableShape2["COLUMN_OBJECT"] = "column-object";
  return JSONTableShape2;
})(JSONTableShape || {});

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

// src/bindings/bindings_browser_mvp.ts
var import_duckdb_mvp = __toESM(require_duckdb_mvp());

// src/bindings/bindings_browser_base.ts
var DuckDBBrowserBindings = class extends DuckDBBindingsBase {
  /** Constructor */
  constructor(logger, runtime, mainModuleURL, pthreadWorkerURL) {
    super(logger, runtime);
    this.mainModuleURL = mainModuleURL;
    this.pthreadWorkerURL = pthreadWorkerURL;
  }
  /** Locate a file */
  locateFile(path, prefix) {
    if (path.endsWith(".wasm")) {
      return this.mainModuleURL;
    }
    if (path.endsWith(".worker.js")) {
      if (!this.pthreadWorkerURL) {
        throw new Error("Missing DuckDB worker URL!");
      }
      return this.pthreadWorkerURL;
    }
    throw new Error("WASM instantiation requested unexpected file: prefix=".concat(prefix, " path=").concat(path));
  }
  /** Instantiate the wasm module */
  instantiateWasm(imports, success) {
    globalThis.DUCKDB_RUNTIME = this._runtime;
    const handlers = this.onInstantiationProgress;
    if (WebAssembly.instantiateStreaming) {
      if (typeof TransformStream === "function") {
        const fetchWithProgress = async () => {
          var _a;
          const request = new Request(this.mainModuleURL);
          const response2 = await fetch(request);
          const contentLengthHdr = response2.headers.get("content-length");
          const contentLength = contentLengthHdr ? parseInt(contentLengthHdr, 10) || 0 : 0;
          const start = /* @__PURE__ */ new Date();
          const progress = {
            startedAt: start,
            updatedAt: start,
            bytesTotal: contentLength || 0,
            bytesLoaded: 0
          };
          const tracker = {
            transform(chunk, ctrl) {
              progress.bytesLoaded += chunk.byteLength;
              const now = /* @__PURE__ */ new Date();
              if (now.getTime() - progress.updatedAt.getTime() < 20) {
                progress.updatedAt = now;
                ctrl.enqueue(chunk);
                return;
              }
              for (const p of handlers) {
                p(progress);
              }
              ctrl.enqueue(chunk);
            }
          };
          const ts = new TransformStream(tracker);
          return new Response((_a = response2.body) == null ? void 0 : _a.pipeThrough(ts), response2);
        };
        const response = fetchWithProgress();
        WebAssembly.instantiateStreaming(response, imports).then((output) => {
          success(output.instance, output.module);
        });
      } else {
        console.warn("instantiating without progress handler since transform streams are unavailable");
        const request = new Request(this.mainModuleURL);
        WebAssembly.instantiateStreaming(fetch(request), imports).then((output) => {
          success(output.instance, output.module);
        });
      }
    } else if (typeof XMLHttpRequest == "function") {
      const xhr = new XMLHttpRequest();
      const url = this.mainModuleURL;
      const start = /* @__PURE__ */ new Date();
      const progress = {
        startedAt: start,
        updatedAt: start,
        bytesTotal: 0,
        bytesLoaded: 0
      };
      xhr.open("GET", url);
      xhr.responseType = "arraybuffer";
      xhr.onerror = (error) => {
        this.logger.log({
          timestamp: /* @__PURE__ */ new Date(),
          level: 4 /* ERROR */,
          origin: 3 /* BINDINGS */,
          topic: 5 /* INSTANTIATE */,
          event: 2 /* ERROR */,
          value: "Failed to load WASM: " + error
        });
        throw new Error(error.toString());
      };
      xhr.onprogress = (e) => {
        progress.bytesTotal = e.total;
        progress.bytesLoaded = e.loaded;
        const now = /* @__PURE__ */ new Date();
        if (now.getTime() - progress.updatedAt.getTime() < 20) {
          progress.updatedAt = now;
          return;
        }
        for (const p of handlers) {
          p(progress);
        }
      };
      xhr.onload = () => {
        WebAssembly.instantiate(xhr.response, imports).then((output) => {
          success(output.instance, output.module);
        }).catch((error) => {
          this.logger.log({
            timestamp: /* @__PURE__ */ new Date(),
            level: 4 /* ERROR */,
            origin: 3 /* BINDINGS */,
            topic: 5 /* INSTANTIATE */,
            event: 2 /* ERROR */,
            value: "Failed to instantiate WASM: " + error
          });
          throw new Error(error);
        });
      };
      xhr.send();
    } else {
      console.warn("instantiating with manual fetch since streaming instantiation and xhrs are unavailable");
      const run = async () => {
        const request = new Request(this.mainModuleURL);
        const response = await fetch(request);
        const buffer = await response.arrayBuffer();
        WebAssembly.instantiate(buffer, imports).then((output) => {
          success(output.instance, output.module);
        });
      };
      run();
    }
    return [];
  }
};

// src/bindings/bindings_browser_mvp.ts
var DuckDB = class extends DuckDBBrowserBindings {
  /** Constructor */
  constructor(logger, runtime, mainModuleURL, pthreadWorkerURL = null) {
    super(logger, runtime, mainModuleURL, pthreadWorkerURL);
  }
  /** Instantiate the bindings */
  instantiateImpl(moduleOverrides) {
    return (0, import_duckdb_mvp.default)({
      ...moduleOverrides,
      instantiateWasm: this.instantiateWasm.bind(this),
      locateFile: this.locateFile.bind(this)
    });
  }
};

// src/bindings/bindings_browser_eh.ts
var import_duckdb_eh = __toESM(require_duckdb_eh());
var DuckDB2 = class extends DuckDBBrowserBindings {
  /** Constructor */
  constructor(logger, runtime, mainModuleURL, pthreadWorkerURL = null) {
    super(logger, runtime, mainModuleURL, pthreadWorkerURL);
  }
  /** Instantiate the bindings */
  instantiateImpl(moduleOverrides) {
    return (0, import_duckdb_eh.default)({
      ...moduleOverrides,
      instantiateWasm: this.instantiateWasm.bind(this),
      locateFile: this.locateFile.bind(this)
    });
  }
};

// src/targets/duckdb-browser-blocking.ts
async function createDuckDB(bundles, logger, runtime) {
  const platform = await getPlatformFeatures();
  if (platform.wasmExceptions) {
    if (bundles.eh) {
      return new DuckDB2(logger, runtime, bundles.eh.mainModule);
    }
  }
  return new DuckDB(logger, runtime, bundles.mvp.mainModule);
}
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
//# sourceMappingURL=duckdb-browser-blocking.cjs.map
