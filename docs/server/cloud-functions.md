# Server - Cloud Functions

Helper functions for getting typed data from 2nd gen cloud function events.

## Usage

```ts
import {
  getDataOnWritten,
  getBeforeAndAfterOnWritten,
} from "@typed-firestore/server/functions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

export const handleBookUpdates = onDocumentWritten(
  { document: "books/{documentId}" },
  async (event) => {
    /** Get only the most recent data */
    const data = getDataOnWritten(refs.books, event);

    /** Get the before and after the write event */
    const [before, after] = getBeforeAndAfterOnWritten(refs.books, event);
  },
);
```

The typed collection reference is passed only to facilitate type inference. The
data is extracted from the event, not fetched from the ref.

## Separate Import Path

The cloud function helpers are exported on `@typed-firestore/server/functions`,
so that the `firebase-admin` and `firebase-functions` peer dependencies can both
be optional:

- Import from `@typed-firestore/server` — requires `firebase-admin`, does not
  require `firebase-functions`
- Import from `@typed-firestore/server/functions` — requires
  `firebase-functions`, does not require `firebase-admin`

This only applies to JavaScript imports. TypeScript types do not affect this.

::: info
Only 2nd gen cloud function events are supported.
:::

## API Reference

| Function                     | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `getDataOnCreated`           | Get the data from a document create event                  |
| `getDataOnWritten`           | Get the data from a document write event                   |
| `getDataOnUpdated`           | Get the data from a document update event                  |
| `getBeforeAndAfterOnWritten` | Get the before and after data from a document write event  |
| `getBeforeAndAfterOnUpdated` | Get the before and after data from a document update event |
