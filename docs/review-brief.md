# Review Brief

## Slice
`mmrm-phase8-01-question-bank-quality-foundation`

## Goal
Start Phase 8 with a narrow content quality and replay-variety tooling foundation so larger bank expansion can be measured and gated deterministically.

## What changed
- Added `scripts/audit-question-bank.ts`.
- Added `scripts/simulate-question-replay.ts`.
- Added npm script wiring:
  - `npm run content:audit`
  - `npm run content:simulate`
- Updated docs context/build-log for Phase 8 kickoff.

## Scope guard
- No gameplay behavior changes
- No UI changes
- No schema/persistence changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
