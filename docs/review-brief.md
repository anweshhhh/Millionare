# Review Brief

## Slice
`mmrm-content-04-live-bank-calibration`

## Goal
Tighten the live `launch-v1` question bank so the showcase MVP feels fairer, cleaner, and better matched to the current adaptive metadata without changing visible gameplay.

## What changed
- Refined several launch-bank prompts for clarity and cleaner recall framing.
- Rebalanced selected `difficulty_band` and `pressure_tag` values where the first live bank felt slightly misclassified.
- Preserved the core adaptive-content shape:
  - enough easy questions for early-ladder stability
  - enough hard/spiky questions for late-run pressure
- Added a lightweight launch-bank quality test to guarantee:
  - full-run viability
  - difficulty-band coverage
  - pressure-tag coverage
- Re-bootstrapped the calibrated bank into Supabase successfully.

## Scope guard
- No gameplay rule changes
- No landing/result/gameplay UI expansion
- No admin or authoring UI
- No schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
- `npm run content:bootstrap` passed
- live Supabase verification confirmed representative recalibrated rows are present in `questions`
