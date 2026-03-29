# Skill: verify-change

**Project**: OpenClaw Core
**When to invoke**: An improvement proposal has been applied to OpenClaw Core files,
after owner approval and sandbox validation have both completed.

## Purpose

Run verification checks, confirm no regressions in the improvement pipeline itself,
validate that the expected improvement was achieved, and report outcome. Because this is
infrastructure, verification failures here can block the entire portfolio's improvement system.

## Steps

### Step 1: Run Verification Commands

Run from the OpenClaw root (`/Users/yusuke/.openclaw/`):

```bash
python3 -m compileall scripts/
python3 -m pytest /Users/yusuke/.openclaw/tests/ -v
python3 -c "import yaml; yaml.safe_load(open('config/routing-policy.yaml'))"
python3 -c "import yaml; yaml.safe_load(open('config/approval-policy.yaml'))"
python3 -c "import json; json.load(open('openclaw.json'))"
```

Also run the batch proposal validation:

```bash
python3 -c "
import json, pathlib, sys
errors = []
for p in pathlib.Path('growth/proposals').glob('*.json'):
    try:
        json.load(open(p))
    except Exception as e:
        errors.append(str(p) + ': ' + str(e))
if errors:
    print('\n'.join(errors))
    sys.exit(1)
"
```

Capture exit codes and full output. Any non-zero exit is a failure.

### Step 2: Check for Regressions

- Did any previously-passing test now fail?
- Did policy YAML validation pass before but fail now? (Portfolio-critical regression)
- Did the proposal JSON batch validation introduce new failures?
- Did `python3 -m compileall` report new syntax errors?

A policy YAML or openclaw.json parse failure is **portfolio-critical** — it must trigger
immediate rollback and an alert. The improvement system cannot function if policy files
are malformed.

### Step 3: Validate Metric Improvement

- Script fix: verify `python3 -m compileall scripts/` reports 0 errors.
- Test fix: verify the specific test that was failing now passes.
- Ledger fix: verify the batch validation passes with no errors for the affected ledger.
- Orphaned proposal: verify the proposal file now has a terminal status.

If expected improvement is not observable, classify as `improvement_not_verified`.

### Step 4: Report Outcome

**Pass**: All commands exit 0, no regressions, expected impact confirmed.
Update proposal status to `verified`. Append to `logs/IMPROVEMENT_LOG.md`:

```
## <proposal_id> — <ISO8601 timestamp>
- File: <target_file>
- Classification: <classification>
- Portfolio impact: <high|medium|low>
- Result: VERIFIED
- Impact: <expected_impact>
```

**Critical Fail (policy/config regression)**: A policy YAML or `openclaw.json` is now
unparseable. Roll back immediately. Write rollback entry to
`growth/ledgers/rollback-journal.jsonl`. Send Telegram alert. Write the agent-paused flag
(`growth/ledgers/agent-paused.json`) until the issue is manually resolved.

**Fail (regression)**: Previously-passing tests now fail.
Update proposal status to `rolled_back`. Write rollback entry and blocked pattern.

**Fail (verification_failed)**: Commands exit non-zero but no regression.
Update proposal status to `validation_failed`. Increment `retry_count`.
If `retry_count >= 3`, transition to `permanently_failed`.

**Inconclusive**: Environment prevented verification (missing pytest, etc.).
Update proposal status to `verification_inconclusive`. Do not roll back. Alert owner.
