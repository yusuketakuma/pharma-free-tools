# OpenClaw Runbook (Yusuke)

## Scope
- OpenClaw × Claude Code 実行基盤運用
- ACP 主系 / CLI 従系の切り替え判断
- queue / rebalance / approval / review / publish 運用
- portfolio projects (`projects/*`) の project-scoped Claude 運用

## Operating model
- **OpenClaw = control plane**
  - user entrypoint
  - routing / queue / rebalance / approval / review / publish
  - durable state と policy 判定
- **Claude Code = execution plane**
  - heavy coding execution
  - transient implementation / verification
  - ACP primary, CLI secondary

## Mandatory rules
1. ユーザー窓口は常に OpenClaw
2. durable state は `.openclaw/tasks/` と runtime artifact に残す
3. Claude 実行前に auth / approval / protected path を OpenClaw で判定する
4. protected path は `approval_required` として扱う
5. publish 可否は OpenClaw reviewer が最終判定する
6. prompt は append-only、強制制御は hooks / permissions / allow-deny / protected path へ寄せる

## ACP-primary operations
### 主系として使う条件
以下では ACP を第一選択にします。

- Claude Code 側の接続が正常
- structured handoff を安定運用したい
- heavy implementation / verification が中心
- 継続的な session / tool contract を活かしたい

### ACP 主系の基本フロー
1. OpenClaw が task intake を保存
2. route decision を作る
3. auth preflight を実施
4. capacity-aware dispatch で ACP lane を選ぶ
5. Claude Code に execution request を渡す
6. result / logs / review artifact を OpenClaw 側に保存
7. reviewer が publish 可否を判定

### ACP 主系で見るべき信号
- auth health
- provider pressure
- retry-after / transport health
- execution-result schema 準拠
- Claude telemetry / spend pressure
- `.openclaw/runtime/health/lane-health.json` の fresh probe

### lane health probe の見方
- 実行: `python3 .openclaw/scripts/probe_lane_health.py`
- latest: `.openclaw/runtime/health/lane-health.json`
- history: `.openclaw/runtime/health/lane-health-history.jsonl`
- dispatch は probe を優先参照し、`captured_at` が古い場合だけ capacity / metrics / task artifact を補完参照する
- 最低確認項目:
  - `healthy`
  - `auth_ok`
  - `latency_ms`
  - `last_error`
  - `captured_at`

## CLI-secondary operations
### CLI fallback を使う場面
CLI は **主系の代替常用ではなく従系** です。使いどころは以下です。

- ACP 接続断の局所回避
- backend / auth / transport 切り分け
- 小規模な手動復旧
- CLI backend safety net としての限定運用

### CLI fallback を避ける場面
- trust boundary をまたぐ混在環境
- policy / approval が曖昧なままの重作業
- 長期継続セッション前提の安定運用

### CLI fallback 運用ルール
- OpenClaw の route decision は維持する
- fallback 実行でも task artifact を `.openclaw/tasks/<task_id>/` に残す
- degraded success は `_meta.*` を残す
- write-task の degraded success は auto publish しない
- lane artifact:
  - `lane-selection.json`: `selected_lane`, `selection_reasons`, `fallback_chain`, `lane_health_snapshot`
  - `dispatch-attempts.jsonl`: `dispatch_attempt_id` ごとの lane 実行履歴

### Automatic fallback safety rules
- 自動 fallback 許可:
  - read-only
  - plan-only
  - session 開始前失敗
  - auth / health / capacity による未実行
- 自動 fallback 不可:
  - write task
  - partial execution 済み
  - side effect の可能性あり
  - worktree / edit 開始後
- manual review 必須:
  - write task の degraded success
  - partial execution / side effect 可能性あり
  - protected path を含む fallback 結果
  - `cli_backend_safety_net` まで落ちた結果を publish したい場合
- fallback 不可時は `waiting_manual_review` または block に倒す

## Queue / rebalance / approval と Claude 実行の関係
### queue reasons
- `waiting_auth`
- `waiting_approval`
- `waiting_capacity`
- `waiting_manual_review`

### release conditions
- `waiting_auth`
  - Claude auth runtime が healthy
- `waiting_approval`
  - `state.json.approval.approved=true`
- `waiting_capacity`
  - selected provider pressure が `normal`
- `waiting_manual_review`
  - reviewer が resolution を記録

### rebalance rules
- rebalance は **return-to-safe-state only**
- 戻し先は `READY_FOR_EXECUTION` または `REVIEWING`
- rebalance は以下をしない:
  - automatic execute
  - automatic publish
  - route re-stack
  - dispatch re-stack
- `route_decision_id` / `approval_id` / `dispatch_id` は再採番しない
- lane health probe は release 判断の補助に使うが、rebalance 自体は lane の自動切替を確定しない

### approval relation
- approval は Claude 実行前の gate
- protected path を含む task は approval なしで進めない
- approval 後も executor 前に再チェックする

## Auth policy in operations
詳細は `.openclaw/shared/trust-boundary-auth-policy.md` を参照。

運用上の原則:
- この workspace の Claude 認証は **`claude.ai` サブスクリプションのみ** を使う
- auth preflight は `loggedIn=true` だけでなく `authMethod=claude.ai` を確認する
- API key / setup-token / bare-mode 専用 auth は正式経路として扱わない
- auth 不備は `AUTH_REQUIRED` へ倒す
- auth 回復後は rebalance で `READY_FOR_EXECUTION` へ戻すだけで、自動実行しない

