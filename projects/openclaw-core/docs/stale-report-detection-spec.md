# Stale-Report Detection / Fallback Notification Spec

## Purpose
Detect when CEO / department reporting jobs stop producing expected outputs, and route only deadline-critical items to a fallback path so the portfolio does not go blind.

## Scope
- CEO / department reporting jobs
- Deadline-critical reminders that currently depend on the central reporting flow
- Read-only detection and escalation logic only

## Source of truth
- `cron` job state / last successful run timestamp
- report artifacts under `reports/company/` and `reports/cron/`
- current reporting cadence defined in job schedules

## Detection model
For each tracked job:
1. Record the most recent successful run timestamp.
2. Infer the expected cadence from the job schedule.
3. Compare `now - last_success_at` against cadence-based thresholds.

### Suggested thresholds
Use cadence-relative thresholds instead of a single global number:
- **Warning**: elapsed time > `1.5x` expected cadence
- **Critical**: elapsed time > `2x` expected cadence
- **Hard stale**: no success in `24h` for jobs that should run multiple times per day

Examples:
- 6-hour reporting jobs
  - warning: 9h
  - critical: 12h
  - hard stale: 24h
- daily jobs
  - warning: 36h
  - critical: 48h
  - hard stale: 72h

## Escalation rules
### Warning
- Mark the job as stale-watch.
- Surface the missing-run context in the next regular report.
- Do not notify externally yet.

### Critical
- Mark the job as stale-critical.
- Create a fallback candidate list for deadline-sensitive items tied to that job.
- Prefer internal routing or report aggregation first.

### Hard stale
- If the job is tied to deadline-critical reminders, emit a fallback notification candidate.
- Keep the message narrow: what was missed, what is affected, what needs human attention now.

## Fallback notification policy
Fallback notifications are allowed only when all of the following are true:
- The item is deadline-critical.
- The central reporting path is stale-critical or hard stale.
- The item has not already been escalated in the last dedupe window.
- The notification does not change auth / trust boundary / Telegram root settings.

### Deduplication window
- Default: 6 hours
- If the same item remains unresolved, re-announce only when severity increases.

## Output format
A stale-report check should emit:
- job name
- last success time
- expected cadence
- elapsed time
- severity (`ok` / `warning` / `critical` / `hard-stale`)
- affected fallback items
- next action

## Non-goals
- Do not auto-modify auth / routing / trust boundary settings.
- Do not send broad notifications for non-critical jobs.
- Do not treat a probe-specific warning as an outage without a baseline check.

## Acceptance criteria
- Stale jobs can be identified without reading manual notes.
- Deadline-critical items have a documented fallback path.
- The output is readable enough to feed into heartbeat / regular report jobs.
- Detection remains read-only until a separate implementation task is approved.

## Follow-up tasks
- Add a read-only stale-report snapshot to `reports/cron/`.
- Add fallback routing for deadline-critical reminders.
- Link this spec from `projects/openclaw-core/backlog/queue.md`.
- Link the fallback message shape from `projects/openclaw-core/docs/fallback-notification-output-spec.md`.
- Link the read-only snapshot shape from `projects/openclaw-core/docs/stale-report-snapshot-spec.md`.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 1.
- Related status note: `projects/openclaw-core/docs/status.md`.
