# Context — Millionaire: Mind Reader Mode

## Current product direction
The product is a web-first, mobile-first quiz app inspired by KBC / Who Wants to Be a Millionaire.

The key differentiator is not trivia volume. The differentiator is adaptive psychological gameplay:
- question selection responds to user behavior
- the app builds a hidden player model
- the product later provides specific post-game insights

## Current platform strategy
- web first
- native later only after the core loop is proven

## Current scope posture
We are intentionally starting narrow:
- one strong quiz mode
- one strong fantasy
- one polished loop
- no extra modes yet

## Core experience pillars
- dramatic
- premium
- replayable
- psychologically personal

## AI posture
AI is mostly backstage:
- player modeling
- adaptation
- insight generation
- question quality / calibration
- admin analytics

## Build posture
- use Codex in small slices
- keep tasks PR-sized
- keep documentation current
- avoid scope drift
- treat each accepted Codex task like a reviewed PR

## Latest design decisions (2026-04-04)
- Completed design-first slice: `mmrm-design-01-wireframes-core`
- Mobile-first MVP flow is now explicitly defined:
  - Entry/Landing -> Hot-seat -> Locked Suspense -> Reveal -> Run Result
- Start posture is immediate:
  - no setup/onboarding screen before gameplay
  - one primary CTA from entry into first question flow
- Hot-seat layout recommendation for MVP:
  - primary mobile layout uses a compact right-side ladder rail to keep progression tension constantly visible
  - alternate layout (top ladder strip) retained as fallback if readability outweighs persistent ladder presence
- State handling direction is now locked for first pass:
  - suspense state freezes timer and visually isolates locked answer
  - reveal state preserves same layout hierarchy and only changes answer/result emphasis
- Out-of-scope remains explicit:
  - no lifelines in first pass
  - no post-game AI insights screen in first pass

## Latest implementation decisions (2026-04-05)
- Completed first playable implementation slice: `mmrm-impl-01-playable-core-from-wireframes`
- App stack is now:
  - Vite
  - React
  - TypeScript
- Core gameplay logic is handled with a pure reducer-style state module to keep the hot-seat loop deterministic and testable.
- Seed data remains local-only for this phase:
  - 12 seeded questions
  - 12 fictional progression ladder steps
- Scope remains intentionally narrow:
  - no lifelines
  - no walk-away action
  - no auth or persistence
  - no AI insights
  - no backend
- Timer behavior is now defined:
  - 20 second active-question timer
  - 1.5 second suspense pause after explicit answer lock
  - timeout ends the run as an incorrect outcome

## Latest polish decisions (2026-04-05)
- Completed Phase 1B presentation slice: `mmrm-impl-02-phase1b-drama-polish`
- Polish remained presentation-focused:
  - stronger visual hierarchy
  - clearer answer-state emphasis
  - stronger timer urgency treatment
  - more deliberate suspense and reveal feel
  - stronger result-screen payoff
- Core rules did not change:
  - explicit select then lock
  - same suspense duration
  - same seeded question flow
  - no added game systems
- The ladder rail remains the primary mobile gameplay pressure device.

## Latest QA decisions (2026-04-05)
- Completed final Phase 1 QA cleanup slice: `mmrm-impl-03-phase1-final-qa-cleanup`
- Scope remained narrow and fix-focused:
  - no new product systems
  - no new pages/flows
  - no core loop rule changes
- Highest-value fixes applied:
  - better ladder readability on short mobile heights
  - clearer timeout reveal messaging within existing incorrect path
  - reduced mobile clutter and minor reducer/implementation cleanup
- Tooling posture remains intentionally lightweight:
  - no new lint dependency added in this slice to avoid unnecessary churn
  - existing verification remains `npm test` + `npm run build`

## Latest planning decisions (2026-04-05)
- Phase 1 is now considered closed as a milestone.
- Phase 2 planning direction is now defined in:
  - `docs/phase-2-identity-persistence.md`
- Recommended Phase 2 stack:
  - Supabase Auth
  - Supabase Postgres
  - Row Level Security
  - guest-first entry with account creation after play
- Recommended initial auth posture:
  - email magic link only
  - no passwords or OAuth in first Phase 2 slices
- Recommended persistence posture:
  - persist only authenticated users
  - allow guests to play immediately
  - bridge only the just-finished guest run into signup
