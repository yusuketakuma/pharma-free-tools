# Loop寿命管理 Runbook（草案）

## 目的
入力経路未設定・データ未着・実務ゼロのloopが無駄にリソースを消費し続けるのを防ぐ。

## 判定基準

### 自動間隔引き上げ（要approvalなしで提案）
| 条件 | アクション |
|------|-----------|
| 連続6サイクル（1h）でexecuted=nのまま | nextに「停止推奨」を記載 |
| 連続12サイクル（2h）で実務ゼロ | 本部長に停止提案 |
| 連続24サイクル（4h）で実務ゼロ | 報告に"DEAD_LOOP"タグを付与 |

### 要approvalで変更
| 条件 | アクション |
|------|-----------|
| 6h超で入力経路未設定 | heartbeat every → 168h |
| 6h超でデータ未着（受け皿は整備済み） | heartbeat every → 168h |
| 実務完了（status=done）かつ再開条件なし | heartbeat every → 168h |

### 即時停止
| 条件 | アクション |
|------|-----------|
| agent.yaml不存在・設定破損 | heartbeat停止 |
| エージェントID消失 | heartbeat停止 |

## 適用対象（2026-03-29 09:16時点の判定）

| loop | 空転時間 | 判定 | 推奨 |
|------|----------|------|------|
| mail-clerk | 33h+ | 入力経路未設定 | every → 168h |
| schedule-clerk | 37h+ | データ未着 | every → 168h |
| direct-support | 38h+ | 連絡未着 | every → 168h |
| homecare-support | 31h+ | データ未提示 | every → 168h |
| receipt-clerk | 34h+ | 対象未提示 | every → 168h |
| backlog-clerk | 23h+ | idle | every → 168h |
| docs-clerk | active | 実務継続中 | 維持 |

## 運用ルール
1. 上記判定はops-automatorが10分サイクルで監視
2. 変更はproduct-operations-hq経由で本部長裁定を取得
3. 本部長承認後、該当agentのheartbeat everyを変更
4. 復旧時は手動で元の間隔に戻す
