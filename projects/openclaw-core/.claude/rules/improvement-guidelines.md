# Improvement Guidelines — OpenClaw Core

## Project Posture: Infrastructure — Policy Consistency and System Reliability

OpenClaw Core is the control plane for the entire portfolio. Changes here affect all projects.
Self-improvement proposals must be minimal, well-justified, and consistent with existing policies.
Every proposal requires owner approval regardless of risk tier.

## Signals to Emit

Emit improvement signals when the following are observed in task artifacts:

- A policy file (routing-policy.yaml, approval-policy.yaml) contains a reference to a
  non-existent project or agent role
- A schema file in `schemas/` is out of sync with the actual fields used in proposals/ledgers
- An improvement proposal fails validation due to a missing required field in the schema
- The rollback journal references a file path that no longer exists
- Telegram alert config references a botToken field that is empty or placeholder
- A script in `scripts/` imports a module that does not exist
- Blocked-patterns ledger grows beyond 100 entries without a cleanup pass

Signal format: emit to `growth/proposals/` as a JSON file following the standard proposal schema.

## Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Policy validation errors | 0 | > 0 |
| Schema validation failures | 0 | > 0 |
| Orphaned proposal files (status unknown) | 0 | > 3 |
| Rollback rate | < 5% of applied proposals | > 10% |
| Blocked-patterns ledger size | < 100 entries | >= 100 |
| Agent-paused flag active | false | true for > 24h |

## Acceptable Proposals

- Correcting a typo or stale reference in a policy YAML (with approval)
- Adding a missing field to a schema that is already used in practice
- Updating a script's import path when a module was renamed
- Archiving resolved entries in blocked-patterns.jsonl
- Adding a new proposal status value that is already handled in code
- Improving log verbosity in an improvement script (not logic changes)

## Off-Limits (Never Auto-Apply)

- `openclaw.json` — requires explicit owner approval
- `config/routing-policy.yaml` — routing logic is protected
- `config/approval-policy.yaml` — approval thresholds are protected
- `schemas/*.json` — schema changes affect all consumers
- `org/organization.md` — organizational structure is owner-managed
- Telegram config (`cowork/engine/telegram-config.json`)
- Any change to the proposal lifecycle state machine
- Any change to authentication, trust, or permission policy
- Modifications to the rollback or pause mechanisms
