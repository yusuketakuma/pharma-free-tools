# proposal_id: agent-prompt-unification-framework-2026-03-29

## summary
agent-staffing-and-prompt-tuning の分散化問題を解決し、**全 agent のプロンプト一貫性を確保する統合フレームワーク**を提案。テンプレート駆動型プロンプト管理で、個別最適化の弊害を防ぎつつ適応性を維持する。

## observations
- 各 agent が個別の prompt tuning を実施する結果、system-wide な一貫性が失われている
- 異なる agent 間で同一目的でも解釈や出力形式にばらつきが生じる
- prompt 変更が cascade し、互いに干渉する問題が頻発
- 統合された prompt が rigid になりすぎて、個別 agent の特化性が損なわれる
- prompt version と agent バージョンの管理が非効率で、変更追跡が困難

## proposed_changes
### プロンプトテンプレート階層の構築
- **Core Template**: 全 agent に共通の基本原則・構造・形式を定義
- **Role Template**: agent ごとの役割に特化した部分（例: supervisor, executor, reviewer）
- **Instance Template**: 具体的な実行環境用の微調整パラメータ
- 3層構造で一貫性と適応性の両立

### プロンプト変更の governance
- プロンプト変更の影響範囲を事前評価する change impact analysis
- 全 agent ぼ一貫性チェック自動化ツールの導入
- 変更の cascade 効果をシミュレーションする dry-run 機能
- 重要な変更には board レビュールーチンの必須化

### 動的プロンプト適応システム
- runtime 時の agent 状態に基づいた微調整機構
- workloads に応じたパラメータの動的変更（例: detail level, response style）
- performance モニタリング結果に基づいた自動チューニング
- agent ごとの特性を維持しつつ全体最適を実現

### プロンプトバージョン管理と追跡
- プロンプト変更のバージョニングと rollback 機能
- 変更と agent performance の相関分析
- "golden prompt" の定義と維持ルーチン
- 変更の audit trail と accountability 確保

## affected_paths
- `.openclaw/growth/runbooks/prompt-unification-framework.md`
- `.openclaw/growth/config/prompt-template-hierarchy.json`
- `.openclaw/growth/prompts/core-principles-template.md`
- `.openclaw/growth/prompts/role-specific-templates.md`
- `.openclaw/growth/cron-wording/prompt-consistency-monitoring.md`
- `.openclaw/workspace/.openclaw/runtime/templates/` - prompt テンプレート管理
- `.openclaw/workspace/.openclaw/runtime/governance/` - prompt change review
- `.openclaw/growth/prompts/instance-optimization-parameters.md`

## evidence
- agent-staffing-and-prompt-tuning: 分散化された prompt tuning プロセス
- agent-performance-learning-synthesis: agent 間の不一致によるパフォーマンス問題
- autonomy-loop-report-synthesis-2026-03-28-updated: 統一された governance の必要性
- board-governance.md: 変更管理とレビュープロセス
- heartbeat-governance.json: system-wide consistency の重要性

## requires_manual_approval
true

## next_step
1. プロンプトテンプレート階層の詳細設計
2. 現行 agent の prompt を分析し、一貫性ギャップを特定
3. プロンプト変更 impact analysis の prototype 開発
4. 全 agent の prompt 一貫性チェックツールの実装

---

**Proposal ID:** agent-prompt-unification-framework-2026-03-29  
**Created:** 2026-03-29  
**Priority:** High  
**Integration Point:** Prompt Engineering + System Governance + Agent Consistency