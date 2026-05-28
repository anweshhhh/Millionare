# Review Brief

## Slice
`mmrm-content-08-bank-expansion-v4`

## Goal
Expand the live Supabase-backed launch bank to materially improve replay depth without changing visible gameplay.

## What changed
- Expanded the checked-in `launch-v1` bank from 72 to 156 active curated questions.
- Added 84 new rows across the existing category set.
- Preserved the current content contract and adaptive metadata shape.
- Updated the content test expectation to match the expanded checked-in bank.
- Re-bootstrapped Supabase successfully and verified repository loading on the live set.

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
- repository now loads 156 active `launch-v1` questions
