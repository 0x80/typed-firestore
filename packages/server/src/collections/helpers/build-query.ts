import type {
  CollectionGroup,
  CollectionReference,
  DocumentData,
} from "firebase-admin/firestore";
import { invariant, isDefined } from "~/utils";
import { MAX_QUERY_LIMIT } from "../constants";
import type { QueryBuilder } from "../types";
import { getQueryInfo } from "./get-query-info";

/** Validates the passed-in queryFn and apply options to build the final query */
export function buildQuery<T extends DocumentData>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  optionsSelect?: (keyof T)[],
): {
  query: FirebaseFirestore.Query;
  disableChunking: boolean;
  limit: number | undefined;
} {
  const queryInfo = queryFn ? getQueryInfo(queryFn(ref)) : {};
  const { limit, select: querySelect } = queryInfo;

  invariant(
    !querySelect,
    "Select is not allowed to be set on the query. Use the options instead.",
  );

  /**
   * Disable chunking only for limits <= MAX_QUERY_LIMIT. For limits >
   * MAX_QUERY_LIMIT, we'll use chunking
   */
  const disableChunking = isDefined(limit) && limit <= MAX_QUERY_LIMIT;

  const baseQuery = queryFn ? queryFn(ref) : ref;

  const query = optionsSelect
    ? baseQuery.select(...(optionsSelect as string[]))
    : baseQuery;

  return { query, disableChunking, limit };
}
