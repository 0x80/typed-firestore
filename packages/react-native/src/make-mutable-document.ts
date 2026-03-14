import {
  deleteDoc,
  updateDoc,
  type UpdateData,
} from "@react-native-firebase/firestore";
import type { FsMutableDocument, FsMutableDocumentTx } from "~/types";
import type {
  DocumentData,
  DocumentSnapshot,
  Transaction,
} from "./firestore-types";

export function makeMutableDocument<T extends DocumentData>(
  doc: DocumentSnapshot<T>,
): FsMutableDocument<T> {
  const data = doc.data();

  if (data === undefined) {
    throw new Error(
      `makeMutableDocument called with a snapshot that has no data (id: ${doc.id}). Ensure the document exists before calling this function.`,
    );
  }

  return {
    id: doc.id,
    data,
    ref: doc.ref,
    update: (updateData: UpdateData<T>) => updateDoc(doc.ref, updateData),
    updateWithPartial: (updateData: Partial<T>) =>
      updateDoc(doc.ref, updateData as UpdateData<T>),
    delete: () => deleteDoc(doc.ref),
  };
}

export function makeMutableDocumentTx<T extends DocumentData>(
  doc: DocumentSnapshot<T>,
  tx: Transaction,
): FsMutableDocumentTx<T> {
  const data = doc.data();

  if (data === undefined) {
    throw new Error(
      `makeMutableDocumentTx called with a snapshot that has no data (id: ${doc.id}). Ensure the document exists before calling this function.`,
    );
  }

  return {
    id: doc.id,
    data,
    ref: doc.ref,
    update: (updateData: UpdateData<T>) => tx.update(doc.ref, updateData),
    updateWithPartial: (updateData: Partial<T>) =>
      tx.update(doc.ref, updateData as UpdateData<T>),
    delete: () => tx.delete(doc.ref),
  };
}

/** @deprecated Use `makeMutableDocumentTx` instead. */
export const makeMutableDocumentInTransaction = makeMutableDocumentTx;
