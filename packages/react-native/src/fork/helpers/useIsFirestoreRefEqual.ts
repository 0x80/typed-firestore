import type { CollectionReference, DocumentReference } from "~/firestore-types";
import { isRefEqual } from "./isEqualRef";
import { type RefHook, useComparatorRef } from "./refHooks";

export const useIsFirestoreRefEqual = <
  T extends DocumentReference | CollectionReference,
>(
  value: T | undefined,
  onChange?: () => void,
): RefHook<T | undefined> => {
  return useComparatorRef(value, isRefEqual, onChange);
};
