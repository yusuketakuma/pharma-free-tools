# proposal_id: agent-performance-learning-synthesis-2026-03-28

## summary
agent performance optimization review と agent lesson capture を統合し、評価結果から直接学びを抽出・適用する自動化仕組みを提案する。パフォーマンス指標と教訓の双方向連携で、次回サイクルの改善に直結する closed loop を構築する。

## observations
- 現行では performance optimization review と lesson capture が別々に実行され、評価結果が次の改善サイクルに直接反映されない
- パフォーマンススコア低下の根本原因が教訓キャプチャとして記録されるが、それが次のチューニングに自動で連動しない
- 経済性分析（token消費量/コスト対効果）がパフォーマンス評価に組み込まれておらず、ROIベースの最適化が不足
- 自動的な改善ループとしての機能が不十分で、人手でのフォローアップに依存している

## proposed_changes
### performance review と lesson capture の統合
- パフォーマンス評価スコアカードと教訓キャプチャを1つの実行サイクルに統合
- スコア低下時に自動で教訓分析ルーチンを起動し、改善案を生成
- 評価結果と教訓の関連性を可視化し、改善効果の追跡を可能にする

### 経済性評価の組み込み
- agent performance optimization review に token 消費量・コスト対効果指標を追加
- 各 agent の performance スコアと経済性を組み合わせた包括評価指標を導入
- 低コスト・高性能な agent チューニング優先度を自動で計算

### 自動改善提案生成
- 評価スコア低下時の自動改善提案機能
- 過去の成功パターンから類似改善案を検索・提案
- 改善効果の予測と実績比較を自動化

### 学習ループの可視化
- performance → lesson → tuning → verification の流れを可視化
- 改善の因果関係と効果をトレーサブルに記録
- 成功・失敗パターンのデータベース化

## affected_paths
- `.openclaw/growth/runbooks/agent-performance-learning-synthesis.md`
- `.openclaw/growth/prompts/agent-performance-review-with-lesson-integration.md`
- `.openclaw/growth/config/performance-economics-metrics.json`
- `.openclaw/growth/cron-wording/agent-performance-improvement-cycle.md`
- `.openclaw/org/roles/performance-benchmarker.md`
- `.openclaw/workspace/.openclaw/runtime/metrics/` - 経済性指標の追加

## evidence
- agent-performance-optimization-review: 現行のパフォーマンスレビュープロセス
- agent-lesson-capture: 課題と改善点の記録プロセス
- heartbeat runtime metrics: agent performance と token 消費の相関関係
- agent-staffing-performance-synthesis: 既存の統合アプローチの有効性確認
- synthesis-report-2026-03-28.md: パフォーマンス指標と経済性分析のギャップ

## requires_manual_approval
false

## next_step
1. agent performance evaluation の schema に経済性指標を追加
2. lesson capture と performance review の統合フローを設計
3. 改善提案自動生成の prototype を開発
4. 統合された評価サイクルの2週間間での実験的実装

---

**Proposal ID:** agent-performance-learning-synthesis-2026-03-28  
**Created:** 2026-03-28  
**Priority:** Medium  
**Integration Point:** Performance Optimization + Lesson Capture Loops