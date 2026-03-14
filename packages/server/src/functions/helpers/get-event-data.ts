import type {
  Change,
  DocumentSnapshot,
  FirestoreEvent,
} from "firebase-functions/firestore";
import { invariant } from "~/utils";

/**
 * We could also choose to expose these directly, but I think it's easier to
 * remember what to do if you use the ones that are tied to the event action.
 */
export function getEventDataBefore<T>(
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
): Readonly<T> {
  invariant(event.data?.before, "event.data.before is required");
  return event.data.before.data() as T;
}

export function getEventDataAfter<T>(
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
): Readonly<T> {
  invariant(event.data?.after, "event.data.after is required");
  return event.data.after.data() as T;
}

export function getEventDataBeforeMaybe<T>(
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
): Readonly<T> | undefined {
  return event.data?.before.data() as T | undefined;
}

export function getEventDataAfterMaybe<T>(
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
): Readonly<T> | undefined {
  return event.data?.after.data() as T | undefined;
}
