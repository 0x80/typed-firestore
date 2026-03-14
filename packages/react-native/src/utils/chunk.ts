import { invariant } from "./invariant";
import { isEmpty } from "./is-empty";

export function chunk<T>(array: T[], size: number): T[][] {
  invariant(size > 0, "Size must be greater than 0");

  if (isEmpty(array)) {
    return [];
  }

  const length = array.length;

  let index = 0;
  let resIndex = 0;
  const result: T[][] = Array.from({ length: Math.ceil(length / size) });

  while (index < length) {
    result[resIndex++] = array.slice(index, (index += size));
  }

  return result;
}
