# Board Seed Operations Standard（取締役会 Seed 入力運用標準）

## 目的

取締役会（Board）への議題入力を **seed artifact を一次ソース** として標準化し、入力品質・鮮度・再現性を確保する。
claude-code-precheck 等の補助ソースは二次情報としてのみ扱い、seed-first の入力フローを定義する。

## 対象スコープ

- `reports/board/agenda-seed-latest.md` および timestamped 版
- `reports/board/claude-code-precheck-latest.md`（補助）
- `reports/board/board-premeeting-brief-latest.md`（最終統合）

## 用語定義

| 用語 | 意味 |
|---|---|
| seed artifact | `agenda-seed-latest.md`。各エージェントから収集した議題提案を統合した一次入力。 |
| board slot | 取締役会の開催スロット。`YYYYMMDD-HHMM` 形式。現在は HH:35 が標準。 |
| seed generation | seed artifact を生成する処理。cron / 手動のいずれか。 |
| input_gate | seed の鮮度・完全性をチェックし、下流chainへの流入を制御するゲート。 |
| supplementary source | claude-code-precheck 等、seed を補完する情報源。seed 単独で board を回す際には必須ではない。 |

---

## 1. Seed Artifact 生成スケジュール

### 基本スケジュール

- **生成タイミング**: board slot HH:35 の **15分前**（HH:20）に seed artifact を生成する。
- **slot ID 形式**: `YYYYMMDD-HH20`（例: `20260329-1520`）
- **実行主体**: cron ジョブ（`board_seed_sync.py`）または同等の手動生成スクリプト。

### スケジュール詳細

| 項目 | 値 |
|---|---|
| 生成時刻 | HH:20 JST |
| board slot 時刻 | HH:35 JST |
| リードタイム | 15分 |
| タイムゾーン | Asia/Tokyo (JST) |
| 生成スクリプト | `.openclaw/scripts/board_seed_sync.py` |
| 出力先 | `reports/board/agenda-seed-latest.md` + `reports/board/agenda-seed-{slot_id}.md` |

### 手動生成の許容条件

cron が失敗した場合、以下の条件を満たせば手動生成を許容する。

1. `manual-agenda-seed-latest.md` に手動 seed を配置する。
2. `board_seed_sync.py` を実行して canonical 化する。
3. `generated_at` を実際の生成時刻にする。
4. 手動生成であることを `source_artifact` フィールドに明記する。

---

## 2. Seed Artifact 版管理・Changelog

### 版の識別

- seed artifact は **slot ID で一意に識別** する（semver は使用しない）。
- timestamped ファイル名: `agenda-seed-{slot_id}.md`
- `agenda-seed-latest.md` は常に最新 slot を指すシンボリック参照。

### Changelog 記録

各 slot の生成時に以下を記録する。

```
- slot_id: 20260329-1520
- generated_at: 2026-03-29 15:20 JST
- source_artifact: manual-agenda-seed-latest.md
- agent_count: 12
- deduped_count: 12
- generation_method: cron | manual
- notes: (異常があれば記載)
```

### 版の廃棄・アーカイブ

- timestamped ファイルは **7日間** 保留し、その後アーカイブする。
- `artifact-retention-policy.md` のルールに従う。
- 現在の board cycle で参照中の版はアーカイブしない。

---

## 3. Input Gate 自動化

### Gate 発動条件

seed artifact が存在する場合、**input_gate は自動で発動** する。

### チェック項目

1. **存在確認**: `agenda-seed-latest.md` が存在するか。
2. **鮮度確認**: `board_cycle_slot_id` が現在の slot と一致するか。
3. **生成時刻**: `generated_at` が board slot の15分前〜5分前の範囲内か。
4. **エージェント網羅性**: 提出エージェント数がしきい値（現在12エージェント中8以上）を満たすか。
5. **slot 整合性**: `board_cycle_slot_id`、`generated_at`、ファイル名が同一 slot を指しているか。

### Gate 判定結果

