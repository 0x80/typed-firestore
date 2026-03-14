import type {
  CollectionReference,
  DocumentReference,
} from "firebase-admin/firestore";
import type { Change } from "firebase-functions";
import type {
  DocumentSnapshot,
  FirestoreEvent,
} from "firebase-functions/firestore";

export function getDataOnWritten<T>(
  _ref: CollectionReference<T> | DocumentReference<T>,
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
): Readonly<T> | undefined {
  return event.data?.after.data() as T | undefined;
}
