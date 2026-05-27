# Phase 2 — Identity And Persistence Plan

## Objective
Add the smallest credible identity and persistence layer to the Phase 1 core loop without changing the gameplay surface area or drifting into Phase 3 player modeling.

Phase 2 should deliver:
- real account-backed persistence
- saved runs
- best score
- streak
- last played
- guest-first product behavior

It should not deliver:
- player modeling
- adaptive questioning
- AI insights
- admin tooling
- social systems
- broad profile customization

## Recommended Architecture Direction

### Frontend
- Keep the current stack:
  - Vite
  - React
  - TypeScript
- Add a thin auth/data layer only after Phase 2 implementation begins.
- Preserve the current game reducer and hot-seat loop. Persistence should wrap the loop, not rewrite it.

### Auth Recommendation
- Use Supabase Auth with passwordless email magic links as the only Phase 2 auth method.
- Do not require sign-in on landing.
- Do not add passwords, OAuth, or MFA in the first Phase 2 slices.

Why this is the best fit:
- It is the simplest practical auth flow for a mobile-first web app.
- It fits the locked guest-first product direction.
- It keeps implementation scope smaller than combining separate auth and database vendors.
- It remains credible for a portfolio-quality app because it keeps identity, database, and authorization in one maintainable stack.

Why not use anonymous auth in Phase 2:
- Supabase does support anonymous auth, but anonymous users are still real authenticated users and require explicit RLS handling, conflict resolution, and cleanup.
- That adds complexity earlier than needed for this product.
- For this app, a simpler guest model is better:
  - guest runs are allowed without account creation
  - persistence starts when the user chooses to create an account

### Backend / Persistence Recommendation
- Use Supabase Postgres as the Phase 2 persistence layer.
- Use Row Level Security from day one.
- Keep writes simple:
  - client submits completed run
  - backend persists run
  - backend updates profile summary fields in the same operation or transaction boundary

What not to add in initial Phase 2:
- custom standalone Node backend
- event streaming
- analytics pipelines
- queues
- topic-performance tables
- per-question telemetry persistence

## Guest Mode Rules
- Landing remains guest-first and immediate.
- A user can play the full Phase 1 loop without signing in.
- Guest runs are not durable persistence.
- Before sign-in, the app may hold only the current browser session state needed to finish a run or bridge the just-finished run into signup.
- The app must not imply that guest progress is permanently saved.

### Guest Persistence Rule
- No long-term guest history in Phase 2.
- Only account-backed users get durable run history, best score, streak, and last played.

This is the recommended tradeoff because it keeps Phase 2 narrow and avoids anonymous-account cleanup and merge complexity.

## Upgrade-To-Account Recommendation

### When to prompt
- Prompt after a completed guest run on the result screen.
- Do not interrupt gameplay mid-run.
- Keep the existing primary replay action intact.
- Add a clear secondary guest-upgrade prompt such as:
  - `Create account to save this run`

### How it should behave
- Guest finishes run.
- Result screen shows replay CTA plus save-progress CTA.
- User taps save-progress CTA.
- Auth sheet/modal opens for email magic link.
- After successful sign-in/sign-up:
  - create profile record if needed
  - persist the just-finished run
  - update best score, streak, and last played
  - return the user to the result or landing state with saved identity context

### Important rule
- Only the just-finished guest run may be bridged into account creation.
- Older guest history should not be backfilled in Phase 2.

This keeps the product understandable and the implementation small.

## Minimal User Journey

### First-time guest
1. User lands on the Phase 1 entry screen.
2. User starts a run immediately as a guest.
3. User completes a run.
4. Result screen offers:
   - replay
   - create account to save this run

### Returning signed-in user
1. User opens app.
2. Landing screen shows signed-in state and lightweight persisted summary:
   - best score
   - streak
   - last played
3. User starts run immediately.
4. Completed run auto-saves.

## Proposed Minimal Schema / Entities

Use Supabase Auth's built-in `auth.users` plus two public tables.

