# proposal_id: cron-distributed-migration-monitoring-2026-03-28

## summary
Cronジョブ分散移行完了後の**監視体制強化**と**調整プロセスの自動化**を実施。移行効果の継続的検証と問題点の早期発見・修正を組み込み、分散後の安定稼を実現する中リスク改善。

## observations
- 38件のCronジョブを分散移行完了済みだが、効果検証のプロセスが手動依存
- supervisor-coreに22件のジョブが集中し、依然として負荷が高い
- クローンされたジョブの実行間隔がばらつき、3分から8分の不確実性
- エラー検知後の手動対応が続いており、自動復旧プロセスが不足
- 分散移行による負荷分散効果の定量化・可視化が必要

## proposed_changes
- **効果検証の自動化**
  - 分散移行効果の週次レポートを自動生成（月曜AMに前週の集計）
  - supervisor-core負荷の定時監視（5分間隔）と閾値超過時の自動アラート
  - クローンジョブの実行パターン分析と最適化提案の自動生成
  - 各エージェントごとの成功/失敗率の追跡と異常検知

- **調整プロセスの自動化**
  - 連続エラー検知時の自動ジョブ一時停止（3回連続で該当ジョブを30分停止）
  - 実行間隔の自動調整（過負荷時は+2分、低負荷時は-1分を最大3回まで）
  - 重複ジョブの自動検出と統合提案（週1回スキャン）
  - agentIdセッションキーの正常性チェックの自動化

- **監視体制の強化**
  - 各エージェントの負荷ダッシュボードをGitHub pagesで公開
  - 移行前後の比較レポートを毎日自動生成
  - ジョブ実行ログの集中管理と異常パターンの学習
  - サービスレベル目標（SLO）の設定と達成率の追跡

## affected_paths
- /system-cron-monitoring/distributed-migration-effect-weekly-report.js (新規)
- /system-cron-monitoring/supervisor-core-load-monitor.js (新規)
- /system-cron-monitoring/job-pattern-analysis.js (新規)
- /system-cron-monitoring/auto-recovery-protocol.js (新規)
- /system-cron-monitoring/interval-auto-tuner.js (新規)
- /system-cron-monitoring/duplicate-job-detector.js (新規)
- /system-cron-monitoring/agent-session-health-check.js (新規)
- /system-cron-monitoring/dashboards/ (新規ディレクトリ)
- /system-cron-monitoring/slo-tracking.js (新規)
- /system-cron-monitoring/reports/ (新規ディレクトリ)

## evidence
- Cronジョブ分散移行完了報告 (2026-03-28)
- 移行後の初回Boardサイクル検証結果 (2026-03-28)
- クローンジョブの実行パターンデータ
- supervisor-coreの負荷状況（session_statusでの確認）
- エラージョブ修復記録 (2026-03-28)

## requires_manual_approval
false

## next_step
監視・調整システムの基本構成を実装し、分散移行後1ヶ月間のベースラインデータを収集。2週間後の初期効果検証で自動化プロセスの有効性を確認。完全自動化に向けた段階的導入を開始。