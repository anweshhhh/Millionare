# Phase 3 — Player Model V1 Plan

## Objective
Define the smallest credible hidden player model that can later support:
- adaptive question selection
- post-run insight summaries
- private admin / creator intelligence

Phase 3 itself should stay narrow.

It should deliver:
- purposeful per-question signal capture
- lightweight run-level behavioral summaries
- a minimal persisted user model

It should not yet deliver:
- adaptive question selection
- user-facing insight screens
- dashboards
- data pipelines
- heavyweight analytics architecture

## Player Model V1 Philosophy
Player Model v1 should not try to be "smart" in every direction at once.

It should answer a small set of meaningful questions:
- Does this player answer quickly or cautiously?
- Do they lock early with confidence or wait until pressure spikes?
- Do they break more often from wrong certainty or from time pressure?
- Which categories currently look stable vs shaky?
- How does their decision quality behave as pressure rises?

The model remains invisible to the player in this phase.
It exists to create a trustworthy foundation for later adaptation and insight work.

## Design Principles
- Capture only signals the current hot-seat loop can produce reliably.
- Prefer simple, explainable derived fields over opaque scoring systems.
- Keep the reducer and gameplay flow intact; add instrumentation around it.
- Persist only what is hard to reconstruct later or required for future product value.
- Treat raw signals as product-facing behavioral evidence, not generic analytics exhaust.

## Minimum Signal Set

### Per-question signals to capture
These are the smallest signals worth recording for each answered or timed-out question:

- `question_id`
- `run_id`
- `user_id`
- `question_rank`
- `category`
- `result`
  - `correct`
  - `incorrect`
  - `timeout`
- `correct_answer_index`
- `selected_answer_index`
- `locked_answer_index`
- `time_remaining_at_lock`
- `response_time_ms`
  - elapsed from question becoming active to lock or timeout
- `first_selection_time_ms`
  - elapsed from question becoming active to first option selection
- `selection_change_count`
  - number of times answer selection changed before lock
- `locked_with_under_5s`
  - boolean
- `timed_out_without_lock`
  - boolean

### Run-level signals to summarize
These are derived from per-question records and should be stored in compact run summary form:

- `correct_count`
- `incorrect_count`
- `timeout_count`
- `average_response_time_ms`
- `average_first_selection_time_ms`
- `selection_change_rate`
- `under_5s_lock_count`
- `pressure_miss_count`
  - wrong answers or timeouts while under 5 seconds
- `category_breakdown`
  - minimal aggregated category counters, not deep telemetry

## Transient vs Persisted Boundaries

### Transient only
These can stay client-side during a run and do not need their own durable standalone store:

- question activation timestamp
- first selection timestamp
- current selection history during the live question
- temporary reveal/suspense timing markers

These should exist only long enough to create a per-question signal record.

### Persisted per question
Persist the final compact question signal record after each completed run save:

- question identity
- category
- rank
- correctness outcome
- response timing
- first-selection timing
- selection-change count
- lock / timeout flags

### Persisted per run
Persist only compact run-level behavioral aggregates that are useful for model updates and admin visibility later:

- counts and averages
- pressure-related counters
- category summary payload

### Persisted per user model
Persist a small stable player model snapshot that can be updated after each saved run:

- confidence profile
- hesitation profile
- pressure profile
- category stability snapshot

## Recommended Schema Additions

Use the existing `profiles` and `runs` tables as the base.
Add two new public tables plus narrow fields on `runs`.

### 1. `run_question_signals`
Purpose:
- store the minimum durable behavioral record per answered question
- source of truth for later model recomputation if needed

Suggested fields:
- `id uuid primary key default gen_random_uuid()`
- `run_id uuid not null references runs(id) on delete cascade`
- `user_id uuid not null references profiles(user_id)`
- `question_id text not null`
- `question_rank integer not null`
- `category text not null`
- `result text not null`
- `correct_answer_index integer not null`
- `selected_answer_index integer null`
- `locked_answer_index integer null`
- `response_time_ms integer not null`
- `first_selection_time_ms integer null`
- `selection_change_count integer not null default 0`
- `time_remaining_at_lock integer null`
- `locked_with_under_5s boolean not null default false`
- `timed_out_without_lock boolean not null default false`
- `created_at timestamptz not null default now()`

Recommended indexes:
- `(user_id, created_at desc)`
- `(run_id)`
- `(user_id, category)`

### 2. `player_models`
Purpose:
- store the latest hidden v1 model snapshot for each user

