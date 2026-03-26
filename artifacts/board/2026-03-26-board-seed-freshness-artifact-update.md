# Heartbeat Artifact Update — board seed freshness preflight

- created_at: 2026-03-26T09:35:00+09:00
- source: board-visionary heartbeat
- outcome: artifact_update
- scope: board agenda seed / precheck / slot coherence

## Minimal improvement

Standardize a one-line freshness gate for board inputs:

`board_cycle_slot_id / canonical_seed / generated_at / precheck_slot / status`

## Why this is the smallest useful step

- `agenda-seed-latest` and `claude-code-precheck-latest` can drift by slot.
- When seed freshness is unclear, Board falls back to evidence-only and loses a cycle to revalidation.
- This is low risk and reversible; it does not touch auth, routing, approval, or trust boundaries.

## Intended use

- Require slot and freshness metadata in `agenda-seed-latest` and precheck artifacts.
- If slot mismatch or missing slot is detected, mark the gate as degraded and regenerate the seed before board review.
- Keep manual seed as a source input, but do not treat it as canonical latest unless it carries the slot stamp.

## Evidence refs

- `reports/board/board-premeeting-brief-20260326-0925.md`
- `reports/cron/board-agenda-assembly-20260326-0931.md`
- `reports/board/agenda-seed-latest.md`
- `reports/board/claude-code-precheck-latest.md`
