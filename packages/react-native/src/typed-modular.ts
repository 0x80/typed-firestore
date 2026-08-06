/**
 * Wrappers that pin the generics of the modular doc, getDocs and query
 * functions to the input reference.
 *
 * These exist because the v22 modular typings declared two-generic signatures
 * (AppModelType, DbModelType) against the single-generic
 * FirebaseFirestoreTypes interfaces, which collapsed inference to
 * unknown/DocumentData. v26 removed that namespace and its modular types are
 * consistently two-generic, so inference no longer collapses and these
 * wrappers are likely redundant. Removing them is a separate change.
 */
import {
  doc as doc_untyped,
  getDocs as getDocs_untyped,
  query as query_untyped,
  type QueryConstraint,
} from "@react-native-firebase/firestore";
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Query,
  QueryConstraints,
  QuerySnapshot,
} from "./firestore-types";
import { isDefined } from "./utils";

export function doc<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  documentId: string,
): DocumentReference<T> {
  return doc_untyped(collectionRef, documentId) as DocumentReference<T>;
}

export function getDocs<T extends DocumentData>(
  baseQuery: Query<T>,
): Promise<QuerySnapshot<T>> {
  return getDocs_untyped(baseQuery) as Promise<QuerySnapshot<T>>;
}

export function query<T extends DocumentData>(
  baseQuery: CollectionReference<T> | Query<T>,
  ...queryConstraints: QueryConstraints
): Query<T> {
  return query_untyped(
    baseQuery,
    ...(queryConstraints.filter(isDefined) as QueryConstraint[]),
  ) as Query<T>;
}
