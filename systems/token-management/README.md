# トークン管理システム

## 概要
トークン使用量を監視し、自動的に稼働モードを切り替えることで、24時間継続稼働を実現するシステム。

## 構成

### 1. トークン使用量監視 (`token-usage-monitor.js`)
- 15分ごとにトークン使用量を測定
- 消費速度と残時間を予測
- 消費トレンドの分析

### 2. トークンモード管理 (`token-mode-manager.js`)
- 3つの稼働モードを管理
- サブエージェント数と実行間隔を動的に調整
- 緊急時対応機能

### 3. 統合コーディネーター (`token-manager-coordinator.js`)
- 監視と調整を統合
- アラート処理と自動アクション
- 状態管理と保存

### 4. Cronジョブセットアップ (`setup-token-management-cron.js`)
- OpenClawのcronシステムにジョブを登録
- 定期的な実行を自動化

## 稼働モード

### 省エネモード (Energy Saving)
- **消費速度**: 8kトークン/時間 (33%削減)
- **サブエージェント**: 6体
- **実行間隔**: 7分
- **トリガー**: トークン残量 < 4時間 or 月間予算 > 80%

### 通常モード (Normal)
- **消費速度**: 12kトークン/時間 (標準)
- **サブエージェント**: 8体
- **実行間隔**: 5分
- **トリガー**: デフォルトモード

### 高効率モード (High Efficiency)
- **消費速度**: 16kトークン/時間 (33%増)
- **サブエージェント**: 10体
- **実行間隔**: 3分
- **トリガー**: トークン残量 > 12時間 and 月間予算 < 20%

## インストール

### 1. ファイル配置
```bash
mkdir -p /Users/yusuke/.openclaw/workspace/systems/token-management
cp token-usage-monitor.js /Users/yusuke/.openclaw/workspace/systems/token-management/
cp token-mode-manager.js /Users/yusuke/.openclaw/workspace/systems/token-management/
cp token-manager-coordinator.js /Users/yusuke/.openclaw/workspace/systems/token-management/
cp setup-token-management-cron.js /Users/yusuke/.openclaw/workspace/systems/token-management/
```

### 2. OpenClawジョブ登録
```bash
cd /Users/yusuke/.openclaw/workspace/systems/token-management
node setup-token-management-cron.js
```

### 3. システム起動
```bash
# テスト実行
node token-manager-coordinator.js once

# 定期実行モード
node token-manager-coordinator.js
```

## 使用方法

### 手動でのモード切り替え
```bash
# 省エネモードへ切り替え
node token-mode-manager.js energy_saving "理由"

# 通常モードへ切り替え
node token-mode-manager.js normal "理由"

# 高効率モードへ切り替え
node token-mode-manager.js high_efficiency "理由"

# 緊急停止
node token-mode-manager.js emergency stop_all
```

### 状態確認
```bash
# 現在のモードを確認
node token-mode-manager.js

# システム状態を確認
node token-manager-coordinator.js once
```

## ファイル構成

```
/Users/yusuke/.openclaw/workspace/systems/token-management/
├── token-usage-monitor.js      # トークン使用量監視
├── token-mode-manager.js       # モード管理
├── token-manager-coordinator.js # 統合管理
├── setup-token-management-cron.js # Cronジョブセットアップ
├── current-session.json        # 現在セッション情報
├── current-mode.json           # 現在モード設定
├── system-state.json           # システム状態
└── history.json                # 履歴データ
```

## 通知システム

### 自動通知タイミング
1. **モード変更時**: CEOセッションに通知
2. **警告ライン**: secretariat-hqが通知作成
3. **停止ライン**: 緊急アクション実行と通知
4. **月予算警告**: 定期報告に統合

### 通知内容
- 現在モード
- トークン残量
- 予測残時間
- 推奨アクション
- 変更理由

## 自己改善ループ統合

### 定期レビュー
- **週次**: ops-automatorによる効率評価
- **月次**: supervisor-coreによる長期トレンド分析
- **必要時**: 即時的なパラメータ調整

### 改善提案プロセス
1. 消費パターンの分析
2. 予測精度の評価
3. パラメータ最適化提案
4. Boardでの承認
5. 自動適用

### 監視指標
- 平均消費速度
- モード切り替え頻度
- 予測精度
- 緊止動作の発生率

## トラブルシューティング

### 一般的な問題
1. **予測精度不足**: バッファ率を一時的に増加
2. **頻繁なモード切り替え**: 切り替え閾値を調整
3. **通知過多**: 通知間隔を調整

### 緊急対応
1. **システム異常**: 手動モード設定へ移行
2. **予測不能な消費**: 一時的な省エネモード強制
3. **通知システム異常**: CEOへの直接通知

### ログ確認
```bash
# システム状態の確認
cat /Users/yusuke/.openclaw/workspace/systems/token-management/system-state.json

# 履歴データの確認
cat /Users/yusuke/.openclaw/workspace/systems/token-management/history.json

# 現在セッション情報の確認
cat /Users/yusuke/.openclaw/workspace/systems/token-management/current-session.json
```

## 開発者向け

### 拡張ポイント
1. **予測モデル**: `token-usage-monitor.js`の`analyzeConsumptionTrend`関数
2. **モード判定**: `token-manager-coordinator.js`の`evaluateModeChange`関数
3. **アラート処理**: `token-manager-coordinator.js`の`evaluateAlerts`関数

### テスト
```bash
# 単体テスト
node token-usage-monitor.js
node token-mode-manager.js normal
node token-manager-coordinator.js once

# 統合テスト
node setup-token-management-cron.js
```

### 依存関係
- Node.js (v16+)
- OpenClaw CLI
- ファイルシステムアクセス

## 連携エージェント

### 主要担当エージェント
- **ops-automator**: トークン管理システムの監視と実行
- **secretariat-hq**: 状態変化時の通知処理
- **supervisor-core**: 全体の監視と異常検知

### 連携タイミング
- 状態変化時: ops-automator → secretariat-hq (通知)
- 異常検知時: supervisor-core → ops-automator (調整指示)
- 手動操作時: CEO → 全エージェント (指示伝達)