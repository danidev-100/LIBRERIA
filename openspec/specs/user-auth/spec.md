# User Auth Specification

## Purpose

Authentication and authorization — JWT-based register, login, identity endpoint, and middleware for route protection.

## Requirements

### Requirement: Registration

The system MUST expose `POST /api/auth/register` accepting `{ name, email, password }`. Password MUST be at least 6 characters. Email MUST be unique. Password MUST be hashed with bcryptjs (10 rounds). Response MUST be 201 with the user object (excluding password).

#### Scenario: Successful registration

- GIVEN a valid body with unique email and password of 6+ characters
- WHEN POST /api/auth/register is called
- THEN status is 201 and the response body contains the user without the password field

#### Scenario: Duplicate email

- GIVEN an email already registered
- WHEN POST /api/auth/register is called with that email
- THEN status is 409 with an error message indicating duplicate email

#### Scenario: Short password

- GIVEN a password shorter than 6 characters
- WHEN POST /api/auth/register is called
- THEN status is 400 with a validation error

### Requirement: Login

The system MUST expose `POST /api/auth/login` accepting `{ email, password }`. It MUST find user by email, compare password with bcryptjs, and on success return `{ token, user }` with a JWT (HS256, 24h expiry, payload `{ sub: userId, role }`). On failure MUST return 401.

#### Scenario: Successful login

- GIVEN a registered user with correct credentials
- WHEN POST /api/auth/login is called
- THEN status is 200 and body contains a JWT token and the user object

#### Scenario: Invalid credentials

- GIVEN a wrong password or non-existent email
- WHEN POST /api/auth/login is called
- THEN status is 401

### Requirement: Current User

The system MUST expose `GET /api/auth/me` protected by JWT middleware. It MUST return the authenticated user object (excluding password).

#### Scenario: Authenticated fetch

- GIVEN a valid JWT in the Authorization header
- WHEN GET /api/auth/me is called
- THEN status is 200 and body contains the user

#### Scenario: Unauthenticated fetch

- GIVEN no Authorization header
- WHEN GET /api/auth/me is called
- THEN status is 401

### Requirement: Admin Seeding

The seed script SHALL create an ADMIN user from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` environment variables if they are set.

#### Scenario: Admin seed on first run

- GIVEN the env vars are set and no ADMIN user exists
- WHEN the seed script runs
- THEN an ADMIN user is created with the given credentials
