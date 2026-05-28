# Build Log — Millionaire: Mind Reader Mode

## 2026-04-03 — Project initialized
- locked core concept: Millionaire: Mind Reader Mode
- locked platform strategy: web first, mobile first
- locked build strategy: Codex used in small PR-sized slices
- created initial project docs:
  - AGENTS.md
  - README.md
  - PRD
  - roadmap
  - context
  - build log

## Notes
- early focus is on proving the core game loop before advanced AI
- AI personalization will be layered in after the core gameplay feels strong

## 2026-04-04 — `mmrm-design-01-wireframes-core`
- created first low-fidelity wireframe flow in Figma for core gameplay states
- Figma file: https://www.figma.com/design/rY68cZwiuMbGIglJXwUvOI?node-id=1-2
- locked first-pass screen architecture:
  - Entry/Landing (immediate start posture)
  - Hot-seat gameplay
  - Locked-answer suspense
  - Answer reveal (correct + incorrect hierarchy)
  - Run result (lose/win/walk-away destination)
- included one meaningful hot-seat alternative for ladder placement tradeoff
- confirmed scope constraints for this pass:
  - no lifelines
  - no pre-game setup screen
  - no post-game AI insights screen

## Manual smoke checks (design slice)
- Figma capture imported into target file and node URL opened
- wireframe frame names are visible in the captured layout
- flow covers all required MVP screens and state transitions

## 2026-04-05 — `mmrm-impl-01-playable-core-from-wireframes`
- bootstrapped the first playable web app with Vite, React, and TypeScript
- implemented the approved core loop:
  - entry
  - hot-seat
  - locked suspense
  - reveal
  - run result
- added a dedicated local question seed with 12 questions
- added a fictional 12-step progression ladder and deterministic game-state transitions
- implemented 20 second active-question timer and 1.5 second suspense pause
- added replay flow and lightweight result summary
- added reducer-level tests for core gameplay state transitions
- verified `npm test`, `npm run build`, and local dev server startup

## Manual smoke checks (implementation slice)
- `npm run dev` serves the app locally on `http://127.0.0.1:4173/`
- landing page loads with one dominant CTA
- start CTA enters first question immediately
- active question state supports select then explicit lock
- suspense beat exists and freezes interaction before reveal
- correct reveal can progress to the next question
- incorrect reveal can transition to run result
- result screen exposes replay clearly

## 2026-04-05 — `mmrm-impl-02-phase1b-drama-polish`
- refined landing screen hierarchy, spacing, and CTA emphasis for a stronger first impression
- improved hot-seat presentation:
  - clearer active, selected, locked, correct, and incorrect answer states
  - more intentional question framing and decision readout
  - more live-feeling ladder rail
- improved timer presentation with live, warning, critical, frozen, and expired treatments
- strengthened suspense and reveal presentation without changing core gameplay rules
- improved result screen payoff with clearer ladder progress and stronger replay emphasis
- kept scope narrow:
  - no new product systems
  - no new screens
  - no AI, auth, persistence, or lifelines
- re-verified `npm test` and `npm run build`

## Manual smoke checks (Phase 1B polish)
- landing screen presents a stronger first impression with one dominant CTA
- hot-seat still preserves the right-side ladder rail and core mobile hierarchy
- selected and locked answer states are visually distinct
- suspense beat reads more deliberately before reveal
- timer urgency increases as time gets low and freezes cleanly during suspense
- correct and incorrect reveal states remain clear without layout jumps
- result screen feels more replay-forward and ladder progress is easier to read

## 2026-04-05 — `mmrm-impl-03-phase1-final-qa-cleanup`
- ran final Phase 1 QA pass focused on highest-value cleanup only
- fixed targeted UX/readability issues without changing core gameplay rules:
  - improved right ladder rail readability on shorter mobile heights
  - reduced low-value mobile clutter by hiding the footer on small viewports
  - clarified timeout reveal presentation copy (`Correct Answer`) within existing flow
  - tightened hot-seat state labeling for timeout interruption
- applied small implementation hygiene cleanup:
  - removed duplicated timeout record construction in reducer tick path
  - made answer option React keys deterministic via question id + index
- kept scope locked:
  - no new systems
  - no new flows
  - no lifelines, walk-away, auth, AI, or persistence
- verified `npm test` and `npm run build`

## Manual smoke checks (final QA slice)
- landing still keeps one dominant immediate start CTA
- correct-answer path still advances to next question
- incorrect-answer path still transitions cleanly to result
- timeout still resolves cleanly through existing incorrect-reveal route
- timer urgency remains readable near the end of countdown
- right ladder rail remains readable on smaller mobile heights
- result still presents replay as the obvious primary action

