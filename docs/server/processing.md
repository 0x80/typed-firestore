# Server - Processing Collections

Functions for processing many or all documents in a collection. Useful for
analysis or migrating documents to an updated schema.

## Processing Documents

The processing functions are similar to the query functions, but you also pass a
handler that gets called for each document or chunk. Handlers are awaited per
chunk, so memory only holds one chunk at a time.

```ts
import { processDocuments } from "@typed-firestore/server";

/** Process results of a query with a typed select */
await processDocuments(
  refs.books,
  (query) => query.where("is_published", "==", true),
  async (book) => {
    console.log(book.data.author, book.data.title);
  },
  { select: ["author", "title"] },
);

/** Process an entire collection (set query to null) */
await processDocuments(refs.userWishlist(user.id), null, async (item) => {
  await item.update({
    is_archived: false,
    modified_at: FieldValue.serverTimestamp(),
  });
});
```

## Processing Without Data

When you don't need the document data, use `processDocumentRefs` as a
convenience. This is equivalent to calling `processDocuments` with
`{ select: [] }`.

```ts
import { processDocumentRefs } from "@typed-firestore/server";

await processDocumentRefs(refs.books, null, async (book) => {
  /** Only ref, id, update, updateWithPartial, and delete are available */
  await book.delete();
});
```

## Processing By Chunk

If you want the handler to receive the full chunk of documents, and optionally
control the chunk size:

```ts
import { processDocumentsByChunk } from "@typed-firestore/server";

await processDocumentsByChunk(refs.users, null, {
  handler: async (chunk) => {
    /** Handle 10 User documents at once */
  },
  chunkSize: 10,
});
```

## Verbose Logging

For long-running operations, set environment variable `VERBOSE` to `true` or `1`
to have `getDocuments` and `processDocuments` log progress information about
chunks being fetched and processed.

## API Reference

| Function                     | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `processDocuments`           | Query a collection and process the results using a handler per document |
| `processDocumentsByChunk`    | Query a collection and process the results using a handler per chunk    |
| `processDocumentRefs`        | Process document refs without fetching data                             |
| `processDocumentRefsByChunk` | Process document refs by chunk without fetching data                    |
