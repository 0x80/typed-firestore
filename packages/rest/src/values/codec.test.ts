import { describe, expect, it } from "vitest";
import type { DbContext } from "~/internal/db-context";
import { DocumentRef } from "~/refs/document-ref";
import { decodeFields, decodeValue, PrecisionError } from "./decode";
import { encodeFields, encodeValue } from "./encode";
import { GeoPoint } from "./geo-point";
import { Timestamp } from "./timestamp";

const db: DbContext = {
  projectId: "test-project",
  databaseId: "(default)",
  documentsPath: "projects/test-project/databases/(default)/documents",
  ignoreUndefinedProperties: false,
  request: () => Promise.reject(new Error("not used")),
};

/** Encode then decode, which is the property that actually matters in use. */
function roundTrip(value: unknown): unknown {
  return decodeValue(encodeValue(value), db);
}

describe("encode", () => {
  it("picks integerValue or doubleValue the same way firebase-admin does", () => {
    expect(encodeValue(42)).toEqual({ integerValue: "42" });
    expect(encodeValue(-7)).toEqual({ integerValue: "-7" });
    expect(encodeValue(1.5)).toEqual({ doubleValue: 1.5 });
    /** A whole float is indistinguishable from an int, the same quirk the SDK has. */
    expect(encodeValue(1)).toEqual({ integerValue: "1" });
  });

  it("encodes non-finite doubles rather than rejecting them", () => {
    expect(encodeValue(Number.NaN)).toEqual({ doubleValue: Number.NaN });
    expect(encodeValue(Number.POSITIVE_INFINITY)).toEqual({
      doubleValue: Number.POSITIVE_INFINITY,
    });
  });

  it("refuses an integer beyond the safe range instead of emitting exponent notation", () => {
    /** String(1e21) is "1e+21", which is not a valid int64 on the wire. */
    expect(() => encodeValue(1e21)).toThrow(/safe integer range/);
  });

  it("passes a BigInt through as a full int64", () => {
    expect(encodeValue(9_223_372_036_854_775_807n)).toEqual({
      integerValue: "9223372036854775807",
    });
  });

  it("rejects a nested array, naming the path", () => {
    expect(() => encodeFields({ tags: [["a"]] })).toThrow(/nested array/);
    expect(() => encodeFields({ tags: [["a"]] })).toThrow(/tags\[0\]/);
  });

  it("allows an array of objects, which is the supported way to nest", () => {
    expect(encodeValue([{ a: 1 }])).toEqual({
      arrayValue: {
        values: [{ mapValue: { fields: { a: { integerValue: "1" } } } }],
      },
    });
  });

  it("rejects undefined by default and names the field path", () => {
    expect(() => encodeFields({ user: { name: undefined } })).toThrow(
      /"user\.name"/,
    );
  });

  it("drops undefined when ignoreUndefinedProperties is set", () => {
    expect(
      encodeFields(
        { kept: "yes", dropped: undefined },
        { ignoreUndefinedProperties: true },
      ),
    ).toEqual({ kept: { stringValue: "yes" } });
  });

  it("rejects undefined inside an array even when dropping is enabled", () => {
    expect(() =>
      encodeFields(
        { tags: ["a", undefined] },
        { ignoreUndefinedProperties: true },
      ),
    ).toThrow(/cannot contain undefined/);
  });

  it("rejects a value it has no representation for", () => {
    expect(() => encodeValue(Symbol("nope"))).toThrow(/Cannot encode/);
    expect(() => encodeValue(() => undefined)).toThrow(/Cannot encode/);
  });

  it("distinguishes null from undefined", () => {
    expect(encodeValue(null)).toEqual({ nullValue: null });
  });
});

describe("decode", () => {
  it("throws rather than silently losing precision on a large integer", () => {
    expect(() =>
      decodeValue({ integerValue: "9223372036854775807" }, db, "counter"),
    ).toThrow(PrecisionError);
  });

  it("names the field in the precision error", () => {
    try {
      decodeFields({ counter: { integerValue: "9007199254740993" } }, db);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PrecisionError);
      expect((error as PrecisionError).fieldPath).toBe("counter");
    }
  });

  it("reads a value type it does not model as an error, not as undefined", () => {
    expect(() =>
      decodeValue({ vectorValue: [1, 2] } as never, db, "embedding"),
    ).toThrow(/Unsupported Firestore value type/);
  });

  it("refuses a reference pointing at another database", () => {
    expect(() =>
      decodeValue(
        {
          referenceValue:
            "projects/other/databases/(default)/documents/users/alice",
        },
        db,
      ),
    ).toThrow(/different database/);
  });

  it("treats a missing mapValue.fields as an empty object", () => {
    expect(decodeValue({ mapValue: {} }, db)).toEqual({});
    expect(decodeValue({ arrayValue: {} }, db)).toEqual([]);
  });
});

describe("round trip", () => {
  it("preserves the scalar types", () => {
    expect(roundTrip("hello")).toBe("hello");
    expect(roundTrip(true)).toBe(true);
    expect(roundTrip(null)).toBe(null);
    expect(roundTrip(42)).toBe(42);
    expect(roundTrip(1.25)).toBe(1.25);
  });

  it("preserves a timestamp at nanosecond precision", () => {
    const timestamp = new Timestamp(1_754_223_296, 123_456_789);

    expect(roundTrip(timestamp)).toEqual(timestamp);
  });

  it("converts a Date on write and returns a Timestamp on read", () => {
    const date = new Date("2026-08-03T12:34:56.123Z");
    const result = roundTrip(date);

    expect(result).toBeInstanceOf(Timestamp);
    expect((result as Timestamp).toDate()).toEqual(date);
  });

  it("preserves a geo point", () => {
    const point = new GeoPoint(52.37, 4.9);

    expect(roundTrip(point)).toEqual(point);
  });

  it("preserves bytes", () => {
    const bytes = new Uint8Array([0, 1, 250, 255]);

    expect(roundTrip(bytes)).toEqual(bytes);
  });

  it("preserves a document reference by path", () => {
    const ref = new DocumentRef(db, "users/alice");
    const result = roundTrip(ref);

    expect(result).toBeInstanceOf(DocumentRef);
    expect((result as DocumentRef<unknown>).path).toBe("users/alice");
  });

  it("preserves a nested structure", () => {
    const value = {
      name: "Alice",
      scores: [1, 2, 3],
      address: { city: "Amsterdam", postcode: null },
      visits: [{ at: new Timestamp(100, 5), place: "home" }],
    };

    expect(decodeFields(encodeFields(value), db)).toEqual(value);
  });
});
