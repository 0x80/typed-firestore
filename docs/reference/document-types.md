# Document Types

All API functions return a form of `FsDocument<T>`, which conveniently combines
the data and id.

## FsDocument

The immutable document type. Use this for defining functions that do not need to
mutate the data.

```ts
type FsDocument<T> = Readonly<{
  id: string;
  data: T;
}>;
```

## FsMutableDocument

All API abstractions return this mutable variant, which adds a typed `update`
function and the original `ref`.

```ts
type FsMutableDocument<T> = Readonly<{
  id: string;
  data: T;
  ref: DocumentReference<T>;
  update: (data: UpdateData<T>) => Promise<void>;
  updateWithPartial: (data: PartialWithFieldValue<T>) => Promise<void>;
  delete: () => Promise<void>;
}>;
```

The hooks return mutable documents, but thanks to TypeScript structural typing,
you can pass them along as if they were immutable `FsDocument` types.

### update vs updateWithPartial

The `update` function is typed using Firestore's `UpdateData<T>` type, but this
type does not allow you to pass nested objects partially, so it can reject data
that is actually valid.

In those situations, use `updateWithPartial` instead. This function uses
Firestore's `PartialWithFieldValue<T>` type. The two flavors are purely about
typing and have identical behavior. Simply try `update()` first, and if the
compiler does not accept it, try `updateWithPartial()`.

## FsMutableDocumentTx

In transactions, the type is slightly different, preserving the ability to chain
transaction operations.

```ts
type FsMutableDocumentTx<T> = Readonly<{
  id: string;
  data: T;
  ref: DocumentReference<T>;
  update: (data: UpdateData<T>) => Transaction;
  updateWithPartial: (data: PartialWithFieldValue<T>) => Transaction;
  delete: () => Transaction;
}>;
```
