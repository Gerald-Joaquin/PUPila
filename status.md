# CampusAssist AI — Project Status

> Last updated: 2026-10-16
> Latest merged feature: `feat/auth` (pushed and merged)

---

## ✅ Completed

### Step 0 — Foundation
| File | Status |
|---|---|
| Next.js 15 + TypeScript + Tailwind v3 + shadcn/ui scaffold | ✅ |
| `types/index.ts` — shared types incl. `EnrollmentSummary` | ✅ |
| `lib/supabase.ts` — server-only client (`SUPABASE_URL` / `SUPABASE_ANON_KEY`) | ✅ |
| `lib/utils.ts` — `generateEnrNumber(id, studentType)` + `cn()` | ✅ |
| `lib/schemas.ts` — enrollment/chat schemas plus `SignUpSchema` and `SignInSchema` | ✅ |
| `lib/kb.json` — 8 KB entries with tuned keywords | ✅ |
| Supabase tables created + seeded + RLS disabled | ✅ |

### Step 1 — AI Service
| File | Status |
|---|---|
| `lib/ai.ts` — `getAIResponse()` keyword scorer, whole-word regex matching (fixes regular/irregular collision) | ✅ |
| `app/api/chat/route.ts` — `POST /api/chat` | ✅ |

### Step 2 — DB API Routes
| File | Status |
|---|---|
| `lib/rate-limit.ts` — in-memory per-IP rate limiter | ✅ |
| `app/api/subjects/route.ts` — `GET /api/subjects` with optional `?program=` filter | ✅ |
| `app/api/enrollments/route.ts` — `GET /api/enrollments` (staff, `?status=` filter) + `POST /api/enrollments` | ✅ |
| `next.config.ts` — CORS headers for all `/api/*` routes (`Access-Control-Allow-Origin: *`) | ✅ |
| `app/api/enrollments/[enr]/route.ts` — `GET` detail + `PATCH` status | ✅ |

### Step 3 — Test Scripts
Previously recorded results below; tests were not rerun for this documentation update. Auth-specific automated tests are still pending.

| File | Tests | Status |
|---|---|---|
| `tests/lib/utils.test.ts` | 7 | ✅ |
| `tests/lib/schemas.test.ts` | 19 | ✅ |
| `tests/lib/ai.test.ts` | 7 | ✅ |
| `tests/api/chat.test.ts` | 4 | ✅ |
| `tests/api/subjects.test.ts` | 2 | ✅ |
| `tests/api/enrollments.test.ts` | 9 | ✅ |
| `tests/api/enrollments-enr.test.ts` | 6 | ✅ |
| **Total** | **54 / 54 passing** | ✅ |

### Step 4 — Frontend Pages & Components
| File | Status |
|---|---|
| `app/layout.tsx` — root layout, RoleProvider, sticky nav | ✅ |
| `app/page.tsx` — landing page, hero, feature cards | ✅ |
| `app/enroll/page.tsx` — enrollment form (program dropdown: BSIT / BSCPE / BSCS) | ✅ |
| `app/success/page.tsx` — ENR number reveal + copy-to-clipboard | ✅ |
| `app/track/[enr]/page.tsx` — status timeline | ✅ |
| `app/admin/page.tsx` — admin dashboard | ✅ |
| `app/chat/page.tsx` — AI chat interface | ✅ |
| `components/ChatWindow.tsx` | ✅ |
| `components/SubjectPicker.tsx` | ✅ |
| `components/StatusTimeline.tsx` | ✅ |
| `components/AdminTable.tsx` | ✅ |
| `components/RoleToggle.tsx` — RoleProvider + useRole + toggle | ✅ |
| `components/EnrollmentNumberReveal.tsx` — copy-to-clipboard included | ✅ |
| `components/ChecklistCard.tsx` | ✅ |

