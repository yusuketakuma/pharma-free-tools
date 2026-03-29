# OpenClaw × Claude Code Architecture

## Positioning
この workspace における正式な推奨構成は以下です。

- **OpenClaw = control plane**
  - ユーザー窓口
  - durable state の保持
  - task intake / routing / queue / rebalance / approval / review / publish
  - policy 判定と protected path ガード
- **Claude Code = execution plane**
  - transient execution
  - multi-file implementation / refactor / verification / heavy coding specialists
  - ACP または CLI adapter 経由での実行

要点は **durable state は OpenClaw、transient execution は Claude Code** です。
`org/` は組織運用の正本、`.openclaw/` は実行システムの正本です。

## Recommended execution topology
### Primary / secondary lanes
1. **ACP primary**
   - Claude Code を第一選択で接続する主系
   - 安定した structured handoff、tooling 契約、継続セッション運用に向く
2. **CLI secondary**
   - ACP が使えない / 劣化している時の従系
   - 互換・局所復旧・手動 fallback 用
3. **CLI backend safety net**
   - auth / backend / transport 断の切り分け用
   - 主系の代替ではなく、復旧と限定運用のための安全網
   - この host では `claude.ai` subscription 認証のみを正式許可するため、`--bare` を使う `cli_backend_safety_net` は通常 unhealthy 扱いになる（bare mode は `claude.ai` 認証を読まない）

OpenClaw は provider / capacity / approval / path risk を見て lane を選びます。

### Runtime lane selection rules
- `provider != claude_code` の場合は `selected_lane=none`
- `provider == claude_code` の場合は `.openclaw/config/claude-code.yaml` の `primary_mode` を参照
- `primary_mode=acp` なら `acp -> cli -> cli_backend_safety_net` の順で評価
- `primary_mode=cli` なら `cli -> cli_backend_safety_net` の順で評価
- dispatch はまず `.openclaw/runtime/health/lane-health.json` の fresh probe を参照し、stale の時だけ capacity / metrics / artifact 補完へフォールバック
- auth NG は `waiting_auth`、全 lane unhealthy は `waiting_capacity` に fail-closed
- lane decision artifact は `lane-selection.json`、実行 attempt は `dispatch-attempts.jsonl` に保存

### Lane health probe
- probe script: `python3 .openclaw/scripts/probe_lane_health.py`
- latest snapshot: `.openclaw/runtime/health/lane-health.json`
- history: `.openclaw/runtime/health/lane-health-history.jsonl`
- 各 lane は最低でも以下を持つ:
  - `healthy`
  - `auth_ok`
  - `latency_ms`
  - `last_error`
  - `captured_at`
- dispatch は probe が fresh ならその healthy/auth を優先採用し、古い場合のみ `runtime/capacity` と `runtime/metrics` を補助参照する

## Control-plane responsibilities
OpenClaw が責任を持つもの:

- task lifecycle
- route-decision / dispatch-plan / execution-request の生成
- queue / rebalance / approval / manual review
- review-report / final-response / metrics
- auth preflight と fail-closed 判定
- protected path / trust boundary の enforcement

Claude Code が責任を持つもの:

- 実装
- テスト / 検証の実行
- coding specialists による作業分担
- execution-result の返却

## Canonical task storage
各タスクは `.openclaw/tasks/<task_id>/` に保存します。

- `task.json`
- `state.json`
- `route-decision.json`
- `context-pack.md`
- `execution-request.json`
- `rendered-prompt.txt`
- `claude-settings.json`
- `claude-raw.json`
- `auth-status.json`
- `auth-preflight.log`
- `execution.stdout.log`
- `execution.stderr.log`
- `execution-result.json`
- `review-report.json`
- `final-response.md`
- `lifecycle.log`
- `queue-status.json`（queue 対象時）

## Lifecycle
`state.json.state` は以下を使います。

- `RECEIVED`
- `ROUTED`
- `WAITING_APPROVAL`
- `AUTH_REQUIRED`
- `READY_FOR_EXECUTION`
- `RUNNING`
- `REVIEWING`
- `PUBLISHED`
- failure: `ROUTE_FAILED` / `EXECUTION_FAILED` / `REVIEW_FAILED` / `REJECTED` / `CANCELLED`

`AUTH_REQUIRED` は fail-closed auth preflight による停止を表し、通常の `EXECUTION_FAILED` とは分離します。

## JSON / schema contract
OpenClaw と Claude Code の間は **自然言語だけでなく JSON/schema 契約** で接続します。

### Required artifacts
- `task-intake.json`
- `route-decision.json`
- `assignment-plan.json`
- `dispatch-plan.json`
- `execution-request.json`
- `execution-result.json`
- `review-report.json`
- `queue-status.json`
- `runtime queue entry`
- `auth-status.json`

