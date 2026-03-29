# proposal_id: project-priority-management-framework-2026-03-30

## summary
workspace-project-priority-reviewで維持されたTop3プロジェクト（openclaw-core→careroute-rx→pharma-free-tools）の具体的な実行ロードマップを構築し、**優先度管理の定式化**と**進捗追跡の自動化**を実現する。抽象的な優先度判断ではなく、実行可能な具体アクションと成果物の明確化で、プロジェクト間のリソース配分と進捗管理を体系化する。

## observations
- Top3プロジェクトの顔ぶれは維持されているが、**優先度の根拠が文書化されていない**
- openclaw-core: workspace全体の自律実行品質底上げ（高レバレッジ）
- careroute-rx: 事業/運用インパクトが非常に高い（差分肥大化リスク）
- pharma-free-tools: 低リスクで成果積みやすい（実需ベース改善）
- **共通課題**: 次の1手の明確さが不足→具体的な実行計画と成果物定義が必要
- 既存のpriority reviewは採点ベースだが、**実行計画との連携が弱い**

## proposed_changes
### 1. 優先度判断フレームワークの定式化
- **4象限評価基準の明文化**
  - 変更量（技術的負荷）
  - 未整理度（整理コスト）
  - 業務/収益インパクト（事業価値）
  - 次の1手の明確さ（実行可能性）
- **重み付け設定**
  - 業務/収益インパクト: 40%（最重要）
  - 次の1手の明確さ: 30%（実行可能性）
  - 変更量: 20%（技術的負荷）
  - 未整理度: 10%（整理コスト）
- **判定カテゴリ**
  - 緊急：業務インパクト高 + 次の手明確
  - 重要：業務インパクト高 + 次の手不明確
  - 優先：次の手明確 + 中程度インパクト
  - 監視：低リスクで継続観察

### 2. Top3プロジェクトの具体実行ロードマップ
#### openclaw-core
- **優先度理由**: workspace全体の自律実行品質・レビュー品質・更新安全性を底上げ（レバレッジ最大）
- **具体アクション1**: stale-report detection仕様の1枚化（Ready #1）
- **具体アクション2**: queue telemetry → triage → decision-qualityの自動化
- **具体アクション3**: fallback notificationの設計と実装
- **成果物**: 
  - stale-report detection spec
  - queue-triage-automation runbook
  - fallback-notification-system

#### careroute-rx  
- **優先度理由**: 事業/運用インパクト非常に高、差分肥大化でreview/rollback/securityコスト跳ねやすい
- **具体アクション1**: source repoのFE-DISPLAY系/security follow-up/unrelated WIPへの棚卸し
- **具体アクション2**: WIP-TRIAGE-001の3bucket化完了
- **具体アクション3**: UI正常表示改善の仕様定義
- **成果物**:
  - source-repo-triage-manifest
  - wip-triage-completion-report
  - ui-normalization-spec

#### pharma-free-tools
- **優先度理由**: 実需ベースで改善候補絞られており、低リスクで成果積みやすい
- **具体アクション1**: 1位候補「薬歴下書き・要点整理支援」のワイヤー固定
- **具体アクション2**: 出力要件（SOAP/次回確認/患者説明メモ）の定義
- **具体アクション3**: 返戻表記ゆれの最終修正適用
- **成果物**:
  - medication-summary-wireframe
  - output-specification-document
  - consistency-correction-log

### 3. 進捗追跡の自動化
- **優先度レビューの定期実行**: 月1回（1日月曜AM）の自動実行
- **進捗指標の計測**:
  - 具体アクション完了率
  - 予定vs実績の差分分析
  - 予測精度の追跡
- **アラートシステム**:
  - 進捗遅延の早期検知
  - 優先度変更の自動提案
  - リソース不足の予兆検知

### 4. リソース配分の最適化
- **プロジェクト間の依存関係可視化**
- **リソースバッファの自動調整**
- **並列/逐次処理の自動判定**
- **クリティカルパスの特定と監視**

## affected_paths
- `.openclaw/growth/runbooks/project-priority-management-framework.md`
- `.openclaw/growth/config/priority-evaluation-metrics.json`
- `.openclaw/growth/cron-wording/monthly-project-priority-review.md`
- `.openclaw/growth/prompts/roadmap-coordinator.md`
- `.openclaw/workspace/projects/openclaw-core/roadmap/priority-tracing.md`（新規）
- `.openclaw/workspace/projects/careroute-rx/roadmap/priority-tracing.md`（新規）
- `.openclaw/workspace/projects/pharma-free-tools/roadmap/priority-tracing.md`（新規）

## evidence
- workspace-project-priority-review-2026-03-26-0330.md: Top3プロジェクトの現状と優先度根拠
- autonomy-kpi-outcome-review-20260326-0430.md: 各プロジェクトの進捗と課題
- agent-staffing-performance-synthesis-2026-03-27.md: リソース配分の重要性
- heartbeat-governance-report-snapshot-anomaly-delta-spec-v0.2.md: governanceフレームワークの有効性

## requires_manual_approval
false

## next_step
1. 優先度評価フレームワークのJSON schema定義
2. Top3プロジェクトの具体実行ロードマップの詳細化
3. 進捗追跡自動化プロトタイプの開発
4. 月次priority reviewのcron設定
5. 2ヶ月間の実験的運用と効果検証