import { describe, expect, it } from "vitest";
import {
  createFakeDb,
  DOCUMENTS_PATH,
  errorResponse,
} from "~/__tests__/fake-db";
import { getDocuments } from "~/collections/get-documents";
import { Timestamp } from "~/values/timestamp";
import { createDocument, createDocumentMaybe } from "./create-document";
import { getDocument, getDocumentMaybe } from "./get-document";
import {
  addDocument,
  deleteDocument,
  setDocument,
  updateDocument,
} from "./write-document";

type Feedback = {
  content: string;
  screen: string;
  classificationVersion: number;
  createdAt: Timestamp;
};

const createdAt = new Timestamp(1_754_223_296, 0);

function wireDocument(id: string, fields: Record<string, unknown> = {}) {
  return {
    name: `${DOCUMENTS_PATH}/feedback/${id}`,
    createTime: "2026-08-03T12:00:00Z",
    updateTime: "2026-08-03T12:00:00.000000123Z",
    fields: {
      content: { stringValue: "it broke" },
      screen: { stringValue: "home" },
      classificationVersion: { integerValue: "0" },
      createdAt: { timestampValue: createdAt.toRfc3339() },
      ...fields,
    },
  };
}

describe("reads", () => {
  it("addresses the document by its full resource name", async () => {
    const fake = createFakeDb(() => wireDocument("abc"));
    const document = await getDocument(
      fake.db.collection<Feedback>("feedback"),
      "abc",
    );

    expect(fake.lastRequest().url.pathname).toBe(
      `/v1/${DOCUMENTS_PATH}/feedback/abc`,
    );
    expect(document.id).toBe("abc");
    expect(document.data.content).toBe("it broke");
    expect(document.data.createdAt).toEqual(createdAt);
  });

  it("exposes the read version so a caller can compare against it", async () => {
    const fake = createFakeDb(() => wireDocument("abc"));
    const document = await getDocument(
      fake.db.collection<Feedback>("feedback"),
      "abc",
    );

    expect(document.updateTime.toRfc3339()).toBe(
      "2026-08-03T12:00:00.000000123Z",
    );
  });

  it("returns undefined for a missing document via the Maybe variant", async () => {
    const fake = createFakeDb(() =>
      errorResponse(404, "NOT_FOUND", "No document to get"),
    );

    await expect(
      getDocumentMaybe(fake.db.collection<Feedback>("feedback"), "nope"),
    ).resolves.toBeUndefined();
  });

  it("throws for a missing document via the plain variant", async () => {
    const fake = createFakeDb(() =>
      errorResponse(404, "NOT_FOUND", "No document to get"),
    );

    await expect(
      getDocument(fake.db.collection<Feedback>("feedback"), "nope"),
    ).rejects.toThrow(/No document to get/);
  });

  it("does not make a request for an absent id", async () => {
    const fake = createFakeDb(() => wireDocument("abc"));

    await expect(
      getDocumentMaybe(fake.db.collection<Feedback>("feedback"), undefined),
    ).resolves.toBeUndefined();
    expect(fake.requests).toHaveLength(0);
  });
});

describe("createDocument", () => {
  it("posts to the collection with the requested id", async () => {
    const fake = createFakeDb(() => wireDocument("abc"));

    await createDocument(fake.db.collection<Feedback>("feedback"), "abc", {
      content: "it broke",
      screen: "home",
      classificationVersion: 0,
      createdAt,
    });

    const request = fake.lastRequest();

    expect(request.method).toBe("POST");
    expect(request.url.pathname).toBe(`/v1/${DOCUMENTS_PATH}/feedback`);
    expect(request.url.searchParams.get("documentId")).toBe("abc");
  });

  it("resolves to undefined when the document already exists", async () => {
    const fake = createFakeDb(() =>
      errorResponse(409, "ALREADY_EXISTS", "Document already exists"),
    );

    await expect(
      createDocumentMaybe(fake.db.collection<Feedback>("feedback"), "abc", {
        content: "it broke",
        screen: "home",
        classificationVersion: 0,
        createdAt,
      }),
    ).resolves.toBeUndefined();
  });

  it("still throws on an unrelated failure", async () => {
    const fake = createFakeDb(() =>
      errorResponse(503, "UNAVAILABLE", "Backend unavailable"),
    );

    await expect(
      createDocumentMaybe(fake.db.collection<Feedback>("feedback"), "abc", {
        content: "it broke",
        screen: "home",
        classificationVersion: 0,
        createdAt,
      }),
    ).rejects.toThrow(/Backend unavailable/);
  });
});

