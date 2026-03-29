# DeadStockSolution — Claude Code 実行規約

## Architecture
- OpenClaw = control plane（routing, approval, queue, metrics, state）
- Claude Code = execution plane（implementation, testing, review）
- ACP = primary transport / CLI = secondary・fallback

## Project Overview
薬局向けデッドストック管理システム。薬局間の在庫マッチングと厚生労働省の薬価基準データ連携を提供する。

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + React Bootstrap
- **Backend**: Express 5 + TypeScript + Drizzle ORM
- **Database**: Vercel Postgres (Neon)
- **Deploy**: Vercel (serverless)
- **Monorepo**: npm workspaces (`client/`, `server/`)
- **Test**: Vitest 4 + Supertest (server), Vitest + @testing-library/react (client)

## Source of Truth
- 実コード: `workspace/DeadStockSolution/`
- プロジェクト管理: `projects/deadstocksolution/`
- 組織・責務: `org/`
- 実行基盤: `.openclaw/`
- 契約スキーマ: `schemas/`

## Key Commands
```bash
npm run dev:server          # Start backend
npm run dev:client          # Start frontend
npm run build:server        # tsc build
npm run build:client        # Vite build
npm run lint                # ESLint
npm run typecheck           # TypeScript check
npm run test                # All tests
npm run test:server         # Server tests only
npm run test:client         # Client tests only
npm run test:coverage       # Coverage report
cd server && npx drizzle-kit generate   # Migration
cd server && npx drizzle-kit push       # Push schema
```

## Scope Rules
- keep changes project-scoped
- do not modify `.openclaw/`, `org/`, `config/`, `schemas/` without approval
- escalate protected-path, publish, or destructive actions through OpenClaw approval

## Execution Rules
- use coding-oriented subagents only（backend-architect, frontend-developer, qa-tester, devops-automator, docs-integrator）
- system prompt is append-only; safety controls live in hooks/permissions/allow-deny
- structured output: return execution-result.json schema

## Delivery Rules
- smallest credible diff
- verify with `npm run lint && npm run typecheck && npm run test` before done
- report assumptions and remaining risks clearly
- coverage thresholds: Lines 95%, Functions 95%, Branches 86%

## Conventions
- Language: Japanese for UI text and comments, English for code identifiers
- Database: All schema in single file `server/src/db/schema.ts`
- Auth: JWT-based; middleware in `server/src/middleware/`
- API: REST; all routes registered in `server/src/app.ts`
- Git: `main` for production, `preview` for staging

## Constraints
- noPush: true（人間承認なしにpushしない）
- noDestructive: true（rm -rf, reset --hard 禁止）
- deploy: approval required
