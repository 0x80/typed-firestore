import type { Query } from "~/firestore-types";
import { isEqualQuery } from "./isEqualQuery";
import { type RefHook, useComparatorRef } from "./refHooks";

export const useIsFirestoreQueryEqual = <T extends Query>(
  value: T | undefined,
  onChange?: () => void,
): RefHook<T | undefined> => {
  return useComparatorRef(value, isEqualQuery, onChange);
};
