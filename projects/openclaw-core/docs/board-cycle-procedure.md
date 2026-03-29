# Board Cycle Procedure（取締役会サイクル手順）

## 目的

取締役会（Board）の1サイクルの実行手順を定義する。
入力フローは **seed-first 標準**（`board-seed-operations-standard.md` / `board-input-pipeline.md`）に従い、
board cycle 自体の議論・裁定モデルは既存の Board Governance Model を維持する。

---

## 1. サイクル概要

### タイムライン

| 時刻 | 段階 | 詳細 |
|---|---|---|
| HH:20 | Seed Generation | seed artifact を生成（cron / manual） |
| HH:20〜22 | Input Gate | seed の鮮度・完全性を自動チェック |
| HH:25〜30 | Precheck | claude-code-precheck による技術的検証（補助） |
| HH:30〜35 | Premeeting Brief | seed + precheck を統合した board 用 brief を生成 |
| HH:35 | Board Discussion | 取締役会による議論・裁定 |
| HH:35+ | Postmeeting | 決定の記録・dispatch・follow-up |

### 入力の優先順位

```
1. seed artifact (一次ソース)    ← 必須
2. claude-code-precheck (補助)   ← 推奨
3. decision ledger / signals    ← 参照
```

**seed が stale または missing の場合、board cycle は hold または skip される。**
詳細は `board-input-pipeline.md` の Section 5 を参照。

---

## 2. 各段階の詳細手順

### Phase 1: Seed Generation（HH:20）

**目的**: 全エージェントからの議題提案を収集・統合し、seed artifact を生成する。

**手順**:
1. cron が HH:20 に発火（`board_seed_sync.py`）。
2. `manual-agenda-seed-latest.md` または最新の timestamped 版からソースを取得。
3. canonical 化: ヘッダー正規化、`board_cycle_slot_id` と `generated_at` を付与。
4. 出力:
   - `reports/board/agenda-seed-latest.md`
   - `reports/board/agenda-seed-{slot_id}.md`

**正常終了条件**:
- `agenda-seed-latest.md` が更新されている。
- `board_cycle_slot_id` が正しい slot を指している。
- 提出エージェント数 ≥ 8。

**異常時**: `board-input-pipeline.md` Section 6 のエラーハンドリングに従う。

### Phase 2: Input Gate（HH:20〜22）

**目的**: seed の鮮度・完全性を検証し、下流chainへの流入を制御する。

**手順**:
1. `agenda-seed-latest.md` の存在確認。
2. `board_cycle_slot_id` が現在 slot と一致するか確認。
3. `generated_at` が HH:20±5分の範囲内か確認。
4. 提出エージェント数がしきい値以上か確認。
5. gate result を `pass` / `stale` / `incomplete` / `mixed` で出力。

**gate pass**: Phase 3 へ進行。
**gate fail**: seed 再生成を要求。下流chain停止。`signals.jsonl` に記録。

**詳細**: `board-freshness-gate-spec.md` および `board-input-pipeline.md` Section 3。

### Phase 3: Precheck（HH:25〜30）

**目的**: seed の内容を技術的観点から検証する（補助）。

**手順**:
1. Claude Code が `agenda-seed-latest.md` を読み取り、重要論点を抽出。
2. 技術的実現可能性、リスク、依存関係を評価。
3. `claude-code-precheck-latest.md` を出力。

**入力**: `agenda-seed-latest.md`（seed gate pass 後のみ）
**出力**: `claude-code-precheck-latest.md`

**制約**:
- seed の `board_cycle_slot_id` と一致しない場合は `stale_input` として扱う。
- precheck 単独で board 入力として扱わない。
- Claude Code の auth 失敗時は seed 単独で board を回すことができる。

### Phase 4: Premeeting Brief（HH:30〜35）

**目的**: seed + precheck を統合し、board 開催用の最終 brief を生成する。

**手順**:
1. `board_premeeting_sync.py` が実行される。
2. seed artifact と precheck を読み取り、統合。
3. 直近の decision ledger から関連する過去決定を参照。
4. `board-premeeting-brief-latest.md` を出力。

