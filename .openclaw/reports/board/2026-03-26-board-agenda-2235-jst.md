# Board Agenda Layer Report

## 結論
Board 本会議の主要論点は 2 件に圧縮する。
自己改善 proposal は通常論点から切り離し、2 件を個別に判定する。

## 取込サマリ
- self-improvement proposal inbox 件数: 2
- Board が扱った自己改善 proposal 件数: 2
- 主要論点: 2 クラスタ

## 主要論点（最大3件）

### 1. monitoring / reporting contract を signal-only 基準へ寄せる
- まとめ方: routine board / heartbeat / scorecard は steady-state では signal-only、candidate は anomaly delta / threshold breach のみ
- 関連 proposal / case:
  - proposal-20260326-anomaly-delta-monitor-contract
- Board 見立て: approve（低リスク範囲のみ）
- 理由: docs / reports / prompts / runbook / cron wording の修正に限るなら low-risk。runtime の候補キュー本体は別論点として切る。

### 2. routing / staffing 境界と handoff preflight を絞る
- まとめ方: supervisor-core の役割縮小、dominant-prefix triage の専任化、light-edit / scout handoff 前の exact-target preflight
- 関連 proposal / case:
  - proposal-20260326-supervisor-boundary-preflight
- Board 見立て: revise
- 理由: 方向性は妥当だが、protected routing root / trust boundary / staffing scope の変更と、docs / runbook の低リスク範囲を分離すべき。自動適用ではなく、まず範囲を切る。

## 自己改善 proposal の扱い

### approve 候補
- proposal-20260326-anomaly-delta-monitor-contract
  - 判定: approve + assisted 候補
  - 範囲: docs / reports / prompts / runbook / cron wording
  - コメント: 低リスク。再利用可能な文言更新として先に進める

### reject 候補
- なし

### revise 候補
- proposal-20260326-supervisor-boundary-preflight
  - 判定: revise
  - コメント: routing root / trust boundary / protected path に触れる部分は分離必須。低リスクの doc/runbook 部分だけ切り出して再提出

## 会議後に渡す proposal_id
- review ジョブへ: proposal-20260326-supervisor-boundary-preflight
- apply ジョブへ: proposal-20260326-anomaly-delta-monitor-contract

## 補足
- 通常通知は行わず、定期報告に集約する
- Board では proposal 全件を長く議論しない。今回の自己改善論点は 2 件までで打ち切る
