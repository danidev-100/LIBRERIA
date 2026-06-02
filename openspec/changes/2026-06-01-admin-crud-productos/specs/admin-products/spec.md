# Admin Products Specification

## Purpose

Admin product CRUD operations (backend) and product management page (frontend) for the bookstore owner to manage the catalog without database access.

## Requirements

### Requirement: List All Products

`GET /api/admin/products` MUST return paginated products including inactive ones. Supports `search` (ILIKE code/description), `isActive` (boolean), `page` (default 1), `limit` (default 20, max 100). Response: `{ products[], total, page, totalPages }`. MUST require auth + admin role.

#### Scenario: Paginated list

- GIVEN 50 products (10 inactive)
- WHEN GET /api/admin/products?page=1&limit=10
- THEN status 200, body contains 10 products, total=50, page=1, totalPages=5

#### Scenario: Filter by isActive

- GIVEN 40 active and 10 inactive products
- WHEN GET /api/admin/products?isActive=true
- THEN status 200, only active products returned, total=40

#### Scenario: Search by code or description

- GIVEN products with code "LIBRO123" and description "Manual de JS"
- WHEN GET /api/admin/products?search=manual
- THEN status 200, results contain "Manual de JS" but not "LIBRO123"

#### Scenario: Empty results

- WHEN GET /api/admin/products?search=ZZZZNOTEXIST
- THEN status 200, products=[], total=0

#### Scenario: Unauthorized access

- WHEN GET /api/admin/products without auth header
- THEN status 401

#### Scenario: Non-admin user

- GIVEN a CLIENT token
- WHEN GET /api/admin/products
- THEN status 403

### Requirement: Create Product

`POST /api/admin/products` MUST create a product. Body: `{ code: string (8 chars, alphanumeric, required), description: string (required), price: number (>= 0, required), category?: string }`. MUST return 201 `{ product }`. MUST return 409 if code exists. MUST return 400 on validation failure.

#### Scenario: Create product successfully

- GIVEN a valid body `{ code: "LIBRO001", description: "El Principito", price: 1500 }`
- WHEN POST /api/admin/products
- THEN status 201, response.product.code = "LIBRO001"

#### Scenario: Duplicate code

- GIVEN existing product with code "LIBRO001"
- WHEN POST /api/admin/products `{ code: "LIBRO001", description: "Otro", price: 100 }`
- THEN status 409

#### Scenario: Invalid code format

- WHEN POST /api/admin/products `{ code: "ABC", description: "X", price: 10 }`
- THEN status 400

#### Scenario: Missing required fields

- WHEN POST /api/admin/products `{ description: "X", price: 10 }`
- THEN status 400

### Requirement: Update Product

`PUT /api/admin/products/:code` MUST partially update a product. Body: `{ description?, price?, category?, isActive? }`. MUST return 200 `{ product }`. MUST return 404 if code not found. MUST return 400 on invalid price.

#### Scenario: Update description and price

- GIVEN product "LIBRO001" with description "Old" and price 100
- WHEN PUT /api/admin/products/LIBRO001 `{ description: "New", price: 200 }`
- THEN status 200, response.product.description = "New", price = 200

#### Scenario: Product not found

- WHEN PUT /api/admin/products/NOPE `{ description: "X" }`
- THEN status 404

#### Scenario: Invalid price

- WHEN PUT /api/admin/products/LIBRO001 `{ price: -5 }`
- THEN status 400

### Requirement: Soft Delete (Deactivate)

`DELETE /api/admin/products/:code` MUST set `isActive = false`. MUST return 200 `{ product, deactivated: true }`. MUST return 404 if not found. MUST return 400 if already inactive.

#### Scenario: Deactivate active product

- GIVEN product "LIBRO001" with isActive=true
- WHEN DELETE /api/admin/products/LIBRO001
- THEN status 200, product.isActive=false, deactivated=true

#### Scenario: Deactivate already inactive product

- GIVEN product "LIBRO001" with isActive=false
- WHEN DELETE /api/admin/products/LIBRO001
- THEN status 400 "Product is already inactive"

#### Scenario: Deactivate non-existent product

- WHEN DELETE /api/admin/products/NOPE
- THEN status 404

### Requirement: TXT Upload

`POST /api/admin/products/upload` MUST accept multipart/form-data with field `file` (.txt). MUST parse via `parsePriceList`, upsert products matching on `code`, delete temp file after processing. MUST return 200 `{ inserted, updated, total, errors: string[] }`. MUST return 400 if no file, wrong extension, or parse failure.

