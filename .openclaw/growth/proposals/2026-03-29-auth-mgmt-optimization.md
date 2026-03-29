# proposal_id: auth-mgmt-optimization-2026-03-29

## summary
auth drift 検出と credential 管理を根本的に最適化する。subscription-only 認証の信頼性向上と、auth 変化時の自動対応メカニズムを提案する。ANTHROPIC_API_KEY の管理を含む認証アーキテクチャの再構築で、システムの堅牢性とメンテナンス性を向上。

## observations
- 現行の auth 検出が periodic snapshot ベースでリアルタイム性に欠ける
- auth drift 検出後の対応が manual review に依存し、自動復旧機能が不足
- ANTHROPIC_API_KEY の管理が分散しており、一貫性とセキュリティが課題
- subscription-only 認証の信頼性基盤が複雑で、故障ポイントが不明確
- auth 変化時の queue recovery が非効率的で、多くの stale item が発生
- 認証失敗時の fallback メカニズムが曖昧で、リスク評価が不十分

## proposed_changes
### 認証状態のリアルタイム監視と検出
- 定期的な auth health check の実装
  - 5分間隔の Claude auth status 確認
  - subscription 状態と token 有効性の同時監視
  - auth drift の早期検出と即時通知
- auth state change event の追跡
  - auth 状態変化時の自動ログ記録
  - 変化原因の自動分析（期限切れ、network 問題、設定変更）
  - state transition history の保持と分析

### Subscription-only 認証アーキテクチャの再構築
- 統一された認証管理レイヤー
  - ANTHROPIC_API_KEY の一元管理（暗号化保管）
  - credential rotation の自動化（期限管理）
  - multi-layer auth validation の導入
- 認証方法の明確化と標準化
  - subscription login を primary、API key を secondary として明確化
  - 各種認証経路の優先順位と fallback の定義
  - auth method の自動切り替えメカニズム

### Auth 変化時の自動対応フロー
- 自動復旧メカニズムの実装
  - auth OK から auth NG 変化時の graceful degradation
  - auth NG から auth OK 変化時の queue auto-recovery
  - 継続的な auth health monitoring loop
- Queue 再同期の最適化
  - auth 状態変化時の intelligent queue filtering
  - stale item の自動再評価と再分類
  - safe recovery vs manual review の自動判定
  - 再同期失敗時の emergency protocols

### 認証リスクの評価と管理
- auth 依存度の分析と評価
  - 各 feature が auth に依存する程度の可視化
  - auth 失敗時の影響範囲と business impact の評価
  - critical path と non-critical path の分離
- 認証失敗時の fallback ガバナンス
  - fallback の条件と自動化範囲の明確化
  - 安全性のガードレール（protected path への影響回避）
  - fallback の監視と監査証跡の保持

### 長期的な信頼性の向上
- 認証インフラの監視ダッシュボード
  - auth health score の計算と表示
  - 変化履歴と予測分析
  - 警告レベルの設定と通知
- 定期的な認証パターン分析
  - auth drift 原因の根本原因分析
  - 再発防止策の自動提案
  - best practice の自動収集と適用

## affected_paths
- `.openclaw/growth/runbooks/auth-mgmt-optimization-workflow.md`
- `.openclaw/growth/config/auth-health-metrics.json`
- `.openclaw/growth/prompts/auth-recovery-automation-prompt.md`
- `.openclaw/growth/cron-wording/auth-health-monitor.md`
- `.openclaw/workspace/.openclaw/runtime/auth/` - 認証管理レイヤーの追加
- `.openclaw/workspace/.openclaw/runtime/config/` - 認証設定の集中管理
- `.openclaw/workspace/.openclaw/scripts/` - auth 管理スクリプト群
- `.openclaw/workspace/TOOLS.md` - 認証方針の更新

## evidence
- heartbeat runtime report: auth OK だが waiting_auth backlog の存在
- BOARD_GOVERNANCE.md: subscription-only 認証の policy 定義
- TOOLS.md: ANTHROPIC_API_KEY 主系使用禁止のルール
- existing auth failure patterns: fallback blocked と runtime_error exit_code=30 の関連性
- auth drift detection requirements: periodic snapshot の限界

## requires_manual_approval
true

## next_step
1. auth health monitoring ダッシュボードの設計と開発
2. credential rotation 自動化の prototype 実装
3. auth state change event の追跡システム構築
4. queue recovery と auth state 連携のテスト環境準備