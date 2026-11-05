import {
  getDoc as getDocFirestore,
  getDocFromCache,
  getDocFromServer,
} from "@react-native-firebase/firestore";
import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
} from "~/firestore-types";
import { MiddlewareManager } from "./middleware-manager";
import type { GetDocContext, GetDocMiddleware, GetSource } from "./types";

const manager = new MiddlewareManager<GetDocContext, Promise<DocumentSnapshot>>(
  ({ reference, source }) => {
    switch (source) {
      case "cache":
        return getDocFromCache(reference);
      case "server":
        return getDocFromServer(reference);
      default:
        return getDocFirestore(reference);
    }
  },
);

/**
 * Reads a document once, through the registered get-doc middleware. Async, so
 * a middleware that throws rejects the read instead of throwing.
 */
export async function getDoc<T extends DocumentData>(
  reference: DocumentReference<T>,
  source: GetSource = "default",
) {
  return manager.run({
    reference,
    source,
  }) as Promise<DocumentSnapshot<T>>;
}

/** Adds a get-doc middleware. Returns a function that removes it again. */
export function experimental_registerGetDocMiddleware(
  middleware: GetDocMiddleware,
) {
  return manager.use(middleware);
}
