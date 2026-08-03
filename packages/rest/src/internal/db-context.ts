/**
 * The internal handle that references and operations use to reach the API.
 *
 * This module deliberately imports nothing. References need to reach the
 * transport, the transport needs to build references while decoding, and both
 * are created by `createDb`. Keeping the contract in a leaf module is what
 * makes that graph acyclic.
 */

export type RequestOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path relative to the API version root, without a leading slash. */
  path: string;
  query?: URLSearchParams;
  body?: unknown;
};

export type DbContext = {
  readonly projectId: string;
  readonly databaseId: string;
  /** `projects/{projectId}/databases/{databaseId}/documents` */
  readonly documentsPath: string;
  /** Drop `undefined` properties on write instead of raising an error. */
  readonly ignoreUndefinedProperties: boolean;
  request(options: RequestOptions): Promise<unknown>;
};
