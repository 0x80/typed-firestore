import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { FsMutableDocument, UnknownObject } from "~/types";
import { DEFAULT_BATCH_SIZE } from "../constants";
import { getSomeDocuments } from "./get-some-documents";

export async function getDocumentsBatch<
  T extends UnknownObject,
  TFull extends UnknownObject,
>(
  query: Query,
  options: { limitToFirstBatch?: boolean } = {}
): Promise<FsMutableDocument<T, TFull>[]> {
  const documents: FsMutableDocument<T, TFull>[] = [];
  let lastDocumentSnapshot: QueryDocumentSnapshot<T> | undefined;

  do {
    const [chunk, _lastDocumentSnapshot] = await getSomeDocuments<T, TFull>(
      query,
      lastDocumentSnapshot,
      DEFAULT_BATCH_SIZE,
      options.limitToFirstBatch
    );

    documents.push(...chunk);
    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (lastDocumentSnapshot);

  return documents;
}
