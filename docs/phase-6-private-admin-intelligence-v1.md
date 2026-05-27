# Phase 6 — Private Admin Intelligence V1 Plan

## Objective
Define the narrowest safe first pass for private admin intelligence.

Phase 6 should prove backend/system depth for portfolio credibility without creating a broad admin product or changing the player-facing experience.

Phase 6 should deliver:
- hidden/internal evaluative intelligence only
- deterministic, admin-readable signals
- a small set of trustworthy content and system health reads

Phase 6 should not deliver:
- player-facing UI changes
- admin dashboard implementation
- a general BI platform
- chatbot/copilot tooling
- broad experimentation infrastructure

## Why Phase 6 Happens Now
Phase 6 only becomes meaningful after Phases 3–5 are in place:
- Phase 3 created durable behavioral evidence
- Phase 4 created live adaptive behavior
- Phase 5 surfaced user-facing insight summaries

Now there is enough hidden evidence to evaluate:
- whether questions are behaving cleanly
- whether some questions look ambiguous or unfair
- where runs are collapsing
- whether adaptation is staying inside fairness guardrails
- which seeded content looks stable vs suspicious

This phase happens now because the product already has backstage intelligence that can be reviewed internally, even though the player-facing surfaces should remain stable.

## Operative Phase Sequencing
Older `docs/prd.md` wording groups adaptive, insight, and admin work differently than the current repo state.

For current planning and implementation, the operative sequence is:
- Phase 4 = adaptive engine
- Phase 5 = insight summaries
- Phase 6 = private admin intelligence

This doc follows the operative sequence without broad PRD churn.

## Phase 6 Philosophy
Private Admin Intelligence V1 should act like an internal review layer, not an analytics empire.

It should answer a narrow set of internal questions:
- Which seeded questions may be unstable, ambiguous, or unfair?
- Where are runs breaking most often?
- Is adaptation staying conservative and fair?
- Which content items need closer human review?

It should not try to:
- optimize everything
- score all content with false precision
- become a full admin console
- promise more confidence than the small seeded environment can support

The signals should be:
- deterministic
- interpretable
- confidence-banded
- compact
- honest about low data volume

## Approved Admin-Only Outcomes For V1
Phase 6 V1 remains private/internal only.

Approved outcomes:
- internal derivation of content/system review signals
- compact internal review payloads or reports
- question-level review flags
- run-level concentration flags
- adaptation fairness review flags

Not approved in v1:
- player-facing analytics
- public creator tooling
- admin UI implementation
- broad filters, dashboards, or chart suites
- live moderation or content workflow tooling

## Approved Intelligence Families
Use the roadmap categories as the envelope, but include only the safest subset in the first pass.

### 1. Question calibration
Questions to answer:
- Does this question produce an unusual concentration of misses or timeouts?
- Does it look materially harder or noisier than nearby seeded neighbors?

Potential outputs:
- elevated miss rate flag
- elevated timeout rate flag
- response-time anomaly note

### 2. Ambiguity detection
Questions to answer:
- Does this question attract unusually high selection churn?
- Do players hesitate disproportionately before locking?
- Does it show instability not explained by intended difficulty/pressure?

Potential outputs:
- high selection-change flag
- late-lock instability flag
- possible ambiguity review note

### 3. Drop-off analytics
Questions to answer:
- Where do runs most often end?
- Are timeouts concentrated around specific ranks or categories?
- Which questions disproportionately end otherwise stable runs?

Potential outputs:
- drop-off concentration by rank
- timeout concentration by rank/category
- run-ending hotspot flags

### 4. Adaptation analytics
Questions to answer:
- Is the engine falling back too often?
- Are fairness guardrails being hit repeatedly?
- Are certain question types over-selected after adaptation?

Potential outputs:
- fallback-heavy signal
- fairness review signal
- rotation imbalance note

### 5. Content quality signals
Questions to answer:
- Which seeded questions deserve manual review first?
- Which questions appear stable and trustworthy?

Potential outputs:
- review priority tier
- stable-content note
- low-confidence/no-call status

## First Safe Pass: Include vs Defer

### Include in V1
These are the safest and most defensible first-pass admin signals:

#### Question calibration signals
Include because:
- they reuse already-persisted outcomes and timing
- they are easy to explain
- they directly support content review

#### Ambiguity flags
Include because:
- selection-change and hesitation data already exist
- they fit the current portfolio story well
- they can stay fully internal

#### Drop-off / timeout concentration patterns
Include because:
- they are useful even in a small seed set
- they can remain descriptive rather than over-optimized

#### Adaptation fairness / fallback review signals
Include because:
- Phase 4 is now live and should be reviewable
- fairness is a core product promise

