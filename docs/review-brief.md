# Review Brief

## Slice
`mmrm-phase8-04-launch-v2-bank-expansion`

## Goal
Expand the question bank in a deterministic, quality-gated way to materially reduce replay repetition.

## What changed
- Added expanded bank artifact: `content/question-bank-v2.json`.
- Added deterministic generation helper: `scripts/generate-question-bank-v2.ts`.
- Added npm command: `npm run content:generate:v2`.
- Added launch-v2 coverage test in `src/domain/content.test.ts`.
- Updated docs and command references.

## Scope guard
- No gameplay/reducer rule changes
- No UI changes
- No schema/persistence changes
- No new dependencies

## Verification
- `npm run content:audit -- content/question-bank-v2.json` passed with no warnings
- `npm run content:simulate -- content/question-bank-v2.json 60 6` passed
- `npm test` passed
- `npm run build` passed
