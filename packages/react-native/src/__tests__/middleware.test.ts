import {
  getCountFromServer,
  getDoc as getDocFirestore,
  getDocFromCache,
  getDocFromServer,
  getDocs as getDocsFirestore,
  getDocsFromCache,
  getDocsFromServer,
  onSnapshot,
} from "@react-native-firebase/firestore";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import {
  experimental_registerGetCountMiddleware,
  experimental_registerGetDocMiddleware,
  experimental_registerGetDocsMiddleware,
  experimental_registerOnDocSnapshotMiddleware,
  experimental_registerOnDocsSnapshotMiddleware,
  type GetDocMiddleware,
  getCount,
  getDoc,
  getDocs,
  onDocSnapshot,
  onDocsSnapshot,
} from "../firestore";
import type {
  DocumentReference,
  FirestoreError,
  Query,
} from "../firestore-types";

const reference = { id: "u1", path: "users/u1" } as DocumentReference;
const query = { type: "collection" } as unknown as Query;
const unregisters: (() => void)[] = [];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  for (const unregister of unregisters.splice(0)) {
    unregister();
  }
});

describe("reads", () => {
  it.each([
    { label: "default", source: undefined, read: getDocFirestore },
    { label: "cache", source: "cache", read: getDocFromCache },
    { label: "server", source: "server", read: getDocFromServer },
  ] as const)(
    "getDoc reads from the $label source",
    async ({ source, read }) => {
      await getDoc(reference, source);
      expect(read).toHaveBeenCalledWith(reference);
    },
  );

  it.each([
    { label: "default", source: undefined, read: getDocsFirestore },
    { label: "cache", source: "cache", read: getDocsFromCache },
    { label: "server", source: "server", read: getDocsFromServer },
  ] as const)(
    "getDocs reads from the $label source",
    async ({ source, read }) => {
      await getDocs(query, source);
      expect(read).toHaveBeenCalledWith(query);
    },
  );

  it("getCount counts on the server", async () => {
    await getCount(query);
    expect(getCountFromServer).toHaveBeenCalledWith(query);
  });

  it("hands listeners their callbacks, after the listen options when given", () => {
    const onNext = vi.fn();
    const onError = vi.fn();
    const options = { includeMetadataChanges: true };

    onDocSnapshot(reference, undefined, onNext, onError);
    onDocSnapshot(reference, options, onNext, onError);
    onDocsSnapshot(query, undefined, onNext, onError);
    onDocsSnapshot(query, options, onNext, onError);

    expect(vi.mocked(onSnapshot).mock.calls).toEqual([
      [reference, onNext, onError],
      [reference, options, onNext, onError],
      [query, onNext, onError],
      [query, options, onNext, onError],
    ]);
  });

  it("requires an error callback, so errors never reach onNext", () => {
    /** React Native Firebase treats a lone onNext as a node-style callback. */
    expectTypeOf(onDocSnapshot)
      .parameter(3)
      .toEqualTypeOf<(error: FirestoreError) => void>();
    expectTypeOf(onDocsSnapshot)
      .parameter(3)
      .toEqualTypeOf<(error: FirestoreError) => void>();
  });
});

describe("middleware", () => {
  it("runs each read through its own middleware", async () => {
    const seen: string[] = [];
    unregisters.push(
      experimental_registerGetDocMiddleware((context, next) => {
        seen.push(`getDoc ${context.source}`);
        return next(context);
      }),
      experimental_registerGetDocsMiddleware((context, next) => {
        seen.push(`getDocs ${context.source}`);
        return next(context);
      }),
      experimental_registerGetCountMiddleware((context, next) => {
        seen.push("getCount");
        return next(context);
      }),
      experimental_registerOnDocSnapshotMiddleware((context, next) => {
        seen.push("onDocSnapshot");
        return next(context);
      }),
      experimental_registerOnDocsSnapshotMiddleware((context, next) => {
        seen.push("onDocsSnapshot");
        return next(context);
      }),
    );

    await getDoc(reference, "cache");
    await getDocs(query, "server");
    await getCount(query);
    onDocSnapshot(reference, undefined, vi.fn(), vi.fn());
    onDocsSnapshot(query, undefined, vi.fn(), vi.fn());

    expect(seen).toEqual([
      "getDoc cache",
      "getDocs server",
      "getCount",
      "onDocSnapshot",
      "onDocsSnapshot",
    ]);
  });

  it("runs in registration order and passes a changed context on", async () => {
    const seen: string[] = [];
    unregisters.push(
      experimental_registerGetDocMiddleware((context, next) => {
        seen.push(`first saw ${context.source}`);
        return next({ ...context, source: "server" });
      }),
      experimental_registerGetDocMiddleware((context, next) => {
        seen.push(`second saw ${context.source}`);
        return next(context);
      }),
    );

    await getDoc(reference, "cache");

    expect(seen).toEqual(["first saw cache", "second saw server"]);
    expect(getDocFromServer).toHaveBeenCalledWith(reference);
    expect(getDocFromCache).not.toHaveBeenCalled();
  });

  it("removes only the registration that is unregistered", async () => {
    const middleware = vi.fn<GetDocMiddleware>((context, next) =>
      next(context),
    );
    const unregisterFirst = experimental_registerGetDocMiddleware(middleware);
    const unregisterSecond = experimental_registerGetDocMiddleware(middleware);
    unregisters.push(unregisterFirst, unregisterSecond);

    unregisterFirst();
    unregisterFirst();
    await getDoc(reference);
    expect(middleware).toHaveBeenCalledTimes(1);

    unregisterSecond();
    await getDoc(reference);
    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it("passes a listener error through the middleware to the caller", () => {
    const seen: string[] = [];
    unregisters.push(
      experimental_registerOnDocsSnapshotMiddleware((context, next) =>
        next({
          ...context,
          onError: (error) => {
            context.onError(error);
            seen.push(`listener error: ${error.message}`);
          },
        }),
      ),
    );
    const onError = vi.fn();
    onDocsSnapshot(query, { includeMetadataChanges: true }, vi.fn(), onError);

    /** With listen options, onSnapshot gets (query, options, onNext, onError). */
    const listenerOnError = vi.mocked(onSnapshot).mock.calls[0]?.[3];
    const error = new Error("permission-denied");
    listenerOnError?.(error);

    expect(onError).toHaveBeenCalledWith(error);
    expect(seen).toEqual(["listener error: permission-denied"]);
  });

  it("lets the middleware see a failed read and still rejects", async () => {
    const seen: string[] = [];
    unregisters.push(
      experimental_registerGetDocMiddleware((context, next) => {
        const read = next(context);
        void read.catch(() => seen.push(`get error from ${context.source}`));
        return read;
      }),
    );
    const error = new Error("unavailable");
    vi.mocked(getDocFirestore).mockRejectedValueOnce(error);

    await expect(getDoc(reference)).rejects.toBe(error);
    expect(seen).toEqual(["get error from default"]);
  });

  it("turns a middleware that throws into a rejected read", async () => {
    const error = new Error("middleware failed");
    const fail = () => {
      throw error;
    };
    unregisters.push(
      experimental_registerGetDocMiddleware(fail),
      experimental_registerGetDocsMiddleware(fail),
      experimental_registerGetCountMiddleware(fail),
    );

    await expect(getDoc(reference)).rejects.toBe(error);
    await expect(getDocs(query)).rejects.toBe(error);
    await expect(getCount(query)).rejects.toBe(error);
  });
});
