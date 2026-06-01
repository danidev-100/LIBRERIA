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
