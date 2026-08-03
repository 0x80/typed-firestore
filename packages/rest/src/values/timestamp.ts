/**
 * A Firestore timestamp with nanosecond precision.
 *
 * The shape mirrors the `Timestamp` class of firebase-admin and the web SDK so
 * that document types can be shared across packages using the `FsTimestamp`
 * alias pattern. See the "Sharing Types" guide.
 *
 * A `Date` only carries millisecond precision, which is why reads always
 * produce a `Timestamp` rather than a `Date`. Writes accept either.
 */

const NANOSECONDS_PER_SECOND = 1_000_000_000;
const NANOSECONDS_PER_MILLISECOND = 1_000_000;
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Matches an RFC 3339 timestamp with an optional fractional part of any length
 * and a mandatory `Z` suffix. Firestore always returns UTC.
 */
const RFC3339_PATTERN =
  /^(-?\d{4,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/;

/** Seconds since the epoch of 0001-01-01T00:00:00Z, Firestore's lower bound. */
const MIN_FIRESTORE_SECONDS = -62_135_596_800;

/** Seconds since the epoch of 9999-12-31T23:59:59Z, Firestore's upper bound. */
const MAX_FIRESTORE_SECONDS = 253_402_300_799;

export class Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    if (!Number.isSafeInteger(seconds)) {
      throw new RangeError(
        `Timestamp seconds must be a safe integer, received ${String(seconds)}`,
      );
    }
    /**
     * Firestore stores timestamps between 0001-01-01 and 9999-12-31. Accepting
     * anything wider would let `toRfc3339` emit an expanded-year form
     * (`+275760-09-13T…`) that the API cannot parse back.
     */
    if (seconds < MIN_FIRESTORE_SECONDS || seconds > MAX_FIRESTORE_SECONDS) {
      throw new RangeError(
        `Timestamp seconds must fall between 0001-01-01 and 9999-12-31, received ${String(seconds)}`,
      );
    }
    if (
      !Number.isInteger(nanoseconds) ||
      nanoseconds < 0 ||
      nanoseconds >= NANOSECONDS_PER_SECOND
    ) {
      throw new RangeError(
        `Timestamp nanoseconds must be an integer between 0 and 999999999, received ${String(nanoseconds)}`,
      );
    }

    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static now(): Timestamp {
    return Timestamp.fromMillis(Date.now());
  }

  static fromDate(date: Date): Timestamp {
    const milliseconds = date.getTime();

    if (Number.isNaN(milliseconds)) {
      throw new RangeError("Cannot convert an invalid Date to a Timestamp");
    }

    return Timestamp.fromMillis(milliseconds);
  }

  static fromMillis(milliseconds: number): Timestamp {
    if (!Number.isFinite(milliseconds)) {
      throw new RangeError(
        `Cannot convert a non-finite value to a Timestamp, received ${String(milliseconds)}`,
      );
    }

    /**
     * `Math.floor` rather than truncation so that pre-1970 values round toward
     * negative infinity, which keeps the nanosecond remainder positive as the
     * Firestore representation requires.
     */
    const seconds = Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
    const remainder = milliseconds - seconds * MILLISECONDS_PER_SECOND;
    const nanoseconds = Math.round(remainder * NANOSECONDS_PER_MILLISECOND);

    /**
     * Rounding a remainder just under a full second lands on 1e9, which is not
     * a representable nanosecond value. Carry it rather than throwing: an input
     * such as -0.0000001 is perfectly finite and has an exact representation
     * one second along.
     */
    return nanoseconds === NANOSECONDS_PER_SECOND
      ? new Timestamp(seconds + 1, 0)
      : new Timestamp(seconds, nanoseconds);
  }

  /**
   * Parse the RFC 3339 string Firestore uses on the wire. This is done by hand
   * rather than through `Date` because `Date` truncates to milliseconds, which
   * would discard the sub-millisecond digits Firestore preserves.
   */
  static fromRfc3339(value: string): Timestamp {
    const match = RFC3339_PATTERN.exec(value);

    if (!match) {
      throw new RangeError(`Not a valid RFC 3339 timestamp: ${value}`);
    }

    const [, year, month, day, hour, minute, second, fraction] = match;

    /**
     * `Date.UTC` interprets years 0 through 99 as 1900-1999, which would
     * silently shift the earliest timestamps Firestore accepts (its range
     * starts at year 1). Setting the year explicitly avoids that remapping.
     */
    const date = new Date(0);
    date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
    date.setUTCHours(Number(hour), Number(minute), Number(second), 0);

    const milliseconds = date.getTime();

    if (Number.isNaN(milliseconds)) {
      throw new RangeError(`Not a valid RFC 3339 timestamp: ${value}`);
    }

    /**
     * `Date` rolls over out-of-range components rather than rejecting them, so
     * a month of 13 would silently become January of the next year. Compare
     * what came back against what was parsed to catch that.
     */
    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day) ||
      date.getUTCHours() !== Number(hour) ||
      date.getUTCMinutes() !== Number(minute) ||
      date.getUTCSeconds() !== Number(second)
    ) {
      throw new RangeError(
        `RFC 3339 timestamp has out-of-range components: ${value}`,
      );
    }

    /**
     * Pad the fractional digits out to nanosecond resolution. Firestore emits
     * 0, 3, 6 or 9 digits depending on the stored precision; anything beyond
     * nine digits is more precision than the format carries, so it is dropped.
     */
    const nanoseconds = fraction
      ? Number(fraction.slice(0, 9).padEnd(9, "0"))
      : 0;

    return new Timestamp(milliseconds / MILLISECONDS_PER_SECOND, nanoseconds);
  }

  /** Truncates to millisecond precision, because `Date` cannot hold more. */
  toDate(): Date {
    return new Date(this.toMillis());
  }

  toMillis(): number {
    return (
      this.seconds * MILLISECONDS_PER_SECOND +
      Math.floor(this.nanoseconds / NANOSECONDS_PER_MILLISECOND)
    );
  }

  /**
   * Render the wire format. The fractional part is omitted entirely when there
   * are no sub-second digits, and otherwise written at full nanosecond width.
   */
  toRfc3339(): string {
    const base = new Date(this.seconds * MILLISECONDS_PER_SECOND)
      .toISOString()
      .replace(/\.\d{3}Z$/, "");

    return this.nanoseconds === 0
      ? `${base}Z`
      : `${base}.${String(this.nanoseconds).padStart(9, "0")}Z`;
  }

  isEqual(other: Timestamp): boolean {
    return (
      this.seconds === other.seconds && this.nanoseconds === other.nanoseconds
    );
  }

  toString(): string {
    return `Timestamp(seconds=${String(this.seconds)}, nanoseconds=${String(this.nanoseconds)})`;
  }

  toJSON(): { seconds: number; nanoseconds: number } {
    return { seconds: this.seconds, nanoseconds: this.nanoseconds };
  }

  /**
   * Returns a lexicographically sortable representation, matching the behavior
   * of the firebase-admin `Timestamp`. Seconds are offset by the earliest
   * timestamp Firestore accepts (0001-01-01) so that dates before 1970 still
   * sort correctly once rendered as a zero-padded string.
   */
  valueOf(): string {
    const offsetSeconds = this.seconds - MIN_FIRESTORE_SECONDS;

    return `${String(offsetSeconds).padStart(12, "0")}.${String(this.nanoseconds).padStart(9, "0")}`;
  }
}
