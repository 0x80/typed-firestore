import type { Query } from "./query";

/**
 * Narrows the document type when a `select` is used, matching the behavior of
 * the server package.
 */
export type SelectedDocument<
  T,
  S extends (keyof T)[] | undefined = undefined,
> = S extends undefined ? T : S extends (keyof T)[] ? Pick<T, S[number]> : T;

export type QueryBuilder<T> = (query: Query<T>) => Query<T>;
