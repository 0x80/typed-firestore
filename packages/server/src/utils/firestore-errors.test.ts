import { describe, expect, it } from "vitest";
import {
  isAlreadyExistsError,
  isPreconditionFailure,
} from "./firestore-errors";

describe("firestore error codes", () => {
  it("recognises ALREADY_EXISTS", () => {
    expect(isAlreadyExistsError(Object.assign(new Error(), { code: 6 }))).toBe(
      true,
    );
  });

  it("recognises FAILED_PRECONDITION", () => {
    expect(isPreconditionFailure(Object.assign(new Error(), { code: 9 }))).toBe(
      true,
    );
  });

  it("does not confuse the two", () => {
    const alreadyExists = Object.assign(new Error(), { code: 6 });

    expect(isPreconditionFailure(alreadyExists)).toBe(false);
  });

  it("ignores an error carrying a string code", () => {
    /**
     * Some Google libraries attach a string code such as "ENOTFOUND". Treating
     * that as a match would silently swallow a network failure as a lost race.
     */
    const stringCode = Object.assign(new Error(), { code: "ENOTFOUND" });

    expect(isPreconditionFailure(stringCode)).toBe(false);
    expect(isAlreadyExistsError(stringCode)).toBe(false);
  });

  it("tolerates values that are not errors at all", () => {
    for (const value of [undefined, null, "boom", 9, {}]) {
      expect(isPreconditionFailure(value)).toBe(false);
      expect(isAlreadyExistsError(value)).toBe(false);
    }
  });
});
