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

The reason firebase-admin cannot run on those is structural rather than
incidental. Its Firestore client reaches `@google-cloud/firestore`, which speaks
gRPC over `node:http2` through `google-gax` and `protobufjs`. Edge runtimes do
not provide an `http2` client, so no compatibility flag makes it work.

## Installation

```sh
pnpm add @typed-firestore/rest
```

## Connecting

```ts
import { createDb, serviceAccount } from "@typed-firestore/rest";

export const db = createDb({
  auth: serviceAccount(process.env.SERVICE_ACCOUNT_JSON!),
});
```

The project id is taken from the credential, so it rarely needs to be passed.

### Other credentials

```ts
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
- **Unbounded queries and `processDocuments`.** Every query needs an explicit
  `.limit()`. Without cursor pagination an unbounded query would buffer an
  entire collection, so the constraint is enforced at the call rather than left
  as a production surprise.
- **Collection groups.**
- **`FieldValue` sentinels** such as `serverTimestamp()`, `increment()` and
  `arrayUnion()`.
- **Aggregation** (`count()`).

Everything above is planned. The rest of the API mirrors
[`@typed-firestore/server`](/server/documents), so what you learn there carries
over.
