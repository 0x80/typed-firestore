import type {
  DocumentReference,
  Transaction,
  UpdateData,
  WriteResult,
} from "firebase-admin/firestore";

export type UnknownObject = Record<string, unknown>;

/**
 * A simple serialize-able document type. Use this when defining functions that
 * take a document but do not need to mutate it.
 */
export type FsDocument<T> = Readonly<{
  id: string;
  data: T;
}>;

export type FsMutableDocument<TReturned, TFull> = Readonly<{
  ref: DocumentReference;
  update: (data: UpdateData<TFull>) => Promise<WriteResult>;
  /**
   * The Firestore `UpdateData` type which allows the use of FieldValue
   * sometimes does not accept perfectly valid data. This is an alternative
   * without FieldValue.
   */
  updatePartial: (data: Partial<TFull>) => Promise<WriteResult>;
}> &
  FsDocument<TReturned>;

export type FsMutableDocumentFromTransaction<TReturned, TFull> = Readonly<{
  ref: DocumentReference;
  update: (data: UpdateData<TFull>) => Transaction;
  /**
   * The Firestore `UpdateData` type which allows the use of FieldValue
   * sometimes does not accept perfectly valid data. This is an alternative
   * without FieldValue.
   */
  updatePartial: (data: Partial<TFull>) => Transaction;
}> &
  FsDocument<TReturned>;
