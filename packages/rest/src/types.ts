import type { DocumentRef } from "~/refs/document-ref";
import type { Timestamp } from "~/values/timestamp";

/**
 * A plain, serializable document. Use this when a function reads a document but
 * does not need to mutate it.
 */
export type FsDocument<T> = Readonly<{
  id: string;
  data: T;
}>;

/**
 * The fields to change in an update. Only root-level properties are addressable
 * in this version, and a property holding an object replaces that object
 * wholesale rather than merging into it.
 */
export type UpdateData<T> = Partial<T>;

export type WriteResult = {
  /**
   * The write time as set by the Firestore servers, named to match the
   * `WriteResult` of firebase-admin so the two packages stay interchangeable.
   *
   * Absent on a delete, whose response body is empty. It is never synthesized
   * from the local clock, which is why it is optional here where the SDK's is
   * not.
   */
  writeTime: Timestamp | undefined;
};

/**
 * A condition the server enforces before applying a write. Firestore evaluates
 * it atomically, so it is a true compare-and-swap rather than a read followed by
 * a write.
 */
export type Precondition = { lastUpdateTime: Timestamp } | { exists: boolean };

/**
 * The precondition set available on a document that has already been read. The
 * extra `ifUnchanged` form compares against the version this document was read
 * at, which is the common case and saves threading the timestamp by hand.
 */
export type DocumentPrecondition = Precondition | { ifUnchanged: true };

export type FsMutableDocument<TNarrowOrFull, TFull = TNarrowOrFull> = Readonly<{
  id: string;
  /** Narrowed to the selected fields when the query used `select`. */
  data: TNarrowOrFull;
  ref: DocumentRef<TFull>;
  createTime: Timestamp;
  /** The version this document was read at. Drives `{ ifUnchanged: true }`. */
  updateTime: Timestamp;

  /**
   * Without a precondition the write carries no caller-supplied concurrency
   * condition, though it can still fail for ordinary reasons such as the
   * document not existing. With one it resolves to `undefined` when the
   * condition was not met, because losing a race is an expected outcome in a
   * compare-and-swap loop rather than an error.
   */
  update(data: UpdateData<TFull>): Promise<WriteResult>;
  update(
    data: UpdateData<TFull>,
    precondition: DocumentPrecondition,
  ): Promise<WriteResult | undefined>;

  delete(): Promise<WriteResult>;
  delete(precondition: DocumentPrecondition): Promise<WriteResult | undefined>;
}>;
