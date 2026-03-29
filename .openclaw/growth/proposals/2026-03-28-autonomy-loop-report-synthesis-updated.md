# proposal_id: autonomy-loop-report-synthesis-2026-03-28-updated

## summary
Board cycle に渡す自己改善提案として、autonomy-loop / heartbeat / board runtime の観測・lesson・scorecard を 1 つの定型に寄せ、重複する観測粒度を減らす。最新のhealth reviewに基づき、**Supervisor系ジョブの重複解消**と**定常時のsignal-only化**を重点化。

## observations
- anomaly / delta / lesson / scorecard / board report が別系統で出ると、比較軸がばらつきやすい。
- 直近サイクルでは「何が変化したか」と「次に何を直すか」を同じ粒度で追える形式が必要。
- autonomy-loop-health-review (2026-03-25) で明らかになった**Supervisor系の重複問題**（観測→triage→品質レビューの同質化）を重点的に改善。
- 定常時は anomaly/delta signal-only を維持し、candidate 化は threshold breach のみに絞る。

## proposed_changes
- autonomy-loop-health-review、agent-lesson-capture、agent-scorecard-review、board / heartbeat runtime report の出力テンプレートを共通化する。
- anomaly / delta / lesson / scorecard の各セクション名を固定し、Board 用の要約ブロックを追加する。
- **追加: Supervisor系ジョブの重複解消**
  - `supervisor-core` は「例外の集約、最終 triage、board への橋渡し」に特化
  - `queue-triage-analyst` を新設し、dominant-prefix triage / 再掲抑制 / owner-next action 抽出を担当
  - 観測→triage→remediate の明確な分離を実施
- **追加: 定常時のsignal-only化**
  - board / heartbeat / scorecard は定常時は signal-only を維持
  - candidate 化は anomaly delta / threshold breach / precedent gap のみに限定
  - 再提案ゲートを必須化（直近1〜2回と同系統なら、新しい根拠か対象範囲がない限り再提案しない）
- 既存の review 記法を壊さず、上位の synthesis だけを追加する。

## affected_paths
- .openclaw/growth/proposals/2026-03-28-autonomy-loop-report-synthesis-updated.md
- .openclaw/growth/runbooks/autonomy-loop-review-template.md
- .openclaw/growth/runbooks/board-cycle-synthesis-guide.md
- .openclaw/growth/prompts/agent-lesson-capture.md
- .openclaw/growth/prompts/agent-scorecard-review.md
- .openclaw/growth/cron-wording/board-heartbeat-synthesis.md
- .openclaw/growth/prompts/queue-triage-analyst.md (新規)
- .openclaw/growth/runbooks/supervisor-core-narrow-scope.md (新規)
- .openclaw/growth/cron-wording/supervisor-remediation-protocol.md (新規)

## evidence
- autonomy-loop-health-review (2026-03-25)
- agent-scorecard-review (2026-03-25)
- agent-lesson-capture
- board / heartbeat runtime の直近 report
- agent-staffing-and-prompt-tuning (2026-03-26)

## requires_manual_approval
false

## next_step
Board cycle で、既存の review 出力を 1 回分だけこの共通テンプレートに寄せ、差分と可読性を確認。Supervisor系の重複解消効果を測定。