## 2026-04-05 — `mmrm-phase2-01-identity-persistence-planning`
- closed Phase 1 as a milestone in docs
- created dedicated Phase 2 planning doc:
  - `docs/phase-2-identity-persistence.md`
- defined recommended Phase 2 technical direction:
  - Supabase Auth
  - Supabase Postgres
  - guest-first gameplay
  - email magic link as the initial auth method
- defined minimal persisted Phase 2 data:
  - runs
  - best score
  - streak
  - last played
- defined guest-to-account upgrade behavior and minimum user-facing surface area
- broke Phase 2 into PR-sized implementation slices
- added immediate Codex prompt bundle for the next two implementation tasks

## 2026-04-05 — `mmrm-phase2-02-foundation-supabase-setup`
- added the minimum Supabase foundation for the Vite + React + TypeScript app
- added explicit environment variable contract and example file
- added typed Supabase modules:
  - env
  - browser client
  - auth helpers
  - repository helpers
  - database types
- added shared persistence domain types
- added explicit SQL migration for:
  - `profiles`
  - `runs`
  - RLS policies
  - updated-at trigger
- kept current gameplay surface area unchanged
- verified `npm test` and `npm run build`

## 2026-04-05 — `mmrm-phase2-03-auth-shell-and-save-run`
- added the first user-facing Phase 2 auth surface without changing the core gameplay loop:
  - guest result-screen save CTA
  - mobile-first email magic-link sheet
  - lightweight signed-in status cues on landing and result
- added a just-finished run bridge using session storage so a guest result can survive the auth redirect
- added thin auth/session orchestration to:
  - detect session state
  - send magic links
  - save the bridged completed run after sign-in
  - auto-save completed runs for already authenticated users from the result state
- extended Supabase repository helpers to:
  - upsert profile summaries
  - save a completed run
  - update best score, streak, last played, and best run reference
- kept scope locked:
  - no landing auth gate
  - no history page
  - no profile page
  - no Phase 3 telemetry or AI features
- verified `npm test`, `npm run build`, and local dev server startup

## 2026-04-05 — Phase 2 auth verification + Supabase MCP setup
- added Supabase MCP server to local Codex configuration
- enabled remote MCP client support in `~/.codex/config.toml`
- completed `codex mcp login supabase`
- verified Supabase MCP shows as enabled with OAuth auth in the local Codex CLI
- installed optional Supabase agent skill:
  - `supabase-postgres-best-practices`
- verified current local app environment is populated for live Supabase usage:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- verified live client reachability from the current app setup:
  - Supabase auth settings endpoint responds successfully
  - publishable client can reach the `profiles` table without connection/config errors
- re-verified `npm test` and `npm run build`
- remaining unverified step is now narrow:
  - complete one human inbox magic-link round trip and confirm saved `profiles`/`runs` rows through the real app flow

## 2026-04-05 — `mmrm-phase2-04-save-path-stabilization`
- investigated the live save path using available Supabase-backed evidence before changing app code
- confirmed current project wiring is partially live:
  - Supabase auth settings endpoint responds
  - but REST access to both `profiles` and `runs` returns `PGRST205`
  - exact live error:
    - `Could not find the table 'public.profiles' in the schema cache`
    - `Could not find the table 'public.runs' in the schema cache`
- root cause identified in the app save handoff:
  - the just-finished run bridge was stored only in `sessionStorage`
  - real email magic-link flows often return in a new tab/browser context
  - signed-in session could succeed while the pending run payload was lost before post-auth persistence fired
- root cause also confirmed in the live backend:
  - the connected Supabase project's REST schema does not currently expose `profiles` and `runs`
  - this indicates the migration is not applied to the live project or PostgREST schema exposure/cache is not updated there
- stabilized the handoff by:
  - moving pending-run persistence to redirect-safe browser storage (`localStorage` plus session copy)
  - adding expiry cleanup so the bridge remains narrow and time-bounded
  - surfacing authenticated save failures cleanly with actual Supabase error details instead of generic signed-in messaging
- added a focused test covering the redirect-safe pending-run bridge
- re-verified `npm test` and `npm run build`

## 2026-04-05 — Supabase remote migration applied
- authenticated the Supabase CLI against project `jryfujyyusqnlluhqanx` (`Millionare`)
- linked the repo to the live Supabase project
- pushed remote migration:
  - `20260405_phase2_identity_persistence.sql`
- confirmed the live project's REST schema now exposes:
  - `profiles`
  - `runs`
