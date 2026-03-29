# Board Artifact Freshness Specification

> 提案ID: `proposal-2026-03-29-board-artifact-freshness-governance`
> 作成日: 2026-03-29
> カテゴリ: Board Governance / Artifact Lifecycle

---

## 1. 目的

Board cycle の各アーティファクト（agenda-seed, premeeting-brief, precheck, dispatch-result 等）について、publish 時点での鮮度（freshness）を定義・検証し、stale な成果物が配信されることを防ぐ。

## 2. 鮮度の定義

### 2.1 Freshness Threshold

アーティファクトは **現在の board cycle slot** で生成されたものを「fresh」と判定する。

- **slot フォーマット**: `YYYYMMDD-HHMM`（例: `20260329-1535`）
- **slot 生成間隔**: 原則 1時間（cron 実行周期に依存）
- **freshness window**: slot 開始時刻から `max_age_ms` 以内のアーティファクトを fresh とみなす
  - デフォルト: `3,600,000 ms`（1時間 = 1 slot 周期）
  - slot をまたぐ生成は、次の slot の開始時刻まで freshness を維持

### 2.2 Slot Alignment

アーティファクトの `board_cycle_slot_id` は、publish 時点の current slot と **完全一致** しなければならない。

- **完全一致**: `artifact.board_cycle_slot_id === current_slot`
- **tolerance**: なし（厳密一致）
- **例外**: `allow_retroactive` フラグが有効なアーティファクト型のみ、前 slot を許容

### 2.3 Freshness Score

各アーティファクトの鮮度を 0.0–1.0 のスコアで定量化する。

```
freshness_score = max(0, 1 - (elapsed_ms / max_age_ms))
```

- `1.0` = 生成直後
- `0.5` = max_age の半分経過
- `0.0` = max_age 経過（stale）

## 3. Publish Gate Validation Checks

### 3.1 必須チェック（全アーティファクト共通）

| チェック | 条件 | 失敗時の挙動 |
|---------|------|-------------|
| `slot_match` | `artifact.board_cycle_slot_id === current_slot` | BLOCK |
| `max_age` | `elapsed_ms < max_age_ms` | BLOCK |
| `freshness_score` | `score >= 0.1` | BLOCK |
| `required_fields` | slot_id, generated_at, artifact_type が存在 | REJECT |

### 3.2 アーティファクト型別チェック

| アーティファクト型 | 追加チェック | 失敗時の挙動 |
|------------------|-------------|-------------|
| `agenda-seed` | candidate_count >= 0 | WARN |
| `premeeting-brief` | 参照先 agenda-seed が fresh | BLOCK |
| `claude-code-precheck` | input_gate が ready/delayed のいずれか | WARN |
| `dispatch-result` | 参照先 premeeting-brief が fresh | BLOCK |
| `postmeeting-memo` | dispatch 結果が存在 | WARN |

### 3.3 バリデーション結果のステータス

```
PUBLISHED    : 全チェック通過、publish 完了
BLOCKED      : BLOCK チェック失敗、publish 拒否
REJECTED     : REJECT チェック失敗、artifact 破棄
WARNED       : WARN 付きで publish（ログに記録）
PENDING      : 依存アーティファクト待ち
```

## 4. Stale Artifact Detection

### 4.1 検出条件

アーティファクトが以下のいずれかに該当する場合、**stale** と判定する。

1. `elapsed_ms >= max_age_ms`（threshold 超過）
2. `board_cycle_slot_id` が current slot より古い
3. 参照先アーティファクトが stale である（伝播）
4. `freshness_score < 0.1`

### 4.2 検出タイミング

- **publish gate**: publish 前に必ず実行
- **precheck**: board cycle precheck 段階
- **cron validation**: 定期バッチチェック（推奨: 30分間隔）
- **on-demand**: 手動 validation（runbook 参照）

### 4.3 Stale 状態の分類

| 状態 | 定義 | 処理 |
|-----|------|-----|
| `stale` | max_age 超過、slot 不一致 | publish block |
| `observed-late` | 新規生成済みだが current slot に間に合わなかった | 次slotで再評価 |
| `orphaned` | 依存元が missing または stale | 依存解消まで保留 |
| `superseded` | 同型のより新しい artifact が存在 | archive へ移動 |

## 5. Freshness Metrics

### 5.1 追跡する指標

| 指標名 | 説明 | 単位 | 集計 |
|--------|------|-----|------|
| `freshness_score` | 各アーティファクトの鮮度スコア | 0.0–1.0 | per-artifact |
| `violation_count` | freshness チェック失敗回数 | count | per-type, per-slot |
| `block_rate` | BLOCK された publish 割合 | ratio | per-slot |
| `warn_rate` | WARN された publish 割合 | ratio | per-slot |
| `stale_artifact_count` | stale 状態のアーティファクト数 | count | per-slot |
| `avg_freshness_by_type` | アーティファクト型別平均鮮度 | 0.0–1.0 | per-cycle |
| `time_to_fresh` | 生成から publish までの所要時間 | ms | per-artifact |
| `slot_alignment_rate` | slot 一致率 | ratio | per-cycle |

### 5.2 メトリクスの出力先

- `runtime/board/freshness-metrics.json` — 最新の集計値
- board cycle レポートの freshness セクション — サイクルごとのサマリ

### 5.3 アラート閾値

| 条件 | レベル | アクション |
|-----|--------|-----------|
| `freshness_score < 0.3` | WARNING | 次cycleでの再生成を推奨 |
| `block_rate > 0.2` (3連続slot) | CRITICAL | 原因調査を要求 |
| `stale_artifact_count > 5` | WARNING | 一括再生成を検討 |
| `slot_alignment_rate < 0.5` | CRITICAL | board cycle 自体の健全性を確認 |

## 6. 用語定義

| 用語 | 定義 |
|-----|------|
| **fresh** | current slot 内で生成され、max_age 以内のアーティファクト |
| **stale** | freshness threshold を超過したアーティファクト |
| **publish gate** | アーティファクトを公開前に検証するチェックポイント |
| **slot** | board cycle の単位時間窓（YYYYMMDD-HHMM） |
| **slot alignment** | アーティファクトの slot_id が current slot と一致していること |
| **freshness contract** | アーティファクト型ごとの max_age と validation ルールの定義 |

---

*この仕様は `proposal-2026-03-29-board-artifact-freshness-governance` に基づいて作成された。*