### Step 5 — Authentication (`feat/auth`, merged)
| File / feature | Status |
|---|---|
| `app/auth/page.tsx` + `components/auth/AuthCard.tsx` — combined sign-up/sign-in page with sliding panel and responsive styling | ✅ |
| `components/auth/SignUpForm.tsx` — Supabase sign-up with student details and password validation | ✅ |
| `components/auth/SignInForm.tsx` — student ID lookup in `profiles`, password sign-in, redirect to `/enroll` | ✅ |
| `components/auth/ForgotPasswordModal.tsx` — reset email request, `#a21c1b` background and gold buttons | ✅ |
| `app/reset-password/page.tsx` — password recovery form with confirmation and Supabase password update | ✅ |
| `components/auth/Field.tsx`, `Input.tsx`, `PasswordField.tsx` — shared form controls | ✅ |
| `lib/studentId.ts` + `lib/validators.ts` — student ID formatting and client-side validation | ✅ |
| `lib/supabase-browser.ts` — browser client for Supabase Auth | ✅ |
| `auth-plan.md` + `docs/auth-implementation.md` — auth setup and implementation documentation | ✅ |

### Auth Follow-up
- Admin login and role-based redirects are not connected yet. `/auth` accepts student IDs and always redirects to `/enroll`; `/admin` still uses the Staff View demo toggle and API requests still use `x-demo-role`.
- Align student ID formats: authentication uses `YYYY-NNNNN-MN-0/1`, while enrollment still accepts `YYYY-NNNNN`.
- Add automated auth coverage and verify sign-up, sign-in, and email recovery against the configured Supabase project. Live database setup and email delivery were not verified in this status update.
- Supabase profile, trigger, policy, and admin account setup instructions are in [docs/auth-implementation.md](docs/auth-implementation.md).

---

## 🔧 Bug Fixes Applied

| Issue | Fix |
|---|---|
| Tailwind v4 PostCSS error after teammate downgraded to v3 | Ran `pnpm install` to align `node_modules` with `package.json` |
| `lib/supabase.ts` changed to use `NEXT_PUBLIC_` vars | Reverted to `SUPABASE_URL` / `SUPABASE_ANON_KEY` (server-only, no browser exposure) |
| Test deps + scripts removed from `package.json` by teammate | Re-added `vitest`, `@testing-library/*` deps and `test` scripts |
| `"regular"` keyword matching inside `"irregular"` (substring bug) | Fixed: `lib/ai.ts` now uses whole-word regex matching |
| ENR number format was `ENR-YYYY-NNNN` (4-digit, with year) | Changed to `ENR-NNNNN-MN-0/1` (5-digit, no year, type flag) |
| `student_id` accepted any string (e.g. `S10001`, `2024-1092-MN-0`) | Fixed: Zod regex `^\d{4}-\d{5}$` — rejects invalid formats with 400 |

---

## 📋 ENR Number & Student ID Formats

| Field | Format | Example |
|---|---|---|
| ENR number (system-generated) | `ENR-NNNNN-MN-0` (regular) / `ENR-NNNNN-MN-1` (irregular) | `ENR-00010-MN-0` |
| Student ID (enrollment form) | `YYYY-NNNNN` | `2024-01092` |
| Student ID (auth forms) | `YYYY-NNNNN-MN-0` / `YYYY-NNNNN-MN-1` | `2024-01092-MN-0` |

---

## 🗄️ Supabase — Pending Seeds

The following seed data still needs to be added to Supabase for the new programs:

### Add subjects for BSCPE
```sql
insert into subjects (code, name, units, year_level, program) values
  ('CPE101', 'Introduction to Computer Engineering', 3, '1st Year', 'BSCPE'),
  ('CPE102', 'Computer Programming Fundamentals',    3, '1st Year', 'BSCPE'),
  ('CPE103', 'Engineering Mathematics 1',            3, '1st Year', 'BSCPE'),
  ('CPE201', 'Digital Logic Design',                 3, '2nd Year', 'BSCPE'),
  ('CPE202', 'Data Structures',                      3, '2nd Year', 'BSCPE'),
  ('CPE203', 'Discrete Mathematics',                 3, '2nd Year', 'BSCPE'),
  ('CPE301', 'Microprocessors and Microcontrollers', 3, '3rd Year', 'BSCPE'),
  ('CPE302', 'Computer Architecture',                3, '3rd Year', 'BSCPE'),
  ('CPE401', 'Capstone Project 1',                   3, '4th Year', 'BSCPE'),
  ('CPE402', 'Embedded Systems',                     3, '4th Year', 'BSCPE');
```

