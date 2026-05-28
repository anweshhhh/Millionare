# Review Brief

## Slice
`mmrm-game-03-lifeline-system-foundation`

## Goal
Add a compact first-pass lifeline system that reduces harsh run termination while preserving existing hot-seat pacing.

## What changed
- Added reducer-level lifeline state with one-time usage per run.
- Implemented three lifelines:
  - `50:50`: removes two wrong options for the active question.
  - `+10s`: adds a one-time time extension during active play.
  - `Second Chance`: armable shield that absorbs one wrong-answer or timeout elimination and reopens the same question.
- Wired lifeline controls into the existing hot-seat screen without adding new pages.
- Preserved core gameplay loop behavior (`select -> lock`, suspense, reveal, auto-advance).
- Added deterministic reducer tests for all lifeline behaviors.

## Scope guard
- No new screens
- No landing/result expansion
- No auth/persistence/schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
- New tests cover:
  - 50:50 elimination behavior and blocked selection
  - +10s consumption and timer update
  - second-chance recovery for wrong-answer and timeout paths
