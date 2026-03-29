# Supervisor-Core 境界定義

> **最終更新**: 2026-03-29
> **提案元**: `proposal-20260329-supervisor-separation-queue-triage-analyst` (APPROVED)
> **前提**: supervisor-core の根幹権限（root authority, routing）は変更しない。本ドキュメントは役割の明確化のみを目的とする。

## 1. 目的

supervisor-core の責務範囲を明確に定義し、Queue Triage Analyst への委譲後に生じうる責務の重複・逸脱を防ぐ。

---

## 2. Supervisor-Core の責務（DO）

### 2.1 観測集約（Observation Aggregation）

- 各エージェント・cron job からの signal を集約する
- heartbeat_result / scorecard / anomaly-delta を受信・整理する
- 定常監視の全体像を維持する

### 2.2 Remit 割当（Remit Assignment）

- タスクの種別・優先度に応じて適切なエージェント/経路に割り当てる
- 新規ロールの remit 定義・更新を担う
- ロール間の責務境界を維持する

### 2.3 委任（Delegation）

- 適切な specialist / subagent に作業を委任する
- 委任先の完了確認・成果物の受け取りを行う
- capacity-aware dispatch を実行する

### 2.4 ルーティング（Routing）

- intake された task の経路選定
- control plane / execution plane の配置判断
- OpenClaw-only / Claude Code / Split の判定

### 2.5 根幹権限の維持

- auth / trust boundary / routing の根幹設定は supervisor-core が管理
- protected path の変更判断は supervisor-core の権限
- rollback / reversibility の最終判断

---

## 3. Supervisor-Core が担当しないこと（DON'T）

### 3.1 Queue Triage

**委譲先**: Queue Triage Analyst

- `waiting_auth` / `waiting_manual_review` の dominant-prefix triage
- queue telemetry snapshot に基づく分類・整理
- anomaly / delta candidate の生成
- triage checklist の実行

supervisor-core は Queue Triage Analyst からの escalation を受ける立場であり、triage 自身は実行しない。

### 3.2 品質レビュー（Quality Review）

**経路**: 別経路（board / reviewer / dedicated review agent）

- 成果物の accept/reject 判断
- コードレビュー
- 報告内容の品質判定
- 実行結果の検証（verification）

品質レビューは独立した経路で実行され、supervisor-core はレビュー結果の集約・反映のみを行う。

### 3.3 実行作業（Execution）

**委譲先**: Claude Code / execution specialists

- コード編集
- テスト実行
- repo-wide 検索・調査
- worktree ベースの作業

---

## 4. DO / DON'T クイックリファレンス

### DO（する）

| # | 行為 | 説明 |
|---|---|---|
| D1 | signal 集約 | 各エージェントからの出力を一元管理 |
| D2 | remit 割当 | タスク種別に応じた経路選定 |
| D3 | 委任 | specialist / subagent への作業委譲 |
| D4 | ルーティング | control plane / execution plane 配置 |
| D5 | 根幹管理 | auth / trust / routing の維持 |
| D6 | escalation 受付 | Queue Triage Analyst からの引き渡し受領 |
| D7 | レビュー結果反映 | 品質レビュー結果に基づく措置 |
| D8 | capacity 管理 | リソース・キューのバランス調整 |

### DON'T（しない）

| # | 行為 | 理由 |
|---|---|---|
| X1 | queue triage 実行 | Queue Triage Analyst の専任 |
| X2 | 品質レビュー実行 | 別経路（reviewer / board） |
| X3 | コード編集・実行 | Claude Code / execution plane |
| X4 | telemetry 反復 | 観測は集約のみ、反復は analyst |
| X5 | auth / routing 変更の自動適用 | protected path は manual review |
| X6 | candidate の accept/reject | signal-only contract を遵守 |
| X7 | 同一論点の再掲 | 重複排除ルールに従う |

---

## 5. Queue Triage Analyst との関係

### 5.1 依存方向

```
Queue Triage Analyst ──(escalation)──▶ Supervisor-Core ──(delegation)──▶ Board / Review
```

- Queue Triage Analyst は supervisor-core に escalation する
- Supervisor-core は escalation を受けて適切な経路に委任する
- 逆方向（supervisor-core → Queue Triage Analyst への triage 依頼）も可能だが、triage の実行内容には関与しない

### 5.2 境界違反の検知

以下の場合は境界違反とみなし、是正する。

- supervisor-core が queue triage checklist を直接実行している
- Queue Triage Analyst が品質レビュー判断を行っている
- Queue Triage Analyst が auth / routing 変更を提案・実行している

---

## 6. 品質レビューとの関係

### 6.1 分離の理由

観測・triage・品質レビューが同一ロールに同居すると、以下の問題が起きる。

- 同じ論点が何度も再掲される（redundant wording）
- 観測と判断が混同される
- board noise が増加する
- ロールの肥大化による応答性低下

### 6.2 各経路の責任

| 経路 | 責任 | 出力 |
|---|---|---|
| Supervisor-Core | 観測集約・委任 | signal 集約、remit 割当、delegation record |
| Queue Triage Analyst | Triage のみ | triage result、escalation request |
| Quality Review (別経路) | 品質判定 | accept/reject、review comment、verification result |

---

## 7. 変更履歴

| 日付 | 変更内容 | 関連提案 |
|---|---|---|
| 2026-03-29 | 初版作成。Queue Triage Analyst への triage 委譲と品質レビュー分離を定義。 | `proposal-20260329-supervisor-separation-queue-triage-analyst` |

---

## 8. 関連文書

| 文書 | 関係 |
|---|---|
| `projects/openclaw-core/docs/queue-triage-analyst-runbook.md` | Queue Triage Analyst の運用手順 |
| `projects/openclaw-core/docs/agent-staffing-guidelines.md` | ロール定義・スタッフィング |
| `AGENTS.md` | エージェント共通ルール（protected） |
| `docs/heartbeat-governance-report-snapshot-anomaly-delta-spec-v0.2.md` | Signal-only contract の正本 |
