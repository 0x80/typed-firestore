import { type Query, queryEqual } from "firebase/firestore";

export const isQueryEqual = <T extends Query<unknown>>(
  v1: T | null | undefined,
  v2: T | null | undefined,
): boolean => {
  const bothNull: boolean = !v1 && !v2;
  const equal: boolean = !!v1 && !!v2 && queryEqual(v1, v2);
  return bothNull || equal;
};
