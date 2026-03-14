# Typed Firestore - Server

Elegant, typed abstractions for Firestore in server environments.

- A non-intrusive, use-to-use API without lock-in
- Write clean, strongly-typed code, without boilerplate
- Get correctly typed data when using select statements
- Simplify transaction code
- Conveniently get data from cloud function events
- Easily process entire collections
- Minimize the risk of mistakes

For React applications check out
[@typed-firestore/react](https://github.com/0x80/typed-firestore-react) which
applies the same concepts.

For React Native applications, see
[@typed-firestore/react-native](https://github.com/0x80/typed-firestore-react-native).

💡 Check out my
[in-depth article](https://dev.to/0x80/how-to-write-clean-typed-firestore-code-37j2)
about this library.

## Installation

`pnpm add @typed-firestore/server`, or the equivalent for your package manager.

## Usage

### Typing Your Database

All functions are designed to take a re-usable typed collection reference as one
of their arguments. The functions can infer the other types from it, and apply
the necessary restrictions.

Start by creating a file in which you define refs for all of your database
collections, and map each to the appropriate type, as shown below.

```ts
// db-refs.ts
import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firestore";
import { User, WishlistItem, Book } from "./types";

export const refs = {
  /** For top-level collections it's easy */
  users: db.collection("users") as CollectionReference<User>,
  books: db.collection("books") as CollectionReference<Book>,
  /** For sub-collections you could use a function that returns the reference. */
  userWishlist: (userId: string) =>
    db
      .collection("users")
      .doc(userId)
      .collection("wishlist") as CollectionReference<WishlistItem>,

  /** This object never needs to change */
} as const;
```

The example above assumes that the documents in each collection are typed
uniformly, which is typically the case.

If you have collections with specific documents that have their own distinct
types, you can declare the type for each individual document using a
`DocumentReference`, and the API that is focused on specific documents, like
`getSpecificDocument`.

### Handling Single Documents

```ts
import { refs } from "./db-refs";
import { getDocument } from "@typed-firestore/server";

/** Get a document, the result will be typed to FsMutableDocument<User> */
const user = await getDocument(refs.users, "id123");

/** The returned document has a typed update function */
await user.update({
  /** Properties here will be restricted to what is available in the User type */
  is_active: true,
  /** Field values are allowed to be passed for any of the defined properties */
  modified_at: FieldValue.serverTimestamp(),
});

/** Helps with writing transactions */
await runTransaction(async (tx) => {
  /** Get a document as part of a transaction */
  const user = await getDocumentTx(tx, refs.users, "id123");

  /**
   * In this case, the update function calls the transaction, and is therefore
   * not async. Instead, it will execute when the transaction is committed.
   */
  user.update({
    /** Properties here will be restricted to what is available in the User type */
    is_active: true,
    /** Field values are allowed to be passed for any of the defined properties */
    modified_at: FieldValue.serverTimestamp(),
  });
});
```

### Querying Collections

When fetching documents from a collection you can choose to pass a query, and
without it, you will get the entire collection. If no limit is set, documents
are internally fetched using pagination.

```ts
/**
 * Fetch an entire collection, where allBooks is typed to
 * FsMutableDocument<Book>[]
 */
const allBooks = await getDocuments(refs.books);

/** Fetch documents using a query */
const publishedBooks = await getDocuments(refs.books, (query) =>
  query
    .where("is_published", "==", true)
    .orderBy("published_at", "desc")
    .limit(50),
);

/**
 * With a select statement, the data and type can be narrowed simultaneously. In
 * this example, publishedBooks is typed as FsMutableDocument<Pick<Book,
 * "author"
 *
 * | "title">>[]
 */
const publishedBooks = await getDocuments(
  refs.books,
  (query) => query.where("is_published", "==", true),
  /**
   * A select should be declared separate from the query, because otherwise we
   * can not type the result properly. A select statement directly on the query
   * is detected and results in an error.
   */
  { select: ["author", "title"] },
);
```

All functions also support collection groups:

```ts
const groupRef = db.collectionGroup(
  "wishlist",
) as CollectionGroup<WishlistItem>;

const allWishlistItems = await getDocuments(groupRef, (query) =>
  query.where("is_archived", "==", false),
);
```

### Processing Collections

It is common to want to process many or all documents in a collection. For
example when you want to make an analysis or migrate documents to an updated
schema type.

The processing functions are very similar to the query functions, but in
addition you pass a handler that gets called for each document, or each chunk of
documents.

The handlers are awaited for each chunk of documents, so memory only has to hold
on to one chunk at a time, making it possible to iterate over unlimited amounts
of documents with constant low memory usage.

The query part again is optional, and without it you will process the entire
collection.

```ts
import { refs } from "./db-refs";
import { processDocuments } from "@typed-firestore/server";

/**
 * Process the results of a query, including an optional typed select
 * statement.
 */
await processDocuments(refs.books,
  (query) => query.where("is_published", "==", true),
  async (book) => {
    /** Only title and is_published are available here, because we selected them below */
    console.log(book.author, book.title);
  },
  /**
   * Select should be defined separately from the query, because otherwise we can not narrow the type.
   */
  { select: ["author", "title"] }
);

/**
 * Process an entire collection by setting the query to null. This is typically
 * useful if you need to migrate data after the document type changes.
 */
await processDocuments(refs.userWishlist(user.id), null,
  async (item) => {
    /** The returned document has a typed update function */
    await item.update({
      /** Properties here will be restricted to what is available in the type */
      is_archived: false,
      /** Field values are allowed to be passed for any of the defined properties */
      modified_at: FieldValue.serverTimestamp(),
    });
  },
  /** Pass an empty select for efficiency if you do not use any data */
  { select: [] }
);

/**
 * When you don't need the document data at all, use processDocumentRefs as a
 * convenience. This is equivalent to calling processDocuments with { select: [] }.
 */
await processDocumentRefs(refs.books, null, async (book) => {
  /** Only ref, id, update, updateWithPartial, and delete are available */
  await book.delete();
});

/**
 * If you want the handler function to receive the full chunk of documents, there is a function for that. And in addition you can control the chunk size.
 */
await processDocumentsByChunk(refs.users, null, {
  handler: async (chunk) => {
    // Handle 10 User documents at once
  },
  { chunkSize: 10 },
});
```

For these types of long-running operations, I like to have some visual feedback
to follow the progress. Set environment variable `VERBOSE` to `true` or `1`, to
have the `getDocuments` and `processDocuments` function log information to the
console about the chunks that are being fetched and processed.

### Cloud Function Utilities

For cloud functions, there are helpers to get typed data from the event.

```ts
import {
  getDataOnWritten,
  getBeforeAndAfterOnWritten,
} from "@typed-firestore/server/functions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

export const handleBookUpdates = onDocumentWritten(
  {
    document: "books/{documentId}",
  },
  async (event) => {
    /** Get only the most recent data */
    const data = getDataOnWritten(refs.books, event);

    /** Get the before and after the write event */
    const [before, after] = getBeforeAndAfterOnWritten(refs.books, event);
  },
);
```

Here we pass the typed collection reference only to facilitate the type
inference, and to keep things consistent. The data is extracted from the event
and not fetched from the ref.

## Keep Select Separate from Query

The functions that work with collections should look very familiar, with the
exception of the `select` option.

A `select` should always be defined separately from the query, otherwise the
returned type will not be narrowed correctly.

Because the query part is still the original Firestore API, nothing will prevent
you from using a `select` on the query directly, but it will be detected at
runtime and an error will be thrown.

## Limit Disables Pagination

If you use a `limit` on the query, it will be detected and the pagination
mechanism will be disabled. As a result, all documents will be fetched in one
go.

Firestore has a limit of `1000` documents per query, so setting a limit of
`1001` or higher should result in an error. If you do not set a limit,
pagination will allow you to fetch unlimited documents (in the case of
`processDocuments`) or as much as your memory can hold (in the case of
`getDocuments`).

## API

### Document Types

All functions return a form of `FsDocument<T>`, which conveniently combines the
data and id. You can use this type for defining function that do not need to
mutate the data, like `function readBook(book: FsDocument<Book>){}`

```ts
type FsDocument<T> = Readonly<{
  id: string;
  data: T;
}>;
```

A mutable variant called `FsMutableDocument<T>` is what all API abstractions
return, and it provides an additional typed `update` function and the original
`ref` in case you need to call any other native Firestore APIs.

```ts
type FsMutableDocument<T> = Readonly<{
  id: string;
  data: T;
  ref: DocumentReference<T>;
  update: (data: UpdateData<T>) => void;
  updateWithPartial: (data: PartialWithFieldValue<T>) => void;
  delete: () => void;
}>;
```

The `update` function is typed using Firestore's `UpdateData<T>` type, but this
type does not allow you to pass nested object partially, so it can reject data
that is actually valid.

In those situations you should be able to use `updateWithPartial` instead. This
function uses Firestore's `PartialWithFieldValue<T>` type. The two flavors are
purely about typing, and have identical behavior. You can simply try `update()`
first and if the compiler does not accept it, try `updateWithPartial()` instead.

In transactions, the type is slightly different, preserving the ability to chain
transaction operations if you want.

```ts
export type FsMutableDocumentTx<T> = {
  id: string;
  data: T;
  ref: DocumentReference<T>;
  update: (data: UpdateData<T>) => Transaction;
  updatePartial: (data: PartialWithFieldValue<T>) => Transaction;
  delete: () => Transaction;
};
```

### Single Documents

| Function                    | Description                                                               |
| --------------------------- | ------------------------------------------------------------------------- |
| `getDocument`               | Fetch a document                                                          |
| `getDocumentMaybe`          | Fetch a document that might not exist                                     |
| `getDocumentTx`             | Fetch a document as part of a transaction                                 |
| `getDocumentMaybeTx`        | Fetch a document that might not exist as part of a transaction            |
| `getSpecificDocument`       | Fetch a document from an inconsistent collection                          |
| `getSpecificDocumentTx`     | Fetch a document from an inconsistent collection as part of a transaction |
| `addDocument`               | Add a document with an auto-generated ID                                  |
| `addDocumentTx`             | Add a document with an auto-generated ID as part of a transaction         |
| `setDocument`               | Create or overwrite a document                                            |
| `setDocumentTx`             | Create or overwrite a document as part of a transaction                   |
| `setSpecificDocument`       | Create or overwrite a specific document                                   |
| `setSpecificDocumentTx`     | Create or overwrite a specific document as part of a transaction          |
| `updateDocument`            | Update a document                                                         |
| `updateDocumentTx`          | Update a document as part of a transaction                                |
| `updateDocumentWithPartial` | Update a document with a partial object                                   |
| `updateDocumentPartialTx`   | Update a document with a partial object as part of a transaction          |
| `deleteDocument`            | Delete a document                                                         |

### Collections and Queries

| Function                     | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `getDocuments`               | Fetch documents using a query                                           |
| `getDocumentsTx`             | Fetch documents using a query as part of a transaction                  |
| `getFirstDocument`           | Fetch the first result of a query                                       |
| `getFirstDocumentTx`         | Fetch the first result of a query as part of a transaction              |
| `processDocuments`           | Query a collection and process the results using a handler per document |
| `processDocumentsByChunk`    | Query a collection and process the results using a handler per chunk    |
| `processDocumentRefs`        | Process document refs without fetching data (convenience for select:[]) |
| `processDocumentRefsByChunk` | Process document refs by chunk without fetching data                    |

These functions will also work for collection groups.

## Migrate to v2

In v2, all functions and types with "InTransaction" in their name have been
renamed to use "Tx" instead. The old names are deprecated and will be removed in
the next major version.

### Function Rename Map

| Old Name                                         | New Name                          |
| ------------------------------------------------ | --------------------------------- |
| `getDocumentInTransaction`                       | `getDocumentTx`                   |
| `getDocumentInTransactionMaybe`                  | `getDocumentMaybeTx`              |
| `getDocumentDataInTransaction`                   | `getDocumentDataTx`               |
| `getDocumentDataInTransactionMaybe`              | `getDocumentDataMaybeTx`          |
| `getSpecificDocumentInTransaction`               | `getSpecificDocumentTx`           |
| `getSpecificDocumentInTransactionMaybe`          | `getSpecificDocumentMaybeTx`      |
| `getSpecificDocumentDataInTransactionMaybe`      | `getSpecificDocumentDataMaybeTx`  |
| `setDocumentInTransaction`                       | `setDocumentTx`                   |
| `setSpecificDocumentInTransaction`               | `setSpecificDocumentTx`           |
| `updateDocumentInTransaction`                    | `updateDocumentTx`                |
| `updateDocumentWithPartialInTransaction`         | `updateDocumentPartialTx`         |
| `updateSpecificDocumentInTransaction`            | `updateSpecificDocumentTx`        |
| `updateSpecificDocumentWithPartialInTransaction` | `updateSpecificDocumentPartialTx` |
| `getDocumentsInTransaction`                      | `getDocumentsTx`                  |
| `getDocumentsDataInTransaction`                  | `getDocumentsDataTx`              |
| `getFirstDocumentInTransaction`                  | `getFirstDocumentTx`              |
| `getFirstDocumentDataInTransaction`              | `getFirstDocumentDataTx`          |

### Type Rename Map

| Old Type                         | New Type              |
| -------------------------------- | --------------------- |
| `FsMutableDocumentInTransaction` | `FsMutableDocumentTx` |

### Cloud Functions

In cloud functions, you typically get the data from the event and then act on
it. The following convenience functions take the event and return typed data.

| Function                     | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `getDataOnCreated`           | Get the data from a document create event                  |
| `getDataOnWritten`           | Get the data from a document write event                   |
| `getDataOnUpdated`           | Get the data from a document update event                  |
| `getBeforeAndAfterOnWritten` | Get the before and after data from a document write event  |
| `getBeforeAndAfterOnUpdated` | Get the before and after data from a document update event |

Note that the functions are exported on `@typed-firestore/server/functions`, so
that the `firebase-admin` and `firebase-functions` peer-dependencies can both be
optional.

As long as you only import code from `@typed-firestore/server`, you shouldn't
need `firebase-functions`, and as long as you only import code from
`@typed-firestore/server/functions`, you shouldn't need `firebase-admin`.

That is only about importing Javascript code. Types should not affect this.

The cloud functions utilities are only supporting 2nd gen cloud function events.

## Sharing Types Between Server and Client

When you share your document types between your server and client code, you
might run into a problem with the `Timestamp` type, because the web and server
SDKs currently have slightly incompatible types. The web timestamp has a
`toJSON`method which doesn't exist on the server.

The way I work around this, is by using a type alias called `FsTimestamp` in all
of my document types. Then, in each of the client-side or server-side
applications, I declare this type globally in a `global.d.ts` file.

For web it looks like this:

```ts
import type { Timestamp } from "firebase/firestore";

declare global {
  type FsTimestamp = Timestamp;
}
```

For my server code it looks like this:

```ts
import type { Timestamp } from "firebase-admin/firestore";

declare global {
  type FsTimestamp = Timestamp;
}
```

## Where Typing Was Ignored

You might have noticed that the query `where()` function is still using the
official Firestore API. No type-safety is provided there at the moment. I think
this part would be quite difficult to type fully, and I fear the API shape would
have to be very different.

Besides wanting strong typing, I also want these abstractions to be
non-intrusive and easy-to-adopt. I would argue that the `where()` clause is the
least critical part anyway. If you make a mistake with it, there is little to no
chance to ruin things in the database and you will likely discover the mistake
already during development.

It might even be possible to create a fully-typed query builder function that
looks like the current official API, by using some advanced type gymnastics, but
that seems to be outside of my current skills, and it is not something I am
willing to spend a lot of time on.

For now, this trade-off for the sake of simplicity and familiarity, is something
I am perfectly comfortable with.

Note that the Typescript compiler will still let you write the `select`
statement directly on the query, but the library detects this and will throw an
error if you do.
