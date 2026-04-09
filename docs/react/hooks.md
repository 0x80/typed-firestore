# React - Hooks

Typed hooks for subscribing to Firestore documents and collections in React
applications.

## useDocument

```ts
import { useDocument } from "@typed-firestore/react";

function UserProfile({ userId }: { userId: string }) {
  /** Returns user as FsMutableDocument<User> */
  const [user, isLoading] = useDocument(refs.users, userId);

  if (isLoading) return <Spinner />;

  /** TypeScript knows user.data is available because isLoading is false */
  return <div>{user.data.displayName}</div>;
}
```

Notice how you don't need to import the `User` type or manually type your data.
Everything flows from the collection refs.

## useCollection

```ts
import { useCollection } from "@typed-firestore/react";
import { where, limit } from "firebase/firestore";

function BookList() {
  const [books, isLoading] = useCollection(
    refs.books,
    where("is_published", "==", true),
    limit(20),
  );

  if (isLoading) return <Spinner />;

  return books.map((book) => <div key={book.id}>{book.data.title}</div>);
}
```

## API Reference

| Hook                      | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| `useDocument`             | Use a document and subscribe to changes                                    |
| `useDocumentData`         | Use only the data part of a document and subscribe to changes              |
| `useDocumentMaybe`        | Use a document that might not exist                                        |
| `useDocumentOnce`         | Use a document once and do not subscribe for changes                       |
| `useDocumentDataOnce`     | Use only the data part of a document once and do not subscribe for changes |
| `useSpecificDocument`     | Use a document by ref and subscribe to changes                             |
| `useSpecificDocumentData` | Use only the data part of a document by ref                                |
| `useCollection`           | Query a collection and subscribe for changes                               |
| `useCollectionOnce`       | Query a collection once and do not subscribe for changes                   |
