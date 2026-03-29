# Idle Discovery Board Review — 2026-03-27

- scope: OpenClaw Core / CEO ↔ Board ↔ Execution
- chair: Supervisor Core
- date: 2026-03-27

## Board conclusion
The best low-risk idle work today was to materialize the missing **metric claim verification checklist**. It directly supports report integrity, avoids repeat gaps between written completion and actual workspace state, and does not touch protected routing / auth / Telegram boundaries.

## Candidates considered
1. **Metric claim verification checklist**
   - Status: selected
   - Why: missing durable artifact; high reuse across reporting and maintenance tasks; low risk.

2. **Read-only queue telemetry snapshot refresh**
   - Status: not started
   - Why not: the underlying pattern is already documented; no new evidence surfaced that would justify another telemetry-only pass.

3. **Bundle manifest / dry-run sync drill note**
   - Status: not started
   - Why not: useful, but it is a higher-risk operational contract topic and should wait for a dedicated review cycle.

## Board judgments
- **Board Visionary**: prefers durable verification rules that compound across every report.
- **Board User Advocate**: wants a short checklist that a human can run quickly without extra judgment overhead.
- **Board Operator**: selects the checklist because it is the smallest reusable deliverable that can be shipped now.
- **Board Auditor**: approves only because the work stays read-only and avoids root-boundary changes.
- **Board Chair**: accepts candidate 1, defers the others.

## Action taken
- Created `projects/openclaw-core/docs/metric-claim-verification-checklist.md`

## Residual follow-up
- Link the checklist from the OpenClaw Core backlog / runbook if it proves useful in the next reporting cycle.
- Reuse it whenever a report includes a numeric claim or a completion statement.
