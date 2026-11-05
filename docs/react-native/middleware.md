---
description: "Run your own code around every read and listener of the Typed Firestore React Native hooks and functions, for example to log reads or report errors."
---

# React Native - Middleware

Reads in this library go through a small middleware layer: the hooks, the fetch
functions, and the exported `getDoc`, `getDocs`, `getCount`, `onDocSnapshot` and
`onDocsSnapshot`. Register middleware once at startup to log reads or report
Firestore errors in one place.

Reads that skip the middleware: transaction reads (`getDocumentTx`,
`getDocumentMaybeTx` and `getSpecificDocumentTx`), and any read you make with
React Native Firebase directly.

::: warning
This API is experimental and may change in a minor release.
:::

## Registering middleware

| Function                                        | Wraps                   |
| ----------------------------------------------- | ----------------------- |
| `experimental_registerGetDocMiddleware`         | Reading a document once |
| `experimental_registerGetDocsMiddleware`        | Running a query once    |
| `experimental_registerGetCountMiddleware`       | Counting a query        |
| `experimental_registerOnDocSnapshotMiddleware`  | Document listeners      |
| `experimental_registerOnDocsSnapshotMiddleware` | Query listeners         |

A middleware receives the context of the read and a `next` function. Call `next`
to continue, with the same or a changed context, and return its result.
Middleware runs in the order it was registered.

| Middleware    | Context                                                      | Type                       |
| ------------- | ------------------------------------------------------------ | -------------------------- |
| Get doc       | `reference`, `source` (`"default"`, `"cache"` or `"server"`) | `GetDocMiddleware`         |
| Get docs      | `query`, `source`                                            | `GetDocsMiddleware`        |
| Get count     | `query`                                                      | `GetCountMiddleware`       |
| Doc snapshot  | `reference`, `options`, `onNext`, `onError`                  | `OnDocSnapshotMiddleware`  |
| Docs snapshot | `query`, `options`, `onNext`, `onError`                      | `OnDocsSnapshotMiddleware` |

Use the types to define a middleware in its own module. The contexts are
exported too, as `GetDocContext` and so on.

Each register function returns a function that removes the middleware again.

Fast Refresh re-runs a component file when you edit it, but not this library,
so middleware registered at the top of a component file is added again on every
edit. Register it in a file that exports no components and is imported from
your entry file instead: editing such a file reloads the whole app. Inside a
component, register in an effect and return the result:

```ts
useEffect(() => experimental_registerGetDocMiddleware(logRead), []);
```

## Reporting errors

```ts
import {
  experimental_registerGetDocMiddleware,
  experimental_registerOnDocSnapshotMiddleware,
} from "@typed-firestore/react-native";

experimental_registerOnDocSnapshotMiddleware((context, next) =>
  next({
    ...context,
    onError: (error) => {
      context.onError(error);
      reportError(error, { path: context.reference.path });
    },
  }),
);

experimental_registerGetDocMiddleware((context, next) => {
  const read = next(context);
  void read.catch((error) =>
    reportError(error, { path: context.reference.path }),
  );
  return read;
});
```

Both examples hand the error on before reporting it, so a reporter that throws
can't keep the error from the caller or replace it with its own.

A listener middleware that doesn't call `context.onError` keeps the error from
reaching the hook, which then keeps reporting that it is loading. Use this only
for errors you expect, such as a permission error on a document the user can't
read yet.
