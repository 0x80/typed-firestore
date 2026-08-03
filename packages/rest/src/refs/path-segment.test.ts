import { describe, expect, it } from "vitest";
import {
  assertValidCollectionPath,
  assertValidPathSegment,
} from "./path-segment";

describe("path segment validation", () => {
  it("rejects a slash, which would redirect the write to another document", () => {
    expect(() => assertValidPathSegment("a/b", "document id")).toThrow(
      /forward slash/,
    );
  });

  it("rejects the relative path segments", () => {
    expect(() => assertValidPathSegment(".", "document id")).toThrow();
    expect(() => assertValidPathSegment("..", "document id")).toThrow();
  });

  it("rejects the reserved pattern", () => {
    expect(() => assertValidPathSegment("__name__", "document id")).toThrow(
      /reserved/,
    );
  });

  it("rejects an empty segment", () => {
    expect(() => assertValidPathSegment("", "document id")).toThrow();
  });

  it("measures the length limit in UTF-8 bytes, not characters", () => {
    /** Four bytes each, so 375 of them sit exactly on the 1500 byte limit. */
    expect(() => assertValidPathSegment("𝄞".repeat(375), "id")).not.toThrow();
    expect(() => assertValidPathSegment("𝄞".repeat(376), "id")).toThrow(
      /1500 bytes/,
    );
  });

  it("accepts identifiers that are unusual but legal", () => {
    expect(() => assertValidPathSegment("a.b", "document id")).not.toThrow();
    expect(() =>
      assertValidPathSegment("café ☕", "document id"),
    ).not.toThrow();
    expect(() => assertValidPathSegment("__x", "document id")).not.toThrow();
  });

  it("requires an odd number of segments for a collection path", () => {
    expect(() => assertValidCollectionPath("users")).not.toThrow();
    expect(() =>
      assertValidCollectionPath("users/alice/wishlist"),
    ).not.toThrow();
    expect(() => assertValidCollectionPath("users/alice")).toThrow(/odd/);
  });
});