### Defer beyond V1
These should be explicitly deferred:

#### Broad content scoring systems
Defer because:
- the current seeded environment is too small to justify strong numeric scoring
- these can invite fake precision quickly

#### Rich internal consoles
Defer because:
- they expand product scope too early
- V1 should prove the intelligence layer first, not the interface

#### General experimentation frameworks
Defer because:
- they imply platform ambition beyond the current repo posture

#### LLM/copilot admin assistance
Defer because:
- deterministic signals are enough for the first pass
- chat/copilot adds surface area and ambiguity the plan does not need

## Minimum Evidence Sources Phase 6 May Use
Phase 6 should reuse only already-available hidden systems and safe derivations from them.

Approved evidence sources:
- `runs`
- run behavioral summary fields
- `run_question_signals`
- `player_models`
- current seeded-question metadata
- adaptation outcomes/reasons only if already present or safely derivable

### `runs`
Use:
- outcome
- highest rank
- failure reason
- completed time
- behavioral summary fields already persisted

### Run behavioral summary fields
Use:
- average response time
- average first-selection time
- selection-change rate
- pressure miss count
- timeout count
- category summary

### `run_question_signals`
Use:
- per-question result
- response time
- first selection timing
- selection-change count
- lock/timeout markers
- category
- rank

### `player_models`
Use cautiously:
- pressure style
- confidence style
- hesitation style
- category snapshot

Use only when they strengthen or contextualize an internal signal, not as standalone truth.

### Seeded-question metadata
Use:
- category
- difficulty band
- pressure tag

These provide baseline context for internal question review.

### Adaptation outcomes / reasons
Phase 6 may use:
- selected next question ids
- fallback vs non-fallback outcomes if already derivable
- candidate/fairness review signals only if they can be computed safely from existing game state and metadata

Do not require new logging/schema in v1 unless a later implementation slice proves one tiny field is necessary.

## Confidence And Guardrail Rules

### Confidence posture
Admin signals should still be conservative.
The audience is internal, but the seeded environment is small, so the system should explicitly prefer:
- low-confidence flags
- review-needed language
- relative comparisons

over strong judgments.

### Strong-enough signal rules
A private admin signal is strong enough when:
- the pattern repeats across multiple runs or observations
- it is not explained away by intended metadata alone
- nearby comparisons in the same seed set make it look genuinely unusual

Examples:
- a question repeatedly producing timeout-heavy endings compared with adjacent difficulty peers
- a question repeatedly producing high selection-change counts plus slow first selection
- repeated adaptive fallback concentration in a narrow content band

### Low-confidence rules
Mark a signal low-confidence when:
- sample size is too small
- the seeded pool is too narrow for strong comparison
- only one run or one outlier is driving the signal
- the metric conflicts with intended difficulty/pressure in ambiguous ways

### Anti-fake-precision rules
Do not:
- present exact-looking content scores without clear meaning
- imply causal certainty from a tiny sample
- rank all questions from best to worst in v1
- overstate adaptation fairness conclusions from sparse runs

Preferred phrasing for internal outputs:
- `review`
- `watch`
- `stable`
- `low confidence`

## Phase 6 Posture
- private/admin-only
- no player-facing UI changes
- no landing/result/gameplay expansion
- no chatbot/admin copilot
- no heavy dashboard-platform ambition

This phase should remain backstage and review-oriented.

## Technical Direction
Use deterministic, admin-readable derivations first.

Recommended posture:
- reuse existing persisted data first
- derive small internal review payloads with pure or thin data-layer helpers
- prefer local computation over new services
- prefer compact output objects over infrastructure

### Recommended implementation style
- one small domain module for admin signal derivation
- thin repository helpers only if needed to fetch grouped evidence
- optional export/report-friendly structured outputs

### Avoid in V1
- new pipelines
- streaming/event systems
- task queues
- external analytics tools
- schema changes unless absolutely necessary

## Proposed First-Pass Internal Signals

### Question calibration signal
Shape:
- `question_id`
- `signal_type`
- `severity`
- `confidence`
- `summary`
- `evidence`

Example:
- `q-08`
- `timeout-concentration`
- `watch`
- `medium`
- `Timeouts are elevated versus nearby medium questions.`

### Ambiguity signal
Shape:
- `question_id`
- `signal_type`
- `severity`
- `confidence`
- `summary`
- `evidence`

Example:
- `q-09`
- `selection-instability`
- `review`
- `medium`
- `Selection churn is unusually high for its current metadata profile.`

### Drop-off signal
Shape:
- `rank` or `question_id`
- `signal_type`
- `severity`
- `confidence`
- `summary`

