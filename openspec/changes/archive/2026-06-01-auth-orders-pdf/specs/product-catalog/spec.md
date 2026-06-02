# Delta for Product Catalog

## ADDED Requirements

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
