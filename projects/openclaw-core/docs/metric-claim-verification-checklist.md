# Metric Claim Verification Checklist

## Purpose
Prevent reports from claiming completion, full coverage, or improvement without direct evidence.

## When to use
Use this checklist before marking any report, cleanup, or maintenance task as complete when it claims:
- a task is done
- coverage is 100%
- all files were updated
- a metric improved or stayed flat
- a cleanup sweep is finished

Do not use this for opinion-only notes or brainstorming.

## Minimum standard
A valid completion claim needs:
1. one primary source-of-truth check
2. one spot-check or sample check
3. a short proof note linking the claim to the evidence

## Verification steps
1. Restate the claim clearly.
2. Identify the primary evidence.
3. Check the denominator or scope.
4. Run at least one spot-check.
5. Compare the report wording against the evidence.
6. Record the proof path in a short reusable note.

## Evidence patterns
- Count-based claims: `find`, `rg`, `jq`, or a small script
- Coverage claims: sample representative files or items
- Cleanup claims: confirm the item is no longer referenced by backlog, status, or recent reports
- Fix claims: verify both the symptom and the intended target changed

## Pass / fail rules
### Pass
- Evidence matches the claim.
- The sample check does not contradict the claim.
- Any remaining uncertainty is explicitly noted.

### Fail
- The claim cannot be reproduced.
- The report uses a broader scope than the evidence.
- The sample reveals a mismatch.

## Reporting language
Prefer:
- `verified from files`
- `verified by count + sample`
- `partial / subset verified`
- `not verified yet`
- `needs re-check`

Avoid:
- `done` when only a report exists
- `100%` without denominator check
- `complete` without sample or direct evidence

## Quick template
```md
- claim:
- source of truth:
- command / check:
- sample checked:
- result:
- follow-up:
```

## Example proof note
```md
- claim: cleanup sweep is finished for the target subset
- source of truth: backlog queue + status file + file list
- command / check: find/rg count + sample read
- sample checked: one representative file from each bucket
- result: verified by count + sample
- follow-up: remaining subset needs re-check
```

## Related backlog item
- `projects/openclaw-core/backlog/queue.md` item 3

## Related status note
- `projects/openclaw-core/docs/status.md`

## Related backlog item
- `projects/openclaw-core/backlog/queue.md` item 3.

## Acceptance criteria
- Completion claims are backed by evidence.
- The verifier can reproduce the check quickly.
- Partial evidence is labeled as partial instead of being overstated.
- The checklist can be reused as a short proof note in reports.
