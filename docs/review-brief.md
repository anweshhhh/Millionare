# Review Brief

## Slice
`mmrm-game-02-recent-run-repeat-guardrail`

## Goal
Reduce immediate replay repetition by adding a narrow recent-run anti-repeat guardrail on top of run sampling.

## What changed
- Added recent-run question-id memory in app runtime (in-memory only).
- `Start Run` / `Replay` now pass recently used question ids into catalog creation.
- Updated run catalog creation to prefer avoiding recently used ids when enough live questions exist.
- Added safe fallback behavior to full-catalog sampling when strict avoidance would underfill a run.
- Added focused tests for zero-overlap behavior when the pool can support it.

## Scope guard
- No visible UI changes
- No gameplay timer/rule changes
- No auth/persistence/schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
- New test verifies adjacent run overlap avoidance in sufficiently large pools
