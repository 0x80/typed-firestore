# React - Write Functions

Standalone functions for creating, updating, and deleting documents without
fetching them first. Useful when you already know the document path and just want
to write.

## API Reference

| Function                 | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `setDocument`            | Create or overwrite a document (supports merge) |
| `setSpecificDocument`    | Create or overwrite a specific document         |
| `updateDocument`         | Partially update an existing document           |
| `updateSpecificDocument` | Partially update an existing specific document  |
| `deleteDocument`         | Delete a document                               |
| `deleteSpecificDocument` | Delete a specific document                      |

The `set*` functions accept an optional `SetOptions` parameter for
`{ merge: true }` or `{ mergeFields: [...] }` behavior. The `*Specific*`
variants accept a `DocumentReference` directly instead of a collection ref + id.

## A Note on Client-Side Mutations

This library provides both document-level mutation methods (on
`FsMutableDocument`) and standalone write functions for performing client-side
writes.

That said, consider having all mutations happen on the server-side via an API
call. This is especially relevant if older versions of your app could be around
for a while, like with mobile apps. A bug in client-side code could have lasting
effects on the consistency of your database.

Facilitating client-side writes in a safe way also requires writing database
rules for your documents, which can get very complex. Mutating documents
server-side is not only easier to reason about but also more secure by default.
