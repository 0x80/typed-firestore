# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

- **Build**: `pnpm build` (runs tsdown)
- **Lint**: `pnpm check-lint` (runs oxlint)
- **Type check**: `pnpm check-types`
- **Format check**: `pnpm check-format` (runs oxfmt --check)
- **Format**: `pnpm format` (runs oxfmt)
- **Prepare for publish**: `pnpm prepare` (clean, check-types, build)
- **Test**: `pnpm test` (runs vitest)
- **Clean**: `pnpm clean`

## Architecture

This is a React hooks library for typed Firestore document handling. It provides
typed abstractions that work with Firebase's web SDK (`firebase/firestore`).

### Core Concepts

**Document Types** (`src/types.ts`):

- `FsDocument<T>` - Immutable document with `id` and `data`
- `FsMutableDocument<T>` - Adds `ref`, `update`, `updateWithPartial`, and
  `delete` methods
- `FsMutableDocumentTx<T>` - Transaction variant

**Main Exports**:

- `useDocument`, `useDocumentMaybe`, `useDocumentData`, `useDocumentOnce`,
  `useDocumentDataOnce` - Document hooks
- `useSpecificDocument`, `useSpecificDocumentData` - Hooks that accept
  `DocumentReference` directly
- `useCollection`, `useCollectionOnce` - Collection query hooks
- `getDocument*`, `getSpecificDocument*` - Non-hook fetch functions for use with
  ReactQuery etc.
- `setDocument`, `setSpecificDocument` - Create or overwrite documents
- `updateDocument`, `updateSpecificDocument` - Partially update documents
- `deleteDocument`, `deleteSpecificDocument` - Delete documents
- `makeDocument`, `makeMutableDocument` - Factory functions

**Error Handling**: Hooks throw errors instead of returning them (except
`*Maybe` variants which return `undefined` for missing documents). This ties
loading state to data availability.

### Forked Code

The `src/fork/firestore/` directory contains forked and modified code from
`react-firebase-hooks`. The hooks in the main `src/` directory wrap these fork
implementations with stronger typing.

## Code Style

- Use `type` keyword for type definitions (enforced by oxlint rule)
- Non-null assertions are allowed
- Peer dependencies: `firebase >=10.0`, `react >=16.8.0`
