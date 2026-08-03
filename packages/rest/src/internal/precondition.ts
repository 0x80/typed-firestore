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
 * This only applies when the caller supplied a precondition. Where no
 * precondition was passed, `updateDocument` sets an implicit existence check of
 * its own, and a failure of that one still throws: it means the document was
 * missing, which is a wrong call rather than a lost race. Supplying a
 * precondition replaces that implicit check.
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
 * Read the commit time out of a write response.
 *
 * A PATCH returns the written document and carries one; a DELETE returns an
 * empty body and carries none, which is why `updateTime` is optional. It is
 * never fabricated from the local clock: a client-side timestamp handed back as
 * a server commit time would be wrong by an unknown amount, and would be
 * actively dangerous if a caller fed it into a `lastUpdateTime` precondition.
 */
export function toWriteResult(response: unknown): WriteResult {
  if (
    typeof response === "object" &&
    response !== null &&
    "updateTime" in response &&
    typeof response.updateTime === "string"
  ) {
    return { writeTime: Timestamp.fromRfc3339(response.updateTime) };
  }

  return { writeTime: undefined };
}