Example:
- `rank 8`
- `run-ending-hotspot`
- `watch`
- `medium`
- `Runs are ending here more often than neighboring rungs suggest.`

### Adaptation fairness signal
Shape:
- `signal_type`
- `severity`
- `confidence`
- `summary`

Example:
- `fallback-heavy`
- `watch`
- `low`
- `Adaptive fallback appears concentrated in a narrow band; review candidate diversity.`

## Risks And Guardrails

### Risk 1 — overclaiming from a tiny seed set
Guardrail:
- confidence-band everything
- prefer review notes over scores

### Risk 2 — building a dashboard product by accident
Guardrail:
- plan internal derivation first
- defer UI implementation

### Risk 3 — mistaking intended difficulty for bad content
Guardrail:
- always read question performance relative to metadata peers when possible

### Risk 4 — hiding fairness issues behind vague wording
Guardrail:
- include explicit adaptation-review signals where evidence supports them

### Risk 5 — schema creep
Guardrail:
- do not add fields/tables unless a future implementation slice proves a single missing field blocks the first pass

## Recommended Future Implementation Slice Breakdown

### Slice 1 — Admin signal derivation foundation
Goal:
- add pure deterministic derivation for private admin signals using existing persisted evidence

Deliverables:
- question calibration helpers
- ambiguity flag helpers
- drop-off concentration helpers
- adaptation fairness review helpers
- deterministic tests

Out of scope:
- admin UI
- schema changes

### Slice 2 — Internal report/output wiring
Goal:
- produce compact structured review outputs for internal use only

Deliverables:
- small repository fetch helpers if needed
- grouped admin intelligence payload
- low-confidence/no-call handling

Out of scope:
- dashboards
- filters
- charts

### Slice 3 — Calibration and threshold review
Goal:
- tune thresholds and confidence posture against the seeded environment

Deliverables:
- expanded scenario tests
- adjusted severity/confidence constants
- review notes for future schema needs, if any

Out of scope:
- new product surfaces

## Recommended Next Implementation Order
1. Pure admin signal derivation foundation
2. Internal report/output wiring
3. Calibration and threshold review

## Prompt Bundle

### Prompt 1 — Phase 6 foundation
`id="mmrm-phase6-02-admin-signal-derivation-foundation"`

Goal:
Implement the pure deterministic Phase 6 admin-signal derivation foundation for Millionaire: Mind Reader Mode without adding any UI.

Read first:
- `AGENTS.md`
- `README.md`
- `docs/context.md`
- `docs/review-brief.md`
- `docs/phase-6-private-admin-intelligence-v1.md`
- `docs/phase-3-player-model-v1.md`
- `docs/phase-4-adaptive-engine-v1.md`
- `docs/phase-5-insight-summaries-v1.md`

Scope:
1. Add a small Phase 6 domain module for private admin signal derivation
2. Reuse only existing evidence sources:
   - runs
   - run behavioral summary fields
   - run question signals
   - player model snapshots
   - seeded-question metadata
3. Implement deterministic/admin-readable signals for the first safe pass only:
   - question calibration
   - ambiguity flags
   - drop-off concentration
   - adaptation fairness review
4. Add confidence levels and low-confidence/no-call behavior
5. Add deterministic tests for:
   - stable question behavior
   - suspicious timeout concentration
   - ambiguity-like selection churn
   - adaptation fallback review signals

Hard constraints:
- no UI changes
- no schema changes
- no new dependencies
- no LLM/copilot logic
- keep the diff PR-sized

Stop point:
Stop after pure derivation logic and tests are complete.

### Prompt 2 — Phase 6 internal report wiring
`id="mmrm-phase6-03-internal-report-wiring"`

Goal:
Wire the first compact private admin intelligence output for Millionaire: Mind Reader Mode without building an admin dashboard.

Read first:
- `AGENTS.md`
- `README.md`
- `docs/context.md`
- `docs/review-brief.md`
- `docs/phase-6-private-admin-intelligence-v1.md`

Current prerequisites:
- pure admin signal derivation exists
- existing persisted evidence is available in Supabase

Scope:
1. Add the minimum repository/output wiring needed to assemble an internal admin intelligence payload
2. Keep the output structured and compact
3. Include only the approved first-pass signal families:
   - question calibration
   - ambiguity flags
   - drop-off concentration
   - adaptation fairness review
4. Keep confidence labeling explicit
5. Avoid any admin UI implementation

Hard constraints:
- no dashboard pages
- no charts
- no schema changes unless a tiny proven blocker exists
- no new dependencies
- no player-facing changes

Stop point:
Stop after the internal intelligence payload can be assembled cleanly for future private/admin use.
