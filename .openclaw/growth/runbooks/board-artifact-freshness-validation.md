# Runbook: Board Artifact Freshness Validation

> 提案ID: `proposal-2026-03-29-board-artifact-freshness-governance`
> 作成日: 2026-03-29
> カテゴリ: 運用手順書 / Board Governance

---

## 1. 目的

Board cycle アーティファクトの freshness validation を手動・自動で実行する際の手順を定義する。stale 検出時のエスカレーションと対応フローを含む。

---

## 2. 前提条件

- board-freshness-contract.json が配置済み（`growth/config/board-freshness-contract.json`）
- freshness-metrics.json が初期化済み（`runtime/board/freshness-metrics.json`）
- board-freshness-specification.md を参照可能（`docs/board-freshness-specification.md`）

---

## 3. 手動バリデーション手順

### 3.1 単一アーティファクトの検証

**対象**: 特定の board アーティファクトの鮮度を確認したい場合

```
手順:
1. 対象アーティファクトのパスを特定
   例: reports/board/agenda-seed-latest.md

2. アーティファクトのメタデータを確認
   - board_cycle_slot_id: ファイル先頭に記載の slot ID
   - generated_at: 生成時刻

3. 現在の board_cycle_slot_id を特定
   - timezone: Asia/Tokyo
   - フォーマット: YYYYMMDD-HHMM
   - 例: 20260329-1535

4. freshness-contract.json から該当アーティファクト型の max_age_ms を取得

5. freshness_score を計算
   elapsed_ms = now - generated_at
   freshness_score = max(0, 1 - (elapsed_ms / max_age_ms))

6. 判定
   - slot 一致 かつ freshness_score >= 0.1 → FRESH
   - slot 不一致 または freshness_score < 0.1 → STALE
```

### 3.2 全アーティファクトの一括検証

**対象**: board cycle の全アーティファクトの健全性を確認したい場合

```
手順:
1. reports/board/ 配下の -latest ファイルを全て列挙
   ls reports/board/*-latest.md

2. 各ファイルについて 3.1 の手順 2–6 を実行

3. 結果をサマリとしてまとめる
   - fresh: {count}
   - stale: {count}
   - missing: {count}
   - warned: {count}

4. freshness-metrics.json を更新
```

### 3.3 依存チェーンの検証

**対象**: アーティファクト間の依存関係に問題がないか確認したい場合

```
手順:
1. freshness-contract.json から依存関係を取得
   例: premeeting-brief → [agenda-seed]

2. 各アーティファクトの referenced_XXX_slot を確認
   例: premeeting-brief の referenced_agenda_seed_slot

3. 依存先が fresh であることを確認

4. 依存チェーンの整合性を評価
   - 全て fresh → OK
   - 依存先 stale → DEPENDENCY_STALE
   - 依存先 missing → DEPENDENCY_MISSING
```

---

## 4. 自動チェック手順

### 4.1 Cron による定期バリデーション

定期バリデーションは以下のタイミングで実行される。

| タイミング | 頻度 | スコープ |
|-----------|------|---------|
| board slot 開始時 | 各 slot | 全 -latest アーティファクト |
| publish gate | 各 publish | 該当アーティファクト + 依存 |

### 4.2 自動チェックの実行フロー

```
1. current slot を特定
2. freshness-metrics.json を読み込み（前回の状態）
3. 各アーティファクト型について:
   a. -latest ファイルの有無を確認
   b. メタデータから slot_id, generated_at を抽出
   c. slot 一致チェック
   d. freshness_score を計算
   e. 依存アーティファクトの freshness を確認
   f. validation 結果を決定（PUBLISHED/BLOCKED/REJECTED/WARNED）
4. freshness-metrics.json を更新
5. BLOCK/WARN が発生した場合、該当 runbook のアクションを実行
```

### 4.3 自動チェックのログ出力

各チェック結果は以下の形式でログに記録する。

