import {
  type CollectionReference,
  type DocumentReference,
  refEqual,
} from "firebase/firestore";

export const isRefEqual = <
  T extends DocumentReference<unknown> | CollectionReference<unknown>,
>(
  v1: T | null | undefined,
  v2: T | null | undefined,
): boolean => {
  const bothNull: boolean = !v1 && !v2;
  const equal: boolean = !!v1 && !!v2 && refEqual(v1, v2);
  return bothNull || equal;
};
