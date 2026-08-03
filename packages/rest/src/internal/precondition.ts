import { isPreconditionFailure } from "~/client/errors";
import type { DocumentPrecondition, WriteResult } from "~/types";
import { Timestamp } from "~/values/timestamp";

/**
 * Translate a precondition into the query parameters the REST API expects.
 *
 * `ifUnchanged` is resolved by the caller into the document's own read version,
 * which is why the resolved timestamp is passed in rather than the document.
 */
export function applyPrecondition(
  query: URLSearchParams,
  precondition: DocumentPrecondition,
  readVersion?: Timestamp,
): void {
  if ("ifUnchanged" in precondition) {
    if (!readVersion) {
      throw new Error(
        "The { ifUnchanged: true } precondition is only available on a document that has been read",
      );
    }

    query.set("currentDocument.updateTime", readVersion.toRfc3339());

    return;
  }

  if ("lastUpdateTime" in precondition) {
    query.set(
      "currentDocument.updateTime",
      precondition.lastUpdateTime.toRfc3339(),
    );

    return;
  }

  query.set("currentDocument.exists", String(precondition.exists));
}

/**
 * Run a write, converting an unmet precondition into `undefined`.
 *
 * This only applies when the caller supplied a precondition. An operation that
 * carries an implicit one of its own, such as `updateDocument` requiring the
 * document to exist, still throws, because there the failure means the call was
 * wrong rather than that a race was lost.
 */
export async function runWithPrecondition(
  write: () => Promise<WriteResult>,
  hasCallerPrecondition: boolean,
): Promise<WriteResult | undefined> {
  if (!hasCallerPrecondition) {
    return await write();
  }

  try {
    return await write();
  } catch (error) {
    if (isPreconditionFailure(error)) {
      return undefined;
    }

    throw error;
  }
}

/**
 * A write response carries the commit time. The REST surface is not entirely
 * consistent about the field name, so both spellings are accepted before
 * falling back to the current time.
 */
export function toWriteResult(response: unknown): WriteResult {
  if (typeof response === "object" && response !== null) {
    if ("updateTime" in response && typeof response.updateTime === "string") {
      return { updateTime: Timestamp.fromRfc3339(response.updateTime) };
    }

    if ("commitTime" in response && typeof response.commitTime === "string") {
      return { updateTime: Timestamp.fromRfc3339(response.commitTime) };
    }
  }

  return { updateTime: Timestamp.now() };
}
