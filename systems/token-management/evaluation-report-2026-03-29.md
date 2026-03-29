# トークン管理評価レポート - 2026-03-29

## 評価タイミング
- 時刻: 2026-03-29 04:00 JST
- 実行元: cron:07098f5b-845a-4de9-8bd3-e48f050e3139 token-management-evaluation

## スナップショットデータ (2026-03-29T04:00:00+09:00)
- tokensIn: 6,300
- tokensOut: 682
- contextSize: 17,000
- contextLimit: 203,000
- cacheHitRate: 88%
- monthlyUsagePercent: 0%
- fiveHourRemainingPercent: 62%

## 計算結果
- **使用率**: 6,300 ÷ 203,000 = 3.1%
- **5時間枠残量**: 62%
- **月間使用率**: 0%

## モード判定
- energy_saving条件: monthlyUsage >= 80% or 残時間 < 3時間 ❌
- high_efficiency条件: monthlyUsage < 20% and 残時間 > 12時間 ❌
- normal条件: それ以外 ✅

## 状態変更
- 変更前: energy_saving
- 変更後: normal
- **状態変更あり**: system-state.json を更新

## 判定根拠
- トークン使用率が3.1%と非常に低い
- 5時間枠に62%の余裕がある
- 月間使用率0%で非常に余裕のある状態
- energy_savingモードが過剰な制限となっていたためnormalに移行

## 次回予測
- 現在の使用率傾向からしばらくはnormalモードが継続する見込み