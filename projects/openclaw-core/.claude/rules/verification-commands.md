# Verification Commands — OpenClaw Core

Run these commands from the OpenClaw root (`/Users/yusuke/.openclaw/`) after any change.

## Required After Every Change

```bash
python3 -m py_compile scripts/<changed-file>.py   # Syntax check for any modified Python script
```

## YAML Policy Validation

```bash
# Validate routing policy syntax
python3 -c "import yaml; yaml.safe_load(open('config/routing-policy.yaml'))"

# Validate approval policy syntax
python3 -c "import yaml; yaml.safe_load(open('config/approval-policy.yaml'))"
```

## JSON Schema / Config Validation

```bash
# Validate openclaw.json is well-formed
python3 -c "import json; json.load(open('openclaw.json'))"

# Validate a proposal file
python3 -c "import json; json.load(open('growth/proposals/<file>.json'))"

# Validate all proposal files
python3 -c "
import json, pathlib
for p in pathlib.Path('growth/proposals').glob('*.json'):
    try:
        json.load(open(p))
        print('OK:', p.name)
    except Exception as e:
        print('FAIL:', p.name, e)
"
```

## Python Script Tests

```bash
# Run all tests in the tests directory
python3 -m pytest /Users/yusuke/.openclaw/tests/ -v

# Run a specific test file
python3 -m pytest /Users/yusuke/.openclaw/tests/test_self_improvement_loop.py -v
python3 -m pytest /Users/yusuke/.openclaw/tests/test_improvement_proposals.py -v
python3 -m pytest /Users/yusuke/.openclaw/tests/test_improvement_safety.py -v
```

## Script Syntax Checks (Batch)

```bash
python3 -m compileall scripts/
```

## Ledger Integrity Checks

```bash
# Check rollback journal is valid JSONL
python3 -c "
import json
with open('growth/ledgers/rollback-journal.jsonl') as f:
    for i, line in enumerate(f, 1):
        line = line.strip()
        if line:
            try:
                json.loads(line)
            except Exception as e:
                print(f'Line {i}: {e}')
"
```

## Notes

- Python version is 3.9.6. Do not use `X | Y` union syntax or `dict[str, ...]` generics directly;
  use `from __future__ import annotations` or `typing.Optional`, `typing.Dict`, etc.
- There is no `npm` or `pnpm` in this project; all tooling is Python or shell scripts.
- Policy YAML files must remain valid after any edit — always run YAML validation.
- Never run verification commands that push to remote or apply proposals to live files.
