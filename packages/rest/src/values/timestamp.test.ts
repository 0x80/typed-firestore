import { describe, expect, it } from "vitest";
import { Timestamp } from "./timestamp";

describe("Timestamp", () => {
  it("rejects out-of-range nanoseconds", () => {
    expect(() => new Timestamp(0, -1)).toThrow(RangeError);
    expect(() => new Timestamp(0, 1_000_000_000)).toThrow(RangeError);
    expect(() => new Timestamp(0, 1.5)).toThrow(RangeError);
  });

  it("round-trips a wire value at full nanosecond precision", () => {
    const wire = "2026-08-03T12:34:56.123456789Z";
    const timestamp = Timestamp.fromRfc3339(wire);

    expect(timestamp.nanoseconds).toBe(123_456_789);
    expect(timestamp.toRfc3339()).toBe(wire);
  });

  it("preserves sub-millisecond digits a Date would discard", () => {
    const timestamp = Timestamp.fromRfc3339("2026-08-03T12:34:56.000000500Z");

    expect(timestamp.nanoseconds).toBe(500);
    /** The Date form truncates, which is exactly why reads return a Timestamp. */
    expect(timestamp.toDate().getTime()).toBe(timestamp.seconds * 1000);
  });

  it("omits the fractional part when there are no sub-second digits", () => {
    expect(new Timestamp(1_754_223_296, 0).toRfc3339()).toBe(
      "2025-08-03T12:14:56Z",
    );
  });

  it("pads a short fractional part out to nanoseconds", () => {
    expect(Timestamp.fromRfc3339("2026-08-03T12:34:56.5Z").nanoseconds).toBe(
      500_000_000,
    );
    expect(Timestamp.fromRfc3339("2026-08-03T12:34:56.123Z").nanoseconds).toBe(
      123_000_000,
    );
  });

  it("does not remap years below 100, which Date.UTC would shift to the 1900s", () => {
    const timestamp = Timestamp.fromRfc3339("0001-01-01T00:00:00Z");

    expect(timestamp.toDate().getUTCFullYear()).toBe(1);
  });

  it("keeps nanoseconds positive for dates before 1970", () => {
    const timestamp = Timestamp.fromMillis(-1500);

    expect(timestamp.seconds).toBe(-2);
    expect(timestamp.nanoseconds).toBe(500_000_000);
    expect(timestamp.toMillis()).toBe(-1500);
  });

  it("sorts lexicographically by valueOf, including across the epoch", () => {
    const ordered = [
      Timestamp.fromRfc3339("1969-01-01T00:00:00Z"),
      Timestamp.fromRfc3339("2026-08-03T12:34:56.000000001Z"),
      Timestamp.fromRfc3339("2026-08-03T12:34:56.000000002Z"),
      Timestamp.fromRfc3339("2030-01-01T00:00:00Z"),
    ];

    const shuffled = [ordered[3], ordered[1], ordered[0], ordered[2]];
    const sorted = [...shuffled].sort((a, b) =>
      a!.valueOf() < b!.valueOf() ? -1 : 1,
    );

    expect(sorted).toEqual(ordered);
  });

  it("rejects a malformed wire value", () => {
    expect(() => Timestamp.fromRfc3339("2026-08-03 12:34:56")).toThrow(
      RangeError,
    );
    expect(() => Timestamp.fromRfc3339("not a timestamp")).toThrow(RangeError);
  });

  it("rejects an invalid Date", () => {
    expect(() => Timestamp.fromDate(new Date("nonsense"))).toThrow(RangeError);
  });

  it("compares by value", () => {
    expect(new Timestamp(5, 6).isEqual(new Timestamp(5, 6))).toBe(true);
    expect(new Timestamp(5, 6).isEqual(new Timestamp(5, 7))).toBe(false);
  });
});

describe("Timestamp bounds and rollover", () => {
  it("carries a rounded nanosecond value into the next second", () => {
    /** Rounding lands on 1e9, which is not representable; it must carry. */
    const timestamp = Timestamp.fromMillis(-0.0000001);

    expect(timestamp.nanoseconds).toBe(0);
    expect(timestamp.seconds).toBe(0);
  });

  it("accepts the Firestore range bounds", () => {
    expect(() => new Timestamp(-62_135_596_800, 0)).not.toThrow();
    expect(() => new Timestamp(253_402_300_799, 0)).not.toThrow();
  });

  it("rejects seconds outside the Firestore range", () => {
    /** toRfc3339 would emit an expanded-year form the API cannot parse back. */
    expect(() => new Timestamp(-62_135_596_801, 0)).toThrow(RangeError);
    expect(() => new Timestamp(253_402_300_800, 0)).toThrow(RangeError);
  });

  it("rejects a non-integer or unsafe seconds value", () => {
    expect(() => new Timestamp(1.5, 0)).toThrow(RangeError);
    expect(() => new Timestamp(Number.MAX_SAFE_INTEGER + 2, 0)).toThrow(
      RangeError,
    );
  });

  it("rejects rolled-over date components instead of normalizing them", () => {
    /** Date would silently turn month 13 into January of the next year. */
    expect(() => Timestamp.fromRfc3339("2026-13-01T00:00:00Z")).toThrow(
      /out-of-range/,
    );
    expect(() => Timestamp.fromRfc3339("2026-02-30T00:00:00Z")).toThrow(
      /out-of-range/,
    );
    expect(() => Timestamp.fromRfc3339("2026-08-03T25:00:00Z")).toThrow(
      /out-of-range/,
    );
  });

  it("still accepts a real leap day", () => {
    expect(() => Timestamp.fromRfc3339("2028-02-29T00:00:00Z")).not.toThrow();
  });
});