- verified both tables return `200` with empty arrays from the connected publishable client
- unblocked the backend-side blocker that previously caused `PGRST205` during save-path verification

## 2026-05-28 — `mmrm-game-01-randomized-run-selection`
- added deterministic per-run question sampling for Supabase-backed catalogs
- each run/replay now receives a seeded sampled 12-question pool instead of replaying a fixed ordering
- introduced lightweight sampling guardrails:
  - bounded category repetition preference
  - baseline difficulty-band targeting
  - deterministic tie-breaking from run seed
- kept gameplay surface unchanged:
  - no new UI
  - no reducer rule changes
  - no auth/persistence changes
- added focused catalog tests for uniqueness, balance posture, and run-seed variation
- verified `npm test` and `npm run build`

## 2026-04-05 — Live save path verification after migration
- reused the current authenticated app session to verify live authenticated reads against the connected Supabase project
- confirmed a real `profiles` row now exists for the signed-in app user
- confirmed a real `runs` row now exists for the signed-in app user
- confirmed the saved profile aggregates match the persisted run state for the latest live save:
  - `best_score_rank = 0`
  - `current_streak = 0`
  - `last_played_at` matches the saved run completion time
- confirmed the current UI success path is only set after `saveCompletedRunForUser()` resolves without error
- remaining verification gap is narrow:
  - run one additional successful save with a non-zero `highest_rank` to exercise the aggregate update path beyond the eliminated-at-rank-zero case

## 2026-04-05 — `mmrm-impl-04-hot-seat-flow-streamline`
- streamlined the hot-seat loop after answer lock without changing the explicit select-then-lock posture
- preserved the existing suspense beat and added automatic reveal progression after a short dwell
- removed the need for manual post-lock submit/next taps in the normal hot-seat flow
- updated hot-seat state copy to better signal automatic advancement into the next question or result
- added reducer coverage for:
  - timeout reveal continuing into result
  - final correct reveal continuing into completed result
- verified `npm test` and `npm run build`

## 2026-04-06 — `mmrm-phase2-05-signed-in-landing-summary`
- added a compact signed-in landing summary backed by persisted profile data
- landing summary shows only the current Phase 2 fields:
  - best score
  - current streak
  - last played
- kept the landing guest-first and preserved one dominant `Start Run` CTA
- reused existing auth/profile state so landing summary updates when authenticated run saves update the in-memory profile
- verified `npm test` and `npm run build`

## 2026-04-06 — `mmrm-phase2-06-lightweight-run-history`
- added a compact recent-runs surface for signed-in users on landing
- recent runs read persisted `runs` rows for the current signed-in user
- recent runs are ordered most recent first and capped to a small list
- each row stays compact and shows:
  - outcome
  - best reached fictional ladder label
  - correct answers
  - played time/date
- authenticated saves now update the in-memory recent-runs list alongside the persisted profile summary
- guest landing behavior remains unchanged
- verified `npm test` and `npm run build`

## 2026-04-06 — `mmrm-phase3-01-player-model-planning`
- created a dedicated Phase 3 planning doc:
  - `docs/phase-3-player-model-v1.md`
- defined the minimum Player Model v1 scope:
  - purposeful per-question signal capture
  - compact run-level behavioral summaries
  - a small persisted hidden player-model snapshot
- defined transient vs persisted boundaries so Phase 3 can extend the current reducer/save flow without becoming a telemetry platform
- defined minimum schema direction for:
  - `run_question_signals`
  - `player_models`
  - small behavioral summary additions on `runs`
- added a PR-sized implementation slice breakdown and two ready-to-use follow-on Codex prompts

## 2026-04-06 — `mmrm-phase3-02-foundation-instrumentation`
- added a small Phase 3 domain module for hidden player-model signal types and summary builders
- instrumented the current hot-seat loop in-memory only, without changing visible gameplay UX
- transient per-question capture now records:
  - question activation
  - first selection timing
  - selection change count
  - lock timing context
  - timeout vs lock finalization
- added deterministic run-level behavioral summary derivation for:
  - counts
  - timing averages
  - selection-change rate
  - pressure misses
  - compact category breakdown
- kept Phase 3 data transient only:
  - no Supabase writes
  - no schema changes
  - no migration files
- added pure tests for:
  - first-selection timing
  - selection-change counting
  - timeout finalization
  - run summary aggregation
- verified `npm test` and `npm run build`

## 2026-04-06 — `mmrm-phase3-03-persistence-and-model-aggregation`
- added a readable Phase 3 migration for:
  - `run_question_signals`
  - `player_models`
  - behavioral summary fields on `runs`
