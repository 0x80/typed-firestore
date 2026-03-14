import type {
  CollectionReference,
  DocumentData,
  Transaction,
} from "firebase-admin/firestore";
import { invariant } from "~/utils";

export async function getDocumentData<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string,
): Promise<T> {
  const doc = await ref.doc(documentId).get();

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  const data = doc.data();
  return data as T;
}

export async function getDocumentDataMaybe<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId?: string | null,
): Promise<T | undefined> {
  if (!documentId) return;

  const doc = await ref.doc(documentId).get();

  if (!doc.exists) return;

  const data = doc.data();
  return data as T;
}

export async function getDocumentDataTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
): Promise<T> {
  const doc = await tx.get(ref.doc(documentId));

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  const data = doc.data();
  return data as T;
}

export async function getDocumentDataMaybeTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId?: string | null,
): Promise<T | undefined> {
  if (!documentId) return;

  const doc = await tx.get(ref.doc(documentId));

  if (!doc.exists) {
    return;
  }

  const data = doc.data();
  return data as T;
}
