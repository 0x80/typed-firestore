/**
 * Re-export the @react-native-firebase types under the names the other SDKs
 * use. Up to v25 these lived behind a forced FirebaseFirestoreTypes namespace.
 * v26 removed that namespace and exports them flat from the package root, so
 * the aliases below mostly exist now to supply the default type arguments.
 */
import type {
  CollectionReference as CollectionReferenceRaw,
  DocumentData as DocumentDataRaw,
  DocumentReference as DocumentReferenceRaw,
  DocumentSnapshot as DocumentSnapshotRaw,
  Query as QueryRaw,
  QueryConstraint,
  QuerySnapshot as QuerySnapshotRaw,
} from "@react-native-firebase/firestore";

export type {
  SnapshotListenOptions,
  Transaction,
} from "@react-native-firebase/firestore";

export type DocumentData = DocumentDataRaw;

export type DocumentReference<T extends DocumentData = DocumentData> =
  DocumentReferenceRaw<T>;

export type CollectionReference<T extends DocumentData = DocumentData> =
  CollectionReferenceRaw<T>;

export type DocumentSnapshot<T extends DocumentData = DocumentData> =
  DocumentSnapshotRaw<T>;

export type Query<T extends DocumentData = DocumentData> = QueryRaw<T>;

export type QuerySnapshot<T extends DocumentData = DocumentData> =
  QuerySnapshotRaw<T>;

export type QueryConstraints = (QueryConstraint | undefined)[];
