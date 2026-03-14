# React Native - Hooks

Typed hooks for subscribing to Firestore documents and collections in React
Native applications, backed by
[React Native Firebase](https://rnfirebase.io/).

## Usage

The API is the same as the [React hooks](/react/hooks), but uses
`@react-native-firebase/firestore` under the hood.

```ts
import { useDocument } from "@typed-firestore/react-native";

function UserProfile({ userId }: { userId: string }) {
  const [user, isLoading] = useDocument(refs.users, userId);

  if (isLoading) return <ActivityIndicator />;

  return <Text>{user.data.displayName}</Text>;
}
```

::: tip
Firestore types from `@react-native-firebase/firestore` can be awkward to work
with. This library re-exports commonly needed types like `CollectionReference`,
`DocumentReference`, and `DocumentData` in a more convenient format.

```ts
import type {
  CollectionReference,
  DocumentReference,
} from "@typed-firestore/react-native";
```

:::

## API Reference

| Hook                           | Description                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| `useDocument`                  | Use a document and subscribe to changes                                    |
| `useDocumentData`              | Use only the data part of a document and subscribe to changes              |
| `useDocumentMaybe`             | Use a document that might not exist                                        |
| `useDocumentDataMaybe`         | Use only the data part of document that might not exist                    |
| `useDocumentOnce`              | Use a document once and do not subscribe for changes                       |
| `useDocumentDataOnce`          | Use only the data part of a document once and do not subscribe for changes |
| `useSpecificDocument`          | Use a document by ref and subscribe to changes                             |
| `useSpecificDocumentData`      | Use only the data part of a document by ref                                |
| `useSpecificDocumentMaybe`     | Use a document by ref that might not exist                                 |
| `useSpecificDocumentDataMaybe` | Use only the data part of a document by ref that might not exist           |
| `useSpecificDocumentOnce`      | Use a document by ref once                                                 |
| `useSpecificDocumentDataOnce`  | Use only the data part of a document by ref once                           |
| `useCollection`                | Query a collection and subscribe for changes                               |
| `useCollectionOnce`            | Query a collection once                                                    |
| `useCollectionMaybe`           | Query a collection, never throw                                            |
| `useCollectionCountOnce`       | Query the number of documents                                              |
