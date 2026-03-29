# Read-only Queue Telemetry Snapshot Spec

## Purpose
Capture a compact snapshot of blocked queue health so repeated backlog pressure can be compared across cycles.

## Scope
Read-only only.

Target queues:
- `waiting_auth`
- `waiting_manual_review`

## Snapshot fields
For each queue, capture:
- queue name
- total item count
- oldest item mtime
- newest item mtime
- top task prefixes
- invalid JSON count
- 24h delta versus the previous snapshot

## Output shape
Prefer one row per queue:

| queue | count | oldest mtime | newest mtime | top prefixes | invalid JSON | 24h delta |
| --- | ---: | --- | --- | --- | ---: | ---: |
| `waiting_auth` | `N` | `...` | `...` | `prefixA, prefixB` | `N` | `+N` |

## Rules
- Do not mutate queue state.
- Do not infer resolution from a single probe.
- Keep the snapshot short enough to feed directly into the dominant-prefix triage checklist.
- If metrics are missing, report `unknown` rather than guessing.

## Companion specs
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
- `projects/openclaw-core/docs/queue-triage-analyst-runbook.md`

## Related backlog item
- `projects/openclaw-core/backlog/queue.md` item 5

## Acceptance criteria
- A reviewer can see queue pressure at a glance.
- The snapshot is reproducible from files or telemetry.
- The report can be compared against the previous run without expanding scope.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 5.

## Related status note
- `projects/openclaw-core/docs/status.md`
