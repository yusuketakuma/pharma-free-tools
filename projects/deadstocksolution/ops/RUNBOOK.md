# RUNBOOK

## Purpose
Use this runbook for maintenance procedures, recurring checks, and project-specific incident/operations notes.

## Standard Contents
- Routine operations
- Incident response
- Verification / smoke checks
- Dependencies and external touchpoints
- Escalation notes

## DDS Agent Runner

### Connection lifecycle
- register → heartbeat → claim → dispatch → callback/report → cleanup
- Source: `reports/dds-agent-overall-review-2026-03-24.md`

### Post-register safety
- After successful register, delete `DDS_AGENT_BOOTSTRAP_TOKEN` from `.env.local`.
- On complete/failed/blocked, clear `activeWorkItemId` and `activeRequestId` from `state.json`.
- Source: `reports/dds-agent-overall-review-2026-03-24.md`

### Known hazards
- launchd contention can cause transient 401 on overlapping register/heartbeat.
- Stale state may retain active fields after completion.
- Source: `reports/dds-agent-overall-review-2026-03-24.md`

## Migration Intake
- Existing project-owned operational notes can stay in their current location for now.
- When touched, copy or summarize the durable parts here and leave a backlink to the original source until the old document can be retired safely.
