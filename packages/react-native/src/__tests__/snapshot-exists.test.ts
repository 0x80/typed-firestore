import { describe, expect, it } from "vitest";
import { snapshotExists } from "../utils";

describe("snapshotExists", () => {
  it("should read `exists` as a property (@react-native-firebase/firestore <22)", () => {
    expect(snapshotExists({ exists: true })).toBe(true);
    expect(snapshotExists({ exists: false })).toBe(false);
  });

  it("should read `exists` as a method (@react-native-firebase/firestore >=22)", () => {
    expect(snapshotExists({ exists: () => true })).toBe(true);
    expect(snapshotExists({ exists: () => false })).toBe(false);
  });

  it("should call `exists` with the snapshot as `this`", () => {
    const snapshot = {
      _exists: true,
      exists(this: { _exists: boolean }) {
        return this._exists;
      },
    };
    expect(snapshotExists(snapshot)).toBe(true);
  });
});
