# Improvement Ledger

## Purpose
Record project-specific improvements, postmortems, and repeatable lessons for the OpenClaw core here.

## Entry Format
- Date
- Change / observation
- Why it mattered
- Follow-up

## Entries
- 2026-03-22
  - Change / observation: Reporting source of truth moved to `org/` + `reports/company/`, and old `homecare/` / `sidebiz/` / `trainer/` flow was retired from active operations.
  - Why it mattered: It reduced mixed ownership and made portfolio / project / execution-system boundaries clearer.
  - Follow-up: Keep new operational learnings in project docs and avoid reviving old report lines as active control paths.
- 2026-03-23
  - Change / observation: A 39-hour reporting stop showed that CEO / trainer-style central reporting was a single point of operational failure.
  - Why it mattered: Deadline tracking and anomaly detection both stopped, consuming limited response windows for time-sensitive tasks.
  - Follow-up: Add stale-report detection, fallback reminder routing, and direct escalation rules for deadline-critical items.
- 2026-03-23
  - Change / observation: Quality claims became more trustworthy when validated against files directly (for example grep / file count checks), while report-only status was error-prone.
  - Why it mattered: It prevented repeated gaps between reported coverage and actual workspace state.
  - Follow-up: Require evidence-based verification before closing large batch maintenance or quality tasks.
- 2026-03-23
  - Change / observation: Test and runtime artifacts (`.openclaw/tasks/`, temporary `*.html.tmp`) accumulated without an explicit retention policy.
  - Why it mattered: Artifact sprawl makes review, cleanup, and future triage harder even when individual runs succeed.
  - Follow-up: Define retention buckets (keep / archive / purge) and a safe cleanup checklist.
- 2026-03-24
  - Change / observation: Queue counts alone (`waiting_auth`, `waiting_manual_review`) were not enough to judge urgency; age, delta, and task-prefix breakdown are needed to distinguish stale accumulation from active pressure.
  - Why it mattered: Raw counts can trigger noisy escalation or hide real backlog growth, which slows approval / runtime triage.
  - Follow-up: Add a read-only queue telemetry snapshot under `reports/cron/` and use it in heartbeat/review flow.
- 2026-03-24
  - Change / observation: Drafted a cadence-relative stale-report detection spec for CEO / department jobs and a narrow fallback policy for deadline-critical reminders.
  - Why it mattered: The portfolio should surface missed reporting before it turns into silent operational blindness.
  - Follow-up: Implement a read-only stale-report snapshot, then wire fallback routing only for deadline-critical items.
- 2026-03-24
  - Change / observation: Added a read-only queue telemetry snapshot for `.openclaw/runtime/queue`, showing 476 `waiting_auth` and 343 `waiting_manual_review` entries with concentrated prefixes and no invalid JSON.
  - Why it mattered: Queue counts plus age/prefix breakdown make stale backlog visible and stop us from mistaking repetitive routing noise for active progress.
  - Follow-up: Keep the snapshot in `reports/cron/` and reuse it as the baseline for heartbeat and rebalance decisions.
- 2026-03-24
  - Change / observation: Apparent CLI instability was caused more by invocation-path ambiguity than by version drift.
  - Why it mattered: Shell PATH drift and LaunchAgent target drift can mimic upgrade regressions and waste debugging time.
  - Follow-up: Verify fixed CLI path and LaunchAgent `ProgramArguments` as part of every update or incident check.
- 2026-03-24
  - Change / observation: Pre-update baselines made it easier to treat `gateway.probe_failed` / `missing scope: operator.read` as a probe-specific warning instead of an immediate service outage when Telegram and browser control were still healthy.
  - Why it mattered: Baseline-aware interpretation prevents unnecessary rollback or panic during upgrades and auth troubleshooting.
  - Follow-up: Capture baseline snapshots before updates and compare them against a defined post-update smoke checklist.
- 2026-03-25
  - Change / observation: Read-only queue telemetry was useful for visibility, but repetitive prefixes needed a dominant-prefix triage checklist before the backlog could actually shrink.
  - Why it mattered: Observability without action can repeat the same diagnosis forever and leave blocked prefixes untouched.
  - Follow-up: Keep telemetry as the input, then route repeated prefixes into the new triage checklist with owner / next action / success criteria.
- 2026-03-25
  - Change / observation: Sidebiz scouting became much more reusable when adjacent pain points were separated and every candidate carried owner / due / success criteria.
  - Why it mattered: It prevented false comparison across different entry points (for example quote follow-up vs missed-call) and made next-step execution measurable.
  - Follow-up: Keep `docs/sidebiz/scout-rubric.md` mandatory and reject candidate lists that merge distinct problem classes.
- 2026-03-25
  - Change / observation: DDS remote runner reached live register / heartbeat / claim / E2E, and the review surfaced a general hardening pattern: delete bootstrap secrets after registration and clear active state on terminal callbacks.
  - Why it mattered: Stale secrets and stale active fields create avoidable security and correctness risk in long-lived remote workers.
  - Follow-up: Apply the same cleanup pattern to other launcher-like or remote-worker flows, and add jitter/backoff when retries are introduced.
- 2026-03-26
  - Change / observation: Repeated dominant-prefix telemetry should route to a dedicated Queue Triage Analyst path, and stale `waiting_auth` / `waiting_manual_review` backlog after auth recovery should be treated as a board-routed safe-close / reopen problem rather than another telemetry-only report.
  - Why it mattered: It keeps supervisor reports from repeating the same diagnosis and makes backlog closure criteria explicit.
  - Follow-up: Keep telemetry read-only, suppress duplicate supervisor-style reports, and require owner / next action / success criteria before reopening or closing stale backlog.
- 2026-03-26
  - Change / observation: Live workspace ↔ runtime reflection showed that partial adapter sync is unsafe; runtime contract changes need to move as a bundle with dry-run comparison.
  - Why it mattered: A file-by-file overwrite can break compatibility between workspace and live `~/.openclaw` even when individual scripts look healthy.
  - Follow-up: Use bundle manifest + dry-run sync before any live reflection, and keep the runtime contract bundle aligned as a unit.

- 2026-03-27
  - Change / observation: Report lifecycle states need to stay separate from effect confirmation; `review-approved`, `apply-applied`, `apply-blocked`, `manual_required`, `pending_artifact`, and `effect-confirmed` are not interchangeable.
  - Why it mattered: Applied artifacts can still be pending manual cleanup or downstream verification, so collapsing the states hides real operational risk.
  - Follow-up: Use the new report verification state model and require proof paths before calling completion claims verified.
