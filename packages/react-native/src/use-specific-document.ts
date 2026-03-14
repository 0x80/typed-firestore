import { useMemo } from "react";
import type { DocumentData, DocumentReference } from "./firestore-types";
import { useDocument_fork, useDocumentOnce_fork } from "./fork";
import { makeMutableDocument } from "./make-mutable-document";
import type { FsMutableDocument } from "./types.js";

export function useSpecificDocument<T extends DocumentData>(
  documentRef: DocumentReference<T>,
): [FsMutableDocument<T>, false] | [undefined, true] {
  /**
   * We do not need the loading state really. If there is no data, and there is
   * no error, it means data is still loading.
   */
  const [snapshot, , error] = useDocument_fork(documentRef);

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
export function useSpecificDocumentMaybe<T extends DocumentData>(
  documentRef: DocumentReference<T>,
): [FsMutableDocument<T> | undefined, boolean] {
  const [snapshot, isLoading, error] = useDocument_fork(documentRef);

  if (error) {
    throw error;
  }

  const document = useMemo(
    () => (snapshot?.exists ? makeMutableDocument(snapshot) : undefined),
    [snapshot],
  );

  return [document, isLoading];
}

export function useSpecificDocumentData<T extends DocumentData>(
  documentRef: DocumentReference<T>,
): [T, false] | [undefined, true] {
  const [document, isLoading] = useSpecificDocument(documentRef);

  return isLoading ? [undefined, true] : [document.data, false];
}

export function useSpecificDocumentDataMaybe<T extends DocumentData>(
  documentRef: DocumentReference<T>,
): [T | undefined, boolean] {
  const [document, isLoading] = useSpecificDocumentMaybe(documentRef);
  return [document?.data, isLoading];
}

export function useSpecificDocumentOnce<T extends DocumentData>(
  documentRef: DocumentReference<T>,
): [FsMutableDocument<T>, false] | [undefined, true] {
  /**
   * We do not need the loading state really. If there is no data, and there is
   * no error, it means data is still loading.
   */
  const [snapshot, , error] = useDocumentOnce_fork(documentRef);

  if (error) {
    throw error;
  }

  const document = useMemo(
    () => (snapshot?.exists ? makeMutableDocument(snapshot) : undefined),
    [snapshot],
  );

  return document ? [document, false] : [undefined, true];
}

export function useSpecificDocumentDataOnce<T extends DocumentData>(
  documentRef: DocumentReference<T>,
): [T, false] | [undefined, true] {
  const [document, isLoading] = useSpecificDocumentOnce(documentRef);

  return isLoading ? [undefined, true] : [document.data, false];
}
