import {
  CollectionReference,
  type DocumentData,
  type PartialWithFieldValue,
  type Transaction,
  type UpdateData,
} from "firebase-admin/firestore";

/**
 * Update a document in a collection. You would only use this if you do not
 * already have a handle to a FsMutableDocument, because that has typed `update`
 * and `updateWithPartial` methods.
 */
export async function updateDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>,
): Promise<void> {
  await ref.doc(documentId).update(data);
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