**入力**: seed + precheck + decision ledger
**出力**: `board-premeeting-brief-latest.md`

**制約**:
- seed が stale の場合は生成しない。
- precheck が missing の場合、seed 単独で brief を生成してよい（警告付き）。

### Phase 5: Board Discussion（HH:35）

**目的**: 取締役会が議論・裁定を行う。

**手順**:
1. `board-premeeting-brief-latest.md` を全 board agent に配信。
2. 各 agent が議論フレームに従って発言（Board Governance Model の内部討論モデル）。
3. 議論・反対意見・代替案・リスク評価・優先順位づけを行う。
4. 採用 / 保留 / 却下を裁定案としてまとめる。

**入力**: premeeting brief
**出力**: 議論結果・裁定案

**制約**:
- 本フェーズのモデル・フローは変更しない（seed-first 標準は入力フローのみ）。
- 緊急短縮経路（Rule 5）では seed のみを入力として使用し、precheck / brief は skip してよい。

### Phase 6: Postmeeting（HH:35+）

**目的**: 決定を記録・配信し、follow-up を管理する。

**手順**:
1. 裁定結果を `decision-ledger.jsonl` に記録。
2. 必要に応じて `precedent-record` や `standing-approval` を作成。
3. 保留・調査対象は `deferred-queue.jsonl` に記録。
4. dispatch report を生成し、関係 agent に配信。
5. follow-up due / reopen candidate を管理。

**詳細**: `board_runtime.py` の各関数（`build_decision_from_case`, `write_decision` 等）を参照。

---

## 3. Seed-First 入力標準の参照

本手順の **Phase 1〜4（入力フロー）** は以下の標準に従う。

| 標準 | 適用フェーズ |
|---|---|
| `board-seed-operations-standard.md` | Phase 1, Phase 2 |
| `board-input-pipeline.md` | Phase 1〜4 全体 |
| `board-freshness-gate-spec.md` | Phase 2（Input Gate） |

**重要**: board cycle 自体（Phase 5, 6）の議論モデル・承認フロー・決定プロセスは、既存の Board Governance Model を変更しない。seed-first 標準は入力の品質・鮮度を担保するためだけに適用される。

---

## 4. 例外処理

### 緊急短縮経路（Board Governance Model Rule 5）

- 緊急時は seed のみを最低限の入力として board を開催してよい。
- precheck / premeeting brief は skip してよい。
- 事後に board review を残す（Rule 5 の既存ルール）。

### cron 失敗時

- 手動生成フローで seed を作成する。
- `manual-agenda-seed-latest.md` → `board_seed_sync.py` の順で実行。
- 手動生成であることを `source_artifact` に明記。

### Claude Code precheck 失敗時

- seed 単独で board を回す。
- precheck の失敗理由を `signals.jsonl` に記録。

### 全 chain stale 時

- board cycle を完全に skip し、次 slot に延期。
- skip は `agenda-candidates.jsonl` に記録。
- `signals.jsonl` に `stale_seed_skip` を emit。

---

## 5. 関連文書

| 文書 | パス | 関連フェーズ |
|---|---|---|
| Board Seed Operations Standard | `projects/openclaw-core/docs/board-seed-operations-standard.md` | Phase 1〜2 |
| Board Input Pipeline | `projects/openclaw-core/docs/board-input-pipeline.md` | Phase 1〜4 |
| Board Freshness Gate Spec | `projects/openclaw-core/docs/board-freshness-gate-spec.md` | Phase 2 |
| Board Governance Model | `docs/board-governance-model.md` | Phase 5〜6 |
| Artifact Retention Policy | `projects/openclaw-core/docs/artifact-retention-policy.md` | 全体 |
| board_seed_sync.py | `.openclaw/scripts/board_seed_sync.py` | Phase 1 |
| board_premeeting_sync.py | `.openclaw/scripts/board_premeeting_sync.py` | Phase 4 |
| board_runtime.py | `.openclaw/scripts/board_runtime.py` | Phase 5〜6 |

---

*作成日: 2026-03-29*
*適用開始: 2026-03-29 以降の全 board cycle*
