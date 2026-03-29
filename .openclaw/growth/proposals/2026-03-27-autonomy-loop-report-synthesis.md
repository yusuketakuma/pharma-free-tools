# proposal_id: autonomy-loop-report-synthesis-2026-03-27

## summary
Board cycle に渡す自己改善提案として、autonomy-loop / heartbeat / board runtime の観測・lesson・scorecard を 1 つの定型に寄せ、重複する観測粒度を減らす。

## observations
- anomaly / delta / lesson / scorecard / board report が別系統で出ると、比較軸がばらつきやすい。
- 直近サイクルでは「何が変化したか」と「次に何を直すか」を同じ粒度で追える形式が必要。
- 低リスク改善は、実装よりも report / docs / runbook / cron wording の統一が効果的。

## proposed_changes
- autonomy-loop-health-review、agent-lesson-capture、agent-scorecard-review、board / heartbeat runtime report の出力テンプレートを共通化する。
- anomaly / delta / lesson / scorecard の各セクション名を固定し、Board 用の要約ブロックを追加する。
- Board サイクル渡し用に「前回との差分」「再発防止」「次回検証項目」を必須項目化する。
- 既存の review 記法を壊さず、上位の synthesis だけを追加する。

## affected_paths
- .openclaw/growth/proposals/2026-03-27-autonomy-loop-report-synthesis.md
- .openclaw/growth/runbooks/autonomy-loop-review-template.md
- .openclaw/growth/runbooks/board-cycle-synthesis-guide.md
- .openclaw/growth/prompts/agent-lesson-capture.md
- .openclaw/growth/prompts/agent-scorecard-review.md
- .openclaw/growth/cron-wording/board-heartbeat-synthesis.md

## evidence
- autonomy-loop-health-review
- agent-scorecard-review
- agent-lesson-capture
- board / heartbeat runtime の直近 report

## requires_manual_approval
false

## next_step
Board cycle で、既存の review 出力を 1 回分だけこの共通テンプレートに寄せ、差分と可読性を確認する。
