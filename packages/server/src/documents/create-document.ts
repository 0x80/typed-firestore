import {
  CollectionReference,
  type DocumentData,
  type WithFieldValue,
  type WriteResult,
} from "firebase-admin/firestore";
import { isAlreadyExistsError } from "~/utils/firestore-errors";

/**
 * Create a document at a known id, failing when one already exists.
 *
 * This is the third member of the write trio, alongside `addDocument` which
 * generates an id and `setDocument` which overwrites whatever is there.
 * Firestore enforces the check server-side, so it is a single atomic write
 * rather than a read followed by a write.
 */
export async function createDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
): Promise<WriteResult> {
  return await ref.doc(documentId).create(data);
}

/**
 * Resolves to undefined when a document already exists at that id.
 *
 * This is the shape idempotent submission paths want. A caller retrying after a
 * lost response gets undefined rather than an error, so it can treat the
 * submission as already completed. Note that undefined proves only that the id
 * is taken, not that this caller's earlier attempt is what took it — where
 * ownership matters, read the document back.
 */
export async function createDocumentMaybe<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
): Promise<WriteResult | undefined> {
  try {
    return await ref.doc(documentId).create(data);
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return undefined;
    }

    throw error;
  }
}
