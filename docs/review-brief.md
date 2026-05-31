# Review Brief

## Slice
`fix-auth-magic-link-redirect-target`

## Goal
Ensure Supabase magic-link emails return users to the correct deployed origin instead of localhost when links are triggered during local testing.

## What changed
- Added optional auth redirect env support in `src/lib/supabase/env.ts`:
  - `VITE_SUPABASE_AUTH_REDIRECT_URL`
- Updated magic-link request flow in `src/lib/supabase/auth.ts`:
  - uses `VITE_SUPABASE_AUTH_REDIRECT_URL` when present
  - falls back to `window.location.origin` when not set
- Updated setup docs:
  - `.env.example`
  - `README.md`

## Scope guard
- No gameplay/UI changes
- No schema/persistence changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
