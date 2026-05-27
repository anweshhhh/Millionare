# Phase 5 — Insight Summaries V1 Plan

## Objective
Define the narrowest safe first pass for user-facing post-run insight summaries.

Phase 5 should make the existing hidden intelligence visible for the first time, but only in a tightly controlled way:
- result-screen only
- concise and earned
- replay still primary
- no dashboards
- no chatbot posture

Phase 5 should deliver:
- one compact post-run insight summary area on the result screen
- deterministic/template-based insight derivation
- confidence-aware suppression and softening rules

Phase 5 should not deliver:
- landing expansion
- mid-run insights
- admin analytics UI
- charts or dashboards
- freeform AI coach/chat surfaces
- broad account/profile expansion

## Why Phase 5 Happens Now
Phase 5 is only safe after Phase 4 closes because the product now has enough backstage evidence to support earned insights:
- Phase 3 already captures and persists per-question behavioral signals
- Phase 3 already derives a hidden player-model snapshot
- Phase 4 already uses that hidden model for live adaptation and has now been calibrated for fairness

This means the app can now say something psychologically personal without fabricating it from a single surface-level outcome.

The timing is also right because:
- landing density is already near its mobile limit
- gameplay UX is intentionally stable
- the next meaningful differentiation step is not more surface area, but better earned interpretation at the end of a run

## Operative Phase Sequencing
Older wording in `docs/prd.md` groups adaptive and insight work differently than the current repo state.

For current planning and implementation, the operative sequence is:
- Phase 4 = adaptive engine
- Phase 5 = insight summaries
- Phase 6 = private admin intelligence

This doc follows the operative sequence without rewriting the broader PRD.

## Phase 5 Philosophy
Insight Summaries V1 should feel like a sharp observation, not a lecture.

The system should sound like it noticed something real:
- how the player handled pressure
- where they moved cleanly
- where they hesitated
- what kind of miss ended the run

It should not sound like:
- a therapist
- a generic productivity coach
- a chatbot improvising personality
- a stats dashboard in prose

The insight should feel:
- premium
- concise
- psychologically personal
- slightly cool and clinical
- earned by evidence

## Approved User-Facing Surface Area For V1
Phase 5 V1 is result-screen only.

Approved surface:
- one compact insight summary block on the result screen
- appears after run completion or elimination
- remains secondary to the replay CTA

Not approved in v1:
- landing insight cards
- profile insight pages
- history-linked drill-in
- mid-run observation banners
- adaptive explanations during play
- multi-screen “mind report” flows

## Approved Insight Families For V1
V1 should stay narrow and support at most 1 to 2 short insight cards/lines per run.

Approved families:

### 1. Pressure read
What it may say:
- the player stayed clear late
- the player rushed under pressure
- the player cracked on the clock

Primary evidence:
- current run pressure misses
- time remaining at lock
- pressure-related question signals
- persisted pressure style from the player model

### 2. Confidence read
What it may say:
- the player was decisive
- the player second-guessed too often
- the player moved carefully but slowly

Primary evidence:
- selection change count
- first-selection timing
- response timing
- persisted confidence / hesitation styles

### 3. Weak-spot read
What it may say:
- a category looked unstable
- a category repeatedly cost time
- a category held steady even late

Primary evidence:
- current run category breakdown
- current run question signals
- player-model category snapshot

### 4. Ending-pattern read
What it may say:
- the run ended on certainty failure
- the run ended on time pressure
- the player recovered cleanly before the final break

Primary evidence:
- result context
- final question outcome type
- recent run pattern in question signals

## Minimum Evidence Sources Phase 5 May Use
Phase 5 should reuse only data that already exists or can be derived locally from current saved structures.

Approved evidence sources:
- current run summary
- run question signals
- player model snapshot
- current result context

Specifically:

### Current run summary
Use:
- `correct_count`
- `incorrect_count`
- `timeout_count`
- `average_response_time_ms`
- `average_first_selection_time_ms`
- `selection_change_rate`
- `under_5s_lock_count`
- `pressure_miss_count`
- `category_breakdown`

### Run question signals
Use:
- per-question result
- per-question timing
- selection-change behavior
- timeout/lock pressure markers
- category
- rank

