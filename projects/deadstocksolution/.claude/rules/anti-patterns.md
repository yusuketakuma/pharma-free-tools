# Anti-Patterns — DeadStockSolution

Known patterns that have caused failures or degraded quality in this project.

---

## AP-001: Drizzle Schema Mutation Without Migration

**Description**: Modifying `server/src/db/schema.ts` without generating and applying a migration,
causing the live database schema to diverge from the ORM model.

**Detection Hint**: A change to `schema.ts` is not accompanied by a new file in the migrations
directory, or `drizzle-kit generate` was not run.

**Recommended Fix**: Always run `cd server && npx drizzle-kit generate` after schema changes.
Commit both the schema change and the generated migration together. Never push schema changes
without a corresponding migration.

---

## AP-002: JWT Middleware Bypass in Tests

**Description**: Test files that skip or mock the JWT middleware to avoid authentication,
creating a false sense of security and allowing untested auth code paths.

**Detection Hint**: Test files import or call routes directly without going through the
`authMiddleware` or equivalent, or use `vi.mock` to suppress auth logic entirely.

**Recommended Fix**: Use test fixtures that generate valid JWTs. If integration testing, use
a dedicated test user with a known token. Do not mock auth middleware.

---

## AP-003: `any` Type Escape Hatch in Shared Utilities

**Description**: Using TypeScript `any` in `server/src/` or shared utilities propagates unsafe
types throughout the codebase and defeats the purpose of type checking.

**Detection Hint**: `grep -r ": any" server/src/` returns hits outside of intentional boundary
types (e.g., external API responses that have not yet been typed).

**Recommended Fix**: Define a proper interface or use `unknown` with a type guard. For external
API responses, create a typed response schema and validate at the boundary.

---

## AP-004: Hardcoded Database Connection Strings

**Description**: Database URLs or credentials appearing directly in source files rather than
being read from environment variables.

**Detection Hint**: `grep -r "postgres://" src/` or `grep -r "neon.tech" src/` finds a match
outside of `.env*` files or example configs.

**Recommended Fix**: All connection strings must come from `process.env`. Add the variable to
`.env.example` with a placeholder value.

---

## AP-005: Test Coverage Threshold Suppression

**Description**: Modifying `vitest.config.ts` to lower coverage thresholds instead of writing
the missing tests.

**Detection Hint**: A diff shows `thresholds` values decreasing in any `vitest.config.ts` or
`vitest.config.client.ts`.

**Recommended Fix**: Write the missing tests. Thresholds exist to enforce the coverage contract;
lowering them hides untested paths in production code.

---

## AP-006: Unhandled Promise Rejections in Express Handlers

**Description**: Async route handlers that do not wrap their logic in try/catch or use an
async error wrapper, causing unhandled promise rejections that crash the server process.

**Detection Hint**: An Express route registered with `router.get('...', async (req, res) => {`
that lacks a try/catch block or does not use a wrapper like `asyncHandler`.

**Recommended Fix**: Wrap all async route handlers with a consistent error handling utility, or
use Express 5's native async error propagation and ensure a global error middleware is registered.
