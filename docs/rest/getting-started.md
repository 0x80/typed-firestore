# REST: Getting Started

`@typed-firestore/rest` talks to Firestore over its REST API instead of through
a Firebase SDK. It has **no dependencies at all** and needs only two things from
its host: `fetch` and `crypto.subtle`.

That makes it the package to reach for when the official SDK cannot run:

| Runtime                         | firebase-admin | this package |
| ------------------------------- | -------------- | ------------ |
| Node                            | yes            | yes          |
| Cloudflare Workers (workerd)    | no             | yes          |
| Deno Deploy                     | no             | yes          |
| Bun                             | partly         | yes          |
| Vercel / Netlify edge functions | no             | yes          |

Where firebase-admin does not fully run, the reason is structural rather than
incidental. Its Firestore client reaches `@google-cloud/firestore`, which speaks
gRPC over `node:http2` through `google-gax` and `protobufjs`. Edge runtimes
provide no `http2` client at all, so no compatibility flag makes it work; Bun
implements enough of Node to get partway, which is its own kind of trouble.

## Installation

```sh
pnpm add @typed-firestore/rest
```

## Connecting

```ts
import { createDb, serviceAccount } from "@typed-firestore/rest";

/**
 * `serviceAccount` takes the credential as a value, so read it however your
 * runtime supplies one: `process.env` on Node, `Deno.env.get`, or the `env`
 * binding a Cloudflare Worker receives.
 */
export const db = createDb({
  auth: serviceAccount(serviceAccountJson),
});
```

The project id is taken from the credential, so it rarely needs to be passed.

### Other credentials

```ts
import { accessToken, createDb, emulator } from "@typed-firestore/rest";

/** Bring your own token, from a metadata server or Workload Identity. */
createDb({
  projectId: "my-project",
  auth: accessToken(async () => await fetchTokenSomehow()),
});

/** The local emulator, which accepts unauthenticated requests. */
createDb({
  projectId: "my-project",
  auth: emulator(),
  host: "http://127.0.0.1:8080",
});
```

### Token caching

Access tokens are cached until shortly before they expire, and concurrent
refreshes collapse onto a single exchange. The cache holds a string and an
expiry, never a socket or a stream, so the database instance is safe to keep at
module scope even on runtimes that forbid reusing I/O objects across requests.

## Typing your database

Because the type argument is supplied directly, there is no cast here. The other
packages need `db.collection("users") as CollectionReference<User>` because they
are narrowing the SDK's own return type; nothing is being narrowed in this one.

```ts
import { db } from "./db";
import type { Book, User, WishlistItem } from "./types";

export const refs = {
  users: db.collection<User>("users"),
  books: db.collection<Book>("books"),
  userWishlist: (userId: string) =>
    db.collection<WishlistItem>(`users/${userId}/wishlist`),
} as const;
```

## Reading and writing

```ts
import {
  getDocument,
  getDocumentMaybe,
  getDocuments,
  updateDocument,
} from "@typed-firestore/rest";

const user = await getDocument(refs.users, "abc123");
console.log(user.data.name);

await user.update({ isActive: true });

const published = await getDocuments(refs.books, (query) =>
  query
    .where("isPublished", "==", true)
    .orderBy("publishedAt", "desc")
    .limit(50),
);
```

## What is not here yet

This is a young package, and these are the gaps worth knowing about before you
adopt it:

- **Transactions.** `beginTransaction` and `commit` over REST are a real piece of
  work, including retry on `ABORTED`. Not in this version.
  ([#14](https://github.com/0x80/typed-firestore/issues/14))
- **Unbounded queries and `processDocuments`.** Every query needs an explicit
  `.limit()`. Without cursor pagination an unbounded query would buffer an
  entire collection, so the constraint is enforced at the call rather than left
  as a production surprise.
  ([#13](https://github.com/0x80/typed-firestore/issues/13))
- **Collection groups.**
  ([#16](https://github.com/0x80/typed-firestore/issues/16))
- **`FieldValue` sentinels** such as `serverTimestamp()`, `increment()` and
  `arrayUnion()`.
  ([#15](https://github.com/0x80/typed-firestore/issues/15))
- **Aggregation** (`count()`).
  ([#17](https://github.com/0x80/typed-firestore/issues/17))

Everything above is planned. The rest of the API mirrors
[`@typed-firestore/server`](/server/documents), so what you learn there carries
over.
