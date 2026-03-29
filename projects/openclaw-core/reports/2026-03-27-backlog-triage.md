# Backlog Triage Note — 2026-03-27

## Selected item
- Backlog: `projects/openclaw-core/backlog/queue.md`
- Item: **Read-only queue telemetry snapshot for `waiting_auth` / `waiting_manual_review`**

## Why this one
- It is the smallest upstream dependency for the dominant-prefix triage flow.
- It turns repeated queue observation into a measurable snapshot, which the analyst runbook can consume.
- It stays read-only and avoids protected-path changes.

## Progress made this cycle
- Scoped the snapshot to the minimum fields needed for board-safe triage:
  - queue name
  - total count
  - oldest mtime
  - newest mtime
  - top task prefixes
  - invalid JSON count
  - 24h delta
- Aligned the output intent with the existing dominant-prefix triage checklist and runbook.

## Recommended next step
- Draft the snapshot output format as a small, read-only artifact spec under `projects/openclaw-core/docs/`.
- Keep it narrow: one snapshot per queue, one table, one obvious next action.

## Board note
- No auth / routing / approval setting changes are needed.
- This is suitable for the next implementation slice after approval if needed.
