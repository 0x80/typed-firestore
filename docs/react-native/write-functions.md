# React Native - Write Functions

Standalone functions for creating, updating, and deleting documents without
fetching them first.

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

See [React - Write Functions](/react/write-functions) for notes on client-side
mutations.
