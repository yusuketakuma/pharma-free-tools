# Supervisor Core scan — 2026-03-24

## Conclusion
The highest-value safe next task is to implement the **read-only queue telemetry snapshot for `waiting_auth` / `waiting_manual_review`** in OpenClaw core.

## Why this is the best next move
- The runtime queue is large: **819 total items**.
  - `waiting_auth`: **476**
  - `waiting_manual_review`: **343**
- Queue contents are heavily repetitive, so stale vs active backlog is hard to distinguish without telemetry.
- OpenClaw core already lists this as a ready backlog item, and it is **read-only / low-risk**.
- It directly supports the SOUL goal of reducing burden by making stalls visible and actionable.

## Queue shape observed
- `waiting_auth`
  - invalid JSON: **0**
  - top prefixes:
    - `step6-dedupe` **171**
    - `step6-plan-auth-runtime` **166**
    - `lane-runtime-auth-ng` **134**
- `waiting_manual_review`
  - invalid JSON: **0**
  - top prefixes:
    - `step6-lane-write-blocked` **167**
    - `lane-runtime-partial-write` **134**
    - `step6-acp-mock-contract` **40**

## Top candidate
1. **OpenClaw core — read-only queue telemetry snapshot**
   - count / oldest / newest mtime
   - top task prefixes
   - invalid JSON count
   - 24h delta

## Secondary candidates
2. **OpenClaw core — stale-report detection for CEO / department jobs**
   - important, but it benefits from queue visibility first
3. **DeadStockSolution — preview branch triage**
   - valuable, but it is more repo-specific and less immediately leverageable across the workspace

## Current state notes
- OpenClaw core status/backlog is focused on routing, approval, queue hygiene, and stale-report detection.
- DDS remote agent runner is live and recurring; the main remaining DDS issue is operational hardening, not connection setup.
- CareRoute-RX is mid-triage and not the best immediate next move given the stronger cross-workspace leverage in OpenClaw core.

## Immediate low-risk artifact possible
Yes: create the queue telemetry snapshot artifact now as a markdown/JSON report in `reports/` or `.openclaw/tasks/`.
