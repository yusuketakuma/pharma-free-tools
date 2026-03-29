# Stale Queue Safe-Close / Reopen Policy

## Purpose
Define how to handle `waiting_auth` / `waiting_manual_review` backlog entries that remain stale after auth recovery, without mutating runtime queue state prematurely.

## Scope
- `waiting_auth`
- `waiting_manual_review`
- board-reviewed safe-close / reopen decisions only

## Non-goals
- Do not change auth, routing, approval, or trust-boundary settings.
- Do not auto-drain runtime queues.
- Do not treat a probe-specific warning as a real outage without a baseline check.

## Decision states
### Safe-close
Use when the item is stale, historical, or already absorbed into a durable summary and no longer needs active follow-up.

### Reopen
Use when new evidence appears, an owner re-raises the item, or the item is still linked to an active dependency.

### Hold
Use when evidence is insufficient to safely close or reopen.

### Escalate
Use when the same unresolved prefix or judgment appears across multiple comparable runs and a human decision is still required.

## Input signals
- latest queue snapshot
- previous comparable snapshot
- dominant prefix grouping
- auth recovery status
- active dependency / owner signal
- existing board note or runbook reference

## Safe-close conditions
A backlog item is a safe-close candidate when all of the following are true:
1. The item is stale relative to its expected cadence or review window.
2. Auth recovery has already happened, and the item did not reappear with new evidence.
3. The item is not tied to a currently active high-priority task.
4. A durable summary, checklist, or board note already captures the decision.
5. Closing it will not hide an unresolved operational risk.

## Reopen conditions
Reopen when any of the following is true:
1. New evidence changes the diagnosis.
2. The item reappears with a new owner / due / success-criteria signal.
3. A dependent task is blocked by the same unresolved issue.
4. The previous closure lacked enough evidence and was marked `履歴不足`.

## Escalation conditions
Escalate to board review when any of the following is true:
1. 3 comparable runs show no material diff and the same judgment gap persists.
2. The same dominant prefix persists across runs but the next action remains unclear.
3. The item has operational impact but cannot be safely classified as close or reopen.
4. The queue state is unchanged, but the narrative keeps repeating without a new decision.

## Minimal output
When this policy is used, record:
- queue name
- item / prefix
- current state
- safe-close / reopen / hold / escalate
- reason
- next action
- linked evidence

## Reporting template
```md
- queue:
- prefix or item:
- current state:
- decision:
- reason:
- evidence:
- next action:
```

## Board intent
This policy exists to keep runtime queue state read-only until the board decision lands, while still allowing the portfolio to move stale items into a durable close / reopen / hold trail.

## Dominant-prefix triage split
Keep prefix triage separate from queue-state decisions.
- owner: `Queue Triage Analyst`
- entry: repeated dominant prefix across comparable snapshots, or unresolved owner / next action / success-criteria gap
- exit: each dominant prefix has owner / next action / success criteria recorded, or the case is escalated with one board decision record

## Follow-up
- Link this policy from `projects/openclaw-core/backlog/queue.md`.
- Reuse it together with `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`.
- Feed the decision summary into the next heartbeat / board review cycle.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 9.
- Related status note: `projects/openclaw-core/docs/status.md`.
