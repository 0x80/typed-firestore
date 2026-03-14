import { describe, it, expect, vi } from "vitest";
import { makeDocument } from "../make-document";
import {
  makeMutableDocument,
  makeMutableDocumentTx,
} from "../make-mutable-document";
import type { DocumentSnapshot, Transaction } from "../firestore-types";

type TestDoc = { name: string };

function createMockSnapshot(overrides: {
  id: string;
  data: TestDoc | undefined;
}): DocumentSnapshot<TestDoc> {
  return {
    id: overrides.id,
    data: () => overrides.data,
    ref: { path: `test/${overrides.id}` },
    exists: overrides.data !== undefined,
  } as unknown as DocumentSnapshot<TestDoc>;
}

function createMockTransaction(): Transaction {
  return {
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  } as unknown as Transaction;
}

describe("makeDocument", () => {
  it("should return a document when data exists", () => {
    const snapshot = createMockSnapshot({ id: "1", data: { name: "Alice" } });
    const doc = makeDocument(snapshot);
    expect(doc.id).toBe("1");
    expect(doc.data).toEqual({ name: "Alice" });
  });

  it("should throw when data is undefined", () => {
    const snapshot = createMockSnapshot({ id: "1", data: undefined });
    expect(() => makeDocument(snapshot)).toThrow(
      "makeDocument called with a snapshot that has no data (id: 1)",
    );
  });
});

describe("makeMutableDocument", () => {
  it("should return a mutable document when data exists", () => {
    const snapshot = createMockSnapshot({ id: "2", data: { name: "Bob" } });
    const doc = makeMutableDocument(snapshot);
    expect(doc.id).toBe("2");
    expect(doc.data).toEqual({ name: "Bob" });
    expect(doc.ref).toBe(snapshot.ref);
    expect(typeof doc.update).toBe("function");
    expect(typeof doc.updateWithPartial).toBe("function");
    expect(typeof doc.delete).toBe("function");
  });

  it("should throw when data is undefined", () => {
    const snapshot = createMockSnapshot({ id: "2", data: undefined });
    expect(() => makeMutableDocument(snapshot)).toThrow(
      "makeMutableDocument called with a snapshot that has no data (id: 2)",
    );
  });
});

describe("makeMutableDocumentTx", () => {
  it("should return a mutable document when data exists", () => {
    const snapshot = createMockSnapshot({ id: "3", data: { name: "Carol" } });
    const tx = createMockTransaction();
    const doc = makeMutableDocumentTx(snapshot, tx);
    expect(doc.id).toBe("3");
    expect(doc.data).toEqual({ name: "Carol" });
    expect(doc.ref).toBe(snapshot.ref);
    expect(typeof doc.update).toBe("function");
    expect(typeof doc.updateWithPartial).toBe("function");
    expect(typeof doc.delete).toBe("function");
  });

  it("should throw when data is undefined", () => {
    const snapshot = createMockSnapshot({ id: "3", data: undefined });
    const tx = createMockTransaction();
    expect(() => makeMutableDocumentTx(snapshot, tx)).toThrow(
      "makeMutableDocumentTx called with a snapshot that has no data (id: 3)",
    );
  });
});
