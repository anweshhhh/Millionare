# Review Brief

## Slice
`mmrm-ui-03-mobile-action-dock-and-focus-mode`

## Goal
Eliminate remaining mobile scroll friction by keeping primary answer controls continuously visible.

## What changed
- Implemented a viewport-fixed mobile action dock for hot-seat controls.
- Dock now contains decision status, lifeline controls, and `LOCK ANSWER`.
- Added active-phase focus behavior by hiding lower-priority state panel while answering.
- Added concise lifeline usage guidance (`1 lifeline per question`).

## Scope guard
- No gameplay-rule changes
- No auth/persistence/schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
