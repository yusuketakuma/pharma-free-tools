# proposal_id: agent-performance-learning-loop-automation-2026-03-29

## summary
**エージェントのパフォーマンス学習を自動化し、agent-lesson-capture の問題点を解決する**。エージェントの失敗・成功パターンを自動収集し、学習ループを構築する提案。単発の lesson capture ではなく、継続的な改善サイクルを実現。

## observations
### 反復している失敗パターン
1. **単発の lesson capture**: agent-lesson-capture が一度きりのアプローチで、継続的な改善が進んでいない
2. **成功パターンの未活用**: 成功した agent の実行例が再利用されておらず、次回の実行に活かされていない
3. **失敗の再発**: 同じタイプの失敗が複数サイクルで繰り返されているのに、システム化された学習が不足
4. **学習の非効率性**: manual review に依存した学習で、scalability に課題がある

### 既存の課題
- agent-lesson-capture が manual であり、継続性が担保されない
- 成功/失敗のパターンが散在し、体系的な分析が行われていない
- 学習結果が次回の実行にフィードバックされていない
- パフォーマンス改善が ad-hoc で、predictable ではない

### 課題の深刻度
- 高：同じ失敗が複数サイクルで再発
- 中：成功パターンの活用不足
- 中：学習プロセスの非効率性

## proposed_changes
### 自動学習収集システム
- **実行ログの自動分析**: agent の全実行ログを自動収集し、成功/失敗パターンを分類
- **学習トリガーの自動検出**: 成功率、処理時間、エラー率などの指標が閾値を超えた場合に自動で学習を開始
- **パターン認識**: 似たような状況で成功した/失敗した agent 行動パターンを自動識別
- **学習候補の自動生成**: 学習すべき具体的な改善点を候補として自動生成

### 継続的改善ループの構築
- **学習結果の自動保存**: 成功したアプローチや回避すべきパターンを構造化された形式で保存
- **次回実行への自動適用**: 学習結果を次回の agent 実行に自動的に反映
- **改善効果の自動測定**: 改善前後のパフォーマンス指標を比較し、効果を自動で測定
- **学習サイクルの自動化**: 「収集→分析→改善→検証」のサイクルを自動で回す

### 学習ガバナンスフレームワーク
- **学習品質基準**: 学習の信頼性を評価する基準を設定
- **学習リスク管理**: 学習による副作用を予防する仕組み
- **学習履歴管理**: 学習の経緯と結果を追跡・可視化
- **学習成果の共有**: 成功事例を他の agent に共有する仕組み

### パフォーマンス予測モデル
- **成功確率予測**: agent の実行パターンに基づき成功確率を予測
- **ボトルネック特定**: パフォーマンス上のボトルネックを自動特定
- **最適化提案**: 現状から期待できる改善効果を定量的に提案
- **トレンド分析**: 長期的なパフォーマンストレンドを分析

## affected_paths
- `.openclaw/growth/runbooks/agent-performance-learning-loop.md`
- `.openclaw/growth/config/learning-automation-metrics.json`
- `.openclaw/growth/prompts/automated-learning-capture.md`
- `.openclaw/growth/cron-wording/performance-learning-sync.md`
- `.openclaw/runtime/learning/`
- `.openclaw/runtime/metrics/performance-learning.json`
- `.openclaw/governance/learning-quality-standards.md`

## evidence
- agent-lesson-capture: 単発の manual 学習プロセス
- agent-performance-learning-synthesis-2026-03-28.md: パフォーマンス評価のギャップ
- agent-efficiency-optimization: 空回り状態の検知課題
- autonomy-loop-health-review: 持続的な改善の必要性
- heartbeat runtime metrics: agent performance 指標の反復

## requires_manual_approval
false

## next_step
1. 自動学習収集システムの prototype 開発
2. 学習トリガー指標の設計と実装
3. パターン認識アルゴリズムの実装
4. 学習ガバナンスフレームワークの設計
5. パフォーマンス予測モデルの開発

---

**Proposal ID:** agent-performance-learning-loop-automation-2026-03-29  
**Created:** 2026-03-29  
**Priority:** High  
**Integration Point:** Agent Performance + Machine Learning + Continuous Improvement