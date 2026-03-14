# Getting Started

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

## Quick Example

### 1. Define your collection refs

All functions are designed to take a reusable typed collection reference as one
of their arguments. The functions infer the other types from it, and apply the
necessary restrictions.

Start by creating a file in which you define refs for all of your database
collections, and map each to the appropriate type.

::: code-group

```ts [Server]
import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firestore";
import type { User, Book } from "./types";

export const refs = {
  users: db.collection("users") as CollectionReference<User>,
  books: db.collection("books") as CollectionReference<Book>,
} as const;
```

```ts [React]
import { collection, type CollectionReference } from "firebase/firestore";
import { db } from "./firestore";
import type { User, Book } from "./types";

export const refs = {
  users: collection(db, "users") as CollectionReference<User>,
  books: collection(db, "books") as CollectionReference<Book>,
} as const;
```

```ts [React Native]
import { collection } from "@react-native-firebase/firestore";
import type { CollectionReference } from "@typed-firestore/react-native";
import { db } from "./firestore";
import type { User, Book } from "./types";

export const refs = {
  users: collection(db, "users") as CollectionReference<User>,
  books: collection(db, "books") as CollectionReference<Book>,
} as const;
```

:::

### 2. Use them

```ts
import { getDocument, getDocuments } from "@typed-firestore/server";
import { refs } from "./db-refs";

/** Get a document — result is typed as FsMutableDocument<User> */
const user = await getDocument(refs.users, userId);

/** The returned document has a typed update function */
await user.update({ is_active: true });

/** Query a collection */
const books = await getDocuments(refs.books, (query) =>
  query.where("is_published", "==", true).limit(50),
);
```

Notice how you never need to import the `User` type or manually type your update
data to satisfy the type constraints. Everything flows from the collection refs.
