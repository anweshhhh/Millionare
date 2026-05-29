# Review Brief

## Slice
`mmrm-phase8-05-launch-v2-activation`

## Goal
Activate the expanded launch-v2 question set as the live default while preserving existing safe fallback behavior.

## What changed
- Updated live default set target in gameplay catalog:
  - `LIVE_QUESTION_SET_VERSION` now `launch-v2`.
- Updated tooling defaults:
  - `content:bootstrap` defaults to `content/question-bank-v2.json`
  - `content:audit` defaults to `content/question-bank-v2.json`
  - `content:simulate` defaults to `content/question-bank-v2.json`
- Added explicit bootstrap convenience scripts:
  - `content:bootstrap:v1`
  - `content:bootstrap:v2`
- Updated README/status wording for launch-v2 default posture.

## Scope guard
- No gameplay UI changes
- No reducer rule changes
- No schema changes
- No new dependencies

## Verification
- `npm run content:audit` passed with no warnings
- `npm run content:simulate` passed
- `npm test` passed
- `npm run build` passed
