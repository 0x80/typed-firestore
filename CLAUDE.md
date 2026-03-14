# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

### Root-Level Commands (via Turborepo)

- `pnpm build` - Build all packages
- `pnpm check-types` - Type check all packages
- `pnpm check-lint` - Run oxlint with type-aware linting
- `pnpm check-format` - Check code formatting with oxfmt
- `pnpm format` - Auto-format code with oxfmt
- `pnpm test` - Run tests across all packages
- `pnpm clean` - Clean dist directories in all packages

### Package-Level Commands

Run from within a package directory (e.g. `packages/server/`):

- `pnpm build` - Build the package with tsdown
- `pnpm check-types` - TypeScript type checking
- `pnpm test` - Run tests (where configured)
- `pnpm clean` - Remove dist directory and build artifacts

## Architecture Overview

This is a monorepo containing typed Firestore libraries for different
environments. Each package is published independently to NPM under the
`@typed-firestore/*` scope.

### Packages

1. **`packages/server`** (`@typed-firestore/server`) - Server-side Firestore
   abstractions for firebase-admin and firebase-functions
2. **`packages/react`** (`@typed-firestore/react`) - React hooks and utilities
   for Firestore with Firebase web SDK
3. **`packages/react-native`** (`@typed-firestore/react-native`) - React Native
   hooks and utilities for Firestore with React Native Firebase

### Tooling

- **Package manager**: pnpm (workspaces)
- **Build orchestrator**: Turborepo
- **Build tool**: tsdown (powered by rolldown)
- **Linting**: oxlint with type-aware checking
- **Formatting**: oxfmt
- **Testing**: vitest
- **TypeScript**: 6.0.0-beta

### Code Conventions

- Use named exports (avoid default exports)
- Comments use JSDoc style (`/** ... */`) for both single and multi-line
- Path alias `~` maps to `src/` directory (resolved by tsdown)
- Use `node:` prefix for built-in modules

## Development Workflow

After completing work, always run:

- `pnpm check-types` - Type check all packages
- `pnpm check-lint` - Lint with oxlint
- `pnpm check-format` - Check formatting with oxfmt
