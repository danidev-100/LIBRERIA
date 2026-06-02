# Design: Auth, Orders & PDF

## Technical Approach

Three stacked PRs extending the existing Express 5 + React 19 scaffold. Backend adds JWT auth middleware, product/order/admin routes, and PDF invoice generation. Frontend adds React Context for auth/cart state, react-query data fetching, and 8 new pages. All routes follow the established `asyncWrap` + `AppError` pattern from `health.ts`.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|----------|--------|-------------|-----------|
| JWT payload | `{ sub, role }` only | Full user object | Min token size, avoids stale data |
| Total calculation | Server-side from DB | Client-submitted | Prevents price manipulation |
| Status machine | Backend enum + transition map | Database CHECK | Clear error messages, explicit per-transition logic |
| PDF library | pdfkit | puppeteer, jspdf | Lightweight, no browser dep, streams |
| Auth state | React Context + localStorage | Zustand, Redux | No extra deps, sufficient for MVP |
| API client | Fetch API | axios | Already sufficient, no added dep |
| Optional auth | `req.user = null` pattern | Separate handlers | Single route handles both public/protected |
| PR split | Stacked: auth → orders → frontend | Single PR | Respects 400-line review budget |

## Data Flow

### Auth Flow
```
Client → POST /api/auth/register { name, email, password }
  → Zod validate body
  → prisma.user.findUnique(email) → 409 if exists
  → bcrypt.hash(password, 10)
  → prisma.user.create
  → 201 { user } (no password)

Client → POST /api/auth/login { email, password }
  → Zod validate body
  → prisma.user.findUnique(email) → 401 if not found
  → bcrypt.compare(password, hash) → 401 if mismatch
  → jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn })
  → 200 { token, user }

Client → GET /api/auth/me [Bearer token]
  → requireAuth: jwt.verify → req.user = { id, role }
  → prisma.user.findUnique(req.user.id) → 200 { user }
```

### Order Creation Flow
```
Client → POST /api/orders [Bearer token] { items: [{ productCode, quantity }] }
  → requireAuth → req.user
  → Zod validate body
  → prisma.$transaction:
      1. findMany Product where code in items
      2. Validate all codes exist → 400 if missing
      3. total = sum(product.price * item.quantity)
      4. create Order { userId, total, status: PENDING, items: { create: [...] } }
  → 201 { order with items }
```

### PDF Generation Flow
```
Client → GET /api/orders/:id/pdf [Bearer token]
  → requireAuth
  → findUnique Order with items.product
  → Ownership check: order.userId === req.user.id || role === ADMIN
  → PDFDocument() → draw header, items table, totals
  → pipe to buffer → 200 Content-Type: application/pdf
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/backend/src/middleware/auth.ts` | Create | `requireAuth`, `optionalAuth`, `requireAdmin` |
| `packages/backend/src/config/env.ts` | Modify | Add JWT_SECRET, JWT_EXPIRES_IN, ADMIN_* vars |
| `packages/backend/src/routes/auth.ts` | Create | POST register/login, GET /me |
| `packages/backend/src/routes/products.ts` | Create | GET list (search, pagination), GET by code |
| `packages/backend/src/routes/orders.ts` | Create | POST create, GET list, GET detail, GET pdf |
| `packages/backend/src/routes/admin.ts` | Create | GET orders, PATCH status, GET users |
| `packages/backend/src/index.ts` | Modify | Mount new routers before 404 handler |
| `packages/backend/prisma/seed.ts` | Create | Seed admin user from env vars |
| `packages/frontend/src/api/client.ts` | Create | Fetch wrapper with JWT auth header |
| `packages/frontend/src/api/auth.ts` | Create | login(), register(), getMe() |
| `packages/frontend/src/api/products.ts` | Create | getProducts(), getProduct() |
| `packages/frontend/src/api/orders.ts` | Create | createOrder(), getOrders(), getOrder(), getOrderPdf() |
| `packages/frontend/src/context/AuthContext.tsx` | Create | Auth provider with localStorage persistence |
| `packages/frontend/src/context/CartContext.tsx` | Create | Cart provider with localStorage persistence |
| `packages/frontend/src/components/Layout.tsx` | Create | Nav with auth-aware links, header, main, footer |
| `packages/frontend/src/components/ProtectedRoute.tsx` | Create | Redirect to /login if unauthenticated |
| `packages/frontend/src/components/AdminRoute.tsx` | Create | Redirect to / if not admin |
| `packages/frontend/src/pages/Login.tsx` | Create | Login form page |
| `packages/frontend/src/pages/Register.tsx` | Create | Register form page |
| `packages/frontend/src/pages/Catalog.tsx` | Create | Product grid with search + pagination |
| `packages/frontend/src/pages/Cart.tsx` | Create | Cart items + place order |
| `packages/frontend/src/pages/MyOrders.tsx` | Create | User's order list |
| `packages/frontend/src/pages/OrderDetail.tsx` | Create | Order detail + PDF download |
| `packages/frontend/src/pages/AdminDashboard.tsx` | Create | All orders + status management |
| `packages/frontend/src/pages/AdminUsers.tsx` | Create | User list for admins |
| `packages/frontend/src/types/index.ts` | Create | Shared TS interfaces |
| `packages/frontend/src/App.tsx` | Modify | Replace inline layout with router + providers |
| `packages/frontend/src/main.tsx` | Modify | Wrap App with QueryClientProvider |

