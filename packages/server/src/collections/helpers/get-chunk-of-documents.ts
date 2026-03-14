import type {
  DocumentData,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument } from "~/types";

/**
 * Returns [documents, lastSnapshot], so that the last document snapshot can be
 * passed in as the "startAfter" argument in the next cycle.
 */
export async function getChunkOfDocuments<
  T extends DocumentData,
  TFull extends DocumentData,
>(
  query: Query,
  startAfterSnapshot: QueryDocumentSnapshot<T> | undefined,
  batchSize: number,
): Promise<
  [FsMutableDocument<T, TFull>[], QueryDocumentSnapshot<T> | undefined]
> {
  const limitedQuery = query.limit(batchSize);

  const pagedQuery = startAfterSnapshot
    ? limitedQuery.startAfter(startAfterSnapshot)
    : limitedQuery;

  const snapshot = await pagedQuery.get();

  if (snapshot.empty) {
    return [[], undefined];
  }

  const documents = snapshot.docs.map((doc) =>
    makeMutableDocument<T, TFull>(doc as DocumentSnapshot<T>),
  );

  /**
   * Return undefined if this batch was smaller than the requested size, meaning
   * we've reached the end
   */
  const lastSnapshot =
    documents.length < batchSize ? undefined : snapshot.docs.at(-1);

  return [documents, lastSnapshot as QueryDocumentSnapshot<T> | undefined];
}
