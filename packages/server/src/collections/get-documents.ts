import type {
  CollectionGroup,
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { makeMutableDocument, makeMutableDocumentTx } from "~/documents";
import type { FsMutableDocument, FsMutableDocumentTx } from "~/types";
import { invariant } from "~/utils";
import { MAX_QUERY_LIMIT } from "./constants";
import {
  buildQuery,
  getDocumentsChunked,
  getDocumentsChunkedWithLimit,
} from "./helpers";
import type { QueryBuilder, SelectedDocument } from "./types";

export type GetDocumentsOptions<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
> = {
  select?: S;
  chunkSize?: number;
};

export async function getDocuments<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  options: GetDocumentsOptions<T, S> = {},
): Promise<FsMutableDocument<SelectedDocument<T, S>, T>[]> {
  const { query, disableChunking, limit } = buildQuery(
    ref,
    queryFn,
    options.select,
  );

  if (disableChunking) {
    /** For limits <= MAX_QUERY_LIMIT, use a single query (existing behavior) */
    invariant(
      limit && limit <= MAX_QUERY_LIMIT,
      `Limit ${String(limit)} is greater than the maximum query limit of ${String(MAX_QUERY_LIMIT)}`,
    );

    const snapshot = await query.get();

    return snapshot.docs.map((doc) =>
      makeMutableDocument<SelectedDocument<T, S>, T>(
        doc as QueryDocumentSnapshot<SelectedDocument<T, S>>,
      ),
    );
  } else if (limit && limit > MAX_QUERY_LIMIT) {
    /** For limits > MAX_QUERY_LIMIT, use chunking with the specified limit */
    return getDocumentsChunkedWithLimit<SelectedDocument<T, S>, T>(
      query,
      limit,
      options.chunkSize,
    );
  } else {
    /** No limit specified, get all documents using chunking */
    return getDocumentsChunked<SelectedDocument<T, S>, T>(
      query,
      options.chunkSize,
    );
  }
}

export async function getDocumentsData<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  options: GetDocumentsOptions<T, S> = {},
): Promise<T[]> {
  const documents = await getDocuments(ref, queryFn, options);
  return documents.map((doc) => doc.data);
}

/**
 * Because transactions are limited to 500 operations, we do not use pagination
 * here. You should limit the query if you expect the document count to be close
 * to the maximum.
 */
export async function getDocumentsTx<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  tx: Transaction,
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  options: GetDocumentsOptions<T, S> = {},
): Promise<FsMutableDocumentTx<SelectedDocument<T, S>, T>[]> {
  const { query } = buildQuery(ref, queryFn, options.select);

  const snapshot = await tx.get(query);

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) =>
    makeMutableDocumentTx<SelectedDocument<T, S>, T>(
      tx,
      doc as QueryDocumentSnapshot<SelectedDocument<T, S>>,
    ),
  );
}

export async function getDocumentsDataTx<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  tx: Transaction,
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  options: GetDocumentsOptions<T, S> = {},
): Promise<T[]> {
  const documents = await getDocumentsTx(tx, ref, queryFn, options);
  return documents.map((doc) => doc.data);
}