### Schema source
- `.openclaw/schemas/*.json`
- `.openclaw/shared/execution-contract.md`
- `.openclaw/shared/route-decision.md`
- `.openclaw/shared/review-publish.md`
- `.openclaw/shared/trust-boundary-auth-policy.md`

### Contract principle
- OpenClaw は **request / policy / approval context** を構造化して渡す
- Claude Code は **execution result / verification result / changed scope** を構造化して返す
- 失敗時も `execution-result.json` は atomic write
- degraded / fallback 実行でも `_meta.*` を残し、publish 可否を OpenClaw が判定する

## Execution adapter contract
`run_claude_code.sh` は CLI lane の固定契約です。

- args: `--request --result --stdout-log --stderr-log [--dry-run]`
- exit code:
  - `0 success`
  - `10 policy_blocked`
  - `20 timeout`
  - `30 runtime_error`
  - `40 invalid_request`
  - `50 invalid_result`
- `rendered-prompt.txt` / `claude-settings.json` / `claude-raw.json` を task 配下に保存
- auth preflight は `ensure_claude_auth.py` が実行し、`auth-status.json` / `auth-preflight.log` を保存
- `CLAUDE_CODE_BIN` は `env > yaml > default` の順で解決

## Prompt / hooks / permissions policy
- system prompt は **append-only** で扱う
- prompt は方針伝達に使うが、**安全制御の本体にはしない**
- 安全制御は次へ寄せる:
  - hooks
  - permissions
  - allow / deny
  - protected path
  - approval policy
- つまり **prompt に全部を背負わせない**

## Trust boundary / auth model
詳細は `.openclaw/shared/trust-boundary-auth-policy.md` を参照。

要点:
- **1 Gateway = 1 trust boundary**
- mixed-trust は gateway / credentials / OS user / host を分離
- この workspace の Claude 認証は **`claude.ai` サブスクリプションのみ** を使う
- auth preflight は `loggedIn=true` だけでなく `authMethod=claude.ai` を確認し、非 subscription auth は fail-closed で止める
- native plugin は最後の選択、まず process boundary を優先
- 現在のこの host では Claude CLI が native `acp` subcommand を露出しないため、ACP lane の実体は `claude --print --output-format json` を使う compat transport で固定される

## Capacity-aware dispatch
OpenClaw は両 provider を見て dispatch します。

- **OpenAI / OpenClaw 側**
  - project rate limits
  - remaining requests / tokens
  - cost pressure
- **Claude Code 側**
  - auth health
  - spend pressure / telemetry
  - retry-after / backend pressure
  - ACP / CLI lane health

片側だけでなく **両 provider 観点の capacity-aware dispatch** を前提にします。

## Queue / rebalance semantics
runtime queue は `.openclaw/runtime/queue/` にあります。

queue reasons:
- `waiting_auth`
- `waiting_approval`
- `waiting_capacity`
- `waiting_manual_review`

lane と queue / rebalance の関係:
- lane health probe が auth NG を返した場合は `waiting_auth`
- 全 lane unhealthy または pressure/freshness 判定で実行不可なら `waiting_capacity`
- write task で partial execution / degraded fallback が出た場合は `waiting_manual_review`
- rebalance は lane を自動再設計せず、`READY_FOR_EXECUTION` または `REVIEWING` に戻すだけ

rebalance の役割は **安全な状態へ戻すこと** であり、以下は行いません。

- route re-stack
- dispatch re-stack
- automatic execute
- automatic publish

## Project-scoped Claude configuration
portfolio project では `projects/*/.claude/` を推奨します。

- `.claude/settings.json`: team-shared template
- `.claude/agents/`: coding-oriented specialists only
- `.claude/README.md`: project 用法
- `CLAUDE.md`: project-scoped 実行規約

**product / design / ops まで全部を active agent 化しない** のが標準です。
Claude 側 specialist は coding-oriented に絞ります。

## Scripts
- `.openclaw/scripts/execute_task.py`
- `.openclaw/scripts/approve_task.py`
- `.openclaw/scripts/publish_result.py`
- `.openclaw/scripts/rebalance_queue.py`
- `.openclaw/scripts/ensure_claude_auth.py`
- `.openclaw/scripts/task_runtime.py`
- `.openclaw/scripts/validate_configs.py`
- `.openclaw/scripts/lane_health_probe.py` — lane health probe (exit 0=healthy, 1=degraded, 2=down)
- `.openclaw/scripts/backfill_dispatch_attempts.py` — migration: backfill `dispatch-attempts.jsonl` / `lane-selection.json` for older tasks
- `.openclaw/scripts/run_claude_acp.py` — ACP adapter（この host では compat transport 固定。native ACP 可否は probe / metadata に記録）

## Operations reference
- 実運用: `RUNBOOK-openclaw-operations.md`
- trust / auth: `.openclaw/shared/trust-boundary-auth-policy.md`
- project registry: `.openclaw/config/project-manifest.yaml`
