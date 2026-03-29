# Read-only Stale-Report Snapshot Spec

## Purpose
Record a compact, reproducible snapshot of reporting-job health so stale detection can be compared across cycles.

## Scope
Read-only only.

This spec covers the snapshot output for tracked CEO / department reporting jobs.

## Snapshot fields
For each job, capture:
- job name
- last successful run time
- expected cadence
- elapsed time since last success
- severity (`ok` / `warning` / `critical` / `hard-stale`)
- affected fallback items
- next action

## Output shape
Prefer one row per job:

| job | last success | cadence | elapsed | severity | affected fallback items | next action |
| --- | --- | --- | --- | --- | --- | --- |
| example | `...` | `6h` | `8h` | `warning` | `...` | `monitor` |

## Rules
- Do not mutate cron state or report content.
- Use cadence-relative thresholds from the detection spec.
- If a field is unknown, write `unknown` instead of guessing.
- Keep the snapshot short enough for heartbeat / regular reporting.

## Companion specs
- `projects/openclaw-core/docs/stale-report-detection-spec.md`
- `projects/openclaw-core/docs/fallback-notification-output-spec.md`

## Acceptance criteria
- The snapshot can be compared cycle to cycle.
- The output makes stale jobs obvious at a glance.
- The snapshot stays read-only.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 1.
- Related status note: `projects/openclaw-core/docs/status.md`.
