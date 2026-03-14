# Server - Collections

Functions for querying Firestore collections on the server.

## Querying

```ts
import { getDocuments } from "@typed-firestore/server";

/** Fetch an entire collection */
const allBooks = await getDocuments(refs.books);

/** Fetch with a query */
const publishedBooks = await getDocuments(refs.books, (query) =>
  query
    .where("is_published", "==", true)
    .orderBy("published_at", "desc")
    .limit(50),
);
```

## Typed Select Statements

With a select statement, the data and type can be narrowed simultaneously:

```ts
/** publishedBooks is typed as FsMutableDocument<Pick<Book, "author" | "title">>[] */
const publishedBooks = await getDocuments(
  refs.books,
  (query) => query.where("is_published", "==", true),
  { select: ["author", "title"] },
);
```

::: warning
A `select` must always be defined separately from the query, as a second
argument. Using `.select()` directly on the query is detected at runtime and
throws an error, because the return type cannot be narrowed correctly that way.
:::

## Collection Groups

All collection functions also work with collection groups:

```ts
const groupRef = db.collectionGroup(
  "wishlist",
) as CollectionGroup<WishlistItem>;

const allWishlistItems = await getDocuments(groupRef, (query) =>
  query.where("is_archived", "==", false),
);
```

## Pagination

If you do not set a `limit` on the query, documents are internally fetched using
pagination. This allows you to fetch unlimited documents with constant memory
usage.

If you use a `limit`, pagination is disabled and all documents are fetched in one
go. Firestore has a limit of 1000 documents per query.

## API Reference

| Function             | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `getDocuments`       | Fetch documents using a query                              |
| `getDocumentsTx`     | Fetch documents using a query as part of a transaction     |
| `getFirstDocument`   | Fetch the first result of a query                          |
| `getFirstDocumentTx` | Fetch the first result of a query as part of a transaction |
