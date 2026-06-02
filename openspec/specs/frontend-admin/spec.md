# Frontend Admin Specification

## Purpose

Admin dashboard for order management and user list.

## Requirements

### Requirement: Admin Dashboard

The system MUST display an admin dashboard at `/admin/orders` (admin only). It MUST show all orders in a table with columns: order ID, user info, date, status, total. A filter SHALL allow filtering by order status. Each row SHALL have an inline status change control.

#### Scenario: Admin views all orders

- GIVEN an admin user with orders in various statuses
- WHEN navigating to /admin/orders
- THEN all orders are fetched and displayed

#### Scenario: Filter by status

- GIVEN the admin orders page
- WHEN selecting "CONFIRMED" in the status filter
- THEN only CONFIRMED orders are shown

### Requirement: Inline Status Change

The inline status control SHALL display available next statuses based on the current status. On change, it MUST call PATCH /api/admin/orders/:id/status and update the UI. Invalid options MUST NOT be shown.

#### Scenario: Change order status

- GIVEN an admin viewing a PENDING order
- WHEN selecting "CONFIRMED" from the status control
- THEN PATCH /api/admin/orders/:id/status is called and the row updates to CONFIRMED

### Requirement: User List

The system MUST display a user list at `/admin/users` (admin only) showing all users in a table without password fields.

#### Scenario: Admin views users

- GIVEN an admin user with registered users
- WHEN navigating to /admin/users
- THEN all users are displayed without password fields

### Requirement: Auth-Aware Navigation

The system MUST provide a navigation bar that conditionally shows links based on auth state: login/register when unauthenticated, catalog/cart/orders when authenticated, admin links when admin.

#### Scenario: Admin nav links

- GIVEN an admin user
- THEN the nav shows links: Catalog, Cart, My Orders, Admin Dashboard, Users, Logout

#### Scenario: Client nav links

- GIVEN a CLIENT user
- THEN the nav shows: Catalog, Cart, My Orders, Logout (no admin links)

#### Scenario: Unauthenticated nav links

- GIVEN no authenticated user
- THEN the nav shows: Login, Register (no cart, orders, or admin links)
