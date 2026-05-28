# Review Brief

## Slice
`mmrm-content-06-bank-expansion-v3`

## Goal
Expand the live Supabase-backed question bank so the product gets materially deeper replay value without changing visible gameplay.

## What changed
- Expanded the checked-in `launch-v1` bank from 48 to 72 active curated questions.
- Added 24 new hand-curated rows across the existing category set.
- Preserved the current content contract and adaptive metadata shape.
- Used the new batch to strengthen hard/spiky coverage instead of only adding easy filler.
- Re-bootstrapped the expanded bank into Supabase successfully.

## Scope guard
- No gameplay rule changes
- No landing/result/gameplay UI changes
- No admin or authoring UI
- No schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
- `npm run content:bootstrap` passed
- repository now loads 72 active `launch-v1` questions
