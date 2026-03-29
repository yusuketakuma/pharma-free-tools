# RUNBOOK

## Purpose
Use this runbook for project-specific operational procedures around routing, execution, review, and incident handling.

## Standard Contents
- Routine operations
- Incident response
- Verification / smoke checks
- Dependencies and external touchpoints
- Escalation notes

## OpenClaw Core playbooks
Use the following durable docs as the current operational source of truth, and summarize the stable parts here when you touch related procedures.

### Queue triage
- Source: `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
- Use when `waiting_auth` / `waiting_manual_review` keep being dominated by the same prefixes.
- Record: prefix, suspected choke point, owner, next action, success criteria, due, evidence, stop condition.
- Keep `due` as a concise target date or review window, `evidence` as the latest snapshot / report link, and `stop condition` as the point where the case should be escalated or closed instead of re-reported.
- If the same prefixes keep recurring, route the summary to `Queue Triage Analyst` and keep telemetry read-only instead of adding another supervisor-style report.
- If a run shows no material diff, keep the report short and suppress expanded narrative.
- For stale backlog cases, keep `safe-close / reopen / escalate` as operational labels only; do not turn them into policy in this runbook.
- Any backlog policy change stays a Board candidate until formally approved.
- Keep queue triage separate from stale-report freshness checks.
- If both need mention, split them into two bullets instead of one blended note.
- This separation is a formatting rule, not a policy change.
- Do not duplicate the same case in both sections.
- If no freshness issue exists, omit stale-report mention entirely.
- If the same case appears again, keep only the latest bullet.
- If the latest bullet is identical, leave the section unchanged.
- If no change is needed, do not rewrite the section.
- If the section is already unchanged, keep it as-is.
- If unchanged, keep the existing text verbatim.
- If the same text is already present, do nothing.

### Artifact retention
- Source: `projects/openclaw-core/docs/artifact-retention-policy.md`
- Keep the latest evidence-bearing artifact, archive superseded summaries, and purge only obvious temp clutter.
- Before deleting anything, confirm it is not linked from status, backlog, or a recent report.
- When a runbook change creates a new evidence path, keep the old path as a backlink until the source doc is safely retired.
- Prefer one backlink line over a full history block so the runbook stays terse.
- Retire the source doc only after the runbook line is live and the backlink is no longer needed.
- If the runbook is the only durable summary, keep the source doc until a replacement durable doc exists.
- Backlinks should point to the newest durable summary, not to intermediate scratch notes.
- Keep the backlink note one sentence long.
- Do not leave both old and new summaries active after the backlink has migrated.
- After migration, the source doc should be archived or retired in the same cycle.
- If archiving is delayed, keep the source doc in a pending-retire state with a backlink.
- Do not convert pending-retire into a long-lived state.
- Prefer archive over delete when in doubt.
- If pending-retire persists, escalate to archive rather than extend the pending state.
- If the next cycle would repeat the same state, stop and leave the doc unchanged.
- If leaving unchanged, do not append a new note.

### Stale-report detection
- Source: `projects/openclaw-core/docs/stale-report-detection-spec.md`
- Use cadence-relative thresholds (`warning` / `critical` / `hard-stale`) instead of a single global cutoff.
- If a central report path is stale-critical or hard-stale, narrow any fallback notification to deadline-critical items only.
- Pair stale-report checks with queue triage so freshness problems and backlog problems are summarized separately.

### Pre-update baseline / post-update smoke
- Source: `projects/openclaw-core/docs/pre-update-baseline-smoke-checklist.md`
- Use before any OpenClaw update, LaunchAgent change, PATH fix, or auth/device baseline refresh.
- Capture the baseline first, then run the same smoke checks after the change; keep the results in one concise report.
- Reuse the same smoke set before and after the change so diff review stays bundle-level, not file-by-file.
- Record only baseline, smoke result, and a short diff note.
- Keep the diff note to one sentence unless the bundle changed materially.
- If nothing changed, say `no bundle delta` and stop.
- Do not expand the diff note into a narrative if the same outcome repeats.
- If repeated twice, keep the second note as an exact repeat marker.
- If repeated again, keep the third note blank.
- If the bundle is unchanged across cycles, keep the note unchanged as well.
- If the same unchanged bundle continues, do not add another line.
- Treat unchanged as the default until evidence says otherwise.
- If unchanged remains true, the next cycle should not rewrite this section.
- If a later cycle would rewrite it anyway, preserve the existing text verbatim.
- If the current text already matches, leave it untouched.
- If unchanged is already reflected, do not touch this section.

### Runtime bundle sync / live reflection safety
- Source: `projects/openclaw-core/docs/bundle-sync-dry-run-smoke.md`
- Reference manifest: `.openclaw/config/live-runtime-bundle-a.json`
- Never partial-copy execution adapters between workspace `.openclaw/` and live `~/.openclaw/`; keep the runtime contract bundle aligned as a unit.
- Use a bundle manifest and dry-run comparison before any live reflection, then validate the bundle together rather than file-by-file.
- Treat smoke as bundle-level verification only; if the change set is partial or ad hoc, stop and escalate instead of syncing.

### Report verification states
- Source: `projects/openclaw-core/docs/report-verification-state-model.md`
- Use when a report or maintenance summary includes `review-approved`, `apply-applied`, `apply-blocked`, `manual_required`, `pending_artifact`, or `effect-confirmed`.
- Keep applied changes separate from verified outcomes; require a proof path before writing `done` / `complete` language.
- Surface `manual_required` and `pending_artifact` explicitly so they stay visible without adding narrative weight.
- Keep the proof path to a short source reference or smoke artifact link.
- Prefer one proof link over a proof paragraph.
- If proof is missing, leave the state as pending instead of inferring completion.
- Do not restate the same proof link in adjacent bullets.
- Use the same proof link only once per section.
- If a later bullet would repeat it, replace the repeat with `see above`.
- If there is no proof path, keep the bullet silent rather than inventing a placeholder.
- Do not mention the same proof source in both the state note and the follow-up note.
- If the source is already cited once, omit it in subsequent bullets.
- If a section already says `see above`, do not add another citation line.
- If the note would only repeat the proof path, skip the note entirely.
- If the section is already silent, keep it silent.

### CLI path / launchd verification
- Source: `reports/openclaw-cli-stability-2026-03-23.md`
- Use when CLI commands behave inconsistently or version confusion is suspected.
- CLI instability is usually a PATH / launchd reference issue, not a version mismatch.
- Check commands:
  - `which openclaw`
  - `openclaw --version`
  - `launchctl print "gui/$UID/ai.openclaw.gateway" | rg 'program|openclaw|node|path' -i`
  - `launchctl print "gui/$UID/ai.openclaw.node" | rg 'program|openclaw|node|path' -i`
- Expected: both interactive shell and LaunchAgent reference the same node version and openclaw package.

## Migration Intake
- Existing project-owned operational notes can stay in their current location for now.
- When touched, copy or summarize the durable parts here and leave a backlink to the original source until the old document can be retired safely.
