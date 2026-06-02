# Frontend Orders Specification

## Purpose

Display the authenticated user's orders with detail view and PDF download.

## Requirements

### Requirement: My Orders Page

The system MUST display an orders list at `/orders` showing the authenticated user's orders in a table with columns: order ID, date, status, total. Each row MUST be clickable to navigate to the order detail.

#### Scenario: Orders list loads

- GIVEN an authenticated user with 5 orders
- WHEN navigating to /orders
- THEN GET /api/orders is called and the orders are displayed in a table

#### Scenario: Empty orders

- GIVEN an authenticated user with no orders
- WHEN navigating to /orders
- THEN a message "No orders yet" is displayed

### Requirement: Order Detail Page

The system MUST display order detail at `/orders/:id` showing order info (ID, date, status, total), an items table (product code, description, quantity, unit price, subtotal), a status badge, and a "Download PDF" button.

#### Scenario: Order detail loads

- GIVEN an authenticated user with order 42
- WHEN navigating to /orders/42
- THEN GET /api/orders/42 is called and the order info, items, and status are displayed

### Requirement: PDF Download

The "Download PDF" button MUST trigger a download of the invoice PDF by calling GET /api/orders/:id/pdf and saving the response as a file.

#### Scenario: PDF download works

- GIVEN an authenticated user on an order detail page
- WHEN the "Download PDF" button is clicked
- THEN a PDF file is downloaded with the invoice content
