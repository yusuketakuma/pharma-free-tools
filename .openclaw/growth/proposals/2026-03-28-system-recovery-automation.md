# Growth Proposal

- proposal_id: GP-2026-03-28-system-recovery-automation-01
- title: 全システム停止時の自動回復プロセス構築で信頼性を向上させる
- status: proposed
- risk: medium
- requires_manual_approval: true

## Summary

2026-03-20に発生した39時間にわたる全システム停止は、部長エージェント自身のcronジョブ停止が原因でした。停止検知と自律的な回復プロセスを構築することで、システム全体の信頼性を向上させ、緊急タスク（テリパラチド期限など）の遅延を防止します。

## Observations

1. **全システム停止の事例と影響**
   - **事象**: 2026-03-20 39時間停止（cronジョブ停止が原因）
   - **影響**: テリパラチド期限が9日→8日に迫り、MCS操作推奨期間が2日消費
   - **メカニズム**: 部長エージェントのcron停止→homecare/sidebiz依存→全系統停止

2. **現行の復旧パターンの課題**
   - 人的介入依存：ゆうすけによる手動確認が必須
   - 検知手段不足：部長エージェント自身のcron停止を検知する仕組みがない
   - 復帰確認の不十分さ：status.md更新だけで実稼働（成果物提出）まで追跡できていない

3. **自律回復の可能性**
   - `last-report-time.txt` のタイムスタンプ差分で自己検知可能
   - 復帰後の優先タスクをdispatch.mdに事前定義可能
   - 外部リソース健全性チェック（GitHub/API）が監視基盤として機能

## Proposed Changes

### システム停止の自律検知メカニズム
- **last-report-time.txt監視**: 部長エージェントの最終報告時刻を追跡
- **タイムスタンプ閾値設定**: 通常サイクルの2倍以上時間が経過した場合に停止を検知
- **外部健康チェック**: GitHub API経由のリポジトリアクセス確認を追加監視項目に

### 段階的回復プロセスの自動化
- **フェーズ1: 停止検知と通知**
  - 検知時に自動でシステム停止を判定
  - ゆうすけへ直接通知（既存の通知機構を活用）
  - 停止期間と影響範囲を自動算出

- **フェーズ2: 自律的な再起動試行**
  - 複数の再起動方法を自動試行（標準再起動→強制再起動→リソース再読み込み）
  - 各試行結果をログ記録し、成功条件を明確化
  - 3回の試行で失敗した場合のみ人の介入を要請

- **フェーズ3: 復帰後の状態確認**
  - status.md作成の自動確認
  - outputs/ディレクトリ内のファイル存在確認
  - 重要エージェント（homecare/sidebiz）との接続性確認

### 緊急タスクの保護メカニズム
- **CRITICALタグの自動継続**: 停止前に存在したCRITICALタスクは復帰後すぐに再発行
- **期限切れリスクの早期検知**: 停止期間中に期限が近づいたタスクを特定
- **バックアップdispatchの保持**: 停止直前のdispatch状態を定期的に保存

## Expected Benefits

- **システム信頼性向上**: 人的介入なしでの自動回復によりダウンタイムを削減
- **緊急タスク保護**: テリパチド期限などの重要業務の遅延を防止
- **運用負担低減**: 異常時の対応プロセスを標準化し、判断コストを削減
- **復帰速度向上**: 段階的回復プロセスにより、完全復帰までの時間を短縮

## Non-Goals

- エージェントの根本的なアーキテクチャ変更
- 新しい通知チャネルの追加
- 人の判断を完全に排除する自動化

## Affected Paths

- `.openclaw/growth/runbooks/system-recovery-automation.md`
- `.openclaw/growth/cron-wording/system-health-monitor.md`
- `.openclaw/growth/config/recovery-automation.json`
- `.openclaw/growth/prompts/system-recovery-coordinator.md`
- 部長エージェントのcronジョブ設定

## Evidence

- `lessons-learned.md` に記載の「全システム停止からの回復パターン」（2026-03-20 39時間停止）
- `lessons-learned.md` に記載の「部長エージェント自身のcronが停止すると、部下の異常検知・dispatch更新が全て止まる」
- GitHub認証を活用した定期監視の実効性確認（lessons-learned.md 2026-03-19 03:38）

## Requires Manual Approval

true

## Next Step

1. システム健康チェックモジュールの設計と実装
2. 段階的回復プロセスの詳細プロトタイプ作成
3. 回復プロセスのテスト環境での検証
4. 本番環境への段階的適用計画策定