# Chat-Driven Enrollment Plan

## Overview

Enable the existing chatbot to act as an interactive enrollment wizard. When a logged-in user says "I want to enroll" (or clicks the Enroll chip), the AI steps them through only the fields that are not already known from their session — **student type**, **year level**, and **program** (plus subject selection for irregular students). On confirmation, the chat calls `POST /api/enrollments` and navigates the page to `/user/success?enr=...&status=...`, exactly as the existing form does. The `/user/enroll` form page is left untouched.

**Scope:** `ChatWindow.tsx`, `app/(user)/user/page.tsx` (chips + CTA), a new `EnrollStepRenderer.tsx`, and a new `"enroll"` classifier route. No changes to the `/api/enrollments` contract.

## Confirmed Design Decisions

- **Home page Enroll CTA** — shows two options side by side: a primary "Enroll via Chat" button (`/user?action=enroll`) and a secondary "Use the form instead" link (`/user/enroll`). Both paths remain accessible.
- **Identity confirm — "Use a different account"** — cancels the wizard and returns the user to normal chat. No redirect, no sign-out.
- **Irregular subject filtering** — `SubjectPicker` in the wizard is filtered to the year level the user selected (e.g. if they chose "2nd Year", only 2nd Year subjects appear). This differs from the standalone form which shows all subjects.

---

## Sub-Task 1 — Add `"enroll"` classifier route and session-aware chat request

**Intent**
The existing `classifyMessage` function routes to `knowledge`, `live_data`, or `off_topic`. We need a new route — `"enroll"` — that fires when the user expresses enrollment intent. The chat request must also forward the auth token so the API can read the user's `full_name` and `student_id` from the Supabase session.

**Expected Outcomes**
- `classifyMessage` returns `"enroll"` for messages like "I want to enroll", "enroll me", "start enrollment", "paano mag-enroll" etc.
- `ChatWindow.tsx` forwards the `Authorization: Bearer <token>` header in its `fetch("/api/chat", ...)` call when a session exists.
- `POST /api/chat` reads the auth header and extracts `full_name` + `student_id` from the verified Supabase user record when the route is `"enroll"`.

**Todo List**
- [ ] In `lib/chat-classifier.ts`, add `"enroll"` to the route union type and add intent patterns (enroll, enrollment, mag-enroll, sign up for subjects, etc.) to the classifier prompt/rules.
- [ ] In `components/ChatWindow.tsx`, call `supabaseBrowser.auth.getSession()` on mount; store the token in local state. Attach `Authorization: Bearer <token>` to the `fetch` headers when available.
- [ ] In `app/api/chat/route.ts`, when `route === "enroll"`, verify the Bearer token using `supabaseAdmin.auth.getUser(token)`. Extract `user.user_metadata.full_name` and `user.user_metadata.student_id` (falling back to `user.email` for name if metadata is absent). Pass these as context into the enrollment flow.

**Relevant Context**
- `lib/chat-classifier.ts` — add `"enroll"` case
- `components/ChatWindow.tsx` line 55 — the `fetch("/api/chat", ...)` call to extend
- `lib/supabase-browser.ts` — `supabaseBrowser.auth.getSession()`
- `lib/supabase.ts` — `supabaseAdmin.auth.getUser(token)` for server-side verification
- `app/api/chat/route.ts` line 281 — classifier branch point

**Status:** `[ ] pending`

---

## Sub-Task 2 — Define enrollment wizard state in ChatWindow

**Intent**
`ChatWindow` needs to track a local enrollment context object across messages. This is purely client-side React state — no server persistence required. The wizard progresses through a fixed sequence of steps; each step is one question.

**Step sequence (only fields not known from session):**
1. Confirm identity (show pre-filled name + student ID, ask user to confirm)
2. Student type — Regular or Irregular (two quick-reply buttons)
3. Year level — 1st / 2nd / 3rd / 4th Year (four quick-reply buttons)
4. Program — BSIT / BSCPE / BSCS (three quick-reply buttons)
5. *(Irregular only)* Subject selection — render `SubjectPicker` inline in chat
6. Review summary + "Confirm Enrollment" button
7. Submit → navigate to `/user/success?enr=...&status=...`

