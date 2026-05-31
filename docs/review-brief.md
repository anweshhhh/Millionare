# Review Brief

## Slice
`fix-auth-magic-link-rate-limit-cooldown`

## Goal
Reduce Supabase OTP 429 failures by hardening the magic-link request UX with a deterministic resend cooldown and clearer user messaging.

## What changed
- Added 60s cooldown state in auth provider.
- Added explicit 429/rate-limit detection and friendly message.
- Added cooldown wiring to auth sheet CTA:
  - disables resend during cooldown
  - shows countdown text (`Retry in Ns`)
- Kept auth method unchanged (email magic-link).

## Scope guard
- No gameplay changes
- No schema/auth-provider changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
