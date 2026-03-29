# Portfolio Project Operations and Document Migration Rules

## Purpose
This file fixes the project-owned document destinations introduced in Phase 4 Step 5.
It is a receiving policy, not a bulk-migration order.

## Fixed per-project destinations
For every project under `projects/<project_id>/`:

- status: `docs/status.md`
- backlog: `backlog/queue.md`
- runbook: `ops/RUNBOOK.md`
- learning ledger: `learn/improvement-ledger.md`
- project definition: `project.yaml`

## Global vs local responsibility
Remain global (do not migrate by default):
- `.openclaw/**` execution system artifacts and policies
- `org/**` organization / operating model source of truth
- root `CURRENT_STATUS.md` as the portfolio index

Become project-owned when content is specific to one project:
- project-specific status details -> `projects/<project_id>/docs/status.md`
- project-specific task inventory / next actions -> `projects/<project_id>/backlog/queue.md`
- project-specific procedures / recurring ops -> `projects/<project_id>/ops/RUNBOOK.md`
- project-specific lessons / retrospectives -> `projects/<project_id>/learn/improvement-ledger.md`

## Staged migration policy
No large file moves in this phase.
Use staged migration only:

1. Create the receiving files in the fixed locations.
2. When editing an existing project-owned document elsewhere, either:
   - move only that touched section into the project-owned file, or
   - summarize it into the project-owned file and leave a backlink to the original.
3. Retire or relocate old documents only after their replacement location is populated and verified.

## Migration priority
1. Status snapshots and current risks
2. Active backlog / queued work
3. Operational runbooks and support procedures
4. Learnings / postmortems / improvement history

## Mapping guidance
- Existing project status notes -> `docs/status.md`
- Existing project TODO / queue / next tasks -> `backlog/queue.md`
- Existing project runbook / support steps / smoke checks -> `ops/RUNBOOK.md`
- Existing project retrospectives / lessons / improvement logs -> `learn/improvement-ledger.md`

## Notes
- If a document mixes global and project-local content, split only the project-owned portion first.
- Prefer adding links/backreferences over moving large files all at once.
- Keep changes reversible and approval-safe.
