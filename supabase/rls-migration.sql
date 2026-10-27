-- ============================================================
-- CampusAssist AI — RLS migration
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Add user_id column to enrollments ─────────────────────────────
-- References auth.users so Supabase RLS can check auth.uid().
-- Nullable so existing rows (with no owner) are not broken.
alter table enrollments
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Index for the RLS filter (auth.uid() = user_id)
create index if not exists enrollments_user_id_idx on enrollments(user_id);

-- ── 2. Add user_id to enrollment_subjects (via enrollment FK) ─────────
-- enrollment_subjects already has enrollment_id → enrollments(id),
-- so RLS on enrollment_subjects can join through that FK.
-- No extra column needed here — the policy uses a subquery (see below).

-- ── 3. Enable RLS on all tables ──────────────────────────────────────
alter table enrollments         enable row level security;
alter table enrollment_subjects enable row level security;
alter table subjects            enable row level security;
alter table curricula           enable row level security;

-- ── 4. Drop any pre-existing policies to avoid duplicates ────────────
drop policy if exists "students_insert_own"    on enrollments;
drop policy if exists "students_select_own"    on enrollments;
drop policy if exists "admins_select_all"      on enrollments;
drop policy if exists "admins_update_all"      on enrollments;

drop policy if exists "students_select_own_subjects"  on enrollment_subjects;
drop policy if exists "admins_select_all_subjects"    on enrollment_subjects;
drop policy if exists "service_insert_subjects"       on enrollment_subjects;

drop policy if exists "anyone_read_subjects"   on subjects;
drop policy if exists "anyone_read_curricula"  on curricula;

-- ── 5. enrollments policies ──────────────────────────────────────────

-- Students may insert their own rows (user_id must equal their auth.uid())
create policy "students_insert_own" on enrollments
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Students may read their own rows
create policy "students_select_own" on enrollments
  for select
  to authenticated
  using (user_id = auth.uid());

-- Admins (role = 'admin' in user_metadata) may read all rows
create policy "admins_select_all" on enrollments
  for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Admins may update (confirm / reject) any enrollment
create policy "admins_update_all" on enrollments
  for update
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ── 6. enrollment_subjects policies ──────────────────────────────────

-- Students may read subjects that belong to their own enrollments
create policy "students_select_own_subjects" on enrollment_subjects
  for select
  to authenticated
  using (
    enrollment_id in (
      select id from enrollments where user_id = auth.uid()
    )
  );

-- Admins may read all enrollment subjects
create policy "admins_select_all_subjects" on enrollment_subjects
  for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- The API (service-role key) inserts subjects server-side.
-- The service-role key bypasses RLS entirely, so no insert policy needed.
-- This note is here for clarity only.

-- ── 7. subjects and curricula — public read ───────────────────────────
-- Any authenticated user (or anon) can list subjects for the picker.
create policy "anyone_read_subjects" on subjects
  for select
  using (true);

create policy "anyone_read_curricula" on curricula
  for select
  using (true);

-- ── 8. Grant service-role full access (bypasses RLS already, ──────────
--       but explicit grants prevent future surprises)
grant all on enrollments         to service_role;
grant all on enrollment_subjects to service_role;
grant all on subjects            to service_role;
grant all on curricula           to service_role;

-- ── 9. Existing rows: how to handle null user_id ─────────────────────
-- Rows inserted before this migration have user_id = null.
-- They will NOT be visible to any student via the RLS select policy.
-- To assign ownership, run something like:
--   update enrollments set user_id = '<some-uuid>' where enr_number = 'ENR-00001-MN-0';
-- where <some-uuid> is the auth.users.id of the real owner.
-- Do NOT bulk-assign all rows to the current user — each row must be
-- assigned to the student who actually submitted it.

-- ── 10. How to make a user an admin ──────────────────────────────────
-- Run this for each staff member (replace the UUID with their auth.users.id):
--   update auth.users
--     set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
--   where id = '<staff-user-uuid>';
-- After this, isAdminUser() in lib/supabase.ts will return true for them.
