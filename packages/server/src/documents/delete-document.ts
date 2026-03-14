import {
  CollectionReference,
  type DocumentData,
} from "firebase-admin/firestore";

/** Delete a document in a collection. */
export async function deleteDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
): Promise<void> {
  await ref.doc(documentId).delete();
}
