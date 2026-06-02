# Project Scaffold Specification

## Purpose

Define the monorepo foundation: pnpm workspace, TypeScript configuration, shared dev scripts, and project hygiene files.

## Requirements

### Requirement: Monorepo Workspace

The project MUST use pnpm workspaces. The root `pnpm-workspace.yaml` MUST declare `packages/` as the workspace pattern.

#### Scenario: Root install resolves both packages

- GIVEN `pnpm-workspace.yaml` with `- 'packages/*'`
- WHEN `pnpm install` runs at root
- THEN dependencies for `packages/backend` and `packages/frontend` are installed without error

### Requirement: TypeScript Configuration

The root MUST define `tsconfig.base.json` with `strict: true`, `target: ESNext`, `moduleResolution: bundler`, and path aliases (`@backend/*`, `@frontend/*`). Each workspace package MUST extend this base config with its own `tsconfig.json`.

#### Scenario: Package inherits strict mode

- GIVEN `tsconfig.base.json` with `strict: true`
- WHEN `packages/backend/tsconfig.json` sets `"extends": "../../tsconfig.base.json"`
- THEN TypeScript enforces strict null checks and no implicit any

### Requirement: Root Scripts

The root `package.json` MUST define `dev` (parallel), `build` (serial), `lint`, and `type-check` (parallel) scripts using `pnpm --filter` or `pnpm -r`.

#### Scenario: Type-check both packages

- GIVEN the root `package.json` with `"type-check": "pnpm -r type-check"`
- WHEN `pnpm type-check` runs
- THEN type-checking executes in both packages sequentially without error

### Requirement: Project Hygiene

The repository MUST include a `.gitignore` ignoring `node_modules`, `dist`, `.env`, `.prisma`, and `.turbo`. It MUST include a `.env.example` with `DATABASE_URL`, `PORT`, and `CORS_ORIGIN` as documented keys.

#### Scenario: Build artifacts excluded

- GIVEN `.gitignore` with `dist/`
- WHEN `git status` runs after a build
- THEN no `dist/` files appear in the working tree
