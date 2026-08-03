import {
  CollectionReference,
  type DocumentData,
  type Precondition,
  type WriteResult,
} from "firebase-admin/firestore";
import { runWithPrecondition } from "./precondition";

/**
 * Delete a document in a collection.
 *
 * With a precondition it resolves to undefined when the condition was not met.
 * That overload returns the `WriteResult` the plain form discards, because
 * `undefined` has to mean something here and `void` cannot carry it.
 */
export async function deleteDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
): Promise<void>;
export async function deleteDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  precondition: Precondition,
): Promise<WriteResult | undefined>;
export async function deleteDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  precondition?: Precondition,
): Promise<WriteResult | undefined | void> {
  return await runWithPrecondition(
    async () =>
      precondition
        ? await ref.doc(documentId).delete(precondition)
        : await ref.doc(documentId).delete(),
    precondition !== undefined,
  );
}
