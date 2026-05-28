# Review Brief

## Slice
`mmrm-game-05-replay-memory-commit-timing`

## Goal
Finalize replay-memory behavior so anti-repeat state reflects completed runs, not just started runs.

## What changed
- Moved `storeRecentRunQuestionIds(...)` calls from start/replay handlers to a result-state effect.
- Added a run-level guard key to avoid duplicate writes for the same completed run.
- Kept run-start sampling behavior unchanged while improving memory fidelity.

## Scope guard
- No visible UI changes
- No gameplay rule/timer changes
- No auth or schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
