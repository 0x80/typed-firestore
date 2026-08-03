import type { DocumentRef } from "./refs/document-ref";
import type { Timestamp } from "./values/timestamp";

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
  updateTime: Timestamp;
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

export type FsMutableDocument<T> = Readonly<{
  id: string;
  data: T;
  ref: DocumentRef<T>;
  createTime: Timestamp;
  /** The version this document was read at. Drives `{ ifUnchanged: true }`. */
  updateTime: Timestamp;

  /**
   * Without a precondition the write always applies. With one it resolves to
   * `undefined` when the condition was not met, because losing a race is an
   * expected outcome in a compare-and-swap loop rather than an error.
   */
  update(data: UpdateData<T>): Promise<WriteResult>;
  update(
    data: UpdateData<T>,
    precondition: DocumentPrecondition,
  ): Promise<WriteResult | undefined>;

  delete(): Promise<WriteResult>;
  delete(precondition: DocumentPrecondition): Promise<WriteResult | undefined>;
}>;
