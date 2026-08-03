import { beforeAll, describe, expect, it, vi } from "vitest";
import { accessToken, emulator, serviceAccount } from "./auth";

/**
 * A real RSA key pair is generated once so the signing path is exercised end to
 * end and the resulting JWT can be verified with the matching public key. A
 * fixture key would prove less and still cost a key import per run.
 */
let privateKeyPem: string;
let publicKey: CryptoKey;

function toPem(der: ArrayBuffer): string {
  const bytes = new Uint8Array(der);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const base64 = btoa(binary).replace(/(.{64})/g, "$1\n");

  return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----\n`;
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );

  privateKeyPem = toPem(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  );
  publicKey = pair.publicKey;
});

function credential(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    project_id: "test-project",
    client_email: "svc@test-project.iam.gserviceaccount.com",
    private_key: privateKeyPem,
    ...overrides,
  });
}

function decodeSegment(segment: string): Record<string, unknown> {
  const padded = segment.replaceAll("-", "+").replaceAll("_", "/");

  return JSON.parse(atob(padded)) as Record<string, unknown>;
}

/**
 * A fresh Response per call. A Response body can only be consumed once, so a
 * single shared instance would fail on the second exchange rather than telling
 * us anything about the cache.
 */
function stubTokenExchange(expiresIn = 3600) {
  const fetchSpy = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ access_token: "token-1", expires_in: expiresIn }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

  vi.stubGlobal("fetch", fetchSpy);

  return fetchSpy;
}

describe("serviceAccount", () => {
  it("takes the project id from the credential", () => {
    expect(serviceAccount(credential()).projectId).toBe("test-project");
  });

  it("names the field that is missing", () => {
    expect(() =>
      serviceAccount(credential({ client_email: undefined })),
    ).toThrow(/client_email/);
  });

  it("rejects a credential that is not JSON", () => {
    expect(() => serviceAccount("not json")).toThrow(/not valid JSON/);
  });

  it("signs a verifiable RS256 assertion with the expected claims", async () => {
    const fetchSpy = stubTokenExchange();

    const token = await serviceAccount(credential()).getAccessToken();

    expect(token).toBe("token-1");

    const body = fetchSpy.mock.calls[0]?.[1]?.body;

    if (typeof body !== "string") {
      expect.unreachable("the token exchange should send a form-encoded body");
    }

    const assertion = new URLSearchParams(body).get("assertion");

    expect(assertion).toBeTruthy();

    const [header, claims, signature] = assertion!.split(".");

    expect(decodeSegment(header!)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(decodeSegment(claims!)).toMatchObject({
      iss: "svc@test-project.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
    });

    const signatureBytes = Uint8Array.from(
      atob(signature!.replaceAll("-", "+").replaceAll("_", "/")),
      (character) => character.charCodeAt(0),
    );

    await expect(
      crypto.subtle.verify(
        { name: "RSASSA-PKCS1-v1_5" },
        publicKey,
        signatureBytes,
        new TextEncoder().encode(`${header!}.${claims!}`),
      ),
    ).resolves.toBe(true);

    vi.unstubAllGlobals();
  });

  it("reuses a cached token instead of minting one per call", async () => {
    const fetchSpy = stubTokenExchange();

    const auth = serviceAccount(credential());

    await auth.getAccessToken();
    await auth.getAccessToken();
    await auth.getAccessToken();

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("collapses concurrent refreshes onto one exchange", async () => {
    const fetchSpy = stubTokenExchange();

    const auth = serviceAccount(credential());

    await Promise.all([
      auth.getAccessToken(),
      auth.getAccessToken(),
      auth.getAccessToken(),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("refreshes once the token is inside the expiry margin", async () => {
    /** Shorter than the 60 second refresh margin, so never reusable. */
    const fetchSpy = stubTokenExchange(30);

    const auth = serviceAccount(credential());

    await auth.getAccessToken();
    await auth.getAccessToken();

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });

  it("surfaces a failed exchange as an authentication error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response("nope", { status: 401 })),
    );

    await expect(serviceAccount(credential()).getAccessToken()).rejects.toThrow(
      /OAuth token exchange failed/,
    );

    vi.unstubAllGlobals();
  });

  it("rejects a private key that is not a PKCS#8 RSA key", async () => {
    const auth = serviceAccount(
      credential({
        private_key:
          "-----BEGIN PRIVATE KEY-----\nbm90YWtleQ==\n-----END PRIVATE KEY-----",
      }),
    );

    await expect(auth.getAccessToken()).rejects.toThrow(/PKCS#8/);
  });
});

describe("other providers", () => {
  it("delegates to a supplied token source", async () => {
    await expect(
      accessToken(() => "from-metadata-server").getAccessToken(),
    ).resolves.toBe("from-metadata-server");
  });

  it("sends no credential for the emulator", async () => {
    await expect(emulator().getAccessToken()).resolves.toBeUndefined();
  });
});
