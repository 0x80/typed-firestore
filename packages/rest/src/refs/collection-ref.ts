import type { DbContext } from "~/internal/db-context";
import { DocumentRef } from "./document-ref";
import { assertValidPathSegment } from "./path-segment";

/**
 * A typed pointer to a collection.
 *
 * Unlike the server package, where a collection reference has to be cast into
 * its type (`db.collection("users") as CollectionReference<User>`), the type
 * argument is supplied directly here. There is no cast at the call site because
 * nothing is being narrowed.
 */
export class CollectionRef<T> {
  readonly db: DbContext;
  /** Path relative to the database root, such as `users`. */
  readonly path: string;
  readonly id: string;

  /** See the note on `DocumentRef`; this keeps the type parameter load-bearing. */
  declare readonly __type?: T;

  constructor(db: DbContext, path: string) {
    this.db = db;
    this.path = path;
    this.id = path.slice(path.lastIndexOf("/") + 1);
  }

  doc(documentId: string): DocumentRef<T> {
    assertValidPathSegment(documentId, "document id");

    return new DocumentRef<T>(this.db, `${this.path}/${documentId}`);
  }
}