Suggested fields:
- `user_id uuid primary key references profiles(user_id) on delete cascade`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `runs_observed integer not null default 0`
- `questions_observed integer not null default 0`
- `accuracy_rate numeric not null default 0`
- `timeout_rate numeric not null default 0`
- `avg_response_time_ms integer null`
- `avg_first_selection_time_ms integer null`
- `avg_selection_change_count numeric not null default 0`
- `pressure_accuracy_rate numeric not null default 0`
- `pressure_timeout_rate numeric not null default 0`
- `confidence_style text not null default 'insufficient-data'`
- `hesitation_style text not null default 'insufficient-data'`
- `pressure_style text not null default 'insufficient-data'`
- `category_snapshot jsonb not null default '{}'::jsonb`
- `model_version text not null default 'player-model-v1'`

### 3. Minimal additions to `runs`
Add only a small set of behavioral summary fields:

- `avg_response_time_ms integer null`
- `avg_first_selection_time_ms integer null`
- `selection_change_rate numeric null`
- `pressure_miss_count integer null default 0`
- `timeout_count integer null default 0`
- `category_summary jsonb null`

This keeps run-level history useful without forcing every later read to scan per-question rows.

## Initial Derived User-Model Fields
Keep the first model readable and explainable.

### Core fields
- `accuracy_rate`
- `timeout_rate`
- `avg_response_time_ms`
- `avg_first_selection_time_ms`
- `avg_selection_change_count`
- `pressure_accuracy_rate`
- `pressure_timeout_rate`
- `runs_observed`
- `questions_observed`

### Interpretable label fields
These should be derived from simple thresholds, not ML:

- `confidence_style`
  - `decisive`
  - `measured`
  - `wavering`
  - `insufficient-data`

- `hesitation_style`
  - `fast-reader`
  - `deliberate-reader`
  - `late-committer`
  - `insufficient-data`

- `pressure_style`
  - `steady-under-pressure`
  - `pressure-sensitive`
  - `timeout-prone`
  - `insufficient-data`

### Category snapshot
Keep this lightweight:

```json
{
  "Science": {
    "questions": 4,
    "accuracy_rate": 0.75,
    "timeout_rate": 0.0,
    "avg_response_time_ms": 8200
  }
}
```

Only categories with enough observations should meaningfully influence later adaptation.

## What Should Be Emitted Per Question vs Summarized Per Run

### Emit per question
- correctness
- timeout vs wrong-answer
- response timing
- first selection timing
- selection change count
- lock pressure flags
- category
- rank

### Summarize per run
- averages
- pressure counts
- timeout counts
- category summary snapshot

### Persist in user model
- rolling rates
- rolling timing averages
- interpretable style labels
- category snapshot

## Client-Side First vs Persisted Later

### Client-side first
These computations should happen in the app first because they derive directly from reducer timing and UI interaction:

- `response_time_ms`
- `first_selection_time_ms`
- `selection_change_count`
- per-question lock pressure flags
- run-level averages/counters

### Persisted later in the same save flow
Once a run completes and is being saved:

- insert `runs` row with behavioral summary fields
- insert `run_question_signals` rows for the run
- upsert `player_models` snapshot

This keeps the save pipeline simple and avoids a dedicated event ingestion system.

## Integration With Current Reducer / Gameplay Flow

The current reducer already provides:
- question entry points
- answer selection
- answer lock
- timeout
- reveal result

Phase 3 should integrate with the current loop using a small instrumentation layer:

1. Start a transient question signal object when a question becomes active.
2. Record first-selection timestamp on the first `SELECT_ANSWER`.
3. Increment selection-change count when selection changes.
4. Finalize question signal on:
   - `LOCK_ANSWER` + reveal resolution
   - timeout
5. Build run-level behavioral summary when the run completes.
6. Pass that summary into the existing authenticated save path without rewriting the reducer.

This preserves the current gameplay architecture and keeps the change reviewable.

## Recommended Phase 3 Slice Breakdown

### Slice 1 — Foundation instrumentation
Goal:
- capture transient behavioral signals during the existing hot-seat loop

Deliverables:
- question instrumentation state
- signal types
- helper functions for timing / selection-change tracking
- run-level summary builder
- no persistence changes yet

### Slice 2 — Persistence and model aggregation
Goal:
- store question signals and update the hidden player model when a run is saved

Deliverables:
- schema additions
- repository methods
- save-path integration for question signal rows and run summary fields
- `player_models` upsert

### Slice 3 — Validation and tuning
Goal:
- validate model values and tune thresholds without exposing them to users

Deliverables:
- deterministic tests
- threshold constants
- narrow debug visibility only if needed locally

## Risks / Tradeoffs

