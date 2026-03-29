# OpenClaw → Claude Code 移行方針レポート

Date: 2026-03-25

## 結論
今回の判断では、**OpenClaw 標準 ACP を主系** とし、既存の独自 bridge は **compatibility layer** として扱う方針で進める。

理由は以下の通り。

1. すでに OpenClaw 側に ACP ベースの標準経路がある
2. ローカル Claude Code の subscription auth は正常
3. `acp_compat` lane は実行実績がある
4. 現行の独自 bridge は動くが、コンテキスト共有が prompt 依存で弱い
5. 二重実装を増やすより、標準経路 + 構造化 contract へ寄せた方が durable

---

## 現在の実装状況

### 実装あり
- `telegram_task_bridge.py`
- `dispatch_task.py`
- `execute_task.py`
- `run_claude_acp.py`
- `run_claude_code.sh`

### 実行確認あり
- Claude auth: subscription-only で有効
- `acp_compat` lane: success 実績あり
- `openclaw_only`: success 実績あり

### 弱点
- Claude 側へ渡す実体がほぼ `summary + detail`
- project-specific context injection が未完成
- execution-result が再開可能状態としては弱い
- OpenClaw 標準経路と独自経路が二重化

---

## 今回固定した方針

### Primary path
- OpenClaw conversation
- `sessions_spawn(runtime="acp")`
- structured handoff pack

### Secondary path
- 独自 bridge scripts
- 互換 / fallback / 手元ショートカット用途

---

## 今回追加した成果物

### 1. handoff contract v1
- `docs/openclaw-claude-handoff-contract-v1.md`

内容:
- control plane / execution plane の責務分離
- handoff pack 構造
- result schema
- project-specific injection rules
- migration phases

### 2. migration report
- このファイル

---

## 次にやるべき実装

### Priority 1
**handoff pack generator**

責務:
- task / repo / constraints / verification / previous summary をまとめる
- Claude Code に渡す前の canonical artifact を生成する

### Priority 2
**result normalizer**

責務:
- Claude 実行結果を OpenClaw 側の共通 schema に正規化する
- `changedFiles`, `commandsRun`, `risks`, `resumeHint` を揃える

### Priority 3
**project injection registry**

対象:
- CareRoute-RX
- DeadStockSolution
- pharma-free-tools

責務:
- project ごとの rules / verification / protected paths を注入する

### Priority 4
**compat bridge slimming**

責務:
- `telegram_task_bridge.py` を主系にしない
- handoff pack generator の利用側へ寄せる
- 独自ロジックを減らす

---

## 運用ルール

1. 曖昧タスクは先に discovery / plan
2. 実装タスクは execute / verify に分ける
3. result は summary だけで終わらせない
4. repo 特化ルールは OpenClaw 側で注入する
5. 独自 bridge 拡張より標準 ACP と contract の強化を優先する

---

## 推奨次アクション

次回は以下を実装するとよい。

1. `handoff-pack-generator` の spec 作成
2. `result-normalizer` の spec 作成
3. 可能なら最小実装を `.openclaw/scripts/` 側へ追加

今回の段階では、まず **設計の正本を固定すること** を優先した。
