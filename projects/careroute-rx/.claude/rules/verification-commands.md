# Verification Commands — CareRoute-RX

Run these commands from the project source root (`/Users/yusuke/careroute-rx/`) after any change.

## Required After Every Change

```bash
pnpm typecheck
pnpm lint
```

## Required for PHI-Adjacent Changes (Always)

```bash
pnpm check:phi-detection
pnpm lint:secrets
```

## Quick Verification (Before Marking Done)

```bash
pnpm check:fast          # Runs typecheck + lint + fast tests
```

## Full Verification Suite

```bash
pnpm typecheck               # TypeScript check across all packages
pnpm lint                    # ESLint
pnpm lint:secrets            # secretlint — detect leaked credentials
pnpm check:phi-detection     # PHI field leak detection
pnpm check:security-guardrails  # CSP, RBAC, security policy checks
pnpm test                    # All Vitest tests
pnpm check:all               # Comprehensive check (all of the above)
pnpm check:ci-contract       # CI contract validation (run before PR)
```

## Build Verification

```bash
pnpm build                   # Full monorepo build (Next.js + Workers)
```

## Targeted Test Execution

```bash
# Run tests for a specific package
pnpm --filter=web test
pnpm --filter=contracts test

# Run a specific test file
pnpm vitest run apps/web/src/<path-to-test>
```

## Notes

- Package manager is pnpm 10. Do not use npm or yarn.
- `pnpm check:fast` is the minimum bar for any change; `pnpm check:all` is required for PHI changes.
- `pnpm lint:secrets` must exit 0 before any commit touching env vars, config, or auth code.
- Cloudflare Workers builds may require `wrangler` to be available in PATH.
- Node.js >= 24 is required; verify with `node --version` if builds fail unexpectedly.
