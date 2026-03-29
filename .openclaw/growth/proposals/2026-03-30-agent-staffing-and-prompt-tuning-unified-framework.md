# proposal_id: agent-staffing-and-prompt-tuning-unified-framework-2026-03-30

## summary
agent-staffing-expansion-2026-03-28とagent-prompt-consistency-automation-2026-03-29のギャップを埋め、**スタッフィング決定からプロンプトチューニングまでの一貫したフレームワーク**を構築。データドリブンなスタッフィング決定と自動化されたプロンプチューニングを連携させ、エージェントの専門性と一貫性を両立させる。

## observations
### スタッフィングとプロンプチューニングの分断問題
1. **データの非連続性**: スタッフィング決定時のデータとプロンプチューニング時のデータが分断されており、最適化が部分最適に終始
2. **専門性の一貫性不足**: スタッフィングで設定された専門性がプロンプチューニングで反映されず、期待通りに動作しない
3. **ROI測定の非効率性**: スタッフィング効果とプロンプチューニング効果が個別にしか測定できず、総合効果の評価が不可能
4. ** feedback loop の不在**: プロンプチューニング結果がスタッフィング決定にフィードバックされない

### 現行の限界
- **スタッフィング決定**: 主に経験とヒューリスティックベースで、データドリブンな判断が不足
- **プロンプチューニング**: 手動での変更が多く、システム全体への影響が不透明
- **評価指標**: スタッフィング成功率とプロンプチューニング効果が個別にしか測定されない
- **スケーラビリティ**: エージェント数増加に伴い、手動での最適化が現実的でなくなっている

### 具体的な課題事例
- 「agent-staffing-expansion-2026-03-28」ではキャパシティマッピングはあるが、実際のプロンプトとの連携が不足
- 「agent-prompt-consistency-automation-2026-03-29」では一貫性チェックはあるが、スタッフィング決定との連携が不足
- 両者間のシナジー効果を最大化するフレームワークが存在しない

## proposed_changes
### 1. 統一されたスタッフィング・プロンプチューニングデータプラットフォーム
#### 統合データレイクの構築
- **スタッフィング決定データ**: キャパシティ、専門性、リソース使用率、パフォーマンス指標
- **プロンプチューニングデータ**: プロンプトバージョン、効果測定、一貫性スコア、cascade効果
- **実行結果データ**: 成功率、応答時間、品質評価、ユーザーフィードバック
- **相互参照データ**: スタッフィング→プロンプチューニング→実行結果の完全なトレーサビリティ

#### 標準化されたスキーマ
```json
{
  "agent_id": "string",
  "staffing_data": {
    "specialization": "string[]",
    "capacity": "number",
    "resource_allocation": "object",
    "performance_baseline": "object"
  },
  "prompt_data": {
    "version": "string",
    "consistency_score": "number",
    "effectiveness_score": "number",
    "impact_scope": "string[]"
  },
  "execution_data": {
    "success_rate": "number",
    "response_time": "number",
    "quality_metrics": "object",
    "user_feedback": "object"
  }
}
```

### 2. データドリブンなスタッフィング最適化システム
#### スタッフィング決定の自動化
- **キャパシティ予測モデル**: 過去の実績データに基づくリソース需要予測
- **専門性最適化アルゴリズム**: 各エージェントの専門性と業務量の最適なバランス計算
- **リソース配分の動的最適化**: リアルタイムの負荷に基づくリソース再配分
- **スタッフィングROIの自動計算**: スタッフィング変更の期待効果を事前に評価

#### スタッフィングガバナンス
- **専門性定義の標準化**: 各専門領域の明確な定義と評価基準
- **重複専門性の検出**: 同じ専門性を持つエージェントの自動検出
- **ギャップ分析**: 必要専門性と現有専門性のギャップ特定
- **スタッフィングポリシーの自動更新**: 業務変化に対応した動的ポリシー更新

