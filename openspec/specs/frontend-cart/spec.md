# Frontend Cart Specification

## Purpose

Shopping cart state management with localStorage persistence.

## Requirements

### Requirement: CartContext

The system MUST provide a CartContext exposing `{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }`. `items` is an array of `{ product, quantity }`. Cart MUST be persisted to localStorage and restored on mount. `totalItems` is the sum of quantities. `totalPrice` is the sum of product.price times quantity.

#### Scenario: Add item to cart

- GIVEN an empty cart
- WHEN addItem(product, 2) is called
- THEN items contains one entry with quantity 2 and the cart is saved to localStorage

#### Scenario: Update quantity

- GIVEN a cart with product A (qty 1)
- WHEN updateQuantity(productCode, 3) is called
- THEN the quantity for product A is 3

#### Scenario: Remove item

- GIVEN a cart with product A
- WHEN removeItem(productCode) is called
- THEN product A is removed from items

### Requirement: Cart Page

The system MUST display a cart page at `/cart` showing items with product info, quantity controls, total price, and a "Place Order" button. On order placement, it MUST call POST /api/orders, clear the cart, and redirect to the order detail page.

#### Scenario: Place order flow

- GIVEN an authenticated user with items in the cart
- WHEN "Place Order" is clicked
- THEN POST /api/orders is called with the cart items, the cart is cleared, and the user is redirected to the new order detail

#### Scenario: Empty cart

- GIVEN an empty cart
- WHEN viewing /cart
- THEN a message "Your cart is empty" is displayed and the Place Order button is hidden
