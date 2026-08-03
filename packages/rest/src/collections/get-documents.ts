import type { CollectionRef } from "~/refs/collection-ref";
import type { FsMutableDocument } from "~/types";
import {
  assertWireDocument,
  makeMutableDocument,
} from "~/documents/make-document";
import { buildStructuredQuery, Query } from "./query";
import type { QueryBuilder, SelectedDocument } from "./types";

export type GetDocumentsOptions<
  T,
  S extends (keyof T)[] | undefined = undefined,
> = {
  /**
   * Fetch only these fields. Declared here rather than on the query so that the
   * returned type can be narrowed to them.
   */
  select?: S;
};

/**
 * Run a query and return the matching documents.
 *
 * A limit is required in this version. Without pagination an unbounded query
 * would buffer an entire collection into memory, so the constraint is enforced
 * at the call rather than left as a surprise in production. Unbounded
 * retrieval arrives together with `processDocuments`.
 */
export async function getDocuments<
  T,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionRef<T>,
  queryFn: QueryBuilder<T>,
  options: GetDocumentsOptions<T, S> = {},
): Promise<FsMutableDocument<SelectedDocument<T, S>>[]> {
  const query = queryFn(new Query<T>());

  if (query.state.limit === undefined) {
    throw new Error(
      "A query needs an explicit limit. Unbounded retrieval is not supported yet, so add .limit(n) to bound the result set.",
    );
  }

  const structuredQuery = buildStructuredQuery(
    ref.id,
    query.state,
    options.select as readonly string[] | undefined,
  );

  const response = await ref.db.request({
    method: "POST",
    path: `${toQueryParentPath(ref)}:runQuery`,
    body: { structuredQuery },
  });

  return toDocuments<SelectedDocument<T, S>>(ref, response);
}

/** Returns the first match, or undefined when the query matches nothing. */
export async function getFirstDocument<
  T,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionRef<T>,
  queryFn: QueryBuilder<T>,
  options: GetDocumentsOptions<T, S> = {},
): Promise<FsMutableDocument<SelectedDocument<T, S>> | undefined> {
  const documents = await getDocuments(
    ref,
    (query) => queryFn(query).limit(1),
    options,
  );

  return documents[0];
}

/**
 * The runQuery endpoint is addressed at the *parent* of the collection, with
 * the collection named inside the query body. For a root collection that is the
 * database root; for a subcollection it is the owning document.
 */
function toQueryParentPath<T>(ref: CollectionRef<T>): string {
  const separatorIndex = ref.path.lastIndexOf("/");

  return separatorIndex === -1
    ? ref.db.documentsPath
    : `${ref.db.documentsPath}/${ref.path.slice(0, separatorIndex)}`;
}

function toDocuments<T>(
  ref: CollectionRef<unknown>,
  response: unknown,
): FsMutableDocument<T>[] {
  if (!Array.isArray(response)) {
    throw new TypeError("The Firestore runQuery response was not an array");
  }

  const documents: FsMutableDocument<T>[] = [];

  for (const entry of response) {
    /**
     * Firestore emits a readTime-only entry when a query matches nothing, so an
     * entry without a document is skipped rather than treated as malformed.
     */
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("document" in entry) ||
      entry.document === undefined
    ) {
      continue;
    }

    documents.push(
      makeMutableDocument<T>(ref.db, assertWireDocument(entry.document)),
    );
  }

  return documents;
}
