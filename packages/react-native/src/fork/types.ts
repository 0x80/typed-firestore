import type { FirestoreError } from "@react-native-firebase/firestore";
import type {
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
  SnapshotListenOptions,
} from "~/firestore-types";

export type Options = {
  snapshotListenOptions?: SnapshotListenOptions;
};
export type InitialValueOptions<T> = {
  initialValue?: T;
};
export type DataOptions = Options;
export type OnceOptions = {
  getOptions?: GetOptions;
};
export type GetOptions = {
  source?: "default" | "server" | "cache";
};
export type OnceDataOptions = OnceOptions;

type LoadingHook<T, E> = [T | undefined, boolean, E | undefined];

export type CollectionHook<T extends DocumentData> = LoadingHook<
  QuerySnapshot<T>,
  FirestoreError
>;
export type CollectionOnceHook<T extends DocumentData> = [
  ...CollectionHook<T>,
  () => Promise<void>,
];
export type CollectionDataHook<T extends DocumentData> = [
  ...LoadingHook<T[], FirestoreError>,
  QuerySnapshot<T> | undefined,
];
export type CollectionDataOnceHook<T extends DocumentData> = [
  ...CollectionDataHook<T>,
  () => Promise<void>,
];

export type DocumentHook<T extends DocumentData> = LoadingHook<
  DocumentSnapshot<T>,
  FirestoreError
>;
export type DocumentOnceHook<T extends DocumentData> = [
  ...DocumentHook<T>,
  () => Promise<void>,
];
export type DocumentDataHook<T extends DocumentData> = [
  ...LoadingHook<T, FirestoreError>,
];
export type DocumentDataOnceHook<T extends DocumentData> = [
  ...LoadingHook<T, FirestoreError>,
  () => Promise<void>,
];
