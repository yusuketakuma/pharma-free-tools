# Board Review — Proactive Idle Work Discovery and Activation

- date: 2026-03-26
- mode: CEO ↔ Board ↔ Execution
- chair: Supervisor Core
- scope: OpenClaw Core / portfolio orchestration

## Conclusion
The highest-leverage idle work today was not new feature work; it was governance materialization around recurring queue / heartbeat stagnation. The best immediate action was the low-risk board artifact that clarifies stale queue safe-close / reopen handling.

## Candidates discovered

### 1) Stale queue safe-close / reopen policy for `waiting_auth` / `waiting_manual_review`
- Why it matters: this backlog is already recurring, stale, and operationally ambiguous.
- Value: turns repetitive review loops into a durable decision trail.
- Risk: low, because this is process documentation only.

### 2) Heartbeat outcome ledger bridge
- Why it matters: board artifacts are not connecting cleanly into formal ledger / precedent reuse.
- Value: would reduce repeated first-principles review.
- Risk: medium, because the contract can affect board observability across the portfolio.

### 3) Workspace ↔ live runtime bundle manifest + dry-run sync
- Why it matters: partial syncs can drift the runtime from workspace state.
- Value: improves safety for execution-system reflection.
- Risk: medium, because it touches operational contract discipline.

## Board judgments

### Board Visionary
- Prefers the ledger bridge long-term because it compounds precedent reuse.
- Still recommends starting with stale queue policy because it has the shortest path to value.

### Board User Advocate
- Wants the simplest artifact that helps humans decide quickly.
- Strongly favors the stale queue policy because it is understandable and actionable.

### Board Operator
- Wants one thing that can be shipped now.
- Selects the stale queue policy as the immediate action.

### Board Auditor
- Flags the ledger bridge and bundle sync as useful but not first move.
- Notes that they should be treated as follow-up specs, not rushed changes.

### Board Chair
- Decision: accept candidate 1 for immediate low-risk materialization.
- Decision: keep candidates 2 and 3 as follow-up proposals only.

## Action taken
- Created `projects/openclaw-core/docs/stale-queue-safe-close-reopen-policy.md`
- Linked it from `projects/openclaw-core/backlog/queue.md`

## Why the others were not started
- Ledger bridge: useful, but needs a clearer contract boundary and probably a separate spec cycle.
- Bundle manifest / dry-run sync: valuable, but it should be approached after current queue governance is stabilized.

## Residual follow-up
- Reuse the new stale queue policy in the next heartbeat / board review.
- If the same queue prefixes persist, move the ledger bridge to the next board cycle.
- If runtime reflection drift reappears, prioritize bundle-manifest / dry-run sync planning.
