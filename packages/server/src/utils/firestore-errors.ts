/**
 * Firestore surfaces failures as errors carrying a numeric gRPC status code.
 * Matching on that code is more reliable than matching on the message, which is
 * not part of any contract and varies between the emulator and production.
 *
 * @see https://grpc.github.io/grpc/core/md_doc_statuscodes.html
 */

const GRPC_ALREADY_EXISTS = 6;
const GRPC_FAILED_PRECONDITION = 9;

function statusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  return typeof error.code === "number" ? error.code : undefined;
}

export function isAlreadyExistsError(error: unknown): boolean {
  return statusCode(error) === GRPC_ALREADY_EXISTS;
}

export function isPreconditionFailure(error: unknown): boolean {
  return statusCode(error) === GRPC_FAILED_PRECONDITION;
}
