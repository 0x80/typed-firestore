import type {
  CollectionGroup,
  CollectionReference,
  Query,
} from "firebase-admin/firestore";

export type SelectedDocument<
  T,
  S extends (keyof T)[] | undefined = undefined,
> = S extends undefined ? T : S extends (keyof T)[] ? Pick<T, S[number]> : T;

export type QueryBuilder = (
  collection: CollectionReference | CollectionGroup,
) => Query;
