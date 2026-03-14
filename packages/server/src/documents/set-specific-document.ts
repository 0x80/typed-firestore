import type {
  DocumentData,
  DocumentReference,
  SetOptions,
  Transaction,
  WithFieldValue,
} from "firebase-admin/firestore";

/**
 * Create or overwrite a document in a collection where each document is typed
 * separately.
 */
export async function setSpecificDocument<T extends DocumentData>(
  ref: DocumentReference<T>,
  data: WithFieldValue<T>,
  options: SetOptions = {},
): Promise<void> {
  await ref.set(data, options);
}

export function setSpecificDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>,
  data: WithFieldValue<T>,
  options: SetOptions = {},
): void {
  tx.set(ref, data, options);
}
