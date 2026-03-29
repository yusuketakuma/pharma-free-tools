# Tama AI Company Organization

## Executive summary
- CEO は **たまAI**。ユーザー向け報告と最終優先順位は CEO に一本化する。
- 旧体制（homecare / sidebiz / trainer / old 30m-2h-4h report lines）は停止し、**部門代表ジョブ + 役割定義ファイル** に置き換える。
- 全役職は恒常ジョブ化せず、各部門代表ジョブが role 定義を参照して判断する。
- 各部門の内部成果は `reports/company/` に集約し、CEO が `CURRENT_STATUS.md` とあわせて最終要約する。
- 実行基盤は `.openclaw/` に分離し、OpenClaw を窓口・オーケストレータ、Claude Code を重量実行エンジンとして扱う。

## Organization chart
- CEO: たまAI
- engineering:
  - frontend-developer
  - backend-architect
  - mobile-app-builder
  - ai-engineer
  - devops-automator
  - rapid-prototyper
- product:
  - trend-researcher
  - feedback-synthesizer
  - sprint-prioritizer
- marketing:
  - tiktok-strategist
  - instagram-curator
  - twitter-engager
  - reddit-community-builder
  - app-store-optimizer
  - content-creator
  - growth-hacker
- design:
  - ui-designer
  - ux-researcher
  - brand-guardian
  - visual-storyteller
  - whimsy-injector
- project-management:
  - experiment-tracker
  - project-shipper
  - studio-producer
- studio-operations:
  - support-responder
  - analytics-reporter
  - infrastructure-maintainer
  - legal-compliance-checker
  - finance-tracker
- testing:
  - tool-evaluator
  - api-tester
  - workflow-optimizer
  - performance-benchmarker
  - test-results-analyzer

## Operating model
1. 各部門代表ジョブが、自部門 role 定義と workspace の現況を読み、差分中心の部門レポートを作成する。
2. project-management は全社進行と依存関係を整理する。
3. studio-operations は運用・監視・法務・財務・分析の健全性を整理する。
4. testing はツール実用性・API・性能・運用フローの品質リスクを評価する。
5. CEO たまAI が全部門レポートを読み、ユーザー向けの最終報告と `CURRENT_STATUS.md` 更新方針を決定する。

## File layout
- `org/organization.md`: 全社構成と運用原則
- `org/operating-model.md`: 実運用ルール
- `org/reporting-flow.md`: CEO集約フロー
- `org/departments/*.md`: 部門責務と代表ジョブ仕様
- `org/roles/*.md`: 全役職の責務定義
- `org/prompts/*.md`: cron job が参照する運用プロンプト
- `reports/company/*.md`: 各部門の最新レポートと CEO 集約
- `.openclaw/README.md`: OpenClaw × Claude Code 実行基盤の全体仕様書
- `.openclaw/config/*`: route / approval / context / executor policy

## Guardrails
- `.openclaw/config/approval-policy.yaml`, `.openclaw/config/routing-policy.yaml`, `.openclaw/config/claude-code.yaml`, `.openclaw/scripts/run_claude_code.sh`, `org/organization.md` 自体の変更は manual approval 固定。
- growth loop は observe/propose までを自動化対象とし、apply は人間承認後のみ。
