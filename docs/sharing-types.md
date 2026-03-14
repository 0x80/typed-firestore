# Sharing Types Between Server and Client

When you share your document types between your server and client code, you
might run into a problem with the `Timestamp` type, because the web and server
SDKs currently have slightly incompatible types. The web timestamp has a
`toJSON` method which doesn't exist on the server.

The way to work around this is by using a type alias called `FsTimestamp` in all
of your document types. Then, in each of the client-side or server-side
applications, declare this type globally in a `global.d.ts` file.

## Web

```ts
import type { Timestamp } from "firebase/firestore";

declare global {
  type FsTimestamp = Timestamp;
}
```

## Server

```ts
import type { Timestamp } from "firebase-admin/firestore";

declare global {
  type FsTimestamp = Timestamp;
}
```

## React Native

```ts
import type { Timestamp } from "@react-native-firebase/firestore";

declare global {
  type FsTimestamp = Timestamp;
}
```
