import {
  type DocumentReference,
  type Transaction,
  type UpdateData,
} from "firebase-admin/firestore";
import type { PartialWithFieldValue, UnknownObject } from "~/types";

/**
 * Update a document in a collection. You would only use this if you do not
 * already have a handle to a FsMutableDocument, because that has typed `update`
 * and `updateWithPartial` methods.
 */
export async function updateSpecificDocument<T extends UnknownObject>(
  ref: DocumentReference<T>,
  data: UpdateData<T>
) {
  await ref.update(data);
}

export async function updateSpecificDocumentWithPartial<
  T extends UnknownObject,
>(ref: DocumentReference<T>, data: PartialWithFieldValue<T>) {
  await ref.update(data as UpdateData<T>);
}

export function updateSpecificDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: DocumentReference<T>,
  data: UpdateData<T>
) {
  tx.update(ref, data);
}

export function updateSpecificDocumentWithPartialInTransaction<
  T extends UnknownObject,
>(tx: Transaction, ref: DocumentReference<T>, data: PartialWithFieldValue<T>) {
  tx.update(ref, data as UpdateData<T>);
}