- Phase 3 remains explicitly out of scope during Phase 2:
  - no player modeling
  - no adaptive gameplay
  - no AI insights

## Latest foundation decisions (2026-04-05)
- Completed Phase 2 foundation slice: `mmrm-phase2-02-foundation-supabase-setup`
- Added baseline Supabase app wiring without visible auth UX.
- Environment contract is now defined for client usage:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Added explicit SQL migration assets for:
  - `profiles`
  - `runs`
  - minimal RLS policies
- Added thin client/data boundaries so future auth and persistence work does not get scattered through gameplay components.
- Current gameplay loop still does not depend on live Supabase credentials to run.

## Immediate next goal
Move to the next narrow Phase 2 persistence slice after the first auth/save-run surface:
- verify live Supabase auth redirect behavior in a real environment
- stabilize run-save/profile-update behavior against a live backend
- decide whether the next user-facing addition should be lightweight landing summary or compact run history

## Latest auth decisions (2026-04-05)
- Completed first user-facing Phase 2 slice: `mmrm-phase2-03-auth-shell-and-save-run`
- Guest-first entry remains unchanged:
  - no auth gate on landing
  - guest runs still start immediately
- Auth surface is intentionally narrow:
  - result screen now offers a secondary save CTA for guests
  - email magic link uses a minimal mobile-first sheet
- Persistence behavior is now defined for this slice:
  - only the just-finished guest run is bridged into signup
  - bridged run is held in session storage only long enough to survive the auth redirect
  - authenticated completed runs are saved from the result state
- Minimal signed-in context is now visible:
  - landing can show signed-in status and latest-save confirmation
  - result can show save state for authenticated users
- Known architecture tradeoff remains:
  - run insert and profile aggregate update are still sequential client-triggered writes, not yet a single transactional backend operation

## Latest verification decisions (2026-04-05)
- Local Supabase-backed Phase 2 setup is now substantially less blocked.
- Confirmed current environment wiring is present:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Confirmed live Supabase reachability from the current app environment:
  - auth settings endpoint returns successfully
  - publishable client can reach the `profiles` table without configuration errors
- Local Codex setup now includes authenticated Supabase MCP access.
- Remaining uncertainty is no longer infrastructure setup; it is the real user email-link round trip and final save confirmation through the app UI.

## Latest stabilization decisions (2026-04-05)
- Completed save-path stabilization slice: `mmrm-phase2-04-save-path-stabilization`
- Live project evidence initially showed the connected Supabase project was reachable but the expected app tables were not exposed through the REST schema:
  - `profiles` returned `PGRST205`
  - `runs` returned `PGRST205`
- Most likely failure point was not auth session creation itself:
  - signed-in UI could appear after magic-link return
  - but the just-finished run payload was stored only in tab-scoped `sessionStorage`
  - real email-link flows commonly return in a new tab/browser context, dropping that pending run payload
- The backend-side blocker has now been removed:
  - the remote Phase 2 migration was applied to project `jryfujyyusqnlluhqanx`
  - the live REST API now returns `200` for both `profiles` and `runs`
- The save handoff is now redirect-safe but still intentionally narrow:
  - pending run is stored in browser storage with expiry
  - saved/failed state is surfaced more clearly in landing/result messaging
- Post-migration live verification now confirms the app can read real persisted rows for the current signed-in user:
  - one `profiles` row exists
  - one `runs` row exists
  - current aggregate values match the saved eliminated run (`best_score_rank = 0`, `current_streak = 0`, `last_played_at` set)
- UI success semantics are still intentionally strict:
  - `Run secured.` is only shown after `saveCompletedRunForUser()` resolves successfully
  - persistence errors continue to surface explicit failure messaging instead of optimistic success copy
- Remaining limitations:
  - direct MCP inspection of live RLS policies and auth user rows was not available in this agent tool surface
  - run insert and profile aggregate update are still sequential client-triggered writes

## Latest gameplay flow decisions (2026-04-05)
- Completed hot-seat streamline slice: `mmrm-impl-04-hot-seat-flow-streamline`
- Explicit answer selection plus `LOCK ANSWER` remains required.
- The post-lock flow is now automatic:
  - lock answer
  - suspense beat
  - reveal beat
  - automatic transition to next question or result
