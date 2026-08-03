export {
  accessToken,
  emulator,
  serviceAccount,
  type AuthProvider,
  type ServiceAccountJson,
} from "./client/auth";
export { createDb, type CreateDbOptions, type Db } from "./client/create-db";
export {
  FirestoreError,
  isAlreadyExistsError,
  isMissingIndexError,
  isNotFoundError,
  isPreconditionFailure,
} from "./client/errors";

export {
  getDocuments,
  getFirstDocument,
  type GetDocumentsOptions,
} from "./collections/get-documents";
export {
  Query,
  type OrderByDirection,
  type WhereFilterOp,
} from "./collections/query";
export type { QueryBuilder, SelectedDocument } from "./collections/types";

export {
  createDocument,
  createDocumentMaybe,
} from "./documents/create-document";
export {
  getDocument,
  getDocumentMaybe,
  getSpecificDocument,
  getSpecificDocumentMaybe,
} from "./documents/get-document";
export {
  addDocument,
  deleteDocument,
  setDocument,
  setSpecificDocument,
  updateDocument,
} from "./documents/write-document";

export { CollectionRef } from "./refs/collection-ref";
export { DocumentRef } from "./refs/document-ref";

export type {
  DocumentPrecondition,
  FsDocument,
  FsMutableDocument,
  Precondition,
  UpdateData,
  WriteResult,
} from "./types";

export { PrecisionError } from "./values/decode";
export { GeoPoint } from "./values/geo-point";
export { Timestamp } from "./values/timestamp";
export type {
  FirestoreFields,
  FirestoreValue,
  WireDocument,
} from "./values/wire";
