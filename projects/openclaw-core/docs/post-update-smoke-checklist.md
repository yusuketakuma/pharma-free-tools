# Post-update Smoke Checklist

## Purpose
Verify the most important paths after an OpenClaw update so drift is caught immediately.

## Scope
Use this checklist after an OpenClaw update or runtime sync.

## Checklist
1. Confirm CLI path works.
2. Confirm LaunchAgent target is healthy.
3. Send and receive a Telegram test message if applicable.
4. Confirm browser control works.
5. Confirm cron or scheduled execution is still functioning.
6. Confirm subagent spawn still works.

## Output shape
Prefer a short block such as:
- CLI: `ok / fail`
- LaunchAgent: `ok / fail`
- Telegram: `ok / fail / n-a`
- browser: `ok / fail`
- cron: `ok / fail`
- subagent spawn: `ok / fail`

## Acceptance criteria
- The smoke check is short enough to run right after an update.
- Critical execution paths are covered.
- Failures are visible without extra interpretation.
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 7.
- Related status note: `projects/openclaw-core/docs/status.md`.