- extended the existing authenticated save path so completed runs now carry hidden Phase 3 payloads:
  - compact run-level behavioral summary fields
  - per-question behavioral signal rows
  - hidden player-model snapshot updates
- added deterministic player-model snapshot derivation with simple threshold-based labels
- kept Phase 3 completely invisible in the UI:
  - no new screens
  - no landing/result changes
  - no adaptive engine behavior
- updated Supabase types and repository boundaries for the new hidden persistence objects
- applied the new migration to the linked live Supabase project
- verified the live REST schema now exposes:
  - `run_question_signals`
  - `player_models`
  - new behavioral fields on `runs`
- verified `npm test` and `npm run build`

## 2026-04-06 — `mmrm-phase3-04-validation-and-tuning`
- centralized Phase 3 player-model threshold constants into one explicit tuning object
- tightened style classification posture to be more conservative and reviewable:
  - `insufficient-data` remains the default for thin evidence
  - pressure style now also requires a minimum number of pressure events, not just total questions
- reviewed and tightened model snapshot aggregation assumptions so `runs_observed` uses an explicit input instead of drifting from mixed recomputation rules
- expanded deterministic test coverage for:
  - insufficient-data cases
  - boundary threshold cases
  - representative decisive / wavering / late-committer / pressure-sensitive / timeout-prone cases
  - compact category snapshot shaping
- verified `npm test` and `npm run build`

## 2026-04-06 — `mmrm-phase4-01-adaptive-engine-planning`
- created a dedicated Phase 4 planning doc:
  - `docs/phase-4-adaptive-engine-v1.md`
- defined the minimum Adaptive Engine v1 scope:
  - hidden between-question adaptation only
  - seeded-question environment only
  - no user-facing adaptive explanations
- defined allowed adaptation inputs from:
  - current player-model snapshot
  - current-run context
  - local seeded-question metadata
- defined allowed decision outputs, fairness guardrails, and low-confidence fallback behavior
- added a PR-sized implementation slice breakdown and two ready-to-use follow-on Codex prompts

## 2026-04-06 — `mmrm-phase4-02-foundation-engine-rules`
- added minimal adaptive metadata to the seeded question domain:
  - `difficultyBand`
  - `pressureTag`
- created a pure Adaptive Engine v1 domain module that:
  - accepts current player-model snapshot
  - accepts current-run context
  - scores candidate questions deterministically
  - applies explicit guardrails before selection
- centralized deterministic engine rules for:
  - low-confidence fallback
  - bounded difficulty stepping
  - pressure balancing
  - weak-spot restraint
  - freshness penalties and stable tie-breaking
- added deterministic scenario tests for:
  - low-confidence fallback
  - bounded difficulty moves after timeout
  - timeout-prone pressure guardrails
  - weak-spot targeting restraint
  - freshness-first tie-breaking
- verified `npm test` and `npm run build`
- kept the slice domain-only:
  - no gameplay integration yet
  - no UI changes
  - no persistence changes

## 2026-04-07 — `mmrm-phase4-03-gameplay-integration`
- integrated the hidden Adaptive Engine v1 into between-question progression
- preserved the first question as a fixed deterministic opener
- replaced fixed next-question progression with adaptive next-question selection for subsequent questions
- kept visible gameplay unchanged:
  - same select -> lock interaction
  - same suspense / reveal / auto-advance cadence
  - same timer behavior
  - same result behavior
- extended gameplay state with an internal question order so adaptive picks can slot into the existing reducer flow without a broad rewrite
- exposed the persisted hidden player-model snapshot through the auth layer so gameplay can use it when available
- added integration tests for:
  - low-confidence fallback
  - bounded adaptive selection
  - recent-category hammering avoidance
  - end-to-end completion through the adaptive question path
- tightened one engine guardrail so recent timeout context can still soften the next selection even after an immediate recovery answer
- verified `npm test` and `npm run build`

## 2026-04-07 — `mmrm-phase4-04-calibration-and-review`
- reviewed and tuned Adaptive Engine v1 scoring / guardrail posture to stay more fairness-first in the small seeded pool
- tightened pressure recovery behavior so a recent incorrect answer also blocks immediate `spiky` rebound candidates
- strengthened freshness weighting for repeated categories so rotation matters a little more in the current 12-question environment
- expanded deterministic scenario coverage for:
  - sparse / insufficient-data fallback safety
  - wrong-answer recovery without punishment spirals
  - fallback freshness behavior when scored candidates are exhausted
  - between-question adaptive recovery after timeout
  - category-repeat restraint and end-to-end adapted completion
