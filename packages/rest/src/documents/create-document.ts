import { isAlreadyExistsError } from "~/client/errors";
import type { CollectionRef } from "~/refs/collection-ref";
import { assertValidPathSegment } from "~/refs/path-segment";
import type { FsMutableDocument } from "~/types";
import { encodeFields } from "~/values/encode";
import { assertWireDocument, makeMutableDocument } from "./make-document";

/**
 * Create a document at a known id, failing when one already exists.
 *
 * This is the missing third member of the write trio. `addDocument` generates
 * an id, `setDocument` overwrites whatever is there, and this one refuses to
 * touch an existing document. Firestore enforces it server-side, so it is a
 * single atomic round trip rather than a read followed by a write.
 */
export async function createDocument<T>(
  ref: CollectionRef<T>,
  documentId: string,
  data: T,
): Promise<FsMutableDocument<T>> {
  assertValidPathSegment(documentId, "document id");

  const query = new URLSearchParams({ documentId });
  const response = await ref.db.request({
    method: "POST",
    path: toCollectionPath(ref),
    query,
    body: {
      fields: encodeFields(data as Record<string, unknown>, {
        ignoreUndefinedProperties: ref.db.ignoreUndefinedProperties,
      }),
    },
  });

  return makeMutableDocument<T>(ref.db, assertWireDocument(response));
}

/**
 * Resolves to undefined when a document already exists at that id.
 *
 * This is the shape idempotent submission paths want: a repeated request
 * returns undefined rather than throwing, so a retry after a lost response is
 * indistinguishable from a first attempt at the call site.
 */
export async function createDocumentMaybe<T>(
  ref: CollectionRef<T>,
  documentId: string,
  data: T,
): Promise<FsMutableDocument<T> | undefined> {
  try {
    return await createDocument(ref, documentId, data);
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return undefined;
    }

    throw error;
  }
}

/**
 * The create endpoint is addressed as `{parent}/{collectionId}`, which for both
 * a root collection and a subcollection is simply the database documents root
 * joined with the collection path.
 */
export function toCollectionPath<T>(ref: CollectionRef<T>): string {
  return `${ref.db.documentsPath}/${ref.path}`;
}
