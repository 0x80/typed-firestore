import { describe, expect, it } from "vitest";
import { Timestamp } from "~/values/timestamp";
import { buildStructuredQuery, Query } from "./query";

function build<T>(
  fn: (query: Query<T>) => Query<T>,
  select?: readonly string[],
): Record<string, unknown> {
  return buildStructuredQuery("users", fn(new Query<T>()).state, select);
}

type User = {
  name: string;
  age: number;
  active: boolean;
  createdAt: Timestamp;
  tags: string[];
};

describe("query builder", () => {
  it("keeps a single filter unwrapped", () => {
    const query = build<User>((q) => q.where("age", ">=", 18));

    expect(query["where"]).toEqual({
      fieldFilter: {
        field: { fieldPath: "age" },
        op: "GREATER_THAN_OR_EQUAL",
        value: { integerValue: "18" },
      },
    });
  });

  it("composes multiple filters under AND", () => {
    const query = build<User>((q) =>
      q.where("active", "==", true).where("age", "<", 30),
    );

    expect(query["where"]).toEqual({
      compositeFilter: {
        op: "AND",
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: "active" },
              op: "EQUAL",
              value: { booleanValue: true },
            },
          },
          {
            fieldFilter: {
              field: { fieldPath: "age" },
              op: "LESS_THAN",
              value: { integerValue: "30" },
            },
          },
        ],
      },
    });
  });

  it("translates a null comparison into a unary filter", () => {
    /** Sent as a field filter this would match nothing rather than fail. */
    expect(build<User>((q) => q.where("name", "==", null))["where"]).toEqual({
      unaryFilter: { field: { fieldPath: "name" }, op: "IS_NULL" },
    });

    expect(build<User>((q) => q.where("name", "!=", null))["where"]).toEqual({
      unaryFilter: { field: { fieldPath: "name" }, op: "IS_NOT_NULL" },
    });
  });

  it("translates a NaN comparison into a unary filter", () => {
    expect(
      build<User>((q) => q.where("age", "==", Number.NaN))["where"],
    ).toEqual({ unaryFilter: { field: { fieldPath: "age" }, op: "IS_NAN" } });
  });

  it("rejects an ordering comparison against null", () => {
    expect(() => build<User>((q) => q.where("age", ">", null))).toThrow(
      /cannot be used with null/,
    );
  });

  it("encodes membership operators as a value list", () => {
    expect(
      build<User>((q) => q.where("name", "in", ["a", "b"]))["where"],
    ).toEqual({
      fieldFilter: {
        field: { fieldPath: "name" },
        op: "IN",
        value: {
          arrayValue: {
            values: [{ stringValue: "a" }, { stringValue: "b" }],
          },
        },
      },
    });
  });

  it("requires an array for a membership operator", () => {
    expect(() => build<User>((q) => q.where("name", "in", "a"))).toThrow(
      /expects an array/,
    );
  });

  it("maps ordering direction to the wire vocabulary", () => {
    expect(
      build<User>((q) => q.orderBy("createdAt", "desc").orderBy("name"))[
        "orderBy"
      ],
    ).toEqual([
      { field: { fieldPath: "createdAt" }, direction: "DESCENDING" },
      { field: { fieldPath: "name" }, direction: "ASCENDING" },
    ]);
  });

  it("carries limit, offset and select", () => {
    const query = build<User>((q) => q.limit(10).offset(5), ["name", "age"]);

    expect(query["limit"]).toBe(10);
    expect(query["offset"]).toBe(5);
    expect(query["select"]).toEqual({
      fields: [{ fieldPath: "name" }, { fieldPath: "age" }],
    });
  });

  it("rejects a nonsensical limit or offset", () => {
    expect(() => new Query<User>().limit(0)).toThrow(RangeError);
    expect(() => new Query<User>().limit(1.5)).toThrow(RangeError);
    expect(() => new Query<User>().offset(-1)).toThrow(RangeError);
  });

  it("is immutable, so a base query can be reused", () => {
    const base = new Query<User>().where("active", "==", true);
    const younger = base.where("age", "<", 30);

    expect(base.state.filters).toHaveLength(1);
    expect(younger.state.filters).toHaveLength(2);
  });

  it("escapes a field name that would otherwise read as a nested path", () => {
    const query = buildStructuredQuery(
      "users",
      new Query<Record<string, unknown>>().where("a.b", "==", 1).state,
    );

    expect(query["where"]).toEqual({
      fieldFilter: {
        field: { fieldPath: "`a.b`" },
        op: "EQUAL",
        value: { integerValue: "1" },
      },
    });
  });
});
