import type {
  DocumentData,
  DocumentSnapshot,
  FirestoreError,
  QuerySnapshot,
  SnapshotListenOptions,
  SnapshotOptions,
} from "firebase/firestore";

export type IDOptions = {
  snapshotOptions?: SnapshotOptions;
};
export type Options = {
  snapshotListenOptions?: SnapshotListenOptions;
};
export type InitialValueOptions<T> = {
  initialValue?: T;
};
export type DataOptions = Options & IDOptions;
export type OnceOptions = {
  getOptions?: GetOptions;
};
export type GetOptions = {
  source?: "default" | "server" | "cache";
};
export type OnceDataOptions = OnceOptions & IDOptions;

type LoadingHook<T, E> = [T | undefined, boolean, E | undefined];

export type CollectionHook<T = DocumentData> = LoadingHook<
  QuerySnapshot<T>,
  FirestoreError
>;
export type CollectionOnceHook<T = DocumentData> = [
  ...CollectionHook<T>,
  () => Promise<void>,
];
export type CollectionDataHook<T = DocumentData> = [
  ...LoadingHook<T[], FirestoreError>,
  QuerySnapshot<T> | undefined,
];
export type CollectionDataOnceHook<T = DocumentData> = [
  ...CollectionDataHook<T>,
  () => Promise<void>,
];

export type DocumentHook<T = DocumentData> = LoadingHook<
  DocumentSnapshot<T>,
  FirestoreError
>;
export type DocumentOnceHook<T = DocumentData> = [
  ...DocumentHook<T>,
  () => Promise<void>,
];
export type DocumentDataHook<T = DocumentData> = [
  ...LoadingHook<T, FirestoreError>,
  DocumentSnapshot<T> | undefined,
];
export type DocumentDataOnceHook<T = DocumentData> = [
  ...DocumentDataHook<T>,
  () => Promise<void>,
];
