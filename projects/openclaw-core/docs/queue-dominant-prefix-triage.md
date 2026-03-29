# Dominant-Prefix Queue Triage Checklist

## Purpose
Turn read-only queue telemetry into an action-oriented triage step when the same runtime prefixes keep dominating blocked queues.

## Trigger
Use this checklist when queue snapshots keep showing the same prefixes across runs, especially in:
- `waiting_auth`
- `waiting_manual_review`

Typical dominant prefixes seen in the 2026-03-24 snapshot:
- `step6-dedupe`
- `step6-plan-auth-runtime`
- `lane-runtime-auth-ng`
- `step6-lane-write-blocked`
- `lane-runtime-partial-write`
- `step6-acp-mock-contract`

## Owner / entry / exit
- owner: `Queue Triage Analyst`
- entry: the same prefix keeps dominating `waiting_auth` or `waiting_manual_review` across comparable snapshots, and the next owner / next action / success criteria are still unclear
- exit: each dominant prefix has a named owner, one next action, and one success criterion; otherwise, hand off once to the safe-close / reopen policy as an escalated board decision

## Inputs
- latest queue telemetry snapshot
- previous snapshot for delta comparison
- current report / review artifacts
- existing backlog / routing notes

## Triage order
1. Group repeated prefixes by choke point, not by raw count alone.
2. Separate auth/routing, write-blocked, partial-write, and mock-contract cases.
3. For each dominant prefix, record:
   - suspected choke point
   - owner
   - next action
   - due
   - evidence
   - success criteria
   - stop condition
4. Keep the output read-only until a separate implementation task is approved.

## Escalation rules
Use these gates to avoid repeating the same report when the evidence has not changed.

| Condition | When history is sufficient | When history is insufficient | Recommended action |
| --- | --- | --- | --- |
| 3 consecutive runs with no material diff | Mark the run as `前回から実質差分なし` and suppress expanded narrative | Do not infer a streak from fewer than 3 comparable runs | Lower report frequency; only report on new evidence, new prefix, or new owner/action |
| 2 consecutive runs with unresolved judgment items | Promote to priority review and require owner / due / success criteria | If only one run shows judgment items, keep monitoring | Escalate to manual review; do not keep re-reporting the same open question |
| 3 consecutive days with missing metrics | Mark the baseline as `未形成` and stop scoring attempts | Do not declare a 3-day streak without 3 dated runs | Switch to metric-definition / instrumentation work instead of analysis repeats |
| Same improvement candidate persists across runs | Collapse into one candidate and cite the previous report | If the candidate changed, keep separate entries | Perform light dedupe / consolidation; avoid duplicate candidate lists |
| Execution exists but no concrete action is produced | Treat as blocked remediation and require a single next action plus due / evidence / stop condition | If execution is partial or evidence is thin, say `履歴不足` | Escalate to remediation, or return `履歴不足` instead of inventing a new rule |

## Reporting style
- If the change is thin, start with `変更なし` or `前回から実質差分なし`.
- Keep the body short when the report is unchanged.
- If `due` / `evidence` / `stop condition` cannot be named, prefer `履歴不足` and do not add a new rule just to fill the gap.
- Do not add new rules just to fill an evidence gap; prefer `履歴不足`.

## Output template
```md
- prefix:
- queue:
- suspected choke point:
- owner:
- next action:
- due:
- evidence:
- success criteria:
- stop condition:
- notes:
```

## Non-goals
- Do not change auth, routing, approval, or trust-boundary settings here.
- Do not treat telemetry repetition itself as progress.
- Do not expand the checklist into a broad cleanup plan before the prefix-specific triage is written.

## Follow-up
- Link the checklist from backlog and status.
- Reuse it in the next review whenever the same dominant prefixes persist.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 8.
- Related status note: `projects/openclaw-core/docs/status.md`.