#### Scenario: Upload valid TXT with new and existing products

- GIVEN 100 existing products and a TXT with 150 products (50 new, 100 existing)
- WHEN POST /api/admin/products/upload with .txt file
- THEN status 200, inserted=50, updated=100, total=150, errors=[]

#### Scenario: No file uploaded

- WHEN POST /api/admin/products/upload without file field
- THEN status 400

#### Scenario: Wrong file extension

- WHEN POST /api/admin/products/upload with .csv file
- THEN status 400

#### Scenario: Unparseable TXT

- GIVEN a malformed TXT file
- WHEN POST /api/admin/products/upload with that file
- THEN status 400 with parse error details

### Requirement: Admin Products Page

The system MUST serve `/admin/products` (protected by AdminRoute). Layout: header "Productos", action buttons "Crear Producto" and "Subir Lista TXT", search bar (debounced 300ms), filter toggle "Todos / Activos / Inactivos", products table (Código, Descripción, Precio, Categoría, Activo badge, Acciones), pagination. MUST add "Productos" nav link for admin users in the Layout.

#### Scenario: Admin navigates to products page

- GIVEN admin user on /admin/products
- THEN table renders with paginated products, Create/Upload buttons, search bar, filter toggles

#### Scenario: Filter by active/inactive

- GIVEN the products page
- WHEN clicking "Inactivos" filter
- THEN only inactive products appear

#### Scenario: Search with debounce

- GIVEN the products page
- WHEN typing in search bar
- THEN API call fires after 300ms idle

#### Scenario: Admin nav shows Productos link

- GIVEN admin user
- THEN nav displays "Productos" link alongside "Admin" and "Usuarios"

### Requirement: Create Product Modal

Clicking "Crear Producto" MUST open a modal with fields Código (8 chars), Descripción, Precio, Categoría (optional). Client-side validation: required fields, code format /^[A-Za-z0-9]{8}$/, price > 0. On submit: POST /api/admin/products → on success close modal, refresh list, toast "Producto creado". On error: show API error message.

#### Scenario: Successful create flow

- GIVEN the create modal open
- WHEN filling valid data and submitting
- THEN POST succeeds, modal closes, list refreshes, toast appears

#### Scenario: Validation error on code format

- WHEN entering "ABC" as code
- THEN inline error "El código debe tener 8 caracteres alfanuméricos"

#### Scenario: API error displayed

- WHEN submitting a duplicate code
- THEN API error message shown in modal

### Requirement: Edit Product Modal

Clicking "Editar" on a product row MUST open a pre-filled modal. Code shown as disabled text (not editable). Same fields as create minus code. On submit: PUT /api/admin/products/:code → on success close modal, refresh list, toast "Producto actualizado".

#### Scenario: Successful edit

- GIVEN edit modal open with product "LIBRO001"
- WHEN changing description and submitting
- THEN PUT succeeds, modal closes, list refreshes, toast appears

#### Scenario: Code is read-only

- GIVEN edit modal for "LIBRO001"
- THEN code field is disabled/display-only

### Requirement: Deactivate and Reactivate

Clicking "Desactivar" MUST show confirmation dialog "¿Estás seguro de desactivar {description}?". On confirm: DELETE /api/admin/products/:code → refresh list, toast "Producto desactivado". If product is already inactive, show "Reactivar" button that sets isActive=true via PUT.

#### Scenario: Deactivate with confirmation

- GIVEN an active product row
- WHEN clicking "Desactivar"
- THEN confirmation dialog appears
- WHEN confirming
- THEN DELETE succeeds, list refreshes, toast appears

#### Scenario: Reactivate inactive product

- GIVEN an inactive product row showing "Reactivar"
- WHEN clicking "Reactivar"
- THEN PUT sets isActive=true, list refreshes

### Requirement: Upload TXT Flow

Clicking "Subir Lista TXT" MUST open file input (.txt only). After selection: confirmation dialog "¿Actualizar catálogo con {filename}?". On confirm: POST /api/admin/products/upload with FormData. On success: show result summary "Insertados: X, Actualizados: Y, Total: Z". On error: show error details. Refresh list after success.

#### Scenario: Successful TXT upload

- GIVEN a valid .txt file selected
- WHEN confirming the upload dialog
- THEN POST succeeds, result summary shown, list refreshes

#### Scenario: Upload error feedback

- GIVEN a malformed .txt file selected
- WHEN confirming the upload dialog
- THEN error message displayed, list unchanged
