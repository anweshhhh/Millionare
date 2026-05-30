# Review Brief

## Slice
`fix-restart-question-repeat-with-persistent-run-seed`

## Goal
Stop repeated opening questions after full app restart while preserving deterministic sampling and current gameplay UX.

## What changed
- Added persistent cross-session run-seed allocation in `src/game/recent-run-memory.ts`:
  - `reserveNextRunSeed()`
- Updated run catalog creation in `src/App.tsx`:
  - `handleStartRun` now uses `reserveNextRunSeed()`
  - `handleReplay` now uses `reserveNextRunSeed()`
- Extended tests in `src/game/recent-run-memory.test.ts`:
  - validates seed counter increments across simulated restart sessions

## Scope guard
- No UI changes
- No gameplay rule changes
- No schema/auth/persistence changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
