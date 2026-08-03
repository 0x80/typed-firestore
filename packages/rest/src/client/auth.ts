/**
 * Authentication strategies for the REST transport.
 *
 * Everything here runs on Web Crypto rather than a Node crypto module, which is
 * what lets the package work on workerd, Deno, Bun and Node alike.
 */

import { FirestoreError } from "./errors";

const OAUTH_SCOPE = "https://www.googleapis.com/auth/datastore";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";

/**
 * Refresh this many seconds before the token actually expires, so a request
 * already in flight is unlikely to arrive with a just-expired credential. A
 * request delayed longer than this margin still can.
 */
const REFRESH_MARGIN_SECONDS = 60;

export type AuthProvider = {
  /**
   * Returns the bearer token to send, or undefined when the target needs no
   * authentication at all (the emulator).
   */
  getAccessToken(): Promise<string | undefined>;
  /** Set when the credential itself names a project, so `createDb` can default to it. */
  readonly projectId?: string;
};

export type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

/**
 * Authenticate as a Google service account.
 *
 * Accepts either the parsed object or the raw JSON string, since the credential
 * usually arrives as an environment variable or a secret binding.
 *
 * Tokens are cached until shortly before they expire, which lowers the odds of
 * a request arriving with a stale credential without being able to rule it out
 * entirely. The cache holds a string and an expiry, never a connection or a
 * stream, so it is safe to keep the resulting database instance at module scope
 * on runtimes that forbid reusing I/O objects across requests.
 *
 * Pass `fetch` to route the token exchange through the same instrumented or
 * custom implementation given to `createDb`.
 */
export function serviceAccount(
  credential: string | ServiceAccountJson,
  options: { fetch?: typeof globalThis.fetch } = {},
): AuthProvider {
  const parsed =
    typeof credential === "string"
      ? parseServiceAccountJson(credential)
      : credential;

  const account = validateServiceAccount(parsed);

  let cachedToken: { value: string; expiresAtSeconds: number } | undefined;
  /** Collapses concurrent refreshes onto a single token exchange. */
  let pendingRefresh: Promise<string> | undefined;

  async function refresh(): Promise<string> {
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const assertion = await createSignedJwt(account, issuedAtSeconds);
    const exchanged = await exchangeJwt(
      account.tokenUri,
      assertion,
      options.fetch ?? globalThis.fetch,
    );

    cachedToken = {
      value: exchanged.token,
      expiresAtSeconds: issuedAtSeconds + exchanged.expiresInSeconds,
    };

    return exchanged.token;
  }

  return {
    projectId: account.projectId,
    async getAccessToken() {
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (
        cachedToken &&
        nowSeconds < cachedToken.expiresAtSeconds - REFRESH_MARGIN_SECONDS
      ) {
        return cachedToken.value;
      }

      pendingRefresh ??= refresh().finally(() => {
        pendingRefresh = undefined;
      });

      return await pendingRefresh;
    },
  };
}

/**
 * Delegate to a token source of your own, such as a metadata server, Workload
 * Identity, or a token minted by a surrounding framework.
 */
export function accessToken(
  provider: () => Promise<string> | string,
  options: { projectId?: string } = {},
): AuthProvider {
  return {
    projectId: options.projectId,
    async getAccessToken() {
      return await provider();
    },
  };
}

/** Talk to the Firestore emulator, which accepts unauthenticated requests. */
export function emulator(options: { projectId?: string } = {}): AuthProvider {
  return {
    projectId: options.projectId,
    getAccessToken() {
      return Promise.resolve(undefined);
    },
  };
}

type ValidatedServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  tokenUri: string;
};

function parseServiceAccountJson(raw: string): ServiceAccountJson {
  try {
    return JSON.parse(raw) as ServiceAccountJson;
  } catch {
    throw new Error("The service account credential is not valid JSON");
  }
}

function validateServiceAccount(
  credential: ServiceAccountJson,
): ValidatedServiceAccount {
  /**
   * Checking each field by name means a misconfigured deployment reports the
   * field that is actually missing, rather than a generic shape complaint.
   */
  return {
    projectId: requireField(credential, "project_id"),
    clientEmail: requireField(credential, "client_email"),
    privateKey: requireField(credential, "private_key"),
    tokenUri:
      typeof credential.token_uri === "string" && credential.token_uri
        ? credential.token_uri
        : DEFAULT_TOKEN_URI,
  };
}

function requireField(
  credential: ServiceAccountJson,
  key: "project_id" | "client_email" | "private_key",
): string {
  const value = credential[key];

  if (typeof value !== "string" || value === "") {
    throw new Error(
      `The service account credential is missing the "${key}" field`,
    );
  }

  return value;
}

async function createSignedJwt(
  account: ValidatedServiceAccount,
  issuedAtSeconds: number,
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: account.clientEmail,
    scope: OAUTH_SCOPE,
    aud: account.tokenUri,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + 3600,
  };

  const unsigned = `${base64UrlFromString(JSON.stringify(header))}.${base64UrlFromString(JSON.stringify(claims))}`;
  const signature = await signRs256(unsigned, account.privateKey);

  return `${unsigned}.${signature}`;
}

async function exchangeJwt(
  tokenUri: string,
  assertion: string,
  fetchImpl: typeof globalThis.fetch,
): Promise<{ token: string; expiresInSeconds: number }> {
  const response = await fetchImpl(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");

    throw new FirestoreError({
      status: response.status,
      code: "UNAUTHENTICATED",
      message: `The OAuth token exchange failed with status ${String(response.status)}`,
      details: detail,
    });
  }

  const payload: unknown = await response.json().catch(() => undefined);

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("access_token" in payload) ||
    typeof payload.access_token !== "string"
  ) {
    throw new FirestoreError({
      status: response.status,
      code: "UNAUTHENTICATED",
      message: "The OAuth token exchange response contained no access_token",
    });
  }

  const expiresIn =
    "expires_in" in payload && typeof payload.expires_in === "number"
      ? payload.expires_in
      : 3600;

  return { token: payload.access_token, expiresInSeconds: expiresIn };
}

/**
 * Sign with RSASSA-PKCS1-v1_5 over SHA-256. Web Crypto only imports the raw
 * PKCS#8 payload, so the PEM armor is stripped and the body base64-decoded
 * first.
 */
async function signRs256(data: string, pemPrivateKey: string): Promise<string> {
  let key: CryptoKey;

  try {
    key = await crypto.subtle.importKey(
      "pkcs8",
      pemToDer(pemPrivateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch (cause) {
    throw new FirestoreError({
      status: 0,
      code: "INVALID_ARGUMENT",
      message:
        "The service account private_key could not be parsed as a PKCS#8 RSA key",
      details: cause instanceof Error ? cause.message : String(cause),
    });
  }

  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(data),
  );

  return base64UrlFromBytes(new Uint8Array(signature));
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replaceAll("-----BEGIN PRIVATE KEY-----", "")
    .replaceAll("-----END PRIVATE KEY-----", "")
    .replaceAll(/\s+/g, "");

  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function base64UrlFromString(value: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(value));
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
