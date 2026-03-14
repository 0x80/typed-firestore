import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";
import {
  getSpecificDocument,
  getSpecificDocumentMaybe,
} from "./get-specific-document";

export async function getSpecificDocumentData<T extends DocumentData>(
  ref: DocumentReference<T>,
): Promise<T> {
  const doc = await getSpecificDocument(ref);
  return doc.data;
}

export async function getSpecificDocumentDataMaybe<T extends DocumentData>(
  ref: DocumentReference<T>,
): Promise<T | undefined> {
  const doc = await getSpecificDocumentMaybe(ref);
  return doc?.data;
}

export async function getSpecificDocumentDataMaybeTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>,
): Promise<T | undefined> {
  const doc = await tx.get(ref);

  if (!doc.exists) return;

  return doc.data();
}
