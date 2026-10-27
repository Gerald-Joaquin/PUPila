# Auth Implementation — Sign-up / Sign-in

> Last updated: October 2025
> Route: `/auth`
> Components: `components/auth/`
> Utilities: `lib/studentId.ts`, `lib/validators.ts`, `lib/supabase-browser.ts`

---

## Overview

The auth system provides a single-page sign-up / sign-in experience at `/auth`. It uses **Supabase Auth** for user management and a `profiles` table for extended student data. Students sign up with their student ID, name, email, and password. Sign-in uses the student ID to look up the email in `profiles`, then authenticates via Supabase.

---

## Route

| File | Route | Notes |
|---|---|---|
| `app/auth/page.tsx` | `/auth` | Server component, renders `AuthCard` |

---

## Component Tree

```
app/auth/page.tsx
└── AuthCard              — shell, slide state, pane visibility
    ├── PageBackground    — fixed radial gradient layer (decorative only)
    ├── <section> Sign-up pane
    │   └── SignUpForm    — form fields, validation, Supabase signUp call
    └── <section> Sign-in pane
        └── SignInForm    — form fields, validation, profile lookup, signInWithPassword
    └── VisualPanel       — sliding maroon panel with copy blocks and chips
```

---

## Files

### `components/auth/AuthCard.tsx`
Owns the `isSignIn: boolean` state that drives all transitions. Renders the shell (white card, gradient shadow), both panes, and the visual panel.

**Key behaviour:**
- `goSignIn()` — sets `isSignIn = true`, focuses `#sid2` after next paint
- `goSignUp()` — sets `isSignIn = false`, focuses `#last` after next paint
- Sign-up pane: `opacity 0 + visibility hidden` when `isSignIn = true`
- Sign-in pane: `opacity 0 + visibility hidden` when `isSignIn = false`, `transition-delay: 0.3s` on reveal
- On mobile (`≤820px`): inactive pane gets class `auth-pane-hidden` → `display: none` via CSS

---

### `components/auth/PageBackground.tsx`
A single `<div>` with `position: fixed; inset: 0; z-index: 0; pointer-events: none`. Renders a radial gradient behind the card.

```
radial-gradient(ellipse 75% 85% at 50% 50%,
  #3b2322 0%, #5b3f3d 25%, #8f7a78 45%,
  #c2b6b5 62%, #e4dedd 80%, #f7f5f5 92%, #ffffff 100%)
```

No red or maroon tones — brown-based to complement the card's warm gradient.

---

### `components/auth/SignUpForm.tsx`
Handles student account creation.

**Fields:**
| Field | ID | `autocomplete` | Validation |
|---|---|---|---|
| Last name | `last` | `family-name` | Non-empty |
| First name | `first` | `given-name` | Non-empty |
| Email | `email` | `email` | Valid email regex |
| Student ID | `sid` | `off` | `^\d{4}-\d{5}-MN-[01]$` |
| Password | `pw` | `new-password` | ≥8 chars, uppercase, lowercase, number, symbol |

**Submit flow:**
1. Client-side validates all fields via `rules` from `lib/validators.ts`
2. Calls `supabaseBrowser.auth.signUp()` with `email`, `password`, and `options.data` containing `first_name`, `last_name`, `student_id`
3. On success → waits 1.5 seconds → calls `onGoSignIn()` to slide to sign-in
4. On error → displays Supabase error message under the email field

**Auto-format:** Student ID input uses `formatStudentId()` on every keystroke — strips non-digits and inserts hyphens at the correct positions.

---

### `components/auth/SignInForm.tsx`
Handles student authentication by student ID.

**Fields:**
| Field | ID | `autocomplete` | Validation |
|---|---|---|---|
| Student ID | `sid2` | `username` | `^\d{4}-\d{5}-MN-[01]$` |
| Password | `pw2` | `current-password` | Non-empty |

**Submit flow:**
1. Client-side validates both fields
2. Queries `profiles` table: `.select("email").eq("student_id", sid2).maybeSingle()`
3. If no profile found → shows "No account found for that Student ID."
4. If DB error → shows the Supabase error code for debugging
5. Calls `supabaseBrowser.auth.signInWithPassword({ email, password })`
6. On success → redirects to `/enroll`
7. On error → displays Supabase error message

> **Note:** Sign-in by student ID requires the `email` column to exist on `profiles`. See Supabase Setup below.

---

### `components/auth/ForgotPasswordModal.tsx`
Password reset modal with a `#a21c1b` background and gold (`#f5b000`) action buttons. The send button uses `#ffd75e` on hover.

---

### `components/auth/VisualPanel.tsx`
The sliding maroon panel on the right side of the card.

**Structure:**
- `<aside>` with `position: absolute; left: 50%; width: calc(50% - 12px)` — sits on the right half
- Slides left via `transform: translateX(-100%)` when `isSignIn = true`, `transition: 0.8s cubic-bezier(.65,0,.35,1)`
- Two copy blocks (A and B) — crossfade with `opacity` + `translateX` transitions, copy B gets `transition-delay: 0.3s` on reveal
- Three chips: avatar row (c3), enrollment open (c1 — gold), key deadline (c2 — white)
- Two decorative circles (ring and filled) via absolute `<div>` elements
- Hidden on mobile via `.auth-panel { display: none }` in `globals.css`

