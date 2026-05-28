# Review Brief

## Slice
`mmrm-ui-01-minimal-modern-pass`

## Goal
Apply a modern minimal UI/UX pass that removes non-essential surface noise while preserving current gameplay behavior.

## What changed
- Landing: removed extra explanatory/metric blocks and tightened signed-in summary + recent-run presentation.
- Hot-seat: shortened timer/state/question helper copy and reduced decision-panel visual weight.
- Result: reduced redundant summary cards and tightened payoff/action copy.
- Styling: lowered glow/noise/shadow intensity and tightened spacing/radius rhythm.

## Scope guard
- No gameplay-rule changes
- No auth/persistence/schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
