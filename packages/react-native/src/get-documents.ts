import { getDocs, limit, query } from "@react-native-firebase/firestore";
import type {
  CollectionReference,
  DocumentData,
  QueryConstraints,
} from "./firestore-types";
import { makeMutableDocument } from "./make-mutable-document";
import { isDefined } from "./utils";

export async function getDocuments<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraints
) {
  const _query =
    queryConstraints.length === 0
      ? query(collectionRef, limit(500))
      : query(collectionRef, ...queryConstraints.filter(isDefined));

  const snapshot = await getDocs(_query);

  return snapshot.docs.map((doc) => makeMutableDocument(doc));
}

export async function getDocumentsData<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraints
) {
  const _query =
    queryConstraints.length === 0
      ? query(collectionRef, limit(500))
      : query(collectionRef, ...queryConstraints.filter(isDefined));

  const snapshot = await getDocs(_query);

  return snapshot.docs.map((doc) => doc.data());
}
