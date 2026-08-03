# @typed-firestore/rest

Elegant, typed abstractions for Firestore on any runtime with `fetch` and Web
Crypto.

This package talks to Firestore over its REST API instead of through a Firebase
SDK, and has **no dependencies at all**. That makes it the one to reach for
where `firebase-admin` cannot run: Cloudflare Workers, Deno, Bun, and edge
functions.

The limitation is structural rather than incidental. The Firestore client inside
`firebase-admin` reaches `@google-cloud/firestore`, which speaks gRPC over
`node:http2` via `google-gax` and `protobufjs`. Edge runtimes provide no `http2`
client, so no compatibility flag makes it work.

## Install

```sh
pnpm add @typed-firestore/rest
```

## Use

```ts
import {
  createDb,
  getDocument,
  getDocuments,
  serviceAccount,
} from "@typed-firestore/rest";

const db = createDb({
  auth: serviceAccount(process.env.SERVICE_ACCOUNT_JSON!),
});

/** No cast needed; the type argument is supplied directly. */
export const refs = {
  users: db.collection<User>("users"),
  books: db.collection<Book>("books"),
} as const;

const user = await getDocument(refs.users, "abc123");
await user.update({ isActive: true });

const published = await getDocuments(refs.books, (query) =>
  query
    .where("isPublished", "==", true)
    .orderBy("publishedAt", "desc")
    .limit(50),
);
```

## Beyond the SDK

Two capabilities exist here and in `@typed-firestore/server`, but not in the
client packages, because the client SDKs do not expose a document's
`updateTime` at all:

```ts
/** Create at a known id, failing when one already exists. */
const created = await createDocumentMaybe(refs.users, "abc123", data);

/** Compare-and-swap against the version this document was read at. */
const wrote = await user.update({ isActive: true }, { ifUnchanged: true });

if (!wrote) {
  /** Someone wrote first. A value, not an exception. */
}
```

## Not here yet

[Transactions](https://github.com/0x80/typed-firestore/issues/14),
[unbounded queries and `processDocuments`](https://github.com/0x80/typed-firestore/issues/13),
[collection groups](https://github.com/0x80/typed-firestore/issues/16),
[`FieldValue` sentinels](https://github.com/0x80/typed-firestore/issues/15), and
[`count()` aggregation](https://github.com/0x80/typed-firestore/issues/17).
Every query needs an explicit `.limit()` until cursor pagination lands.

## Documentation

<https://typed-firestore.dev/rest/getting-started>

## License

Apache-2.0
