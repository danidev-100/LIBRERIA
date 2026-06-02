# Frontend Catalog Specification

## Purpose

Product catalog view with search and add-to-cart functionality.

## Requirements

### Requirement: Catalog Page

The system MUST display a product catalog at `/catalog` showing products in a grid or list. Each product card MUST show code, description, price, and an "Add to Cart" button. A search input MUST filter products by code or description via the API `?search=` parameter.

#### Scenario: Initial load

- GIVEN an authenticated user
- WHEN navigating to /catalog
- THEN the first page of products is fetched and displayed

#### Scenario: Search filters results

- GIVEN the catalog page with a search input
- WHEN the user types a search term and submits
- THEN GET /api/products?search={term} is called and results update accordingly

### Requirement: Add to Cart

The "Add to Cart" button MUST open a quantity selector (default 1) and call `addItem` from CartContext with the selected product and quantity. A success indicator MUST be shown briefly.

#### Scenario: Add to cart interaction

- GIVEN the catalog page with products visible
- WHEN a user clicks "Add to Cart" on a product with quantity 2
- THEN CartContext.addItem(product, 2) is called and a brief confirmation is shown