| 結果 | 条件 | 次アクション |
|---|---|---|
| `pass` | 全チェックOK | 下流chain（precheck / premeeting）へ進行 |
| `stale` | slot 不一致 or 生成時刻が古い | seed 再生成を要求。下流chain停止 |
| `incomplete` | エージェント数がしきい値未満 | 警告付きで進行。不足エージェントをログ |
| `mixed` | slot 参照が混在 | 正常化まで停止 |

### Gate 実装参照

- 詳細仕様: `projects/openclaw-core/docs/board-freshness-gate-spec.md`
- Board freshness gate は本標準の gate ルールを下敷きにしている。

---

## 4. 議題候補テンプレート（Board Candidates Standard Template）

### 個別候補の必須フィールド

```markdown
### {議題タイトル}
- **priority**: P1 | P2 | P3
- **background**: 1〜2行で背景と根拠
- **agent**: 提出エージェント名
- **議題**: 議論すべき論点
- **結論**: 推奨結論
- **理由**: 根拠
- **リスク**: 主要リスク
- **次アクション**: 具体的な次ステップ
```

### Priority 定義

| Priority | 定義 | Board 扱い |
|---|---|---|
| P1 | 運用安定性・安全性に直結。即時判断が必要。 | 最優先議題。deep review 対象。 |
| P2 | 標準化・効率化。今 cycle で決定すべき。 | 通常議題。quorum review 対象。 |
| P3 | モデル改善・仕様検討。次 cycle 以降で可。 | 参考情報。discussion only。 |

### 補助情報の記載ルール

- `background` は 1〜2行に制限。詳細は別 artifact へリンク。
- 同種議題の重複は seed 生成時に dedup する（`board_seed_sync.py` の仕様）。
- `claude-code-precheck` からの補足は `## 補足情報 (claude-code-precheck)` セクションに記載し、seed 本文とは明確に分離する。

---

## 5. 補助ソースの位置づけ

### claude-code-precheck

- **位置づけ**: 補助ソース。seed 単独では board を回せない場合の品質補強。
- **入力順序**: seed → precheck（この順で参照）。
- **出力**: seed の重要論点に対する技術的検証・リスク評価。
- **freshness**: seed の slot と一致することが必須。不一致時は `stale_input` として扱う。

### 他の補助ソース

| ソース | 位置づけ | 利用条件 |
|---|---|---|
| `board-premeeting-brief-latest` | 最終統合 | seed + precheck を統合した board 用 brief |
| `report_input_model` | 過去決定の参照 | 直近の decision ledger を集約 |
| heartbeat governance snapshot | 運用健全性 | board cycle 開始前のヘルスチェック |

---

## 6. 運用上の制約

### 変更禁止事項

- seed artifact の基本フォーマット（`agenda-seed-latest.md` の現行構造）を大幅に変更しない。
- board cycle 自体のスケジュール・議論モデル・承認フローを変更しない（入力フローのみ標準化）。
- protected path / auth / trust boundary / routing root の設定は変更しない。

### 変更許容事項

- gate チェックのしきい値調整（エージェント数など）。
- supplementary source の追加・変更。
- template フィールドの拡張（後方互換を維持すること）。

---

## 関連文書

| 文書 | パス |
|---|---|
| Board Freshness Gate Spec | `projects/openclaw-core/docs/board-freshness-gate-spec.md` |
| Board Input Pipeline | `projects/openclaw-core/docs/board-input-pipeline.md` |
| Board Cycle Procedure | `projects/openclaw-core/docs/board-cycle-procedure.md` |
| Artifact Retention Policy | `projects/openclaw-core/docs/artifact-retention-policy.md` |
| Board Governance Model | `docs/board-governance-model.md` |
| board_seed_sync.py | `.openclaw/scripts/board_seed_sync.py` |
| board_premeeting_sync.py | `.openclaw/scripts/board_premeeting_sync.py` |

---

*作成日: 2026-03-29*
*適用開始: 2026-03-29 以降の全 board cycle*
