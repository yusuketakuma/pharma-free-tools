# proposal_id: autonomy-loop-and-agent-performance-consolidation-2026-03-29

## summary
空回りエージェントの根本解決と性能監視体制を統合し、リソース利用効率の向上を目指す提案。既存の agent-efficiency-optimization と agent-performance-monitoring-optimization を統合し、収束データに基づいた具体的な改善策を実施。

## observations
- 直近の Board ディスパッチレポートで、空回り状態のエージェント（receipt-delivery-reconcilerが13.5時間待機、queue-backlog-triage-clerkがdiminishing_returns状態）がリソース非効率の原因になっている
- agent performance monitoring の基盤は構築済みだが、実際の性能データに基づいた最適化が未実施
- agent-lesson-captureで繰り返し指摘される exact target mismatch が retry cost を押し上げている
- Supervisor系ジョブの重複問題（観測→triage→品質レビューの同質化）が運用効率を低下させている
- リソース監視と性能監視が別々で、系統的な最適化が困難

## proposed_changes
### 空回りエージェント根本解決体制
- **agent efficiency monitoring dashboard の実装**
  - 空回り状態をリアルタイム検知するダッシュボードを構築
  - 待機時間、diminishing_returns状態、resource contention を可視化
  - threshold breach 時に自動で triage アラートを発行
- **リソース最適化プロトコルの導入**
  - board-operator に定期的なリソース監視と調整ジョブを追加
  - 空回り検知後の自動調整機構（queue rebalancing, resource reallocation）
  - 適切なタイミングでの手動レビュー体制の確立

### 性能監視体制の構築
- **agent performance monitoring dashboard の強化**
  - 現在の性能監視基盤に空回り検知機能を統合
  - retry cost 要因（exact target mismatch, owner/due/success criteria不足）の特定と根本原因分析
  - 異常パターンの自動検知と改善提案
- **性能データに基づいた最適化サイクル**
  - 収束したパフォーマンスデータに基づく agent staffing 最適化
  - role boundary の動的調整メカニズム
  - light-edit/scout handoff の preflight 効果測定と改善

### Supervisorジョブの重複解消
- **supervisor-core の役割明確化**
  - 「例外の集約、最終 triage、board への橋渡し」に特化
  - routine な観測処理を他のジョブに委譲
- **queue-triage-analyst の新設**
  - dominant-prefix triage / 再掲抑制 / owner-next action 抽出を担当
  - 観測→triage→remediate の明確な分離を実施

## affected_paths
- .openclaw/growth/runbooks/agent-efficiency-monitoring-dashboard.md
- .openclaw/growth/cron-wording/agent-resource-optimization.md
- .openclaw/config/agents/board-operator/BOOT.md
- .openclaw/growth/prompts/queue-triage-analyst.md
- .openclaw/growth/runbooks/supervisor-core-narrow-scope.md
- .openclaw/config/agent-performance-monitoring.json
- .openclaw/scripts/agent_performance_analyzer.py
- .openclaw/docs/agent-performance-dash.md

## evidence
- Board ディスパッチレポート: 空回りエージェントの問題特定
- agent-lesson-capture-20260326-0615.md: exact target mismatch と retry cost の問題
- heartbeat-results.jsonl: 空回り状態の検知と suppress_until 設定
- agent-efficiency-optimization-fixed.json: 既存の効率化提案
- agent-performance-monitoring-optimization.json: 性能監視体制の基盤構築

## requires_manual_approval
false

## next_step
1. agent efficiency monitoring dashboard の実装とリソース最適化プロトコルの導入
2. 既存性能監視基盤への空回り検知機能統合
3. supervisor-core と queue-triage-analyst の役割分担の実装
4. 1ヶ月間の運用後に効果測定と調整