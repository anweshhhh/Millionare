# Phase 8 — Question Bank Expansion v1

## Objective
Expand content depth enough to materially reduce repeat perception while preserving gameplay quality, adaptive metadata quality, and mobile-first fast-play rhythm.

## Target outcome for v1
- Move from the current `launch-v1` size to a larger curated `launch-v2` bank.
- Keep deterministic quality gates before activation.
- Keep gameplay/UI unchanged in this phase.

## Non-goals
- No authoring UI
- No CMS platform
- No LLM generation pipeline
- No gameplay rule changes

## Content contract (required per row)
- `external_key`
- `prompt`
- `options` (exactly 4)
- `correct_answer_index` (0..3)
- `category`
- `difficulty_band` (`easy|medium|hard`)
- `pressure_tag` (`calm|neutral|spiky`)
- `is_active`
- `question_set_version`
- `source_label`

## Quality gates
Every expansion pass must satisfy:
1. `npm run content:audit` reports no warnings.
2. `npm run content:simulate` reports replay overlap in acceptable range (current target: zero overlap in the default 5-run window).
3. `npm test` and `npm run build` pass.

## Balancing posture
- Preserve all three difficulty bands.
- Preserve all three pressure tags.
- Keep broad category spread.
- Keep answer-index distribution approximately balanced over the full bank.

## Rollout posture
1. Add/validate new bank in JSON.
2. Bootstrap to Supabase with `content:bootstrap`.
3. Verify active-row load through repository.
4. Switch live default question set version only after gates pass.

## Suggested next slices
- Slice 8.03: Phase 8 taxonomy and quality spec lock (this doc + docs sync).
- Slice 8.04: Add `launch-v2` curated bank + generation helper + validation tests.
- Slice 8.05: Activate `launch-v2` as live default and update bootstrap/deployment guidance.
