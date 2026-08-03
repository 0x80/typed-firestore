# REST: Values and Conversion

The SDK-based packages hand data conversion to the Firebase SDK. This package
speaks the REST wire format directly, so it owns the conversion between
JavaScript values and Firestore's tagged-union representation. That makes the
rules below part of the API rather than an implementation detail.

## Type mapping

| JavaScript    | Firestore                       |
| ------------- | ------------------------------- |
| `string`      | `stringValue`                   |
| `boolean`     | `booleanValue`                  |
| `number`      | `integerValue` or `doubleValue` |
| `bigint`      | `integerValue`                  |
| `null`        | `nullValue`                     |
| `Date`        | `timestampValue` (write only)   |
| `Timestamp`   | `timestampValue`                |
| `Uint8Array`  | `bytesValue`                    |
| `GeoPoint`    | `geoPointValue`                 |
| `DocumentRef` | `referenceValue`                |
| `Array`       | `arrayValue`                    |
| plain object  | `mapValue`                      |

## Timestamps

A Firestore timestamp carries nanoseconds; a JavaScript `Date` carries
milliseconds. Returning a `Date` would silently discard precision on every read,
so **reads always produce a `Timestamp`** while **writes accept either**.

```ts
import { Timestamp } from "@typed-firestore/rest";

await setDocument(refs.users, "abc", {
  name: "Alice",
  createdAt: new Date(), // accepted and converted
});

const user = await getDocument(refs.users, "abc");
user.data.createdAt.toDate(); // a Date, if that is what you want
user.data.createdAt.toMillis();
```

The class mirrors the `Timestamp` of firebase-admin and the web SDK, so document
types stay shareable through the [`FsTimestamp` alias](/sharing-types).

## Numbers

Firestore distinguishes 64-bit integers from doubles, and orders and indexes
them as separate types. JavaScript does not make that distinction, so the rule
matches firebase-admin exactly:

```ts
Number.isInteger(value) ? integerValue : doubleValue;
```

A document written by this package and one written by `@typed-firestore/server`
therefore produce identical value types for identical input. It inherits the
same quirk: a whole float such as `1.0` is stored as an integer.

Two cases fail loudly rather than corrupting data:

- **Writing an integer beyond `Number.MAX_SAFE_INTEGER`** throws. Past that
  point a `number` no longer identifies a single integer, and `String()` switches
  to exponent notation (`"1e+21"`), which is not a valid int64 on the wire. Pass
  a `BigInt` to store a full 64-bit integer.
- **Reading an integer beyond the safe range** throws a `PrecisionError` naming
  the field, rather than returning an adjacent number.

## Undefined

`undefined` is rejected by default, so a typo in a field name surfaces instead of
silently writing nothing. Opt out per database:

```ts
createDb({ auth, ignoreUndefinedProperties: true });
```

Inside an array `undefined` is always an error, because dropping an element
would shift every index after it. Use `null`.

## Nested arrays

Firestore cannot store an array directly inside another array. Attempting it
throws, naming the path:

```ts
await setDocument(refs.users, "abc", { tags: [["a"]] });
// TypeError: Cannot encode a nested array at "tags[0]"
```

Wrap the inner array in an object instead.

## Field names

Field paths are dot-separated, so a field literally named `a.b` is escaped with
backticks before it goes into an update mask, a filter or an ordering. Without
that escaping it would silently address the nested field `b` inside the map `a`.
This is handled for you.
