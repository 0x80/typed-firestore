import type {
  CollectionReference,
  DocumentData,
  Precondition,
  WriteResult,
} from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it, vi } from "vitest";
import { createDocument, createDocumentMaybe } from "./create-document";
import { deleteDocument } from "./delete-document";
import { makeMutableDocument } from "./make-mutable-document";
import { updateDocument } from "./update-document";

const writeResult = { writeTime: Timestamp.fromMillis(0) } as WriteResult;

/** Firestore reports these as gRPC status codes on the thrown error. */
function statusError(code: number, message: string): Error {
  return Object.assign(new Error(message), { code });
}

/**
 * A collection reference thin enough to observe what the public functions
 * forward to the SDK. The real SDK is not exercised here; what these tests
 * protect is the argument threading, which is where the new precondition and
 * create paths could silently misbehave.
 */
function fakeCollection(document: {
  create?: (data: unknown) => Promise<WriteResult>;
  update?: (data: unknown, precondition?: Precondition) => Promise<WriteResult>;
  delete?: (precondition?: Precondition) => Promise<WriteResult>;
}) {
  const doc = vi.fn(() => document);

  return {
    ref: { doc } as unknown as CollectionReference<DocumentData>,
    doc,
  };
}

describe("createDocument", () => {
  it("forwards the id and data to the SDK create", async () => {
    const create = vi.fn(async () => await Promise.resolve(writeResult));
    const { ref, doc } = fakeCollection({ create });

    await createDocument(ref, "abc", { name: "Alice" });

    expect(doc).toHaveBeenCalledWith("abc");
    expect(create).toHaveBeenCalledWith({ name: "Alice" });
  });

  it("propagates an already-exists failure", async () => {
    const { ref } = fakeCollection({
      create: () => Promise.reject(statusError(6, "already exists")),
    });

    await expect(createDocument(ref, "abc", {})).rejects.toThrow(
      /already exists/,
    );
  });
});

describe("createDocumentMaybe", () => {
  it("resolves to the write result when the document is created", async () => {
    const { ref } = fakeCollection({
      create: async () => await Promise.resolve(writeResult),
    });

    await expect(createDocumentMaybe(ref, "abc", {})).resolves.toBe(
      writeResult,
    );
  });

  it("resolves to undefined when the id is already taken", async () => {
    const { ref } = fakeCollection({
      create: () => Promise.reject(statusError(6, "already exists")),
    });

    await expect(createDocumentMaybe(ref, "abc", {})).resolves.toBeUndefined();
  });

  it("propagates an unrelated failure", async () => {
    const { ref } = fakeCollection({
      create: () => Promise.reject(statusError(14, "unavailable")),
    });

    await expect(createDocumentMaybe(ref, "abc", {})).rejects.toThrow(
      /unavailable/,
    );
  });
});

describe("updateDocument", () => {
  it("passes the caller precondition through to the SDK", async () => {
    const update = vi.fn(async () => await Promise.resolve(writeResult));
    const { ref } = fakeCollection({ update });
    const lastUpdateTime = Timestamp.fromMillis(1_000);

    await updateDocument(ref, "abc", { name: "Alice" }, { lastUpdateTime });

    expect(update).toHaveBeenCalledWith({ name: "Alice" }, { lastUpdateTime });
  });

  it("passes no precondition when the caller supplied none", async () => {
    const update = vi.fn(async () => await Promise.resolve(writeResult));
    const { ref } = fakeCollection({ update });

    await updateDocument(ref, "abc", { name: "Alice" });

    expect(update).toHaveBeenCalledWith({ name: "Alice" });
  });

  it("resolves to undefined when a caller precondition is not met", async () => {
    const { ref } = fakeCollection({
      update: () => Promise.reject(statusError(9, "document was modified")),
    });

    await expect(
      updateDocument(
        ref,
        "abc",
        {},
        { lastUpdateTime: Timestamp.fromMillis(1) },
      ),
    ).resolves.toBeUndefined();
  });

  it("throws the same failure when no precondition was supplied", async () => {
    const { ref } = fakeCollection({
      update: () => Promise.reject(statusError(9, "no entity to update")),
    });

    await expect(updateDocument(ref, "abc", {})).rejects.toThrow(
      /no entity to update/,
    );
  });
});

describe("deleteDocument", () => {
  it("passes the caller precondition through", async () => {
    const remove = vi.fn(async () => await Promise.resolve(writeResult));
    const { ref } = fakeCollection({ delete: remove });

    await deleteDocument(ref, "abc", { exists: true });

    expect(remove).toHaveBeenCalledWith({ exists: true });
  });

  it("resolves to undefined when the precondition is not met", async () => {
    const { ref } = fakeCollection({
      delete: () => Promise.reject(statusError(9, "document was modified")),
    });

    await expect(
      deleteDocument(ref, "abc", { exists: true }),
    ).resolves.toBeUndefined();
  });
});

describe("makeMutableDocument", () => {
  const updateTime = Timestamp.fromMillis(5_000);
  const createTime = Timestamp.fromMillis(1_000);

  function fakeSnapshot(overrides: Record<string, unknown> = {}) {
    const update = vi.fn(async () => await Promise.resolve(writeResult));
    const remove = vi.fn(async () => await Promise.resolve(writeResult));

    const snapshot = {
      id: "abc",
      data: () => ({ name: "Alice" }),
      updateTime,
      createTime,
      ref: { path: "users/abc", update, delete: remove, ...overrides },
    };

    return { snapshot, update, remove };
  }

  it("exposes both timestamps from the snapshot", () => {
    const { snapshot } = fakeSnapshot();
    /** oxlint-disable-next-line typescript/no-unsafe-type-assertion -- minimal snapshot stand-in */
    const document = makeMutableDocument(snapshot as never);

    expect(document.updateTime).toBe(updateTime);
    expect(document.createTime).toBe(createTime);
  });

  it("resolves ifUnchanged against the snapshot's own updateTime", async () => {
    const { snapshot, update } = fakeSnapshot();
    const document = makeMutableDocument(snapshot as never);

    await document.update({ name: "Bob" }, { ifUnchanged: true });

    expect(update).toHaveBeenCalledWith(
      { name: "Bob" },
      { lastUpdateTime: updateTime },
    );
  });

  it("passes no precondition when none was given", async () => {
    const { snapshot, update } = fakeSnapshot();
    const document = makeMutableDocument(snapshot as never);

    await document.update({ name: "Bob" });

    expect(update).toHaveBeenCalledWith({ name: "Bob" });
  });

  it("turns an unmet precondition into undefined", async () => {
    const { snapshot } = fakeSnapshot({
      update: () => Promise.reject(statusError(9, "document was modified")),
    });
    const document = makeMutableDocument(snapshot as never);

    await expect(
      document.update({ name: "Bob" }, { ifUnchanged: true }),
    ).resolves.toBeUndefined();
  });

  it("applies a precondition to delete as well", async () => {
    const { snapshot, remove } = fakeSnapshot();
    const document = makeMutableDocument(snapshot as never);

    await document.delete({ ifUnchanged: true });

    expect(remove).toHaveBeenCalledWith({ lastUpdateTime: updateTime });
  });

  it("refuses to build from a snapshot with no timestamps", () => {
    const snapshot = {
      id: "abc",
      data: () => ({}),
      ref: { path: "users/abc" },
    };

    expect(() => makeMutableDocument(snapshot as never)).toThrow(
      /updateTime or createTime/,
    );
  });
});
