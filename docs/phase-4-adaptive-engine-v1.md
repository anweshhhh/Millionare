# Phase 4 — Adaptive Engine V1 Plan

## Objective
Define the smallest credible hidden adaptive engine that can use the existing player model to choose better next questions and pacing behavior without making the game feel unfair, rigged, or noisy.

Phase 4 should deliver:
- hidden between-question adaptation
- simple deterministic question-selection rules
- fairness guardrails
- better replay freshness inside the current seeded environment

Phase 4 should not deliver:
- user-facing AI explanations
- post-run insight summaries
- admin or analytics UI
- a generalized recommendation platform

## Adaptive Engine V1 Philosophy
Adaptive Engine v1 should act like an invisible showrunner, not a puppet master.

It should:
- preserve the feeling that the player is earning each rung
- make sessions feel sharper and more personal over time
- slightly improve fit between question pacing and player profile

It should not:
- swing difficulty wildly
- overreact to one question
- visibly punish weak spots
- create a sense that the outcome is pre-decided

The engine should be:
- deterministic
- reviewable
- conservative
- easy to reason about in logs and tests

## Design Principles
- Adapt only between questions.
- Never change the visible UI or mid-question rules.
- Prefer gentle nudges over strong manipulations.
- Use the existing player model only when confidence is high enough.
- If confidence is low, fall back to simple seeded behavior.
- Preserve replay freshness without breaking fairness.

## Allowed Adaptation Inputs

### Inputs from the current player model
These are safe and useful now:

- `accuracy_rate`
- `timeout_rate`
- `avg_response_time_ms`
- `avg_first_selection_time_ms`
- `avg_selection_change_count`
- `pressure_accuracy_rate`
- `pressure_timeout_rate`
- `confidence_style`
- `hesitation_style`
- `pressure_style`
- `category_snapshot`
- `questions_observed`
- `runs_observed`

### Inputs from the current run
These should also influence decisions because adaptation should respond to live session state:

- current question rank
- current run correctness streak
- whether the last miss was:
  - wrong answer
  - timeout
- time remaining on recent correct locks
- recent in-run category exposure

### Inputs from the seeded question pool
Phase 4 should use lightweight metadata on the local seeded set, not a new sourcing system.

Recommended question metadata additions later:
- `difficulty_band`
  - `easy`
  - `medium`
  - `hard`
- `pressure_tag`
  - `calm`
  - `neutral`
  - `spiky`
- `topic_group`
  - a compact category grouping if needed

For the first adaptive pass, this can stay inside the local seed domain.

## Allowed Decision Outputs

### Decisions Adaptive Engine V1 may make
- choose the next question from a candidate set
- bias toward:
  - slightly easier stabilization
  - slightly harder pressure testing
  - weak-spot probing
  - freshness rotation
- avoid immediate category repetition when unnecessary
- avoid repeated timeout traps for timeout-prone users

### Decisions it may not make yet
- mid-question timer changes
- answer UI changes
- reveal/suspense duration changes
- visible difficulty labels
- user-facing explanations of why a question was chosen
- per-user narrative summarization
- content generation

## Recommended Adaptive Decisions

### 1. Difficulty stepping
Adaptive Engine V1 may move the next question one step easier or harder than the baseline expectation.

Allowed behavior:
- if the player looks unstable:
  - choose from `baseline` or `baseline - 1`
- if the player looks steady:
  - choose from `baseline` or `baseline + 1`

Not allowed:
- large jumps
- repeated hard spikes after misses

### 2. Pressure balancing
Use pressure profile to slightly change how often “spiky” questions appear.

Allowed behavior:
- `steady-under-pressure`
  - allow occasional pressure tests
- `pressure-sensitive`
  - reduce back-to-back pressure spikes
- `timeout-prone`
  - bias toward clearer, calmer question shapes until confidence rises

### 3. Weak-spot targeting
Allowed only in a soft form.

Allowed behavior:
- if category observations are strong enough, occasionally surface a weaker category
- cap weak-spot probing frequency so it feels like variety, not punishment

Not allowed:
- repeatedly hammer the same weak category
- target low-confidence category data with strong adaptation

