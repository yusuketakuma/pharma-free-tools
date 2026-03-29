# Skill: verify-change

**Project**: DeadStockSolution
**When to invoke**: An improvement proposal has been applied to the project source files.

## Purpose

Run the project verification suite, check for regressions, validate that the expected
metrics improvement was achieved, and report a pass/fail outcome to the improvement pipeline.

## Steps

### Step 1: Run Verification Commands

Run the full verification suite from the project source root (`workspace/DeadStockSolution/`):

```bash
npm run typecheck
npm run lint
npm run test:server
npm run test:client
npm run test:coverage
```

Capture exit codes and full output for each command. A non-zero exit code from any command
is a verification failure.

### Step 2: Check for Regressions

Compare the test results against the baseline (pre-change results):

- Were any previously-passing tests now failing? This is a regression.
- Did coverage percentages decrease for any metric (Lines, Functions, Branches)?
- Did the number of TypeScript errors increase?
- Did the number of ESLint errors or warnings increase?

A regression in any metric is a verification failure even if all commands exit 0.

### Step 3: Validate Metric Improvement

Confirm the improvement stated in `expected_impact` was achieved:

- If the proposal claimed to fix a type error: verify `npm run typecheck` reports 0 errors.
- If the proposal claimed to add test coverage: verify the coverage report shows improvement
  for the specific file mentioned.
- If the proposal claimed to fix a lint violation: verify `npm run lint` reports 0 errors
  for the affected file.

If the expected improvement is not observable in the output, classify as `improvement_not_verified`.

### Step 4: Report Outcome

Write the verification result to the improvement log and update the proposal status.

**Pass**: All commands exit 0, no regressions, expected impact confirmed.
Update proposal status to `verified`. Append to `logs/IMPROVEMENT_LOG.md`:

```
## <proposal_id> — <ISO8601 timestamp>
- File: <target_file>
- Classification: <classification>
- Result: VERIFIED
- Impact: <expected_impact>
```

**Fail (regression)**: One or more previously-passing tests now fail.
Update proposal status to `rolled_back`. Write a rollback entry to
`growth/ledgers/rollback-journal.jsonl`. Append the regression details to
`growth/ledgers/blocked-patterns.jsonl`.

**Fail (verification_failed)**: Commands exit non-zero but no regression detected
(i.e., the fix did not work). Update proposal status to `validation_failed`. Increment
`retry_count`. If `retry_count >= 3`, transition to `permanently_failed`.

**Inconclusive**: Verification could not be run (missing tools, environment issue).
Update proposal status to `verification_inconclusive`. Do not roll back.
