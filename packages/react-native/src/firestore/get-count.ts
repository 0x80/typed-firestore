import { getCountFromServer } from "@react-native-firebase/firestore";
import type { DocumentData, Query } from "~/firestore-types";
import { MiddlewareManager } from "./middleware-manager";
import type { GetCountContext, GetCountMiddleware } from "./types";

const manager = new MiddlewareManager<
  GetCountContext,
  ReturnType<typeof getCountFromServer>
>(({ query }) => getCountFromServer(query));

/**
 * Counts the documents a query matches, through the registered get-count
 * middleware. Async, so a middleware that throws rejects the count instead of
 * throwing.
 */
export async function getCount<T extends DocumentData>(query: Query<T>) {
  return manager.run({ query });
}

/** Adds a get-count middleware. Returns a function that removes it again. */
export function experimental_registerGetCountMiddleware(
  middleware: GetCountMiddleware,
) {
  return manager.use(middleware);
}
