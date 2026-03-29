# Skill: diagnose-failure

**Project**: OpenClaw Core
**When to invoke**: A script error, schema validation failure, policy inconsistency, or
test failure is observed in task artifacts.

## Purpose

Collect evidence, identify the root cause, classify the failure, and produce a structured
diagnosis. Because OpenClaw Core affects all projects, every diagnosis must include an
impact scope assessment.

## Steps

### Step 1: Collect Logs

Gather all available failure output:

- Python syntax check: `python3 -m compileall scripts/`
- Test log: `python3 -m pytest /Users/yusuke/.openclaw/tests/ -v`
- YAML validation: YAML parse result for modified policy files
- JSON validation: JSON parse result for modified schema or proposal files
- Ledger integrity: JSONL validation of rollback-journal and blocked-patterns
- Script error: full traceback if a script raised an exception at runtime

Record the full error message, file path, and line number for each failure.

### Step 2: Identify Root Cause

1. Python syntax or import error? Identify the missing module or syntax issue.
   Check for Python 3.9 incompatible syntax (union types, built-in generics).
2. YAML parse failure? Identify the malformed line in the policy file.
3. JSON parse failure? Identify the malformed section in the schema or proposal file.
4. Test assertion failure? Trace the logic difference between expected and actual.
5. Ledger inconsistency? Identify the orphaned or malformed entry.
6. Protected path touched? Identify which protected file was modified without approval.

### Step 3: Classify the Failure

| Class | Description | Portfolio Impact |
|-------|-------------|-----------------|
| `protected-path-violation` | A protected config/schema was modified without approval | High |
| `policy-syntax-error` | YAML policy file is not parseable | High |
| `schema-validation-failure` | A proposal or ledger JSON fails schema validation | Medium |
| `python-syntax-error` | Script has a syntax error (including Python version compat) | Low |
| `python-import-error` | Script imports a module that does not exist | Low |
| `test-assertion` | A test assertion fails | Low |
| `ledger-corruption` | A ledger file contains an invalid entry | Medium |
| `orphaned-proposal` | A proposal file has an unknown or terminal status | Low |
| `unknown` | Cannot determine from evidence | Treat as High |

### Step 4: Propose Fix Direction

- `protected-path-violation`: Do not auto-fix. Escalate immediately with the list of modified
  protected files and which protection was violated.
- `policy-syntax-error`: Correct the YAML syntax error. Validate before proposing.
- `schema-validation-failure`: Add the missing field as optional, or correct the malformed value.
- `python-syntax-error`: Fix the syntax. If Python 3.9 incompatibility, add
  `from __future__ import annotations` or use `typing` module aliases.
- `python-import-error`: Add the missing module or correct the import path.
- `test-assertion`: Determine whether expectation or implementation is wrong.
- `ledger-corruption`: Archive the corrupt entry and document the anomaly.
- `orphaned-proposal`: Transition the proposal to `permanently_failed` with a note.
- `unknown`: Escalate with full log context and portfolio impact assessment.

## Output

```json
{
  "classification": "<class>",
  "portfolio_impact": "high | medium | low",
  "file": "<file-path>",
  "line": <line-number-or-null>,
  "error_message": "<exact error text>",
  "root_cause": "<one sentence>",
  "fix_direction": "<what to do>",
  "confidence": "high | medium | low",
  "requires_owner_approval": true
}
```

Pass this to the `propose-fix` skill. `requires_owner_approval` is always `true` for
OpenClaw Core proposals.
