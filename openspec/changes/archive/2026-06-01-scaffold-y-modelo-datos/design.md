# Design: Scaffold + Data Model

## Technical Approach

Greenfield pnpm monorepo with two packages (`backend`, `frontend`), Prisma schema for 4 models, a fixed-width TXT parser for the price list, and a standalone seed script. Backend is Express 5 with Zod-validated env config. Frontend is Vite 8 + React 19 + Tailwind 4 with API proxy.

## Architecture Decisions

### Monorepo: pnpm workspaces (no Turborepo/Nx)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| pnpm workspaces | Lightweight, built-in, no extra dep | ✅ Chosen — 2 packages don't warrant orchestration |
| Turborepo | Caching, parallel exec | Rejected — overkill until 5+ packages |
| Nx | Full build system | Rejected — cognitive overhead for a greenfield project |

### Price Model: Prisma Decimal(12,2) vs float

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `Decimal(12,2)` | Exact precision, DB-native `NUMERIC` | ✅ Chosen — monetary values MUST avoid float drift |
| `Float` | Smaller, faster arithmetic | Rejected — 0.1 + 0.2 != 0.3 in IEEE 754 |

### Env Validation: Zod schema at startup

Fail fast on missing `DATABASE_URL` — exit with descriptive error before the server binds. Alternatives (dotenv + manual checks) lose type safety and error quality.

### Parser: iconv-lite buffer decode → string slice

ISO-8859-1 is not splittable as UTF-8. Read raw `Buffer`, decode with `iconv-lite`, then slice by 0-indexed positions matching the 1-indexed spec (code[9-17], desc[19-66], price[67-75], date[77-87]).

### Seed: Standalone script, not lifecycle hook

Prisma `prisma.seed` config ties seed to `migrate dev`. We decouple: `tsx scripts/seed.ts` runs independently, accepts the TXT path, and logs progress. Idempotent via `skipDuplicates: true`.

### Tailwind 4: CSS-based config

Tailwind 4 uses `@import "tailwindcss"` in the CSS entry point — no `tailwind.config.js`, no `postcss.config.js` with the Vite plugin. The Vite plugin `@tailwindcss/vite` handles it.

## Data Flow

### Seed pipeline

```
LISTA_ACTUALIZADA_26052026.txt
        │ (ISO-8859-1)
        ▼
  iconv-lite decode
        │ (UTF-8 string)
        ▼
  parsePriceList()
  ┌─────────────────────────────────┐
  │ Skip: blank, "LISTA DE", "====" │
  │ Slice: code[9-17], desc[19-66]  │
  │ Strip: trailing "*"             │
  │ Coerce: blank price → 0         │
  │ Parse: date DD/MM/YYYY → string │
  └─────────────────────────────────┘
        │
        ▼
  ProductData[] (typed array)
        │
        ▼
  prisma.product.createMany()
  batches of 1000, skipDuplicates:true
        │
        ▼
  PostgreSQL Product table
```

### Request flow (runtime)

