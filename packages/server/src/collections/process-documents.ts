import type {
  CollectionGroup,
  CollectionReference,
  DocumentData,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { processInChunks, processInChunksByChunk } from "process-in-chunks";
import type { FsMutableDocument } from "~/types";
import {
  getErrorMessage,
  invariant,
  isDefined,
  verboseCount,
  verboseLog,
} from "~/utils";
import { DEFAULT_CHUNK_SIZE, MAX_QUERY_LIMIT } from "./constants";
import { getDocuments } from "./get-documents";
import { buildQuery, getChunkOfDocuments } from "./helpers";
import type { QueryBuilder, SelectedDocument } from "./types";

type ProcessDocumentsOptions<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
> = {
  select?: S;
  chunkSize?: number;
  throttleSeconds?: number;
};

/** Maximum number of errors to store in memory */
const MAX_STORED_ERRORS = 1000;

/** Helper to handle document processing errors */
function handleProcessingError(id: string, err: unknown): void {
  const message = getErrorMessage(err);
  console.error(`Error processing document ${id}: ${message}`);
}

/**
 * Process a collection using a query. If the query is null, the entire
 * collection is retrieved. An optional select statement can narrow the data.
 */
export async function processDocuments<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder | null,
  handler: (
    document: FsMutableDocument<SelectedDocument<T, S>, T>,
  ) => Promise<unknown>,
  options: ProcessDocumentsOptions<T, S> = {},
): Promise<void> {
  const { query, disableChunking, limit } = buildQuery(
    ref,
    queryFn,
    options.select,
  );

  const { throttleSeconds = 0, chunkSize = DEFAULT_CHUNK_SIZE } = options;

  let errorCount = 0;

  if (disableChunking) {
    /** For limits <= MAX_QUERY_LIMIT, use a single query (existing behavior) */
    invariant(
      limit && limit <= MAX_QUERY_LIMIT,
      `Limit ${String(limit)} is greater than the maximum query limit of ${String(MAX_QUERY_LIMIT)}`,
    );

    const documents = await getDocuments(ref, queryFn, options);

    await processInChunks(
      documents,
      async (doc) => {
        try {
          await handler(doc);
        } catch (err) {
          if (errorCount < MAX_STORED_ERRORS) {
            handleProcessingError(doc.id, err);
            errorCount++;
          }
        }
      },
      { throttleSeconds, chunkSize },
    );
  } else {
    /** For limits > MAX_QUERY_LIMIT or no limit, use chunking */
    let lastDocumentSnapshot:
      | QueryDocumentSnapshot<SelectedDocument<T, S>>
      | undefined;
    let count = 0;
    const hasLimit = limit && limit > MAX_QUERY_LIMIT;
    const remainingLimit = hasLimit ? limit : undefined;

    do {
      verboseCount("Processing chunk");

      /** Calculate effective chunk size based on remaining limit */
      const effectiveChunkSize = remainingLimit
        ? Math.min(remainingLimit - count, Math.min(MAX_QUERY_LIMIT, chunkSize))
        : Math.min(MAX_QUERY_LIMIT, chunkSize);

      const [documents, _lastDocumentSnapshot] = await getChunkOfDocuments<
        SelectedDocument<T, S>,
        T
      >(query, lastDocumentSnapshot, effectiveChunkSize);

      await processInChunks(
        documents,
        async (doc) => {
          try {
            await handler(doc);
          } catch (err) {
            if (errorCount < MAX_STORED_ERRORS) {
              handleProcessingError(doc.id, err);
              errorCount++;
            }
          }
        },
        { throttleSeconds, chunkSize },
      );

      count += documents.length;
      lastDocumentSnapshot = _lastDocumentSnapshot;

      /** Stop if we've reached the limit */
      if (remainingLimit && count >= remainingLimit) {
        break;
      }
    } while (isDefined(lastDocumentSnapshot));

    verboseLog(`Processed ${String(count)} documents`);
  }

  if (errorCount >= MAX_STORED_ERRORS) {
    console.warn(
      `Error logging was limited to ${String(MAX_STORED_ERRORS)} errors`,
    );
  }
}

