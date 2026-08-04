import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it, vi } from "vitest";
import { resolvePrecondition, runWithPrecondition } from "./precondition";

/** Firestore reports an unmet precondition as gRPC status 9. */
function preconditionError(): Error & { code: number } {
  return Object.assign(new Error("the document was modified"), { code: 9 });
}

describe("resolvePrecondition", () => {
  it("passes a plain precondition through untouched", () => {
    const precondition = { exists: true };

    expect(resolvePrecondition(precondition, undefined)).toBe(precondition);
  });

  it("resolves ifUnchanged against the version the document was read at", () => {
    const readVersion = Timestamp.fromMillis(1_754_223_296_000);

    expect(resolvePrecondition({ ifUnchanged: true }, readVersion)).toEqual({
      lastUpdateTime: readVersion,
    });
  });

  it("rejects ifUnchanged when there is no version to compare against", () => {
    expect(() => resolvePrecondition({ ifUnchanged: true }, undefined)).toThrow(
      /updateTime/,
    );
  });
});

describe("runWithPrecondition", () => {
  it("returns the write result when the write applies", async () => {
    await expect(
      runWithPrecondition(async () => await Promise.resolve("written"), true),
    ).resolves.toBe("written");
  });

  it("turns an unmet caller precondition into undefined", async () => {
    await expect(
      runWithPrecondition(() => Promise.reject(preconditionError()), true),
    ).resolves.toBeUndefined();
  });

  it("still throws when the caller supplied no precondition", async () => {
    /**
     * An operation carrying an implicit precondition of its own, such as an
     * update requiring the document to exist, means the call was wrong rather
     * than that a race was lost.
     */
    await expect(
      runWithPrecondition(() => Promise.reject(preconditionError()), false),
    ).rejects.toThrow(/the document was modified/);
  });

  it("does not swallow an unrelated failure", async () => {
    const other = Object.assign(new Error("backend unavailable"), { code: 14 });

    await expect(
      runWithPrecondition(() => Promise.reject(other), true),
    ).rejects.toThrow(/backend unavailable/);
  });

  it("does not wrap the write when there is no caller precondition", async () => {
    const write = vi.fn(async () => await Promise.resolve("written"));

    await expect(runWithPrecondition(write, false)).resolves.toBe("written");
    expect(write).toHaveBeenCalledTimes(1);
  });
});
