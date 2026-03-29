# proposal_id: agent-workforce-expansion-strategy-2026-03-28

## summary
agent workforce expansion review と board heartbeat runtime 分析を統合し、ワークフォース拡大の明確な基準と段階的適用戦略を提案する。経済性分析とシステム健全性に基づいた拡大判断プロセスで、乱立と過剰投資を防ぐ。

## observations
- 現行の workforce expansion review が抽象的で、具体的な拡大トリガーや成功基準が不明確
- heartbeat runtime の分析結果（agent performance, token 経済性, 系統負荷）が workforce 決定に直接活用されていない
- 拡大判断が経験的・直感的で、データ駆動な意思決定プロセスが不足
- 拡大後の maintenance cost と scaling efficiency のトレードオフが分析されていない
- agent staffing との境界が曖昧で、既存 agent のチューニング vs 新規 agent 導入の判断基準が不明

## proposed_changes
### データ駆動型拡大トリガーの定義
- heartbeat runtime metrics に基づいた具体的な拡大トリガーを設定
  - agent 遅延率が連続3サイクルで 30%超過
  - token 消費効率（output/input ratio）が基準値を 20% 下回る
  - deep review 率が 15% を超過し、容量が飽和
  - system throughput が需要増に対応できない状態が 48時間継続

### 段階的拡大戦略の構造化
- **Phase 1: 現有 agent の最適化** - prompt tuning, workload 分割, capacity 増強
- **Phase 2: 特化 agent の導入** - 既存 agent の機能分割で専門化
- **Phase 3: 全新規 agent の追加** - 上記2段階で解決不能なケースのみ
- **Phase 4: 系統全体のスケール** - マルチエージェント協調の強化

### 経済性ベースの ROI 分析
- 拡大前後の total cost of ownership (TCO) を比較
- 各 agent の contribution と maintenance cost のバランス分析
- scaling efficiency と diminishing returns の分析
- 拡大による quality/speed trade-off の定量化

### 継続的評価ループの構築
- 拡大後の 30/60/90 日で効果を評価
- 拡大が逆効果になった場合は縮小メカニズムを定義
- agent 間の重複と役割分担の定期的な最適化
- workforce 拡大の成功/失敗事例データベース化

## affected_paths
- `.openclaw/growth/runbooks/agent-workforce-expansion-strategy.md`
- `.openclaw/growth/config/workforce-expansion-metrics.json`
- `.openclaw/growth/prompts/agent-scaling-decision-framework.md`
- `.openclaw/growth/cron-wording/agent-workforce-health-check.md`
- `.openclaw/workspace/.openclaw/runtime/metrics/` - 拡大トリガー指標の追加
- `.openclaw/workspace/.openclaw/runtime/board/` - 拡大判断の board レポート

## evidence
- agent-workforce-expansion-review: 現行の拡大レビュープロセス
- heartbeat runtime analysis: agent performance と system metrics
- agent-staffing-performance-synthesis: 既存の staff 決定プロセス
- autonomy-loop-health-review: board_touch_high と exploration_drift の分析結果
- heartbeat-state.json: agent の状態と負荷指標

## requires_manual_approval
true

## next_step
1. workforce expansion の具体的な拡大トリガー指標を定義
2. 段階的拡大戦略の詳細な decision tree を設計
3. 拡大の ROI 分析フレームワークを開発
4. 現行の agent performance に対する current state 分析を実施

---

**Proposal ID:** agent-workforce-expansion-strategy-2026-03-28  
**Created:** 2026-03-28  
**Priority:** High  
**Integration Point:** Workforce Planning + Runtime Analysis + Economic Optimization