### `profiles`
Purpose:
- one row per permanent user
- holds denormalized summary fields used for fast UI reads

Suggested fields:
- `user_id uuid primary key references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `display_name text null`
- `best_score_rank integer not null default 0`
- `current_streak integer not null default 0`
- `last_played_at timestamptz null`
- `best_run_id uuid null`

### `runs`
Purpose:
- durable run history
- source of truth for completed run records

Suggested fields:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references profiles(user_id)`
- `created_at timestamptz not null default now()`
- `started_at timestamptz not null`
- `completed_at timestamptz not null`
- `outcome text not null`
- `highest_rank integer not null`
- `correct_answers integer not null`
- `total_questions integer not null`
- `failure_reason text null`
- `best_reserve_seconds integer null`
- `question_set_version text not null`

### Notes On What To Store
Store in Phase 2:
- runs
- best score
- streak
- last played
- enough run summary to render lightweight history later

Defer until Phase 3:
- per-question timing telemetry
- hesitation events
- confidence signals
- topic mastery
- adaptive difficulty metadata
- AI-generated summaries

## Minimum UI Surface Area For Phase 2
- Keep existing Phase 1 screens.
- Add only the smallest new identity/persistence surfaces:
  - result-screen guest save CTA
  - auth modal/sheet for email magic link
  - lightweight signed-in summary on landing
  - optional small account/status affordance with sign out

Not required in the first user-facing Phase 2 slice:
- full profile page
- settings page
- large account dashboard

Run history can be added as a small later Phase 2 slice after foundation and saved-summary behavior are stable.

## Scope Exclusions
Explicitly out of scope for Phase 2:
- player modeling
- adaptive question selection
- AI insights
- admin tools
- multiplayer
- social features
- creator systems
- native-specific account flows
- complex profile customization
- multiple auth providers in the first slice

## Risks And Tradeoffs

### Chosen tradeoffs
- Email magic link only:
  - pro: simplest auth UX and setup
  - con: depends on email delivery and redirect flow working well

- No persistent guest history:
  - pro: much smaller implementation surface
  - con: guest progress is lost unless the user upgrades after a run

- Denormalized profile stats:
  - pro: fast reads for landing/result UI
  - con: write path must update aggregates carefully

### Main risks
- Auth redirect handling can feel awkward on mobile browsers if not carefully implemented.
- If run-save and profile-update are not treated as one logical operation, best score or streak could drift from run history.
- The product must clearly communicate that guest play is real gameplay but not durable history.

## Recommended Order Of Execution

### Slice 1 — Phase 2 foundation
- set up Supabase project wiring and environment contract
- add typed auth/data client boundaries
- add schema and RLS plan
- no visible product expansion yet

### Slice 2 — Auth shell and guest upgrade entry point
- add email magic link auth flow
- add guest result-screen save CTA
- add session handling
- no history UI yet

### Slice 3 — Persist completed runs and summary stats
- save completed authenticated runs
- create/update profile aggregates
- show signed-in summary on landing

### Slice 4 — Lightweight run history surface
- add recent runs list
- keep it compact and mobile-first
- no analytics or per-question detail

## PR-Sized Implementation Slice Breakdown

### Slice A — Supabase foundation and schema contract
Goal:
- introduce the persistence/auth foundation without changing current gameplay behavior

Deliverables:
- environment variable contract
- Supabase client wiring
- schema SQL or migrations for `profiles` and `runs`
- RLS policies
- thin repository/service layer boundaries

Out of scope:
- user-facing auth UI
- run saves
- history UI

### Slice B — Guest-to-account auth entry
Goal:
- let a guest convert into an account from the result screen

Deliverables:
- auth provider/session state
- email magic link UI
- result-screen save-progress CTA
- pending completed-run bridge for immediate post-run save

Out of scope:
- full history
- advanced profile surfaces

### Slice C — Persist runs and update summaries
Goal:
- save completed runs for authenticated users and surface core persisted stats

