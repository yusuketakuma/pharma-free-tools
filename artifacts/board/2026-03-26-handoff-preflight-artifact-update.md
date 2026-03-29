# Heartbeat Artifact Update — one-line handoff preflight

- created_at: 2026-03-26T08:24:46+09:00
- source: board-operator heartbeat
- outcome: artifact_update
- scope: routing / handoff / triage

## Minimal improvement

Standardize a one-line preflight for queue triage and scout handoffs:

`target / owner / due / success criteria / next check`

## Why this is the smallest useful step

- Handoff retry cost drops when the target, owner, due, and success criteria are explicit.
- It is low risk: no auth, routing, approval, or trust-boundary changes.
- It matches the precedent-first rule: routine handoffs can flow through a fixed template instead of generating new discussion.

## Intended use

- Append this line to handoff-related artifacts and queue triage notes.
- If the line is incomplete, keep the item in routine handling rather than escalating by default.
- Escalate only when the missing field changes ownership, timing, or success criteria.

## Evidence refs

- `reports/cron/board-premeeting-all-agent-business-report-20260326-0818.md`
- `reports/cron/board-postmeeting-agent-dispatch-20260326-0744.md`
- `reports/cron/agent-staffing-and-prompt-tuning-board-20260326-0630.md`
