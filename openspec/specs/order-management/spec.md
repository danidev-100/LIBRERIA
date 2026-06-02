# Order Management Specification

## Purpose

Order CRUD, admin status management, and PDF invoice generation.

## Requirements

### Requirement: Create Order

The system MUST expose `POST /api/orders` (authenticated). It MUST accept `{ items: [{ productCode, quantity }] }`. For each item, it MUST verify the product exists and is active. Total MUST be calculated server-side as `SUM(unitPrice * quantity)` using prices from the DB. The order and items MUST be created in a Prisma transaction. Response MUST be 201 with the order including items.

#### Scenario: Successful order creation

- GIVEN an authenticated user and 2 active products with known prices
- WHEN POST /api/orders is called with valid items
- THEN status is 201 and the response body contains the order with correct server-calculated total

#### Scenario: Non-existent product

- GIVEN an authenticated user and a productCode that does not exist
- WHEN POST /api/orders is called with that productCode
- THEN status is 400 with an error message

### Requirement: List User Orders

The system MUST expose `GET /api/orders` (authenticated). It MUST return the authenticated user's orders only, paginated with `?page` (default 1) and `?limit` (default 20, max 100). Response: `{ orders[], total, page, totalPages }`.

#### Scenario: Paginated order list

- GIVEN an authenticated user with 25 orders
- WHEN GET /api/orders?page=1&limit=10 is called
- THEN status is 200 and body contains 10 orders, total=25, page=1, totalPages=3

### Requirement: Order Detail

The system MUST expose `GET /api/orders/:id` (authenticated). It MUST return the order with its items. Users MAY only view their own orders; admins MAY view any order. 403 if not own and not admin. 404 if not found.

#### Scenario: Own order detail

- GIVEN an authenticated user who owns order 42
- WHEN GET /api/orders/42 is called
- THEN status is 200 with the order and its items

#### Scenario: Another user's order

- GIVEN an authenticated CLIENT user who does NOT own order 42
- WHEN GET /api/orders/42 is called
- THEN status is 403

### Requirement: PDF Invoice

The system MUST expose `GET /api/orders/:id/pdf` (authenticated). It MUST generate a PDF invoice using pdfkit with order details, items, and total. Response MUST be `application/pdf`. Access rules are identical to order detail.

#### Scenario: PDF download

- GIVEN an authenticated user who owns order 42 with items
- WHEN GET /api/orders/42/pdf is called
- THEN status is 200 with Content-Type application/pdf and a valid PDF body

### Requirement: Admin List All Orders

The system MUST expose `GET /api/admin/orders` (admin only). It MUST return all orders with user info, paginated. Optional `?status` filter. Response: `{ orders[], total, page, totalPages }`.

#### Scenario: Admin lists orders filtered by status

- GIVEN an admin user and orders with various statuses
- WHEN GET /api/admin/orders?status=PENDING is called
- THEN status is 200 and only PENDING orders are returned

### Requirement: Admin Update Order Status

The system MUST expose `PATCH /api/admin/orders/:id/status` (admin only). It MUST accept `{ status }` and validate the transition: PENDING→CONFIRMED→SHIPPED→DELIVERED. CANCELLED is only allowed from PENDING. Invalid transitions MUST return 400.

#### Scenario: Valid status transition

- GIVEN an order with status PENDING
- WHEN PATCH /api/admin/orders/42/status with `{ status: "CONFIRMED" }`
- THEN status is 200 and order.status is CONFIRMED

#### Scenario: Invalid transition

- GIVEN an order with status DELIVERED
- WHEN PATCH /api/admin/orders/42/status with `{ status: "CONFIRMED" }`
- THEN status is 400 with error

### Requirement: Admin List Users

The system MUST expose `GET /api/admin/users` (admin only). It MUST return all users without the password field, paginated.

#### Scenario: Admin views user list

- GIVEN an admin user and registered users exist
- WHEN GET /api/admin/users is called
- THEN status is 200 and no user object contains a password field
