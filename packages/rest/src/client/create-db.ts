import type { DbContext } from "~/internal/db-context";
import { CollectionRef } from "~/refs/collection-ref";
import { DocumentRef } from "~/refs/document-ref";
import {
  assertValidCollectionPath,
  assertValidPathSegment,
} from "~/refs/path-segment";
import type { AuthProvider } from "./auth";
import { createTransport } from "./transport";

const DEFAULT_HOST = "https://firestore.googleapis.com";
const DEFAULT_DATABASE_ID = "(default)";

export type CreateDbOptions = {
  auth: AuthProvider;
  /**
   * Defaults to the project named by the credential. Required when the
   * credential does not name one, as with `accessToken`.
   */
  projectId?: string;
  databaseId?: string;
  /** Override to target the emulator or a regional endpoint. */
  host?: string;
  /** Override to inject a custom or instrumented fetch. */
  fetch?: typeof globalThis.fetch;
  /**
   * Drop `undefined` properties on write rather than raising an error. Off by
   * default, matching firebase-admin, so that a typo in a field name surfaces
   * instead of silently writing nothing.
   */
  ignoreUndefinedProperties?: boolean;
};

export type Db = {
  readonly projectId: string;
  readonly databaseId: string;
  /**
   * A typed reference to a collection. The path may address a subcollection,
   * as in `users/alice/wishlist`.
   */
  collection<T>(path: string): CollectionRef<T>;
  /** A typed reference to a single document, as in `users/alice`. */
  doc<T>(path: string): DocumentRef<T>;
};

export function createDb(options: CreateDbOptions): Db {
  const projectId = options.projectId ?? options.auth.projectId;

  if (projectId === undefined || projectId === "") {
    throw new Error(
      "No projectId was given and the credential does not name one. Pass projectId to createDb.",
    );
  }

  const databaseId = options.databaseId ?? DEFAULT_DATABASE_ID;

  const request = createTransport({
    auth: options.auth,
    host: options.host ?? DEFAULT_HOST,
    fetchImpl: options.fetch ?? globalThis.fetch,
  });

  const context: DbContext = {
    documentsPath: `projects/${projectId}/databases/${databaseId}/documents`,
    ignoreUndefinedProperties: options.ignoreUndefinedProperties ?? false,
    request,
  };

  return {
    projectId,
    databaseId,
    collection<T>(path: string): CollectionRef<T> {
      assertValidCollectionPath(path);

      return new CollectionRef<T>(context, path);
    },
    doc<T>(path: string): DocumentRef<T> {
      const segments = path.split("/");

      if (segments.length % 2 !== 0) {
        throw new Error(
          `A document path must have an even number of segments, received "${path}"`,
        );
      }

      for (const [index, segment] of segments.entries()) {
        assertValidPathSegment(
          segment,
          index % 2 === 0 ? "collection id" : "document id",
        );
      }

      return new DocumentRef<T>(context, path);
    },
  };
}
