import {
  getDocs as getDocsFirestore,
  getDocsFromCache,
  getDocsFromServer,
} from "@react-native-firebase/firestore";
import type { DocumentData, Query, QuerySnapshot } from "~/firestore-types";
import { MiddlewareManager } from "./middleware-manager";
import type { GetDocsContext, GetDocsMiddleware, GetSource } from "./types";

const manager = new MiddlewareManager<GetDocsContext, Promise<QuerySnapshot>>(
  ({ query, source }) => {
    switch (source) {
      case "cache":
        return getDocsFromCache(query);
      case "server":
        return getDocsFromServer(query);
      default:
        return getDocsFirestore(query);
    }
  },
);

/**
 * Runs a query once, through the registered get-docs middleware. Async, so a
 * middleware that throws rejects the read instead of throwing.
 */
export async function getDocs<T extends DocumentData>(
  query: Query<T>,
  source: GetSource = "default",
) {
  return manager.run({ query, source }) as Promise<QuerySnapshot<T>>;
}

/** Adds a get-docs middleware. Returns a function that removes it again. */
export function experimental_registerGetDocsMiddleware(
  middleware: GetDocsMiddleware,
) {
  return manager.use(middleware);
}
