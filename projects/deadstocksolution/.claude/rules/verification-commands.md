# Verification Commands — DeadStockSolution

Run these commands from the project source root (`workspace/DeadStockSolution/`) after any change.

## Required After Every Change

```bash
npm run typecheck
npm run lint
```

## Required Before Marking Done

```bash
npm run test
```

## Full Verification Suite

```bash
npm run typecheck        # TypeScript type check (server + client)
npm run lint             # ESLint across monorepo
npm run test:server      # Server unit + integration tests (Vitest + Supertest)
npm run test:client      # Client component tests (Vitest + @testing-library/react)
npm run test:coverage    # Coverage report — must meet: Lines 95%, Functions 95%, Branches 86%
```

## Build Verification

```bash
npm run build:server     # tsc compile check for server
npm run build:client     # Vite production build for client
```

## Database / Migration (only when schema.ts changes)

```bash
cd server && npx drizzle-kit generate   # Generate migration SQL
cd server && npx drizzle-kit push       # Push to Neon Postgres (requires DB credentials)
```

## Targeted Test Execution

When modifying a specific file, run its related tests first to fail fast:

```bash
# Server file changed
npx vitest run --reporter=verbose server/src/<path-to-test>

# Client file changed
npx vitest run --reporter=verbose client/src/<path-to-test>
```

## Notes

- All commands require `npm install` to have been run at the monorepo root.
- `npm run test` runs both server and client tests in sequence.
- Coverage thresholds are enforced in `vitest.config.ts`; a threshold failure exits non-zero.
- Do not use `--passWithNoTests`; absence of tests for a changed file is a signal to investigate.
