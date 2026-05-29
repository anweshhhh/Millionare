# Review Brief

## Slice
`mmrm-phase7-03-and-04-variety-and-difficulty`

## Goal
Reduce replay repetition and personalize challenge level so the game feels less generic across repeated runs.

## What changed
- Replay variety hardening:
  - expanded recent-run memory from 2 runs to 5 runs
  - fixed start/replay sampling flow to consistently use persisted multi-run avoid IDs
- Adaptive difficulty personalization:
  - target band now includes profile-based shift signals
  - high-accuracy/low-timeout users can be nudged up
  - struggling/timeout-heavy users can be nudged down
  - bounded one-step shifts preserve fairness
- Added deterministic test coverage for:
  - wider replay memory behavior
  - high-skill upward target behavior
  - struggling-profile recovery target behavior

## Scope guard
- No new gameplay mechanics
- No schema/auth/persistence changes
- No new UI surfaces
- No new dependencies

## Verification
- `npm test` passed
- `npm run build` passed