describe("updateDocument", () => {
  it("builds an update mask from the supplied keys", async () => {
    const fake = createFakeDb(() => ({ updateTime: "2026-08-03T13:00:00Z" }));

    await updateDocument(fake.db.collection<Feedback>("feedback"), "abc", {
      classificationVersion: 1,
    });

    const request = fake.lastRequest();

    expect(request.method).toBe("PATCH");
    expect(request.url.searchParams.getAll("updateMask.fieldPaths")).toEqual([
      "classificationVersion",
    ]);
  });

  it("requires the document to exist, matching the SDK rather than REST", async () => {
    const fake = createFakeDb(() => ({ updateTime: "2026-08-03T13:00:00Z" }));

    await updateDocument(fake.db.collection<Feedback>("feedback"), "abc", {
      classificationVersion: 1,
    });

    expect(
      fake.lastRequest().url.searchParams.get("currentDocument.exists"),
    ).toBe("true");
  });

  it("sends a lastUpdateTime precondition", async () => {
    const fake = createFakeDb(() => ({ updateTime: "2026-08-03T13:00:00Z" }));

    await updateDocument(
      fake.db.collection<Feedback>("feedback"),
      "abc",
      { classificationVersion: 1 },
      { lastUpdateTime: new Timestamp(1_754_223_296, 123) },
    );

    const request = fake.lastRequest();

    expect(request.url.searchParams.get("currentDocument.updateTime")).toBe(
      "2025-08-03T12:14:56.000000123Z",
    );
    /** The caller's precondition replaces the implicit exists check. */
    expect(request.url.searchParams.get("currentDocument.exists")).toBeNull();
  });

  it("resolves to undefined when a caller precondition is not met", async () => {
    const fake = createFakeDb(() =>
      errorResponse(400, "FAILED_PRECONDITION", "the document was modified"),
    );

    await expect(
      updateDocument(
        fake.db.collection<Feedback>("feedback"),
        "abc",
        { classificationVersion: 1 },
        { lastUpdateTime: new Timestamp(1, 0) },
      ),
    ).resolves.toBeUndefined();
  });

  it("throws when no caller precondition was given, so a missing document is an error", async () => {
    const fake = createFakeDb(() =>
      errorResponse(400, "FAILED_PRECONDITION", "no entity to update"),
    );

    await expect(
      updateDocument(fake.db.collection<Feedback>("feedback"), "abc", {
        classificationVersion: 1,
      }),
    ).rejects.toThrow(/no entity to update/);
  });

  it("does not swallow a missing index, which shares the FAILED_PRECONDITION code", async () => {
    const fake = createFakeDb(() =>
      errorResponse(400, "FAILED_PRECONDITION", "The query requires an index."),
    );

    await expect(
      updateDocument(
        fake.db.collection<Feedback>("feedback"),
        "abc",
        { classificationVersion: 1 },
        { lastUpdateTime: new Timestamp(1, 0) },
      ),
    ).rejects.toThrow(/requires an index/);
  });
});

