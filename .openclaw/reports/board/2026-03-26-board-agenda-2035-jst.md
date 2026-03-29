# Board Agenda Layer Report

## 結論
Board 本会議の主要論点は 3 件に圧縮する。
自己改善 proposal は通常論点から切り離し、2 件を個別に判定する。

## 取込サマリ
- self-improvement proposal inbox 件数: 2
- Board が扱った自己改善 proposal 件数: 2
- 主要論点: 3 クラスタ

## 主要論点（最大3件）

### 1. queue ライフサイクル統治を確定する
- まとめ方: stale backlog の triage / safe-close / reopen / record contract を 1 本に束ねる
- 関連 proposal / case:
  - proposal-20260325073850-ddcd1999feeb
  - proposal-20260326085000-safe-close-record-fields
- Board 見立て: investigate 継続
- 理由: backlog の誤クローズ防止と reopen drift 抑制が先。記録の構造化は有効だが、運用規則として一本化してから回す方が重複が減る。

### 2. routing / staffing 境界と handoff preflight を絞る
- まとめ方: supervisor-core の役割縮小、dominant-prefix triage の専任化、light-edit / scout handoff 前の exact-target preflight
- 関連 proposal / case:
  - proposal-20260325195135-de9c5137551f
  - proposal-20260325211500-queue-triage-split
  - proposal-20260325211500-handoff-guardrail
  - proposal-20260326-supervisor-boundary-preflight
- Board 見立て: revise
- 理由: 方向性は妥当だが、protected routing root / trust boundary に触れる範囲と docs/runbook の低リスク範囲を分離すべき。自動適用ではなく、まず範囲を切る。

### 3. monitoring / reporting contract を signal-only 基準へ寄せる
- まとめ方: routine board / heartbeat / scorecard は signal-only、candidate は anomaly delta / threshold breach のみ
- 関連 proposal / case:
  - proposal-20260325195135-39790e8f7053
  - proposal-20260325200211-59400c654692
  - proposal-20260326-anomaly-delta-monitor-contract
- Board 見立て: approve（低リスク範囲のみ）
- 理由: docs / reports / prompts / runbook / cron wording の修正に限るなら low-risk。広い contract 変更は別論点で扱う。

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
