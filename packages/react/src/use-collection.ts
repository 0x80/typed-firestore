import {
  type CollectionReference,
  type DocumentData,
  type QueryConstraint,
  limit,
  query,
} from "firebase/firestore";
import { useMemo } from "react";
import { useCollection_fork, useCollectionOnce_fork } from "./fork/firestore";
import { makeMutableDocument } from "./make-mutable-document";
import type { FsMutableDocument } from "./types";
import { isDefined } from "./utils";

export function useCollection<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: (QueryConstraint | undefined)[]
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
      `Failed to execute query on ${collectionRef.path}. Error code: ${error.code}`,
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
  ...queryConstraints: (QueryConstraint | undefined)[]
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
      `Failed to execute query on ${collectionRef.path}. Error code: ${error.code}`,
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
