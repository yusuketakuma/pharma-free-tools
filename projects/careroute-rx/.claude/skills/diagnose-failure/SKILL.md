# Skill: diagnose-failure

**Project**: CareRoute-RX
**When to invoke**: A test failure, build failure, PHI detection failure, or runtime error is
observed in task artifacts.

## Purpose

Collect evidence, identify the root cause, classify the failure type, and produce a structured
diagnosis that the `propose-fix` skill can consume. PHI-adjacent failures are classified
separately and always require manual review.

## Steps

### Step 1: Collect Logs

Gather all available failure output:

- Quick check log: output of `pnpm check:fast`
- Full check log: output of `pnpm check:all` (if available)
- PHI detection: output of `pnpm check:phi-detection`
- Secret lint: output of `pnpm lint:secrets`
- Security guardrails: output of `pnpm check:security-guardrails`
- Test log: output of `pnpm test`
- TypeScript errors: output of `pnpm typecheck`
- CI contract: output of `pnpm check:ci-contract`

Record the full error message, file path, and line number for each failure.

### Step 2: Identify Root Cause

1. PHI detection failure? Identify which field name or data pattern triggered it.
   Mark this as PHI-adjacent — requires manual review regardless of other classification.
2. Secret lint failure? Identify the file and the pattern detected.
3. Security guardrail failure? Identify which policy was violated.
4. TypeScript error? Locate the type mismatch and its origin.
5. Test assertion failure? Compare expected vs. actual and trace the logic.
6. Contract validation failure? Identify which contract type diverged.
7. Build failure? Check for missing bindings, syntax errors, or Worker configuration issues.

### Step 3: Classify the Failure

| Class | Description | PHI-Adjacent? |
|-------|-------------|---------------|
| `phi-leak` | PHI field detected in log or non-PHI context | Yes |
| `secret-leak` | Credential or token detected in source | Yes |
| `security-policy` | Security guardrail or CSP violated | Yes |
| `type-error` | TypeScript type mismatch | No |
| `test-assertion` | Test assertion fails | No |
| `build-error` | Syntax or bundler error | No |
| `contract-drift` | Type diverged from contracts/ definition | No |
| `coverage-gap` | Uncovered code path | No |
| `lint-violation` | ESLint rule violated | No |
| `flaky-test` | Non-deterministic test | No |
| `unknown` | Cannot determine from evidence | Treat as Yes |

### Step 4: Propose Fix Direction

- `phi-leak`: Remove PHI from log statement; use redaction utility. Flag for manual review.
- `secret-leak`: Remove secret; move to Cloudflare binding. Flag for manual review.
- `security-policy`: Restore the violated policy. Do not auto-apply. Flag for manual review.
- `type-error`: Correct the annotation or add a type guard.
- `test-assertion`: Determine whether expectation or implementation is wrong.
- `build-error`: Fix the specific error identified.
- `contract-drift`: Update the consumer to use the type from `contracts/`.
- `coverage-gap`: Write a test for the uncovered path.
- `lint-violation`: Apply the rule-specific fix.
- `flaky-test`: Add determinism (mock timers, fixed seeds).
- `unknown`: Escalate with full log context.

## Output

```json
{
  "classification": "<class>",
  "phi_adjacent": true,
  "file": "<file-path>",
  "line": <line-number-or-null>,
  "error_message": "<exact error text>",
  "root_cause": "<one sentence>",
  "fix_direction": "<what to do>",
  "confidence": "high | medium | low",
  "requires_manual_review": true
}
```

Pass this to the `propose-fix` skill. If `phi_adjacent` is true, the proposal must not be
auto-applied.
