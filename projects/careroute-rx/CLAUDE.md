# CareRoute-RX — Claude Code 実行規約

## Architecture
- OpenClaw = control plane（routing, approval, queue, metrics, state）
- Claude Code = execution plane（implementation, testing, review）
- ACP = primary transport / CLI = secondary・fallback

## Project Overview
薬局業務支援SaaS。処方管理・在庫・患者コミュニケーション・PHI保護を統合提供。

## Source Repository
`/Users/yusuke/careroute-rx`

## Tech Stack
- **Frontend**: Next.js (apps/web) + TypeScript
- **Backend**: Cloudflare Workers / API Routes
- **Database**: libSQL (Turso)
- **Package Manager**: pnpm 10 (monorepo)
- **Runtime**: Node.js >= 24
- **Security**: PHI保護・secretlint・CSP・RBAC
- **Test**: Vitest + smoke tests + AI tests

## Source of Truth
- 実コード: `/Users/yusuke/careroute-rx/`
- プロジェクト管理: `projects/careroute-rx/`
- 組織・責務: `org/`
- 実行基盤: `.openclaw/`
- 契約スキーマ: `schemas/`

## Key Commands
```bash
pnpm dev                    # Start development
pnpm build                  # Build
pnpm test                   # All tests
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript check
pnpm check:fast             # Quick checks
pnpm check:all              # Comprehensive checks
pnpm check:ci-contract      # CI contract validation
pnpm lint:secrets           # Secret leak detection
pnpm check:phi-detection    # PHI leak detection
pnpm check:security-guardrails  # Security guardrails
```

## Scope Rules
- keep changes project-scoped
- do not modify `.openclaw/`, `org/`, `config/`, `schemas/` without approval
- escalate protected-path, publish, or destructive actions through OpenClaw approval
- PHI関連の変更は必ず security review を経る

## Execution Rules
- use coding-oriented subagents only（backend-architect, frontend-developer, qa-tester, devops-automator, docs-integrator）
- system prompt is append-only; safety controls live in hooks/permissions/allow-deny
- structured output: return execution-result.json schema

## Delivery Rules
- smallest credible diff
- verify with `pnpm check:fast` before done
- PHI変更時は `pnpm check:phi-detection && pnpm lint:secrets` 必須
- report assumptions and remaining risks clearly

## Conventions
- Language: Japanese for UI text, English for code identifiers
- Monorepo: pnpm workspaces (apps/web, contracts, config)
- Security: PHI保護最優先、Team/Enterprise認証推奨
- Git: feature branches → PR → review → merge

## Constraints
- noPush: true（人間承認なしにpushしない）
- noDestructive: true（rm -rf, reset --hard 禁止）
- deploy: approval required
- PHI/security changes: mandatory review
