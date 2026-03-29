# proposal_id: agent-staffing-performance-synthesis-2026-03-28-updated

## summary
agent staffing / prompt tuning と performance optimization review を統合し、担当割り・プロンプト調整・性能評価の境界を明確にする低リスク改善を提案する。最新のscorecardレビューに基づき、**実行接続強化**と**軽量役割の短文化**を追加。

## observations
- staffing と performance のレビューが別々だと、"誰をどう置くか" と "どう改善したか" の因果が見えづらい。
- workforce expansion は慎重に扱うべきで、まずは既存構成の最適化と prompt tuning を優先するのが安全。
- 直近scorecardで明らかになった**実行接続の弱さ**（research→PoC、doc-editorの実行接続）を重点的に改善。
- supervisor-core の重複問題は既に改善中で、次は**軽量役割の短文化**が効果的。

## proposed_changes
- agent-staffing-and-prompt-tuning と agent-performance-optimization-review を 1 つの Board 入稿フォーマットに統合する。
- staffing の判断基準を「負荷」「遅延」「再作業率」「レビュー失敗率」に寄せる。
- prompt tuning は role 固有の微調整に限定し、authority / routing / trust boundary には踏み込まない。
- **追加: 実行接続強化**
  - `research-analyst` の scout 結果に必ず `owner / due / success criteria` を付与
  - `doc-editor` は runbook / checklist 専任とし、実行接続文書を1枚に圧縮
  - `github-operator` は GitHub / PR / link cleanup 専任とし、baselineを明確化
  - `opportunity-scout` は promising candidate だけ PoC 入口に落とす仕組みを導入
- workforce expansion review は、既存改善で足りない場合のみ次段として残す。

## affected_paths
- .openclaw/growth/proposals/2026-03-28-agent-staffing-performance-synthesis-updated.md
- .openclaw/growth/runbooks/agent-staffing-review.md
- .openclaw/growth/runbooks/agent-performance-optimization.md
- .openclaw/growth/prompts/agent-staffing-and-prompt-tuning.md
- .openclaw/growth/prompts/agent-performance-optimization-review.md
- .openclaw/growth/cron-wording/agent-staffing-performance-cycle.md
- .openclaw/growth/runbooks/research-handoff-protocol.md (新規)
- .openclaw/growth/runbooks/doc-editor-execution-connection.md (新規)
- .openclaw/growth/runbooks/github-operator-baseline.md (新規)

## evidence
- agent-staffing-and-prompt-tuning (2026-03-26)
- agent-performance-optimization-review (2026-03-27)
- agent-workforce-expansion-review
- autonomy-loop-health-review (2026-03-25)
- agent-scorecard-review (2026-03-25)

## requires_manual_approval
false

## next_step
次の Board cycle で staffing と performance のレビューを同じ rubric で比較し、実行接続強化の効果を確認。適切であれば workforce expansion に進む。