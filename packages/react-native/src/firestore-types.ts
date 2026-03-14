/**
 * The official @react-native-firebase types are awkward. Re-export the ones
 * that have a forced namespace so they align better with other SDKs.
 */
import type {
  FirebaseFirestoreTypes,
  QueryConstraint,
} from "@react-native-firebase/firestore";

export type DocumentData = FirebaseFirestoreTypes.DocumentData;

export type DocumentReference<
  T extends FirebaseFirestoreTypes.DocumentData = DocumentData,
> = FirebaseFirestoreTypes.DocumentReference<T>;

export type CollectionReference<
  T extends FirebaseFirestoreTypes.DocumentData = DocumentData,
> = FirebaseFirestoreTypes.CollectionReference<T>;

export type DocumentSnapshot<T extends DocumentData> =
  FirebaseFirestoreTypes.DocumentSnapshot<T>;

export type Transaction = FirebaseFirestoreTypes.Transaction;

export type Query<T extends DocumentData = DocumentData> =
  FirebaseFirestoreTypes.Query<T>;

export type QuerySnapshot<T extends DocumentData = DocumentData> =
  FirebaseFirestoreTypes.QuerySnapshot<T>;

export type SnapshotListenOptions =
  FirebaseFirestoreTypes.SnapshotListenOptions;

/**
 * The @react-native-firebase/firestore query constraint functions where,
 * orderBy, limit, etc. are incorrectly typed and are missing the `_apply`
 * method.
 *
 * Exclude the `_apply` method to make the type checker happy.
 */
export type QueryConstraints = (Omit<QueryConstraint, "_apply"> | undefined)[];
