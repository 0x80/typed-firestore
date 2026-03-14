import {
  getDoc,
  getDocFromCache,
  getDocFromServer,
  onSnapshot,
} from "@react-native-firebase/firestore";
import { useCallback, useEffect, useMemo } from "react";
import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
} from "~/firestore-types";
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
  OnceDataOptions,
  OnceOptions,
  Options,
} from "./types";

export const useDocument_fork = <T extends DocumentData>(
  docRef?: DocumentReference<T>,
  options?: Options,
): DocumentHook<T> => {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    DocumentSnapshot<T>,
    Error
  >();
  const ref = useIsFirestoreRefEqual(docRef, reset);

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
          (err: Error) => {
            if (err instanceof Error) {
              setError(err);
            }
          },
        )
      : onSnapshot(ref.current, setValue, (err: Error) => {
          if (err instanceof Error) {
            setError(err);
          }
        });

    return () => {
      unsubscribe();
    };
  }, [ref.current]);

  return [value!, loading, error];
};

export function useDocumentOnce_fork<T extends DocumentData>(
  docRef?: DocumentReference<T>,
  options?: OnceOptions,
): DocumentOnceHook<T> {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    DocumentSnapshot<T>,
    Error
  >();
  const isMounted = useIsMounted();
  const ref = useIsFirestoreRefEqual(docRef, reset);

  const loadData = useCallback(
    async (reference?: DocumentReference<T> | null, opts?: OnceOptions) => {
      if (!reference) {
        setValue(undefined);
        return;
      }
      const get = getDocFnFromGetOptions(opts?.getOptions);

      try {
        const result = await get(reference);
        if (isMounted.current) {
          setValue(result);
        }
      } catch (err: unknown) {
        if (isMounted.current) {
          if (err instanceof Error) {
            setError(err);
          }
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

    loadData(ref.current, options).catch((err: unknown) => {
      if (err instanceof Error) {
        setError(err);
      }
    });
  }, [ref.current]);

  return [value!, loading, error, reloadData];
}

export function useDocumentData_fork<T extends DocumentData>(
  docRef?: DocumentReference<T>,
  options?: DataOptions,
): DocumentDataHook<T> {
  const [snapshot, loading, error] = useDocument_fork<T>(docRef, options);

  const value = getValueFromSnapshot(snapshot);

  return [value, loading, error];
}

export function useDocumentDataOnce_fork<T extends DocumentData>(
  docRef?: DocumentReference<T>,
  options?: OnceDataOptions,
): DocumentDataOnceHook<T> {
  const [snapshot, loading, error, reloadData] = useDocumentOnce_fork<T>(
    docRef,
    options,
  );

  const value = getValueFromSnapshot<T>(snapshot);

  return [value, loading, error, reloadData];
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

const getValueFromSnapshot = <T extends DocumentData>(
  snapshot: DocumentSnapshot<T> | undefined,
  initialValue?: T,
): T | undefined => {
  return useMemo(
    () => (snapshot?.exists ? snapshot.data() : initialValue),
    [snapshot, initialValue],
  );
};
