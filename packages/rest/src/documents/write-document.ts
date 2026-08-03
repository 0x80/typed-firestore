import {
  applyPrecondition,
  runWithPrecondition,
  toWriteResult,
} from "~/internal/precondition";
import type { CollectionRef } from "~/refs/collection-ref";
import type { DocumentRef } from "~/refs/document-ref";
import type {
  FsMutableDocument,
  Precondition,
  UpdateData,
  WriteResult,
} from "~/types";
import { encodeFields } from "~/values/encode";
import { toCollectionPath } from "./create-document";
import {
  assertWireDocument,
  makeMutableDocument,
  patchDocument,
} from "./make-document";

/**
 * Write a document at a known id, replacing it entirely when it already exists.
 *
 * Every field is overwritten, so a property omitted from `data` is removed. Use
 * `updateDocument` to change a subset.
 */
export async function setDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
  data: T,
): Promise<WriteResult> {
  const documentRef = ref.doc(documentId);

  const response = await ref.db.request({
    method: "PATCH",
    path: documentRef.name,
    body: {
      fields: encodeFields(data as Record<string, unknown>, {
        ignoreUndefinedProperties: ref.db.ignoreUndefinedProperties,
      }),
    },
  });

  return toWriteResult(response);
}

/** As `setDocument`, addressed by document reference. */
export async function setSpecificDocument<T>(
  ref: DocumentRef<T>,
  data: T,
): Promise<WriteResult> {
  const response = await ref.db.request({
    method: "PATCH",
    path: ref.name,
    body: {
      fields: encodeFields(data as Record<string, unknown>, {
        ignoreUndefinedProperties: ref.db.ignoreUndefinedProperties,
      }),
    },
  });

  return toWriteResult(response);
}

/**
 * Create a document with a server-generated id.
 *
 * Returns the created document rather than only its id, since the response
 * already carries it and a second read would be wasteful.
 */
export async function addDocument<T>(
  ref: CollectionRef<T>,
  data: T,
): Promise<FsMutableDocument<T>> {
  const response = await ref.db.request({
    method: "POST",
    path: toCollectionPath(ref),
    body: {
      fields: encodeFields(data as Record<string, unknown>, {
        ignoreUndefinedProperties: ref.db.ignoreUndefinedProperties,
      }),
    },
  });

  return makeMutableDocument<T>(ref.db, assertWireDocument(response));
}

/**
 * Change a subset of a document's fields. Fails when the document does not
 * exist, matching the SDK rather than the REST default of creating one.
 *
 * With a precondition, resolves to `undefined` when it was not met.
 */
export async function updateDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
  data: UpdateData<T>,
): Promise<WriteResult>;
export async function updateDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
  data: UpdateData<T>,
  precondition: Precondition,
): Promise<WriteResult | undefined>;
export async function updateDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
  data: UpdateData<T>,
  precondition?: Precondition,
): Promise<WriteResult | undefined> {
  const documentRef = ref.doc(documentId);

  return await runWithPrecondition(
    async () => await patchDocument(ref.db, documentRef, data, precondition),
    precondition !== undefined,
  );
}

/**
 * Delete a document. With a precondition, resolves to `undefined` when it was
 * not met.
 */
export async function deleteDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
): Promise<WriteResult>;
export async function deleteDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
  precondition: Precondition,
): Promise<WriteResult | undefined>;
export async function deleteDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
  precondition?: Precondition,
): Promise<WriteResult | undefined> {
  const documentRef = ref.doc(documentId);
  const query = new URLSearchParams();

  if (precondition) {
    applyPrecondition(query, precondition);
  }

  return await runWithPrecondition(async () => {
    const response = await documentRef.db.request({
      method: "DELETE",
      path: documentRef.name,
      query,
    });

    return toWriteResult(response);
  }, precondition !== undefined);
}
