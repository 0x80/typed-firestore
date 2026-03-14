import {
  getDocs,
  limit,
  query,
  type CollectionReference,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { makeMutableDocument } from "./make-mutable-document";

export async function getDocuments<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraint[]
) {
  const _query =
    queryConstraints.length === 0
      ? query(collectionRef, limit(500))
      : query(collectionRef, ...queryConstraints);

  const snapshot = await getDocs(_query);

  return snapshot.docs.map((doc) => makeMutableDocument(doc));
}

export async function getDocumentsData<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraint[]
) {
  const _query =
    queryConstraints.length === 0
      ? query(collectionRef, limit(500))
      : query(collectionRef, ...queryConstraints);

  const snapshot = await getDocs(_query);

  return snapshot.docs.map((doc) => doc.data());
}
