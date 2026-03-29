# Artifact Cleanup Checklist

## Purpose
Provide a short, repeatable check before removing or archiving operational artifacts.

## Use when
Use this checklist for `.openclaw/tasks/`, `reports/cron/`, and temporary `*.html.tmp` files before cleanup.

## Checklist
1. Identify the artifact and its bucket.
2. Confirm whether it is keep, archive, cleanup, or manual review.
3. Check whether a newer canonical artifact exists.
4. Confirm the artifact is not the current source of truth.
5. Confirm the artifact is not the only evidence for an open item.
6. Confirm cleanup will not remove active operational context.
7. Record what was removed, why it was safe, and what replaced it.

## Quick decision notes
- keep: active investigation, approval, or unresolved evidence
- archive: useful historical evidence with no active dependency
- cleanup: temporary or superseded items with no active reference
- manual review: ownership, replacement, or source-of-truth is unclear

## Acceptance criteria
- Cleanup decisions are reproducible.
- Operators can follow the checklist in under a minute.
- The checklist supports the retention policy without broadening scope.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 4.

## Related status note
- `projects/openclaw-core/docs/status.md`

## Related backlog item
- `projects/openclaw-core/backlog/queue.md` item 4.

## Related retention policy
- `projects/openclaw-core/docs/artifact-retention-policy.md`
