# Plan: CORS Headers + Enrollment Status Filter

## Overview

Two focused improvements to the backend API:

1. **CORS headers** — Allow the frontend (running on any origin during development
   or on Vercel) to call the API routes without browser cross-origin errors.
2. **Status filter on `GET /api/enrollments`** — Allow the admin dashboard to
   request only `pending`, `confirmed`, or `rejected` enrollments via a
   `?status=` query param instead of fetching everything and filtering client-side.

Both changes are additive — no existing response shapes are altered.

**Branch:** `feat/cors-and-filters`
**Docs folder:** `campusassist-ai/docs/`

---

## Sub-Task 1 — CORS via `next.config.ts` headers

**Status:** `[x] done`

### Intent
Add permissive CORS headers to all `/api/*` routes centrally in `next.config.ts`
using Next.js built-in `headers()` config. This avoids duplicating header logic
in every route file and keeps routes clean.

For a demo app, `Access-Control-Allow-Origin: *` is appropriate.
The `OPTIONS` preflight method also needs to be handled so browsers don't block
requests before they reach the route handler.

### Expected Outcomes
- `fetch("http://localhost:3000/api/chat", ...)` from a frontend running on port
  3001 (or any other origin) works without a CORS error in the browser console.
- All 6 API routes respond with correct `Access-Control-Allow-*` headers.
- No changes needed inside any individual `route.ts` file.
- Existing 44 tests still pass.

### Todo List
1. Open `campusassist-ai/next.config.ts`
2. Add a `headers()` async function that applies to the `/api/:path*` pattern
3. Set these headers on all matched routes:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, x-demo-role`
4. Run `pnpm exec tsc --noEmit` — must pass
5. Run `pnpm test` — must show 44 passed

### Relevant Context
- `campusassist-ai/next.config.ts` — currently empty `{}`, just needs `headers()`
- All API routes live under `app/api/` — one pattern covers them all
- `x-demo-role` must be in `Allow-Headers` or browsers strip it on cross-origin requests
- Next.js docs pattern: `{ source: "/api/:path*", headers: [...] }`

---

## Sub-Task 2 — Status filter on `GET /api/enrollments`

**Status:** `[x] done`

### Intent
Add an optional `?status=` query parameter to `GET /api/enrollments` so the
admin dashboard can request only pending enrollments (for the "Pending" tab)
without fetching the full list.

Accepted values match `EnrollmentStatus`: `pending`, `confirmed`, `rejected`.
If the param is absent or invalid, the route returns all enrollments (current
behaviour — no breaking change).

### Expected Outcomes
- `GET /api/enrollments?status=pending` (staff header) → returns only pending rows
- `GET /api/enrollments?status=confirmed` (staff header) → returns only confirmed rows
- `GET /api/enrollments` with no param (staff header) → returns all rows (unchanged)
- `GET /api/enrollments?status=invalid` (staff header) → ignored, returns all rows
- Existing tests for `GET /api/enrollments` still pass (they use no param)
- New tests added to `tests/api/enrollments.test.ts` for the filter cases

### Todo List
1. Open `campusassist-ai/app/api/enrollments/route.ts`
2. In the `GET` handler, read `req.nextUrl.searchParams.get("status")`
3. Validate the value against `["pending", "confirmed", "rejected"]`
4. If valid, chain `.eq("status", status)` onto the Supabase query before `.order()`
5. If absent or invalid, skip the filter (return all — existing behaviour)
6. Add 2 new test cases to `tests/api/enrollments.test.ts`:
   - `GET /api/enrollments?status=pending` → only returns pending rows
   - `GET /api/enrollments?status=invalid` → returns all rows
7. Run `pnpm test` — must show 46 passed

### Relevant Context
- `campusassist-ai/app/api/enrollments/route.ts` — `GET` handler, lines 9–24
- `campusassist-ai/types/index.ts` — `EnrollmentStatus = "pending" | "confirmed" | "rejected"`
- `campusassist-ai/tests/api/enrollments.test.ts` — existing GET tests use `makeGetRequest()`
  which constructs a `NextRequest` — extend it to accept a query string
- The Supabase chain is: `.select(...).eq("status", val).order(...)` — eq goes before order

---

## Sub-Task 3 — Update status.md

**Status:** `[x] done`

### Intent
Keep `status.md` current so the team always has an accurate picture of what is done.

### Expected Outcomes
- `status.md` reflects the two new completed items
- Git branches table updated with `feat/cors-and-filters`

### Todo List
1. Open `campusassist-ai/status.md`
2. Add CORS headers and status filter to the Completed section
3. Update the Git branches table

### Relevant Context
- `campusassist-ai/status.md`
