import { isNotFoundError } from "~/client/errors";
import type { CollectionRef } from "~/refs/collection-ref";
import type { DocumentRef } from "~/refs/document-ref";
import type { FsMutableDocument } from "~/types";
import { assertWireDocument, makeMutableDocument } from "./make-document";

/** Throws when the document does not exist. */
export async function getDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
): Promise<FsMutableDocument<T>> {
  return await getSpecificDocument(ref.doc(documentId));
}

/** Resolves to undefined when the document does not exist. */
export async function getDocumentMaybe<T>(
  ref: CollectionRef<T>,
  documentId?: string | null,
): Promise<FsMutableDocument<T> | undefined> {
  if (!documentId) {
    return undefined;
  }

  return await getSpecificDocumentMaybe(ref.doc(documentId));
}

/** Fetch by document reference rather than by collection and id. */
export async function getSpecificDocument<T>(
  ref: DocumentRef<T>,
): Promise<FsMutableDocument<T>> {
  const response = await ref.db.request({
    method: "GET",
    path: ref.requestPath,
  });

  return makeMutableDocument<T>(ref.db, assertWireDocument(response));
}

export async function getSpecificDocumentMaybe<T>(
  ref: DocumentRef<T>,
): Promise<FsMutableDocument<T> | undefined> {
  try {
    return await getSpecificDocument(ref);
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}