- This reduces gameplay friction without changing the reducer's core state model or the existing suspense timing.
- Replay, auth, and save-run behavior remain unchanged in this slice.

## Latest landing summary decisions (2026-04-06)
- Completed signed-in landing summary slice: `mmrm-phase2-05-signed-in-landing-summary`
- Landing remains guest-first:
  - no auth gate
  - one dominant `Start Run` CTA
- Signed-in users now see a compact persisted summary on landing:
  - best score
  - current streak
  - last played
- The summary intentionally stays lightweight and uses existing profile state rather than adding new account surfaces or run history.
- Summary refresh behavior is minimal and explicit:
  - authenticated run saves already update `profile` in auth state
  - landing reads that same `profile`, so the summary reflects new saved values without a broader refresh system

## Latest run history decisions (2026-04-06)
- Completed lightweight run history slice: `mmrm-phase2-06-lightweight-run-history`
- Signed-in landing now includes a compact recent-runs surface:
  - recent-first ordering
  - capped small list
  - no filters, charts, analytics, or deep run drill-in
- The landing remains start-first:
  - guest view is unchanged
  - signed-in recent runs are visually secondary to the main `Start Run` CTA
- Refresh behavior stays intentionally small:
  - auth state hydrates recent runs on sign-in/session load
  - successful authenticated saves prepend the new run into in-memory recent runs
  - no broad revalidation system or full history page was introduced

## Latest Phase 3 planning decisions (2026-04-06)
- Phase 2 is now considered complete enough to close for current product scope:
  - guest-first auth/save flow works
  - persisted landing summary exists
  - lightweight recent runs exist
- Landing density is intentionally near its limit on mobile and should not absorb more product surface in the near term.
- Phase 3 planning direction is now defined in:
  - `docs/phase-3-player-model-v1.md`
- Phase 3 should remain hidden and infrastructure-light:
  - capture purposeful per-question behavioral signals
  - derive compact run-level behavioral summaries
  - persist a small hidden player-model snapshot
- Explicitly deferred beyond this plan:
  - adaptive question selection
  - post-run user-facing insights
  - dashboards / admin intelligence UI

## Latest Phase 3 instrumentation decisions (2026-04-06)
- Completed Phase 3 foundation slice: `mmrm-phase3-02-foundation-instrumentation`
- The current hot-seat UX remains unchanged:
  - same select -> lock flow
  - same suspense/reveal/auto-advance cadence
  - no new visible UI
- Hidden transient instrumentation now exists around the current reducer flow:
  - question activation timing
  - first selection timing
  - selection change counting
  - lock timing context
  - timeout vs lock finalization
- Run completion now derives an in-memory behavioral summary for future Phase 3 save-path integration.
- Persistence remains explicitly deferred in this slice:
  - no schema changes
  - no migration changes
  - no Supabase writes for player-model data yet

## Latest Phase 3 persistence decisions (2026-04-06)
- Completed Phase 3 persistence slice: `mmrm-phase3-03-persistence-and-model-aggregation`
- The existing authenticated completed-run save path now also persists hidden Phase 3 data:
  - run-level behavioral summary fields on `runs`
  - per-question rows in `run_question_signals`
  - hidden current snapshot in `player_models`
- The implementation remains intentionally narrow:
  - no gameplay rule changes
  - no adaptive question selection
  - no user-facing insight UI
  - no new visible surfaces
- Player-model label derivation is deterministic and threshold-based:
  - no ML
  - no opaque scoring
  - `insufficient-data` remains the default when evidence is thin
- The new schema migration has been applied to the linked live Supabase project, and the new Phase 3 tables/columns are visible via REST.
- Remaining immediate next step is verification, not architecture:
  - complete one signed-in run and confirm the live project receives updated `runs`, `run_question_signals`, and `player_models` rows through the real app flow

## Latest Phase 3 validation decisions (2026-04-06)
- Completed validation/tuning slice: `mmrm-phase3-04-validation-and-tuning`
- Phase 3 threshold rules are now centralized and easier to review/tune.
- Classification posture is intentionally conservative:
  - `insufficient-data` remains the default when observations are thin
  - pressure classification now requires both enough total questions and enough actual pressure events
- Hidden model math remains deterministic and user-invisible.
- No gameplay behavior, save-flow UX, or product surface changed in this slice.

