import { onSnapshot } from "@react-native-firebase/firestore";
import type {
  DocumentData,
  FirestoreError,
  Query,
  QuerySnapshot,
  SnapshotListenOptions,
} from "~/firestore-types";
import { MiddlewareManager } from "./middleware-manager";
import type { OnDocsSnapshotContext, OnDocsSnapshotMiddleware } from "./types";

const manager = new MiddlewareManager<OnDocsSnapshotContext, () => void>(
  ({ query, options, onNext, onError }) =>
    options
      ? onSnapshot(query, options, onNext, onError)
      : onSnapshot(query, onNext, onError),
);

/**
 * Subscribes to a query, through the registered query-listener middleware.
 * Returns the unsubscribe function. `onError` is required: without it React
 * Native Firebase passes errors to `onNext` as a second argument.
 */
export function onDocsSnapshot<T extends DocumentData>(
  query: Query<T>,
  options: SnapshotListenOptions | undefined,
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError: (error: FirestoreError) => void,
) {
  return manager.run({
    query,
    options,
    onNext: onNext as (snapshot: QuerySnapshot) => void,
    onError,
  });
}

/** Adds a query-listener middleware. Returns a function that removes it again. */
export function experimental_registerOnDocsSnapshotMiddleware(
  middleware: OnDocsSnapshotMiddleware,
) {
  return manager.use(middleware);
}
