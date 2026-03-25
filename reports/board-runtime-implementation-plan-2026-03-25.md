# Board runtime implementation plan

Date: 2026-03-25

## 今回進めた範囲

Phase 0〜1 の先行実装として、次を追加した。

1. 正式仕様書
2. board runtime 用 schema 群
3. risk scoring 設定ファイル
4. Decision Ledger 最小実装
5. ledger reader / snapshot / unresolved view

---

## 追加した主要ファイル

### docs
- `docs/board-agenda-layer-decision-ledger-spec-v0.1.md`

### schemas
- `.openclaw/schemas/signal-event.schema.json`
- `.openclaw/schemas/agenda-candidate.schema.json`
- `.openclaw/schemas/agenda-case.schema.json`
- `.openclaw/schemas/decision-record.schema.json`
- `.openclaw/schemas/precedent-record.schema.json`
- `.openclaw/schemas/standing-approval.schema.json`
- `.openclaw/schemas/deferred-item.schema.json`

### config
- `.openclaw/config/board-risk-scoring.json`

### scripts
- `.openclaw/scripts/board_runtime.py`

---

## 現時点でできること

- signal / candidate / case / decision / precedent / standing approval / deferred の schema validation
- decision ledger への append-only 保存
- precedent / deferred queue の append-only 保存
- 直近 ledger snapshot の生成
- unresolved item の集計
- report 向け board decision view の生成

---

## 次の実装順

### Priority 1
- `tama-regular-progress-report` を ledger reader 化

### Priority 2
- `cross-agent-knowledge-sync` と `agent-lesson-capture` を candidate producer 化

### Priority 3
- precedent matcher / risk scorer / lane router 実装

### Priority 4
- board-agenda-assembly cron 新設

---

## Recommendation

次は report を ledger 起点へ寄せるのが最も効果が高い。これにより Board の再審議を減らし、仕様の価値を最短で実感できる。
