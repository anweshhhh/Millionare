# Review Brief

## Slice
`mmrm-content-05-bank-expansion-v2`

## Goal
Expand the live `launch-v1` bank so the showcase MVP has materially better replay depth without changing visible gameplay.

## What changed
- Expanded the checked-in `launch-v1` bank from 24 to 48 active questions.
- Added new curated questions across the existing category set for broader replay coverage.
- Preserved the current content contract and adaptive metadata shape.
- Updated the content-bank test expectations to reflect the larger curated pool.
- Re-bootstrapped the expanded bank into Supabase successfully.

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
- live Supabase verification confirmed `ACTIVE_LAUNCH_V1_COUNT = 48`