## Latest Phase 4 planning decisions (2026-04-06)
- Phase 3 is now considered closed enough to hand off into adaptive-engine planning:
  - hidden player-model instrumentation exists
  - hidden player-model persistence exists
  - threshold logic has been tuned and validated
- Phase 4 planning direction is now defined in:
  - `docs/phase-4-adaptive-engine-v1.md`
- Adaptive Engine v1 should remain invisible to the player:
  - adaptation happens between questions only
  - no mid-question UI changes
  - no user-facing adaptive explanations
- The first adaptive pass should stay narrow:
  - seeded-question environment only
  - deterministic rule-based selection
  - bounded difficulty / pressure / freshness adjustments
- Explicitly deferred beyond this plan:
  - post-run insight UI
  - admin / analytics UI
  - platform-style recommendation infrastructure

## Latest Phase 4 foundation decisions (2026-04-06)
- Completed pure-engine foundation slice: `mmrm-phase4-02-foundation-engine-rules`
- The seeded question domain now carries the minimum adaptive metadata needed for the first hidden engine pass:
  - `difficultyBand`
  - `pressureTag`
- A pure deterministic engine module now exists to choose the next candidate question from a supplied set using:
  - current player-model snapshot
  - current-run context
  - fairness guardrails
  - stable tie-breaking
- Current guardrail posture is intentionally conservative:
  - low-confidence models fall back close to baseline difficulty
  - timeout-prone pressure patterns avoid `spiky` candidates
  - weak-spot targeting remains soft and freshness-sensitive
  - no single recent miss is allowed to trigger aggressive difficulty shifts
- This slice did not integrate adaptation into gameplay yet:
  - no reducer wiring
  - no question-order changes in the live loop
  - no UI changes
  - no persistence changes

## Latest Phase 4 integration decisions (2026-04-07)
- Completed gameplay integration slice: `mmrm-phase4-03-gameplay-integration`
- Hidden adaptation is now wired into live gameplay between questions only.
- The first question remains fixed and deterministic.
- Subsequent question selection now uses:
  - persisted hidden player-model snapshot when available
  - current-run context derived from recent answers and category exposure
  - seeded question metadata and existing fairness guardrails
- Visible product behavior remains intentionally unchanged:
  - no new UI
  - no adaptive explanations
  - no timer or reveal changes
  - no landing or result expansion
- Integration stays narrow:
  - existing phase machine remains intact
  - gameplay now tracks internal `questionOrder` so adaptive choices can slot into the reducer flow
  - safe fallback still exists when no adaptive candidate is available
- The current guardrail posture now also considers very recent timeout context, not just the last answer in isolation, before allowing sharper pressure rebounds.

## Latest Phase 4 calibration decisions (2026-04-07)
- Completed calibration/review slice: `mmrm-phase4-04-calibration-and-review`
- Adaptive Engine v1 remains intentionally conservative and fairness-first:
  - low-confidence behavior stays close to baseline
  - recent incorrect answers now also suppress immediate `spiky` rebound candidates
  - recent timeout recovery remains softened across a short lookback window
- Freshness weighting is slightly stronger now so repeated categories rotate out more meaningfully in the small seeded pool.
- Test coverage is stronger around the engine’s behavioral contracts:
  - insufficient-data fallback
  - no punishment spiral after misses/timeouts
  - fallback freshness when scored candidates are exhausted
  - bounded difficulty movement
  - category-repeat avoidance
- No user-facing surfaces changed in this slice.
- Immediate next-step posture:
  - Adaptive Engine v1 is now reviewed and tuned enough to support Phase 5 planning
  - any future changes should bias toward calibration or richer content metadata, not broader UI

## Latest Phase 5 planning decisions (2026-04-07)
- Phase 4 is now considered closed enough to hand off into insight-summary planning:
  - hidden player model exists
  - hidden adaptive engine exists
  - adaptive guardrails have been calibrated
- Phase 5 planning direction is now defined in:
  - `docs/phase-5-insight-summaries-v1.md`
- Phase 5 stays intentionally narrow:
  - result-screen only
  - replay remains primary
  - no landing expansion
  - no mid-run insight UI
- Approved insight families for v1 are limited to:
  - pressure read
  - confidence read
  - weak-spot read
  - ending-pattern read
- Technical direction remains conservative:
  - deterministic/template-based derivation first
  - reuse existing run summary, question signals, player-model snapshot, and result context
  - no new service or pipeline requirement in the first pass
