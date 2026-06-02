# Tasks: Scaffold + Data Model

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~625 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation → PR 2: Data Model → PR 3: Frontend |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Root monorepo + Backend scaffold | PR 1 | ~240 lines; base = main |
| 2 | Prisma schema + Parser + Seed | PR 2 | ~260 lines; base = main, depends on PR 1 for workspace/PG setup |
| 3 | Frontend scaffold | PR 3 | ~125 lines; base = main, independent of PR 2 |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 **Root monorepo** — `pnpm-workspace.yaml`, `package.json` (dev/build/lint/type-check), `tsconfig.base.json` (strict, `@backend/*`, `@frontend/*`), `.gitignore`, `.env.example`
- [x] 1.2 **Backend scaffold** — `packages/backend/package.json` (express, cors, zod, prisma, iconv-lite), `tsconfig.json`, `src/index.ts` (Express 5 app), `src/config/env.ts` (Zod validation), `src/lib/prisma.ts` (singleton), `src/middleware/error.ts` + `async-wrap.ts`, `src/routes/health.ts` (GET /api/health)
- [x] 1.3 **Frontend scaffold** — `packages/frontend/package.json` (react, react-dom, react-router-dom), `tsconfig.json`, `vite.config.ts` (proxy /api → :4000), `index.html`, `src/main.tsx`, `src/App.tsx` (routing layout), `src/index.css` (Tailwind 4 `@import "tailwindcss"`)

## Phase 2: Core Implementation

- [x] 2.1 **Prisma schema** — `packages/backend/prisma/schema.prisma` with 4 models (Product, User, Order, OrderItem) + 2 enums (Role, OrderStatus). Natural PK on `Product.code` (VarChar(8)). All prices `Decimal(12,2)`. Cascade User → Order → OrderItem. Added `lastUpdate DateTime?` and `@default(0)` on price.
- [x] 2.2 **Price list parser** — `packages/backend/src/lib/parse-price-list.ts`: read TXT as Buffer, decode ISO-8859-1 via TextDecoder, fixed-width slice (code 10-17, desc 20-66, price 68-75, date 78-87), skip headers/"===="/blank lines/form feeds, strip trailing `*`, blank price → 0, parse DD/MM/YYYY date. Output: 6944 products parsed, 23 with price=0.
- [x] 2.3 **Seed script** — `scripts/seed.ts`: standalone tsx script, imports parser + backend prisma singleton, `createMany` in batches of 500 with `skipDuplicates: true`, progress logging, idempotent. Verified: 6944 inserted, re-run yields 0 new.

## Verification

| Task | Verify |
|------|--------|
| 1.1 | `pnpm install` resolves both packages; `pnpm type-check` runs without error |
| 1.2 | `pnpm --filter backend dev` starts; `curl GET /api/health` → 200 `{ status: "ok", timestamp }`; `GET /api/nonexistent` → 404 |
| 1.3 | `pnpm --filter frontend dev` starts on :5173; Vite proxies `/api` to backend; Tailwind styles render |
| 2.1 | `prisma db push` creates all 4 tables; `prisma generate` produces client |
| 2.2 | Parser returns correct fields from sample lines; skips headers; handles asterisks, empty prices, special chars |
| 2.3 | Seed inserts 6944 products (21 with price=0); re-running is idempotent (same count) |
