import { emulator } from "~/client/auth";
import { createDb, type Db } from "~/client/create-db";

export type RecordedRequest = {
  method: string;
  url: URL;
  body: unknown;
};

export type FakeDb = {
  db: Db;
  requests: RecordedRequest[];
  /** The most recent request, for the common single-call assertion. */
  lastRequest(): RecordedRequest;
};

/**
 * A database backed by a scripted fetch. Everything below the transport is the
 * real implementation, so these tests exercise the actual encoder, query
 * builder and URL construction rather than a stand-in for them.
 */
export function createFakeDb(
  respond: (request: RecordedRequest) => unknown,
  options: { ignoreUndefinedProperties?: boolean } = {},
): FakeDb {
  const requests: RecordedRequest[] = [];

  const fakeFetch: typeof globalThis.fetch = async (input, init) => {
    const url = toUrl(input);
    const rawBody = init?.body;

    const recorded: RecordedRequest = {
      method: init?.method ?? "GET",
      url,
      body: typeof rawBody === "string" ? JSON.parse(rawBody) : undefined,
    };

    requests.push(recorded);

    const result = respond(recorded);

    if (result instanceof Response) {
      return result;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const db = createDb({
    projectId: "test-project",
    auth: emulator(),
    fetch: fakeFetch,
    ignoreUndefinedProperties: options.ignoreUndefinedProperties,
  });

  return {
    db,
    requests,
    lastRequest() {
      const request = requests.at(-1);

      if (!request) {
        throw new Error("No request was made");
      }

      return request;
    },
  };
}

function toUrl(input: RequestInfo | URL): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  return input instanceof URL ? input : new URL(input.url);
}

/** Build the error body shape the Firestore REST API returns. */
export function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return new Response(
    JSON.stringify({ error: { code: status, status: code, message } }),
    { status, headers: { "content-type": "application/json" } },
  );
}

export const DOCUMENTS_PATH =
  "projects/test-project/databases/(default)/documents";
