# Read-only Queue Telemetry Snapshot Spec

## Purpose
Capture a small, board-safe snapshot of blocked queue health so repeated `waiting_auth` / `waiting_manual_review` items can be triaged without re-deriving the same observations every cycle.

## Scope
Read-only only.

Target queues:
- `waiting_auth`
- `waiting_manual_review`

## Snapshot fields
Each queue snapshot should record:
- queue name
- total item count
- oldest item mtime
- newest item mtime
- top task prefixes
- invalid JSON count
- 24h delta versus the previous snapshot

## Output shape
Prefer one table per queue:

| field | value |
| --- | --- |
| queue | `waiting_auth` |
| count | `N` |
| oldest mtime | `...` |
| newest mtime | `...` |
| top prefixes | `prefixA, prefixB, prefixC` |
| invalid JSON | `N` |
| 24h delta | `+N / -N / 0` |

## Rules
- Do not mutate queue state.
- Do not infer resolution from a single probe.
- Keep the snapshot short enough to feed directly into the dominant-prefix triage checklist.
- If metrics are missing, report `unknown` rather than guessing.

## Next consumer
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
- `projects/openclaw-core/docs/queue-triage-analyst-runbook.md`

## Acceptance criteria
- A reviewer can see queue pressure at a glance.
- The snapshot is reproducible from files or telemetry.
- The report can be compared against the previous run without expanding scope.
