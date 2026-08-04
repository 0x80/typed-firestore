import { getCountFromServer } from "@react-native-firebase/firestore";
import type {
  CollectionReference,
  DocumentData,
  QueryConstraints,
} from "./firestore-types";
import { query } from "./typed-modular";

export async function getCollectionCount<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraints
) {
  const snapshot = await getCountFromServer(
    query(collectionRef, ...queryConstraints),
  );
  return snapshot.data().count;
}