---

### `components/auth/Field.tsx`
Wrapper providing a `<label>` and optional error message `<p>` around any input.

```tsx
<Field id="email" label="Email" error={errors.email}>
  <Input ... />
</Field>
```

---

### `components/auth/Input.tsx`
Pill-shaped text input (`border-radius: 999px`). Accepts a `hasError` boolean to show the red border. Handles focus ring (gold) and blur border reset via inline `onFocus`/`onBlur` handlers (not Tailwind, to avoid Tailwind purging dynamic values).

---

### `components/auth/PasswordField.tsx`
Composes `Field` + `Input` with an eye-toggle button (`👁`) at absolute position `right: 6px; bottom: 6px`. Toggles `type="password"` ↔ `type="text"`. `aria-label="Show password"`.

---

## Utilities

### `lib/studentId.ts`
```ts
STUDENT_ID_REGEX = /^\d{4}-\d{5}-MN-[01]$/i

formatStudentId(value: string): string
// Strips non-digits, inserts hyphens:
// 4 digits → "2025"
// 5 more   → "2025-12345"
// 9 digits → "2025-12345-MN"
// 10th     → "2025-12345-MN-0"
// maxLength = 15
```

---

### `lib/validators.ts`
```ts
rules = {
  last:  v => v.trim().length > 0,
  first: v => v.trim().length > 0,
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  sid:   v => STUDENT_ID_REGEX.test(v),
  pw:    v => length≥8 && has lowercase && has uppercase && has digit && has symbol,
  sid2:  v => STUDENT_ID_REGEX.test(v),
  pw2:   v => v.length > 0,
}
```

Each field is validated `onBlur` and again on form submit (all fields run — no short-circuit — so all errors show at once).

---

### `lib/supabase-browser.ts`
```ts
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Used only in client components (`"use client"`). The server-side `lib/supabase.ts` (used in API routes) is separate and uses non-public env vars.

---

## Zod Schemas (`lib/schemas.ts`)

```ts
SignUpSchema — first_name, last_name, email, student_id, password
SignInSchema — email, password
```

`SignUpSchema` password rules match `lib/validators.ts` exactly. Used for server-side validation if an API route is added in future.

---

## Supabase Setup

### `profiles` table
```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text,        -- required for student-ID sign-in lookup
  student_id  text unique,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now(),
  constraint student_id_format check (
    student_id is null or student_id ~ '^\d{4}-\d{5}-MN-[01]$'
  )
);
```

### Trigger
Fires on every `auth.users` insert. Copies `email` and `raw_user_meta_data` fields into `profiles`:

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, student_id)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'),  ''), ''),
    nullif(trim(new.raw_user_meta_data ->> 'student_id'), '')
  )
  on conflict (id) do update
    set email      = excluded.email,
        first_name = excluded.first_name,
        last_name  = excluded.last_name,
        student_id = excluded.student_id;
  return new;
end;
$$ language plpgsql security definer;
```

### RLS Policies
```sql
-- Students read/update their own row
create policy "student can view own profile"   on profiles for select using (auth.uid() = id);
create policy "student can update own profile" on profiles for update using (auth.uid() = id);

-- Unauthenticated sign-in lookup (student_id → email)
create policy "public can look up email by student_id"
  on profiles for select using (student_id is not null);
```

### Admin user
Created manually via Supabase SQL:
```sql
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admin@email.com',
  crypt('password', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now())
returning id;

-- Then elevate:
update profiles set role = 'admin' where id = '<returned-uuid>';
```

### Email confirmation
Disabled in Supabase Dashboard → **Authentication → Settings → Enable email confirmations: OFF**.

---

## CSS (`app/globals.css`)

Auth styles include the Poppins font, card/input color variables, dark-mode colors, and mobile pane rules. These must remain alongside the dashboard's Inter font and crimson utilities when merging shared stylesheet changes.

| Class | Purpose |
|---|---|
| `.dark-shell` | Dark mode shell gradient override via `@media (prefers-color-scheme: dark)` |
| `.auth-pane-up` / `.auth-pane-in` | Transition targets for reduced-motion and mobile overrides |
| `.auth-pane-hidden` | `display: none` on mobile for the inactive pane |
| `.auth-panel` | `display: none` on mobile for the visual panel |

Reduced motion: all transition durations set to `.01s`, delays to `0s`.

---

## Environment Variables

| Variable | Used in | Purpose |
|---|---|---|
| `SUPABASE_URL` | `lib/supabase.ts` | Server-side API routes |
| `SUPABASE_ANON_KEY` | `lib/supabase.ts` | Server-side API routes |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase-browser.ts` | Client-side auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase-browser.ts` | Client-side auth |