### Chosen tradeoffs
- Persisting per-question rows:
  - pro: allows later recomputation and auditability
  - con: more write volume than run-only summaries

- Keeping label derivation simple:
  - pro: interpretable and easy to trust
  - con: less nuanced than later adaptive systems

- Using client-side timing first:
  - pro: simplest integration with current reducer
  - con: timing fidelity is browser-side, not server-side

### Main risks
- Over-capturing too early could bloat the schema and save path.
- Poor threshold choices could create misleading model labels.
- Category modeling can become noisy if question volume stays low.

## Scope Exclusions
Explicitly defer to later phases:

### Adaptive engine phase
- live next-question selection
- difficulty balancing
- weak-spot targeting
- tension balancing heuristics

### Insight phase
- post-run player-facing summaries
- narrative interpretations
- AI-generated commentary

### Admin / creator phase
- dashboards
- question calibration UI
- ambiguity detection UI
- aggregate fleet analytics

### Also out of scope now
- event pipelines
- queues
- streaming telemetry
- ML models
- embeddings
- experimentation frameworks

## Recommended Next Implementation Order
1. Instrument transient per-question signals in the current gameplay loop.
2. Add behavioral summary building at run completion.
3. Extend the save flow to persist run summaries plus `run_question_signals`.
4. Upsert `player_models` from simple deterministic aggregations.
5. Stop and verify before any adaptive selection or insights work starts.

## Immediate Codex Prompt Bundle

### Prompt 1 — Phase 3 foundation instrumentation
```text
id="mmrm-phase3-02-foundation-instrumentation"

Goal:
Implement the Phase 3 Player Model v1 instrumentation foundation for Millionaire: Mind Reader Mode without changing the visible gameplay UX.

This slice should capture the minimum transient behavioral signals from the existing hot-seat loop, but should not persist them yet.

Read first:
- AGENTS.md
- README.md
- docs/context.md
- docs/review-brief.md
- docs/phase-3-player-model-v1.md

Current constraints:
- keep the current gameplay loop intact
- do not add user-facing insight UI
- do not add adaptive question selection
- do not change auth or landing scope

Scope:
1. Add minimal signal/domain types for per-question behavioral capture
2. Instrument the current reducer-driven hot-seat flow to capture:
   - response time
   - first selection time
   - selection change count
   - timeout occurrence
   - lock pressure flags
3. Build a compact run-level behavioral summary at run completion
4. Keep this data in client memory only for now
5. Add tests for important signal derivation logic

Hard constraints:
- keep diff PR-sized
- no persistence changes yet
- no schema changes yet
- no user-facing screens
- no analytics dashboards
- no gameplay rule changes

Verification:
- npm test passes
- npm run build passes
- gameplay loop still behaves exactly the same
- transient signal objects are populated deterministically

Documentation updates:
- update docs/build-log.md
- update docs/context.md if assumptions changed
- overwrite docs/review-brief.md
- update README.md only if current status text needs clarification

Stop point:
Stop after transient instrumentation and run-summary derivation are working locally.
Do not persist player model data yet.
```

### Prompt 2 — Phase 3 persistence and model aggregation
```text
id="mmrm-phase3-03-persistence-and-model-aggregation"

Goal:
Persist Phase 3 Player Model v1 data for Millionaire: Mind Reader Mode using the existing Supabase save foundation, without adding adaptive gameplay or user-facing insight UI.

Read first:
- AGENTS.md
- README.md
- docs/context.md
- docs/review-brief.md
- docs/phase-3-player-model-v1.md

Current prerequisites:
- Phase 3 transient instrumentation exists locally
- guest/auth/save flow already works
- runs and profiles persistence already exists

Scope:
1. Add schema/migration assets for:
   - run_question_signals
   - player_models
   - minimal behavioral summary fields on runs
2. Add thin repository methods to persist:
   - run question signal rows
   - run-level behavioral summary fields
   - player model snapshot
3. Integrate the persistence into the existing authenticated run-save path
4. Keep the player model invisible in the UI
5. Add tests for aggregation helpers where practical

Hard constraints:
- keep diff PR-sized
- no adaptive engine
- no user-facing insights
- no admin dashboards
- no broad refactor of auth/save flow
- no new dependencies

Verification:
- npm test passes
- npm run build passes
- existing save flow still works
- saved runs now also persist player-model v1 data

Documentation updates:
- update docs/build-log.md
- update docs/context.md if architecture changed
- overwrite docs/review-brief.md
- update README.md only if current status/setup text changed

Stop point:
Stop after Phase 3 data persistence and model aggregation are wired.
Do not start adaptive question selection or post-run insights.
```
