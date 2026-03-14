import { useCallback, useEffect } from "react";
import {
  useLoadingValue,
  useIsFirestoreQueryEqual,
  useIsMounted,
} from "./fork/helpers";
import {
  type FirestoreError,
  getCountFromServer,
  query as firestoreQuery,
} from "@react-native-firebase/firestore";
import type {
  QueryConstraints,
  DocumentData,
  CollectionReference,
  Query,
} from "./firestore-types";
import { getErrorMessage, isDefined } from "./utils";

function useCollectionCount<T extends DocumentData>(
  collectionQuery?: Query<T>,
): [number | undefined, boolean, FirestoreError | undefined, () => void] {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    number | undefined,
    FirestoreError
  >();
  const isMounted = useIsMounted();
  const ref = useIsFirestoreQueryEqual<Query<T>>(collectionQuery, reset);

  const loadData = useCallback(async (q?: Query<T> | null) => {
    if (!q) {
      setValue(undefined);
      return;
    }

    try {
      const result = await getCountFromServer(q);
      if (isMounted.current) {
        setValue(result.data().count);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as FirestoreError);
      }
    }
  }, []);

  const reloadData = useCallback(
    () => loadData(ref.current),
    [loadData, ref.current],
  );

  useEffect(() => {
    loadData(ref.current).catch(setError);
  }, [ref.current]);

  return [value, loading, error, reloadData];
}

export function useCollectionCountOnce<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: QueryConstraints
): [number, false] | [undefined, true] {
  const [value, , error] = useCollectionCount(
    firestoreQuery(collectionRef, ...queryConstraints.filter(isDefined)),
  );

  if (error) {
    throw new Error(
      `Failed to execute query on ${collectionRef.path}: ${getErrorMessage(error)}`,
    );
  }

  return value !== undefined ? [value, false] : [undefined, true];
}
