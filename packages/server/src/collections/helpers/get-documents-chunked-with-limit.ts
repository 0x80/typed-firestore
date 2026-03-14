import type {
  DocumentData,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { FsMutableDocument } from "~/types";
import { verboseCount } from "~/utils";
import { DEFAULT_CHUNK_SIZE, MAX_QUERY_LIMIT } from "../constants";
import { getChunkOfDocuments } from "./get-chunk-of-documents";

/**
 * Gets documents from a query with a specified limit, using pagination when the
 * limit exceeds Firestore's maximum query limit of 1000.
 */
export async function getDocumentsChunkedWithLimit<
  T extends DocumentData,
  TFull extends DocumentData,
>(
  query: Query,
  totalLimit: number,
  chunkSize = DEFAULT_CHUNK_SIZE,
): Promise<FsMutableDocument<T, TFull>[]> {
  const documents: FsMutableDocument<T, TFull>[] = [];
  let startAfterSnapshot: QueryDocumentSnapshot<T> | undefined;
  let remainingLimit = totalLimit;

  do {
    verboseCount("Fetching chunk");

    const currentChunkSize = Math.min(
      remainingLimit,
      Math.min(MAX_QUERY_LIMIT, chunkSize),
    );

    const [chunk, lastSnapshot] = await getChunkOfDocuments<T, TFull>(
      query,
      startAfterSnapshot,
      currentChunkSize,
    );

    documents.push(...chunk);
    remainingLimit -= chunk.length;
    startAfterSnapshot = lastSnapshot;

    /** Stop if we've reached the limit or there are no more documents */
    if (remainingLimit <= 0 || !lastSnapshot) {
      break;
    }
  } while (startAfterSnapshot);

  /** Ensure we don't return more than the requested limit */
  return documents.slice(0, totalLimit);
}
