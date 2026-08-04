import {
  CollectionReference,
  type DocumentData,
  type PartialWithFieldValue,
  type Precondition,
  type Transaction,
  type UpdateData,
  type WriteResult,
} from "firebase-admin/firestore";
import { runWithPrecondition } from "./precondition";

/**
 * Update a document in a collection. You would only use this if you do not
 * already have a handle to a FsMutableDocument, because that has typed `update`
 * and `updateWithPartial` methods.
 *
 * With a precondition it resolves to undefined when the condition was not met.
 * The `ifUnchanged` form is not available here, because there is no document in
 * hand to take a version from; pass `lastUpdateTime` instead.
 */
export async function updateDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>,
): Promise<void>;
/**
 * The precondition overload returns the `WriteResult` that the no-precondition
 * form discards, because `undefined` has to mean something here and `void`
 * cannot carry it.
 */
export async function updateDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>,
  precondition: Precondition,
): Promise<WriteResult | undefined>;
export async function updateDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>,
  precondition?: Precondition,
): Promise<WriteResult | undefined | void> {
  return await runWithPrecondition(
    async () =>
      precondition
        ? await ref.doc(documentId).update(data, precondition)
        : await ref.doc(documentId).update(data),
    precondition !== undefined,
  );
}

export async function updateDocumentWithPartial<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: PartialWithFieldValue<T>,
): Promise<void> {
  await ref.doc(documentId).update(data as UpdateData<T>);
}

export function updateDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>,
): void {
  tx.update(ref.doc(documentId), data);
}

export function updateDocumentPartialTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: PartialWithFieldValue<T>,
): void {
  tx.update(ref.doc(documentId), data as UpdateData<T>);
}
