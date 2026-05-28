# Review Brief

## Slice
`mmrm-game-01-randomized-run-selection`

## Goal
Reduce replay repetition by rotating the 12-question run pool each run while keeping the visible gameplay UX unchanged.

## What changed
- Added deterministic per-run sampling for Supabase-backed question catalogs.
- Start and replay now use a run-seeded sampled catalog instead of a fixed full-bank order.
- Added lightweight sampling guardrails:
  - category repeat restraint where possible
  - baseline difficulty-band targeting
  - deterministic shuffle/tie-break behavior
- Preserved current fallback behavior:
  - seed catalog still used when live content is unavailable/thin

## Scope guard
- No gameplay rule changes
- No landing/result/gameplay UI changes
- No auth/persistence changes
- No schema or dependency changes

## Verification
- `npm test` passed
- `npm run build` passed
- New tests cover:
  - unique sampled run pool
  - balanced baseline sampling posture with suitable input
  - run-seed variation across replay
