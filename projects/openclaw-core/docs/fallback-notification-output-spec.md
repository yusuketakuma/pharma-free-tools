# Fallback Notification Output Spec

## Purpose
Define the minimal output shape for deadline-critical fallback notifications when central reporting becomes stale-critical or hard-stale.

## Scope
Read-only notification content only.

This spec does not change auth, routing, approval, trust-boundary, or Telegram root settings.

## Trigger
Use only when all of the following are true:
- the item is deadline-critical
- central reporting is stale-critical or hard-stale
- the item has not already been escalated within the dedupe window
- the fallback path is allowed by the current reporting policy

## Output fields
A fallback notification should include:
- job name
- missed item / affected reminder
- severity
- last successful time
- expected cadence
- next human action

## Minimal message shape
Prefer one short paragraph or 3 bullets:
1. what was missed
2. what is affected
3. what needs human attention now

## Example message
- missed: nightly department report did not run
- affected: deadline-critical reminder queue may be stale
- next action: confirm the last successful run and decide whether to escalate

## Deduplication
- Default dedupe window: 6 hours
- Re-announce only when severity increases or the affected item changes materially

## Non-goals
- Do not send broad status digests
- Do not include low-value historical detail
- Do not route around policy or governance settings

## Acceptance criteria
- The message is short enough to scan quickly.
- The affected deadline-critical item is obvious.
- The notification can be paired with the stale-report snapshot without extra explanation.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 2.
- Related status note: `projects/openclaw-core/docs/status.md`.

## Related stale-report spec
- `projects/openclaw-core/docs/stale-report-detection-spec.md`
