import type { DbContext } from "~/internal/db-context";

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

  /** The fully qualified resource name the REST API addresses documents by. */
  get name(): string {
    return `${this.db.documentsPath}/${this.path}`;
  }
}
