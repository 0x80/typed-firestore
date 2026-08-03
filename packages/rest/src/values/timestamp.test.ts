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
