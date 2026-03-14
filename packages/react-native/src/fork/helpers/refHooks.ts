import { useEffect, useRef } from "react";

export type RefHook<T> = {
  current: T;
};

export const useComparatorRef = <T>(
  value: T | undefined,
  isEqual: (v1?: T, v2?: T) => boolean,
  onChange?: () => void,
): RefHook<T | undefined> => {
  const ref = useRef(value);
  useEffect(() => {
    if (!isEqual(value, ref.current)) {
      ref.current = value;
      if (onChange) {
        onChange();
      }
    }
  });
  return ref;
};

export type HasIsEqual<T> = {
  isEqual: (value: T) => boolean;
};

const isEqual = <T extends HasIsEqual<T>>(
  v1: T | undefined,
  v2: T | undefined,
): boolean => {
  if (!v1 || !v2) {
    return v1 === v2;
  }
  return v1.isEqual(v2);
};

export const useIsEqualRef = <T extends HasIsEqual<T>>(
  value: T | undefined,
  onChange?: () => void,
): RefHook<T | undefined> => {
  return useComparatorRef(value, isEqual, onChange);
};
