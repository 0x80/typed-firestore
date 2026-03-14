import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "@react-native-firebase/firestore";
import type {
  CollectionReference,
  DocumentReference,
} from "../firestore-types";
import {
  setDocument,
  setSpecificDocument,
  updateDocument,
  updateSpecificDocument,
  deleteDocument,
  deleteSpecificDocument,
} from "../write-document";

type TestDoc = { name: string; age: number };

const mockCollectionRef = { path: "users" } as CollectionReference<TestDoc>;
const mockDocRef = {
  id: "doc-1",
  path: "users/doc-1",
} as DocumentReference<TestDoc>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setDocument", () => {
  it("should call setDoc without options when none provided", async () => {
    const data = { name: "Alice", age: 30 };
    await setDocument(mockCollectionRef, "doc-1", data);

    expect(doc).toHaveBeenCalledWith(mockCollectionRef, "doc-1");
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), data);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("should call setDoc with options when provided", async () => {
    const data = { name: "Alice" };
    const options = { merge: true };
    await setDocument(mockCollectionRef, "doc-1", data, options);

    expect(doc).toHaveBeenCalledWith(mockCollectionRef, "doc-1");
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), data, options);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

describe("setSpecificDocument", () => {
  it("should call setDoc on the reference without options", async () => {
    const data = { name: "Bob", age: 25 };
    await setSpecificDocument(mockDocRef, data);

    expect(doc).not.toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith(mockDocRef, data);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("should call setDoc on the reference with options", async () => {
    const data = { name: "Bob" };
    const options = { mergeFields: ["name"] };
    await setSpecificDocument(mockDocRef, data, options);

    expect(doc).not.toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith(mockDocRef, data, options);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

describe("updateDocument", () => {
  it("should call updateDoc with the correct reference and data", async () => {
    const data = { name: "Carol" };
    await updateDocument(mockCollectionRef, "doc-2", data);

    expect(doc).toHaveBeenCalledWith(mockCollectionRef, "doc-2");
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), data);
    expect(updateDoc).toHaveBeenCalledTimes(1);
  });
});

describe("updateSpecificDocument", () => {
  it("should call updateDoc directly on the reference", async () => {
    const data = { age: 31 };
    await updateSpecificDocument(mockDocRef, data);

    expect(doc).not.toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, data);
    expect(updateDoc).toHaveBeenCalledTimes(1);
  });
});

describe("deleteDocument", () => {
  it("should call deleteDoc with the correct reference", async () => {
    await deleteDocument(mockCollectionRef, "doc-3");

    expect(doc).toHaveBeenCalledWith(mockCollectionRef, "doc-3");
    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });
});

describe("deleteSpecificDocument", () => {
  it("should call deleteDoc directly on the reference", async () => {
    await deleteSpecificDocument(mockDocRef);

    expect(doc).not.toHaveBeenCalled();
    expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });
});
