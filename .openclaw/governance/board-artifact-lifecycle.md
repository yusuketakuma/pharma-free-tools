# Board Artifact Lifecycle Governance

> 提案ID: `proposal-2026-03-29-board-artifact-freshness-governance`
> 作成日: 2026-03-29
> カテゴリ: Board Governance / Artifact Lifecycle

---

## 1. 目的

Board cycle で生成・消費されるアーティファクトのライフサイクル（作成→レビュー→公開→アーカイブ）を統一的に管理し、鮮度保証・版管理・stale 成果物の取り扱いを明確化する。

## 2. ライフサイクルステージ

### 2.1 ステージ定義

```
CREATED ──→ REVIEWED ──→ PUBLISHED ──→ ARCHIVED
   │             │              │
   └── FAILED ──┘              └── STALE ──→ REGENERATED
```

| ステージ | 定義 | 遷移条件 |
|---------|------|---------|
| `CREATED` | アーティファクトが生成され、メタデータ付与済み | 生成成功 |
| `REVIEWED` | publish gate の freshness validation 通過 | 全必須チェック pass |
| `PUBLISHED` | `-latest` エイリアスで参照可能な状態 | review 承認 + publish 完了 |
| `ARCHIVED` | slot 終了後、履歴用として保存 | 次slotのアーティファクトが published |
| `STALE` | freshness threshold 超過 | max_age 到達、または slot 不一致 |
| `FAILED` | 生成中にエラーが発生 | 例外・タイムアウト |
| `REGENERATED` | stale / failed を新規生成で置換 | 再生成成功 |

### 2.2 ステージ遷移ルール

1. **CREATED → REVIEWED**: publish gate validation が全必須チェックを通過した場合にのみ遷移
2. **REVIEWED → PUBLISHED**: review 承認後、atomic publish で `-latest` エイリアスを更新
3. **PUBLISHED → ARCHIVED**: 次slotの同型アーティファクトが PUBLISHED になった時点で自動アーカイブ
4. **任意ステージ → STALE**: freshness validation が失敗した場合、即座に STALE に遷移
5. **STALE → REGENERATED**: 再生成スクリプトまたは手動操作で新規アーティファクトを作成

### 2.3 ステージの不可逆性

- `ARCHIVED` → 他ステージへの復帰は不可（閲覧のみ可能）
- `REGENERATED` は新しいアーティファクトインスタンスとして CREATED から開始

## 3. Versioning Rules

### 3.1 Version フォーマット

```
{artifact_type}-v{major}.{slot_index}
```

- `artifact_type`: agenda-seed, premeeting-brief, precheck 等
- `major`: board cycle day（YYYYMMDD）
- `slot_index`: 当日の slot 通番（00, 01, 02, ...）

例: `agenda-seed-v20260329.05`

### 3.2 バージョン管理のルール

| ルール | 説明 |
|--------|------|
| **単一ソース** | 同一 slot 内で同型アーティファクトは1つのみ PUBLISHED |
| **上書き禁止** | PUBLISHED アーティファクトの内容変更は不可 |
| **再生成** | stale 修正は新バージョンとして作成 |
| **slot固定** | `board_cycle_slot_id` は生成時に固定し、変更不可 |
| **timestamp固定** | `generated_at` は生成時刻を正とし、更新不可 |

### 3.3 ファイル命名規則

```
reports/board/{artifact_type}-{slot_id}.md     # slot 固定版
reports/board/{artifact_type}-latest.md          # latest エイリアス
reports/board/archive/{artifact_type}-{slot_id}.md  # アーカイブ版
```

## 4. Stale Artifact Handling

### 4.1 検出と分類

stale 検出の詳細は `board-freshness-specification.md` 第4節を参照。

検出された stale アーティファクトは以下の分類に従って処理する。

| 分類 | 処理 |
|------|------|
| **auto-regenerable** | 自動再生成スクリプトで置換可能なもの |
| **manual-review-required** | 内容確認が必要で手動再生成が必要なもの |
| **safe-to-archive** | 依存する下流がないため、そのままアーカイブ可能なもの |
| **blocking** | 下流アーティファクトの生成をブロックしているもの |

### 4.2 処理フロー

```
stale 検出
  ├─ auto-regenerable → 即座に再生成スケジュール
  ├─ manual-review-required → supervisor-core に通知、runbook に従い手動対応
  ├─ safe-to-archive → archive/ に移動、-latest からは参照除外
  └─ blocking → 緊急通知 + board cycle 進行を一時停止
```

### 4.3 Archive ポリシー

- **保持期間**: 原則無期限（disk 容量に依存）
- **保存先**: `reports/board/archive/`
- **メタデータ**: archive 時に `archived_at`, `archive_reason`, `superseded_by` を付与
- **アクセス**: 参照のみ可能、変更不可

## 5. 例外処理プロセス（Out-of-Cycle Updates）

### 5.1 対象ケース

以下の場合に、通常の cycle 外でアーティファクトを更新または再生成する。

| ケース | 例 |
|--------|-----|
| 緊急修正 | board cycle に重大な誤りが発覚 |
| 依存関係の修正 | 上流アーティファクトの修正に伴う下流の再生成 |
| 監査要求 | board-auditor からの修正指示 |
| 手動介入 | ゆうすけの直接指示による更新 |

### 5.2 例外プロセスの手順

1. **要求の記録**: `runtime/board/exception-log.jsonl` に例外要求を記録
   - required fields: `requester`, `artifact_type`, `reason`, `requested_at`, `urgency`
2. **影響評価**: 依存する下流アーティファクトを特定
3. **承認**: 緊急度に応じて以下の承認経路
   - `low`: supervisor-core の self-approval
   - `high`: board-operator の承認
   - `critical`: ゆうすけの manual approval
4. **実行**: freshness validation を再実行し、pass すれば再 publish
5. **通知**: 変更内容を次の board cycle レポートに記載

### 5.3 例外の制約

- 例外更新は **1 slot あたり最大3回** まで
- 同一アーティファクトの連続例外更新は **3 slot 以上の間隔** を空けることを推奨
- 例外更新されたアーティファクトには `out_of_cycle: true` フラグを付与
- 例外の多用が継続する場合、根本原因の調査を board 議題に上げる

## 6. 責任分界

| 役割 | 責任 |
|------|------|
| **board-agenda-assembly** | agenda-seed の生成と freshness 管理 |
| **board-premeeting-brief** | premeeting-brief の生成と上流鮮度確認 |
| **board-claudecode-precheck** | precheck の実行と input_gate 判定 |
| **board-dispatch-verification** | dispatch 結果の検証と鮮度確認 |
| **board-operator** | 例外処理の承認と archive 管理 |
| **board-auditor** | lifecycle 準拠の監査と違反報告 |
| **supervisor-core** | cron validation の実行と stale 検出の一次対応 |

## 7. 運用ガイドライン

1. **定常運用**: 各 board cycle のアーティファクトは自動生成・自動検証を前提とする
2. **介入の最小化**: 自動処理で解決できる stale は自動で再生成する
3. **可視化**: 全アーティファクトのステータスを `freshness-metrics.json` で一覧可能にする
4. **改善ループ**: violation のパターンを分析し、max_age や生成スケジュールを適宜調整する

---

*この文書は `proposal-2026-03-29-board-artifact-freshness-governance` に基づいて作成された。*
*関連仕様: `docs/board-freshness-specification.md`*
