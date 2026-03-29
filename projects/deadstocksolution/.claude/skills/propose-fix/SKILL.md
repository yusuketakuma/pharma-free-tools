# Skill: propose-fix

**Project**: DeadStockSolution
**When to invoke**: A `diagnose-failure` diagnosis is available and ready to act on.

## Purpose

Generate a minimal, safe fix based on the diagnosis. Validate that the fix stays within
the acceptable proposal scope for this project. Estimate risk and output a proposal
ready for the improvement pipeline.

## Steps

### Step 1: Review the Diagnosis

Read the diagnosis object from `diagnose-failure`. Confirm:

- Classification is one of the known types (not `unknown` — escalate if unknown)
- Confidence is `high` or `medium` (escalate if `low`)
- The affected file is not in the off-limits list from `improvement-guidelines.md`

If any check fails, do not generate a fix. Escalate with reason.

### Step 2: Generate a Minimal Fix

Generate the smallest diff that addresses the root cause:

- Fix exactly one issue per proposal. Do not bundle unrelated changes.
- Prefer changes to non-critical files (test files, utility modules) over core logic.
- If the fix requires touching a protected file (middleware, schema, migrations), stop and
  escalate — do not include protected file changes in the proposal.
- The fix must not reduce test coverage, remove assertions, or add `eslint-disable` comments.

Produce the fix as a unified diff (`--- a/file`, `+++ b/file` format).

### Step 3: Validate Scope

Before finalizing, verify:

- [ ] The diff touches at most 2 files
- [ ] No file in the diff is in the off-limits list (`improvement-guidelines.md`)
- [ ] The diff does not remove any test assertions
- [ ] The diff does not lower any coverage threshold
- [ ] The diff does not add `any` type annotations or `eslint-disable` comments
- [ ] The diff does not modify `server/src/middleware/`, `server/src/db/schema.ts`,
      or Drizzle migration files

If any validation fails, mark the proposal as `requires_human_judgment`.

### Step 4: Estimate Risk

Assign a risk tier:

| Tier | Criteria |
|------|----------|
| `low` | Only test files changed, or pure comment/doc changes |
| `medium` | Non-auth, non-schema source file changed; logic is straightforward |
| `high` | Multiple files changed, or change touches data flow / API contracts |

`high` tier proposals require manual review and cannot be auto-applied.

### Step 5: Output Proposal

Write a proposal JSON to `growth/proposals/<proposal_id>.json`:

```json
{
  "proposal_id": "<uuid>",
  "status": "approved",
  "project": "deadstocksolution",
  "target_file": "<primary-changed-file>",
  "diff": "<unified-diff-string>",
  "expected_impact": "<one sentence describing the improvement>",
  "classification": "<from diagnosis>",
  "risk_tier": "low | medium | high",
  "requires_manual_review": false,
  "retry_count": 0,
  "created_at": "<ISO8601 timestamp>"
}
```

Set `requires_manual_review: true` for `high` risk tier or if the scope validation had
any concerns. Do not set `applied_at` — the applier sets this field.
