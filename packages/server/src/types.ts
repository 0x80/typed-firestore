import type {
  DocumentReference,
  FieldValue,
  PartialWithFieldValue,
  Transaction,
  UpdateData,
  WriteResult,
} from "firebase-admin/firestore";

/**
 * A type that enforces FieldValue for specified properties while preserving the
 * original types for other properties. This is useful when you want to set
 * FieldValues, but also pass the data on to other functions that want to use
 * the other properties in their original type.
 */
export type WithFieldValueProperties<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? FieldValue : T[P];
};

/**
 * A simple serialize-able document type. Use this when defining functions that
 * take a document but do not need to mutate it.
 */
export type FsDocument<T> = Readonly<{
  id: string;
  data: T;
}>;

export type FsMutableDocument<TNarrowOrFull, TFull = TNarrowOrFull> = Readonly<{
  ref: DocumentReference;
  update: (data: UpdateData<TFull>) => Promise<WriteResult>;
  /**
   * The Firestore UpdateData<T> type can reject nested data that is perfectly
   * valid. In those cases you have this as an alternative based on Partial<T>
   * with FieldValue allowed for each root property.
   */
  updateWithPartial: (
    data: PartialWithFieldValue<TFull>,
  ) => Promise<WriteResult>;
  delete: () => Promise<WriteResult>;
}> &
  FsDocument<TNarrowOrFull>;

export type FsMutableDocumentTx<
  TNarrowOrFull,
  TFull = TNarrowOrFull,
> = Readonly<{
  ref: DocumentReference;
  update: (data: UpdateData<TFull>) => Transaction;
  /**
   * The Firestore UpdateData<T> type can reject nested data that is perfectly
   * valid. In those cases you have this as an alternative based on Partial<T>
   * with FieldValue allowed for each root property.
   */
  updateWithPartial: (data: PartialWithFieldValue<TFull>) => Transaction;
  delete: () => Transaction;
}> &
  FsDocument<TNarrowOrFull>;

/** @deprecated Use FsMutableDocumentTx */
export type FsMutableDocumentInTransaction<
  TNarrowOrFull,
  TFull = TNarrowOrFull,
> = FsMutableDocumentTx<TNarrowOrFull, TFull>;
