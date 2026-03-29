# Queue Triage Analyst Runbook

> **最終更新**: 2026-03-29
> **提案元**: `proposal-20260329-supervisor-separation-queue-triage-analyst` (APPROVED)

## 1. 目的

Queue Triage Analyst は、`waiting_auth` / `waiting_manual_review` の滞留アイテムに対して **triage のみ** を実行する専任ロールである。

観測集約・remit 割当・委任判断は supervisor-core の管轄であり、本ロールは関与しない。品質レビューも別経路であり、本ロールは権限を持たない。

---

## 2. 役割境界

### 担当するもの
- queue telemetry snapshot に基づく dominant-prefix の分類・整理
- 異常検知（anomaly）と差分（delta）に限定した candidate 生成
- board / heartbeat / scorecard への signal-only 入力（判断はしない）
- escalation 条件を満たす事例の上位経路への引き渡し

### 担当しないもの
- 品質レビュー（accept/reject 判断）
- remit 割当・権限変更
- auth / routing / trust boundary / approval の変更
- supervisor-core の観測集約・委任判断
- 実行計画の策定やコード変更の指示

---

## 3. 固定 Triage Checklist

### 3.1 起動条件

以下のいずれかを満たす場合に起動する。

- queue telemetry snapshot で同一 prefix が複数回連続して dominant である
- 前回 triage からの差分（delta）が閾値を超えている
- anomaly signal が検出されている

### 3.2 Triage 手順（固定順序）

1. **最新 snapshot 読込**
   - `projects/openclaw-core/docs/read-only-queue-telemetry-snapshot-spec.md` に従い、最新の queue telemetry snapshot を取得する。
   - 前回 snapshot と比較し、24h delta を確認する。

2. **Dominant prefix 分類**
   - choke point 別にグループ化する（auth/routing、write-blocked、partial-write、mock-contract）。
   - `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` の分類基準に従う。

3. **各 prefix の記録**
   - 以下の項目を必ず記録する。
     - prefix
     - queue（`waiting_auth` / `waiting_manual_review`）
     - suspected choke point
     - owner
     - next action
     - due
     - evidence（snapshot link / report link）
     - success criteria
     - stop condition

4. **差分判定**
   - 前回 triage からの実質差分がない場合: `前回から実質差分なし` と記録し、展開 narrative を抑制する。
   - 新規 prefix・新規 owner・新規 action がある場合のみ詳細を展開する。

5. **Escalation 判定**
   - `4. Escalation Criteria` を確認し、該当する場合は上位経路に引き渡す。

6. **出力**
   - 出力は read-only とする。runtime queue state の変更は行わない。
   - 出力テンプレートは `queue-dominant-prefix-triage.md` のフォーマットに従う。

### 3.3 完了条件

各 dominant prefix について以下のいずれかが満たされるまで triage を継続する。

- owner / next action / success criteria が記録されている
- escalation 経路に引き渡されている
- `履歴不足` として明示的に保留されている

---

## 4. Escalation Criteria

以下のいずれかに該当する場合、上位経路（supervisor-core 経由で board または manual review）に引き渡す。

| 条件 | 判定基準 | アクション |
|---|---|---|
| 実質差分なしの連続 | 3回連続で実質差分がない | `前回から実質差分なし` とし、報告頻度を下げる。新規証拠がある場合のみ報告。 |
| 判断項目の未解決 | 2回連続で判断項目が未解決 | manual review にエスカレーション。同じ未解決論点を再掲しない。 |
| 指標の欠落 | 3日連続で必須指標が欠落 | `未形成` とし、指標定義・計装作業に切り替える。 |
| 同一改善案の継続 | 同一 candidate が複数 run にまたがって存在 | 一つの candidate に統合し、前回 report を参照。重複リストを避ける。 |
| 実行あり・成果なし | 実行記録があるが具体的 action が生まれない | blocked remediation として扱い、next action / due / evidence / stop condition を一つ要求する。 |

---

## 5. Candidate 生成スコープ

### 5.1 対象外（生成しない candidate）

- routine な queue 変動
- auth 一時障害の即時回復
- 計画済みメンテナンスによる一時的な滞留

### 5.2 対象（生成する candidate）

- **Anomaly**: 正常範囲を外れた変動（閾値超えの急増・急減）
- **Delta**: 前回 snapshot からの有意な差分（prefix 構成変化、新規 dominant prefix 出現）
- **Pattern**: 同一 prefix の反復出現（3回以上）

### 5.3 出力形式

board / heartbeat / scorecard への入力は **signal-only** とする。

- 判断（accept/reject）は含めない
- 推奨度・優先順位付けは含めない
- 事実（数値・prefix・変動幅）と分類（anomaly/delta/pattern）のみを記録する

---

## 6. Board / Heartbeat / Scorecard との契約

### 6.1 Signal-only 契約

本ロールからの board / heartbeat / scorecard への入力は、既存の signal-only contract を維持する。

- `heartbeat_result` の outcome_type は `signal_only` または `agenda_candidate` のみ
- `agent-scorecard-review` への candidate は anomaly/delta のみ
- `autonomy-loop-health-review` への入力も anomaly/delta monitor として扱う

詳細は `docs/heartbeat-governance-report-snapshot-anomaly-delta-spec-v0.2.md` を参照。

### 6.2 既存契約の変更禁止

- heartbeat governance の `1 run = 1 outcome` 制約は変更しない
- board chain の freshness gate は変更しない
- anomaly/delta 駆動の governance 構造は変更しない

---

## 7. 非目標（Non-goals）

- auth / routing / approval / trust-boundary の変更
- telemetry 反復そのものを進捗として扱うこと
- 品質レビュー（accept/reject 判断）の実施
- supervisor-core の観測集約機能の代替
- 実行計画の策定やコード変更の指示
- 既存の governance contract の変更

---

## 8. 関連文書

| 文書 | 関係 |
|---|---|
| `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` | Triage checklist の正本 |
| `projects/openclaw-core/docs/read-only-queue-telemetry-snapshot-spec.md` | Telemetry snapshot の仕様 |
| `projects/openclaw-core/docs/stale-queue-safe-close-reopen-policy.md` | Stale queue の safe-close / reopen ポリシー |
| `projects/openclaw-core/docs/supervisor-core-boundary-definition.md` | Supervisor-core との役割境界 |
| `projects/openclaw-core/docs/agent-staffing-guidelines.md` | ロール定義・スタッフィング |
| `docs/heartbeat-governance-report-snapshot-anomaly-delta-spec-v0.2.md` | Signal-only contract の正本 |
| `projects/openclaw-core/backlog/queue.md` item 8 | Backlog エントリ |

---

## 9. 受入基準

- Operator が telemetry から action まで固定手順で移行できる。
- 反復 prefix は別途実装 task が承認されるまで read-only のまま維持される。
- Runbook は live triage path で利用できる程度に短い。
- 品質レビュー権限を持たないことが明示されている。
- Escalation 条件が客観的かつ再現可能である。