- Current operative sequencing is:
  - Phase 4 = adaptive engine
  - Phase 5 = insight summaries
  - Phase 6 = private admin intelligence
- Explicitly deferred beyond this plan:
  - dashboards/charts
  - admin insight UI
  - landing insight surfaces
  - chatbot/coaching surfaces

## Latest Phase 5 foundation decisions (2026-04-07)
- Completed pure derivation slice: `mmrm-phase5-02-insight-derivation-foundation`
- A hidden deterministic insight domain module now exists for post-run summary derivation.
- It reuses only existing backstage evidence:
  - current run summary
  - run question signals
  - player-model snapshot
  - current result context
- The approved v1 insight families are now implemented at the pure-logic layer:
  - pressure read
  - confidence read
  - weak-spot read
  - ending-pattern read
- The current derivation posture is intentionally conservative:
  - confidence gating is required
  - contradictions soften claims
  - weak evidence suppresses output rather than filling space
  - output remains capped to one primary insight plus an optional secondary insight
- This slice did not surface anything in the product yet:
  - no result-screen UI changes
  - no persistence/schema changes
  - no service or LLM integration

## Latest Phase 5 integration decisions (2026-04-07)
- Completed result-screen integration slice: `mmrm-phase5-03-result-screen-insight-integration`
- The result screen now includes a compact insight summary block when the hidden derivation layer produces an earned primary insight.
- Replay remains the dominant result-screen action.
- The surfaced insight area stays intentionally narrow:
  - one primary insight
  - optional one secondary insight
  - no placeholder output when derivation suppresses insight content
- Guest and signed-in result paths both remain supported:
  - guest save CTA still works
  - signed-in save/status messaging still works
  - insight derivation degrades gracefully when no player-model snapshot is available
- No other surfaces changed:
  - no landing expansion
  - no gameplay changes
  - no history/profile insight UI

## Latest Phase 5 calibration decisions (2026-04-07)
- Completed calibration/review slice: `mmrm-phase5-04-calibration-and-copy-review`
- Surfaced insight posture is now slightly more conservative:
  - stronger contradiction penalty
  - stricter primary/secondary thresholds
  - weak evidence is more likely to suppress than fill space
- Secondary insights now require evidence closer to the primary insight before they appear.
- Standalone weak-spot observations are less eager unless model support is present.
- Result-screen copy posture remains:
  - concise
  - earned
  - cool rather than chatty
  - observation-forward rather than coaching-heavy
- The result surface itself remains compact:
  - replay still leads
  - no long-scroll insight expansion was introduced

## Latest Phase 6 planning decisions (2026-04-23)
- Phase 5 is now considered closed enough to hand off into private admin-intelligence planning:
  - hidden player model exists
  - hidden adaptive engine exists
  - compact player-facing insight summaries exist
- Phase 6 planning direction is now defined in:
  - `docs/phase-6-private-admin-intelligence-v1.md`
- Phase 6 remains intentionally private/internal:
  - no player-facing UI changes
  - no landing/result/gameplay expansion
  - no admin UI implementation yet
- Approved first-pass internal signal families are limited to:
  - question calibration
  - ambiguity flags
  - drop-off / timeout concentration
  - adaptation fairness review
- Technical direction remains conservative:
  - deterministic admin-readable derivations first
  - reuse existing persisted data first
  - avoid new services, pipelines, and schema changes unless a later implementation slice proves a tiny blocker
- Current operative sequencing is:
  - Phase 4 = adaptive engine
  - Phase 5 = insight summaries
  - Phase 6 = private admin intelligence
- Explicitly deferred beyond this plan:
  - dashboard product work
  - broad content scoring systems
  - experimentation frameworks
  - LLM/copilot admin tooling

## Latest content foundation decisions (2026-05-03)
- Completed content foundation slice: `mmrm-content-01-schema-and-repository-foundation`
- The repo now has a hidden Supabase-backed question storage foundation, but live gameplay still reads from the local seeded question source for now.
- Added a new `questions` migration asset with the minimum current content contract:
  - `id`
  - `external_key`
  - `prompt`
  - `options`
  - `correct_answer_index`
  - `category`
  - `difficulty_band`
  - `pressure_tag`
  - `is_active`
  - `question_set_version`
  - `source_label`
  - timestamps