**Expected Outcomes**
- `ChatWindow` has an `enrollCtx` state object: `{ active: boolean, step: EnrollStep, full_name, student_id, student_type, year_level, program, subject_codes, subjects }`
- When `enrollCtx.active` is `true`, the text input bar is hidden (user responds only via buttons/chips until the wizard exits).
- When the wizard is inactive, the chat behaves exactly as before.

**Todo List**
- [ ] Add `EnrollStep` union type: `"confirm_identity" | "student_type" | "year_level" | "program" | "subjects" | "review" | "done"` to `types/index.ts`.
- [ ] Add `EnrollContext` interface to `types/index.ts`.
- [ ] In `ChatWindow.tsx`, add `enrollCtx` state initialised to `{ active: false, step: "confirm_identity", ... }`.
- [ ] When `enrollCtx.active`, hide the text `<input>` bar and `Send` button.
- [ ] When `enrollCtx.active`, show a small "Cancel enrollment" link so the user can exit the wizard at any time (resets `enrollCtx` and re-shows input bar).

**Relevant Context**
- `types/index.ts` — add new types here
- `components/ChatWindow.tsx` lines 106–213 — JSX to extend with wizard state

**Status:** `[ ] pending`

---

## Sub-Task 3 — Build EnrollStepRenderer component

**Intent**
Each wizard step needs to render an AI message bubble with action buttons (or a `SubjectPicker`) instead of plain text. `EnrollStepRenderer` is a presentational component that receives the current step and calls back to `ChatWindow` when the user makes a selection.

**Expected Outcomes**
- For `confirm_identity`: renders the pre-filled name + student ID in a card. Has "Yes, that's me" and "Use a different account" buttons.
- For `student_type`: renders two buttons — "Regular" and "Irregular" with a one-line description of each.
- For `year_level`: renders four buttons — "1st Year", "2nd Year", "3rd Year", "4th Year".
- For `program`: renders three buttons — "BSIT", "BSCPE", "BSCS".
- For `subjects`: renders `<SubjectPicker>` inline with a "Continue →" button that is enabled only when ≥1 subject is selected.
- For `review`: renders a summary card (name, ID, type, year, program, subjects list). Has "Confirm Enrollment" (primary) and "Start Over" (ghost) buttons.
- All buttons match the existing `#9B1B1B` brand color.

**Todo List**
- [ ] Create `components/EnrollStepRenderer.tsx` with the props interface: `{ step, ctx, onSelect, onSubjectChange, onConfirm, onCancel }`.
- [ ] Implement each step's JSX branch.
- [ ] Reuse `SubjectPicker` component for the subjects step — pass `subjects` from `enrollCtx`.
- [ ] Add loading spinner state for the "Confirm Enrollment" button (disabled while `submitting` prop is true).

**Relevant Context**
- `components/SubjectPicker.tsx` — import and reuse as-is
- `components/ChatWindow.tsx` — where this component will be rendered inside the message list
- Brand colour: `#9B1B1B`

**Status:** `[ ] pending`

---

## Sub-Task 4 — Wire the wizard flow inside ChatWindow

**Intent**
Connect the classifier result, `enrollCtx` state, and `EnrollStepRenderer` together. When the API returns route `"enroll"`, the wizard activates; each step advances on user selection; the final step fires `POST /api/enrollments` and triggers navigation.

**Expected Outcomes**
- Saying "I want to enroll" (or clicking the "Enroll" chip) activates the wizard and shows the identity-confirm step.
- Each button click advances the wizard step and appends a user message bubble + the next AI question bubble to the message list.
- On the `subjects` step, `GET /api/subjects?program=X` is called to populate `SubjectPicker`.
- On "Confirm Enrollment", `POST /api/enrollments` fires with the Bearer token; on `201`, `router.push` navigates to `/user/success?enr=...&status=...`.
- On API error, the wizard shows an inline error message inside the review step and stays open.
- The "Enroll" suggestion chip on the landing page (`app/(user)/user/page.tsx`) navigates directly to the chat page and pre-triggers the enrollment intent message.

