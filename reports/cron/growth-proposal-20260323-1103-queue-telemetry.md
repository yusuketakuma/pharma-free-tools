# Growth Proposal — Queue telemetry snapshot for blocked runtime queue

Date: 2026-03-23 11:03 JST

## Observation
- `.openclaw/runtime/queue/waiting_auth` currently contains 476 entries.
- `.openclaw/runtime/queue/waiting_manual_review` currently contains 343 entries.
- Current heartbeat needs a fast, low-risk way to distinguish active backlog from stale accumulation.

## Proposal
Add a read-only queue telemetry snapshot script/report that summarizes, per queue:
- total count
- oldest/newest artifact mtime
- top task prefixes
- invalid JSON count
- 24h delta vs previous snapshot

## Why this is low risk
- Read-only reporting only
- No routing/auth/approval policy changes
- No Telegram setting changes
- No auto-resume, auto-publish, or destructive cleanup

## Expected value
- Heartbeat can identify whether backlog is actively growing or just historically accumulated.
- Makes blocked-state triage faster without touching protected policy.
- Helps decide whether manual cleanup/rebalance is worth escalation.

## Suggested next step
Implement as a small reporting script and write snapshot output under `reports/cron/`.
