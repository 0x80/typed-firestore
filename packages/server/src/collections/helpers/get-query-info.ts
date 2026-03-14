import type { Query } from "firebase-admin/firestore";

type QueryOptions = {
  limit?: number;
  projection?: {
    fields?: {
      fieldPath: string;
    }[];
  };
};

type InternalQuery = {
  _queryOptions?: QueryOptions;
};

export type QueryInfo = {
  /** The number of documents to limit the query to, if defined */
  limit?: number;
  /** The fields to select from each document, if defined */
  select?: string[];
};

/**
 * Gets information about a query's options like limit and select. We need this
 * because select shouldn't be allowed to be set on the query and a specified
 * limit should switch off pagination
 */
export function getQueryInfo(query: Query): QueryInfo {
  const internalQuery = query as unknown as InternalQuery;
  const queryOptions = internalQuery._queryOptions;
  if (!queryOptions) return {};

  return {
    limit:
      typeof queryOptions.limit === "number" ? queryOptions.limit : undefined,
    select: queryOptions.projection?.fields?.map((field) => field.fieldPath),
  };
}
