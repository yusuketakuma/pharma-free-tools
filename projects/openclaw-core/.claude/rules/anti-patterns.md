# Anti-Patterns — OpenClaw Core

Known patterns that have caused failures or degraded quality in this project.

---

## AP-001: Proposal Applied Without Sandbox Validation

**Description**: Applying a proposal directly to live files without first staging it in
`sandboxes/improvement-preview/` and running verification. This bypasses the safety layer
and can corrupt live configuration.

**Detection Hint**: A proposal transitions from `approved` to `applied` without a corresponding
entry in the rollback journal, or without a sandbox validation step in the apply log.

**Recommended Fix**: The applier script must always write to sandbox first, run verification,
then apply to live. Never bypass this sequence. If verification fails, transition to
`validation_failed` and write to blocked-patterns.

---

## AP-002: Schema Field Added Without Backward Compatibility Check

**Description**: Adding a required field to a proposal or ledger schema without verifying
that existing files in `growth/proposals/` and `growth/ledgers/` remain valid.

**Detection Hint**: After a schema change, running the JSON validation loop over existing
proposal files produces KeyError or validation failures.

**Recommended Fix**: New fields must be optional with a default value, or a migration script
must update all existing files before the schema change is applied. Always run the batch
validation command after schema changes.

---

## AP-003: Policy YAML Referencing Non-Existent Project IDs

**Description**: `routing-policy.yaml` or `approval-policy.yaml` contains project identifiers
(e.g., `deadstocksolution`, `careroute-rx`) that no longer match the actual project directory
names, causing routing failures.

**Detection Hint**: A project directory was renamed but the YAML policy files were not updated.
The mismatch is detected when a task is routed to a non-existent project.

**Recommended Fix**: When renaming a project directory, search all YAML policy files for the
old name and update them atomically. Validate YAML after changes.

---

## AP-004: Agent-Paused Flag Left Active

**Description**: The `growth/ledgers/agent-paused.json` pause flag is written during a
behavioral anomaly but never cleared after the anomaly is resolved, leaving the improvement
system permanently disabled.

**Detection Hint**: The paused flag file exists and contains `"paused": true` but the
corresponding anomaly has been investigated and resolved.

**Recommended Fix**: After resolving an anomaly, explicitly clear the flag by setting
`"paused": false` and writing the resolution reason and timestamp. Add a monitoring check
that alerts if the flag has been `true` for more than 24 hours.

---

## AP-005: Blocked-Patterns Ledger Growing Unbounded

**Description**: Every regression writes a new entry to `blocked-patterns.jsonl` but entries
are never archived or pruned, making the file grow without bound and slowing pattern matching.

**Detection Hint**: `wc -l growth/ledgers/blocked-patterns.jsonl` returns a value above 100.

**Recommended Fix**: Periodically archive resolved or superseded patterns. Patterns that have
not triggered in 90 days should be moved to an archive file. This requires a manual review
pass before archiving to avoid removing still-relevant entries.

---

## AP-006: Python 3.9 Incompatible Type Annotations

**Description**: Using Python 3.10+ union syntax (`X | Y`) or built-in generic aliases
(`dict[str, int]`, `list[str]`) without `from __future__ import annotations`, causing
`TypeError` at runtime on the system Python 3.9.6.

**Detection Hint**: A script uses `def foo(x: int | None)` or returns `dict[str, ...]`
without the `__future__` import. Runtime error: `TypeError: unsupported operand type(s)
for |: 'type' and 'NoneType'`.

**Recommended Fix**: Add `from __future__ import annotations` at the top of every Python
file, or use `typing.Optional[X]`, `typing.Dict[str, int]`, `typing.List[str]` explicitly.
