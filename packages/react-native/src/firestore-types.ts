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
 * Before v22, the @react-native-firebase/firestore query constraint functions
 * where, orderBy, limit, etc. were incorrectly typed and missing the `_apply`
 * method. Exclude `_apply` so constraints from both pre- and post-v22
 * typings are accepted.
 */
export type QueryConstraints = (Omit<QueryConstraint, "_apply"> | undefined)[];
