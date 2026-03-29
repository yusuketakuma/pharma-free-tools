# proposal_id: autonomy-improvement-metrics-system-2026-03-30

## summary
autonomy-kpi-outcome-reviewで明らかになった**指標体系のギャップ**を埋め、**proposal→実装→定着率**の測定と**自律改善の質的評価**を実現する。既存の実行回数ベース評価ではなく、成果物の質と継続性に焦点を当てた測定フレームワークを構築し、自律改善のROIを明確にする。

## observations
- 現行の問題：実行回数だけでは前進判定できず、PoC化・実装着手・利用価値に寄せた指標が弱い
- 主要なギャップ：
  1. **conversion trackingの不在**: proposal→実装→定着率の計測不可
  2. **owner/due/success criteria付与率の低さ**: 実行可能性評価が不十分
  3. **baseline/smoke遵守率の実測不足**: 品質維持の可視化不可
  4. **PoC化率の計測不足**: 探索→実装の転換率不明
  5. **前回提案の実装確認率の低さ**: 改善の継続性評価不可
- プロジェクト別の課題:
  - openclaw-core: safe-close/reopen実施件数、bundle manifest成功率、repeated prefix再掲率
  - pharma-free-tools: 出力型改善公開件数、visit/start/completion/CTA
  - sidebiz: PoC化率、棄却理由明確化率、次実験接続率
  - polymarket: compliance matrix完成率、paper trading plan完成率、stop rule明文化率
  - DeadStockSolution: keep/drop/relocate分類完了率

## proposed_changes
### 1. 3段階conversion trackingシステム
#### Phase 1: Proposal Quality Metrics
- **提案の実行可能性評価**:
  - owner/due/success criteria付与率（目標: 90%以上）
  - exact targetの明確性評価（binary: 明確/不明確）
  - estimated_cost vs actual_costの誤差率
  - duplicate_keyの一意性チェック
- **提案の適切性評価**:
  - 現状のbacklogとの整合性チェック
  - 前回提案との重複度チェック
  - priorityとの整合性評価

#### Phase 2: Implementation Tracking
- **実施率の測定**:
  - proposal開始から実行開始までの時間（target: < 24h）
  - 実行の中断率（retry/cleanup回数）
  - 実行完了率（binary: completed/failed）
  - 実行コストの実際 vs 予測
- **実施品質の測定**:
  - 出力物の品質スコア（review合格率）
  - テスト通過率（実施される場合）
  - ドキュメント化率（成果物への反映度）

#### Phase 3: Adoption & Impact Metrics
- **定着率の測定**:
  - 実装後の3ヶ月間使用継続率
  - 他プロジェクトへの適用率
  - 改善提案としての再利用率
- **影響度の測定**:
  - 業務効率化の定量化（時間削減量）
  - エラー削減率
  - ユーザー満足度の変化

### 2. Project-Specific KPI Dashboard
#### openclaw-core
- **safe-close/reopen実施件数**: 月目標10件以上
- **bundle manifest + dry-run成功率**: 95%以上
- **repeated prefixの再掲率**: 80%以上
- **baseline/smoke遵守率**: 99%以上

#### pharma-free-tools  
- **出力型改善公開件数**: 月目標3件以上
- **visit/start/completion/CTA比率**: 改善前後比較で15%向上
- **既存刷新完了率**: 90%以上
- **ユーザー利用継続率**: 85%以上

#### sidebiz
- **PoC化率**: 候補提案の60%以上を実装に
- **棄却理由明確化率**: 90%以上に明文化
- **次実験接続率**: PoC完了後の30日以内次実施率70%以上
- **owner/due/success criteria付与率**: 95%以上

#### polymarket
- **compliance matrix完成率**: 100%（必須）
- **paper trading plan完成率**: 80%以上
- **stop ruleの明文化率**: 100%
- **検証完了率**: 技術的実現可能性の100%確認

#### DeadStockSolution
- **keep/drop/relocate分類完了率**: 90%以上
- **変更完了率**: 棚卸し完了後の2週間以内80%以上
- **境界維持の実測**: 変更による仕様逸脱の0%

#### CareRoute-RX
- **WIP-TRIAGE-001完了率**: 3bucket化100%完了
- **UI正常化完了率**: 表示問題の90%以上解決
- **source repo差分削減率**: 月50%削減
- **baseline遵守率**: 95%以上

### 3. 自律改善品質評価フレームワーク
#### Governance Health Indicators
- **Board Signal/Candidate Ratio**: 正常時は10:1以下
- **Duplicate Suppression Rate**: 70%以上（重複提案の防止）
- **Precedent Hit Rate**: 85%以上（既存知識の活用）
- **Auto Disposition Rate**: 60%以上（自動解決の増加）

#### Execution Quality Indicators  
- **Retry Cost Ratio**: retry回数の削減（目標: 50%削減）
- **Artifact Defect Rate**: 成果物の欠陥率（目標: 5%以下）
- **Decision Latency**: 判断までの時間（目標: < 4h）
- **Manual Override Rate**: 手動介入率（目標: 20%以下）

#### Learning & Adaptation Indicators
- **Lesson Application Rate**: 学びの適用率（目標: 75%以上）
- **Policy Update Frequency**: 政策更新の適切性（月1-2回が適切）
- **Anomaly Detection Accuracy**: 異常検知精度（目標: 90%以上）
- **Improvement Sustainment Rate**: 改善の維持率（目標: 80%以上）

### 4. 自動化測定システム
#### Metrics Collection Pipeline
- **実行データの自動収集**: 各jobの実行ログからメトリクス抽出
- **成果物の自動評価**: 出力ファイルの品質スコアリング
- **使用状況の追跡**: 成果物の実際利用状況の監視
- **継続性の監視**: 長期的な定着状況の追跡

#### Dashboard & Reporting
- **リアルタイムダッシュボード**: 各KPIの現在値と進捗
- **週次レポート**: 成果と課題のサマリー
- **月次インサイト分析**: 改善効果の深分析
- **アラートシステム**: 重要な閾値突破の通知

## affected_paths
- `.openclaw/growth/runbooks/autonomy-improvement-metrics-system.md`
- `.openclaw/growth/config/autonomy-kpi-dashboard.json`
- `.openclaw/growth/cron-wording/weekly-metrics-collation.md`
- `.openclaw/growth/prompts/metrics-analyst.md`
- `.openclaw/workspace/.openclaw/runtime/metrics/conversion-tracking.js`（新規）
- `.openclaw/workspace/.openclaw/runtime/metrics/quality-assessment.js`（新規）
- `.openclaw/workspace/.openclaw/runtime/metrics/adoption-monitor.js`（新規）
- `.openclaw/workspace/.openclaw/runtime/dashboards/autonomy-kpi-dashboard/`（新規ディレクトリ）

## evidence
- autonomy-kpi-outcome-review-20260326-0430.md: 各プロジェクトの現状と指標ギャップ
- agent-lesson-capture-20260326-0615.md: 反復しているlessonと問題点
- agent-performance-learning-synthesis-2026-03-28.md: 経済性評価の必要性
- heartbeat-governance-report-snapshot-anomaly-delta-spec-v0.2.md: governanceフレームワークの基礎

## requires_manual_approval
false

## next_step
1. conversion trackingシステムのschema定義
2. project-specific KPI dashboardのプロトタイプ開発
3. 自動化測定システムの技術設計
4. metrics collection pipelineの実装
5. 1ヶ月間のパイロット実施と効果検証