- kept the slice hidden and calibration-only:
  - no UI changes
  - no persistence/schema changes
  - no gameplay surface changes
- verified `npm test` and `npm run build`

## 2026-04-07 — `mmrm-phase5-01-insight-summaries-planning`
- created a dedicated Phase 5 planning doc:
  - `docs/phase-5-insight-summaries-v1.md`
- defined the narrowest safe Phase 5 scope:
  - post-run insight summaries only
  - result-screen only
  - replay remains primary
- defined approved insight families for v1:
  - pressure read
  - confidence read
  - weak-spot read
  - ending-pattern read
- defined minimum evidence sources using only existing hidden systems:
  - current run summary
  - run question signals
  - player-model snapshot
  - current result context
- defined confidence / softening / suppression rules to avoid fake precision
- recorded the operative phase sequencing now used by the repo:
  - Phase 4 = adaptive engine
  - Phase 5 = insight summaries
  - Phase 6 = private admin intelligence
- added a PR-sized future slice breakdown and two ready-to-use follow-on Codex prompts
- kept the slice docs-only:
  - no app code changes
  - no schema changes
  - no UI changes

## 2026-04-07 — `mmrm-phase5-02-insight-derivation-foundation`
- completed the pure deterministic Phase 5 insight-derivation foundation
- confirmed the domain module reuses only approved evidence sources:
  - current run summary
  - run question signals
  - player-model snapshot
  - current result context
- confirmed deterministic candidate generation exists for the approved insight families only:
  - pressure read
  - confidence read
  - weak-spot read
  - ending-pattern read
- confirmed confidence gating, contradiction softening, and suppression behavior are covered by tests
- confirmed output remains capped to:
  - one primary insight
  - optional one secondary insight
- verified `npm test` and `npm run build`
- kept the slice hidden and foundation-only:
  - no UI changes
  - no persistence/schema changes
  - no service/LLM integration

## 2026-04-07 — `mmrm-phase5-03-result-screen-insight-integration`
- integrated the compact Phase 5 insight summary into the result screen
- kept replay clearly primary and preserved the existing result payoff hierarchy
- wired the result screen only to the existing hidden insight foundation using:
  - current run summary
  - run question signals
  - player-model snapshot when available
  - current result context
- kept empty/suppressed insight handling quiet:
  - no generic filler copy
  - no awkward blank placeholder block
- kept the slice narrow:
  - no landing expansion
  - no mid-run or history insight UI
  - no persistence/schema changes
  - no LLM/service integration
- added focused tests for:
  - insight block presence when a primary insight exists
  - optional secondary insight
  - suppressed empty state behavior
  - replay staying present as the dominant action
  - guest and signed-in result safety
- verified `npm test` and `npm run build`

## 2026-04-07 — `mmrm-phase5-04-calibration-and-copy-review`
- calibrated the surfaced Phase 5 insight posture to be slightly more conservative now that insights are visible in the result screen
- tightened thresholds and suppression behavior:
  - stronger contradiction penalty
  - slightly stricter primary/secondary score requirements
  - secondary insight now requires closer evidence strength to the primary insight
- softened standalone weak-spot copy so unsupported category observations are less eager to surface
- refined surfaced result-screen labeling:
  - `clear signal`
  - `partial signal`
- expanded scenario coverage for:
  - guest insight derivation without a player-model snapshot
  - signed-in supportive model evidence for weak-spot insight viability
  - short/thin-evidence suppression
  - contradiction softening
  - timeout-ending vs wrong-answer-ending differences
- kept the slice narrow:
  - no new surfaces
  - no schema/persistence changes
  - no LLM/service integration
- verified `npm test` and `npm run build`

## 2026-04-23 — `mmrm-phase6-01-private-admin-intelligence-planning`
- created a dedicated Phase 6 planning doc:
  - `docs/phase-6-private-admin-intelligence-v1.md`
- defined the narrowest safe Phase 6 scope:
  - private/admin-only intelligence
  - no player-facing UI changes
  - no admin UI implementation yet
- defined approved first-pass intelligence families:
  - question calibration
  - ambiguity flags
  - drop-off / timeout concentration
  - adaptation fairness review
- explicitly deferred broader or riskier admin ambitions:
  - dashboard product work
  - broad content scoring systems
  - experimentation frameworks
  - LLM/copilot admin tooling
- defined minimum evidence sources using only existing hidden systems:
  - runs
  - behavioral summary fields
  - run question signals
  - player-model snapshots
  - seeded-question metadata
