import {
  CollectionReference,
  type DocumentData,
  type SetOptions,
  type Transaction,
  type WithFieldValue,
} from "firebase-admin/firestore";

/** Create or overwrite a document. */
export async function setDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
  options: SetOptions = {},
): Promise<void> {
  await ref.doc(documentId).set(data, options);
}

export function setDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
  options: SetOptions = {},
): void {
  tx.set(ref.doc(documentId), data, options);
}
