import {
  CollectionReference,
  type DocumentData,
  type Transaction,
  type WithFieldValue,
} from "firebase-admin/firestore";

/** Add a new document to a collection with an auto-generated ID. */
export async function addDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  data: WithFieldValue<T>,
): Promise<string> {
  const docRef = await ref.add(data);

  return docRef.id;
}

/**
 * Add a new document to a collection with an auto-generated ID within a
 * transaction.
 */
export function addDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  data: WithFieldValue<T>,
): string {
  const docRef = ref.doc();
  tx.create(docRef, data);
  return docRef.id;
}
