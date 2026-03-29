# Postmeeting Dispatch Memo — 2026-03-26 08:41 JST

## 短い更新
- Board の採択軸は収束済み: stale queue backlog の safe-close / reopen / escalate、dominant-prefix triage の専任化、routine output の signal-only 化。
- 継続調査は 2点: board runtime producer map の統一、bundle manifest + dry-run / smoke の固定。
- 触らない範囲は維持: auth / trust boundary / routing / approval / Telegram 根幹。

## 内部ディスパッチ方針
- 即時着手: supervisor-core, doc-editor, research-analyst, ops-automator, board-auditor, board-operator
- 待機: github-operator, dss-manager, opportunity-scout
- 監視条件: exception / delta / precedent gap のみを上げる

## 例外管理
- routine heartbeat / board / scorecard は signal-only を維持
- 自動 drain はしない
- publish は dry-run 後に限定
