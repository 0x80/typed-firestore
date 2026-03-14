# Typing Your Database

The core idea behind Typed Firestore is that you define typed collection
references once, and all API functions infer their types from there.

## Top-Level Collections

For top-level collections, cast the collection reference to a
`CollectionReference<T>`:

```ts
export const refs = {
  users: db.collection("users") as CollectionReference<User>,
  books: db.collection("books") as CollectionReference<Book>,
} as const;
```

## Sub-Collections

For sub-collections, use a function that returns the reference:

```ts
export const refs = {
  userWishlist: (userId: string) =>
    db
      .collection("users")
      .doc(userId)
      .collection("wishlist") as CollectionReference<WishlistItem>,
} as const;
```

## Collection Groups

Collection groups are also supported:

```ts
const groupRef = db.collectionGroup(
  "wishlist",
) as CollectionGroup<WishlistItem>;

const allWishlistItems = await getDocuments(groupRef, (query) =>
  query.where("is_archived", "==", false),
);
```

## Specific Documents

If you have collections with specific documents that have their own distinct
types, you can declare the type for each individual document using a
`DocumentReference`, and use the API that is focused on specific documents, like
`getSpecificDocument`.

## Where Typing Is Not Applied

The query `where()` function still uses the official Firestore API. No
type-safety is provided there. This is a deliberate trade-off for simplicity and
familiarity.

If you make a mistake in a `where()` clause, there is little chance of ruining
data in the database, and you will likely discover the mistake during
development.

Note that `select` statements **are** typed — see the
[Collections](/server/collections) documentation for details.
