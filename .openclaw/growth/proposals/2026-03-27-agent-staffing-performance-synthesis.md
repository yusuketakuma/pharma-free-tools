# proposal_id: agent-staffing-performance-synthesis-2026-03-27

## summary
agent staffing / prompt tuning と performance optimization review を統合し、担当割り・プロンプト調整・性能評価の境界を明確にする低リスク改善を提案する。

## observations
- staffing と performance のレビューが別々だと、"誰をどう置くか" と "どう改善したか" の因果が見えづらい。
- workforce expansion は慎重に扱うべきで、まずは既存構成の最適化と prompt tuning を優先するのが安全。
- 乱立しやすいのは、似た提案が staffing / performance / workforce で分かれてしまうケース。

## proposed_changes
- agent-staffing-and-prompt-tuning と agent-performance-optimization-review を 1 つの Board 入稿フォーマットに統合する。
- staffing の判断基準を「負荷」「遅延」「再作業率」「レビュー失敗率」に寄せる。
- prompt tuning は role 固有の微調整に限定し、authority / routing / trust boundary には踏み込まない。
- workforce expansion review は、既存改善で足りない場合のみ次段として残す。

## affected_paths
- .openclaw/growth/proposals/2026-03-27-agent-staffing-performance-synthesis.md
- .openclaw/growth/runbooks/agent-staffing-review.md
- .openclaw/growth/runbooks/agent-performance-optimization.md
- .openclaw/growth/prompts/agent-staffing-and-prompt-tuning.md
- .openclaw/growth/prompts/agent-performance-optimization-review.md
- .openclaw/growth/cron-wording/agent-staffing-performance-cycle.md

## evidence
- agent-staffing-and-prompt-tuning
- agent-performance-optimization-review
- agent-workforce-expansion-review
- autonomy-loop-health-review

## requires_manual_approval
false

## next_step
次の Board cycle で staffing と performance のレビューを同じ rubric で比較し、必要なら workforce expansion に進む。