**Todo List**
- [ ] In `ChatWindow.tsx`, when the SSE stream ends and `route === "enroll"` is signalled, activate `enrollCtx` and set `step = "confirm_identity"`.
- [ ] Since Gemini handles the "enroll" intent message, add a new SSE event type `{ type: "enroll_start", full_name, student_id }` that the route handler emits instead of a streamed text response.
- [ ] Handle `enroll_start` event in `ChatWindow` — set `enrollCtx.active = true`, store name + student_id, append the AI identity-confirm message bubble.
- [ ] Add `handleStepSelect(value)` function in `ChatWindow` that advances `enrollCtx.step` based on the current step and stores the selected value.
- [ ] After `program` step (or `subjects` step for irregular), advance to `review`.
- [ ] Add `handleConfirm()` in `ChatWindow`: calls `POST /api/enrollments`, sets `submitting = true`, on success calls `router.push`.
- [ ] Add "Enroll Now" chip to the chips list in `ChatWindow` (alongside existing chips).
- [ ] Update `app/(user)/user/page.tsx` Enroll CTA button to link to `/user?action=enroll` and have `ChatWindow` read that search param to auto-trigger the wizard on mount.

**Relevant Context**
- `components/ChatWindow.tsx` lines 39–104 — `sendText` and SSE reader to extend
- `app/api/chat/route.ts` lines 286–317 — where to add `"enroll"` branch that emits `enroll_start`
- `app/(user)/user/page.tsx` — Enroll CTA link target
- `lib/schemas.ts` `EnrollmentSchema` — body shape for `POST /api/enrollments`

**Status:** `[ ] pending`

---

## Sub-Task 5 — Update suggestion chips and landing page CTA

**Intent**
Surface the new chat-enrollment path from the home page and the chat's initial chips so users discover it without having to know to type "enroll".

**Expected Outcomes**
- The home page `(user)/user/page.tsx` "Start Enrollment" card/button links to `/user?action=enroll` instead of or in addition to `/user/enroll`.
- `ChatWindow` reads `?action=enroll` from `useSearchParams` and immediately fires the enrollment intent on mount (one `sendText("I want to enroll")` call).
- The chat suggestions chips list includes "Enroll me" as the first chip.
- Existing chips ("How do I enroll?", etc.) remain unchanged.

**Todo List**
- [ ] In `components/ChatWindow.tsx`, accept an optional `autoAction` prop or read `?action=enroll` from `useSearchParams`.
- [ ] If `autoAction === "enroll"`, call `sendText("I want to enroll")` in a `useEffect` on mount (once only).
- [ ] Add "Enroll me" as the first item in the `CHIPS` array.
- [ ] In `app/(user)/user/page.tsx`, update the Enroll CTA section to show two options: a primary "Enroll via Chat" button (`/user?action=enroll`) and a secondary "Use the form instead" link (`/user/enroll`).

**Relevant Context**
- `components/ChatWindow.tsx` lines 14–20 — `CHIPS` array
- `app/(user)/user/page.tsx` — CTA link

**Status:** `[ ] pending`

---

## Sub-Task 6 — Tests

**Intent**
Cover the new wizard path with unit and component tests, consistent with the project's existing Vitest + Testing Library setup.

**Expected Outcomes**
- `tests/components/ChatWindow.test.tsx` has cases for: wizard activates on "enroll" intent, step advances on selection, confirm fires `POST /api/enrollments`, navigation called on success.
- `tests/components/EnrollStepRenderer.test.tsx` has cases for: each step renders correct buttons, SubjectPicker shown only for subjects step, confirm button disabled while submitting.

**Todo List**
- [ ] Add wizard-related test cases to `tests/components/ChatWindow.test.tsx`.
- [ ] Create `tests/components/EnrollStepRenderer.test.tsx` with step-rendering tests.

**Relevant Context**
- `tests/components/ChatWindow.test.tsx` — extend existing file
- `vitest.config.mjs` — no changes needed

**Status:** `[ ] pending`
