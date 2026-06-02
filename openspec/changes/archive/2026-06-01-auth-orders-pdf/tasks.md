# Tasks: Auth, Orders & PDF

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,850 (PR1: 200, PR2: 350, PR3: 1,300) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Auth) → PR 2 (Orders+PDF) → PR 3 (Frontend) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Auth backend + admin seed | PR 1 | ~200 lines, base=main |
| 2 | Orders backend + product routes + PDF | PR 2 | ~350 lines, base=main, depends on PR 1 |
| 3 | Complete frontend UI | PR 3 | ~1,300 lines, base=main, depends on PR 1+2 |

---

## PR 1: Auth Backend + Seed Admin (~200 lines)

- [x] 1.1 **Auth deps & config** — Add jsonwebtoken, bcryptjs, @types to `packages/backend/package.json`; extend `env.ts` with `JWT_SECRET` (min 32 chars), `JWT_EXPIRES_IN` (default `"24h"`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`; update `.env.example`
- [x] 1.2 **Auth middleware** — Create `packages/backend/src/middleware/auth.ts`: `requireAuth` (extract Bearer token, `jwt.verify`, attach `{ id, role }` to `req`, 401 if invalid/missing), `optionalAuth` (same but never rejects)
- [x] 1.3 **Admin middleware** — Create `packages/backend/src/middleware/admin.ts`: checks `req.user.role === 'ADMIN'`, returns 403 if not
- [x] 1.4 **Auth routes** — Create `packages/backend/src/routes/auth.ts`: `POST /register` (Zod validate, bcrypt hash, create user, 201), `POST /login` (find by email, bcrypt compare, sign JWT, return `{ token, user }`), `GET /me` (requireAuth, findUnique, return user sans password). Mount in `index.ts`
- [x] 1.5 **Admin seed** — Create `packages/backend/scripts/seed-admin.ts`: reads `ADMIN_*` env vars, upserts admin user by email

### PR 1 Verification
- `POST /api/auth/register` with valid body → 201 + user (no password)
- `POST /api/auth/register` with duplicate email → 409
- `POST /api/auth/login` with valid credentials → 200 + JWT + user
- `POST /api/auth/login` with wrong password → 401
- `GET /api/auth/me` with valid token → 200 + user
- `GET /api/auth/me` without token → 401
- Seed script creates admin user from env vars
- `pnpm type-check` passes

---

## PR 2: Orders Backend + PDF (~350 lines)

- [ ] 2.1 **Product routes** — Create `packages/backend/src/routes/products.ts`: `GET /api/products` (paginated, `?search` ILIKE code/description, `?page`/`?limit`), `GET /api/products/:code` (findUnique, 404 if missing). Optional auth. Mount in `index.ts`
- [ ] 2.2 **Order routes** — Create `packages/backend/src/routes/orders.ts`: `POST /api/orders` (requireAuth, Zod validate items, transaction: find products + calc total + create order+items, 201), `GET /api/orders` (requireAuth, findMany by userId, paginated), `GET /api/orders/:id` (requireAuth, findUnique with items+product, ownership check). Mount in `index.ts`
- [ ] 2.3 **PDF generation** — Create `packages/backend/src/lib/pdf-generator.ts`: `generateOrderInvoice(order)` using pdfkit — header (LIBRERIA + order # + date), customer info, items table (code, desc, qty, unit price, subtotal), total, status. Returns PDF buffer. Add `pdfkit` to `package.json`
- [ ] 2.4 **Order PDF route** — Add `GET /api/orders/:id/pdf` to `orders.ts`: requireAuth + ownership check, generate PDF buffer, respond `Content-Type: application/pdf` + `Content-Disposition: attachment`
- [ ] 2.5 **Admin routes** — Create `packages/backend/src/routes/admin.ts`: `GET /api/admin/orders` (requireAuth+admin, all orders with user, optional `?status` filter, paginated), `PATCH /api/admin/orders/:id/status` (requireAuth+admin, validate transition map), `GET /api/admin/users` (requireAuth+admin, list users without passwords, paginated). Mount in `index.ts`

### PR 2 Verification
- `GET /api/products?search=abc` → filtered results, paginated
- `GET /api/products/NONEXIST` → 404
- `POST /api/orders` with valid items → 201 + correct server-calculated total
- `POST /api/orders` with invalid code → 400
- `GET /api/orders/:id/pdf` → 200 + `application/pdf`
- `PATCH /api/admin/orders/:id/status` with valid transition → 200
- `PATCH` with invalid transition (`DELIVERED`→`CONFIRMED`) → 400
- `pnpm type-check` passes

---

## PR 3: Frontend Complete (~1,300 lines)

- [x] 3.1 **API layer** — Create `packages/frontend/src/types/index.ts` (shared TS interfaces), `api/client.ts` (fetch wrapper with `Authorization` header from localStorage, error handling), `api/auth.ts`, `api/products.ts`, `api/orders.ts` (all endpoint functions)
- [x] 3.2 **AuthContext + guards** — Create `context/AuthContext.tsx` (state: user/token/isLoading, on mount validate token via `GET /auth/me`, methods: login/register/logout, provide: user/isAuthenticated/isAdmin), `components/ProtectedRoute.tsx` (redirect to `/login` if unauthenticated), `components/AdminRoute.tsx` (redirect to `/` if not admin)
- [x] 3.3 **CartContext + Cart page** — Create `context/CartContext.tsx` (state: `items[{product, quantity}]`, methods: addItem/removeItem/updateQuantity/clearCart, computed: totalItems/totalPrice, localStorage persistence), `pages/Cart.tsx` (items table, quantity controls, total, "Place Order" → `createOrder` → clear → redirect to `/orders/:id`)
- [x] 3.4 **Login + Register pages** — Create `pages/Login.tsx` (email+password form, calls `login()`, redirect to `/catalog`, error display), `pages/Register.tsx` (name+email+password form, calls `register()`, redirect to `/login` on success, validation errors)
- [x] 3.5 **Catalog page** — Create `pages/Catalog.tsx` (fetch products via react-query, debounced search input filtering code/description, product grid cards with "Add to Cart", pagination, loading/error states)
- [x] 3.6 **Orders pages** — Create `pages/MyOrders.tsx` (fetch user orders via react-query, table with order #/date/status badge/total, click row → `/orders/:id`), `pages/OrderDetail.tsx` (fetch order by id, header info, items table, "Download PDF" button via blob download, loading/error states)
- [x] 3.7 **Admin pages** — Create `pages/AdminDashboard.tsx` (fetch all orders via react-query, status filter tabs/dropdown, orders table with user info + inline status change dropdown/buttons, loading/error), `pages/AdminUsers.tsx` (fetch users via react-query, table without passwords)
- [x] 3.8 **Layout + routing** — Create `components/Layout.tsx` (nav: logo, Catalog, Cart with badge, conditional Login/Register or My Orders/Logout + admin links). Update `App.tsx` (wrap with `AuthProvider > CartProvider > BrowserRouter`, all routes with protection wrappers, `/` → redirect to `/catalog`). Update `main.tsx` (wrap with `QueryClientProvider`)

### PR 3 Verification
- Register → Login → persistent session across page reload
- Browse catalog → search → see filtered results
- Add items to cart → cart shows correct total
- Place order → redirects to order detail with correct total
- Download PDF from order detail → valid PDF file
- Admin dashboard shows all orders → filter by status → inline status change works
- Admin users page shows users without passwords
- Nav shows correct links per auth state (anonymous / client / admin)
- `pnpm type-check` passes in frontend package