```
Browser ── /api/health ──► Vite proxy (5173) ──► Express (4000)
                                    │                     │
                                    │              Prisma ──► PostgreSQL
                                    │
                              Tailwind CSS
                              React 19 SPA
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| Root | | |
| `pnpm-workspace.yaml` | Create | Declare `packages/*` |
| `package.json` | Create | Root dev/build/lint/type-check scripts |
| `tsconfig.base.json` | Create | Strict TS6 base with `@backend/*`, `@frontend/*` aliases |
| `.gitignore` | Create | Standard Node + Prisma + Vite ignores |
| `.env.example` | Create | Document required env vars |
| `packages/backend/` | | |
| `package.json` | Create | Deps: express, cors, prisma, @prisma/client, zod, iconv-lite |
| `tsconfig.json` | Create | Extends base, outDir dist, rootDir src |
| `src/index.ts` | Create | Express app setup, middleware, server start |
| `src/env.ts` | Create | Zod schema + validated env access |
| `src/lib/prisma.ts` | Create | Prisma client singleton |
| `src/routes/health.ts` | Create | GET /api/health handler |
| `src/middleware/error.ts` | Create | Global error handler + AppError class |
| `src/middleware/async-wrap.ts` | Create | Async route wrapper |
| `prisma/schema.prisma` | Create | 4 models + 2 enums |
| `scripts/seed.ts` | Create | Standalone seed script |
| `scripts/parse-price-list.ts` | Create | Parser module (or under src/) |
| `packages/frontend/` | | |
| `package.json` | Create | Deps: react, react-dom, react-router-dom |
| `tsconfig.json` | Create | Extends base, jsx: react-jsx |
| `vite.config.ts` | Create | Proxy /api → localhost:4000, @frontend alias |
| `index.html` | Create | Vite HTML entry |
| `src/main.tsx` | Create | React root render |
| `src/App.tsx` | Create | Router + layout placeholder |
| `src/index.css` | Create | Tailwind 4 import + base styles |

## Interfaces / Contracts

```typescript
// Parser output
interface ProductData {
  code: string;        // 8 chars
  description: string; // asterisk-stripped
  price: number;       // 0 if blank
  lastUpdate: string | null; // DD/MM/YYYY or null
  isActive: boolean;   // always true
}

// API response shapes
interface HealthResponse {
  status: "ok";
  timestamp: string; // ISO 8601
}

interface ErrorResponse {
  error: string;
  statusCode: number;
}

// AppError
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) { super(message); }
}
```

```prisma
// Prisma schema (key models)
model Product {
  code        String   @id @db.VarChar(8)
  description String
  price       Decimal  @db.Decimal(12, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orderItems  OrderItem[]
}

model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  name     String
  password String
  role     Role      @default(CLIENT)
  orders   Order[]
}

model Order {
  id        Int         @id @default(autoincrement())
  userId    Int
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    OrderStatus @default(PENDING)
  total     Decimal     @db.Decimal(12, 2)
  createdAt DateTime    @default(now())
  items     OrderItem[]
}

model OrderItem {
  id           Int     @id @default(autoincrement())
  orderId      Int
  order        Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productCode  String
  product      Product @relation(fields: [productCode], references: [code])
  quantity     Int
  unitPrice    Decimal @db.Decimal(12, 2)
}

enum Role { CLIENT ADMIN }
enum OrderStatus { PENDING CONFIRMED SHIPPED DELIVERED CANCELLED }
```

## Prisma schema notes

- `Product.code` is `VarChar(8)` — matches TXT fixed width, serves as natural PK
- `User.password` stores a hash (bcrypt in auth change later — deferred)
- `OrderItem.productCode` FK references `Product.code`, not an auto-increment ID
- All `Decimal` fields use `(12,2)` — enough for prices up to 99,999,999.99
- Cascade deletes: User → Order → OrderItem

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Parser unit | Field extraction, skip logic, asterisk strip, empty price, encoding | Jest/vitest — mock file read, assert each field |
| Seed integration | Idempotency, batch insert, row count | Run seed, count rows, re-run, assert same count |
| Health API | GET /api/health shape, 404, error middleware | supertest or curl assertions |
| DB integration | Decimal precision, enum constraints, cascade delete | Raw Prisma queries after seed |

Note: No test runner is installed yet. This change creates the scaffold — tests will be added in a follow-up change once a runner (vitest) is configured.

## Seed Script Flow (sequence)

```
User           tsx seed.ts         parsePriceList()      Prisma         PostgreSQL
 │                  │                     │                 │                │
 │─── pnpm seed ───►│                     │                 │                │
 │                  │─── readFile(TXT) ──►│                 │                │
 │                  │◄── Buffer ──────────│                 │                │
 │                  │─── decode(ISO-8859)─►                │                │
 │                  │◄── string ──────────│                 │                │
 │                  │─── parseLines() ───►│                 │                │
 │                  │◄── ProductData[] ───│                 │                │
 │                  │                     │                 │                │
 │                  │─── batch 0-999 ──────────────────────►──── INSERT ───►│
 │                  │◄── count ─────────────────────────────◄──── OK ───────│
 │                  │─── batch 1000-1999 ───────────────────►──── INSERT ───►│
 │                  │◄── count ─────────────────────────────◄──── OK ───────│
 │                  │  ... (7 batches for 6944)                             │
 │                  │                     │                 │                │
 │◄── 6944 products ─│                     │                 │                │
```

## Migration / Rollout

No migration required — greenfield. `prisma migrate dev` creates the initial schema. The seed script is manual/developer-side only (not part of app startup). Rollback: `prisma migrate reset` or `git clean -fd` + `pnpm install`.

## Open Questions

- [ ] Should the parser module live in `packages/backend/src/lib/` or in `packages/backend/scripts/`? It's imported by the seed script but is also a standalone utility — voting for `src/lib/` to keep it type-checked by the main build.
- [ ] iconv-lite is a CJS module — need to verify ESM compatibility with tsx and the `"type": "module"` root.
