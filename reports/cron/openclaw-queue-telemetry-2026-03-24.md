# OpenClaw Queue Telemetry Snapshot — 2026-03-24

## Conclusion
The blocked runtime queues are **large but structurally simple**: only `waiting_auth` and `waiting_manual_review` are currently populated in `.openclaw/runtime/queue`, and both have the same age band and highly repetitive prefixes.

## Snapshot scope
- Source: `.openclaw/runtime/queue/**/*.json`
- Mode: read-only telemetry snapshot
- Invalid JSON count: **0**

## Current counts
| Queue | Count | Oldest mtime | Newest mtime | 24h delta |
|---|---:|---|---|---:|
| `waiting_auth` | 476 | 2026-03-22 15:55:33 JST | 2026-03-22 17:23:32 JST | 0 |
| `waiting_manual_review` | 343 | 2026-03-22 15:55:33 JST | 2026-03-22 17:23:23 JST | 0 |

## Top prefixes
### waiting_auth
1. `step6-dedupe` — 171
2. `step6-plan-auth-runtime` — 166
3. `lane-runtime-auth-ng` — 134
4. `step6-auth` — 1
5. `step6-lane-readonly-fallback` — 1

### waiting_manual_review
1. `step6-lane-write-blocked` — 167
2. `lane-runtime-partial-write` — 134
3. `step6-acp-mock-contract` — 40
4. `step6-auth` — 1
5. `step6-manual-review` — 1

## Interpretation
- `waiting_auth` is dominated by three repeatable prefixes, which suggests a routing/auth bottleneck rather than random queue noise.
- `waiting_manual_review` is similarly concentrated around partial-write / write-blocked flows, which suggests review gating is the main choke point.
- Because both queues share the same age band, the backlog looks **stale rather than freshly growing**.

## Recommended next action
1. Keep the new stale-report spec as the escalation policy reference.
2. Use this snapshot as the baseline for a dedicated queue-metrics artifact under `reports/cron/`.
3. If the same prefixes remain dominant in the next run, treat them as triage targets rather than generic backlog.

## Notes
- This snapshot is intentionally read-only.
- No auth, routing, or trust-boundary settings were changed.
