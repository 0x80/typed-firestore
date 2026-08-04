/**
 * The modular typings that ship with @react-native-firebase/firestore v22+
 * declare two-generic signatures (AppModelType, DbModelType) against the
 * single-generic FirebaseFirestoreTypes interfaces, which makes generic
 * inference collapse to unknown/DocumentData. Wrap the affected functions so
 * the generics stay pinned to the input reference.
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
