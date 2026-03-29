# Report Verification State Model

## Purpose
Keep report lifecycle states separate so we do not confuse review approval, apply status, manual handling, and actual effect confirmation.

## Use when
Use this model when a report, review, or maintenance summary includes any of these states:
- `review-approved`
- `apply-applied`
- `apply-blocked`
- `manual_required`
- `pending_artifact`
- `verified` / `effect-confirmed`

## State guide
- **draft**: the report or change is still being shaped.
- **review-approved**: the content is acceptable for the next step.
- **apply-applied**: the change has been applied somewhere.
- **apply-blocked**: the change cannot be applied yet because a guardrail stopped it.
- **manual_required**: the change needs a human step or follow-up action.
- **pending_artifact**: the change exists, but downstream evidence is still missing.
- **effect-confirmed**: the intended outcome was verified from files, logs, or another primary source.

## Rule of thumb
Do not use `done` or `complete` unless the evidence shows the intended effect, not just the presence of an applied change.

## Proof path
For numeric or completion claims, pair the state with:
1. a primary source check
2. one spot-check or sample check
3. a short note mapping the claim to the evidence

## Related files
- `projects/openclaw-core/docs/metric-claim-verification-checklist.md`
- `projects/openclaw-core/learn/improvement-ledger.md`
- `projects/openclaw-core/ops/RUNBOOK.md`

## Related backlog item
- `projects/openclaw-core/backlog/queue.md` item 11

## Related status note
- `projects/openclaw-core/docs/status.md`
