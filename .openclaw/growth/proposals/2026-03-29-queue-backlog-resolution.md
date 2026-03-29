# proposal_id: queue-backlog-resolution-2026-03-29

## summary
heartbeat runtime report で明らかになった stale backlog 問題を根本解決する。waiting_auth と waiting_manual_review の大量滞留を防ぐメカニズムと、自動再同期・再バランス・安全性担保の統合プロセスを提案する。auth drift と runtime error パターンを基盤とした予防的ケアを実装。

## observations
- waiting_auth queue: 476ファイル（最古~59.6h）と waiting_manual_review: 343ファイル（同~59.6h）が大量滞留
- 現行の auth は OK だが、過去の auth drift で蓄積された stale queue が残存
- runtime_error exit_code=30 と write task fallback blocked パターンが 7日間で 255/431/26 回発生
- cli_backend_safety_net が unhealthy（probe exited 1）で、自動降下機能が信頼性を損なっている
- 現行ではバックログが溢れたときの人手での対応しかなく、自動再同期機能が欠如

## proposed_changes
### 自動再同期メカニズムの導入
- auth status 変化時の自動 queue リセット機能
  - auth が OK に変わったとき、waiting_auth backlog の自動再評価・再分類
  - stale item の動的フィルタリング（age > 48h 且つ auth 時刻 > ステータス更新時刻）
  - 再同期失敗時の fallback ルーチン（safe deletion と rewrite）
- manual review queue の自動チューニング
  - stale item の危険度評価（path, size, age 基準）
  - 低リスク stale item の自動削除/再試行
  - 人間レビューが必要な明確なフラグ付け

### 実行時エラーパターンの検出と対応
- runtime_error exit_code=30 のトレンド分析
  - 特定 agent や path での再発パターンの特定
  - エラーが閾値を超えた場合の自動 throttling
  - エラー率に基づいた capacity 調整の自動トリガー
- write task fallback blocked パターンの対処
  - write vs read の自動判別メカニズムの強化
  - side effect リスクの事前評価（file path, operation type 基準）
  - fallback のデフォルト挙動の明文化と自動選択

### Safety Net の信頼性向上
- cli_backend_safety_net の自動診断と修復
  - probe 失敗時の自動再起動
  - 健全性チェックのバックアップ機構（acp/cli から別途監視）
  - 安全が確認できない場合は自動的に degraded 状態へ移行
- degraded state の明確な定義と動作
  - fallback を使える明確な条件
  - 修復不能な場合は手動介入フラグの自動設定
  - 状態変化の board レポートへの自動反映

### Queue 健全性の継続的監視
- queue backlog のリアルタイムダッシュボード
  - waiting_auth, waiting_approval, waiting_capacity, waiting_manual_review の可視化
  - backlog age 分布と growth rate のモニタリング
  - 閾値超過時の自動アラート（slack/board integration）
- queue item の lifecycle tracking
  - create → process → resolve/reject のフルトレーサビリティ
  - requeue 回数と success rate の監視
  - bottleneck と choke point の特定

## affected_paths
- `.openclaw/growth/runbooks/queue-backlog-resolution-workflow.md`
- `.openclaw/growth/config/queue-recovery-metrics.json`
- `.openclaw/growth/prompts/automatic-queue-recovery-prompt.md`
- `.openclaw/growth/cron-wording/queue-health-monitor.md`
- `.openclaw/workspace/.openclaw/runtime/metrics/` - queue 指標の追加
- `.openclaw/workspace/.openclaw/runtime/board/` - queue 状態の定期報告
- `.openclaw/workspace/.openclaw/scripts/` - queue リカバリスクリプト

## evidence
- heartbeat runtime report 2026-03-25-0330-jst.md: waiting_auth 476, waiting_manual_review 343 の大量滞留
- heartbeat-state.json: auth status と runtime metrics の関連性
- runtime_error exit_code=30 と timeout exit_code=20 の 7日間発生数
- repeated lifecycle message: automatic fallback blocked: write task may have side effects
- cli_backend_safety_net probe failure の記録

## requires_manual_approval
true

## next_step
1. queue recovery workflow の詳細設計と安全ガード定義
2. runtime error パターン分析ツールの開発
3. queue health dashboard の prototype 作成
4. 自動再同期メカニズムの実験的実装（制限された scope で）