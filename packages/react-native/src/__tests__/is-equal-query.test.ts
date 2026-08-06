import { queryEqual } from "@react-native-firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isEqualQuery } from "../fork/helpers/isEqualQuery";
import type { Query } from "../firestore-types";

const queryEqualMock = vi.mocked(queryEqual);

/** Stand-ins for Query — isEqualQuery only ever forwards them to queryEqual. */
const q1 = { type: "query" } as unknown as Query;
const q2 = { type: "query" } as unknown as Query;

describe("isEqualQuery", () => {
  beforeEach(() => {
    queryEqualMock.mockReset();
  });

  it("should treat two undefined queries as equal without consulting the SDK", () => {
    expect(isEqualQuery(undefined, undefined)).toBe(true);
    expect(queryEqualMock).not.toHaveBeenCalled();
  });

  it("should treat one undefined query as unequal without consulting the SDK", () => {
    expect(isEqualQuery(q1, undefined)).toBe(false);
    expect(isEqualQuery(undefined, q1)).toBe(false);
    expect(queryEqualMock).not.toHaveBeenCalled();
  });

  it("should delegate to the modular queryEqual when both queries are defined", () => {
    queryEqualMock.mockReturnValue(true);
    expect(isEqualQuery(q1, q2)).toBe(true);
    expect(queryEqualMock).toHaveBeenCalledWith(q1, q2);

    queryEqualMock.mockReturnValue(false);
    expect(isEqualQuery(q1, q2)).toBe(false);
  });
});