```json
{
  "checked_at": "2026-03-29T15:47:00+09:00",
  "current_slot": "20260329-1545",
  "artifact_type": "agenda-seed",
  "artifact_slot": "20260329-1535",
  "generated_at": "2026-03-29T15:23:00+09:00",
  "elapsed_ms": 1440000,
  "max_age_ms": 3600000,
  "freshness_score": 0.6,
  "validation_result": "PUBLISHED",
  "violations": []
}
```

---

## 5. Stale 検出時のエスカレーション

### 5.1 エスカレーションレベル

| レベル | 条件 | エスカレーション先 | アクション |
|--------|------|------------------|-----------|
| L1: 自動復旧 | auto-regenerable な stale | なし | 自動再生成 |
| L2: supervisor 通知 | auto 不可または 2回連続 stale | supervisor-core | runbook に従い手動対応 |
| L3: board 報告 | 3 slot 連続で stale が継続 | board-operator | 原因調査 + 根本対策の検討 |
| L4: ゆうすけ通知 | board cycle 全体が停止リスク | ゆうすけ | 手動介入を要請 |

### 5.2 エスカレーションのフロー

```
stale 検出
  │
  ├─ auto-regenerable?
  │   ├─ YES → 自動再生成スケジュール（L1）
  │   └─ NO → supervisor-core に通知（L2）
  │
  ├─ 2回連続 stale?
  │   └─ YES → board-operator に報告（L3）
  │
  └─ board cycle 停止リスク?
      └─ YES → ゆうすけに通知（L4）
```

### 5.3 エスカレーション時の必須情報

エスカレーション時には以下の情報を含めること。

- `artifact_type`: stale となったアーティファクト型
- `slot_id`: 該当 slot ID
- `freshness_score`: 検出時のスコア
- `violation_count`: 当該型の累積違反回数
- `root_cause_estimate`: 推定原因（生成遅延、依存 stale、cron 失敗等）
- `suggested_action`: 推奨アクション

---

## 6. Stale アーティファクトの復旧手順

### 6.1 自動再生成

```
1. freshness-contract.json で auto: true を確認
2. 再生成スクリプトを起動（該当アーティファクト型の生成 cron と同等）
3. 生成後、publish gate validation を再実行
4. pass すれば -latest を更新
5. freshness-metrics.json を更新
```

### 6.2 手動再生成

```
1. stale の原因を特定
2. 必要に応じて上流依存の鮮度を先に解決
3. 該当アーティファクトを再生成
4. publish gate validation を実行
5. pass すれば -latest を更新
6. freshness-metrics.json と exception-log.jsonl を更新
```

### 6.3 Archive と置換

```
1. stale アーティファクトを archive/ に移動
2. archived_at, archive_reason, superseded_by を付与
3. 新規アーティファクトを生成して -latest を更新
4. freshness-metrics.json を更新
```

---

## 7. トラブルシューティング

| 症状 | 考えられる原因 | 対応 |
|------|-------------|------|
| 全アーティファクトが stale | cron 実行自体が失敗 | cron ログを確認、再実行 |
| 特定の型だけ連続 stale | 生成 cron のタイムアウト | timeout 設定を確認 |
| freshness_score が急低下 | slot 間隔の変更または cron 遅延 | スケジュールを見直し |
| 依存 stale が伝播 | 上流の生成失敗 | 上流から順に再生成 |
| -latest が更新されない | publish gate で BLOCK されている | validation ログを確認 |

---

## 8. 関連文書

- 仕様: `docs/board-freshness-specification.md`
- ライフサイクル: `governance/board-artifact-lifecycle.md`
- コントラクト: `growth/config/board-freshness-contract.json`
- Cron テンプレート: `growth/cron-wording/board-publish-gate-validation.md`
- メトリクス: `runtime/board/freshness-metrics.json`

---

*この Runbook は `proposal-2026-03-29-board-artifact-freshness-governance` に基づいて作成された。*