### Player model snapshot
Use:
- `confidence_style`
- `hesitation_style`
- `pressure_style`
- `category_snapshot`
- key rolling rates/averages only when helpful

### Current result context
Use:
- `completed` vs `eliminated`
- `wrong-answer` vs `timeout`
- highest rank reached
- final reveal context

## Confidence And Fallback Rules

### Confidence posture
Phase 5 should be conservative.
If the evidence is thin, mixed, or contradictory, the summary should soften or suppress the claim.

### High-enough confidence rules
An insight is strong enough to show when:
- the current run clearly supports the claim
- and the persisted player model does not strongly contradict it

Examples:
- show a strong pressure insight when the run has multiple under-5s decisions or a timeout-based ending aligned with a pressure-sensitive model
- show a confidence-style insight when the run’s selection-change behavior clearly aligns with existing confidence/hesitation signals
- show a category insight only when the run plus category snapshot both point to the same category weakness or stability

### Softening rules
Use softer wording when:
- the current run suggests something but history is thin
- the signal appears once rather than repeatedly
- the run is too short to justify a strong generalized statement

Example softening posture:
- “This run got shaky under pressure.”
- not “You always panic under pressure.”

### Suppression rules
Suppress an insight when:
- evidence is too sparse
- current run and model disagree strongly
- the message would require fake precision
- the only available conclusion is generic

If suppression happens:
- show fewer insights rather than weaker filler
- prefer one good line over two generic ones

### Anti-fake-precision rules
Do not:
- expose exact percentages in user copy
- overstate category weaknesses from 1 or 2 questions
- imply diagnosis or personality certainty
- narrate hidden adaptive logic directly

## Copy Posture

### Tone
- premium
- psychologically personal
- concise
- earned
- non-chatbot
- non-preachy

### Voice rules
- short declarative observations
- no exclamation-heavy hype
- no coaching sermon
- no “As an AI” framing
- no faux empathy language

### Good examples
- “You stayed decisive until the clock narrowed.”
- “The break came from pressure, not uncertainty.”
- “Science slowed you down before it beat you.”
- “You read fast, but the late locks got expensive.”

### Bad examples
- “Here’s what I noticed about your playstyle today!”
- “You should work on time management.”
- “I think you might be someone who struggles with pressure.”
- “Your pressure performance score was 62.4%.”

## UX Constraints For V1
- result-screen only
- replay CTA remains primary
- insight block remains secondary
- no landing expansion
- no mid-run insight UI
- no admin analytics UI
- no charts
- no dashboard language

Recommended layout posture:
- replay stays the dominant button
- summary remains compact, likely one section below the main result payoff
- insight area should not push the result screen into a long scroll on mobile

## Technical Direction
Use deterministic, template-based insight derivation first.

Recommended implementation posture:
- derive an `InsightSummaryPayload` locally at result time for authenticated or guest runs
- reuse the current run’s in-memory data first
- optionally enrich with persisted player-model snapshot when available
- do not add a new service just to synthesize copy

Recommended architecture:
- a small domain module for:
  - insight eligibility
  - confidence gating
  - insight template selection
  - tone-safe copy assembly
- no LLM call required in v1
- no new pipelines
- no schema changes unless later slices prove a tiny metadata addition is genuinely needed

## Suggested Insight Assembly Model

### Step 1 — Build candidate observations
Generate a few candidate observations from evidence:
- pressure observation
- confidence observation
- category observation
- ending-pattern observation

### Step 2 — Score confidence
Each candidate gets:
- evidence strength
- contradiction penalty
- fallback level

### Step 3 — Select only the strongest small set
Recommended cap:
- one primary insight
- optional one secondary insight

### Step 4 — Render with deterministic templates
Templates should vary slightly by:
- outcome type
- confidence level
- whether the insight is reinforcing or cautionary

## Risks And Guardrails

### Risk 1 — sounding fake-smart
Guardrail:
- deterministic templates only in v1
- suppress weak claims

### Risk 2 — sounding judgmental or preachy
Guardrail:
- observation language, not advice-heavy language
- no player shaming

### Risk 3 — overfitting to one short run
Guardrail:
- combine current-run evidence with player-model context when available
- soften or suppress when the run is too short