- recorded the operative phase sequencing now used by the repo:
  - Phase 4 = adaptive engine
  - Phase 5 = insight summaries
  - Phase 6 = private admin intelligence
- added a PR-sized future slice breakdown and two ready-to-use follow-on Codex prompts
- kept the slice docs-only:
  - no app code changes
  - no schema changes
  - no dependency changes

## 2026-04-07 — `mmrm-phase5-02-insight-derivation-foundation`
- added a pure Phase 5 domain module for deterministic post-run insight derivation:
  - no UI integration yet
  - no persistence/schema changes
- implemented candidate generation for the approved insight families only:
  - pressure read
  - confidence read
  - weak-spot read
  - ending-pattern read
- added confidence gating, contradiction penalties, and suppression rules so weak or short-run evidence prefers silence over filler
- capped output to:
  - one primary insight
  - optional one secondary insight
- added deterministic tests for:
  - strong evidence selection
  - insufficient-data suppression
  - contradiction softening
  - timeout-ending vs wrong-answer-ending behavior
- verified `npm test` and `npm run build`

## 2026-05-03 — `mmrm-content-01-schema-and-repository-foundation`
- added the first hidden content foundation slice for moving beyond the hardcoded seed set:
  - new `questions` migration asset
  - canonical content-question mapper/validator
  - thin Supabase repository for listing active questions
- kept the current visible gameplay loop unchanged:
  - seeded questions still drive live play
  - no landing, gameplay, or result UI changes
- preserved the adaptive metadata contract in the new storage/mapping layer:
  - `category`
  - `difficulty_band`
  - `pressure_tag`
- added focused tests for:
  - valid row mapping
  - invalid option-count rejection
  - invalid answer-index rejection
  - invalid difficulty/pressure rejection
  - inactive-row exclusion
- verified `npm test` and `npm run build`
- attempted to push the new migration to the linked Supabase project, but remote apply is currently blocked on missing Supabase CLI auth:
  - `Access token not provided`
  - the migration asset is ready, but the live `questions` table has not been confirmed remotely in this slice

## 2026-05-03 — `mmrm-content-02-import-and-bootstrap`
- added the first checked-in JSON question bank:
  - `content/question-bank-v1.json`
  - 24 curated rows
  - compatible with the current adaptive metadata contract
- extended the content domain layer with import/bootstrap validation helpers:
  - non-empty key/prompt/category/source validation
  - exact 4-option enforcement
  - correct-answer-index enforcement
  - difficulty/pressure validation
  - duplicate `external_key` rejection inside a bank payload
- added a narrow developer-facing bootstrap script:
  - `scripts/bootstrap-questions.ts`
  - reads the JSON bank
  - validates rows through the shared content layer
  - upserts into `questions`
  - verifies active imported rows can be loaded through the repository path
- made the repository reusable from the Node bootstrap path by adding a client-injected question loader helper
- updated local setup docs for the new bootstrap requirement:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `npm run content:bootstrap`
- verified `npm test` and `npm run build`
- verified the bootstrap script itself runs and fails clearly when service-role access is missing:
  - `Question bootstrap failed: Missing SUPABASE_SERVICE_ROLE_KEY`

## 2026-05-27 — `mmrm-content-03-gameplay-source-wiring-with-fallback`
- wired gameplay to a hidden per-run question catalog instead of hardcoding the seeded bank directly into reducer flow
- preserved the visible experience:
  - same landing
  - same hot-seat UI
  - same timer / suspense / reveal cadence
  - same 12-rung ladder fantasy
- added a compact catalog-selection layer:
  - use Supabase-backed questions when an active bank can sustain a full 12-question run
  - otherwise fall back safely to the existing seeded source
- froze the selected question catalog per run so a late content fetch cannot change the active run mid-session
- kept the run length stable at 12 questions even when the backing content pool is larger
- updated reducer payloads so gameplay no longer depends directly on the seeded question module for:
  - first-question boot
  - correct-answer resolution
  - run length
- added focused pure tests for:
  - seed fallback baseline
  - viable Supabase catalog selection
  - too-thin remote catalog fallback
  - deterministic fallback next-question ordering
- verified `npm test` and `npm run build`
- local dev server runs successfully after the slice
- completed the live bootstrap immediately after wiring:
  - `npm run content:bootstrap`
  - 24 `launch-v1` question rows imported/upserted successfully
  - repository verification passed during bootstrap
- confirmed the active catalog now resolves to:
  - `source = supabase`
  - `questionSetVersion = launch-v1`
  - `runQuestionCount = 12`

## 2026-05-27 — live MVP smoke and showcase cleanup
- verified the launch bank is active in Supabase-backed gameplay selection:
  - 24 active `launch-v1` question rows
  - active gameplay catalog resolves to `source = supabase`
