# Review Brief

## Slice
`mmrm-phase8-02-question-bank-quality-remediation`

## Goal
Resolve current launch-bank quality warnings so the bank is cleaner, less repetitive, and less biased before larger expansion.

## What changed
- Updated `content/question-bank-v1.json` to remove normalized duplicate prompts.
- Replaced repeated rows with unique curated prompts in the same categories.
- Rebalanced correct-answer index distribution to reduce answer-position bias.
- Re-ran quality tooling:
  - `npm run content:audit` now reports `Warnings: none`
  - `npm run content:simulate` remains stable with zero overlap in the default replay window.

## Scope guard
- No gameplay/reducer changes
- No UI changes
- No schema/persistence changes
- No new dependencies

## Verification
- `npm run content:audit` passed with no warnings
- `npm run content:simulate` passed
- `npm test` passed
- `npm run build` passed
