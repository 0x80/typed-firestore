import type { RequestOptions } from "~/internal/db-context";
import type { AuthProvider } from "./auth";
import { FirestoreError } from "./errors";

export type TransportOptions = {
  auth: AuthProvider;
  host: string;
  fetchImpl: typeof globalThis.fetch;
};

/**
 * Issues the HTTP requests and turns a failure response into a `FirestoreError`
 * carrying Google's canonical status code.
 */
export function createTransport(
  options: TransportOptions,
): (request: RequestOptions) => Promise<unknown> {
  const { auth, host, fetchImpl } = options;

  return async function request({
    method,
    path,
    query,
    body,
  }: RequestOptions): Promise<unknown> {
    const token = await auth.getAccessToken();
    const search = query?.toString();
    const url = `${host}/v1/${path}${search ? `?${search}` : ""}`;

    const headers: Record<string, string> = {};

    if (token !== undefined) {
      headers["authorization"] = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const response = await fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      throw await toFirestoreError(response);
    }

    /** A DELETE returns an empty body, which is not parseable as JSON. */
    const text = await response.text();

    return text === "" ? undefined : (JSON.parse(text) as unknown);
  };
}

async function toFirestoreError(response: Response): Promise<FirestoreError> {
  const text = await response.text().catch(() => "");

  let code = "UNKNOWN";
  let message = `The Firestore request failed with status ${String(response.status)}`;

  try {
    const parsed: unknown = JSON.parse(text);

    /**
     * Google wraps failures as `{ error: { code, message, status } }`. A
     * response that does not match is kept as raw detail rather than discarded,
     * because it is usually a proxy or gateway error worth seeing.
     */
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof parsed.error === "object" &&
      parsed.error !== null
    ) {
      const error = parsed.error;

      if ("status" in error && typeof error.status === "string") {
        code = error.status;
      }

      if ("message" in error && typeof error.message === "string") {
        message = error.message;
      }
    }
  } catch {
    /** Left as the default message, with the raw body as detail. */
  }

  return new FirestoreError({
    status: response.status,
    code,
    message,
    details: text === "" ? undefined : truncate(text),
  });
}

function truncate(value: string): string {
  return value.length > 1000 ? `${value.slice(0, 997)}...` : value;
}
