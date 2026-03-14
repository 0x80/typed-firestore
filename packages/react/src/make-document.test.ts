import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { makeDocument } from "./make-document";
import {
  makeMutableDocument,
  makeMutableDocumentInTransaction,
} from "./make-mutable-document";

function mockSnapshot<T>(options: {
  id: string;
  data: T | undefined;
  path: string;
}): DocumentSnapshot<T> {
  return {
    id: options.id,
    data: () => options.data,
    ref: { path: options.path } as DocumentReference<T>,
  } as DocumentSnapshot<T>;
}

describe("makeDocument", () => {
  it("returns id and data for a valid snapshot", () => {
    const snapshot = mockSnapshot({
      id: "doc1",
      data: { name: "Alice" },
      path: "users/doc1",
    });

    const result = makeDocument(snapshot);

    expect(result).toEqual({ id: "doc1", data: { name: "Alice" } });
  });

  it("throws when data() returns undefined", () => {
    const snapshot = mockSnapshot<Record<string, unknown>>({
      id: "doc1",
      data: undefined,
      path: "users/doc1",
    });

    expect(() => makeDocument(snapshot)).toThrow(
      "Document users/doc1 exists but has no data",
    );
  });
});

describe("makeMutableDocument", () => {
  it("returns object with id, data, ref, update, updateWithPartial, and delete", () => {
    const snapshot = mockSnapshot({
      id: "doc2",
      data: { name: "Bob" },
      path: "users/doc2",
    });

    const result = makeMutableDocument(snapshot);

    expect(result.id).toBe("doc2");
    expect(result.data).toEqual({ name: "Bob" });
    expect(result.ref).toBe(snapshot.ref);
    expect(typeof result.update).toBe("function");
    expect(typeof result.updateWithPartial).toBe("function");
    expect(typeof result.delete).toBe("function");
  });

  it("throws when data() returns undefined", () => {
    const snapshot = mockSnapshot<Record<string, unknown>>({
      id: "doc2",
      data: undefined,
      path: "users/doc2",
    });

    expect(() => makeMutableDocument(snapshot)).toThrow(
      "Document users/doc2 exists but has no data",
    );
  });
});

describe("makeMutableDocumentInTransaction", () => {
  const mockTransaction = {} as Transaction;

  it("returns object with id, data, ref, update, updateWithPartial, and delete", () => {
    const snapshot = mockSnapshot({
      id: "doc3",
      data: { name: "Charlie" },
      path: "users/doc3",
    });

    const result = makeMutableDocumentInTransaction(snapshot, mockTransaction);

    expect(result.id).toBe("doc3");
    expect(result.data).toEqual({ name: "Charlie" });
    expect(result.ref).toBe(snapshot.ref);
    expect(typeof result.update).toBe("function");
    expect(typeof result.updateWithPartial).toBe("function");
    expect(typeof result.delete).toBe("function");
  });

  it("throws when data() returns undefined", () => {
    const snapshot = mockSnapshot<Record<string, unknown>>({
      id: "doc3",
      data: undefined,
      path: "users/doc3",
    });

    expect(() =>
      makeMutableDocumentInTransaction(snapshot, mockTransaction),
    ).toThrow("Document users/doc3 exists but has no data");
  });
});
