import type {
  CollectionReference,
  DocumentReference,
} from "firebase-admin/firestore";
import type { Change } from "firebase-functions";
import type {
  DocumentSnapshot,
  FirestoreEvent,
} from "firebase-functions/firestore";
import {
  getEventDataAfterMaybe,
  getEventDataBeforeMaybe,
} from "./helpers/get-event-data";

export function getBeforeAndAfterOnWritten<T>(
  _ref: CollectionReference<T> | DocumentReference<T>,
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
): readonly [T | undefined, T | undefined] {
  return [
    getEventDataBeforeMaybe<T>(event),
    getEventDataAfterMaybe<T>(event),
  ] as const;
}
