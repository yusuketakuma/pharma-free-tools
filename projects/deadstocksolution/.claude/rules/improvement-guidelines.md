# Improvement Guidelines — DeadStockSolution

## Project Posture: Maintenance-First

DeadStockSolution is a production pharmacy inventory system. Self-improvement proposals must
prioritize stability over new capability. Prefer conservative, well-understood changes.

## Signals to Emit

Emit improvement signals when the following are observed in task artifacts:

- Test flakiness: a test passes or fails non-deterministically across runs
- Slow test suite: any individual test file exceeds 10 seconds
- Type errors caught only at runtime (not by `tsc`)
- Repeated ESLint warnings across multiple files (same rule, 3+ occurrences)
- Coverage regression: Lines or Functions drop below 95%, Branches below 86%
- Duplicate logic detected between `client/` and `server/` that could be shared

Signal format: emit to `growth/proposals/` as a JSON file following the standard proposal schema.

## Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Test pass rate | 100% | < 99% |
| Test suite duration | < 60s total | > 90s |
| Line coverage | >= 95% | < 93% |
| Function coverage | >= 95% | < 93% |
| Branch coverage | >= 86% | < 84% |
| TypeScript errors | 0 | > 0 |
| ESLint errors | 0 | > 0 |

## Acceptable Proposals

- Refactoring a function to reduce duplication (max 50 lines changed)
- Adding missing test cases for uncovered branches
- Fixing a type annotation that was `any` or missing
- Correcting an ESLint rule violation
- Improving error messages for user-facing API responses
- Updating a dependency with a patch version bump (not minor or major)

## Off-Limits (Never Auto-Apply)

- Changes to `server/src/middleware/` (auth, JWT, session)
- Changes to `server/src/db/schema.ts` (database schema)
- Any change that touches Drizzle migrations
- Changes to Vercel deployment configuration
- Removing or weakening test assertions
- Changes to environment variable handling
- Any change that reduces test coverage thresholds
