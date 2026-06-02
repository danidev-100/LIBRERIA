# Tasks: admin-crud-productos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~410 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Backend → PR 2: Frontend |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend admin product routes | PR 1 | base: main; multer + 5 routes |
| 2 | Frontend page + API + routing | PR 2 | base: main; depends on PR 1 |

## Phase 1: Backend — Admin Product Routes

- [x] **1.1** Install `multer` + `@types/multer` in `packages/backend/` for TXT upload handling
- [x] **1.2** Add `GET /api/admin/products` — paginated list with `search` (ILIKE code/description), `isActive` filter, pagination; reuse `paginationSchema` + `requireAuth` + `requireAdmin` patterns
- [x] **1.3** Add `POST /api/admin/products` — create product; Zod validation (code 8-alphanum, required fields, price >= 0); return 409 on duplicate code
- [x] **1.4** Add `PUT /api/admin/products/:code` — partial update (description, price, category, isActive); return 404 if not found, 400 on invalid price
- [x] **1.5** Add `DELETE /api/admin/products/:code` — soft delete (set `isActive=false`); return 400 if already inactive, 404 if not found
- [x] **1.6** Add `POST /api/admin/products/upload` — multer file upload (.txt), `parsePriceList` → `prisma.product.upsert`, delete temp file, return `{ inserted, updated, total, errors }`

## Phase 2: Frontend — API Layer & Types

- [x] **2.1** Add `UploadResultResponse` and `DeactivateProductResponse` types to `packages/frontend/src/types/index.ts`
- [x] **2.2** Create `packages/frontend/src/api/admin-products.ts` — 5 functions: `adminGetProducts(search, isActive, page)`, `adminCreateProduct(data)`, `adminUpdateProduct(code, data)`, `adminDeactivateProduct(code)`, `adminUploadProductList(file)`
- [x] **2.3** Add `postFormData` method to `packages/frontend/src/api/client.ts` for multipart file upload (no Content-Type header, let browser set boundary)

## Phase 3: Frontend — AdminProducts Page

- [x] **3.1** Create `packages/frontend/src/pages/AdminProducts.tsx` — table (código, descripción, precio, categoría, activo badge, acciones), search bar (300ms debounce), filter toggles (Todos/Activos/Inactivos), pagination (matching `AdminDashboard` patterns)
- [x] **3.2** Add create-product modal — fields: código (8 chars), descripción, precio, categoría (optional); client-side validation: `/^[A-Za-z0-9]{8}$/`, price > 0; POST on submit → close + refresh + toast
- [x] **3.3** Add edit-product modal — pre-filled, code disabled/read-only; PUT on submit → close + refresh + toast
- [x] **3.4** Add deactivate button with confirmation dialog; show "Reactivar" for inactive products (PUT isActive=true)
- [x] **3.5** Add "Subir Lista TXT" button → file picker (.txt) → confirmation dialog → POST upload → show result summary (inserted/updated/total/errors) → refresh list

## Phase 4: Routing & Navigation

- [x] **4.1** Add `/admin/products` route to `packages/frontend/src/App.tsx` with `AdminRoute` wrapper
- [x] **4.2** Add "Productos" nav link for admin users in `packages/frontend/src/components/Layout.tsx` (both desktop and mobile menus)

## Verification Steps

- [x] `pnpm type-check` passes in both packages
- [ ] `GET /api/admin/products` returns paginated results with search and isActive filter
- [ ] `POST /api/admin/products` creates and returns 201; duplicate code returns 409; invalid code returns 400
- [ ] `PUT /api/admin/products/:code` updates partial fields; 404 on missing code; 400 on negative price
- [ ] `DELETE /api/admin/products/:code` sets isActive=false; 400 if already inactive
- [ ] `POST /api/admin/products/upload` with .txt file upserts and returns summary; no file → 400; .csv → 400
- [ ] Frontend table renders with correct data; search debounces at 300ms; filter toggles work
- [ ] Create modal validates client-side; POST error shown inline; success closes + refreshes
- [ ] Edit modal shows disabled code; PUT on submit updates row
- [ ] Deactivate shows confirmation; reactivate toggles isActive
- [ ] Upload flow: file picker → confirm → result summary → list refresh
- [ ] Nav link visible for admin users only; route guarded by AdminRoute
