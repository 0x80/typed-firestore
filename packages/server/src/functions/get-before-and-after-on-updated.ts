import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import type { Change } from "firebase-functions";
import type { FirestoreEvent } from "firebase-functions/firestore";
import {
  getEventDataAfter,
  getEventDataBefore,
} from "./helpers/get-event-data";

export function getBeforeAndAfterOnUpdated<T>(
  _ref: CollectionReference<T> | DocumentReference<T>,
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
): readonly [T, T] {
  return [getEventDataBefore<T>(event), getEventDataAfter<T>(event)] as const;
}