describe("document methods", () => {
  it("compares against its own read version with ifUnchanged", async () => {
    const fake = createFakeDb((request) =>
      request.method === "GET"
        ? wireDocument("abc")
        : { updateTime: "2026-08-03T13:00:00Z" },
    );

    const document = await getDocument(
      fake.db.collection<Feedback>("feedback"),
      "abc",
    );

    await document.update({ classificationVersion: 1 }, { ifUnchanged: true });

    expect(
      fake.lastRequest().url.searchParams.get("currentDocument.updateTime"),
    ).toBe("2026-08-03T12:00:00.000000123Z");
  });

  it("resolves to undefined when the version moved on", async () => {
    const fake = createFakeDb((request) =>
      request.method === "GET"
        ? wireDocument("abc")
        : errorResponse(409, "FAILED_PRECONDITION", "document was modified"),
    );

    const document = await getDocument(
      fake.db.collection<Feedback>("feedback"),
      "abc",
    );

    await expect(
      document.update({ classificationVersion: 1 }, { ifUnchanged: true }),
    ).resolves.toBeUndefined();
  });
});

describe("setDocument and addDocument", () => {
  it("sends no update mask, so the document is replaced wholesale", async () => {
    const fake = createFakeDb(() => ({ updateTime: "2026-08-03T13:00:00Z" }));

    await setDocument(fake.db.collection<Feedback>("feedback"), "abc", {
      content: "replaced",
      screen: "home",
      classificationVersion: 0,
      createdAt,
    });

    expect(
      fake.lastRequest().url.searchParams.getAll("updateMask.fieldPaths"),
    ).toEqual([]);
  });

  it("lets the server generate an id", async () => {
    const fake = createFakeDb(() => wireDocument("generated"));

    const document = await addDocument(
      fake.db.collection<Feedback>("feedback"),
      {
        content: "it broke",
        screen: "home",
        classificationVersion: 0,
        createdAt,
      },
    );

    expect(fake.lastRequest().url.searchParams.get("documentId")).toBeNull();
    expect(document.id).toBe("generated");
  });

  it("deletes with a precondition", async () => {
    const fake = createFakeDb(() => new Response("", { status: 200 }));

    await deleteDocument(fake.db.collection<Feedback>("feedback"), "abc", {
      exists: true,
    });

    const request = fake.lastRequest();

    expect(request.method).toBe("DELETE");
    expect(request.url.searchParams.get("currentDocument.exists")).toBe("true");
  });
});

describe("queries", () => {
  it("posts a structured query to the parent of the collection", async () => {
    const fake = createFakeDb(() => [{ document: wireDocument("abc") }]);

    const documents = await getDocuments(
      fake.db.collection<Feedback>("feedback"),
      (query) =>
        query
          .where("classificationVersion", "==", 0)
          .orderBy("createdAt", "asc")
          .limit(100),
    );

    const request = fake.lastRequest();

    expect(request.url.pathname).toBe(`/v1/${DOCUMENTS_PATH}:runQuery`);
    expect(documents).toHaveLength(1);
    expect(documents[0]?.data.content).toBe("it broke");
  });

  it("targets the owning document for a subcollection", async () => {
    const fake = createFakeDb(() => []);

    await getDocuments(
      fake.db.collection<Feedback>("users/alice/feedback"),
      (query) => query.limit(10),
    );

    expect(fake.lastRequest().url.pathname).toBe(
      `/v1/${DOCUMENTS_PATH}/users/alice:runQuery`,
    );
  });

  it("skips the readTime-only entry Firestore emits for an empty result", async () => {
    const fake = createFakeDb(() => [{ readTime: "2026-08-03T12:00:00Z" }]);

    await expect(
      getDocuments(fake.db.collection<Feedback>("feedback"), (query) =>
        query.limit(10),
      ),
    ).resolves.toEqual([]);
  });

  it("requires an explicit limit while pagination is unavailable", async () => {
    const fake = createFakeDb(() => []);

    await expect(
      getDocuments(fake.db.collection<Feedback>("feedback"), (query) =>
        query.where("classificationVersion", "==", 0),
      ),
    ).rejects.toThrow(/explicit limit/);
  });
});
