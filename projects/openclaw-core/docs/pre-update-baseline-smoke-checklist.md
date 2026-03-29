# Pre-update Baseline Smoke Checklist

## Purpose
Capture the minimum evidence needed before updating OpenClaw so version drift, service drift, and auth drift are visible.

## Scope
Use this checklist before an OpenClaw update or runtime sync.

## Checklist
1. Record the current OpenClaw version.
2. Confirm service state is healthy.
3. Verify auth scopes / login status.
4. Capture recent logs or warnings.
5. Record file hashes for the touched baseline files.
6. Note any known warnings or gaps before the update.

## Output shape
Prefer a short block such as:
- version: `...`
- service state: `...`
- auth scopes: `...`
- logs: `...`
- file hashes: `...`
- known warnings: `...`

## Acceptance criteria
- The baseline can be compared before and after an update.
- Drift is visible quickly.
- The checklist stays short enough to run every time.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 6.
- Related status note: `projects/openclaw-core/docs/status.md`.
