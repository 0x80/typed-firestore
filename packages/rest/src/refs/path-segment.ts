/**
 * Validation for the collection and document identifiers that go into a
 * resource path. Beyond keeping the API honest, this is the trust boundary for
 * any identifier that reaches a path from user input: a segment containing a
 * slash would otherwise silently redirect a write to a different document.
 *
 * The rules are Firestore's own, rather than something stricter of our own
 * invention, so that legitimate identifiers are never rejected.
 */

const MAX_SEGMENT_BYTES = 1500;
const RESERVED_PATTERN = /^__.*__$/;

const encoder = new TextEncoder();

export function assertValidPathSegment(value: string, label: string): void {
  if (value === "") {
    throw new Error(`A Firestore ${label} cannot be empty`);
  }

  if (value.includes("/")) {
    throw new Error(
      `A Firestore ${label} cannot contain a forward slash, received "${value}"`,
    );
  }

  if (value === "." || value === "..") {
    throw new Error(
      `A Firestore ${label} cannot be "." or "..", received "${value}"`,
    );
  }

  if (RESERVED_PATTERN.test(value)) {
    throw new Error(
      `A Firestore ${label} cannot match the reserved __*__ pattern, received "${value}"`,
    );
  }

  if (encoder.encode(value).length > MAX_SEGMENT_BYTES) {
    throw new Error(
      `A Firestore ${label} cannot exceed ${String(MAX_SEGMENT_BYTES)} bytes when UTF-8 encoded`,
    );
  }
}

/**
 * Percent-encode each segment of a relative path for use in a request URL.
 *
 * Firestore's identifier rules are far more permissive than a URL path is: an
 * id may legally contain `?`, `#`, `%` or a space, any of which would otherwise
 * start a query string, start a fragment, or form a stray escape and address a
 * different document. The separators stay literal so the path structure
 * survives.
 *
 * This is only for the wire. The logical resource name keeps the raw
 * identifiers, because that is what Firestore stores and returns, and what a
 * `referenceValue` has to contain.
 */
export function encodePathForRequest(relativePath: string): string {
  return relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * A collection path may address a subcollection, so it can contain slashes, but
 * it must have an odd number of segments and each one must be valid on its own.
 */
export function assertValidCollectionPath(path: string): void {
  const segments = path.split("/");

  if (segments.length % 2 === 0) {
    throw new Error(
      `A collection path must have an odd number of segments, received "${path}"`,
    );
  }

  for (const [index, segment] of segments.entries()) {
    assertValidPathSegment(
      segment,
      index % 2 === 0 ? "collection id" : "document id",
    );
  }
}
