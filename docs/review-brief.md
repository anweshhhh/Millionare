# Review Brief

## Slice
`mmrm-game-05a-second-chance-reveal-mask`

## Goal
Patch a fairness bug in second-chance flow where recovery reveal exposed the correct option.

## What changed
- Masked correct-option highlight during shield-triggered recovery reveal.
- Retry now proceeds without revealing the correct answer beforehand.
- Kept all other gameplay timing/flow unchanged.

## Verification
- `npm test` passed
- `npm run build` passed
