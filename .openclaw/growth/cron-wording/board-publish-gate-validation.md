# Cron Wording: Board Publish Gate Freshness Validation

> 提案ID: `proposal-2026-03-29-board-artifact-freshness-governance`
> 作成日: 2026-03-29
> 適用先: board cycle cron jobs (publish gate validation)

---

## 1. 概要

Board cycle の各アーティファクトが publish gate を通過する前に、freshness validation を実行する cron wording テンプレート。

このテンプレートは、board-agenda-assembly、board-premeeting-brief、board-dispatch-verification 等、publish gate を通る全ての cron ジョブの freshness チェックセクションに組み込む。

---

## 2. Freshness Validation セクション（prompt 挿入用）

以下のテキストを、該当 cron ジョブの prompt の publish 前チェックセクションに挿入する。

```
## Publish Gate Freshness Validation

以下のチェックを publish 前に必ず実行すること。

### Step 1: Current Slot の特定
- 現在の board_cycle_slot_id を特定（フォーマット: YYYYMMDD-HHMM）
- timezone: Asia/Tokyo

### Step 2: Artifact Freshness 確認
対象アーティファクト（{artifact_type}）について以下を確認:
1. `board_cycle_slot_id` が current slot と完全一致すること
2. `generated_at` から現在までの経過時間が max_age_ms（{max_age_ms}ms）以内であること
3. 必須フィールド（{required_fields}）が全て存在すること
4. freshness_score（1 - elapsed/max_age）が 0.1 以上であること

### Step 3: 依存アーティファクトの確認
上流依存（{dependencies}）が存在する場合:
1. 各依存の board_cycle_slot_id が current slot と一致すること
2. 各依存の freshness_score が 0.1 以上であること

### Step 4: 判定とアクション
- 全チェック pass → PUBLISHED として扱い、-latest エイリアスを更新
- BLOCK 条件に該当 → publish を中断し、再生成をスケジュール
- WARN 条件に該当 → publish を継続するが、レポートに警告を記載
- REJECT 条件に該当 → artifact を破棄し、再生成を要求

### Step 5: 結果の記録
validation 結果を以下の形式でレポートに記載:
```
freshness_validation:
  artifact_type: {type}
  slot_id: {slot}
  freshness_score: {score}
  validation_result: PUBLISHED|BLOCKED|REJECTED|WARNED
  checked_at: {timestamp}
  violations: [{violation_list}]
```
```

---

## 3. 実行タイミング

| タイミング | 頻度 | 実行対象 |
|-----------|------|---------|
| **publish 前チェック** | 各アーティファクトの publish 時 | 該当アーティファクトの freshness |
| **定期バッチチェック** | 30分間隔 | 全 board アーティファクトの鮮度 |
| **slot 開始時チェック** | 各 slot 開始直後 | 前 slot のアーカイブ状況 |

---

## 4. 失敗時のアクション

### 4.1 BLOCK（publish 拒否）

```
## BLOCK アクション

1. 該当アーティファクトの publish を中断
2. stale 原因を特定:
   - slot 不一致 → current slot で再生成
   - max_age 超過 → 再生成をスケジュール
   - 依存 stale → 上流の再生成を先に実行
3. 再生成が auto 再生成可能か確認（board-freshness-contract.json 参照）
4. runtime/board/freshness-metrics.json の violation_count をインクリメント
5. 次の board cycle レポートに stale 事象を記録
```

### 4.2 REJECT（artifact 破棄）

```
## REJECT アクション

1. 該当アーティファクトを破棄対象としてマーク
2. 必須フィールドの欠落をログに記録
3. 再生成を要求（必須フィールドを補完した上で）
4. violation_count をインクリメント
```

### 4.3 WARN（警告付き継続）

```
## WARN アクション

1. 警告内容をレポートの freshness_validation セクションに記録
2. 警告の重大度に応じて、次サイクルでの改善を推奨
3. freshness_score をメトリクスに記録
4. 連続 WARN が 3 slot 以上続く場合、board 議題に上げる
```

---

## 5. アーティファクト型別のパラメータ割り当て

cron ジョブの `{placeholder}` を以下の値で置換する。

| アーティファクト型 | max_age_ms | required_fields | dependencies |
|------------------|-----------|----------------|--------------|
| agenda-seed | 3600000 | board_cycle_slot_id, generated_at, candidate_count | — |
| premeeting-brief | 3600000 | board_cycle_slot_id, generated_at, referenced_agenda_seed_slot | agenda-seed |
| claude-code-precheck | 3600000 | board_cycle_slot_id, generated_at, input_gate | agenda-seed, premeeting-brief |
| dispatch-result | 5400000 | board_cycle_slot_id, generated_at, dispatch_status | premeeting-brief |
| postmeeting-memo | 7200000 | board_cycle_slot_id, generated_at, memo_type | dispatch-result |
| board-input-brief | 3600000 | board_cycle_slot_id, generated_at, input_gate | agenda-seed |
| board-ops-brief | 3600000 | board_cycle_slot_id, generated_at | — |

---

## 6. Cron ジョブへの適用手順

1. 対象 cron ジョブの prompt ファイルを特定
2. publish 前チェックのセクションに Step 2 のテンプレートを挿入
3. `{placeholder}` を対象アーティファクト型のパラメータで置換
4. 結果記録フォーマットを Step 5 に合わせる
5. cron 実行後、freshness-metrics.json が更新されていることを確認

---

*このテンプレートは `proposal-2026-03-29-board-artifact-freshness-governance` に基づいて作成された。*
*契約定義: `growth/config/board-freshness-contract.json`*
*仕様: `docs/board-freshness-specification.md`*
