# Health Check Specification

## Purpose

Define the Express 5 backend scaffold (CORS, JSON parsing, error middleware) and the React 19 + Vite 8 + Tailwind 4 frontend scaffold with proxy.

## Requirements

### Requirement: Backend Server Setup

The backend MUST be an Express 5 application at `packages/backend` with CORS enabled and JSON body parser configured.

#### Scenario: Server starts and accepts connections

- GIVEN the Express 5 app with CORS and `express.json()` middleware
- WHEN the server starts on `PORT` (default 4000)
- THEN it listens and accepts HTTP connections

### Requirement: Health Endpoint

The system MUST expose `GET /api/health` returning HTTP 200 with JSON body `{ "status": "ok", "timestamp": "<ISO string>" }`.

#### Scenario: Health check returns valid response

- GIVEN the running backend
- WHEN a client sends `GET /api/health`
- THEN the response status is 200
- AND the body contains `status: "ok"` and a valid ISO 8601 timestamp

### Requirement: Global Error Handler

The backend MUST include an error-handling middleware that catches unhandled errors and returns `{ "error": "<message>" }` with an appropriate HTTP status code. Unmatched routes MUST return 404.

#### Scenario: Unknown route returns 404

- GIVEN the running backend
- WHEN a client sends `GET /api/nonexistent`
- THEN the response status is 404 with a JSON error body

#### Scenario: Internal error returns 500

- GIVEN a route handler that throws an error
- WHEN the request reaches the error middleware
- THEN the response status is 500 with `{ "error": "<message>" }`

### Requirement: Prisma Client Singleton

The backend MUST instantiate a single Prisma client instance and export it as a singleton for use across all modules.

#### Scenario: Same instance across imports

- GIVEN the Prisma client singleton module
- WHEN imported in two different files
- THEN both receive the same instance

### Requirement: Environment Validation

The backend MUST validate required environment variables at startup using zod: `DATABASE_URL` (required), `PORT` (default `"4000"`), `CORS_ORIGIN` (default `"http://localhost:5173"`). Startup MUST fail fast with a descriptive error if validation fails.

#### Scenario: Missing DATABASE_URL

- GIVEN an environment without `DATABASE_URL` set
- WHEN the backend starts
- THEN it exits with a clear error message indicating the missing variable

### Requirement: Frontend Scaffold

The frontend at `packages/frontend` MUST use Vite 8 + React 19 + TypeScript 6 + Tailwind 4. It MUST include a minimal `App.tsx` with routing placeholder, Tailwind utility classes applied, and a Vite proxy forwarding `/api` to the backend.

#### Scenario: Vite dev server with proxy

- GIVEN the frontend package with `vite.config.ts` proxying `/api` to `http://localhost:4000`
- WHEN `pnpm dev` runs in the frontend package
- THEN Vite starts on port 5173 and `/api` requests are forwarded to the backend

#### Scenario: Tailwind styles render

- GIVEN a component using Tailwind classes `text-lg font-bold`
- WHEN the app renders in the browser
- THEN the styles are applied and visible
