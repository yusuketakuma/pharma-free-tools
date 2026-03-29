# Improvement Guidelines — CareRoute-RX

## Project Posture: Active Development with PHI Safety

CareRoute-RX is in active development and handles Protected Health Information (PHI).
Self-improvement proposals must balance developer velocity with strict PHI safety requirements.
Any proposal that touches PHI-adjacent code requires manual review regardless of risk tier.

## Signals to Emit

Emit improvement signals when the following are observed in task artifacts:

- PHI detection check fails or emits warnings (`pnpm check:phi-detection`)
- Secret lint violations detected (`pnpm lint:secrets`)
- Test coverage drops below per-package thresholds
- A Vitest test is skipped (`it.skip`, `test.skip`) without a linked issue
- Type errors in Cloudflare Workers entrypoints
- Slow build: `pnpm build` exceeds 120 seconds
- Security guardrail check failures (`pnpm check:security-guardrails`)
- Repeated patterns of try/catch with empty catch blocks

Signal format: emit to `growth/proposals/` as a JSON file following the standard proposal schema.

## Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| PHI detection violations | 0 | > 0 |
| Secret lint violations | 0 | > 0 |
| Test pass rate | 100% | < 99% |
| Security guardrail failures | 0 | > 0 |
| Skipped tests | 0 | > 2 |
| Build duration | < 120s | > 180s |
| TypeScript errors | 0 | > 0 |

## Acceptable Proposals

- Adding test cases for uncovered code paths in non-PHI modules
- Fixing TypeScript errors in non-PHI-adjacent files
- Improving error handling where errors are silently swallowed
- Removing dead code identified by coverage reports
- Updating pnpm lockfile for patch-level dependency bumps
- Adding JSDoc comments to exported functions in `contracts/`
- Refactoring duplicated validation logic into shared utilities

## Off-Limits (Never Auto-Apply)

- Any file containing PHI field names (patientId, prescriptionId, phi, dob, mrn)
- RBAC configuration or role definitions
- Authentication or session management code
- Cloudflare Workers environment bindings
- Changes to `contracts/` schema definitions (API contracts)
- CSP headers or security policy configurations
- Turso/libSQL connection or credential handling
- Any change that disables or weakens PHI detection checks
