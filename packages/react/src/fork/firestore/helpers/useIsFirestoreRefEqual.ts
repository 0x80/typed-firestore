import type {
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";
import { isRefEqual } from "./isEqualRef";
import { type RefHook, useComparatorRef } from "./refHooks";

export const useIsFirestoreRefEqual = <
  T extends DocumentReference<unknown> | CollectionReference<unknown>,
>(
  value: T | null | undefined,
  onChange?: () => void,
): RefHook<T | null | undefined> => {
  return useComparatorRef(value, isRefEqual, onChange);
};