- Added a canonical content-question mapper/validator that protects the app-facing contract before gameplay integration:
  - exactly 4 options
  - correct answer index within `0..3`
  - supported `difficulty_band`
  - supported `pressure_tag`
- Added a thin repository entry point for loading active questions from Supabase:
  - `listActiveQuestions(questionSetVersion?)`
- Current architecture posture:
  - keep the seeded source as the live gameplay path until the import/bootstrap and gameplay-wiring slices are ready
  - keep content mapping explicit and typed rather than spreading DB-row assumptions through components or reducers
- Current posture after the foundation slice:
  - the `questions` schema foundation exists and later slices can build on it without reopening the storage contract
  - gameplay should still stay on the local seeded source until a dedicated wiring slice explicitly swaps sources

## Latest content import/bootstrap decisions (2026-05-03)
- Completed content bootstrap slice: `mmrm-content-02-import-and-bootstrap`
- The repo now includes a first curated JSON question bank:
  - `content/question-bank-v1.json`
  - 24 rows
  - `launch-v1` question set
- The content layer now supports a real import path without touching gameplay yet:
  - normalize/validate import records
  - reject malformed rows clearly
  - reject duplicate `external_key` values inside a single import payload
  - upsert questions idempotently by `external_key`
- Added a developer-facing bootstrap script:
  - `npm run content:bootstrap`
  - reads the checked-in JSON bank by default
  - writes to `questions`
  - verifies imported active rows through the repository loader
- Architecture posture remains intentionally narrow:
  - gameplay still uses the local seeded source
  - no authoring UI
  - no import pipeline/platform
  - no question-generation logic
- The old remote migration blocker wording is now stale and should be considered resolved for the `questions` table foundation.
- Current operational requirement:
  - running the real bootstrap path needs `SUPABASE_SERVICE_ROLE_KEY`
  - the script now fails clearly when that key is missing instead of implying success

## Latest gameplay content-source decisions (2026-05-27)
- Completed hidden gameplay source-wiring slice: `mmrm-content-03-gameplay-source-wiring-with-fallback`
- Gameplay no longer assumes the seeded bank at the reducer boundary.
- The app now chooses a playable question catalog behind the scenes:
  - prefer Supabase-backed active questions for `launch-v1` when the live pool is large enough for a full 12-question run
  - otherwise fall back to the seeded bank with no visible UX change
- The selected catalog is frozen per run:
  - remote content loads can improve future runs
  - but they cannot mutate an already-started run
- Run-length posture remains fixed:
  - 12-question run
  - 12-rung ladder
  - larger remote banks act as a backing pool, not as a longer visible ladder
- Adaptive selection now works against the active per-run catalog instead of assuming the seeded question array.
- Live content state is now confirmed:
  - `launch-v1` has 24 active rows in `questions`
  - the catalog selector resolves to `source = supabase`
  - the player-facing run remains capped at 12 questions
- Current MVP posture:
  - visible gameplay is stable
  - real question storage is live
  - gameplay now uses the Supabase-backed bank for future runs while still retaining a safe seeded fallback path if live content ever becomes unavailable

## Latest MVP smoke decisions (2026-05-27)
- The current showcase MVP baseline is now:
  - live Supabase-backed `launch-v1` question bank active
  - 12-question player-facing run preserved
  - hidden adaptive selection still intact
  - auth/save, landing summary, recent runs, and result insights unchanged
- A narrow visible cleanup was applied after the live-bank verification:
  - removed stale in-app footer wording that still referenced the earlier Phase 2 bridge posture
- Current recommendation:
  - treat this build as the working showcase MVP baseline
  - future work should focus on calibration, content quality, or private admin intelligence rather than more landing density or broader surface expansion

## Latest live-bank calibration decisions (2026-05-27)
- Completed content calibration slice: `mmrm-content-04-live-bank-calibration`
- The first real launch bank has now been tightened for showcase use without changing the visible game loop.
- Calibration posture in this slice:
  - prefer clearer wording over trickiness
  - keep easy/medium/hard distribution credible for a 12-question adaptive run
  - keep enough `spiky` candidates for late pressure, but avoid over-tagging simple recall as high-pressure