### Add curricula for BSCPE
```sql
insert into curricula (year_level, program, subject_code, subject_name, units) values
  ('1st Year', 'BSCPE', 'CPE101', 'Introduction to Computer Engineering', 3),
  ('1st Year', 'BSCPE', 'CPE102', 'Computer Programming Fundamentals',    3),
  ('1st Year', 'BSCPE', 'CPE103', 'Engineering Mathematics 1',            3),
  ('2nd Year', 'BSCPE', 'CPE201', 'Digital Logic Design',                 3),
  ('2nd Year', 'BSCPE', 'CPE202', 'Data Structures',                      3),
  ('2nd Year', 'BSCPE', 'CPE203', 'Discrete Mathematics',                 3),
  ('3rd Year', 'BSCPE', 'CPE301', 'Microprocessors and Microcontrollers', 3),
  ('3rd Year', 'BSCPE', 'CPE302', 'Computer Architecture',                3),
  ('4th Year', 'BSCPE', 'CPE401', 'Capstone Project 1',                   3),
  ('4th Year', 'BSCPE', 'CPE402', 'Embedded Systems',                     3);
```

### Add subjects for BSCS
```sql
insert into subjects (code, name, units, year_level, program) values
  ('CS101', 'Introduction to Computer Science',  3, '1st Year', 'BSCS'),
  ('CS102', 'Programming Logic and Design',      3, '1st Year', 'BSCS'),
  ('CS103', 'Mathematics in Computing',          3, '1st Year', 'BSCS'),
  ('CS201', 'Data Structures and Algorithms',    3, '2nd Year', 'BSCS'),
  ('CS202', 'Object-Oriented Programming',       3, '2nd Year', 'BSCS'),
  ('CS203', 'Theory of Computation',             3, '2nd Year', 'BSCS'),
  ('CS301', 'Algorithm Design and Analysis',     3, '3rd Year', 'BSCS'),
  ('CS302', 'Operating Systems',                 3, '3rd Year', 'BSCS'),
  ('CS401', 'Capstone Project 1',                3, '4th Year', 'BSCS'),
  ('CS402', 'Machine Learning Fundamentals',     3, '4th Year', 'BSCS');
```

### Add curricula for BSCS
```sql
insert into curricula (year_level, program, subject_code, subject_name, units) values
  ('1st Year', 'BSCS', 'CS101', 'Introduction to Computer Science',  3),
  ('1st Year', 'BSCS', 'CS102', 'Programming Logic and Design',      3),
  ('1st Year', 'BSCS', 'CS103', 'Mathematics in Computing',          3),
  ('2nd Year', 'BSCS', 'CS201', 'Data Structures and Algorithms',    3),
  ('2nd Year', 'BSCS', 'CS202', 'Object-Oriented Programming',       3),
  ('2nd Year', 'BSCS', 'CS203', 'Theory of Computation',             3),
  ('3rd Year', 'BSCS', 'CS301', 'Algorithm Design and Analysis',     3),
  ('3rd Year', 'BSCS', 'CS302', 'Operating Systems',                 3),
  ('4th Year', 'BSCS', 'CS401', 'Capstone Project 1',                3),
  ('4th Year', 'BSCS', 'CS402', 'Machine Learning Fundamentals',     3);
```

> ⚠️ **Run these in Supabase SQL Editor before testing enrollment for BSCPE/BSCS.** Without them, regular students on those programs will hit a 500 (no curriculum rows found) and irregular students will see an empty subject picker.

---

## ⚠️ Important Notes for the Team

### Environment Variables
Your `.env.local` must use these exact names:
```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

The `NEXT_PUBLIC_` variables are used by the browser auth client; the existing variables remain in use by server API routes.

### Do Not Change
- API response shapes — frontend components depend on the contracts in `agents.md`
- `lib/schemas.ts` — add new schemas here, do not define schemas inline in routes or components
- ENR number format — `ENR-NNNNN-MN-0/1` — shown to users and used in URLs

### Run Tests Before Merging
```bash
pnpm test        # must show 54 passed before any merge to main
```

---

## Git Branches
| Branch | Purpose | Status |
|---|---|---|
| `main` | Stable, deployable | — |
| `feat/backend-foundation` | All backend files, API routes | ✅ Merged |
| `feat/test-scripts` | Vitest setup + backend tests | ✅ Merged |
| `feat/cors-and-filters` | CORS headers + status filter | ✅ Merged |
| `feat/enr-number-format-and-student-id-validation` | ENR format, student_id validation, multi-program support | ✅ Merged |
| `feat/auth` | Student sign-up/sign-in, password recovery, auth UI and Supabase setup documentation | ✅ Pushed and merged |
