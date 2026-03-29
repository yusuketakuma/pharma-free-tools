# Board Meeting Governance Model: アーキテクチャ分離問題緊急修正

**board_cycle_slot_id**: 32ba03a1-c935-486d-8946-873b4235557e  
**発見日時**: 2026-03-28 13:52 GMT+9  
**問題レベル**: 🔴 Critical (アーキテクチャ分離の根本的失敗)

## 緊急アラート: 実行プレーン未接続問題

### 🔴 最大の発見
**設計との乖離**: ディスパッチで「実行系エージェントはClaude Codeで実行」と設計したが、**全実行系エージェントがOpenClaw内のみで稼働**。Claude Code execution planeへのタスクディスパッチは0件。

**根本原因**: エージェントのsystem promptにClaude Code呼び出しトリガー条件が定義されていない

**影響範囲**:
- autonomous-development-hq: heartbeatでのみコード分析 (OpenClaw-only)
- pharmacy-hq: 配下4担当監視中 (具体案件投入待ち)
- product-operations-hq: 配下5担当全てblocked/done (ユーザー判断待ち)

## 現在のアーキテクチャ状態

### ❌ 設計通りに動作していない部分
```
理想的な流れ:
OpenClaw指示 → Claude Code実行 → 成果物返却

実際の流れ:
OpenClaw指示 → OpenClaw内heartbeatのみ → Claude Code未呼び出し
```

### ✅ 機能している部分
- 制御プレーン (OpenClaw): intake/routing/review/publish ✅
- 議題生成: 3件のagenda seedは生成済み ✅
- エージェント通信: 送信100%/受理100% ✅

## 緊急修正アクション

### 🔴 Priority 1: 実行系エージェントのsystem prompt修正
**対象エージェント**:
- autonomous-development-hq
- pharmacy-hq  
- product-operations-hq
- monetization-hq

**修正内容**: Claude Code呼び出しトリガーを明記
```
[修正後のsystem prompt例]
当エージェントが以下の条件を満たす場合、Claude Code execution planeで実行すること:
1. 複数ファイル変更が必要なタスク
2. テスト実行を伴う実装タスク  
3. repo調査が必要な機能開発
4. 重量なrefactor作業
上記条件の場合、sessions_spawnでClaude Codeを呼び出し、execution planeで処理を行う
```

### 🔴 Priority 2: 古いrunning sessionクリーンアップ
**対象セッション**:
- ceo-tama: 90セッション (古いcron run)
- supervisor-core: 22セッション  
- board-auditor: 9セッション

**アクション**: running状態の古いセッションを強制停止

### 🟡 Priority 3: 空回り担当のcron調整
**対象担当**:
- receipt-delivery-reconciler: 13.5時間待機状態
- backlog-triage-clerk: diminishing_returns状態

**アクション**: cron停止 or 間隔延長

## 次アクション計画

### 即時アクション (1-2時間内)
1. **実行系エージェントのsystem prompt修正**
2. **古いrunning sessionのクリーンアップ実行**
3. **修正後の動作確認**

### 短期アクション (24時間内)  
1. **修正後のアーキテクチャ分離検証**
2. **各エージェントの実行場所再確認**
3. **Board Meeting Governance Modelの再定義**

### 長期アクション (1週間内)
1. **エージェント配置の自動判定ロジック改善**
2. **アーキテクture監視システムの構築**
3. **Governance Modelの根本的見直し**

## 監査ポイント

### 検証項目
1. **実行場所の正確性**: 実行系エージェントがClaude Codeで実行されているか
2. **トリガー条件**: system promptのClaude Code呼び出しトリガーが機能しているか
3. **成果物の質**: Claude Code実行の品質とスピード
4. **リソース効率**: 古いセッションクリーンアップの効果

### 評基指標  
- **実行プレーン移行率**: 目標80%以上
- **セッション数**: 古いrunningセッション削減目標50%
- **処理速度**: Claude Code実行のスピード向上

---
**緊急度**: 🔴 Critical  
**修正期限**: 2026-03-28 18:00 GMT+9 (4時間以内)  
**責任者**: 取締役会議長 (supervisor-core)  
**監査担当**: 監査取締役 (board-auditor)