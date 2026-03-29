# Skill: verify-change

**Project**: CareRoute-RX
**When to invoke**: An improvement proposal has been applied to the project source files.

## Purpose

Run the project verification suite including PHI and security checks, detect regressions,
validate the expected improvement, and report outcome. PHI and security failures always
trigger rollback regardless of other results.

## Steps

### Step 1: Run Verification Commands

Run from the project source root (`/Users/yusuke/careroute-rx/`):

```bash
pnpm typecheck
pnpm lint
pnpm lint:secrets
pnpm check:phi-detection
pnpm check:security-guardrails
pnpm test
pnpm check:ci-contract
```

Capture exit codes and full output. A non-zero exit code from any command is a failure.

PHI detection and secret lint failures are treated as **critical** — they trigger immediate
rollback and block all further proposals for the affected file.

### Step 2: Check for Regressions

Compare against pre-change baseline:

- Were any previously-passing tests now failing?
- Did `pnpm check:phi-detection` pass before but fail now? (Critical regression)
- Did `pnpm lint:secrets` pass before but fail now? (Critical regression)
- Did `pnpm check:ci-contract` pass before but fail now?
- Did TypeScript error count increase?

Any critical regression (PHI or secret related) triggers immediate rollback and an
entry in `growth/ledgers/blocked-patterns.jsonl` with a `critical` severity marker.

### Step 3: Validate Metric Improvement

Confirm the improvement stated in `expected_impact` was achieved:

- Type error fix: verify `pnpm typecheck` reports fewer errors for the affected file.
- Test coverage improvement: verify coverage report shows improvement for the specific file.
- Lint fix: verify `pnpm lint` reports 0 errors for the affected file.
- Contract drift fix: verify `pnpm check:ci-contract` passes cleanly.

If the expected improvement is not observable, classify as `improvement_not_verified`.

### Step 4: Report Outcome

**Pass**: All commands exit 0, no regressions, expected impact confirmed.
Update proposal status to `verified`. Append to `logs/IMPROVEMENT_LOG.md`:

```
## <proposal_id> — <ISO8601 timestamp>
- File: <target_file>
- Classification: <classification>
- Result: VERIFIED
- PHI-adjacent: <true|false>
- Impact: <expected_impact>
```

**Critical Fail (PHI/secret regression)**: PHI detection or secret lint now fails.
Update proposal status to `rolled_back` immediately. Write rollback entry to
`growth/ledgers/rollback-journal.jsonl`. Mark pattern as `critical` in
`growth/ledgers/blocked-patterns.jsonl`. Send Telegram alert.

**Fail (regression)**: Previously-passing tests now fail.
Update proposal status to `rolled_back`. Write rollback entry and blocked pattern.

**Fail (verification_failed)**: Commands exit non-zero but no regression (fix did not work).
Update proposal status to `validation_failed`. Increment `retry_count`.
If `retry_count >= 3`, transition to `permanently_failed`.

**Inconclusive**: Environment issue prevented verification.
Update proposal status to `verification_inconclusive`. Do not roll back.
