import { limit, query } from "@react-native-firebase/firestore";
import { useMemo } from "react";
import type {
  CollectionReference,
  DocumentData,
  QueryConstraints,
} from "./firestore-types";
import { useCollection_fork, useCollectionOnce_fork } from "./fork";
import { makeMutableDocument } from "./make-mutable-document";
import type { FsMutableDocument } from "./types";
import { getErrorMessage, isDefined } from "./utils";

export function useCollection<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraints
): [FsMutableDocument<T>[], false] | [undefined, true] {
  const hasNoConstraints = queryConstraints.length === 0;

  const _query = hasNoConstraints
    ? query(collectionRef, limit(500))
    : query(collectionRef, ...queryConstraints.filter(isDefined));

  /**
   * We do not need the loading state really. If there is no data, and there is
   * no error, it means data is still loading.
   */
  const [snapshot, , error] = useCollection_fork(_query);

  if (error) {
    throw new Error(
      `Failed to execute query on ${collectionRef.path}: ${getErrorMessage(error)}`,
    );
  }

  const docs = useMemo(() => {
    if (!snapshot) {
      return undefined;
    }
    return snapshot.docs.map((doc) => makeMutableDocument(doc));
  }, [snapshot]);

  return docs ? [docs, false] : [undefined, true];
}

export function useCollectionOnce<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraints
): [FsMutableDocument<T>[], false] | [undefined, true] {
  const hasNoConstraints = queryConstraints.length === 0;

  const _query = hasNoConstraints
    ? query(collectionRef, limit(500))
    : query(collectionRef, ...queryConstraints.filter(isDefined));

  /**
   * We do not need the loading state really. If there is no data, and there is
   * no error, it means data is still loading.
   */
  const [snapshot, , error] = useCollectionOnce_fork(_query);

  if (error) {
    throw new Error(
      `Failed to execute query on ${collectionRef.path}: ${getErrorMessage(error)}`,
    );
  }

  const docs = useMemo(() => {
    if (!snapshot) {
      return undefined;
    }
    return snapshot.docs.map((doc) => makeMutableDocument(doc));
  }, [snapshot]);

  return docs ? [docs, false] : [undefined, true];
}

export function useCollectionMaybe<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraints
): [FsMutableDocument<T>[] | undefined, boolean] {
  const hasNoConstraints = queryConstraints.length === 0;

  const _query = hasNoConstraints
    ? query(collectionRef, limit(500))
    : query(collectionRef, ...queryConstraints.filter(isDefined));

  const [snapshot, isLoading, error] = useCollection_fork(_query);

  if (error) {
    throw new Error(
      `Failed to execute query on ${collectionRef.path}: ${getErrorMessage(error)}`,
    );
  }

  const docs = useMemo(() => {
    if (!snapshot) {
      return undefined;
    }
    return snapshot.docs.map((doc) => makeMutableDocument(doc));
  }, [snapshot]);

  return [docs, isLoading];
}
