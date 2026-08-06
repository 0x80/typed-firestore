import { queryEqual } from "@react-native-firebase/firestore";
import type { Query } from "~/firestore-types";

/**
 * v26 removed the isEqual method from Query in favour of the modular
 * queryEqual function.
 */
export const isEqualQuery = <T extends Query>(
  v1: T | undefined,
  v2: T | undefined,
): boolean => {
  if (!v1 || !v2) {
    return v1 === v2;
  }

  return queryEqual(v1, v2);
};
