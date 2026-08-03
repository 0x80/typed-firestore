import { getDoc } from "@react-native-firebase/firestore";
import { doc } from "~/typed-modular";
import { invariant, snapshotExists } from "~/utils";
import type {
  CollectionReference,
  DocumentData,
  Transaction,
} from "./firestore-types";
import {
  makeMutableDocument,
  makeMutableDocumentTx,
} from "./make-mutable-document";

export async function getDocument<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId: string,
) {
  const snapshot = await getDoc(doc(collectionRef, documentId));

  invariant(
    snapshotExists(snapshot),
    `No document available at ${collectionRef.path}/${documentId}`,
  );

  return makeMutableDocument(snapshot);
}

export async function getDocumentMaybe<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId: string,
) {
  const snapshot = await getDoc(doc(collectionRef, documentId));

  if (!snapshotExists(snapshot)) return;

  return makeMutableDocument(snapshot);
}

export async function getDocumentData<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId: string,
) {
  const docSnap = await getDoc(doc(collectionRef, documentId));

  invariant(
    snapshotExists(docSnap),
    `No document available at ${collectionRef.path}/${documentId}`,
  );

  return docSnap.data();
}

export async function getDocumentDataMaybe<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId: string,
) {
  const snapshot = await getDoc(doc(collectionRef, documentId));

  if (!snapshotExists(snapshot)) return;

  return snapshot.data();
}

export async function getDocumentTx<T extends DocumentData>(
  transaction: Transaction,
  collectionRef: CollectionReference<T>,
  documentId: string,
) {
  const snapshot = await transaction.get(doc(collectionRef, documentId));

  invariant(
    snapshotExists(snapshot),
    `No document available at ${collectionRef.path}/${documentId}`,
  );

  return makeMutableDocumentTx(snapshot, transaction);
}

export async function getDocumentMaybeTx<T extends DocumentData>(
  transaction: Transaction,
  collectionRef: CollectionReference<T>,
  documentId: string,
) {
  const snapshot = await transaction.get(doc(collectionRef, documentId));

  if (!snapshotExists(snapshot)) {
    return;
  }

  return makeMutableDocumentTx(snapshot, transaction);
}

/** @deprecated Use `getDocumentTx` instead. */
export const getDocumentInTransaction = getDocumentTx;

/** @deprecated Use `getDocumentMaybeTx` instead. */
export const getDocumentInTransactionMaybe = getDocumentMaybeTx;
