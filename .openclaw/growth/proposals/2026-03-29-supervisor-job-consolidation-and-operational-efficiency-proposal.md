# proposal_id: supervisor-job-consolidation-and-operational-efficiency-2026-03-29

## summary
Supervisor系ジョブの重複解消と運用効率化を実現する提案。既存の autonomy-loop-report-synthesis と agent-staffing-prompt-tuning-consolidation を統合し、staffing/prompt/routing のワンサイクル化で運用効率を向上させる。

## observations
- Supervisor系ジョブで観測→triage→品質レビューが同質化しており、重複処理が発生している
- staffing と performance のレビューが別々で、「誰をどう置くか」と「どう改善したか」の因果関係が見えづらい
- 既存の運用文書では staffing/prompt/routing/dispatch の判断材料が複数ファイルに重複して存在し、表現が少しずつ異なる
- 軽微な依頼でも「OpenClaw-onlyで処理すべきか」「Claude/ACPに送るべきか」の判定がぶれやすい
- agent-scorecard-review では role boundary の曖昧さと過剰 staffing が rework の要因となっている
- 定常時は anomaly/delta signal-only を維持し、candidate 化は threshold breach のみに絞る必要がある

## proposed_changes
### Supervisorジョブの重複解消
- **supervisor-core の役場明確化**
  - 「例外の集約、最終 triage、board への橋渡し」に特化
  - routine な観測処理を他のジョブに委譲
- **queue-triage-analyst の新設**
  - dominant-prefix triage / 再掲抑制 / owner-next action 抽出を担当
  - 観測→triage→remediate の明確な分離を実施

### Staffing/Prompt/Routing ワークフローの統合
- **dispatch 前判定用 canonical wording の導入**
  - staffing/prompt/routing の判断を 1 つの consolidated workflow に集約
  - 「OpenClawはcontrol plane/Claude Codeはexecution plane」をrouting判定の正本表現として固定
  - 「どの条件でskill/task-dispatchを使うか」と「どの条件でACP harnessを使うか」を1箇所に短く並置
- **Staffing 判断基準の標準化**
  - 負荷・遅延・再作業率・レビュー失敗率に基づく客観的判断基準
  - 既定 staffing は single lead、advisory は観点補助のみ、active subroles は成果物が複数ある時だけ、swarm は高リスク横断 task に限定
- **Prompt tuning の範囲限定**
  - role 固有の微調整に限定し、authority/routing/trust boundary には踏み込まない
  - workforce expansion review は、既存改善で足りない場合のみ次段として残す

### 定常時運用の効率化
- **signal-only 化の徹底**
  - board/heartbeat/scorecard は定常時は signal-only を維持
  - candidate 化は anomaly delta / threshold breach / precedent gap のみに限定
  - 再提案ゲートを必須化（直近1〜2回と同系統なら、新しい根拠か対象範囲がない限り再提案しない）

## affected_paths
- .openclaw/growth/runbooks/autonomy-loop-review-template.md
- .openclaw/growth/runbooks/board-cycle-synthesis-guide.md
- .openclaw/growth/prompts/agent-lesson-capture.md
- .openclaw/growth/prompts/agent-scorecard-review.md
- .openclaw/growth/cron-wording/board-heartbeat-synthesis.md
- .openclaw/growth/prompts/queue-triage-analyst.md (新規)
- .openclaw/growth/runbooks/supervisor-core-narrow-scope.md (新規)
- .openclaw/growth/cron-wording/supervisor-remediation-protocol.md (新規)
- .openclaw/growth/runbooks/agent-staffing-review.md
- .openclaw/growth/prompts/agent-staffing-and-prompt-tuning.md
- .openclaw/docs/AGENTS.md
- .openclaw/docs/TOOLS.md

## evidence
- autonomy-loop-health-review (2026-03-25): Supervisor系の重複問題の特定
- agent-staffing-prompt-tuning-consolidation (2026-03-29): staffing/prompt/routingの重複問題
- agent-scorecard-review (2026-03-25): role boundaryの曖昧さと過剰staffing
- heartbeat-results.jsonl: 定常時のsignal-only化の必要性
- agent-staffing-performance-synthesis: staffingとperformanceの因果関係の見えづらさ

## requires_manual_approval
false

## next_step
1. dispatch前 canonical wording の 1 箇所への追加
2. AGENTS/TOOLS/skill descriptions の重複表現を wording 寄せ
3. supervisor-core と queue-triage-analyst の役分担実装
4. 次サイクルで「分類語彙の不一致」を first check として導入