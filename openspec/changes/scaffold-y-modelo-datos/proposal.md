# Proposal: scaffold-y-modelo-datos

## Intent

Build foundation for the LIBRERIA bookstore app: monorepo scaffold, Prisma schema, price list parser, seed script. Unblocks auth, orders, and admin panel changes.

## Scope

### In Scope

- pnpm workspace monorepo (`packages/backend` + `packages/frontend`)
- TypeScript 6 configs with shared `tsconfig.base.json` + path aliases
- Prisma 7 schema: Product, User, Order, OrderItem + Role, OrderStatus enums
- Express 5 backend: health check + global error handler
- React 19 + Vite 8 + Tailwind CSS 4 frontend scaffold
- TXT price list parser: fixed-width, ISO-8859-1, strip `*`, blank → price=0
- Seed script: populate Product catalog from parsed TXT
- Root dev scripts: `dev`, `lint`, `type-check`, `build`

### Out of Scope

Auth, Order CRUD, Admin panel, PDF gen, User registration — deferred.

## Capabilities

### New Capabilities

- `product-catalog`: Product entity + seed from TXT
- `health-check`: Express health endpoint + React scaffold
- `price-list-parser`: TXT fixed-width parse
- `project-scaffold`: pnpm monorepo, TS, dev scripts

### Modified Capabilities

None — greenfield.

## Approach

1. **Monorepo**: `pnpm-workspace.yaml` at root, shared scripts in root `package.json`
2. **TS**: Root `tsconfig.base.json` (strict); each package extends it
3. **Prisma**: 4 models + 2 enums in `packages/backend/prisma/`
4. **Parser**: Extract at char indices 10-17 (code), 20-66 (desc), 68-75 (price), 78-87 (date). Skip headers ("LISTA DE PRECIOS", "====", blank). Strip trailing `*`. Blank → price=0. Decode with `iconv-lite`.
5. **Seed**: Standalone `scripts/seed.ts` via `tsx` → `createMany()` in batches of 1000
6. **Backend**: Express 5, `GET /api/health` → `{ status: "ok", timestamp }`, CORS, global error middleware
7. **Frontend**: Vite 8 + React 19 + Tailwind 4, Vite proxy `/api` → backend, minimal App

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prisma 7 / Vite 8 / TS 6 incompatibility | Med | Pin exact versions. Fallback: bump |
| Fixed-width parser edge cases | Low | Validate all 6944 lines + 21 no-price |
| Encoding (ISO-8859-1 vs UTF-8) | Low | Read raw buffer, decode with `iconv-lite` |
| No auth → unprotected endpoints | High | Accepted. Auth is next change |

## Rollback Plan

1. Before seed: drop + recreate schema
2. Full: `git reset --hard`; delete change folder
3. Partial: `pnpm remove` dep, adjust version

## Dependencies

pnpm ≥10, Node ≥22, PG 18.0 (Windows service).

## Success Criteria

- [ ] `pnpm install` completes
- [ ] `pnpm --filter backend dev` → `GET /api/health` returns 200
- [ ] `pnpm --filter frontend dev` → Vite on 5173, no console errors
- [ ] `npx tsx scripts/seed.ts` inserts 6944 products; 21 with `price=0`
- [ ] `pnpm type-check` passes in both packages
- [ ] PostgreSQL has 6944 rows in Product with correct data