- kept the visible gameplay flow unchanged during the smoke pass:
  - no landing changes
  - no hot-seat rule changes
  - no result-surface expansion
- cleaned one stale in-app footer reference so the showcase build no longer reads like an intermediate Phase 2 checkpoint
- re-verified `npm test` and `npm run build`

## 2026-05-27 — `mmrm-content-04-live-bank-calibration`
- completed the first live-bank calibration pass on `launch-v1`
- kept the slice narrow and content-focused:
  - no gameplay rule changes
  - no UI surface expansion
  - no new data model work
- improved question quality with tighter wording on a few prompts where the launch bank felt slightly loose or ambiguous in live use
- recalibrated selected metadata so the bank better supports the hidden adaptive engine:
  - easier questions restored where recall was too straightforward to justify `medium`
  - a few over-aggressive `spiky` tags softened to `neutral`
  - enough true `hard` / `spiky` candidates preserved for late-run pressure
- added a lightweight bank-quality test so the checked-in launch bank now guarantees:
  - enough active rows for a full run
  - coverage across all difficulty bands
  - coverage across all pressure tags
- re-bootstrapped the live bank successfully:
  - `npm run content:bootstrap`
  - 24 active `launch-v1` rows remain live after recalibration
- re-verified `npm test` and `npm run build`

## 2026-05-27 — `mmrm-content-05-bank-expansion-v2`
- expanded the curated `launch-v1` bank from 24 to 48 active questions
- kept the slice content-only:
  - no gameplay rule changes
  - no UI changes
  - no schema changes
- improved replay viability with broader category coverage and more live adaptive candidate variety
- preserved the current content posture:
  - manually curated only
  - no authoring workflow
  - no generated content
- added new questions across the existing category set to avoid turning the bank into a one-topic or one-difficulty pool
- updated content verification to assert the larger checked-in bank still preserves:
  - full-run viability
  - difficulty-band coverage
  - pressure-tag coverage
- re-bootstrapped the live bank successfully:
  - `npm run content:bootstrap`
  - 48 active `launch-v1` rows now load through the repository path
- re-verified `npm test` and `npm run build`

## 2026-05-27 — `mmrm-phase6-02-admin-signal-derivation-foundation`
- completed the first private admin intelligence implementation slice as a pure backstage derivation layer
- kept the slice intentionally narrow:
  - no UI changes
  - no schema changes
  - no persistence-path changes
  - no new dependencies
- added a deterministic admin-intelligence domain module that derives:
  - question calibration reviews
  - ambiguity / instability flags
  - drop-off concentration by ending rank
  - adaptation fairness review signals
- reused only existing evidence sources:
  - persisted runs
  - per-question behavioral signals
  - current question metadata
  - optional player-model count context in the report summary
- kept outputs internal and review-oriented:
  - `review`
  - `watch`
  - `stable`
  - `low-confidence`
- added focused tests for:
  - unstable question detection
  - sparse-sample low-confidence handling
  - missing legacy metadata tolerance
  - drop-off hotspot detection
  - harsh rebound / repeated-category adaptive fairness review
  - compact report assembly
- re-verified `npm test` and `npm run build`

## 2026-05-27 — `mmrm-phase6-03-internal-report-wiring`
- completed the first internal admin report wiring slice without building any dashboard surface
- kept the slice private/internal only:
  - no player-facing UI changes
  - no schema changes
  - no new dependencies
- added a compact report formatter for the hidden Phase 6 payload
- added a developer-facing command:
  - `npm run admin:intelligence`
  - supports `--json` for raw structured output
- added the minimum repository helpers needed to assemble report evidence with a Supabase client:
  - active questions
  - runs
  - per-question behavioral signals
  - player-model snapshots
- verified the command end to end against the live project:
  - sparse current data correctly stays `low-confidence`
  - no fake precision or overconfident admin labeling
- re-verified `npm test` and `npm run build`

## 2026-05-27 — `mmrm-phase6-04-calibration-and-threshold-review`
- completed the first Phase 6 calibration pass on the hidden admin intelligence layer
- kept the slice narrow and internal:
  - no player-facing UI changes
  - no schema changes
  - no new dependencies
- tuned the admin threshold posture to be more conservative and reviewable:
  - more observations required before question reviews become confident
  - miss-only patterns now tend to land in `watch` instead of `review`
  - drop-off concentration needs stronger evidence before escalating
  - adaptation fairness now requires more transitions before making a confident call
