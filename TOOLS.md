# TOOLS.md

## Purpose

このファイルは、ワークスペース内で使える道具・経路・実行レーンの使い分けを定義する。

## Primary Tooling Model

### OpenClaw Tools
OpenClaw 側では次を主に使う。
- intake / routing
- task classification
- lead / subrole assignment
- capacity / health 参照
- queue / rebalance
- review / publish
- growth / metrics / proposal
- memory / docs / runbook 更新
- web research（必要時）

### Claude Code Tools
Claude Code 側では次を主に使う。
- コード読解
- コード編集
- テスト実行
- repo-wide 検索
- worktree ベース作業
- code-oriented specialist

## Subscription-only Authentication

Claude 系実行では次を守る。

- 正本認証: `claude auth status --json`
- 認証方式: subscription login
- `ANTHROPIC_API_KEY` は主系で使わない
- `apiKeyHelper` を主系にしない
- auth failure は `AUTH_REQUIRED`
- auth drift は fail-closed

## Lane Definitions
### acp_compat
- Claude 主系 lane
- OpenClaw の ACP 主系方針に整合する compat transport
- 現時点の Claude runtime で最優先
- 実 execution contract を返す

### cli
- Claude 二次 lane
- headless 実行の secondary path

### cli_backend_safety_net
- optional lane
- subscription-only 環境では disabled / unhealthy でもよい
- policy 上の予備経路

## Lane Selection Inputs

lane 選択では次を使う。

- provider
- primary_mode
- auth status
- lane health
- task heaviness
- task type (read-only / plan-only / write)
- capacity / pressure
- queue state
- fallback safety rules

## Execution Artifacts

Claude 実行では次を残す。
- execution-request.json
- execution-result.json
- claude-raw.json
- rendered-prompt.txt
- claude-settings.json
- execution.stdout.log
- execution.stderr.log または transport.log
- lane-selection.json
- dispatch-attempts.jsonl

## When to Stay in OpenClaw

OpenClaw-only でよい例:
- planning
- summarization
- review
- publish
- docs 整理
- queue / rebalance
- approval
- growth proposal
- light text update
- routing judgment

## When to Use Claude Code

Claude Code を使う例:
- multi-file code change
- tests required
- repo-wide analysis
- heavy fix
- refactor
- verification command 実行
- code specialist が必要

## Internet / External Research

インターネット調査は次の場合に使う。
- 公式仕様確認
- 最新情報確認
- 制約や product behavior の確認
- up-to-date best practices の取得

調査時は、一次情報・公式文書を優先する。

## Safety Controls

- protected path 変更は review 必須
- partial execution 後の lane 自動切替は禁止
- write task で degraded/fallback success は auto-publish しない
- telemetry / metrics / logs を残す
- 不明な状態は無理に続行せず queue に倒す

## Telegram Preservation Rule

Telegram「たまAI」設定は保持対象であり、通常の自動改善・自動整理の対象外とする。
