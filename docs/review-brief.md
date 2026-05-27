# Review Brief

## Slice
`mmrm-phase6-02-admin-signal-derivation-foundation`

## Goal
Implement the first private admin intelligence foundation as a pure deterministic backstage layer, without changing any player-facing surface.

## What changed
- Added a new pure domain module for private admin intelligence:
  - question calibration reviews
  - ambiguity / instability flags
  - drop-off concentration by ending rank
  - adaptation fairness review signals
- Kept the output intentionally internal and confidence-banded:
  - `review`
  - `watch`
  - `stable`
  - `low-confidence`
- Reused only existing evidence sources:
  - persisted runs
  - run question signals
  - current question metadata
  - optional player-model count context in the report summary
- Added focused deterministic tests for:
  - unstable-question detection
  - sparse-sample low-confidence behavior
  - missing legacy metadata tolerance
  - drop-off hotspot detection
  - harsh adaptive rebound detection
  - compact report assembly

## Scope guard
- No UI changes
- No schema changes
- No persistence-path changes
- No new dependencies
- No admin dashboard or report surface yet

## Verification
- `npm test` passed
- `npm run build` passed
