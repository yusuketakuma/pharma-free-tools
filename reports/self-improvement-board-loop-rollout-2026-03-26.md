# Self-improvement × Board rollout — 2026-03-26

## 結論
自己改善ループを Board 接続型へ更新する。自己改善は観測・提案・小実験の主体、Board は裁定・優先順位・統治の主体とする。

## 実装方針
- 既存 growth proposal/review/apply-result schema を流用する
- 自己改善系 job は最大1件の growth proposal を生成できるようにする
- Board は proposal inbox を通常論点と分けて扱う
- 低リスク proposal だけ assisted apply を許す
- verification で pending_artifact / blocked / manual_required を明示する

## 低リスク自動適用の範囲
- docs / reports / prompts / runbook / cron wording
- protected path / trust boundary / routing root は除外

## 新規ジョブ
- self-improvement-proposal-review
- self-improvement-safe-apply
- self-improvement-verification

## 更新対象
- autonomy-loop-health-review
- agent-scorecard-review
- agent-lesson-capture
- agent-staffing-and-prompt-tuning
- agent-performance-optimization-review
- agent-workforce-expansion-review
- board-agenda-assembly
- board-postmeeting-agent-dispatch
- board-dispatch-verification
- tama-regular-progress-report
