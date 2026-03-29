# OpenClaw Core — Claude Code 実行規約

## Architecture
- OpenClaw = control plane（routing, approval, queue, metrics, state）
- Claude Code = execution plane（implementation, testing, review）
- ACP = primary transport / CLI = secondary・fallback

## Project Overview
OpenClawオーケストレーション基盤。ルーティング、承認フロー、コンテキスト管理、レビュー・パブリッシュワークフローの中核。

## Source of Truth
- 実行基盤設定: `.openclaw/openclaw.json`
- ルーティング: `config/routing-policy.yaml`
- 承認: `config/approval-policy.yaml`
- 契約スキーマ: `schemas/`
- 組織: `org/`

## Scope Rules
- このプロジェクトの変更は全ポートフォリオに影響する
- `openclaw.json`, `config/*.yaml`, `schemas/*.json`, `org/organization.md` は protected path
- 全変更に owner approval 必須

## Execution Rules
- use backend-architect, devops-automator, docs-integrator only
- maxConcurrent: 2 subagents
- system prompt is append-only
- structured output: return execution-result.json schema

## Delivery Rules
- smallest credible diff（影響範囲が広いため特に慎重に）
- 変更前に既存ポリシーとの整合性を確認
- report assumptions and remaining risks clearly

## Constraints
- noPush: true
- noDestructive: true
- all changes: approval required
