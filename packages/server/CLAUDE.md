# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

### Development Commands

- `pnpm check-lint` - Run oxlint with type-aware linting
- `pnpm check-types` - Run TypeScript type checking without emitting files
- `pnpm check-format` - Check code formatting with oxfmt
- `pnpm format` - Auto-format code with oxfmt
- `pnpm build` - Build the library with tsdown
- `pnpm clean` - Remove dist directory and build artifacts
- `pnpm prepare` - Full build cycle (clean, check-types, and build)

### Important Notes

- No test runner is currently configured (test script echoes "No test
  specified")
- The project uses pnpm as the package manager
- Node.js version requirement: >=20

## Architecture Overview

This is a TypeScript library that provides typed abstractions for Firestore in
server environments (firebase-admin and firebase-functions). The library is
organized into three main areas:

### Core Modules

1. **Documents (`src/documents/`)** - Functions for single document operations
   - CRUD operations: get, set, update, delete
   - Transaction variants (suffixed with `Tx`)
   - Support for both typed collections and specific document references
   - Returns `FsMutableDocument<T>` which combines data with typed update/delete
     methods

2. **Collections (`src/collections/`)** - Functions for collection queries and
   batch processing
   - Query functions: `getDocuments`, `getFirstDocument`
   - Processing functions: `processDocuments`, `processDocumentsByChunk`
   - Internal chunking for handling large collections (paginated fetching)
   - Support for typed select statements that narrow both data and types

3. **Functions (`src/functions/`)** - Cloud Functions utilities
   - Helpers to extract typed data from 2nd gen cloud function events
   - Functions like `getDataOnWritten`, `getBeforeAndAfterOnUpdated`
   - Exported separately as `@typed-firestore/server/functions` to make
     firebase-admin optional

### Key Design Patterns

1. **Transaction Support**: All document operations have transaction variants
   (suffix `Tx`) that work within Firebase transactions. Transaction functions
   return the Transaction object for chaining.

2. **Type Narrowing with Select**: The library supports TypeScript type
   narrowing when using select statements. Select must be defined separately
   from the query to enable proper type inference.

3. **Chunked Processing**: Collection operations internally use pagination to
   handle unlimited documents with constant memory usage. Setting a limit on a
   query disables pagination.

4. **Mutable Documents**: The library returns `FsMutableDocument<T>` objects
   that combine:
   - `id`: Document ID
   - `data`: Typed document data
   - `ref`: Original Firestore reference
   - `update()`/`updateWithPartial()`: Typed update methods
   - `delete()`: Delete method

5. **Path Aliases**: The codebase uses `~` as a path alias for the src directory
   (configured via tsconfig paths, resolved natively by tsdown).

### Type System

The library provides strong typing throughout:

- Collection references are typed as `CollectionReference<T>`
- Documents are returned as `FsDocument<T>` or `FsMutableDocument<T>`
- Select statements narrow types to `Pick<T, K>`
- Transaction variants have different return types for proper chaining

### Build System

- Uses tsdown (powered by rolldown) for bundling and declaration generation
- Unbundled output preserving module structure
- Outputs ESM (.mjs) and TypeScript declarations (.d.mts)
- Separate exports for main library and functions submodule

### Code Conventions

- Comments are written in JSDoc style, unless they are inline comments with code
  on the same line.
- Use `/** ... */` for both multi-line and single-line comments.