## Route Map

```
POST   /api/auth/register  → registerUser     (public)
POST   /api/auth/login     → loginUser        (public)
GET    /api/auth/me        → getCurrentUser   (requireAuth)
GET    /api/products       → listProducts     (optionalAuth, search & pagination)
GET    /api/products/:code → getProduct       (optionalAuth)
POST   /api/orders         → createOrder      (requireAuth)
GET    /api/orders         → listMyOrders     (requireAuth)
GET    /api/orders/:id     → getOrder         (requireAuth + ownership)
GET    /api/orders/:id/pdf → getOrderPdf      (requireAuth + ownership)
GET    /api/admin/orders   → listAllOrders    (requireAuth + admin)
PATCH  /api/admin/orders/:id/status → updateStatus (requireAuth + admin)
GET    /api/admin/users    → listUsers        (requireAuth + admin)
```

## Interfaces / Contracts

### Backend Types (Extend Express Request)

```typescript
// packages/backend/src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: { id: number; role: "CLIENT" | "ADMIN" } | null;
  }
}
```

### Middleware Signatures

```typescript
// requireAuth: 401 if req.user missing
// optionalAuth: sets req.user if token present, null otherwise
// requireAdmin: 403 if role !== "ADMIN" (call after requireAuth)
```

### Status Transition Map

```typescript
const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
```

### Frontend Types

```typescript
interface User { id: number; name: string; email: string; role: "CLIENT" | "ADMIN"; }
interface Product { code: string; description: string; price: number; isActive: boolean; }
interface CartItem { product: Product; quantity: number; }
interface Order { id: number; userId: number; status: string; total: number; createdAt: string; items: OrderItem[]; user?: User; }
interface OrderItem { id: number; productCode: string; product: Product; quantity: number; unitPrice: number; }
```

### Frontend Component Tree

```
<QueryClientProvider>
  <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        <Layout>              ← nav with auth-aware links
          <Routes>
            /catalog          → CatalogPage      (public)
            /login            → LoginPage        (public)
            /register         → RegisterPage     (public)
            /cart             → CartPage         (ProtectedRoute)
            /orders           → MyOrdersPage     (ProtectedRoute)
            /orders/:id       → OrderDetailPage  (ProtectedRoute)
            /admin/orders     → AdminDashboard   (AdminRoute)
            /admin/users      → AdminUsersPage   (AdminRoute)
            *                 → 404
          </Routes>
        </Layout>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
</QueryClientProvider>
```

## Backend Middleware Chain Pattern

```typescript
// requireAuth + requireAdmin compose explicitly per route:
router.patch(
  "/api/admin/orders/:id/status",
  requireAuth,      // gets user from token, 401 if missing
  requireAdmin,     // checks role, 403 if not ADMIN
  asyncWrap(updateOrderStatusHandler),
);

// optionalAuth for public-but-aware routes:
router.get(
  "/api/products",
  optionalAuth,     // sets req.user or null, never rejects
  asyncWrap(listProductsHandler),
);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Auth middleware | Token verify, missing/expired/invalid token | Manual curl |
| Order transitions | Valid/invalid state changes | Manual curl |
| PDF generation | Content type, valid PDF output | Manual download + open |
| Frontend auth flow | Login → persist → restore → logout | Manual browser |
| Cart → order flow | Add items → place order → verify in DB | Manual browser |
| Admin flows | Status update, user list, order visibility | Manual browser |

No automated testing infra exists yet. Manual testing with curl + browser for MVP.

## Migration / Rollout

- **PR 1**: Install jsonwebtoken, bcryptjs, @types/jsonwebtoken. Add JWT_SECRET to .env. Create auth middleware + routes + seed script.
- **PR 2**: Install pdfkit. Create product, order, admin routes. Mount in index.ts.
- **PR 3**: Frontend dependencies already in package.json (react-router-dom, @tanstack/react-query). Create all components, contexts, pages.
- Run `prisma migrate dev` if schema changed (it shouldn't — schema from change 1 already includes all models).
- Run seed script to create admin user.

## Open Questions

- [x] No test infrastructure — manual only for MVP (confirmed in proposal)
- [ ] PDF character encoding for Spanish special chars (ñ, accents) — test with real product descriptions before PR 2 merge

## Implementation Order

**PR 1 (~200 lines): Auth Backend + Seed Admin**
- env.ts additions (JWT_SECRET, JWT_EXPIRES_IN, ADMIN_*)
- middleware/auth.ts (requireAuth, optionalAuth, requireAdmin)
- routes/auth.ts (register, login, me)
- prisma/seed.ts (admin user seed)
- index.ts (mount auth router)

**PR 2 (~350 lines): Orders Backend + PDF**
- routes/products.ts (list with search, detail by code)
- routes/orders.ts (create, list, detail, pdf)
- routes/admin.ts (list orders, update status, list users)
- index.ts (mount product, order, admin routers)

**PR 3 (~1,300 lines): Frontend Complete**
- api/ (client, auth, products, orders)
- context/ (AuthContext, CartContext)
- components/ (Layout, ProtectedRoute, AdminRoute)
- pages/ (Login, Register, Catalog, Cart, MyOrders, OrderDetail, AdminDashboard, AdminUsers)
- types/index.ts
- App.tsx, main.tsx modifications
