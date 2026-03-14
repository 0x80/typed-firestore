import type { Query } from "~/firestore-types";

export const isEqualQuery = <T extends Query>(
  v1: T | undefined,
  v2: T | undefined,
): boolean => {
  if (!v1 || !v2) {
    return v1 === v2;
  }

  return v1.isEqual(v2);
};
