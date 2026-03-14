import type { Query } from "firebase/firestore";
import { isQueryEqual } from "./isQueryEqual";
import { type RefHook, useComparatorRef } from "./refHooks";

export const useIsFirestoreQueryEqual = <T extends Query<unknown>>(
  value: T | null | undefined,
  onChange?: () => void,
): RefHook<T | null | undefined> => {
  return useComparatorRef(value, isQueryEqual, onChange);
};
