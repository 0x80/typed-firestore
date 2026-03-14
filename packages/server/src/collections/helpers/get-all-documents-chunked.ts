import type {
  DocumentData,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { FsMutableDocument } from "~/types";
import { verboseCount } from "~/utils";
import { DEFAULT_CHUNK_SIZE } from "../constants";
import { getChunkOfDocuments } from "./get-chunk-of-documents";

/**
 * This gets all documents in the query, using pagination. Any limit set on the
 * query is ignored, but this function is only called when limit is not
 * specified.
 */
export async function getDocumentsChunked<
  T extends DocumentData,
  TFull extends DocumentData,
>(
  query: Query,
  chunkSize = DEFAULT_CHUNK_SIZE,
): Promise<FsMutableDocument<T, TFull>[]> {
  const documents: FsMutableDocument<T, TFull>[] = [];
  let startAfterSnapshot: QueryDocumentSnapshot<T> | undefined;

  do {
    verboseCount("Fetching chunk");

    const [chunk, lastSnapshot] = await getChunkOfDocuments<T, TFull>(
      query,
      startAfterSnapshot,
      chunkSize,
    );

    documents.push(...chunk);
    startAfterSnapshot = lastSnapshot;
  } while (startAfterSnapshot);

  return documents;
}
