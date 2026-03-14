# React - Error Handling

The hooks in this library throw errors instead of returning them. This is not
common practice, but it is a deliberate choice.

## Why Throw?

Firestore queries only fail on permission errors or missing indexes — both of
which are configuration issues that will always surface during development, never
unexpectedly at runtime. Specifically, the errors you might encounter are:

1. An index is required but has not been created yet.
2. The document does not exist.
3. You do not have permission to read the document.

Since these are all caught during development, you can safely throw and optimize
for the happy-path.

## Loading State Tied to Data

This approach has a nice benefit: the loading state is directly tied to data
availability. If you wait for the loading state from `useDocument()` to become
false, the TypeScript compiler is also guaranteed that the data exists (because
otherwise an error would have been thrown).

```ts
const [user, isLoading] = useDocument(refs.users, userId);

if (isLoading) return <Spinner />;

/** TypeScript knows user.data is available here */
return <div>{user.data.displayName}</div>;
```

## Maybe Variants

In some cases it is expected that the document might not exist. For those
situations, use the `*Maybe` variants like `useDocumentMaybe()`. These functions
do not throw, and simply return `undefined` if the document does not exist.
