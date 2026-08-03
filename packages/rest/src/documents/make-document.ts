import type { DbContext } from "~/internal/db-context";
import {
  applyPrecondition,
  runWithPrecondition,
  toWriteResult,
} from "~/internal/precondition";
import { DocumentRef } from "~/refs/document-ref";
import type {
  DocumentPrecondition,
  FsMutableDocument,
  UpdateData,
  WriteResult,
} from "~/types";
import { decodeFields } from "~/values/decode";
import { encodeFields } from "~/values/encode";
import { buildFieldPath } from "~/values/field-path";
import { Timestamp } from "~/values/timestamp";
import type { WireDocument } from "~/values/wire";

/**
 * Validates that a response really is a document, rather than trusting the
 * shape. A silently missing `updateTime` would break the optimistic
 * concurrency contract in a way that only shows up under contention.
 */
export function assertWireDocument(value: unknown): WireDocument {
  if (
    typeof value !== "object" ||
    value === null ||
    !("name" in value) ||
    typeof value.name !== "string" ||
    !("createTime" in value) ||
    typeof value.createTime !== "string" ||
    !("updateTime" in value) ||
    typeof value.updateTime !== "string"
  ) {
    throw new TypeError(
      "The Firestore response was not a document with name, createTime and updateTime",
    );
  }

  return value as WireDocument;
}

export function makeMutableDocument<T>(
  db: DbContext,
  wire: WireDocument,
): FsMutableDocument<T> {
  const prefix = `${db.documentsPath}/`;
  const path = wire.name.startsWith(prefix)
    ? wire.name.slice(prefix.length)
    : wire.name;

  const ref = new DocumentRef<T>(db, path);
  const updateTime = Timestamp.fromRfc3339(wire.updateTime);

  return {
    id: ref.id,
    data: decodeFields(wire.fields ?? {}, db) as T,
    ref,
    createTime: Timestamp.fromRfc3339(wire.createTime),
    updateTime,

    async update(
      data: UpdateData<T>,
      precondition?: DocumentPrecondition,
    ): Promise<WriteResult | undefined> {
      return await runWithPrecondition(
        async () =>
          await patchDocument(db, ref, data, precondition, updateTime),
        precondition !== undefined,
      );
    },

    async delete(
      precondition?: DocumentPrecondition,
    ): Promise<WriteResult | undefined> {
      const query = new URLSearchParams();

      if (precondition) {
        applyPrecondition(query, precondition, updateTime);
      }

      return await runWithPrecondition(async () => {
        const response = await db.request({
          method: "DELETE",
          path: ref.name,
          query,
        });

        return toWriteResult(response);
      }, precondition !== undefined);
    },
  } as FsMutableDocument<T>;
}

/**
 * Shared by the document method and the standalone `updateDocument`.
 *
 * The update mask is built from the keys actually supplied, so fields absent
 * from the payload are left untouched. Without it Firestore would treat the
 * write as a full replacement and drop everything not mentioned.
 */
export async function patchDocument<T>(
  db: DbContext,
  ref: DocumentRef<T>,
  data: UpdateData<T>,
  precondition: DocumentPrecondition | undefined,
  readVersion?: Timestamp,
): Promise<WriteResult> {
  const record = data as Record<string, unknown>;
  const query = new URLSearchParams();

  for (const key of Object.keys(record)) {
    query.append("updateMask.fieldPaths", buildFieldPath([key]));
  }

  if (precondition) {
    applyPrecondition(query, precondition, readVersion);
  } else {
    /**
     * Match the SDK behavior where an update fails on a missing document,
     * rather than the REST default of creating one.
     */
    query.set("currentDocument.exists", "true");
  }

  const response = await db.request({
    method: "PATCH",
    path: ref.name,
    query,
    body: {
      fields: encodeFields(record, {
        ignoreUndefinedProperties: db.ignoreUndefinedProperties,
      }),
    },
  });

  return toWriteResult(response);
}
