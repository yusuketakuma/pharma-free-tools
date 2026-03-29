# Board Input Pipeline（取締役会入力パイプライン）

## 目的

取締役会（Board）への入力フローを定義する。
**seed artifact を一次ソース** とし、claude-code-precheck 等を補助ソースとして扱う。
input_gate による鮮度チェックを自動化し、stale な入力が下流に流れないようにする。

---

## 1. パイプライン全体像

```text
HH:20 ──── seed 生成 ──── input_gate ──── HH:25〜30 ──── precheck (補助) ──── HH:30〜35 ──── premeeting brief ──── HH:35 ──── board 開催
              │                │                      │                           │                          │
              ▼                ▼                      ▼                           ▼                          ▼
      agenda-seed-latest  freshness check   claude-code-precheck-latest   board-premeeting-brief-latest   board discussion
```

### 各段階の役割

| 段階 | 時刻 | 主体 | 入力 | 出力 | 役割 |
|---|---|---|---|---|---|
| Seed Generation | HH:20 | cron / manual | エージェント提出 | `agenda-seed-latest.md` | 議題の一次収集・統合 |
| Input Gate | HH:20〜22 | 自動（gate check） | seed artifact | gate result | 鮮度・完全性の検証 |
| Precheck | HH:25〜30 | Claude Code | seed artifact | `claude-code-precheck-latest.md` | 技術的検証・リスク評価 |
| Premeeting Brief | HH:30〜35 | board_premeeting_sync | seed + precheck | `board-premeeting-brief-latest.md` | board 用最終統合 |
| Board | HH:35 | board agents | premeeting brief | 議論・裁定 | 意思決定 |

---

## 2. Seed Artifact（一次ソース）

### 位置づけ

seed artifact は board 入力の **唯一の一次ソース** である。
precheck、brief、その他の補助情報はすべて seed に依存して生成される。

### 生成フロー

1. **cron 発火**: HH:20 JST に `board_seed_sync.py` が実行される。
2. **ソース読み取り**: `manual-agenda-seed-latest.md`（手動生成分）または timestamped 版から最新を取得。
3. **canonical 化**: ヘッダー・メタ情報を正規化し、`board_cycle_slot_id` と `generated_at` を付与。
4. **出力**:
   - `reports/board/agenda-seed-latest.md`（最新参照）
   - `reports/board/agenda-seed-{slot_id}.md`（版管理用）

### フォーマット要件

- 既存の `agenda-seed-latest.md` フォーマットを維持する（大幅な変更なし）。
- 必須メタフィールド: `board_cycle_slot_id`, `generated_at`, `source_artifact`。
- 各エージェント提出は `### {agent_name}` セクションに収録。

### Claude Code Precheck との関係

- precheck は seed の内容を読み取り、技術的観点から評価する。
- precheck は seed を **上書きしない**。
- precheck の `board_cycle_slot_id` は seed の slot と一致しなければならない。

---

## 3. Input Gate 自動化

### 概要

seed artifact が生成された直後に input_gate が自動発動し、鮮度チェックを行う。

### Gate チェックフロー

```text
seed 生成完了
    │
    ▼
agenda-seed-latest.md 存在確認
    │ 存在しない → FAIL (seed_missing)
    ▼
board_cycle_slot_id 抽出
    │ 抽出不能 → FAIL (slot_missing)
    ▼
slot と現在時刻の整合確認
    │ 不一致 → FAIL (stale)
    ▼
generated_at の妥当性確認 (HH:20±5min)
    │ 範囲外 → FAIL (stale)
    ▼
提出エージェント数確認 (≥8/12)
    │ 不足 → WARN (incomplete)
    ▼
PASS → 下流chainへ進行許可
```

### Gate 結果とアクション

| 結果 | 意味 | アクション |
|---|---|---|
| `pass` | 全チェック合格 | precheck / premeeting へ進行 |
| `stale` | slot または生成時刻が古い | seed 再生成。下流全chain停止。 |
| `incomplete` | エージェント提出が不足 | 警告ログを出力。進行は許可。 |
| `mixed` | slot 参照が混在している | 正常化まで停止。 |
| `seed_missing` | seed が存在しない | 手動生成または cron 再発火。 |

### Gate の実装位置

