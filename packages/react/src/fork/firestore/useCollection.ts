import {
  type DocumentData,
  type FirestoreError,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  onSnapshot,
  type Query,
  type QuerySnapshot,
  type SnapshotOptions,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo } from "react";
import {
  useIsFirestoreQueryEqual,
  useIsMounted,
  useLoadingValue,
} from "./helpers";
import type {
  CollectionDataHook,
  CollectionDataOnceHook,
  CollectionHook,
  CollectionOnceHook,
  DataOptions,
  GetOptions,
  InitialValueOptions,
  OnceDataOptions,
  OnceOptions,
  Options,
} from "./types";

export function useCollection_fork<T = DocumentData>(
  query?: Query<T> | null,
  options?: Options,
): CollectionHook<T> {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    QuerySnapshot<T>,
    FirestoreError
  >();
  const ref = useIsFirestoreQueryEqual<Query<T>>(query, reset);

  useEffect(() => {
    if (!ref.current) {
      setValue(undefined);
      return;
    }
    const unsubscribe = options?.snapshotListenOptions
      ? onSnapshot(
          ref.current,
          options.snapshotListenOptions,
          setValue,
          setError,
        )
      : onSnapshot(ref.current, setValue, setError);

    return () => {
      unsubscribe();
    };
  }, [ref.current]);

  return [value!, loading, error];
}

export function useCollectionOnce_fork<T = DocumentData>(
  query?: Query<T> | null,
  options?: OnceOptions,
): CollectionOnceHook<T> {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    QuerySnapshot<T>,
    FirestoreError
  >();
  const isMounted = useIsMounted();
  const ref = useIsFirestoreQueryEqual<Query<T>>(query, reset);

  const loadData = useCallback(
    async (query?: Query<T> | null, options?: Options & OnceOptions) => {
      if (!query) {
        setValue(undefined);
        return;
      }
      const get = getDocsFnFromGetOptions(options?.getOptions);

      try {
        const result = await get(query);
        if (isMounted.current) {
          setValue(result);
        }
      } catch (error) {
        if (isMounted.current) {
          setError(error as FirestoreError);
        }
      }
    },
    [],
  );

  const reloadData = useCallback(
    () => loadData(ref.current, options),
    [loadData, ref.current],
  );

  useEffect(() => {
    loadData(ref.current, options).catch(setError);
  }, [ref.current]);

  return [value!, loading, error, reloadData];
}

export function useCollectionData_fork<T = DocumentData>(
  query?: Query<T> | null,
  options?: DataOptions & InitialValueOptions<T[]>,
): CollectionDataHook<T> {
  const [snapshots, loading, error] = useCollection_fork<T>(query, options);

  const values = getValuesFromSnapshots<T>(
    snapshots,
    options?.snapshotOptions,
    options?.initialValue,
  );

  return [values, loading, error, snapshots];
}

export function useCollectionDataOnce_fork<T = DocumentData>(
  query?: Query<T> | null,
  options?: OnceDataOptions & InitialValueOptions<T[]>,
): CollectionDataOnceHook<T> {
  const [snapshots, loading, error, reloadData] = useCollectionOnce_fork<T>(
    query,
    options,
  );

  const values = getValuesFromSnapshots<T>(
    snapshots,
    options?.snapshotOptions,
    options?.initialValue,
  );

  return [values, loading, error, snapshots, reloadData];
}

const getValuesFromSnapshots = <T>(
  snapshots: QuerySnapshot<T> | undefined,
  options?: SnapshotOptions,
  initialValue?: T[],
): T[] | undefined => {
  return useMemo(
    () => snapshots?.docs.map((doc) => doc.data(options)) ?? initialValue,
    [snapshots, options],
  );
};

const getDocsFnFromGetOptions = (
  { source }: GetOptions = { source: "default" },
) => {
  switch (source) {
    default:
    case "default":
      return getDocs;
    case "cache":
      return getDocsFromCache;
    case "server":
      return getDocsFromServer;
  }
};
