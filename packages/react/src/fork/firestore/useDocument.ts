import {
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  onSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo } from "react";
import {
  useIsFirestoreRefEqual,
  useIsMounted,
  useLoadingValue,
} from "./helpers";
import type {
  DataOptions,
  DocumentDataHook,
  DocumentDataOnceHook,
  DocumentHook,
  DocumentOnceHook,
  GetOptions,
  InitialValueOptions,
  OnceDataOptions,
  OnceOptions,
  Options,
} from "./types";

export const useDocument_fork = <T = DocumentData>(
  docRef?: DocumentReference<T> | null,
  options?: Options,
): DocumentHook<T> => {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    DocumentSnapshot<T>,
    FirestoreError
  >();
  const ref = useIsFirestoreRefEqual<DocumentReference<T>>(docRef, reset);

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
};

export function useDocumentOnce_fork<T = DocumentData>(
  docRef?: DocumentReference<T> | null,
  options?: OnceOptions,
): DocumentOnceHook<T> {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    DocumentSnapshot<T>,
    FirestoreError
  >();
  const isMounted = useIsMounted();
  const ref = useIsFirestoreRefEqual<DocumentReference<T>>(docRef, reset);

  const loadData = useCallback(
    async (reference?: DocumentReference<T> | null, options?: OnceOptions) => {
      if (!reference) {
        setValue(undefined);
        return;
      }
      const get = getDocFnFromGetOptions(options?.getOptions);

      try {
        const result = await get(reference);
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
    if (!ref.current) {
      setValue(undefined);
      return;
    }

    loadData(ref.current, options).catch(setError);
  }, [ref.current]);

  return [value!, loading, error, reloadData];
}

export function useDocumentData_fork<T = DocumentData>(
  docRef?: DocumentReference<T> | null,
  options?: DataOptions & InitialValueOptions<T>,
): DocumentDataHook<T> {
  const [snapshot, loading, error] = useDocument_fork<T>(docRef, options);

  const value = getValueFromSnapshot(
    snapshot,
    options?.snapshotOptions,
    options?.initialValue,
  );

  return [value, loading, error, snapshot];
}

export function useDocumentDataOnce_fork<T = DocumentData>(
  docRef?: DocumentReference<T> | null,
  options?: OnceDataOptions & InitialValueOptions<T>,
): DocumentDataOnceHook<T> {
  const [snapshot, loading, error, reloadData] = useDocumentOnce_fork<T>(
    docRef,
    options,
  );

  const value = getValueFromSnapshot(
    snapshot,
    options?.snapshotOptions,
    options?.initialValue,
  );

  return [value, loading, error, snapshot, reloadData];
}

const getDocFnFromGetOptions = (
  { source }: GetOptions = { source: "default" },
) => {
  switch (source) {
    default:
    case "default":
      return getDoc;
    case "cache":
      return getDocFromCache;
    case "server":
      return getDocFromServer;
  }
};

const getValueFromSnapshot = <T>(
  snapshot: DocumentSnapshot<T> | undefined,
  options?: SnapshotOptions,
  initialValue?: T,
): T | undefined => {
  return useMemo(
    () => snapshot?.data(options) ?? initialValue,
    [snapshot, options, initialValue],
  );
};