## Capacity-aware dispatch
### OpenAI / OpenClaw 側で見るもの
- project rate limits
- remaining requests ratio
- remaining tokens ratio
- cost pressure

### Claude Code 側で見るもの
- auth health
- spend pressure
- telemetry
- retry-after
- ACP / CLI lane health

### dispatch principle
- ACP primary を維持できるなら ACP を優先
- Claude 側 hard pressure なら queue または plan-only
- OpenAI / Claude 両側が高圧なら queue へ逃がす
- fallback 実行は policy の例外ではなく、同じ control-plane 契約の下で行う

## Prompt / hooks / permissions guidance
- system prompt は append-only
- prompt は作業文脈の追加に使う
- hooks / permissions / allow-deny / protected path が安全制御の主役
- `CLAUDE.md` は project-scoped execution convention に限定する

## Project-scoped Claude operations
各 `projects/*` では以下を標準とします。

- `CLAUDE.md`
  - project 固有の実行規約
  - スコープ / 禁止事項 / 検証方針
- `.claude/settings.json`
  - team-shared template
  - ACP primary / CLI secondary 方針
- `.claude/agents/`
  - coding-oriented specialists のみ

active にする specialist 例:
- backend-architect
- frontend-developer
- qa-tester
- devops-automator
- docs-integrator

**product / design / ops 全部を常時 active agent 化しない**。
必要時は OpenClaw 側で orchestrate し、Claude 側は coding execution に絞る。

## Incident quick guide
### 1) Claude auth failure
- `auth-status.json` / `auth-preflight.log` を確認
- `AUTH_REQUIRED` になっていることを確認
- auth 回復後に `python3 .openclaw/scripts/rebalance_queue.py --reason waiting_auth`

### 2) ACP unhealthy
- ACP lane health を確認
- transport / auth / backend を切り分け
- `lane-selection.json` で `selection_reasons` と `fallback_chain` を確認
- read-only / plan-only / pre-session failure のみ CLI secondary へ自動 fallback
- write task かつ partial execution の疑いがあれば `waiting_manual_review` で止める
- 必要時のみ CLI secondary を使う
- 現在の Claude CLI が native ACP subcommand を露出しない環境では、ACP lane は `claude --print --output-format json` を使う compat transport として動作し、`lane-health.json` / `acp-session.json` にそのギャップを残す

### 3) CLI fallback でも不安定
- CLI backend safety net としての最小操作に絞る
- `claude.ai` subscription のみで運用している host では `--bare` がその認証を使えないため、`cli_backend_safety_net` は unhealthy が正常
- publish まで進めず review gate で止める
- 先に trust / auth / capacity の復旧を優先する

## Lane health probe
lane の状態を一括確認するには `lane_health_probe.py` を使います。

```bash
# 人が読む形式 (exit 0=healthy, 1=degraded, 2=down)
python3 .openclaw/scripts/lane_health_probe.py

# JSON 形式
python3 .openclaw/scripts/lane_health_probe.py --json

# 出力先指定
python3 .openclaw/scripts/lane_health_probe.py --output /tmp/probe.json
```

probe 結果は `.openclaw/runtime/metrics/lane-health-probe.json` にも書き込まれます。
cron / monitoring で exit code を見て alert を出す運用を推奨します。

## ACP transport reality on this host
`run_claude_acp.py` の実行経路は、この host では **compat transport 固定** です。

- Claude CLI の `--help` に native `acp` subcommand が出ない
- そのため ACP lane は `claude --print --output-format json` を使う compat transport として動かす
- `execution-result.json._meta.transport_kind=claude_print_json_compat`
- `execution-result.json._meta.native_acp_available=false` を確認する
- 将来 native `acp` subcommand が CLI に追加された場合でも、runtime 実装が入るまでは metadata だけで可否を示し、実行経路を曖昧にしない

## Migration: old task artifact backfill
古いタスクに `dispatch-attempts.jsonl` / `lane-selection.json` がない場合の backfill:

```bash
# dry-run (書き込みなし、プレビューのみ)
python3 .openclaw/scripts/backfill_dispatch_attempts.py --dry-run

# 実行
python3 .openclaw/scripts/backfill_dispatch_attempts.py

# 単一タスク
python3 .openclaw/scripts/backfill_dispatch_attempts.py --task-id <task_id>
```

## Verification / recovery commands
- `python3 .openclaw/scripts/validate_configs.py`
- `python3 .openclaw/scripts/rebalance_queue.py --reason waiting_auth`
- `python3 .openclaw/scripts/rebalance_queue.py --reason waiting_capacity`
- `python3 .openclaw/scripts/rebalance_queue.py --task-id <task_id>`
- `python3 .openclaw/scripts/approve_task.py --task-id <task_id> --approver <name>`
- `python3 .openclaw/scripts/lane_health_probe.py`
- `python3 .openclaw/scripts/backfill_dispatch_attempts.py --dry-run`

## Reporting template
1. 結論
2. 次アクション
3. 補足（queue理由 / approval状況 / fallback有無 / 残リスク）
