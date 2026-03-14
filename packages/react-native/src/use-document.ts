import { doc } from "@react-native-firebase/firestore";
import { useMemo } from "react";
import type { CollectionReference, DocumentData } from "./firestore-types";
import { useDocument_fork, useDocumentOnce_fork } from "./fork";
import { makeMutableDocument } from "./make-mutable-document";
import type { FsMutableDocument } from "./types.js";

export function useDocument<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId?: string,
): [FsMutableDocument<T>, false] | [undefined, true] {
  const ref = documentId ? doc(collectionRef, documentId) : undefined;
  /**
   * We do not need the loading state really. If there is no data, and there is
   * no error, it means data is still loading.
   */
  const [snapshot, , error] = useDocument_fork(ref);

  if (error) {
    throw error;
  }

  const document = useMemo(
    () => (snapshot?.exists ? makeMutableDocument(snapshot) : undefined),
    [snapshot],
  );

  return document ? [document, false] : [undefined, true];
}

/** A version of useDocument that doesn't throw when the document doesn't exist. */
export function useDocumentMaybe<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId?: string,
): [FsMutableDocument<T> | undefined, boolean] {
  const ref = documentId ? doc(collectionRef, documentId) : undefined;
  const [snapshot, isLoading, error] = useDocument_fork(ref);

  if (error) {
    throw error;
  }

  const document = useMemo(
    () => (snapshot?.exists ? makeMutableDocument(snapshot) : undefined),
    [snapshot],
  );

  return [document, isLoading];
}

export function useDocumentData<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId?: string,
): [T, false] | [undefined, true] {
  const [document, isLoading] = useDocument(collectionRef, documentId);

  return isLoading ? [undefined, true] : [document.data, false];
}

export function useDocumentDataMaybe<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId?: string,
): [T | undefined, boolean] {
  const [document, isLoading] = useDocumentMaybe(collectionRef, documentId);
  return [document?.data, isLoading];
}

export function useDocumentOnce<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId?: string,
): [FsMutableDocument<T>, false] | [undefined, true] {
  const ref = documentId ? doc(collectionRef, documentId) : undefined;
  /**
   * We do not need the loading state really. If there is no data, and there is
   * no error, it means data is still loading.
   */
  const [snapshot, , error] = useDocumentOnce_fork(ref);

  if (error) {
    throw error;
  }

  const document = useMemo(
    () => (snapshot?.exists ? makeMutableDocument(snapshot) : undefined),
    [snapshot],
  );

  return document ? [document, false] : [undefined, true];
}

export function useDocumentDataOnce<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId?: string,
): [T, false] | [undefined, true] {
  const [document, isLoading] = useDocumentOnce(collectionRef, documentId);

  return isLoading ? [undefined, true] : [document.data, false];
}
