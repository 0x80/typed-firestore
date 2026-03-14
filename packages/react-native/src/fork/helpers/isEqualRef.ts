import type { CollectionReference, DocumentReference } from "~/firestore-types";

export const isRefEqual = <T extends DocumentReference | CollectionReference>(
  v1: T | undefined,
  v2: T | undefined,
): boolean => {
  return v1?.path === v2?.path;
};
