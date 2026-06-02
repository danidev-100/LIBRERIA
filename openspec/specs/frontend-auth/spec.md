# Frontend Auth Specification

## Purpose

Frontend authentication state management, login/register pages, and protected route wrappers.

## Requirements

### Requirement: AuthContext

The system MUST provide an AuthContext exposing `{ user, token, login, register, logout, isAuthenticated, isAdmin }`. On app mount, the context MUST restore token and user from localStorage. `login()` MUST call POST /api/auth/login and store the token. `logout()` MUST clear token and user from state and localStorage.

#### Scenario: Login and persist

- GIVEN a registered user
- WHEN login(email, password) is called
- THEN the token is stored in localStorage and user is set in context state

#### Scenario: Logout clears state

- GIVEN an authenticated user
- WHEN logout() is called
- THEN token and user are cleared from both context state and localStorage

### Requirement: Login Page

The system MUST display a login form at `/login` with email and password inputs. On success, it MUST redirect to `/catalog`. On error, it MUST display the error message.

#### Scenario: Successful login redirects

- GIVEN a user at /login with valid credentials
- WHEN the form is submitted
- THEN the user is redirected to /catalog

### Requirement: Register Page

The system MUST display a register form at `/register` with name, email, and password inputs. On success, it MUST redirect to `/login`. On error, it MUST display the error message.

#### Scenario: Successful register redirects

- GIVEN a user at /register with valid fields
- WHEN the form is submitted
- THEN the user is redirected to /login

### Requirement: Protected Route Wrapper

The system MUST provide a `ProtectedRoute` component that redirects to `/login` if `isAuthenticated` is false. An `AdminRoute` component MUST redirect to `/` if `isAdmin` is false.

#### Scenario: Unauthenticated redirect

- GIVEN a non-authenticated user
- WHEN navigating to a protected route
- THEN the user is redirected to /login