- gate check は seed 生成直後に実行する。
- board-premeeting-sync の冒頭でも再チェックする（二重確認）。
- freshness gate spec のルールを適用: `projects/openclaw-core/docs/board-freshness-gate-spec.md`

---

## 4. 補助ソース（Supplementary Sources）

### claude-code-precheck

- **タイミング**: seed gate pass 後、HH:25〜30 に実行。
- **入力**: `agenda-seed-latest.md`
- **出力**: `claude-code-precheck-latest.md`
- **役割**: seed の重要論点に対する技術的検証、リスク評価、実現可能性の判断。
- **制約**:
  - seed の slot と一致しない場合は `stale_input` として出力し、下流に流さない。
  - precheck 単独で board 入力として扱わない。

### board-premeeting-brief

- **タイミング**: seed + precheck の両方が揃った後、HH:30〜35 に生成。
- **入力**: seed + precheck + decision ledger
- **出力**: `board-premeeting-brief-latest.md`
- **役割**: board 開催用の最終統合ドキュメント。
- **制約**: seed が stale の場合は生成しない。

---

## 5. Stale 時の Fallback 振る舞い

### 定義

seed artifact が以下のいずれかの条件を満たす場合、**stale** と判定する。

1. `board_cycle_slot_id` が現在の slot と不一致。
2. `generated_at` が現在時刻から 30分以上前。
3. seed ファイルが存在しない。

### Fallback ルール

| 状態 | Fallback アクション |
|---|---|
| seed stale | board cycle を **hold** にする。seed 再生成を試行。 |
| seed missing | cron 再発火または手動生成。board cycle は遅延。 |
| precheck stale | precheck を再実行。seed が pass なら precheck 単独の stale は board 遅延の理由にならない。 |
| brief stale | seed と precheck の両方が pass なら brief を再生成。 |
| 全 chain stale | board cycle を完全にスキップし、次 slot に延期。skip は `agenda-candidates.jsonl` に記録。 |

### Fallback 時の通知

- stale による board cycle 遅延・skip が発生した場合、次を記録する。
  - `runtime/board/signals.jsonl` に signal を emit する。
  - 信号には `stale_seed_hold` または `stale_seed_skip` タイプを付与。
  - 理由と次アクションを含める。

---

## 6. エラーハンドリング

### cron 失敗時

1. cron 失敗を検知（exit code ≠ 0 または timeout）。
2. `signals.jsonl` に `seed_generation_failed` を記録。
3. 手動介入を要求（`manual_required` ステータス）。
4. 手動生成は `manual-agenda-seed-latest.md` → `board_seed_sync.py` のフローで行う。

### precheck 失敗時

1. Claude Code 実行の失敗（auth / timeout / error）。
2. `claude-code-precheck-latest.md` にエラー情報を記録。
3. seed 単独で board を回すか、cycle を遅延するかは operator が判断する。
4. 判断結果を `signals.jsonl` に記録。

### gate 判定エラー時

1. gate check 自体が例外を投げた場合。
2. **fail-closed**: ゲート結果を `stale` として扱い、下流を停止する。
3. エラー詳細を `signals.jsonl` に記録。

---

## 7. 運用上の制約

### スコープ外

- board cycle の議論モデル・承認フロー・決定プロセスは変更しない。
- protected path / auth / trust boundary / routing root の設定は変更しない。
- seed artifact の基本フォーマットは大幅に変更しない。

### 適用範囲

- 全ての board cycle に本パイプラインを適用する。
- 緊急時の短縮経由（Board Governance Model Rule 5）では、seed のみを最低限の入力として使用し、precheck は skip してよい。

---

## 関連文書

| 文書 | パス |
|---|---|
| Board Seed Operations Standard | `projects/openclaw-core/docs/board-seed-operations-standard.md` |
| Board Freshness Gate Spec | `projects/openclaw-core/docs/board-freshness-gate-spec.md` |
| Board Cycle Procedure | `projects/openclaw-core/docs/board-cycle-procedure.md` |
| Artifact Retention Policy | `projects/openclaw-core/docs/artifact-retention-policy.md` |
| Board Governance Model | `docs/board-governance-model.md` |

---

*作成日: 2026-03-29*
*適用開始: 2026-03-29 以降の全 board cycle*
