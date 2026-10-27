# Auth Plan — Sign-up / Sign-in Pages

## Overview

Introduce real Supabase Auth to CampusAssist AI.

**Scope (backend only):**
- A `profiles` table in Supabase that stores extended user data for both students and admins (`role` column distinguishes them).
- Supabase SQL: table, trigger, RLS, and admin user seed.
- Zod schemas and a browser-safe Supabase client so the frontend is ready to consume auth when that work begins.

**Out of scope (separate tasks):**
- All auth UI pages (`/signup`, `/login`, `/admin/login`).
- Nav link updates.
- Auto-populating the enrollment form with profile data.
- Any changes to existing enrollment flow pages.

---

## Sub-Tasks

---

### Sub-Task 1 — Supabase Schema: `profiles` Table + Auth Trigger

**Status:** `[ ] pending`

**Intent:**
Create the `profiles` table and a database trigger so that when a new user signs up via Supabase Auth, a matching profile row is automatically created using the metadata passed during sign-up. This is the data foundation everything else depends on.

**Expected Outcomes:**
- `profiles` table exists with columns: `id`, `first_name`, `last_name`, `student_id`, `role`, `created_at`.
- A `student_id` format constraint enforces `^\d{4}-\d{5}-MN-[01]$` at the DB level.
- A trigger `on_auth_user_created` fires after every `auth.users` insert and populates `profiles` from `raw_user_meta_data`.
- RLS enabled: students can only read/update their own row; admins can read all rows.

**Todo List:**
- [ ] Write and run the `create table profiles` SQL in the Supabase SQL editor.
- [ ] Add the `student_id_format` check constraint with the regex.
- [ ] Write and run the `handle_new_user()` function + `on_auth_user_created` trigger.
- [ ] Enable RLS on `profiles` and add the three policies (student select, student update, admin select all).
- [ ] Manually create the admin user in Supabase Dashboard → Authentication → Users.
- [ ] Run `UPDATE profiles SET role = 'admin' WHERE id = '<admin-uuid>'` to elevate the admin user.

**Relevant Context:**
- Current schema is documented in `agents.md` lines 282–416.
- Existing tables (`enrollments`, `enrollment_subjects`, `subjects`, `curricula`) are unchanged.
- `lib/supabase.ts` uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars (server-side only — no `NEXT_PUBLIC_` prefix).
- Supabase Auth stores extra sign-up fields under `raw_user_meta_data` on the `auth.users` row.

**SQL to run (in order):**

> **Note:** `email` must be stored in `profiles` so the sign-in form can look up the auth email from a student ID. The trigger copies it from `new.email` (the email column on `auth.users`, not metadata).

```sql
-- 1. profiles table
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text,                               -- copied from auth.users for student-ID sign-in lookup
  student_id  text unique,                        -- null for admin accounts
  role        text not null default 'student'
              check (role in ('student', 'admin')),
  created_at  timestamptz not null default now(),
  constraint student_id_format check (
    student_id is null or student_id ~ '^\d{4}-\d{5}-MN-[01]$'
  )
);

-- 2. trigger function
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, student_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name',  ''),
    new.raw_user_meta_data ->> 'student_id'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 4. RLS
alter table profiles enable row level security;

create policy "student can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "student can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "admin can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

---

### Sub-Task 2 — Zod Auth Schemas

**Status:** `[ ] pending`

**Intent:**
Add Zod schemas for the student sign-up and shared sign-in forms to `lib/schemas.ts`. These are backend-ready validation contracts the frontend will import later.

**Expected Outcomes:**
- `SignUpSchema` validates: `first_name`, `last_name`, `email`, `student_id` (regex `^\d{4}-\d{5}-MN-[01]$`), `password` (min 8 chars).
- `SignInSchema` validates: `email`, `password`.
- Corresponding TypeScript types exported: `SignUpRequest`, `SignInRequest`.

**Todo List:**
- [ ] Add `SignUpSchema` and `SignInSchema` to `lib/schemas.ts`.
- [ ] Export inferred types `SignUpRequest` and `SignInRequest`.

**Relevant Context:**
- [`lib/schemas.ts`](campusassist-ai/lib/schemas.ts) — existing Zod schemas to follow for style.
- Student ID format: `^\d{4}-\d{5}-MN-[01]$` (e.g. `2024-10001-MN-0`).

---

### Sub-Task 3 — Browser-Safe Supabase Client

**Status:** `[ ] pending`

**Intent:**
The current `lib/supabase.ts` uses server-side env vars (no `NEXT_PUBLIC_` prefix) and cannot be imported by client components. Create `lib/supabase-browser.ts` using `NEXT_PUBLIC_` vars so auth calls from client components work. The server client is left untouched.

**Expected Outcomes:**
- `lib/supabase-browser.ts` exports a Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Existing `lib/supabase.ts` is untouched.
- `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values as the existing server-side vars).

**Todo List:**
- [ ] Create `lib/supabase-browser.ts` with `createClient` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Add the two `NEXT_PUBLIC_` vars to `.env.local`.

**Relevant Context:**
- [`lib/supabase.ts`](campusassist-ai/lib/supabase.ts) — existing server client to mirror in style.
- `.env.local` — existing env file with the server-side keys.
