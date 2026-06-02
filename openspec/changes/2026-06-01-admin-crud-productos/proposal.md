# Proposal: admin-crud-productos

## Intent

The bookstore owner needs to manage the product catalog (create, edit, deactivate products, reload from TXT) without direct database access. Currently the admin can view orders and users but cannot modify products — every change requires a developer or DB connection.

## Scope

### In Scope
- 5 backend admin endpoints: Create, Update, Soft Delete, Re-seed from TXT, List all
- Admin Products page with table, search, pagination, active/inactive filter toggle
- Create/Edit product modals with validation (code format, price > 0, required fields)
- Deactivate button with confirmation dialog
- "Recargar desde TXT" button with confirmation and result feedback

### Out of Scope
- Batch import/export, product images, category management — all deferred

## Capabilities

### New Capabilities
- `admin-products`: Admin product CRUD — backend routes + frontend page to create, edit, deactivate, and re-seed the catalog

### Modified Capabilities
- None — existing `product-catalog` (public GET endpoints) and `frontend-admin` (orders + users UI) are unchanged at the spec level

## Approach

1. **Backend**: Extend `packages/backend/src/routes/admin.ts` with 5 new routes under `/api/admin/products*`, reusing `requireAuth` + `requireAdmin` middleware, Zod validation, `asyncWrap`, and `AppError` patterns.
2. **Re-seed**: Reuse existing `parsePriceList` from `lib/`; upsert via `prisma.product.upsert` matching on `code`.
3. **Soft delete**: Set `isActive = false`. If the product has orders, skip hard delete — preserve historical data.
4. **Frontend**: New `AdminProducts.tsx` page replicating the table/pagination/filter patterns from `AdminDashboard.tsx` (react-query, Tailwind).
5. **Modals**: Inline state-managed dialogs for create/edit/confirmation — no modal library, keep it simple.
6. **Routing**: Add `/admin/products` to the frontend router and an "Productos" link in the admin nav.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| packages/backend/src/routes/admin.ts | Modified | Add 5 product CRUD routes |
| packages/frontend/src/pages/AdminProducts.tsx | New | Product management page |
| packages/frontend/src/App.tsx | Modified | Add `/admin/products` route |
| packages/frontend/src/api/products.ts | New | Admin product API functions |
| packages/frontend/src/components/Navbar.tsx | Modified | Add "Productos" nav link for admin |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Re-seed on 6,944 products could feel slow | Low | Run upserts in batches; show progress/result toast |
| Hard-deleting a product linked to orders | Low | Only soft-delete; server checks for order references |

## Rollback Plan

`git revert` the merge commit. For the re-seed endpoint, the TXT file is the source of truth — re-running restores the exact same state.

## Dependencies

None — reuses existing `parsePriceList`, Prisma client, auth middleware, and react-query patterns already established.

## Success Criteria

- [ ] `POST /api/admin/products` creates product returns 201; duplicate code returns 409
- [ ] `PUT /api/admin/products/:code` partial update; 404 for non-existent code
- [ ] `DELETE /api/admin/products/:code` sets `isActive=false`; products with orders remain in DB
- [ ] `POST /api/admin/products/reload` upserts all TXT products, returns `{ inserted, updated, total }`
- [ ] `GET /api/admin/products` paginated, searchable, filterable by `isActive`
- [ ] Frontend: create → table refreshes, edit → fields update, deactivate → confirmation dialog, reload → result shown
- [ ] `pnpm type-check` passes in both packages
