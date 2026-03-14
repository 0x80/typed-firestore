import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";
import type { FsMutableDocument, FsMutableDocumentTx } from "~/types";
import { invariant } from "~/utils";
import {
  makeMutableDocument,
  makeMutableDocumentTx,
} from "./make-mutable-document";

/**
 * When you have a collection with differently typed documents, you can define
 * document refs for each of them specifically
 */
export async function getSpecificDocument<T extends DocumentData>(
  ref: DocumentReference<T>,
): Promise<FsMutableDocument<T>> {
  const doc = await ref.get();

  invariant(doc.exists, `No document available at ${ref.path}`);

  return makeMutableDocument<T>(doc);
}

export async function getSpecificDocumentMaybe<T extends DocumentData>(
  ref: DocumentReference<T>,
): Promise<FsMutableDocument<T> | undefined> {
  const doc = await ref.get();

  if (!doc.exists) return;

  return makeMutableDocument<T>(doc);
}

export async function getSpecificDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>,
): Promise<FsMutableDocumentTx<T>> {
  const doc = await tx.get(ref);

  invariant(doc.exists, `No document available at ${ref.path}`);

  return makeMutableDocumentTx<T>(tx, doc);
}

export async function getSpecificDocumentMaybeTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>,
): Promise<FsMutableDocumentTx<T> | undefined> {
  const doc = await tx.get(ref);

  if (!doc.exists) return;

  return makeMutableDocumentTx<T>(tx, doc);
}
