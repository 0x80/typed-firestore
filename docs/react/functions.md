# React - Functions

Non-hook fetch functions for use outside of components. Useful when you want to
fetch data with libraries like React Query.

## Usage with React Query

```ts
import { getDocument } from "@typed-firestore/react";

const { data, isError } = useQuery({
  queryKey: [collectionRef.path, documentId],
  queryFn: () => getDocument(collectionRef, documentId),
});
```

## API Reference

| Function                  | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `getDocument`             | Fetch a document                                               |
| `getDocumentData`         | Fetch only the data part of a document                         |
| `getDocumentMaybe`        | Fetch a document that might not exist                          |
| `getDocumentDataMaybe`    | Fetch only the data part of a document that might not exist    |
| `getDocumentTx`           | Fetch a document as part of a transaction                      |
| `getDocumentMaybeTx`      | Fetch a document that might not exist as part of a transaction |
| `getSpecificDocument`     | Fetch a specific document                                      |
| `getSpecificDocumentData` | Fetch only the data part of a specific document                |
| `getSpecificDocumentTx`   | Fetch a specific document as part of a transaction             |
