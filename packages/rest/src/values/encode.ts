import { DocumentRef } from "~/refs/document-ref";
import { GeoPoint } from "./geo-point";
import { Timestamp } from "./timestamp";
import type { FirestoreFields, FirestoreValue } from "./wire";

export type EncodeOptions = {
  /**
   * When true, properties whose value is `undefined` are dropped instead of
   * raising an error. Mirrors the firebase-admin setting of the same name.
   */
  ignoreUndefinedProperties?: boolean;
};

type EncodeContext = EncodeOptions & {
  /**
   * Firestore does not allow an array to contain another array. Tracking the
   * nesting lets us reject that with the offending path rather than sending
   * data the API would refuse, or worse, silently accept in a shape nobody
   * intended.
   */
  inArray: boolean;
};

export function encodeFields(
  data: Record<string, unknown>,
  options: EncodeOptions = {},
): FirestoreFields {
  const context: EncodeContext = { ...options, inArray: false };

  return encodeFieldsWithContext(data, context, "");
}

function encodeFieldsWithContext(
  data: Record<string, unknown>,
  context: EncodeContext,
  path: string,
): FirestoreFields {
  const fields: FirestoreFields = {};

  for (const [key, value] of Object.entries(data)) {
    const fieldPath = path === "" ? key : `${path}.${key}`;

    if (value === undefined) {
      if (context.ignoreUndefinedProperties) {
        continue;
      }

      throw new TypeError(
        `Cannot encode undefined at "${fieldPath}". Set ignoreUndefinedProperties to drop it, or use null to store an empty value.`,
      );
    }

    fields[key] = encodeWithContext(value, context, fieldPath);
  }

  return fields;
}

export function encodeValue(value: unknown): FirestoreValue {
  return encodeWithContext(value, { inArray: false }, "");
}

function encodeWithContext(
  value: unknown,
  context: EncodeContext,
  path: string,
): FirestoreValue {
  const location = path === "" ? "the value" : `"${path}"`;

  if (value === null) {
    return { nullValue: null };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    /**
     * Firestore compares integers and doubles as one numeric type, so this rule
     * does not change ordering. It matches firebase-admin so that a document
     * written through this package and one written through the server package
     * carry identical value types for identical input, which keeps the stored
     * representation stable when a project uses both.
     */
    if (!Number.isInteger(value)) {
      return encodeDouble(value);
    }

    /**
     * Beyond the safe range a JavaScript number no longer identifies a single
     * integer, and `String()` switches to exponent notation, which is not a
     * valid int64 on the wire. Refusing here is better than sending "1e+21" and
     * having the API reject it, or silently storing an adjacent value.
     */
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(
        `Cannot encode ${String(value)} at ${location} as an integer because it exceeds the safe integer range. Pass a BigInt to store a full 64-bit integer.`,
      );
    }

    return { integerValue: String(value) };
  }

  if (typeof value === "bigint") {
    /** Firestore stores a full int64, so a BigInt passes through unchanged. */
    return { integerValue: value.toString() };
  }

  if (value instanceof Timestamp) {
    return { timestampValue: value.toRfc3339() };
  }

  if (value instanceof Date) {
    return { timestampValue: Timestamp.fromDate(value).toRfc3339() };
  }

  if (value instanceof GeoPoint) {
    return {
      geoPointValue: { latitude: value.latitude, longitude: value.longitude },
    };
  }

  if (value instanceof DocumentRef) {
    return { referenceValue: value.name };
  }

  if (value instanceof Uint8Array) {
    return { bytesValue: encodeBase64(value) };
  }

  if (Array.isArray(value)) {
    if (context.inArray) {
      throw new TypeError(
        `Cannot encode a nested array at ${location}. Firestore does not support arrays directly inside arrays; wrap the inner array in an object.`,
      );
    }

    const nested: EncodeContext = { ...context, inArray: true };

    return {
      arrayValue: {
        values: value.map((entry, index) => {
          if (entry === undefined) {
            throw new TypeError(
              `Cannot encode undefined at "${path}[${String(index)}]". Firestore arrays cannot contain undefined; use null instead.`,
            );
          }

          return encodeWithContext(entry, nested, `${path}[${String(index)}]`);
        }),
      },
    };
  }

  if (isPlainObject(value)) {
    /**
     * Descending into a map clears the array flag. Firestore only forbids an
     * array *directly* inside an array; wrapping one in an object is the
     * documented way to nest, so `[{ tags: ["a"] }]` is legal and must not be
     * rejected by the guard above.
     */
    return {
      mapValue: {
        fields: encodeFieldsWithContext(
          value,
          { ...context, inArray: false },
          path,
        ),
      },
    };
  }

  throw new TypeError(
    `Cannot encode a value of type ${describeType(value)} at ${location}`,
  );
}

/**
 * Proto3 JSON carries the non-finite doubles as strings, because JSON has no
 * literal for them. Emitting the raw number instead would serialize to `null`
 * through `JSON.stringify`, silently turning NaN into a null field on the way
 * out.
 */
function encodeDouble(value: number): FirestoreValue {
  if (Number.isNaN(value)) {
    return { doubleValue: "NaN" };
  }

  if (value === Number.POSITIVE_INFINITY) {
    return { doubleValue: "Infinity" };
  }

  if (value === Number.NEGATIVE_INFINITY) {
    return { doubleValue: "-Infinity" };
  }

  return { doubleValue: value };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function describeType(value: unknown): string {
  if (typeof value === "object") {
    const name: unknown = value?.constructor?.name;

    return typeof name === "string" ? name : "object";
  }

  return typeof value;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
