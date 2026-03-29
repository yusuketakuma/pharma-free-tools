# Bundle Sync Dry-Run / Smoke Mini-Spec

## Purpose
Define the minimum safe procedure for reflecting workspace `.openclaw/` runtime changes into live `~/.openclaw/` **without partial-syncing execution adapters in isolation**.

## Scope
- workspace ↔ live `~/.openclaw` contract/runtime reflection
- bundle-level diffing and dry-run comparison
- smoke validation for the bundle, not file-by-file replacement

## Source bundle
- Manifest: `.openclaw/config/live-runtime-bundle-a.json`
- Bundle intent: minimum contract-preserving runtime bundle for OpenClaw → Claude Code handoff

## Non-goals
- Do not copy `run_claude_acp.py`, `run_claude_code.sh`, or `execute_task.py` alone.
- Do not change auth, approval, routing, or Telegram root settings.
- Do not publish a live sync before dry-run output is reviewed.
- Do not treat the manifest as a license for partial reflection.

## Dry-run procedure
1. **Load the manifest**
   - Read the bundle item list as the only allowed reflection surface.
2. **Check source existence**
   - Verify each manifest item exists in workspace.
3. **Check target existence**
   - Verify each item exists, or is intentionally absent, in live `~/.openclaw/`.
4. **Classify the diff**
   - `add`: present in workspace, absent in live.
   - `update`: present in both, content differs.
   - `keep`: present in both, content matches.
   - `missing`: manifest item absent from workspace.
5. **Stop on partial bundle risk**
   - If an execution adapter is the only changed item, stop and escalate.
6. **Record the bundle-level summary**
   - Keep the diff as a bundle summary, not a file-by-file narrative.

## Minimum smoke scope
Use smoke checks only after the bundle diff is acceptable.

### Workspace-side smoke
- Python files parse cleanly where applicable.
- Shell scripts pass `bash -n` where applicable.
- Schema files are present and readable.

### Live-side smoke
- Confirm the live target still points at the expected bundle surface.
- Confirm no file-by-file overwrite was performed.
- Confirm the reflected bundle still matches the manifest surface.

## Stop conditions
Stop and require board review if any of the following is true:
- manifest and actual files diverge in scope
- only a subset of runtime adapters is ready to sync
- a live target needs ad hoc manual correction
- dry-run would require changing protected boundaries
- smoke fails on the bundle as a whole

## Output template
```md
- bundle:
- manifest:
- dry-run summary:
- smoke summary:
- stop condition:
- next action:
```

## Related artifacts
- `reports/openclaw-live-runtime-reflection-audit-2026-03-25.md`
- `.openclaw/config/live-runtime-bundle-a.json`
- `projects/openclaw-core/ops/RUNBOOK.md`

## Related backlog item
- `projects/openclaw-core/backlog/queue.md` item 10

## Related status note
- `projects/openclaw-core/docs/status.md`
