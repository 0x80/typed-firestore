/**
 * Compile-time type tests for SelectedDocument.
 *
 * Verified by `pnpm check-types` (tsc --noEmit). This file is not imported by
 * any source module, so it will not appear in the build output.
 */

import type { DocumentData } from "firebase-admin/firestore";
import type { SelectedDocument } from "~/collections/types";

/** Check that A and B are exactly the same type (in both directions). */
type IsExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type AssertTrue<T extends true> = T;

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

type Book = {
  title: string;
  author: string;
  year: number;
  tags: string[];
};

// ---------------------------------------------------------------------------
// Core behavior — S omitted (defaults to undefined) → full type
// ---------------------------------------------------------------------------

type _DefaultResolvesToFull = AssertTrue<IsExact<SelectedDocument<Book>, Book>>;

// ---------------------------------------------------------------------------
// Core behavior — S explicitly undefined → full type
// ---------------------------------------------------------------------------

type _ExplicitUndefinedResolvesToFull = AssertTrue<
  IsExact<SelectedDocument<Book, undefined>, Book>
>;

// ---------------------------------------------------------------------------
// Core behavior — S is a key array → Pick
// ---------------------------------------------------------------------------

type _SelectSubset = AssertTrue<
  IsExact<
    SelectedDocument<Book, ["author", "title"]>,
    Pick<Book, "author" | "title">
  >
>;

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

/** Single key selection */
type _SingleKey = AssertTrue<
  IsExact<SelectedDocument<Book, ["year"]>, Pick<Book, "year">>
>;

/** All keys selected should equal the full type */
type _AllKeys = AssertTrue<
  IsExact<SelectedDocument<Book, ["title", "author", "year", "tags"]>, Book>
>;

/** Empty array selection results in empty object */
type _EmptyArray = AssertTrue<
  IsExact<SelectedDocument<Book, []>, Pick<Book, never>>
>;

// ---------------------------------------------------------------------------
// Negative assertions
// ---------------------------------------------------------------------------

/** A selected subset should NOT equal the full type. */
type _SubsetIsNotFull = IsExact<SelectedDocument<Book, ["title"]>, Book>;
type _SubsetIsNotFullCheck = AssertTrue<IsExact<_SubsetIsNotFull, false>>;

/**
 * Invalid keys should be rejected by the constraint. The second type parameter
 * only accepts arrays of keyof T or undefined, so "invalid" should error.
 */
// @ts-expect-error — "invalid" is not a key of Book
type _InvalidKey = SelectedDocument<Book, ["invalid"]>;

// ---------------------------------------------------------------------------
// Generic context simulation
// ---------------------------------------------------------------------------

/**
 * Mimics the generic signature from getDocuments to ensure SelectedDocument
 * resolves correctly when S flows through a defaulted generic parameter.
 */
type SimulateGetDocuments<
  T extends DocumentData,
  S extends (keyof T)[] | undefined = undefined,
> = SelectedDocument<T, S>;

/** When S defaults to undefined the result should be the full type. */
type _GenericDefault = AssertTrue<IsExact<SimulateGetDocuments<Book>, Book>>;

/** When S is explicitly provided, the result should be the picked type. */
type _GenericWithSelect = AssertTrue<
  IsExact<
    SimulateGetDocuments<Book, ["title", "year"]>,
    Pick<Book, "title" | "year">
  >
>;