### 4. Replay freshness
Within the seeded environment, freshness should be a first-class but lightweight goal.

Allowed behavior:
- avoid very recent repeats
- rotate category / difficulty / pressure combinations
- when multiple candidates are equally valid, prefer the less recently seen one

## Fairness Guardrails

Adaptive Engine V1 must obey these guardrails:

### Guardrail 1 — bounded moves
- adaptation may only nudge selection within a narrow band around the baseline rank
- no large sudden difficulty jumps

### Guardrail 2 — no punishment spirals
- after a miss or timeout, do not immediately increase both difficulty and pressure
- timeout-prone users should not be fed repeated high-pressure traps

### Guardrail 3 — low-confidence fallback
- if the model is thin or inconsistent, use baseline seeded ordering or only very light freshness rotation
- do not use weak category signals aggressively until enough observations exist

### Guardrail 4 — category restraint
- do not repeat the same weak category in adjacent or near-adjacent questions unless the pool is extremely constrained

### Guardrail 5 — transparent internal rules
- decisions should be reproducible from explicit rules and metadata
- no hidden randomness that cannot be reasoned about

## Low-Confidence / Insufficient-Data Behavior

When model confidence is low, the engine should be intentionally boring and safe.

Recommended behavior:
- preserve baseline difficulty progression
- apply freshness rotation only
- avoid category targeting
- avoid pressure testing based on weak evidence

Use low-confidence fallback when:
- `questions_observed` is below a minimum threshold
- style labels are `insufficient-data`
- category observations are sparse

## Suggested Engine Shape

Keep the engine as a small deterministic scoring layer:

1. Start with a baseline candidate set for the next rank.
2. Filter out questions that violate hard guardrails.
3. Score remaining candidates across a few simple dimensions:
   - difficulty fit
   - pressure fit
   - weak-spot targeting
   - freshness
4. Pick the highest score.
5. Use a stable tiebreaker to keep results deterministic.

## Recommended Scoring Dimensions

### Difficulty fit
- reward questions close to the intended band
- softly stabilize after misses
- allow slightly harder tests for highly steady players

### Pressure fit
- reward pressure shapes compatible with the player’s pressure profile
- reduce repeated timeout pressure for fragile profiles

### Weak-spot targeting
- only activate if category confidence is strong enough
- keep score weight smaller than fairness and difficulty fit

### Freshness
- prefer less recently seen questions or categories
- use as a tie-breaker or light scoring component, not a dominant one

## What Data Additions Are Actually Needed

Phase 4 should avoid large new persistence work.

Minimum needed later:
- question metadata additions in the local seed domain:
  - `difficulty_band`
  - `pressure_tag`
  - optional `topic_group`

Optional but useful persisted addition later:
- an internal `adaptation_reason_code` on saved runs
  - only if needed for debugging and admin analysis later

Not needed in the first adaptive pass:
- new backend services
- experiments platform
- recommendation logs table
- feature-flag infrastructure

## Implementation Slice Breakdown

### Slice 1 — Foundation engine rules
Goal:
- define adaptive question metadata and a pure deterministic decision engine

Deliverables:
- question metadata extensions in the seed domain
- adaptive candidate scoring helpers
- fairness guardrail helpers
- pure tests for engine behavior

Out of scope:
- wiring into gameplay flow
- persistence changes
- UI changes

### Slice 2 — Gameplay integration
Goal:
- replace fixed next-question selection with the adaptive engine while preserving the current hot-seat flow

Deliverables:
- engine call between questions
- baseline fallback behavior
- current-run context integration
- tests for integration and unchanged visible UX

Out of scope:
- explanations in UI
- post-run insights
- admin visibility

### Slice 3 — Calibration and review
Goal:
- validate the engine against seeded scenarios and tune scoring weights / guardrails

Deliverables:
- scenario tests
- tuned constants
- optional tiny debug traces if truly needed locally

Out of scope:
- new player-facing surfaces

## Risks / Tradeoffs

### Main risks
- overreacting to thin model data
- making weak-spot targeting feel punitive
- too little variation, making adaptation invisible
- too much variation, making it feel rigged

