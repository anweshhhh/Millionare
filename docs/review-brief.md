# Review Brief

## Slice
`mmrm-polish-01-showcase-hardening`

## Goal
Run a narrow hardening pass on the showcase MVP so the existing product feels more consistent and trustworthy without expanding scope.

## What changed
- Cleared stale save success/error feedback when a fresh run starts or replay begins.
- Made footer source copy reflect the actual active catalog:
  - `Live Question Run` when Supabase-backed content is active
  - `Seed Fallback Run` when the app is on the seeded safety path
- Kept the slice tightly scoped to consistency and trust polish only.

## Scope guard
- No new features
- No new UI surfaces
- No schema changes
- No gameplay rule changes
- No landing/result expansion

## Verification
- `npm test` passed
- `npm run build` passed
- `npm run admin:intelligence -- --json` passed
