import type {
  CollectionGroup,
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { makeMutableDocument, makeMutableDocumentTx } from "~/documents";
import type { FsMutableDocument, FsMutableDocumentTx } from "~/types";
import { invariant, isDefined } from "~/utils";
import { type GetDocumentsOptions } from "./get-documents";
import { getQueryInfo } from "./helpers";
import type { QueryBuilder, SelectedDocument } from "./types";

export async function getFirstDocument<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder,
  options: GetDocumentsOptions<T, S> = {},
): Promise<FsMutableDocument<SelectedDocument<T, S>, T> | undefined> {
  const queryInfo = getQueryInfo(queryFn(ref));
  const { limit, select: querySelect } = queryInfo;

  invariant(
    !isDefined(limit),
    `You should not set a limit when calling getFirstDocument. It returns only one document.`,
  );

  invariant(
    !querySelect,
    "Select is not allowed to be set on the query. Use the options instead.",
  );

  const query = options.select
    ? queryFn(ref).select(...(options.select as string[]))
    : queryFn(ref);

  const snapshot = await query.limit(1).get();

  if (snapshot.empty) {
    return;
  }

  return makeMutableDocument<SelectedDocument<T, S>, T>(
    snapshot.docs[0] as QueryDocumentSnapshot<SelectedDocument<T, S>>,
  );
}

export async function getFirstDocumentData<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder,
  options: GetDocumentsOptions<T, S> = {},
): Promise<T | undefined> {
  const document = await getFirstDocument(ref, queryFn, options);
  return document?.data;
}

export async function getFirstDocumentTx<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  tx: Transaction,
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder,
  options: GetDocumentsOptions<T, S> = {},
): Promise<FsMutableDocumentTx<SelectedDocument<T, S>, T> | undefined> {
  const queryInfo = getQueryInfo(queryFn(ref));
  const { limit, select: querySelect } = queryInfo;

  invariant(
    !isDefined(limit),
    `You should not set a limit when calling getFirstDocument. It returns only one document.`,
  );

  invariant(
    !querySelect,
    "Select is not allowed to be set on the query. Use the options instead.",
  );

  const query = options.select
    ? queryFn(ref).select(...(options.select as string[]))
    : queryFn(ref);

  const snapshot = await tx.get(query.limit(1));

  if (snapshot.empty) {
    return;
  }

  return makeMutableDocumentTx<SelectedDocument<T, S>, T>(
    tx,
    snapshot.docs[0] as QueryDocumentSnapshot<SelectedDocument<T, S>>,
  );
}

export async function getFirstDocumentDataTx<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  tx: Transaction,
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder,
  options: GetDocumentsOptions<T, S> = {},
): Promise<T | undefined> {
  const document = await getFirstDocumentTx(tx, ref, queryFn, options);
  return document?.data;
}
