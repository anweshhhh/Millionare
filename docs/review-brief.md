# Review Brief

## Slice
`mmrm-ui-04-mobile-dock-priority-reorder`

## Goal
Fix the remaining mobile hot-seat hierarchy issue so `LOCK ANSWER` is visible in the first portion of the fixed dock without scrolling.

## What changed
- Reordered the mobile action dock so the primary `LOCK ANSWER` action appears first.
- Compressed decision status into a smaller secondary utility row.
- Kept lifelines available while reducing their visual and vertical cost.
- Tightened bottom gameplay padding and dock spacing for iPhone-class mobile viewports.

## Scope guard
- No gameplay-rule changes
- No auth/persistence/schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
