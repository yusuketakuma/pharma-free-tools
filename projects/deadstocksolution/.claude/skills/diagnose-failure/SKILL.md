# Skill: diagnose-failure

**Project**: DeadStockSolution
**When to invoke**: A test failure, build failure, or runtime error is observed in task artifacts.

## Purpose

Collect evidence, identify the root cause, classify the failure type, and produce a structured
diagnosis that the `propose-fix` skill can consume.

## Steps

### Step 1: Collect Logs

Gather all available failure output:

- Build log: output of `npm run build:server` or `npm run build:client`
- Test log: output of `npm run test`, `npm run test:server`, or `npm run test:client`
- TypeScript errors: output of `npm run typecheck`
- Lint errors: output of `npm run lint`
- Coverage report: output of `npm run test:coverage` (look for threshold failures)

Record the full error message, file path, and line number for each failure.

### Step 2: Identify Root Cause

Work from the most specific error outward:

1. Is the error a TypeScript type error? Locate the type mismatch and its origin.
2. Is it a test assertion failure? Compare expected vs. actual values and trace the logic.
3. Is it a build failure? Check for missing imports, syntax errors, or misconfigured bundler.
4. Is it a coverage threshold failure? Identify which file/function is uncovered.
5. Is it a lint error? Note the rule name and the offending line.

Confirm that the error is reproducible by checking whether the log is deterministic.

### Step 3: Classify the Failure

Assign one of the following classifications:

| Class | Description |
|-------|-------------|
| `type-error` | TypeScript type mismatch or missing type annotation |
| `test-assertion` | A test assertion fails due to incorrect logic or wrong expected value |
| `build-error` | Syntax error, missing import, or bundler misconfiguration |
| `coverage-gap` | Code path not exercised by any test |
| `lint-violation` | ESLint rule violated |
| `flaky-test` | Test passes and fails non-deterministically |
| `schema-drift` | ORM schema out of sync with actual database or migration |
| `unknown` | Cannot determine root cause from available evidence |

### Step 4: Propose Fix Direction

Based on classification, state the fix direction:

- `type-error`: Correct the type annotation or add a type guard at the boundary.
- `test-assertion`: Determine whether the test expectation or the implementation is wrong.
  Do not change both simultaneously.
- `build-error`: Fix the specific syntax or import issue identified.
- `coverage-gap`: Write a test that exercises the uncovered branch.
- `lint-violation`: Apply the rule-specific fix or refactor to comply.
- `flaky-test`: Add determinism (mock timers, fixed seeds, stable async patterns).
- `schema-drift`: Generate and apply a migration.
- `unknown`: Escalate with full log context.

## Output

Produce a diagnosis object:

```json
{
  "classification": "<class>",
  "file": "<file-path>",
  "line": <line-number-or-null>,
  "error_message": "<exact error text>",
  "root_cause": "<one sentence>",
  "fix_direction": "<what to do>",
  "confidence": "high | medium | low"
}
```

Pass this to the `propose-fix` skill.
