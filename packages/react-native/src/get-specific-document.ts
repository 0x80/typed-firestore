import { getDoc } from "@react-native-firebase/firestore";
import { invariant, snapshotExists } from "~/utils";
import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from "./firestore-types";
import {
  makeMutableDocument,
  makeMutableDocumentTx,
} from "./make-mutable-document";

export async function getSpecificDocument<T extends DocumentData>(
  documentRef: DocumentReference<T>,
) {
  const snapshot = await getDoc(documentRef);

  invariant(
    snapshotExists(snapshot),
    `No document available at ${documentRef.path}`,
  );

  return makeMutableDocument(snapshot);
}

export async function getSpecificDocumentData<T extends DocumentData>(
  documentRef: DocumentReference<T>,
) {
  const docSnap = await getDoc(documentRef);

  invariant(
    snapshotExists(docSnap),
    `No document available at ${documentRef.path}`,
  );

  return docSnap.data();
}

export async function getSpecificDocumentTx<T extends DocumentData>(
  transaction: Transaction,
  documentRef: DocumentReference<T>,
) {
  const snapshot = await transaction.get(documentRef);

  invariant(
    snapshotExists(snapshot),
    `No document available at ${documentRef.path}`,
  );

  return makeMutableDocumentTx(snapshot, transaction);
}

/** @deprecated Use `getSpecificDocumentTx` instead. */
export const getSpecificDocumentFromTransaction = getSpecificDocumentTx;
