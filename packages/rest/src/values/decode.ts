import type { DbContext } from "~/internal/db-context";
import { DocumentRef } from "~/refs/document-ref";
import { GeoPoint } from "./geo-point";
import { Timestamp } from "./timestamp";
import type { FirestoreFields, FirestoreValue } from "./wire";

/**
 * Raised when an integer stored in Firestore cannot be represented exactly as a
 * JavaScript number. Losing precision silently would be the worse outcome, so
 * the read fails and points at the field.
 */
export class PrecisionError extends Error {
  readonly fieldPath: string;
  readonly rawValue: string;

  constructor(fieldPath: string, rawValue: string) {
    super(
      `The integer at "${fieldPath}" is ${rawValue}, which exceeds the safe integer range and cannot be read as a number without losing precision.`,
    );

    this.name = "PrecisionError";
    this.fieldPath = fieldPath;
    this.rawValue = rawValue;
  }
}

export function decodeFields(
  fields: FirestoreFields,
  db: DbContext,
  path = "",
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    data[key] = decodeValue(value, db, path === "" ? key : `${path}.${key}`);
  }

  return data;
}

export function decodeValue(
  value: FirestoreValue,
  db: DbContext,
  path = "",
): unknown {
  if ("stringValue" in value) {
    return value.stringValue;
  }

  if ("booleanValue" in value) {
    return value.booleanValue;
  }

  if ("nullValue" in value) {
    return null;
  }

  if ("integerValue" in value) {
    const parsed = Number(value.integerValue);

    if (!Number.isSafeInteger(parsed)) {
      throw new PrecisionError(
        path === "" ? "the value" : path,
        value.integerValue,
      );
    }

    return parsed;
  }

  if ("doubleValue" in value) {
    return decodeDouble(value.doubleValue, path);
  }

  if ("timestampValue" in value) {
    return Timestamp.fromRfc3339(value.timestampValue);
  }

  if ("bytesValue" in value) {
    return decodeBase64(value.bytesValue);
  }

  if ("geoPointValue" in value) {
    return new GeoPoint(
      value.geoPointValue.latitude,
      value.geoPointValue.longitude,
    );
  }

  if ("referenceValue" in value) {
    return new DocumentRef(db, toRelativePath(value.referenceValue, db));
  }

  if ("arrayValue" in value) {
    const values = value.arrayValue.values ?? [];

    return values.map((entry, index) =>
      decodeValue(entry, db, `${path}[${String(index)}]`),
    );
  }

  if ("mapValue" in value) {
    return decodeFields(value.mapValue.fields ?? {}, db, path);
  }

  /**
   * The REST API can introduce value types this version does not model yet, so
   * name the field rather than returning something the caller's type says is
   * impossible.
   */
  throw new TypeError(
    `Unsupported Firestore value type at "${path === "" ? "the value" : path}": ${Object.keys(value).join(", ")}`,
  );
}

/**
 * The non-finite doubles arrive as proto3 JSON strings. Anything else in string
 * form is a shape this package does not model, and is rejected rather than
 * coerced, since `Number("abc")` would quietly produce NaN.
 */
function decodeDouble(value: number | string, path: string): number {
  if (typeof value === "number") {
    return value;
  }

  switch (value) {
    case "NaN": {
      return Number.NaN;
    }
    case "Infinity": {
      return Number.POSITIVE_INFINITY;
    }
    case "-Infinity": {
      return Number.NEGATIVE_INFINITY;
    }
    default: {
      throw new TypeError(
        `Unrecognized doubleValue "${value}" at "${path === "" ? "the value" : path}"`,
      );
    }
  }
}

/**
 * Turn a fully qualified resource name back into a path relative to the
 * database root. A reference to a different database throws: silently keeping
 * it would hand back a `DocumentRef` bound to this database whose path resolves
 * to a different document than the one stored.
 */
function toRelativePath(name: string, db: DbContext): string {
  const prefix = `${db.documentsPath}/`;

  if (!name.startsWith(prefix)) {
    throw new Error(
      `Cannot read a reference to a different database. Expected a document under "${db.documentsPath}", received "${name}".`,
    );
  }

  return name.slice(prefix.length);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
