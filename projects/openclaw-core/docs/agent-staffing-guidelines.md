# Agent Staffing Guidelines

> **最終更新**: 2026-03-29
> **対象**: OpenClaw workspace 内の logical specialist / dedicated role の定義・配置方針

## 1. 目的

各エージェントロールの責務範囲・配置基準・制約を定義し、役割の重複や逸脱を防ぐ。

---

## 2. ロール一覧

### 2.1 Supervisor-Core（観測・委任の中核）

| 項目 | 内容 |
|---|---|
| 役割 | 観測集約、remit 割当、委任、ルーティング |
| 配置基準 | 常駐。control plane の中枢として稼働。 |
| 制約 | queue triage は委譲。品質レビューは別経路。auth/routing 変更は manual review。 |
| 詳細 | `projects/openclaw-core/docs/supervisor-core-boundary-definition.md` |

### 2.2 Queue Triage Analyst（Triage 専任）★ 新規

| 項目 | 内容 |
|---|---|
| 役割 | `waiting_auth` / `waiting_manual_review` の triage のみ |
| 配置基準 | queue telemetry snapshot に dominant prefix の反復または anomaly/delta が検出された場合に起動 |
| スコープ | triage のみ（品質レビュー権限なし、auth/routing 変更権限なし） |
| candidate 生成 | anomaly / delta / pattern に限定 |
| 出力契約 | board / heartbeat / scorecard への入力は signal-only |
| escalation | 所定の escalation criteria を満たす場合に supervisor-core 経由で上位経路へ引き渡し |
| 制約 | supervisor-core の観測集約機能の代替ではない。実行計画の策定・コード変更の指示はしない。 |
| 詳細 | `projects/openclaw-core/docs/queue-triage-analyst-runbook.md` |

### 2.3 Board Chair

| 項目 | 内容 |
|---|---|
| 役割 | agenda 組成、争点整理、裁定案作成、ユーザー報告前レビュー |
| 配置基準 | board cycle に合わせて起動 |
| 制約 | routine を precedent で流せる場合は新規 board を不要と判断してよい |

### 2.4 Logical Specialists（OpenClaw 側）

以下のロールは `AGENTS.md` に定義済み。

| カテゴリ | ロール |
|---|---|
| Product | product-manager |
| Engineering | engineering-manager |
| QA | qa-manager |
| Ops | ops-manager |
| Growth | growth-manager |
| Research | trend-researcher |
| Feedback | feedback-synthesizer |
| Sprint | sprint-prioritizer |
| Design | ui-designer, ux-researcher |
| Analytics | analytics-reporter |
| Compliance | legal-compliance-checker |

### 2.5 Execution Specialists（Claude Code 側）

以下のロールは `AGENTS.md` に定義済み。

| カテゴリ | ロール |
|---|---|
| Architecture | backend-architect, frontend-developer, mobile-app-builder |
| AI/ML | ai-engineer |
| DevOps | devops-automator |
| Prototyping | rapid-prototyper |
| Testing | api-tester, performance-benchmarker, test-results-analyzer |
| Workflow | workflow-optimizer |
| Docs | docs-integrator |
| Infra | infrastructure-maintainer |

---

## 3. 配置方針

### 3.1 Single Lead

単純・単一成果物の task は主担当のみで進める。

### 3.2 Lead + Advisory

観点補助のみ必要な task は advisory subrole を付ける。
advisory は原則として別実行を起こさず、観点・チェック項目・仕様補助を行う。

### 3.3 Lead + Active Subroles

複数成果物や複数専門領域が必要な task は active subrole を付ける。
例: backend + docs + qa、frontend + qa、infra + verification

### 3.4 Cross-functional Swarm

高リスクの横断 task は manager / reviewer / qa を自動追加する。

---

## 4. Queue Triage Analyst の起動・終了条件

### 4.1 起動条件

以下のいずれかを満たす場合に Queue Triage Analyst を起動する。

- queue telemetry snapshot で同一 prefix が複数回連続して dominant である
- 前回 triage からの差分（delta）が閾値を超えている
- anomaly signal が検出されている

### 4.2 終了条件

各 dominant prefix について以下のいずれかが満たされた場合に終了する。

- owner / next action / success criteria が記録されている
- escalation 経路に引き渡されている
- `履歴不足` として明示的に保留されている

### 4.3 起動頻度の制御

- 実質差分なしの連続 run が3回続いた場合、報告頻度を下げる
- 新規証拠・新規 prefix・新規 owner/action がある場合のみ詳細を展開する
- 同一 candidate の重複リストは禁止

---

## 5. 品質レビューの経路

品質レビューは supervisor-core でも Queue Triage Analyst でも実行しない。以下の経路で独立して行う。

| レビュー種別 | 実行経路 |
|---|---|
| 成果物 accept/reject | board / reviewer / dedicated review agent |
| コードレビュー | Claude Code 側 review specialist |
| 報告内容の品質判定 | board-auditor / review agent |
| 実行結果の検証 | Claude Code 側 verification specialist |

---

## 6. 制約・保護ルール

### 6.1 全ロール共通

- protected file（SOUL.md, AGENTS.md, IDENTITY.md, USER.md, TOOLS.md, MEMORY.md, HEARTBEAT.md, gateway config）の自動変更は禁止
- auth / trust boundary / routing の根幹設定の自動変更は禁止
- Telegram「たまAI」設定の変更は禁止

### 6.2 Queue Triage Analyst 固有

- triage 専任。品質レビュー権限を持たない。
- auth / routing / approval / trust boundary の変更提案・実行はしない。
- board / heartbeat / scorecard への入力は signal-only。
- supervisor-core の観測集約機能の代替ではない。
- 出力は read-only。runtime queue state の変更はしない。

### 6.3 Supervisor-Core 固有

- queue triage の直接実行はしない（Queue Triage Analyst に委譲）。
- 品質レビューの直接実行はしない（別経路に委譲）。
- auth / routing 変更の自動適用はしない（manual review 必須）。

---

## 7. Signal-Only 契約

Queue Triage Analyst からの board / heartbeat / scorecard への入力は、既存の signal-only contract を維持する。

- `heartbeat_result` の outcome_type: `signal_only` または `agenda_candidate` のみ
- `agent-scorecard-review` への candidate: anomaly/delta のみ
- 判断（accept/reject）・推奨度・優先順位付けは含めない

詳細: `docs/heartbeat-governance-report-snapshot-anomaly-delta-spec-v0.2.md`

---

## 8. 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-03-29 | 初版作成。Queue Triage Analyst を専任ロールとして追加。supervisor-core との境界定義を反映。 |

---

## 9. 関連文書

| 文書 | 関係 |
|---|---|
| `projects/openclaw-core/docs/supervisor-core-boundary-definition.md` | Supervisor-core の境界定義 |
| `projects/openclaw-core/docs/queue-triage-analyst-runbook.md` | Queue Triage Analyst の運用手順 |
| `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` | Triage checklist 正本 |
| `AGENTS.md` | エージェント共通ルール（protected） |
| `docs/heartbeat-governance-report-snapshot-anomaly-delta-spec-v0.2.md` | Signal-only contract 正本 |