### 3. プロンプチューニングの自動化フレームワーク
#### プロンプチューニングの機械化
- **自動効果測定**: プロンプト変更前後のパフォーマンス比較
- **一貫性チェックの強化**: 全エージェント間の一貫性をリアルタイム検証
- **cascade効果シミュレーション**: プロンプト変更が他のエージェントに与える影響予測
- **バージョン管理**: プロンプト変更の完全なバージョニングとrollback機能

#### プロンプチューニングガバナンス
- **変更の自動承認**: 低リスク変更の自動承認ワークフロー
- **高リスク変更のレビュー**: 重要なプロンプト変更の人間レビュー
- **A/Bテストフレームワーク**: プロンプト変更の効果検証
- **フィードバックループの自動化**: 実行結果からプロンプチューニングへの改善提案

### 4. 統合された評価と改善サイクル
#### 統合KPIダッシュボード
- **スタッフィングKPI**: キャパシティ利用率、専門性適合度、リソース効率
- **プロンプチューニングKPI**: 一貫性スコア、効果測定結果、cascade影響度
- **統合KPI**: システム全体のパフォーマンス、ROI、ユーザー満足度
- **予測KPI**: 未来のパフォーマンス予測、改善効果の期待値

#### 自動改善提案
- **ギャップ特定**: 現状と目標のギャップを自動検出
- **改善提案**: 具体的な改善策を自動提案
- **効果予測**: 改善の期待効果を数値で予測
- **優先順位付け**: 改善提案の優先順位を自動決定

### 5. プロジェクト特化型最適化
#### プロジェクト別スタッフィング戦略
- **openclaw-core**: 専門性と汎用性のバランス、リソース最適化
- **pharma-free-tools**: ユーザー対応と技術実装の二重専門性
- **sidebiz**: 探索と実装の専門性の分離
- **polymarket**: コンプライアンスと取引戦略の専門性
- **DeadStockSolution**: 分析と改善提案の専門性

#### プロジェクト別プロンプチューニング戦略
- **openclaw-core**: 安全性と効率性の両立
- **pharma-free-tools**: ユーザーフレンドリーと技術的正確性
- **sidebiz**: 創造性と実行可能性のバランス
- **polymarket**: コンプライアンスと収益性の両立
- **DeadStockSolution**: 分析的洞察と実行提案

## affected_paths
- `.openclaw/growth/runbooks/staffing-prompt-unified-framework.md`
- `.openclaw/growth/config/unified-data-platform.json`
- `.openclaw/growth/cron-wording/automated-staffing-optimization.md`
- `.openclaw/growth/prompts/staffing-analyst.md`
- `.openclaw/growth/prompts/prompt-tuning-automation.md`
- `.openclaw/workspace/.openclaw/runtime/staffing-prompt-unified/`（新規ディレクトリ）
- `.openclaw/workspace/.openclaw/runtime/data-lake/staffing-prompt-integration/`（新規ディレクトリ）
- `.openclaw/governance/staffing-prompt-governance.md`

## evidence
- agent-staffing-expansion-2026-03-28.json: スタッフィング決定のデータドリブン化の必要性
- agent-prompt-consistency-automation-2026-03-29.md: プロンプチューニングの自動化の必要性
- autonomy-improvement-metrics-system-2026-03-30.md: 統合KPI測定の必要性
- agent-performance-learning-loop-automation-2026-03-29.md: 学習ループの重要性
- board-cycle-noise-reduction-2026-03-30.md: システム全体の効率化の必要性

## requires_manual_approval
false

## next_step
1. 統合データプラットフォームの技術設計
2. スタッフィング最適化アルゴリズムの開発
3. プロンプチューニング自動化フレームワークの実装
4. 統合KPIダッシュボードのプロトタイプ開発
5. パイロットプロジェクトでの実施と効果検証
6. 全プロジェクトへの段階的展開

---

**Proposal ID:** agent-staffing-and-prompt-tuning-unified-framework-2026-03-30  
**Created:** 2026-03-30  
**Priority:** High  
**Integration Point:** Agent Staffing + Prompt Engineering + Data Analytics**