# Artifact Retention Policy

## Purpose
Prevent operational artifacts from accumulating while keeping evidence that is still useful for review, debugging, or audit.

## Scope
This policy covers the following artifact families only:
- `.openclaw/tasks/`
- `reports/cron/`
- temporary `*.html.tmp` files

It does not change auth, routing, approval, trust-boundary, or Telegram settings.

## Retention buckets
### 1) Keep
Keep artifacts that are still needed for:
- active investigation
- current review / approval
- recent operational evidence
- unresolved reporting or queue issues

### 2) Archive
Archive artifacts that are no longer active but may still be useful as evidence:
- completed reports
- resolved task artifacts that may be referenced later
- historical snapshots that support trend review

### 3) Safe cleanup
Cleanup candidates are artifacts that are:
- temporary by name or purpose
- superseded by a newer artifact
- no longer referenced by active tasks, reports, or docs

Examples:
- stale `*.html.tmp`
- duplicate transient outputs
- old generated files with a newer canonical replacement

### 4) Manual review required
Escalate to manual review when an artifact:
- is referenced by an active task or report
- may be the only evidence for a change
- sits near a protected path or governance boundary
- has unclear ownership or unclear replacement

## Cleanup triggers
An artifact may be considered for cleanup when at least one is true:
- it is explicitly temporary
- a newer canonical artifact exists
- it is no longer referenced in the current backlog / status / report flow
- it is older than the retention window chosen for its bucket

## Verification note
Before removal, confirm:
1. the artifact is not the current source of truth
2. the artifact is not the only evidence for an open item
3. the cleanup does not remove active operational context

## Reporting rule
When cleaning up or archiving, record:
- what was removed or archived
- why it was safe
- what replaced it, if anything

## Quick decision guide
- keep: active investigation, approval, or unresolved evidence
- archive: useful historical evidence with no active dependency
- cleanup: temporary or superseded items with no active reference
- manual review: ownership, replacement, or source-of-truth is unclear

## Acceptance criteria
- Operators can tell keep / archive / cleanup / manual-review apart quickly.
- Temporary artifacts have a clear cleanup path.
- Active evidence is preserved until the related task is closed.

## Related checklist
- `projects/openclaw-core/docs/artifact-cleanup-checklist.md`

## Example use
- Before removing a stale `*.html.tmp`, confirm a newer canonical file exists and the tmp file is no longer referenced.
- Before archiving a completed report, confirm it is not the current source of truth and not the only evidence for an open item.
