# Self-improvement × Board loop v1

## 目的
自己改善ループを、勝手に変える主体ではなく、改善候補を観測・提案・小実験し、Board が裁定し、低リスクだけ適用・検証する仕組みにする。

## 基本原則
- 自己改善ループは `観測 / 分析 / 提案 / 小実験 / 評価` を担当する
- 取締役会は `裁定 / 優先順位 / 統治 / 境界管理` を担当する
- routine 改善は signal / artifact / runbook で閉じる
- 境界変更・auth・routing・approval・trust boundary・protected path は Board 裁定必須
- 低リスク改善のみ自動適用可

## フロー
1. 観測
   - autonomy-loop-health-review
   - agent-scorecard-review
   - agent-lesson-capture
   - agent-staffing-and-prompt-tuning
   - agent-performance-optimization-review
   - agent-workforce-expansion-review

2. proposal 化
   - `.openclaw/growth/proposals/*.json` に growth proposal を作る
   - 1ジョブあたり proposal は最大1件
   - format:
     - summary
     - observations
     - proposed_changes
     - affected_paths
     - evidence
     - requires_manual_approval
     - guardrails
     - next_step

3. Board 裁定
   - Board 会議は通常 candidate に加えて growth proposal inbox も確認する
   - 自己改善 proposal は通常論点と分けて扱う
   - Board は approve / reject / revise を決める

4. review artifact 化
   - `review_growth_proposal.py` で review artifact を残す
   - `requires_manual_approval=true` または protected path 含む proposal は assisted/manual に倒す

5. 低リスク適用
   - docs / reports / prompts / runbook / cron prompt の軽微変更のみ assisted apply 候補
   - apply 結果は `.openclaw/growth/apply-results/*.json` に残す

6. 検証
   - proposal / review / apply-result / affected_paths / 定量指標を見て
   - success / pending_artifact / blocked / manual_required を判定する

## 低リスク自動適用の目安
- docs/*.md
- reports/*.md
- prompts / runbook / analysis artifact
- cron prompt の軽微な wording 修正
- protected path 以外

## Board 裁定必須
- auth
- approval
- routing root
- trust boundary
- protected path
- Telegram 根幹設定
- authority / ownership 再配分
- multi-layer governance 変更

## 定期報告への反映
定期報告では自己改善を次で出す。
- 実行したこと
- 実行できなかったこと
- self-improvement proposal 状態
- approve / reject / revise 件数
- 適用 / 検証状態

## 期待される状態
- 自己改善が暴走せず、Board の優先順位と整合する
- 低リスク改善は止まらず進む
- 高リスク改善は Board の裁定証跡を伴う
- 改善の成功/未完了/失敗が定期報告で追える
