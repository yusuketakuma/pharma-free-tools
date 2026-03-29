# proposal_id: token-management-system-operational-tuning-2026-03-28

## summary
トークン管理システムの初期運用結果に基づき、**予測精度向上**と**異常検知強化**を実施。省エネ/通常/高効率の3モードが過度に頻繁に切り替わる問題を解消し、安定した運用を実現する低リスク改善。

## observations
- 初期運用で3モード間の切り替えが過度に発生（15分間隔で2-3回）
- 消費予測の精度が不足しており、バッファ率が10%でも誤検知が多い
- 月間予算使用率の閾値設定が不適切で、80%警告が過剰に発動
- トークン残量3時間ラインが安定稼働にとって厳しすぎる
- 15分間隔の監視が、実消費の短期的な変動に過剰に反応している

## proposed_changes
- **予測精度向上**
  - 15分間隔の監視を30分間隔に緩和し、短期的なノイズを除去
  - 消費予測モデルに移動平均フィルタを導入（直4回分の平滑化）
  - 月間予算使用率の閾値を調整：80%→85%、90%→95%に緩和
  - トークン残量ラインを緩和：3時間→4時間、1時間→2時間

- **異常検知強化**
  - 消費速度の標準偏差を計算し、±2σ以上の変化のみを異常として扱う
  - モード切り替えのクールタイムを30分に設定（連続切り替え防止）
  - 異常検知時はモード変更ではなく「警告ステータス」を導入
  - 緊急停止ラインを2時間→1.5時間に緩和し、安全マージンを確保

- **運用体制整備**
  - トークン使用量の週次レポートを生成（月曜AMに前週の消費パターン分析）
  - 予測誤差の月次レビューを実施（モデル精度の継続的改善）
  - セッションベースの実際消費量を監視ファイルに記録

## affected_paths
- /system-token-management/token-usage-monitor.js
- /system-token-management/token-mode-manager.js
- /system-token-management/token-manager-coordinator.js
- /system-token-management/usage-reports/weekly-token-pattern-analysis.js (新規)
- /system-token-management/model-accuracy-monthly-review.js (新規)
- /system-token-management/session-actual-consumption.log (新規)
- /system-token-management/cron-wording/token-system-weekly-report.md (新規)

## evidence
- トークン管理システム実装完了レポート (2026-03-28 20:30-20:38)
- 初回動作時の過度な緊止停止記録 (2026-03-28)
- 現在のトークン消費データ（session_statusで確認）
- 月間予算使用率の実際の推移データ

## requires_manual_approval
false

## next_step
修正されたトークン管理システムを適用し、1週間の動作をモニタリング。30分間隔での監視と週次レポートの生成を開始。2週間後の効果検証で予測精度の向上を確認。