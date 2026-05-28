# Review Brief

## Slice
`mmrm-phase6-03-internal-report-wiring`

## Goal
Wire the first compact private admin intelligence output without building an admin dashboard or changing any player-facing surface.

## What changed
- Added a compact internal report formatter for the hidden Phase 6 intelligence payload.
- Added a new developer-facing command:
  - `npm run admin:intelligence`
  - optional `--json` output for raw structured payloads
- Added the minimum client-injected repository helpers needed to assemble backstage evidence cleanly from Supabase.
- Reused only approved first-pass signal families:
  - question calibration
  - ambiguity / instability flags
  - drop-off concentration
  - adaptation fairness review
- Verified the command against the live project, where the current sparse dataset correctly resolves to low-confidence review output.

## Scope guard
- No admin dashboard pages
- No player-facing UI changes
- No schema changes
- No new dependencies
- No gameplay changes

## Verification
- `npm test` passed
- `npm run build` passed
- `npm run admin:intelligence -- --json` passed
