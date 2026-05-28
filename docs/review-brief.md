# Review Brief

## Slice
`mmrm-game-03a-lifeline-and-rotation-fixes`

## Goal
Fix reported lifeline behavior and replay-rotation regressions from the previous gameplay slice.

## Findings
- `50:50` was technically disabling options but not clearly presenting them as removed.
- Lifelines could be stacked on the same question because there was no per-question usage lock.
- Recent-run avoid ids were not applied in the difficulty-band pick path, allowing repeat leakage.

## What changed
- Added explicit eliminated-option rendering in hot-seat answer cards.
- Added reducer-level `lifelineUsedOnCurrentQuestion` guard:
  - blocks multiple lifelines on the same question
  - resets on next question and on second-chance reset of the same question
- Strengthened run sampling to apply avoid ids during band picks and fill picks.
- Seed fallback run order now rotates deterministically by run seed.

## Verification
- `npm test` passed
- `npm run build` passed
- Added regression tests for one-lifeline-per-question and seed run-order variation.
