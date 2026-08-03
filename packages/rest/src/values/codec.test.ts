import { describe, expect, it } from "vitest";
import type { DbContext } from "~/internal/db-context";
import { DocumentRef } from "~/refs/document-ref";
import { decodeFields, decodeValue, PrecisionError } from "./decode";
import { encodeFields, encodeValue } from "./encode";
import { GeoPoint } from "./geo-point";
import { Timestamp } from "./timestamp";

const db: DbContext = {
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

  it("encodes non-finite doubles as the proto JSON string forms", () => {
    /**
     * Asserting the in-memory object is not enough here: a raw NaN survives the
     * equality check and then serializes to null, so the assertion goes through
     * JSON.stringify to test what actually reaches the wire.
     */
    expect(JSON.stringify(encodeValue(Number.NaN))).toBe(
      '{"doubleValue":"NaN"}',
    );
    expect(JSON.stringify(encodeValue(Number.POSITIVE_INFINITY))).toBe(
      '{"doubleValue":"Infinity"}',
    );
    expect(JSON.stringify(encodeValue(Number.NEGATIVE_INFINITY))).toBe(
      '{"doubleValue":"-Infinity"}',
    );
  });

  it("keeps a finite double as a JSON number", () => {
    expect(JSON.stringify(encodeValue(1.5))).toBe('{"doubleValue":1.5}');
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

  it("allows an array inside a map inside an array", () => {
    /**
     * Only a *direct* array-in-array is illegal, so wrapping in an object is
     * the documented escape. An earlier version failed to clear the nesting
     * flag when descending into a map and rejected this legal shape.
     */
    expect(() => encodeFields({ items: [{ tags: ["a", "b"] }] })).not.toThrow();
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

describe("wire-format fixtures", () => {
  /**
   * The round-trip tests above would still pass if encode and decode were wrong
   * in compensating ways. These pin each direction against a hand-written
   * Firestore document so a shared mistake cannot hide.
   */
  const wire = {
    name: { stringValue: "Alice" },
    age: { integerValue: "30" },
    score: { doubleValue: 1.5 },
    active: { booleanValue: true },
    missing: { nullValue: null },
    joined: { timestampValue: "2026-08-03T12:34:56.000000123Z" },
    tags: {
      arrayValue: { values: [{ stringValue: "a" }, { stringValue: "b" }] },
    },
    address: {
      mapValue: { fields: { city: { stringValue: "Amsterdam" } } },
    },
  };

  const domain = {
    name: "Alice",
    age: 30,
    score: 1.5,
    active: true,
    missing: null,
    joined: new Timestamp(1_785_760_496, 123),
    tags: ["a", "b"],
    address: { city: "Amsterdam" },
  };

  it("encodes to the expected wire document", () => {
    expect(encodeFields(domain)).toEqual(wire);
  });

  it("decodes the expected wire document", () => {
    expect(decodeFields(wire, db)).toEqual(domain);
  });
});

describe("integer boundaries", () => {
  it("encodes both int64 boundaries from a BigInt", () => {
    expect(encodeValue(9_223_372_036_854_775_807n)).toEqual({
      integerValue: "9223372036854775807",
    });
    expect(encodeValue(-9_223_372_036_854_775_808n)).toEqual({
      integerValue: "-9223372036854775808",
    });
  });

  it("accepts the safe integer boundaries as numbers", () => {
    expect(encodeValue(Number.MAX_SAFE_INTEGER)).toEqual({
      integerValue: "9007199254740991",
    });
    expect(encodeValue(Number.MIN_SAFE_INTEGER)).toEqual({
      integerValue: "-9007199254740991",
    });
  });

  it("decodes a value just past the safe range as a precision error", () => {
    expect(() =>
      decodeValue({ integerValue: "9007199254740993" }, db, "counter"),
    ).toThrow(PrecisionError);
  });
});
