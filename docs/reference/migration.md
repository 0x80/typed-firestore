# Migration Guide

## Server: Migrating to v2

In v2, all functions and types with "InTransaction" in their name have been
renamed to use "Tx" instead.

### Function Renames

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

### Type Renames

| Old Type                         | New Type              |
| -------------------------------- | --------------------- |
| `FsMutableDocumentInTransaction` | `FsMutableDocumentTx` |

## React Native: Deprecated Names

The following names are deprecated but still exported for backwards
compatibility:

| Deprecated Name                      | Use Instead             |
| ------------------------------------ | ----------------------- |
| `getDocumentInTransaction`           | `getDocumentTx`         |
| `getDocumentInTransactionMaybe`      | `getDocumentMaybeTx`    |
| `getSpecificDocumentFromTransaction` | `getSpecificDocumentTx` |
| `makeMutableDocumentInTransaction`   | `makeMutableDocumentTx` |
| `FsMutableDocumentInTransaction`     | `FsMutableDocumentTx`   |
