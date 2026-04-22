import type {
  CollectionReference,
  DocumentData,
} from "firebase-admin/firestore";

/**
 * Get a path usable for a cloud function event handler that uses a single
 * parameter to identify the document.
 *
 * The parameter name is preserved in the type system, allowing TypeScript to
 * know exactly which parameters are available in event.params.
 */
export function makeDocumentHandlerPath<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
): `${string}/{documentId}`;
export function makeDocumentHandlerPath<
  T extends DocumentData,
  P extends string,
>(collectionRef: CollectionReference<T>, parameterName: P): `${string}/{${P}}`;
export function makeDocumentHandlerPath<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  parameterName?: string,
): string {
  return `${collectionRef.path}/{${parameterName ?? "documentId"}}`;
}
