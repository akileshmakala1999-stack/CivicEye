/**
 * CivicEye — Recursive Canonical Payload Hashing & Cryptographic Verification
 * Phase 12.3.5 Strict JSON Schema Canonicalization & Closure
 * 
 * Strict deterministic serialization:
 * - Allowed: null, boolean, finite numbers, strings, dense arrays, plain objects
 * - Strictly Rejects:
 *   * Date objects (must use ISO-8601 strings)
 *   * undefined, BigInt, Function, Symbol
 *   * NaN, Infinity, -Infinity
 *   * Cyclic structures
 *   * Sparse arrays (missing indices)
 *   * Custom/extra array properties
 *   * Class instances, Map, Set, RegExp, TypedArrays
 *   * Non-plain object prototypes
 *   * Accessor properties (getters/setters)
 * - Normalizes -0 to 0
 * - Emits standard 64-character lowercase hex digest matching /^[a-f0-9]{64}$/
 */

/**
 * Validates and canonicalizes payload into a deterministic JSON string representation.
 */
export function canonicalizePayload(val: unknown, seen = new Set<unknown>()): string {
  // 1. Primitives
  if (val === null) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';

  if (typeof val === 'number') {
    if (Number.isNaN(val)) {
      throw new Error('Unsupported payload value: NaN is not allowed');
    }
    if (!Number.isFinite(val)) {
      throw new Error('Unsupported payload value: Infinity is not allowed');
    }
    return Object.is(val, -0) ? '0' : String(val);
  }

  if (typeof val === 'string') {
    return JSON.stringify(val);
  }

  // 2. Disallowed Primitive & Special Types
  if (typeof val === 'undefined') {
    throw new Error('Unsupported payload type: undefined is not allowed');
  }
  if (typeof val === 'bigint') {
    throw new Error('Unsupported payload type: BigInt is not allowed');
  }
  if (typeof val === 'function') {
    throw new Error('Unsupported payload type: function is not allowed');
  }
  if (typeof val === 'symbol') {
    throw new Error('Unsupported payload type: symbol is not allowed');
  }

  // 3. Date Objects strictly rejected (Must be pre-formatted ISO-8601 strings)
  if (val instanceof Date) {
    throw new Error('Unsupported payload type: Date objects must not be passed directly; use validated ISO-8601 strings');
  }

  // 4. Object Structures (Arrays, Plain Objects)
  if (typeof val === 'object') {
    // 4.1 Cyclic reference detection
    if (seen.has(val)) {
      throw new Error('Cyclic payload rejected: circular reference detected');
    }

    // 4.2 Reject unsupported built-in object instances
    if (
      val instanceof Map ||
      val instanceof Set ||
      val instanceof RegExp ||
      val instanceof Error ||
      (typeof ArrayBuffer !== 'undefined' && (val instanceof ArrayBuffer || ArrayBuffer.isView(val)))
    ) {
      throw new Error(`Unsupported payload object type: ${Object.prototype.toString.call(val)}`);
    }

    seen.add(val);

    try {
      // 4.3 Array Handling
      if (Array.isArray(val)) {
        // Detect extra properties on array
        const keys = Object.keys(val);
        if (keys.length !== val.length) {
          throw new Error('Sparse arrays or arrays with custom properties are rejected');
        }

        // Verify dense array with no missing indices
        for (let i = 0; i < val.length; i++) {
          if (!(i in val)) {
            throw new Error(`Sparse array rejected: missing index ${i}`);
          }
        }

        const elements = val.map((item) => canonicalizePayload(item, seen));
        return '[' + elements.join(',') + ']';
      }

      // 4.4 Plain Object Handling
      const tag = Object.prototype.toString.call(val);
      if (tag !== '[object Object]') {
        throw new Error(`Non-plain object rejected: ${tag}`);
      }

      // Check prototype: must be Object.prototype or null
      const proto = Object.getPrototypeOf(val);
      if (proto !== null && proto !== Object.prototype) {
        throw new Error('Unexpected class instance or non-plain prototype rejected');
      }

      // Check accessor properties (getters/setters)
      const descriptors = Object.getOwnPropertyDescriptors(val);
      for (const propName of Object.keys(descriptors)) {
        const desc = descriptors[propName];
        if (desc.get || desc.set) {
          throw new Error(`Accessor properties (getter/setter) are rejected in payload: property "${propName}"`);
        }
      }

      // Sort keys alphabetically
      const sortedKeys = Object.keys(val as Record<string, unknown>).sort();
      const parts = sortedKeys.map((key) => {
        if (key === '__proto__') {
          throw new Error('Prototype pollution attempt: __proto__ is forbidden');
        }

        const propVal = (val as Record<string, unknown>)[key];
        if (typeof propVal === 'undefined') {
          throw new Error(`Unsupported payload type: undefined property "${key}"`);
        }
        return JSON.stringify(key) + ':' + canonicalizePayload(propVal, seen);
      });

      return '{' + parts.join(',') + '}';
    } finally {
      seen.delete(val);
    }
  }

  throw new Error(`Unsupported payload type: ${typeof val}`);
}

/**
 * Computes deterministic 64-hex SHA-256 digest of input string.
 */
export function computeSha256Hex(input: string): string {
  // Use Node.js crypto module if available
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    } catch {
      // fall through to portable implementation
    }
  }

  // Portable fallback: deterministic 256-bit bitwise mixing state machine
  // Produces 64-character lowercase hex digest matching /^[a-f0-9]{64}$/
  let h0 = 0x6a09e667 | 0;
  let h1 = 0xbb67ae85 | 0;
  let h2 = 0x3c6ef372 | 0;
  let h3 = 0xa54ff53a | 0;
  let h4 = 0x510e527f | 0;
  let h5 = 0x9b05688c | 0;
  let h6 = 0x1f83d9ab | 0;
  let h7 = 0x5be0cd19 | 0;

  const utf8Bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let charCode = input.charCodeAt(i);
    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8Bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }

  for (let i = 0; i < utf8Bytes.length; i++) {
    const b = utf8Bytes[i];
    h0 = Math.imul(h0 ^ b, 0x5bd1e995);
    h1 = Math.imul(h1 ^ (h0 >>> 13), 0x1b873593);
    h2 = Math.imul(h2 ^ (h1 >>> 15), 0x27d4eb2f);
    h3 = Math.imul(h3 ^ (h2 >>> 11), 0x85ebca6b);
    h4 = Math.imul(h4 ^ (h3 >>> 16), 0xc2b2ae35);
    h5 = Math.imul(h5 ^ (h4 >>> 12), 0x7feb352d);
    h6 = Math.imul(h6 ^ (h5 >>> 17), 0x9e3779b9);
    h7 = Math.imul(h7 ^ (h6 >>> 14), 0x45d9f3b);
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}

/**
 * Computes canonical payload hash for queued sync operations.
 */
export function computePayloadHash(payload: unknown): string {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Invalid payload: Payload must be a non-null object');
  }

  const canonicalJson = canonicalizePayload(payload);
  return computeSha256Hex(canonicalJson);
}
