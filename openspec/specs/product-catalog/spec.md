# Product Catalog Specification

## Purpose

Define the Prisma database schema (Product, User, Order, OrderItem + Role, OrderStatus enums) and the seed script that populates the Product catalog from the parsed TXT price list.

## Requirements

### Requirement: Database Models

The Prisma schema MUST define four models. `Product` with `code` (String, PK), `description` (String), `price` (Decimal(12,2)), `isActive` (Boolean), `createdAt`, `updatedAt`. `User` with `id` (Int, PK), `email` (String, unique), `name`, `password`, `role` (Role). `Order` with `id` (Int, PK), `userId` (FK→User), `status` (OrderStatus), `total` (Decimal(12,2)), `createdAt`. `OrderItem` with `id` (Int, PK), `orderId` (FK→Order), `productCode` (FK→Product), `quantity`, `unitPrice` (Decimal(12,2)). All monetary fields MUST use `Decimal(12,2)`.

#### Scenario: Full migration creates all tables

- GIVEN the Prisma schema
- WHEN `prisma migrate dev` runs
- THEN PostgreSQL has tables `Product`, `User`, `Order`, `OrderItem` with correct columns and types

### Requirement: Model Relationships

`OrderItem` MUST reference `Product` via `productCode`. `User` MUST cascade delete associated `Order` records.

#### Scenario: Deleting a user removes their orders

- GIVEN a User with 2 Orders
- WHEN the User is deleted
- THEN the Orders and their OrderItems are also cascade-deleted

### Requirement: Enum Values

The schema MUST define `Role` (`CLIENT`, `ADMIN`) and `OrderStatus` (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`) as native Prisma enums.

#### Scenario: Role enum constraints

- GIVEN the Prisma schema
- WHEN inserting a User with `role: "CLIENT"`
- THEN the insert succeeds
- WHEN attempting `role: "MANAGER"`
- THEN the database rejects the value

### Requirement: Seed Script — Insertion

The seed script MUST parse the TXT file with the price-list-parser, connect via Prisma, and insert products using `createMany` with `skipDuplicates: true` in batches of up to 1000 records.

#### Scenario: Full seed of 6944 products

- GIVEN a parsed TXT containing 6944 products (21 with blank price)
- WHEN the seed script runs
- THEN the Product table contains exactly 6944 rows
- AND 21 rows have `price: 0`

### Requirement: Seed Script — Idempotency

The seed script MUST be safe to run multiple times without causing duplicate key errors or data corruption.

#### Scenario: Re-seed is safe

- GIVEN the Product table already has 6944 rows
- WHEN the seed script runs again
- THEN no errors occur
- AND the row count remains 6944

---

## Delta: Product Listing (added by auth-orders-pdf)

### Requirement: Product Listing

The system MUST expose `GET /api/products` returning a paginated list. It MUST support `?search=` filtering by code or description (case-insensitive ILIKE), `?page=` (default 1), and `?limit=` (default 20, max 100). Response: `{ products[], total, page, totalPages }`.

#### Scenario: Paginated product list

- GIVEN a database with 50 active products
- WHEN GET /api/products?page=1&limit=10 is called
- THEN status is 200 and body contains 10 products, total=50, page=1, totalPages=5

#### Scenario: Search by code

- GIVEN a product with code "ABC123"
- WHEN GET /api/products?search=abc is called
- THEN the result includes product ABC123

#### Scenario: Search by description

- GIVEN a product with description "Red Widget"
- WHEN GET /api/products?search=widget is called
- THEN the result includes the Red Widget product

#### Scenario: Empty results

- GIVEN no products matching "ZZZZNOTEXIST"
- WHEN GET /api/products?search=ZZZZNOTEXIST is called
- THEN status is 200 with empty products array and total=0

### Requirement: Product Detail

The system MUST expose `GET /api/products/:code` returning a single product as `{ product }`. MUST return 404 if the product code does not exist.

#### Scenario: Existing product

- GIVEN a product with code "ABC123"
- WHEN GET /api/products/ABC123 is called
- THEN status is 200 with the product object

#### Scenario: Non-existent product

- GIVEN no product with code "NOPE"
- WHEN GET /api/products/NOPE is called
- THEN status is 404

### Requirement: Auth Middleware for Products

The product endpoints SHALL use the optional auth JWT middleware: `req.user` is set if a valid token is provided, but the endpoints MUST work without authentication.

#### Scenario: Unauthenticated access

- GIVEN no Authorization header
- WHEN GET /api/products is called
- THEN status is 200 and products are returned
