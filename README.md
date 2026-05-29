# Millionaire: Mind Reader Mode

A mobile-first web quiz game inspired by KBC / Who Wants to Be a Millionaire.

The core idea is not just trivia progression. The game quietly models how each player thinks under pressure:
- what they know
- what they think they know
- where they hesitate
- where they panic
- where they become overconfident

The long-term product goal is to create a quiz experience that feels like a psychological duel between the player and the game.

## Current status
Phase 1 is complete. Phase 2 is complete enough to close with live auth/save, persisted landing summary, and lightweight recent runs. Hidden Phase 3 player-model instrumentation and persistence are wired behind the existing save path, hidden Phase 4 adaptive between-question selection is integrated into gameplay, and Phase 5 surfaces compact post-run insights on the result screen. Phase 6 private admin intelligence is now underway with a hidden deterministic signal-derivation foundation for question review, drop-off concentration, and adaptation fairness checks. Phase 7 player-facing mind-read v1 has begun with compact reveal reads, between-question transition cues, and a run-identity layer on result. A Supabase-backed `questions` storage foundation, curated JSON question bank, typed repository/bootstrap layer, and hidden gameplay source-selection fallback are now wired behind the current MVP flow, and the live `launch-v1` question bank is now imported, calibrated, and expanded for stronger replay.

## Planned pillars
- premium hot-seat gameplay
- millionaire-style ladder tension
- adaptive question selection
- hidden player modeling
- post-game personal insight summaries
- private creator/admin analytics

## Platform strategy
- web first
- mobile first
- native app later only after the core loop is proven

## Documentation
- `docs/prd.md` — product contract
- `docs/roadmap.md` — phased delivery plan
- `docs/context.md` — current decisions and implementation context
- `docs/build-log.md` — chronological build notes
- `docs/phase-2-identity-persistence.md` — Phase 2 identity/persistence plan
- `docs/phase-3-player-model-v1.md` — Phase 3 player model v1 plan
- `docs/phase-4-adaptive-engine-v1.md` — Phase 4 adaptive engine v1 plan
- `docs/phase-5-insight-summaries-v1.md` — Phase 5 insight summaries v1 plan
- `docs/phase-6-private-admin-intelligence-v1.md` — Phase 6 private admin intelligence v1 plan
- `docs/phase-7-player-facing-mind-read-layer-v1.md` — Phase 7 player-facing mind-read v1 plan
- `AGENTS.md` — operating rules for Codex and contributors

## Current loop
- entry screen with immediate start CTA
- hot-seat gameplay screen with right-side progression ladder
- 12-question run with Supabase-backed question sourcing when available, otherwise seeded fallback
- Supabase-backed runs now sample a deterministic per-run 12-question pool for replay variety
- adjacent replays now avoid immediate question repeats when the live pool can support it
- 20 second timer
- explicit select then `LOCK ANSWER` interaction
- mobile-first fast-play layout keeps `LOCK ANSWER` in a lock-first mobile action dock with reduced scrolling friction
- three one-time lifelines in-run: `50:50`, `+10s`, and armable `Second Chance`
- suspense pause before reveal
- reveal and progression now auto-advance after a short readable beat
- timer urgency treatment and frozen timer presentation
- timeout messaging clarified within the existing incorrect-reveal path
- clearer selected, locked, correct, and incorrect answer states
- improved ladder readability on smaller mobile heights
- correct progression and incorrect end state
- replay-forward result screen with stronger ladder payoff
- guest result-screen CTA to create an account and save the just-finished run
- email magic-link auth sheet for secure save
- signed-in landing summary for best score, streak, and last played
- signed-in recent-runs memory strip on landing
- signed-in landing/result status hints
- authenticated completed runs prepared to persist from the result state
- reveal-state mind-read micro reads and adaptive transition cues
- result-screen run identity label layered into the existing insight payoff

## Local setup
```bash
npm install
npm run dev
```

## Environment setup
Copy `.env.example` to `.env.local` and provide:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:
- The current app still runs without Supabase credentials for Phase 1 gameplay work.
- The guest-to-account save flow requires valid Supabase project values.
- The content bootstrap script requires `SUPABASE_SERVICE_ROLE_KEY`.
- The internal admin report command also requires `SUPABASE_SERVICE_ROLE_KEY`.
- The client env layer also accepts legacy `VITE_SUPABASE_ANON_KEY` as a fallback, but the preferred variable is `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Useful commands
```bash
npm test
npm run build
npm run content:bootstrap
npm run admin:intelligence
```
