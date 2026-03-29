# Skill: propose-fix

**Project**: OpenClaw Core
**When to invoke**: A `diagnose-failure` diagnosis is available.

## Purpose

Generate a minimal fix proposal for OpenClaw Core issues. Because every change here
affects the entire portfolio, all proposals require owner approval. The propose-fix skill
generates the proposal content and sets the appropriate review gates — it never auto-applies.

## Steps

### Step 1: Review the Diagnosis

Read the diagnosis object from `diagnose-failure`. Confirm:

- Classification is not `unknown` (escalate if unknown)
- `portfolio_impact` is known (high/medium/low)
- The affected file is not in the protected path list from `improvement-guidelines.md`

If the affected file is on the protected path list: output a proposal with
`status: "requires_owner_approval"` and `diff: null`. Do not generate a fix. Stop here.

Protected paths (never auto-fix):
- `openclaw.json`
- `config/routing-policy.yaml`
- `config/approval-policy.yaml`
- `schemas/*.json`
- `org/organization.md`
- `cowork/engine/telegram-config.json`

### Step 2: Generate a Minimal Fix

Generate the smallest diff that addresses the root cause:

- Fix exactly one issue per proposal.
- For `python-syntax-error` or `python-import-error`: correct the specific line only.
  Add `from __future__ import annotations` at the file top if needed for Python 3.9 compat.
- For `ledger-corruption`: archive the corrupt entry; do not delete it.
- For `orphaned-proposal`: update the `status` field of the proposal JSON.
- Do not modify any protected path files.
- Do not change proposal lifecycle logic, trust policy, or rollback mechanisms.

Produce the fix as a unified diff.

### Step 3: Validate Scope

Before finalizing, verify:

- [ ] No file in the diff is a protected path
- [ ] The diff touches at most 1 file (OpenClaw Core changes should be atomic)
- [ ] The diff does not change the proposal status machine logic
- [ ] The diff does not weaken any pause, rollback, or blocked-patterns mechanism
- [ ] Python syntax is 3.9-compatible (no `X | Y` union, no `dict[...]` generics without future import)

If any validation fails, set `requires_owner_approval: true` and include the specific
validation failure in `validation_notes`.

### Step 4: Estimate Risk

All OpenClaw Core proposals are treated as at least `medium` risk given portfolio-wide impact.

| Tier | Criteria |
|------|----------|
| `medium` | Script fix (syntax, import, Python compat) in a non-critical script |
| `high` | Ledger correction, orphaned proposal resolution, any config-adjacent change |

There is no `low` tier for OpenClaw Core proposals.

### Step 5: Output Proposal

Write a proposal JSON to `growth/proposals/<proposal_id>.json`:

```json
{
  "proposal_id": "<uuid>",
  "status": "approved",
  "project": "openclaw-core",
  "target_file": "<primary-changed-file>",
  "diff": "<unified-diff-string>",
  "expected_impact": "<one sentence describing the improvement>",
  "classification": "<from diagnosis>",
  "risk_tier": "medium | high",
  "portfolio_impact": "high | medium | low",
  "requires_owner_approval": true,
  "validation_notes": "<any scope validation concerns, or null>",
  "retry_count": 0,
  "created_at": "<ISO8601 timestamp>"
}
```

`requires_owner_approval` is always `true` for OpenClaw Core. The applier will not
proceed without an explicit owner approval action.
