# Review Brief

## Slice
`fix-home-navigation-and-landing-signout`

## Goal
Reduce auth/session friction by adding a home return path after run end and a quick sign-out affordance on landing.

## What changed
- Added `Home` secondary CTA to result screen.
- Added landing `Sign out` button for signed-in users.
- Added reducer action `GO_HOME` to reset to entry state cleanly.
- Wired App handlers for `onGoHome` and `onSignOut`.
- Added minimal style support for landing header actions.

## Scope guard
- No gameplay rule changes
- No persistence/schema/auth-provider changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
