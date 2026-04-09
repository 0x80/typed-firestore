# Server - Documents

Functions for handling single Firestore documents on the server.

## Reading Documents

```ts
import { getDocument } from "@typed-firestore/server";

/** Get a document — result is typed as FsMutableDocument<User> */
const user = await getDocument(refs.users, "id123");

/** The returned document has a typed update function */
await user.update({
  is_active: true,
  modified_at: FieldValue.serverTimestamp(),
});
```

### Transactions

All document operations have transaction variants (suffixed with `Tx`). In a
transaction, the update function is synchronous and executes when the transaction
is committed.

```ts
await runTransaction(async (tx) => {
  const user = await getDocumentTx(tx, refs.users, "id123");

  /** Synchronous — executes on commit */
  user.update({
    is_active: true,
    modified_at: FieldValue.serverTimestamp(),
  });
});
```

### Documents That Might Not Exist

Use `getDocumentMaybe` when a document might not exist. It returns `null`
instead of throwing.

```ts
const user = await getDocumentMaybe(refs.users, "id123");
if (user) {
  console.log(user.data.displayName);
}
```

## Writing Documents

```ts
import {
  setDocument,
  updateDocument,
  deleteDocument,
  addDocument,
} from "@typed-firestore/server";

/** Create or overwrite */
await setDocument(refs.users, "id123", {
  displayName: "Alice",
  is_active: true,
});

/** Update specific fields */
await updateDocument(refs.users, "id123", {
  is_active: false,
});

/** Add with auto-generated ID */
await addDocument(refs.users, {
  displayName: "Bob",
  is_active: true,
});

/** Delete */
await deleteDocument(refs.users, "id123");
```

## API Reference

### Single Documents

| Function                            | Description                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `getDocument`                       | Fetch a document                                                                                        |
| `getDocumentMaybe`                  | Fetch a document that might not exist                                                                   |
| `getDocumentTx`                     | Fetch a document as part of a transaction                                                               |
| `getDocumentMaybeTx`                | Fetch a document that might not exist as part of a transaction                                          |
| `getDocumentData`                   | Fetch only the data of a document                                                                       |
| `getDocumentDataMaybe`              | Fetch only the data of a document that might not exist                                                  |
| `getDocumentDataTx`                 | Fetch only the data of a document as part of a transaction                                              |
| `getDocumentDataMaybeTx`            | Fetch only the data of a document that might not exist in a transaction                                 |
| `getSpecificDocument`               | Fetch a document from an inconsistent collection                                                        |
| `getSpecificDocumentMaybe`          | Fetch a document from an inconsistent collection that might not exist                                   |
| `getSpecificDocumentTx`             | Fetch a document from an inconsistent collection in a transaction                                       |
| `getSpecificDocumentMaybeTx`        | Fetch a document from an inconsistent collection that might not exist in a transaction                  |
| `getSpecificDocumentData`           | Fetch only the data of a document from an inconsistent collection                                       |
| `getSpecificDocumentDataMaybe`      | Fetch only the data of a document from an inconsistent collection that might not exist                  |
| `getSpecificDocumentDataMaybeTx`    | Fetch only the data of a document from an inconsistent collection that might not exist in a transaction |
| `addDocument`                       | Add a document with an auto-generated ID                                                                |
| `addDocumentTx`                     | Add a document with an auto-generated ID as part of a transaction                                       |
| `setDocument`                       | Create or overwrite a document                                                                          |
| `setDocumentTx`                     | Create or overwrite a document as part of a transaction                                                 |
| `setSpecificDocument`               | Create or overwrite a specific document                                                                 |
| `setSpecificDocumentTx`             | Create or overwrite a specific document as part of a transaction                                        |
| `updateDocument`                    | Update a document                                                                                       |
| `updateDocumentTx`                  | Update a document as part of a transaction                                                              |
| `updateDocumentWithPartial`         | Update a document with a partial object                                                                 |
| `updateDocumentPartialTx`           | Update a document with a partial object as part of a transaction                                        |
| `updateSpecificDocument`            | Update a specific document                                                                              |
| `updateSpecificDocumentWithPartial` | Update a specific document with a partial object                                                        |
| `updateSpecificDocumentTx`          | Update a specific document as part of a transaction                                                     |
| `updateSpecificDocumentPartialTx`   | Update a specific document with a partial object as part of a transaction                               |
| `deleteDocument`                    | Delete a document                                                                                       |
