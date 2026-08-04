/**
 * An error returned by the Firestore REST API.
 *
 * Both the HTTP status and Google's canonical status code are kept, because
 * callers branch on different ones. `FAILED_PRECONDITION` in particular arrives
 * under several HTTP statuses depending on how the gRPC surface was translated,
 * so matching on `code` is the reliable test.
 */
export class FirestoreError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: string | undefined;

  constructor(options: {
    status: number;
    code: string;
    message: string;
    details?: string;
  }) {
    super(options.message);

    this.name = "FirestoreError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

/**
 * Firestore uses `FAILED_PRECONDITION` both for a write whose precondition was
 * not met and for a query that needs a composite index. Only the latter carries
 * the index text, which is what separates a deployment gap from a lost race.
 */
export function isMissingIndexError(error: unknown): boolean {
  return (
    error instanceof FirestoreError &&
    error.code === "FAILED_PRECONDITION" &&
    (error.message.includes("requires an index") ||
      (error.details?.includes("requires an index") ?? false))
  );
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof FirestoreError && error.code === "NOT_FOUND";
}

export function isAlreadyExistsError(error: unknown): boolean {
  return error instanceof FirestoreError && error.code === "ALREADY_EXISTS";
}

/**
 * True when the failure is a precondition that was not met, as opposed to any
 * other `FAILED_PRECONDITION`. Used to turn a lost optimistic-concurrency race
 * into a value rather than a throw.
 */
export function isPreconditionFailure(error: unknown): boolean {
  return (
    error instanceof FirestoreError &&
    error.code === "FAILED_PRECONDITION" &&
    !isMissingIndexError(error)
  );
}
