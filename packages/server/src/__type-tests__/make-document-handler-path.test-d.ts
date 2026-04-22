/**
 * Compile-time type tests for makeDocumentHandlerPath.
 *
 * Verified by `pnpm check-types` (tsc --noEmit). This file is not imported by
 * any source module, so it will not appear in the build output.
 */

import type { CollectionReference } from "firebase-admin/firestore";
import { makeDocumentHandlerPath } from "~/functions/make-document-handler-path";

/** Check that A and B are exactly the same type (in both directions). */
type IsExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type AssertTrue<T extends true> = T;

type Book = {
  title: string;
  author: string;
};

declare const booksRef: CollectionReference<Book>;

// ---------------------------------------------------------------------------
// No parameter name → return type uses the literal "documentId"
// ---------------------------------------------------------------------------

const _defaultPath = makeDocumentHandlerPath(booksRef);
type _DefaultIsDocumentId = AssertTrue<
  IsExact<typeof _defaultPath, `${string}/{documentId}`>
>;

// ---------------------------------------------------------------------------
// Explicit string literal → return type preserves that literal
// ---------------------------------------------------------------------------

const _customPath = makeDocumentHandlerPath(booksRef, "bookId");
type _CustomPreservesLiteral = AssertTrue<
  IsExact<typeof _customPath, `${string}/{bookId}`>
>;

// ---------------------------------------------------------------------------
// Negative assertion — explicit literal must NOT be widened to {documentId}
// ---------------------------------------------------------------------------

type _CustomIsNotDefault = AssertTrue<
  IsExact<IsExact<typeof _customPath, `${string}/{documentId}`>, false>
>;
