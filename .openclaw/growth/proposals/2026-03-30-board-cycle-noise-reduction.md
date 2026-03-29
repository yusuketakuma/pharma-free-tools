# proposal_id: board-cycle-noise-reduction-2026-03-30

## summary
**board cycle の noise を減らし、signal-only と anomaly-delta を明確に分離する**。board_touch_high や exploration_drift の問題を解決し、freshness と relevance の監視システムを導入することで、Board の効率を向上させる提案。

## observations
### 反復している失敗パターン
1. **board_touch_high**: heartbeat が board に頻繁に触れており、noise が増えている
2. **exploration_drift**: 探索が目的外に drift しており、収束に時間がかかる
3. **freshness 問題**: agenda-seed-latest.md のような重要アーティファクトが stale 状態で publish される
4. **signal/candidate の混同**: 定常時の signal と anomaly 時の candidate が混在している

### 既存の課題
- routine な board / heartbeat / scorecard が candidate 化されすぎている
- heartbeat の anomaly-delta monitor が過剰に反応している
- publish gate に freshness validation が存在しない
- Board の審議対象が noise で埋まっている

### 課題の深刻度
- 高: Board noise が重要な議論を遮っている
- 中: freshness 問題が board cycle の進行を遅延させている
- 中: 探索の drift がリソースを無駄に消費している

## proposed_changes
### Signal-Only と Anomaly-Delta の明確な分離
- **routine monitor の signal-only 固定**: board / heartbeat / scorecard は定常時は signal-only に固定
- **anomaly-delta の明確な定義**: threshold breach や delta があった場合のみ candidate 化
- **board touch の制限**: 頻繁な board touch を防ぐための制限ルールを導入
- **freshness validation の強化**: publish gate で freshness を必須チェック

### Board Touch の最適化
- **board_touch_high の検知と対策**: touch 回数が閾値を超えた場合の自動検知
- **board touch の原因分析**: touch の原因を分類し、根本原因を特定
- **board touch の最適化提案**: touch 回数を減らす具体的な提案
- **board touch metrics の監視**: touch 関連の指標を常時監視

### Freshness と Relevance の監視システム
- **artifact freshness の自動検証**: publish 時点で freshness を自動検証
- **relevance scoring**: artifact の relevance スコアを自動計算
- **stale artifact の自動分離**: stale な artifact は別のストレージに保存
- **freshness dashboard**: 全 board artifact の鮮度状況をダッシュボード化

### Exploration Drift の防止
- **exploration scope の明確化**: 探索の範囲を明確に定義
- **drift 検知システム**: 探索が目的外に drift している場合の自動検知
- **scope validation**: 探索結果が scope 内にあるかを自動検証
- **exploration reset**: drift が検出された場合の自動リセット機能

## affected_paths
- `.openclaw/growth/runbooks/board-cycle-noise-reduction.md`
- `.openclaw/growth/config/signal-only-contract.json`
- `.openclaw/growth/prompts/board-touch-optimization.md`
- `.openclaw/growth/cron-wording/freshness-validation.md`
- `.openclaw/runtime/board/noise-monitoring/`
- `.openclaw/runtime/metrics/board-quality.json`
- `.openclaw/governance/board-artifact-lifecycle.md`

## evidence
- autonomy-loop-health-review-candidate.json: board_touch_high と exploration_drift の問題
- board-artifact-freshness-governance-2026-03-29.md: freshness validation の必要性
- agent-lesson-capture-20260326-0615.md: routine monitor の signal-only 固定の提案
- heartbeat runtime metrics: board touch 回数の増加
- board/agenda-seed-latest.md: stale artifact の問題

## requires_manual_approval
false

## next_step
1. signal-only と anomaly-delta の分離ルールの設計
2. board touch 最適化システムの実装
3. freshness validation の強化
4. exploration drift 防止システムの開発
5. board quality ダッシュボードの作成

---

**Proposal ID:** board-cycle-noise-reduction-2026-03-30  
**Created:** 2026-03-30  
**Priority:** High  
**Integration Point:** Board Governance + Noise Reduction + Quality Control**