### Chosen tradeoffs
- deterministic rules over cleverness
- bounded adaptation over aggressive personalization
- fallback to boring baseline behavior over noisy early adaptation
- local seeded metadata over a heavier content system

## Scope Exclusions

Explicitly defer:

### To later insight phases
- user-facing explanations of behavior
- post-run summaries
- narrative coaching

### To later admin phases
- adaptation dashboards
- internal tuning consoles
- aggregate adaptation analytics

### Also out of scope now
- content generation
- question authoring system expansion
- experiments / A/B framework
- pipelines / queues / event streaming
- landing or result UI expansion

## Recommended Next Implementation Order
1. Add question metadata and pure adaptive engine rules.
2. Add deterministic fairness and low-confidence guardrail tests.
3. Integrate engine selection between questions using current player model plus current-run context.
4. Validate seeded scenarios before any insight or admin work begins.

## Immediate Codex Prompt Bundle

### Prompt 1 — Phase 4 foundation engine rules
```text
id="mmrm-phase4-02-foundation-engine-rules"

Goal:
Implement the pure Adaptive Engine v1 foundation for Millionaire: Mind Reader Mode without changing visible gameplay UX yet.

This slice should define question metadata, candidate selection rules, fairness guardrails, and deterministic engine scoring as pure domain logic only.

Read first:
- AGENTS.md
- README.md
- docs/context.md
- docs/review-brief.md
- docs/phase-4-adaptive-engine-v1.md
- docs/phase-3-player-model-v1.md

Scope:
1. Extend the seeded-question domain with minimal adaptive metadata:
   - difficulty_band
   - pressure_tag
   - optional topic grouping only if needed
2. Add a pure adaptive engine module that:
   - accepts player-model snapshot + current-run context + candidate questions
   - applies fairness guardrails
   - scores candidates deterministically
   - returns a chosen next question id or candidate
3. Add tests for:
   - low-confidence fallback
   - bounded difficulty moves
   - timeout-prone guardrail behavior
   - weak-spot targeting restraint
   - freshness tie-breaking

Hard constraints:
- no gameplay integration yet
- no UI changes
- no persistence changes
- no adaptive explanations
- no new dependencies

Verification:
- npm test passes
- npm run build passes
- engine logic is deterministic and reviewable

Documentation updates:
- update docs/build-log.md
- update docs/context.md if assumptions changed
- overwrite docs/review-brief.md
- update README.md only if current status needs clarification

Stop point:
Stop after pure engine rules and tests are in place.
Do not wire the engine into gameplay yet.
```

### Prompt 2 — Phase 4 gameplay integration
```text
id="mmrm-phase4-03-gameplay-integration"

Goal:
Integrate Adaptive Engine v1 into Millionaire: Mind Reader Mode so next-question selection becomes adaptive between questions while preserving the current visible gameplay UX.

Read first:
- AGENTS.md
- README.md
- docs/context.md
- docs/review-brief.md
- docs/phase-4-adaptive-engine-v1.md
- docs/phase-3-player-model-v1.md

Current prerequisites:
- Adaptive engine foundation rules exist
- Phase 3 player-model persistence exists
- current gameplay loop is stable

Scope:
1. Replace fixed next-question progression with adaptive selection between questions
2. Use:
   - current player-model snapshot when available
   - current-run context
   - seeded-question metadata
3. Preserve:
   - explicit select -> lock
   - suspense/reveal/auto-advance flow
   - current mobile-first UI
4. Fall back safely when model confidence is low
5. Add deterministic tests for integration behavior

Hard constraints:
- no user-facing adaptive UI
- no landing/result expansion
- no admin/debug dashboard
- no broad reducer rewrite
- no new dependencies

Verification:
- npm test passes
- npm run build passes
- gameplay UX remains visually unchanged
- next-question choice now adapts deterministically under the defined rules

Documentation updates:
- update docs/build-log.md
- update docs/context.md if architecture changed
- overwrite docs/review-brief.md
- update README.md only if current status needs clarification

Stop point:
Stop after hidden between-question adaptive selection is wired.
Do not add post-run insights or admin surfaces.
```
