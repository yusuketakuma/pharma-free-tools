# proposal_id: agent-prompt-consistency-automation-2026-03-29

## summary
agent prompt 一貫性の問題を根本解決するため、**プロンプト変更の自動検知・一貫性チェック・ガバナンスフレームワーク**を提案。抽象的なプロンプト変更がシステム全体に波及する問題を防止し、安全な連携を実現する。

## observations
### 反復している失敗パターン
1. **抽象的なidentity問題**: 何度も「identityが抽象的すぎる」という修正が反復（autonomous-development-hq修正例）
2. **役割境界の曖昧さ**: OpenClaw vs Claude Codeの責任範囲が明確ではなく、誤ったディスパッチが頻発
3. **triggering conditionの不明確さ**: いつClaude Codeを使い、いつOpenClawだけで完結すべきかの基準が揺らいでいる
4. **cascade効果の無視**: 一つのagent変更が他のagentに予期せず影響を与える問題が頻発

### 何度も説明している運用ルール
1. **control plane vs execution plane**: 両者の境界線を繰り返し明示しているが、依然として混乱が生じている
2. **安全保護ルール**: auth/routing/trust boundaryの保護は毎回説明が必要で、自動チェックが不足している
3. **agent間連携の原則**: 複数agentが連携する場合の責任分担が明確化されていない

### 何度も修正しているwording問題
1. **具体性の欠如**: 「改善する」「最適化する」など抽象的な表現が続き、具体的な実行条件が定義されていない
2. **trigger conditionの文言**: 「必要に応じて」「適切に」といった曖昧な表現が頻出
3. **success criteriaの不明確さ**: 改善の成功をどう判断するかの明確な基準が設定されていない

## proposed_changes
### プロンプト変更の自動検知・バリデーションシステム
- **変更前自動チェック**: プロンプト変更前にsystem-wide impact analysisを実行
- **一貫性スキャン**: 全agentとの一貫性を自動で検査し、矛盾や重複を特定
- **cascade効果シミュレーション**: 変更が他のagentに与える影響を予測
- **自動化テスト**: 変更後の動作を自動で検証し、期待通りに動作するか確認

### 役割境界明確化フレームワーク
- **boundary definition schema**: OpenClaw vs Claude Codeの明確な境界線をJSON schemaで定義
- **decision tree**: どのレーンを使うべきかの判断ツリーを可視化・自動化
- **role clarity check**: 各agentの役割が重複せず、隙間なくカバーされているか検証
- **intersection mapping**: agent間の連携ポイントを明確にマッピング

### 安全保護の自動ガードレール
- **protected path auto-detection**: 保護すべき設定変更を自動検出
- **safety validation**: 変更が安全ルールに違反していないか自動チェック
- **approval workflow**: 高リスク変更には必ずboardレビュールーチンを必須化
- **rollback mechanism**: 問題があれば自動でrollbackできる仕組み

### プロンプトテンプレート標準化
- **standardized prompt components**: 再利用可能なプロンプト部品をライブラリ化
- **version control**: プロンプト変更のバージョニングと変更履歴管理
- **impact documentation**: 変更の影響範囲と期待される効果を自動文書化
- **performance correlation**: プロンプト変更とパフォーマンス指標の相関を追跡

## affected_paths
- `.openclaw/growth/runbooks/prompt-consistency-automation.md`
- `.openclaw/growth/config/prompt-boundary-decision-tree.json`
- `.openclaw/growth/prompts/standardized-components/`
- `.openclaw/growth/cron-wording/prompt-change-governance.md`
- `.openclaw/workspace/.openclaw/runtime/prompt-validation/`
- `.openclaw/governance/agent-role-mapping.json`
- `.openclaw/growth/prompts/safety-guardrails.md`

## evidence
- autonomous-development-hq-fix-2026-03-28.md: identitythemeが抽象的すぎる問題の修正例
- agent-prompt-unification-framework-2026-03-29.md: agent間一貫性の問題
- agent-performance-learning-synthesis-2026-03-28.md: パフォーマンス評価のギャップ
- supervisor-governance-review-report.md: ガバナンスレビューの重要性
- ワークスペース全体のagent設定ファイル: 多数のagentにまたがる一貫性問題

## requires_manual_approval
false

## next_step
1. プロンプト変更検知・バリデーションシステムの設計
2. 役割境界decision treeの実装
3. 保護パスauto-detectionのprototype開発
4. 標準化プロンプトコンポーネントのライブラリ作成
5. 自動化テストフレームワークの実装

---

**Proposal ID:** agent-prompt-consistency-automation-2026-03-29  
**Created:** 2026-03-29  
**Priority:** High  
**Integration Point:** Agent Governance + Prompt Engineering + System Safety