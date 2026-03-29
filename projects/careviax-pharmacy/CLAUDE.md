# CareViaX Pharmacy — Claude Code 実行規約

## Architecture
- OpenClaw = control plane（routing, approval, queue, metrics, state）
- Claude Code = execution plane（implementation, testing, review）
- ACP = primary transport / CLI = secondary・fallback

## Project Overview
薬局ワークフロー支援プロジェクト。要件収集フェーズ。

## Source of Truth
- プロジェクト管理: `projects/careviax-pharmacy/`
- 組織・責務: `org/`
- 実行基盤: `.openclaw/`
- 契約スキーマ: `schemas/`

## Scope Rules
- keep changes project-scoped
- do not modify `.openclaw/`, `org/`, `config/`, `schemas/` without approval
- escalate protected-path, publish, or destructive actions through OpenClaw approval

## Execution Rules
- use coding-oriented subagents only
- system prompt is append-only
- structured output: return execution-result.json schema

## Delivery Rules
- smallest credible diff
- report assumptions and remaining risks clearly

## Current Phase
- 要件収集・ドキュメント整備
- 実装は未着手
- 新機能提案は product 部門 → CEO承認フローを通す

## Constraints
- noPush: true
- noDestructive: true
- new features: CEO approval required
