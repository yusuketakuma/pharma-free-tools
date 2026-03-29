# Skill: propose-fix

**Project**: CareRoute-RX
**When to invoke**: A `diagnose-failure` diagnosis is available and ready to act on.

## Purpose

Generate a minimal, safe fix based on the diagnosis. PHI-adjacent diagnoses are always
escalated for manual review — they are never auto-applied. Non-PHI fixes are validated
against the acceptable proposal scope and assigned a risk tier.

## Steps

### Step 1: Review the Diagnosis

Read the diagnosis object from `diagnose-failure`. Confirm:

- Classification is not `unknown` (escalate if unknown)
- Confidence is `high` or `medium` (escalate if `low`)
- `phi_adjacent` is `false` (if `true`, go directly to escalation — do not generate a diff)
- The affected file is not in the off-limits list from `improvement-guidelines.md`

If `phi_adjacent` is `true`: output a proposal with `requires_manual_review: true` and
`status: pending_human_review`. Do not include a diff. Stop here.

### Step 2: Generate a Minimal Fix

Generate the smallest diff that addresses the root cause:

- Fix exactly one issue per proposal.
- Prefer changes to test files and non-PHI utility code over application logic.
- Do not include changes to PHI-adjacent files, RBAC config, auth code, or `contracts/` schema.
- The fix must not remove test assertions, skip tests, or add `eslint-disable` comments.
- If fixing a `contract-drift`, update the consumer file to import from `contracts/` —
  do not modify the `contracts/` file itself in the same proposal.

Produce the fix as a unified diff.

### Step 3: Validate Scope

Before finalizing, verify:

- [ ] The diff touches at most 2 files
- [ ] No file contains PHI field names in the changed lines
- [ ] No file is in the off-limits list (`improvement-guidelines.md`)
- [ ] The diff does not remove test assertions or add `.skip`
- [ ] The diff does not modify RBAC, auth, CSP, or secret-handling code
- [ ] The diff does not modify `contracts/` schema definitions
- [ ] `pnpm lint:secrets` would pass on the resulting file (no new secret patterns)

If any validation fails, mark `requires_manual_review: true`.

### Step 4: Estimate Risk

| Tier | Criteria |
|------|----------|
| `low` | Only test files changed, or type annotation fix in non-PHI utility |
| `medium` | Non-PHI application logic changed; change is localized and testable |
| `high` | Multiple files changed, or any proximity to PHI/auth/security code |

`high` tier and any PHI-adjacent proposal require manual review.

### Step 5: Output Proposal

Write a proposal JSON to `growth/proposals/<proposal_id>.json`:

```json
{
  "proposal_id": "<uuid>",
  "status": "approved",
  "project": "careroute-rx",
  "target_file": "<primary-changed-file>",
  "diff": "<unified-diff-string>",
  "expected_impact": "<one sentence describing the improvement>",
  "classification": "<from diagnosis>",
  "risk_tier": "low | medium | high",
  "phi_adjacent": false,
  "requires_manual_review": false,
  "retry_count": 0,
  "created_at": "<ISO8601 timestamp>"
}
```

For PHI-adjacent proposals, set `diff: null`, `status: "pending_human_review"`, and
`requires_manual_review: true`.