- Current `launch-v1` bank shape after calibration:
  - 24 active rows
  - difficulty mix: `easy = 8`, `medium = 10`, `hard = 6`
  - pressure mix: `calm = 7`, `neutral = 12`, `spiky = 5`
- Live verification confirms the recalibrated content is what the app will actually use:
  - bootstrap succeeded after edits
  - representative updated rows are visible in Supabase with their new prompt/tag values
- Current MVP recommendation:
  - treat the content bank as good enough for showcase use
  - next work should either expand the bank or begin Phase 6 private admin intelligence, rather than continue micro-editing the same 24 rows indefinitely

## Latest bank expansion decisions (2026-05-27)
- Completed bank expansion slice: `mmrm-content-05-bank-expansion-v2`
- The live `launch-v1` bank now contains 48 active questions.
- Expansion posture stayed intentionally narrow:
  - keep the same `questions` table
  - keep the same adaptive metadata contract
  - keep gameplay on the existing 12-question visible run format
- The main gain from this slice is replay depth:
  - more candidate variety for hidden adaptation
  - less repetition pressure in repeated showcase sessions
  - better category coverage while preserving the same player-facing UX
- Current bank shape after expansion:
  - `easy = 18`
  - `medium = 19`
  - `hard = 11`
  - `calm = 17`
  - `neutral = 20`
  - `spiky = 11`
- Live verification confirms the expanded bank is active in Supabase:
  - `ACTIVE_LAUNCH_V1_COUNT = 48`
- Recommended next step:
  - begin Phase 6 private admin intelligence implementation
  - or run a focused live gameplay/content-quality sweep against the larger pool if we want one more showcase-facing refinement before that

## Latest Phase 6 implementation decisions (2026-05-27)
- Completed Phase 6 foundation slice: `mmrm-phase6-02-admin-signal-derivation-foundation`
- Phase 6 is now moving from planning into implementation, but it remains fully backstage:
  - no player-facing UI changes
  - no landing/result/gameplay expansion
  - no admin dashboard surface yet
- The first implementation pass is intentionally pure and deterministic:
  - derive question-level calibration and ambiguity reviews from persisted behavioral evidence
  - derive drop-off concentration by ending rank from saved runs
  - derive adaptation fairness review signals from between-question transitions and current metadata
- Internal output posture is conservative and admin-readable:
  - `review`
  - `watch`
  - `stable`
  - `low-confidence`
- Historical compatibility is now an explicit consideration:
  - older saved signals may not have matching live question metadata
  - the admin layer tolerates that and still emits low-confidence/internal reviews instead of failing
- Current recommended next step:
  - wire a narrow internal report/output path for these hidden signals
  - keep the player-facing product frozen while Phase 6 depth grows backstage

## Latest Phase 6 report-wiring decisions (2026-05-27)
- Completed Phase 6 report slice: `mmrm-phase6-03-internal-report-wiring`
- Phase 6 now has a usable internal output path without introducing an admin dashboard.
- A new developer-facing command assembles the private intelligence payload from live Supabase evidence:
  - `npm run admin:intelligence`
  - `npm run admin:intelligence -- --json` for raw structured output
- Repository/data-layer posture remains narrow:
  - enough client-injected fetch helpers to assemble backstage evidence
  - no player-facing repo changes
  - no schema expansion
- Current verification shows the internal report behaves honestly on sparse live data:
  - current project evidence is still thin
  - outputs remain `low-confidence` instead of implying strong conclusions
- Current recommended next step:
  - calibrate the Phase 6 thresholds and internal wording now that the report path is real
  - keep the player-facing MVP frozen while backstage intelligence gets more trustworthy

## Latest Phase 6 calibration decisions (2026-05-27)
- Completed Phase 6 calibration slice: `mmrm-phase6-04-calibration-and-threshold-review`
- The private admin layer is now more conservative and less noisy.
- Current calibration posture:
  - sparse samples should stay `low-confidence`
  - miss-heavy but otherwise thin question evidence should usually land in `watch`, not `review`
  - drop-off hotspots need stronger concentration before escalation
  - adaptation fairness now requires a larger transition sample before confident judgments
- The internal report command has now been exercised against live project data after calibration:
  - current project evidence remains sparse
  - the report still resolves to `low-confidence` instead of overclaiming
- Current recommended next step:
  - stop expanding Phase 6 scope for now and move to final showcase hardening or focused content quality review

