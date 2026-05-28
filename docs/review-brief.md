# Review Brief

## Slice
`mmrm-phase6-04-calibration-and-threshold-review`

## Goal
Calibrate the hidden private admin intelligence layer so it stays more trustworthy, deterministic, and conservative before any broader final-product polish.

## What changed
- Tuned Phase 6 thresholds to require stronger evidence before escalating signals.
- Kept the hidden posture intentionally conservative:
  - sparse samples remain `low-confidence`
  - miss-only question patterns tend to surface as `watch`
  - drop-off review calls now need stronger concentration
  - adaptation fairness needs more transitions before a confident judgment
- Expanded deterministic tests for:
  - sparse-vs-strong question review cases
  - watch-level drop-off concentration
  - low-confidence adaptation fairness with thin transitions
  - stronger adaptation fairness review scenarios
- Re-verified the internal report command against live project data after calibration.

## Scope guard
- No player-facing UI changes
- No schema changes
- No new dependencies
- No admin dashboard work
- No gameplay changes

## Verification
- `npm test` passed
- `npm run build` passed
- `npm run admin:intelligence -- --json` passed
