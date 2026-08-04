import type {
  DocumentData,
  DocumentSnapshot,
  PartialWithFieldValue,
  Transaction,
  UpdateData,
  WriteResult,
} from "firebase-admin/firestore";
import type { FsMutableDocument, FsMutableDocumentTx } from "~/types";
import { invariant } from "~/utils";
import {
  type DocumentPrecondition,
  resolvePrecondition,
  runWithPrecondition,
} from "./precondition";

export function makeMutableDocument<
  TNarrowOrFull extends DocumentData,
  TFull extends DocumentData = TNarrowOrFull,
>(
  doc: DocumentSnapshot<TNarrowOrFull>,
): FsMutableDocument<TNarrowOrFull, TFull> {
  const data = doc.data();

  /**
   * These are only absent on a snapshot for a document that does not exist, and
   * a mutable document is never built from one of those.
   */
  invariant(
    doc.updateTime && doc.createTime,
    `Document ${doc.ref.path} has no updateTime or createTime`,
  );

  const readVersion = doc.updateTime;

  return {
    id: doc.id,
    data: data as TNarrowOrFull,
    ref: doc.ref,
    updateTime: doc.updateTime,
    createTime: doc.createTime,

    async update(
      updateData: UpdateData<TFull>,
      precondition?: DocumentPrecondition,
    ): Promise<WriteResult | undefined> {
      return await runWithPrecondition(
        async () =>
          precondition
            ? await doc.ref.update(
                updateData,
                resolvePrecondition(precondition, readVersion),
              )
            : await doc.ref.update(updateData),
        precondition !== undefined,
      );
    },

    async updateWithPartial(
      partialData: PartialWithFieldValue<TFull>,
      precondition?: DocumentPrecondition,
    ): Promise<WriteResult | undefined> {
      return await runWithPrecondition(
        async () =>
          precondition
            ? await doc.ref.update(
                partialData as UpdateData<TFull>,
                resolvePrecondition(precondition, readVersion),
              )
            : await doc.ref.update(partialData as UpdateData<TFull>),
        precondition !== undefined,
      );
    },

    async delete(
      precondition?: DocumentPrecondition,
    ): Promise<WriteResult | undefined> {
      return await runWithPrecondition(
        async () =>
          precondition
            ? await doc.ref.delete(
                resolvePrecondition(precondition, readVersion),
              )
            : await doc.ref.delete(),
        precondition !== undefined,
      );
    },
  } as FsMutableDocument<TNarrowOrFull, TFull>;
}

export function makeMutableDocumentTx<
  TNarrowOrFull extends DocumentData,
  TFull extends DocumentData = TNarrowOrFull,
>(
  tx: Transaction,
  doc: DocumentSnapshot<TNarrowOrFull>,
): FsMutableDocumentTx<TNarrowOrFull, TFull> {
  const data = doc.data();
  return {
    id: doc.id,
    data: data as TNarrowOrFull,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => tx.update(doc.ref, data),
    updateWithPartial: (data: PartialWithFieldValue<TFull>) =>
      tx.update(doc.ref, data as UpdateData<TFull>),
    delete: () => tx.delete(doc.ref),
  };
}