Deliverables:
- completed-run insert path
- profile aggregate update path
- landing summary:
  - best score
  - streak
  - last played

Out of scope:
- rich history UI
- Phase 3 telemetry

### Slice D — Lightweight run history
Goal:
- expose stored runs in the smallest useful surface

Deliverables:
- recent runs list
- simple sorting by most recent
- compact mobile-first presentation

Out of scope:
- deep analytics
- per-question replay
- AI insights

## Immediate Codex Prompt Bundle

### Prompt 1 — Phase 2 foundation/setup
```text
id="mmrm-phase2-02-foundation-supabase-setup"

Goal:
Implement the Phase 2 foundation for identity and persistence in Millionaire: Mind Reader Mode without changing the current gameplay loop yet.

Read first:
- AGENTS.md
- README.md
- docs/context.md
- docs/review-brief.md
- docs/phase-2-identity-persistence.md

Scope:
1. Add the minimum Supabase foundation for this repo's Vite + React + TypeScript app
2. Define environment variable contract for client usage
3. Add schema/migration assets for:
   - profiles
   - runs
4. Define RLS policies so users can only access their own rows
5. Add thin auth/data client modules and types
6. Do not add user-facing auth screens yet
7. Do not change gameplay flow or current screens beyond non-visible plumbing if needed

Hard constraints:
- keep diff PR-sized
- no Phase 3 telemetry
- no AI features
- no new gameplay systems
- no history UI yet
- no broad refactor of current app state

Verification:
- app still builds
- current gameplay loop still works
- `npm test` passes
- `npm run build` passes

Documentation updates:
- update docs/build-log.md
- update docs/context.md if architecture changed
- overwrite docs/review-brief.md
- update README.md only if setup changed

Stop point:
Stop after Supabase foundation/schema/auth plumbing is ready for the next slice.
Do not implement visible auth UX yet.
```

### Prompt 2 — First user-facing identity/persistence slice
```text
id="mmrm-phase2-03-auth-shell-and-save-run"

Goal:
Implement the first user-facing Phase 2 slice for Millionaire: Mind Reader Mode: guest-to-account upgrade from the result screen plus saving the just-finished run for authenticated users.

Read first:
- AGENTS.md
- README.md
- docs/context.md
- docs/review-brief.md
- docs/phase-2-identity-persistence.md

Assume:
- Supabase foundation/schema/client setup already exists
- current gameplay loop remains intact

Scope:
1. Add simplest practical auth UX using email magic link
2. Keep landing guest-first with no required sign-in
3. Add result-screen CTA for guests:
   - create account to save this run
4. After successful auth:
   - create profile if needed
   - persist the just-finished run
   - update best score, streak, and last played
5. Show minimal signed-in state on landing or result if useful

Hard constraints:
- keep diff PR-sized
- no separate profile page
- no run history list yet
- no Phase 3 telemetry
- no AI insights
- no redesign of core gameplay loop

Verification:
- guest can still play immediately
- auth flow works from result screen
- newly created account persists the just-finished run
- replay still works
- `npm test` passes
- `npm run build` passes

Documentation updates:
- update docs/build-log.md
- update docs/context.md if needed
- overwrite docs/review-brief.md
- update README.md only if feature summary changed

Stop point:
Stop after guest-to-account upgrade and save-this-run behavior works.
Do not build full history UI yet.
```

## Recommendation Summary
- Choose Supabase for both auth and persistence.
- Use email magic link only in the initial Phase 2 implementation.
- Keep landing guest-first and do not require sign-in before gameplay.
- Persist only account-backed runs and profile summary fields.
- Bridge only the just-finished guest run into signup.
- Add history only after the foundation and save-run flow are stable.

## Reference Links
- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase passwordless email: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase users and auth roles: https://supabase.com/docs/guides/auth/users
- Supabase anonymous auth caveats: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase API security and RLS: https://supabase.com/docs/guides/api/securing-your-api
