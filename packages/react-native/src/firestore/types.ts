/**
 * The public types of the read middleware. Contexts hold untyped references
 * and snapshots so one middleware can serve every collection; the read
 * functions restore the document type on the way out.
 */
import type { getCountFromServer } from "@react-native-firebase/firestore";
import type {
  DocumentReference,
  DocumentSnapshot,
  FirestoreError,
  Query,
  QuerySnapshot,
  SnapshotListenOptions,
} from "~/firestore-types";
import type { Middleware } from "./middleware-manager";

export type GetSource = "default" | "cache" | "server";

export type GetDocContext = { reference: DocumentReference; source: GetSource };

export type GetDocsContext = { query: Query; source: GetSource };

export type GetCountContext = { query: Query };

export type OnDocSnapshotContext = {
  reference: DocumentReference;
  options: SnapshotListenOptions | undefined;
  onNext: (snapshot: DocumentSnapshot) => void;
  onError: (error: FirestoreError) => void;
};

export type OnDocsSnapshotContext = {
  query: Query;
  options: SnapshotListenOptions | undefined;
  onNext: (snapshot: QuerySnapshot) => void;
  onError: (error: FirestoreError) => void;
};

export type GetDocMiddleware = Middleware<
  GetDocContext,
  Promise<DocumentSnapshot>
>;

export type GetDocsMiddleware = Middleware<
  GetDocsContext,
  Promise<QuerySnapshot>
>;

export type GetCountMiddleware = Middleware<
  GetCountContext,
  ReturnType<typeof getCountFromServer>
>;

export type OnDocSnapshotMiddleware = Middleware<
  OnDocSnapshotContext,
  () => void
>;

export type OnDocsSnapshotMiddleware = Middleware<
  OnDocsSnapshotContext,
  () => void
>;
