# Create and Preconditions

Two capabilities that exist on the **server** and **REST** packages only.

They are absent from React and React Native for a reason worth understanding
before you go looking for them.

## Why these are server-side only

Firestore's client SDKs deliberately do not expose write preconditions. The
reason is not that the API was overlooked: **neither client SDK exposes a
document's `updateTime` at all**. `firebase-admin` puts `createTime` and
`updateTime` on every snapshot; the web and React Native snapshots have no
equivalent, so there is no version handle to compare against.

That follows from what a client is. With offline persistence and latency
compensation, a client's idea of "the current version" is a local guess that may
never have reached the server. A precondition evaluated against it would be
meaningless.

Clients get the same guarantee through `runTransaction`, which reads and writes
atomically on the server. That is the right tool there, and it is a different
one, so this API does not pretend otherwise.

## createDocument

Writes a document at a known id, and fails when one already exists.

This completes the write trio against the three primitives firebase-admin
itself offers:

| Function         | Id        | If it already exists |
| ---------------- | --------- | -------------------- |
| `addDocument`    | generated | n/a                  |
| `setDocument`    | yours     | overwritten          |
| `createDocument` | yours     | fails                |

Firestore enforces this server-side, so it is a single atomic round trip rather
than a read followed by a write.

```ts
import { createDocument, createDocumentMaybe } from "@typed-firestore/server";

/** Throws when the id is taken. */
await createDocument(refs.users, "abc123", data);

/** Resolves to undefined when the id is taken. */
const created = await createDocumentMaybe(refs.users, "abc123", data);

if (!created) {
  /** Someone got there first. */
}
```

The success value differs between the two packages, because each returns what it
already has. The server package returns a `WriteResult`, matching the SDK's own
`create()`. The REST package returns the created `FsMutableDocument`, since the
API response carries the document and a second read would be wasteful. The
predicate above reads identically either way, which is the usual case.

`createDocumentMaybe` is the shape idempotent submission paths want. A client
that retries after a lost response gets `undefined` instead of an error, so it
can treat the submission as already completed. Note that `undefined` proves only
that the id is taken, not that this caller's earlier attempt is what took it, so
read the document back where ownership matters.

## Preconditions

A precondition is a condition the server checks before applying a write. It is a
true compare-and-swap, evaluated atomically.

```ts
type Precondition = { lastUpdateTime: Timestamp } | { exists: boolean };
```

A document you have already read accepts one extra form:

```ts
{
  ifUnchanged: true;
}
```

which compares against the version that document was read at.

### The result is a value, not an exception

Without a precondition a write returns a `WriteResult`. With one it returns
`WriteResult | undefined`, where `undefined` means the condition was not met.

Losing a race is an expected outcome in a compare-and-swap loop, not an error,
so it does not throw. The signatures are overloaded, which means existing calls
that pass no precondition keep their exact return type.

```ts
const wrote = await doc.update({ status: "processed" }, { ifUnchanged: true });

if (!wrote) {
  /** Another worker got there first. Skip and move on. */
}
```

### Why ifUnchanged

The raw SDK makes you thread the version through by hand:

```ts
/** firebase-admin */
const snapshot = await ref.get();
await ref.update(data, { lastUpdateTime: snapshot.updateTime });
```

The document already knows the version it was read at, so the library can carry
it for you:

```ts
/** typed-firestore */
const doc = await getDocument(refs.jobs, id);
await doc.update(data, { ifUnchanged: true });
```

Both forms are available. `lastUpdateTime` is there for when the timestamp comes
from somewhere other than a document you are holding.

### A worked example

The pattern these were added for: a batch worker that claims rows without two
ticks doing the same work. Written against `@typed-firestore/server`; the REST
package is identical apart from `getDocuments` requiring an explicit `limit`.

**Claim first, then work.** The order matters more than it looks: if the work
runs while building the update argument, every tick does the work and only the
write is arbitrated, which is the duplication the precondition was meant to
prevent.

```ts
const pending = await getDocuments(refs.jobs, (query) =>
  query.where("status", "==", "pending").limit(100),
);

for (const job of pending) {
  /** Claim it first. Nothing expensive has happened yet. */
  const claimed = await job.update(
    { status: "claimed" },
    { ifUnchanged: true },
  );

  if (!claimed) {
    /** A concurrent tick claimed it. Not an error. */
    skipped += 1;
    continue;
  }

  /** Only now is this worker the sole owner. */
  const result = await process(job.data);

  /**
   * Guard the completion with the version the claim produced. Without it, a
   * worker that was reclaimed as stale would still overwrite whoever picked
   * the job up next.
   */
  await updateDocument(
    refs.jobs,
    job.id,
    { status: "done", result },
    { lastUpdateTime: claimed.writeTime },
  );
}
```

A worker that dies between claiming and completing leaves the job `claimed`
forever, so a real queue also needs a way to reclaim stale work: store a
`claimedAt` alongside the status and let a sweeper return jobs older than some
threshold to `pending`. That reclamation is exactly why the completion write
above is conditional.

### Preconditions and missing documents

`updateDocument` fails when the document does not exist, matching the SDK rather
than the REST default of creating one. That check is implicit, so a failure
there still **throws** even though a caller-supplied precondition would return
`undefined`. The distinction is deliberate: a caller who passed a precondition
was anticipating a race, while one who did not has a bug.
