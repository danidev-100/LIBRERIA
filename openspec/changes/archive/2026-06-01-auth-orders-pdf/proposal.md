# Proposal: auth-orders-pdf

## Intent

Add authentication, order management with PDF invoice generation, and the complete frontend UI to the LIBRERIA bookstore app. This is the main feature change — delivering all user-facing capabilities on top of the scaffold from change 1.

## Scope

### In Scope

- Auth backend: register, login, JWT middleware, admin seed
- Product catalog GET endpoints: list with search, detail by code
- Order management: create, list, detail, admin status update, PDF invoice download
- Frontend: AuthContext, CartContext, API client, login/register, catalog, cart, orders, admin dashboard, auth-aware nav

### Out of Scope

Email notifications, stock/inventory, admin product CRUD, refresh tokens, payment integration — all deferred.

## Capabilities

### New Capabilities

- `user-auth`: JWT register/login/me, auth middleware, admin seed
- `order-management`: Order CRUD, admin status mgmt, PDF invoice
- `frontend-auth`: AuthContext, login/register pages, nav
- `frontend-cart`: CartContext, cart page, localStorage
- `frontend-catalog`: Product catalog view with search
- `frontend-orders`: My orders, detail, PDF download
- `frontend-admin`: Dashboard with order status management

### Modified Capabilities

- `product-catalog`: Adds GET /api/products endpoints (list + detail) — new spec-level requirement

## Approach

1. Backend extends existing Express 5 patterns: new routers mounted in index.ts per resource
2. JWT (HS256, 24h) via jsonwebtoken; passwords via bcryptjs (10 rounds)
3. Order total computed server-side from Product prices (never trust client)
4. Status transitions enforced server-side: PENDING→CONFIRMED→SHIPPED→DELIVERED, CANCELLED only from PENDING
5. PDF via pdfkit on GET /api/orders/:id/pdf
6. Frontend: React Context for auth/cart state, @tanstack/react-query for API data, Fetch API (no axios)
7. 3 stacked PRs: (1) Auth backend, (2) Orders backend + PDF, (3) Full frontend

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| packages/backend/src/routes/auth.ts | New | Auth endpoints |
| packages/backend/src/routes/products.ts | New | Product catalog endpoints |
| packages/backend/src/routes/orders.ts | New | Order endpoints + PDF |
| packages/backend/src/routes/admin.ts | New | Admin order/user endpoints |
| packages/backend/src/middleware/auth.ts | New | JWT + admin middleware |
| packages/backend/src/index.ts | Modified | Mount new routers |
| packages/backend/prisma/seed.ts | Modified | Seed admin user |
| packages/frontend/src/context/AuthContext.tsx | New | Auth state |
| packages/frontend/src/context/CartContext.tsx | New | Cart state |
| packages/frontend/src/api/client.ts | New | Fetch wrapper |
| packages/frontend/src/pages/*.tsx | New | All pages |
| packages/frontend/src/components/Navbar.tsx | New | Auth-aware nav |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PDF special chars (pdfkit + latin-1) | Med | Test with real product descriptions |
| Frontend PR ~1,300 lines exceeds review budget | High | Split into stacked PRs within the chain |
| No test infrastructure | Med | Manual curl + browser testing for MVP |
| JWT secret not rotated | Low | Document as config; user responsibility |

## Rollback Plan

1. Per stacked PR: `git revert` the merge commit
2. Full rollback: `git reset --hard <commit-before-change1>`; re-archive

## Dependencies

jsonwebtoken, bcryptjs, pdfkit, @types/jsonwebtoken.

## Success Criteria

- [ ] `curl POST /api/auth/register` creates user and returns JWT
- [ ] `curl POST /api/auth/login` returns JWT; JWT works for protected routes
- [ ] `GET /api/products?q=...` returns filtered results
- [ ] `POST /api/orders` creates order with correct server-calculated total
- [ ] `GET /api/orders/:id/pdf` returns valid PDF with invoice
- [ ] Admin can update order status; invalid transitions rejected
- [ ] Frontend: register → login → browse → add to cart → place order → view PDF
- [ ] `pnpm type-check` passes in both packages