- expanded deterministic tests for:
  - sparse vs strong question-review evidence
  - watch-level drop-off concentration
  - low-confidence adaptation fairness with thin transition counts
  - stronger high-confidence adaptation fairness scenarios
- re-verified `npm test`, `npm run build`, and `npm run admin:intelligence -- --json`

## 2026-05-27 — `mmrm-polish-01-showcase-hardening`
- completed a narrow showcase hardening pass without expanding product scope
- kept the slice fix-focused:
  - no new features
  - no new UI surfaces
  - no schema changes
- removed one stale UX behavior in the auth/save loop:
  - cleared lingering save success/error messaging when a fresh run starts or replay begins
  - prevents old result-state messaging from leaking into a new chair session
- tightened one visible consistency detail:
  - footer source copy now reflects the active gameplay catalog
  - live bank runs show `Live Question Run`
  - seeded fallback runs show `Seed Fallback Run`
- re-verified core gates and backstage tooling:
  - `npm test`
  - `npm run build`
  - `npm run admin:intelligence -- --json`

## 2026-05-27 — `mmrm-content-06-bank-expansion-v3`
- expanded the curated `launch-v1` question bank from 48 to 72 active questions
- kept the slice content-only:
  - no gameplay rule changes
  - no UI changes
  - no schema changes
- grew the bank with another 24 hand-curated rows across the existing category set
- deliberately used the new batch to strengthen replay depth and late-run tension:
  - total difficulty mix now lands at `easy = 22`, `medium = 27`, `hard = 23`
  - total pressure mix now lands at `calm = 24`, `neutral = 29`, `spiky = 19`
- preserved validation and metadata hygiene:
  - 4-option structure
  - valid answer index
  - valid difficulty/pressure tags
  - non-empty prompt/category/external key
- updated the checked-in content test expectation for the larger bank size
- re-bootstrapped the live bank successfully:
  - `npm run content:bootstrap`
  - repository now loads 72 active `launch-v1` questions
- re-verified `npm test` and `npm run build`

## 2026-05-28 — `mmrm-content-08-bank-expansion-v4`
- expanded the curated `launch-v1` bank from 72 to 156 active questions
- kept the slice content-only:
  - no gameplay rule changes
  - no UI changes
  - no schema changes
- added 84 hand-curated rows across the existing category set to materially increase replay depth
- preserved content contract and metadata validation requirements for all new rows
- updated content test expectation for the new checked-in bank size
- re-bootstrapped live content successfully:
  - `npm run content:bootstrap`
  - repository now loads 156 active `launch-v1` questions
- re-verified `npm test` and `npm run build`

## 2026-05-28 — `mmrm-game-02-recent-run-repeat-guardrail`
- added a narrow anti-repeat guardrail for adjacent replays in the live Supabase-backed flow
- the app now remembers the most recent run's sampled question ids in-memory
- next run/replay sampling softly avoids those ids when the catalog can support it
- fallback remains safe:
  - if strict avoidance would make the pool too small, the sampler falls back to the full catalog
- kept scope narrow:
  - no UI changes
  - no gameplay rule/timer changes
  - no auth/persistence/schema changes
- added focused test coverage for recent-run overlap avoidance
- re-verified `npm test` and `npm run build`

## 2026-05-28 — `mmrm-game-03-lifeline-system-foundation`
- added a first-pass lifeline system to the hot-seat loop with one-time use per run:
  - `50:50` (removes two wrong options)
  - `+10s` (adds controlled timer extension once)
  - `Second Chance` (armable shield that prevents one elimination on wrong lock or timeout)
- kept gameplay pacing intact:
  - select -> lock remains explicit
  - suspense/reveal/auto-advance flow remains intact
- wired lifeline state through reducer + hot-seat UI with deterministic behavior
- added focused reducer tests for all three lifelines, including wrong/timeout recovery
- re-verified `npm test` and `npm run build`

## 2026-05-28 — `mmrm-game-03a-lifeline-and-rotation-fixes`
- audited and fixed regressions reported during local validation of the lifeline slice
- fixed `50:50` clarity:
  - removed options now render as explicit removed states, not just subtle disables
- fixed lifeline stacking:
  - only one lifeline can now be used per question
  - lock resets on next question and on second-chance replay of the same question
- fixed repeat leakage in run sampling:
  - recent-run avoidance is now applied during difficulty-band picks, not only fill phase
  - seed fallback runs now rotate deterministically by run seed so back-to-back runs do not feel identical
- added focused regression tests for:
  - one-lifeline-per-question guardrail
  - seed run rotation by run seed
- re-verified `npm test` and `npm run build`
