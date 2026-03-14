# Typed Firestore

Elegant, typed abstractions for Firestore. Write clean, strongly-typed code
without boilerplate.

> This repository consolidates what were previously three separate packages into
> a single monorepo. The original repositories
> ([typed-firestore-server](https://github.com/0x80/typed-firestore-server),
> [typed-firestore-react](https://github.com/0x80/typed-firestore-react), and
> [typed-firestore-react-native](https://github.com/0x80/typed-firestore-react-native))
> are now archived. The NPM packages and their names remain unchanged.

## Packages

| Package                                                                                        | Description                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- |
| [`@typed-firestore/server`](https://www.npmjs.com/package/@typed-firestore/server)             | Server environments (firebase-admin)  |
| [`@typed-firestore/react`](https://www.npmjs.com/package/@typed-firestore/react)               | React applications (Firebase web SDK) |
| [`@typed-firestore/react-native`](https://www.npmjs.com/package/@typed-firestore/react-native) | React Native (React Native Firebase)  |

## Why Typed Firestore?

Firestore's API gives you `DocumentData` everywhere, leaving type safety up to
you. Typed Firestore fixes that with a simple idea: **define your collection
types once, and let everything else flow from there**.

- **Non-intrusive API** - No lock-in, just thin typed wrappers around the
  official SDKs
- **Type your database once** - Create typed collection refs and all functions
  infer the rest
- **Mutable documents** - Get back documents with typed `update` and `delete`
  methods attached
- **Typed select statements** - Narrow both the data and its type simultaneously
- **Transaction support** - Simplified transaction code with typed document
  handles
- **Collection processing** - Iterate over entire collections with constant
  memory usage via automatic pagination
- **Cloud function helpers** - Get typed data from 2nd gen cloud function events
- **Consistent across platforms** - The same concepts and API patterns on server,
  web, and mobile

## Quick Start

### 1. Define your collection refs

```ts
import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firestore";
import type { User, Book } from "./types";

export const refs = {
  users: db.collection("users") as CollectionReference<User>,
  books: db.collection("books") as CollectionReference<Book>,
} as const;
```

### 2. Use them everywhere

**Server:**

```ts
import { getDocument, getDocuments } from "@typed-firestore/server";

const user = await getDocument(refs.users, userId);
await user.update({ is_active: true });

const books = await getDocuments(refs.books, (query) =>
  query.where("is_published", "==", true).limit(50),
);
```

**React:**

```ts
import { useDocument } from "@typed-firestore/react";

function UserProfile({ userId }: { userId: string }) {
  const [user, isLoading] = useDocument(refs.users, userId);

  if (isLoading) return <Spinner />;

  return <div>{user.data.displayName}</div>;
}
```

**React Native:**

```ts
import { useDocument } from "@typed-firestore/react-native";

// Same API as the React package, but backed by React Native Firebase
const [user, isLoading] = useDocument(refs.users, userId);
```

## Documentation

Detailed documentation for each package can be found in their respective README
files:

- [Server documentation](./packages/server/README.md)
- [React documentation](./packages/react/README.md)
- [React Native documentation](./packages/react-native/README.md)

There is also an
[in-depth article](https://dev.to/0x80/how-to-write-clean-typed-firestore-code-37j2)
explaining the motivation and design behind this library.

## Installation

Install only the package you need:

```sh
# Server (firebase-admin)
pnpm add @typed-firestore/server

# React (Firebase web SDK)
pnpm add @typed-firestore/react

# React Native (React Native Firebase)
pnpm add @typed-firestore/react-native
```

## License

[Apache-2.0](./LICENSE)