/**
 * Process a collection using a query, and handle the results per chunk. If the
 * query is null, the entire collection is retrieved. An optional select
 * statement can narrow the data.
 */
export async function processDocumentsByChunk<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn:
    | ((collection: CollectionReference | CollectionGroup) => Query)
    | null,
  handler: (
    documents: FsMutableDocument<SelectedDocument<T, S>, T>[],
  ) => Promise<unknown>,
  options: ProcessDocumentsOptions<T, S> = {},
): Promise<void> {
  const { query, disableChunking, limit } = buildQuery(
    ref,
    queryFn,
    options.select,
  );

  const { throttleSeconds = 0, chunkSize = DEFAULT_CHUNK_SIZE } = options;

  const errors: string[] = [];

  if (disableChunking) {
    /** For limits <= MAX_QUERY_LIMIT, use a single query (existing behavior) */
    const documents = await getDocuments(ref, queryFn, options);

    try {
      await processInChunksByChunk(
        documents,
        async (docs) => {
          await handler(docs);
        },
        { throttleSeconds, chunkSize },
      );
    } catch (err) {
      errors.push(getErrorMessage(err));
    }
  } else {
    /** For limits > MAX_QUERY_LIMIT or no limit, use chunking */
    let lastDocumentSnapshot:
      | QueryDocumentSnapshot<SelectedDocument<T, S>>
      | undefined;
    let count = 0;
    const hasLimit = limit && limit > MAX_QUERY_LIMIT;
    const remainingLimit = hasLimit ? limit : undefined;

    do {
      verboseCount("Processing chunk");

      /** Calculate effective chunk size based on remaining limit */
      const effectiveChunkSize = remainingLimit
        ? Math.min(remainingLimit - count, Math.min(MAX_QUERY_LIMIT, chunkSize))
        : Math.min(MAX_QUERY_LIMIT, chunkSize);

      const [documents, _lastDocumentSnapshot] = await getChunkOfDocuments<
        SelectedDocument<T, S>,
        T
      >(query, lastDocumentSnapshot, effectiveChunkSize);

      try {
        await processInChunksByChunk(
          documents,
          async (docs) => {
            await handler(docs);
          },
          { throttleSeconds, chunkSize },
        );
      } catch (err) {
        errors.push(getErrorMessage(err));
      }

      count += documents.length;
      lastDocumentSnapshot = _lastDocumentSnapshot;

      /** Stop if we've reached the limit */
      if (remainingLimit && count >= remainingLimit) {
        break;
      }
    } while (isDefined(lastDocumentSnapshot));

    verboseLog(`Processed ${String(count)} documents`);

    if (errors.length > 0) {
      errors.forEach((message) => {
        console.error(message);
      });
    }
  }
}

type ProcessDocumentRefsOptions = {
  chunkSize?: number;
  throttleSeconds?: number;
};

/**
 * Process document references from a collection without fetching document data.
 * Useful for operations like batch deletes or updates where data isn't needed.
 */
export async function processDocumentRefs<T extends DocumentData>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder | null,
  handler: (
    document: FsMutableDocument<Record<string, never>, T>,
  ) => Promise<unknown>,
  options: ProcessDocumentRefsOptions = {},
): Promise<void> {
  return processDocuments(ref, queryFn, handler, { ...options, select: [] });
}

/**
 * Process document references from a collection by chunk without fetching
 * document data. Useful for operations like batch deletes or updates where data
 * isn't needed.
 */
export async function processDocumentRefsByChunk<T extends DocumentData>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder | null,
  handler: (
    documents: FsMutableDocument<Record<string, never>, T>[],
  ) => Promise<unknown>,
  options: ProcessDocumentRefsOptions = {},
): Promise<void> {
  return processDocumentsByChunk(ref, queryFn, handler, {
    ...options,
    select: [],
  });
}