## Latest showcase hardening decisions (2026-05-27)
- Completed hardening slice: `mmrm-polish-01-showcase-hardening`
- The current showcase baseline remains feature-stable, but a few high-value consistency issues have now been cleaned up.
- Hardening changes in this slice:
  - starting a fresh run now clears stale save success/error feedback from the previous result
  - footer source copy now reflects whether gameplay is currently using the live Supabase bank or the seeded fallback
- Product posture remains unchanged:
  - no landing expansion
  - no gameplay rule changes
  - no new admin/player surfaces
- Current recommendation:
  - treat this build as the hardened showcase MVP baseline
  - future work should be either broader content depth or truly new product scope, not more micro-polish on the same surface

## Latest bank expansion v3 decisions (2026-05-27)
- Completed bank expansion slice: `mmrm-content-06-bank-expansion-v3`
- The live `launch-v1` bank now contains 72 active questions.
- Expansion posture remained intentionally narrow:
  - same `questions` table
  - same adaptive metadata contract
  - same 12-question visible run format
- This slice was used to improve full-scope replay depth, not just count:
  - broader candidate variety for hidden adaptation
  - more credible late-run hard/spiky coverage
  - stronger category depth without reopening gameplay scope
- Current bank shape after v3 expansion:
  - `easy = 22`
  - `medium = 27`
  - `hard = 23`
  - `calm = 24`
  - `neutral = 29`
  - `spiky = 19`
- Live verification confirms the expanded bank is active in Supabase:
  - bootstrap succeeded
  - repository now loads 72 active `launch-v1` questions
- Current recommendation:
  - the next meaningful full-scope lift should come from content calibration on the deeper pool or broader product scope, not more raw count alone

## Latest bank expansion v4 decisions (2026-05-28)
- Completed bank expansion slice: `mmrm-content-08-bank-expansion-v4`
- The live `launch-v1` bank now contains 156 active questions.
- Expansion posture remained intentionally narrow:
  - same `questions` table
  - same adaptive metadata contract
  - same 12-question visible run format
- This slice focused on replay depth and adaptive breathing room:
  - deeper category coverage within the existing taxonomy
  - stronger medium/hard pool for later-run tension
  - enough total volume to reduce early repetition in repeated sessions
- Current bank shape after v4 expansion:
  - `easy = 46`
  - `medium = 51`
  - `hard = 59`
  - `calm = 48`
  - `neutral = 65`
  - `spiky = 43`
- Live verification confirms the expanded bank is active in Supabase:
  - bootstrap succeeded
  - repository now loads 156 active `launch-v1` questions
- Recommended next step:
  - run a deeper calibration pass on the larger pool before additional raw expansion

## Latest randomized run-selection decisions (2026-05-28)
- Completed gameplay content-rotation slice: `mmrm-game-01-randomized-run-selection`
- Visible UX remains intentionally unchanged:
  - same landing/start posture
  - same hot-seat interaction model
  - same suspense/reveal/result pacing
- Supabase-backed play now rotates question pools per run:
  - each run derives a deterministic 12-question sample from the larger active bank
  - replay increments seed context to produce a new pool while remaining deterministic
- Sampling guardrails are intentionally lightweight for this pass:
  - baseline difficulty targeting (`easy`/`medium`/`hard`)
  - category repeat restraint where possible
  - safe fill behavior when strict guardrails would under-fill
- Seed fallback behavior is unchanged:
  - if live content is unavailable/thin, the app still uses the local seeded catalog
- Current recommendation:
  - next slice should add stronger anti-repeat memory across adjacent runs, then lifeline systems

## Latest recent-repeat guardrail decisions (2026-05-28)
- Completed replay-depth stabilization slice: `mmrm-game-02-recent-run-repeat-guardrail`
- The run sampler now uses a small adjacent-run memory:
  - after start/replay, the current sampled run ids are retained in-memory
  - the next sampled run attempts to avoid those ids when the live catalog has enough depth
- Safety posture remains explicit:
  - avoidance is preferred, not mandatory
  - when avoidance would underfill the 12-question run, the sampler falls back to full-catalog sampling
- Visible UX remains unchanged:
  - no new player-facing controls or messaging
  - same select/lock/suspense/reveal/result loop
- Current recommendation:
  - add lifelines next as a narrow gameplay-system slice without touching auth/admin surfaces
