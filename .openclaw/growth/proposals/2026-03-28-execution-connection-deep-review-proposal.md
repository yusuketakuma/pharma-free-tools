# proposal_id: execution-connection-deep-review-proposal-2026-03-28

## summary
実行接続の弱さ（research→PoC、doc-editorの実行接続など）と高リスク構造変更（CEO↔board↔execution）に対し、**深いレビューと段階的適用**を提案する。scorecardで明らかになった課題と、staffing-reviewで指摘された高リスク項目を統合処理。

## observations
- agent-scorecard-review (2026-03-25) で明らかになった実行接続の弱さ:
  - `research-analyst` は研究結果が増えるほど比較の粒度が揃っておらず、PoCへの接続が弱い
  - `doc-editor` は文書化が目的化すると実行接続が薄くなる
  - `github-operator` は直近の専用証跡が薄く、baselineが不明確
- agent-staffing-and-prompt-tuning (2026-03-26) で指摘された高リスク項目:
  - CEO↔board↔execution構造変更はhigh-riskで自動適用不可
  - auth / trust boundary / routing の根幹変更はmanual review必須
- 現状の提案ではlow-riskな改善に偏りすぎ、中核的な接続問題と高リスク変更が適切に扱われていない

## proposed_changes
- **実行接続プロトコルの導入**
  - `research-analyst`: scout結果に必ず `owner / due / success criteria` を付与し、PoC入口への落とし込みを明文化
  - `doc-editor`: 「接続・終了ステータス・PR/質問経路」を1枚のrunbookに圧縮し、実行可能な手順を提供
  - `github-operator`: 専用runを1〜2件実行しbaselineを明確化、GitHub/PR/link cleanup専任化
  - `opportunity-scout`: promising candidateだけPoC入口に落とす仕組みを導入
- **高リスク変更の深いレビュー体制**
  - CEO↔board↔execution構造変更には、专门的な deep review パネルを設置
  - auth / trust boundary / routing の変更には、2段階approvalプロセスを導入
  - 高リスク変更はまずdry runとshadow運用で検証
- **接続効果の測定フレームワーク**
  - handoffのclarifying question数を追跡
  - remit逸脱率を定量で計測
  - PoCへの変換率を監視

## affected_paths
- .openclaw/growth/proposals/2026-03-28-execution-connection-deep-review-proposal.md
- .openclaw/growth/runbooks/research-handoff-protocol.md
- .openclaw/growth/runbooks/doc-editor-execution-connection.md
- .openclaw/growth/runbooks/github-operator-baseline.md
- .openclaw/growth/runbooks/high-risk-change-review.md
- .openclaw/growth/prompts/research-analyst-handoff.md
- .openclaw/growth/prompts/doc-editor-execution.md
- .openclaw/growth/metrics/connection-effectiveness.json
- .openclaw/governance/high-risk-change-policy.md

## evidence
- agent-scorecard-review (2026-03-25)
- agent-staffing-and-prompt-tuning (2026-03-26)
- autonomy-loop-health-review (2026-03-25)
- board-meeting-report-2026-03-28.md

## requires_manual_approval
true

## next_step
高リスク変更深いレビューパネルの設立と、実行接続プロトコルの試験的導入。最初は1-2件のhandoffから効果を測定し、成功後に本格適用。