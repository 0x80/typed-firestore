import type { DbContext } from "~/internal/db-context";
import { encodePathForRequest } from "./path-segment";

/**
 * A typed pointer to a single document. It carries no data of its own; the
 * operations in `documents/` take a reference and perform the request.
 */
export class DocumentRef<T> {
  readonly db: DbContext;
  /** Path relative to the database root, such as `users/alice`. */
  readonly path: string;
  readonly id: string;

  /**
   * The phantom type parameter. Without it `DocumentRef<User>` and
   * `DocumentRef<Book>` would be structurally identical and freely assignable
   * to one another, which would defeat the point of the library.
   */
  declare readonly __type?: T;

  constructor(db: DbContext, path: string) {
    this.db = db;
    this.path = path;
    this.id = path.slice(path.lastIndexOf("/") + 1);
  }

  /**
   * The fully qualified resource name, with identifiers exactly as Firestore
   * stores them. This is the value a `referenceValue` carries, so it must not
   * be percent-encoded.
   */
  get name(): string {
    return `${this.db.documentsPath}/${this.path}`;
  }

  /** The same name, encoded for use in a request URL. */
  get requestPath(): string {
    return `${this.db.documentsPath}/${encodePathForRequest(this.path)}`;
  }
}
