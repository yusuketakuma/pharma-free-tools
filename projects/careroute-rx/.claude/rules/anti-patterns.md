# Anti-Patterns — CareRoute-RX

Known patterns that have caused failures or degraded quality in this project.

---

## AP-001: PHI Field Names in Log Statements

**Description**: Logging objects or strings that contain PHI field names (patientId, dob, mrn,
prescriptionId, phi) causes PHI to appear in log aggregation systems where it is not encrypted
or access-controlled.

**Detection Hint**: `pnpm check:phi-detection` fails, or a grep for `console.log` near PHI
field names returns results in non-test files.

**Recommended Fix**: Log only non-PHI identifiers (internal UUIDs, request IDs). If debugging
requires PHI context, use a PHI-safe logger that redacts fields before writing. Never log
raw request bodies containing patient data.

---

## AP-002: Skipped Tests Without Linked Issue

**Description**: Test cases marked with `it.skip` or `test.skip` without a comment linking
to a tracking issue. Skipped tests silently reduce coverage and hide known failures.

**Detection Hint**: `grep -r "\.skip" apps/ --include="*.test.*"` returns results without
an adjacent comment containing an issue number or URL.

**Recommended Fix**: Either fix the test immediately or add a comment with a linked issue:
`it.skip('TODO #123: fails due to Worker env not available in test', ...)`. Set a deadline
to resolve all skip markers.

---

## AP-003: Hardcoded Secrets in Cloudflare Worker Bindings

**Description**: API keys, database URLs, or tokens hardcoded directly in Worker source
files instead of using Cloudflare environment bindings defined in `wrangler.toml`.

**Detection Hint**: `pnpm lint:secrets` reports a violation, or a search for known secret
patterns (API key formats, base64-encoded tokens) finds a match in source files.

**Recommended Fix**: All secrets must be accessed via `env.SECRET_NAME` in Workers, declared
in `wrangler.toml` under `[vars]` or as Cloudflare secret bindings. Run `pnpm lint:secrets`
to verify.

---

## AP-004: RBAC Role Checks Inlined in Business Logic

**Description**: Checking user roles directly in business logic files (e.g., `if (user.role === 'admin')`)
instead of using the centralized RBAC policy. This leads to inconsistent enforcement and
makes it easy to miss a check during refactoring.

**Detection Hint**: A grep for `user.role ===` or `req.user.role` in non-middleware, non-auth
files returns results.

**Recommended Fix**: All role-based access decisions must go through the RBAC middleware or
a dedicated policy function. Business logic should receive a resolved permission object,
not the raw role string.

---

## AP-005: Turso/libSQL Connection Leak in Tests

**Description**: Tests that open a Turso/libSQL connection without closing it in `afterEach`
or `afterAll`, causing connection pool exhaustion in CI and intermittent test failures.

**Detection Hint**: Tests that import the database client and run queries but have no
corresponding `client.close()` or `db.close()` call in teardown.

**Recommended Fix**: Always close the database client in `afterAll`. Consider using a test
database factory that auto-closes in a `using` block or a cleanup registry.

---

## AP-006: Contract Schema Drift

**Description**: The TypeScript types in `apps/web/` or Workers diverge from the schemas
defined in `contracts/`, causing silent type mismatches at runtime.

**Detection Hint**: `pnpm check:ci-contract` fails, or a type is defined locally in `apps/`
that duplicates a definition in `contracts/` with different field names.

**Recommended Fix**: Always import shared types from `contracts/`. When a contract needs to
change, update `contracts/` first, then update all consumers. Never redefine a contract type locally.