### Risk 4 — cluttering the result screen
Guardrail:
- replay remains primary
- keep insight block compact
- no charts or extra CTA sprawl

### Risk 5 — accidentally exposing adaptive mechanics too directly
Guardrail:
- never explain question selection in v1
- focus on player behavior, not engine reasoning

## Scope Exclusions
Explicitly defer:
- full post-run AI report
- multi-card analytics stack
- result-screen redesign
- landing insights
- history-linked insight browsing
- coaching plans
- admin tuning console
- admin content analytics

## Recommended Future Slice Breakdown

### Slice 1 — Insight derivation foundation
Goal:
- add pure domain logic for deterministic insight candidate generation and confidence gating

Deliverables:
- insight types
- evidence evaluation helpers
- template selection helpers
- pure tests

Out of scope:
- result-screen UI
- persistence changes

### Slice 2 — Result-screen integration
Goal:
- render the compact insight summary block on the result screen without disturbing replay priority

Deliverables:
- small result-screen insight component
- guest/auth-safe behavior
- empty/suppressed state handling

Out of scope:
- landing expansion
- history drill-in

### Slice 3 — Calibration and copy review
Goal:
- tune thresholds, suppression rules, and wording so the surfaced insights feel earned

Deliverables:
- expanded scenario tests
- tuned copy posture
- optional tiny local debug helpers if truly needed

Out of scope:
- new surfaces
- admin tooling

## Recommended Next Implementation Order
1. Pure insight derivation foundation
2. Result-screen integration
3. Calibration and copy review

## Prompt Bundle

### Prompt 1 — Phase 5 foundation
`id="mmrm-phase5-02-insight-derivation-foundation"`

Goal:
Implement the pure deterministic insight-derivation foundation for Millionaire: Mind Reader Mode without adding any UI yet.

Read first:
- `AGENTS.md`
- `README.md`
- `docs/context.md`
- `docs/review-brief.md`
- `docs/phase-5-insight-summaries-v1.md`
- `docs/phase-3-player-model-v1.md`
- `docs/phase-4-adaptive-engine-v1.md`

Scope:
1. Add a small Phase 5 domain module for post-run insight summary derivation
2. Reuse only existing evidence sources:
   - current run summary
   - run question signals
   - player model snapshot
   - current result context
3. Implement deterministic/template-based candidate generation for the approved insight families only:
   - pressure read
   - confidence read
   - weak-spot read
   - ending-pattern read
4. Add confidence gating, softening, and suppression rules
5. Cap output to:
   - one primary insight
   - optional one secondary insight
6. Add deterministic tests for:
   - strong evidence cases
   - insufficient-data suppression
   - contradiction softening
   - timeout-ending vs wrong-answer-ending behavior

Hard constraints:
- no UI changes
- no persistence/schema changes
- no new dependencies
- no LLM/service integration
- keep the diff PR-sized

Stop point:
Stop after pure insight derivation logic and tests are complete.

### Prompt 2 — Phase 5 result integration
`id="mmrm-phase5-03-result-screen-insight-integration"`

Goal:
Integrate the compact Phase 5 insight summary into the result screen for Millionaire: Mind Reader Mode without expanding landing or adding broader insight surfaces.

Read first:
- `AGENTS.md`
- `README.md`
- `docs/context.md`
- `docs/review-brief.md`
- `docs/phase-5-insight-summaries-v1.md`

Current prerequisites:
- pure deterministic insight derivation exists
- current result screen already exists and replay remains primary

Scope:
1. Add a compact result-screen insight summary block
2. Keep replay CTA primary
3. Show at most:
   - one primary insight
   - optional one secondary insight
4. Preserve mobile-first readability and existing dramatic tone
5. Keep empty/suppressed insight handling clean and quiet
6. Add only the minimum wiring needed from current run data and saved hidden model data

Hard constraints:
- no landing expansion
- no history/profile insight UI
- no admin analytics UI
- no chatbot-like copy
- no result-screen redesign beyond the compact insight block
- no new dependencies

Stop point:
Stop after the result-screen insight summary is integrated cleanly and replay remains the dominant action.
