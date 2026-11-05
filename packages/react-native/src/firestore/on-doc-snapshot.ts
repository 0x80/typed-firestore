import { onSnapshot } from "@react-native-firebase/firestore";
import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FirestoreError,
  SnapshotListenOptions,
} from "~/firestore-types";
import { MiddlewareManager } from "./middleware-manager";
import type { OnDocSnapshotContext, OnDocSnapshotMiddleware } from "./types";

const manager = new MiddlewareManager<OnDocSnapshotContext, () => void>(
  ({ reference, options, onNext, onError }) =>
    options
      ? onSnapshot(reference, options, onNext, onError)
      : onSnapshot(reference, onNext, onError),
);

/**
 * Subscribes to a document, through the registered document-listener
 * middleware. Returns the unsubscribe function. `onError` is required: without
 * it React Native Firebase passes errors to `onNext` as a second argument.
 */
export function onDocSnapshot<T extends DocumentData>(
  reference: DocumentReference<T>,
  options: SnapshotListenOptions | undefined,
  onNext: (snapshot: DocumentSnapshot<T>) => void,
  onError: (error: FirestoreError) => void,
) {
  return manager.run({
    reference,
    options,
    onNext: onNext as (snapshot: DocumentSnapshot) => void,
    onError,
  });
}

/**
 * Adds a document-listener middleware. Returns a function that removes it
 * again.
 */
export function experimental_registerOnDocSnapshotMiddleware(
  middleware: OnDocSnapshotMiddleware,
) {
  return manager.use(middleware);
}
