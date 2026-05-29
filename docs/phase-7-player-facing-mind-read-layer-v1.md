# Phase 7 — Player-Facing Mind Read Layer V1

## Objective
Surface the product's hidden intelligence during and after play so the game feels psychologically adaptive, not generic.

Phase 7 should make the "mind reader" differentiation visible without adding dashboard-heavy UI, chatbot behavior, or gameplay friction.

## Why This Phase Now
- The app already has hidden adaptive and modeling systems (Phases 3-5).
- Players can still perceive the experience as "just another quiz" if those systems are not surfaced in compact, earned moments.
- Mobile UX is already near density limits, so this phase must stay narrow and high-signal.

## Approved V1 Surfaces
1. Reveal-state micro read:
- one short line during reveal
- shows only when evidence is meaningful

2. Between-question transition read:
- one short transition line before auto-advance on correct answers
- no algorithm explanation

3. Result-screen mind read payoff:
- run identity label
- one primary insight
- optional one secondary insight

## Explicitly Out Of Scope
- no new pages
- no landing expansion
- no charts/analytics dashboard surfaces
- no mid-run coaching overlays
- no AI chat/coplay assistant posture
- no adaptive-rule explanations in user-facing copy

## Copy Posture
- concise
- premium
- psychologically sharp
- non-preachy
- non-technical

Guidelines:
- prefer statements over instructions
- avoid percentages and numeric scoring language
- suppress weak signals instead of filling space

## Derivation Inputs
- current run summary
- current/last question behavioral signal
- result context (completed/eliminated, timeout/wrong)
- player model snapshot (when available)

## Confidence And Suppression Rules
- show nothing if evidence is thin or contradictory
- prefer one strong line over multiple weak lines
- default to conservative "partial signal" framing when uncertain

## Implementation Slices
1. Pure domain derivation module for:
- reveal micro reads
- transition reads
- run identity

2. Gameplay integration:
- reveal-state display
- transition line display

3. Result payoff integration:
- run identity in insight block
- keep replay CTA dominant

4. Calibration and tests:
- deterministic coverage for strong/weak/contradictory evidence

## Verification Targets
- gameplay rules unchanged
- no extra taps introduced
- replay remains dominant on result
- mobile layout remains compact
- `npm test` passes
- `npm run build` passes
