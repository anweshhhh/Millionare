# Review Brief

## Slice
`mmrm-game-04-persistent-replay-memory`

## Goal
Make replay anti-repeat behavior more reliable by persisting recent-run memory beyond in-memory refs.

## What changed
- Added a new run-memory helper at `src/game/recent-run-memory.ts`.
- Memory now persists up to 2 prior run question-id sets in browser storage.
- `Start Run` and `Replay` now hydrate avoid ids from persistent memory and store each new sampled run.
- Sampling continues using existing guardrails; this slice hardens continuity across refresh/tab contexts.

## Scope guard
- No visible UI changes
- No gameplay pacing/rule changes
- No auth or persistence-schema changes
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
- Added test coverage for capped recent-run memory and deduped avoid-id output.
