# GA4 CTAボタン onclick紐付けレポート — 2026-03-18

## 概要
対象5ツールのCTAボタンにonclick属性でgtag呼び出しを追加。加えて、プレースホルダMeasurement ID（G-XXXXXXXXXX）を含む全13ファイルにTODOコメントを追加。

## 実施内容

### 1. CTAボタン onclick紐付け

| ファイル | 対象ボタン | 追加イベント |
|---------|-----------|------------|
| homecare-revenue-simulator.html | AIプロンプト集を見る（CTA） | trackCTAClick() |
| homecare-revenue-simulator.html | 収益を計算する（メイン操作） | trackToolUsage('calculate') |
| doac-dosing.html | 使ってみる（関連ツールCTA） | trackPromptCTA() |
| designated-abuse-prevention-drugs-checklist.html | 詳細を見る（CTA） | trackPromptCTA() |
| designated-abuse-prevention-drugs-checklist.html | 診断結果を見る（メイン操作） | trackToolUsage('show-results') |
| graceful-period-drug-switch-checklist.html | 進捗を保存（主要操作） | trackToolUsage('save') |
| dispensing-error-prevention-checklist.html | リセット（操作） | trackToolUsage('reset') |

### イベント命名規則
- `cta_click` / `trackCTAClick()`: 外部CTA（プロンプト集LP等）へのリンク
- `tool_usage` / `trackToolUsage(action)`: ツール内の主要操作（calculate, save, reset等）
- `copy_action` / `trackCopyAction()`: コピー操作

### 2. TODOコメント追加（13ファイル）

全てのプレースホルダMeasurement ID箇所に以下のコメントを追加:
```javascript
/* TODO: Replace G-XXXXXXXXXX with actual Measurement ID */
gtag('config', 'G-XXXXXXXXXX');
```

対象ファイル:
1. designated-abuse-prevention-drugs-checklist.html
2. dispensing-error-prevention-checklist.html
3. doac-dosing.html
4. graceful-period-drug-switch-checklist.html
5. homecare-revenue-simulator.html
6. medication-reminder.html
7. pharmacy-branding-diagnosis.html
8. pharmacy-dispensing-fee-revision-diagnosis.html
9. pharmacy-dx-roi-calculator.html
10. pharmacy-reorder-point-calculator.html
11. pharmacy-revenue-improvement.html
12. pharmacy-staff-development.html
13. pharmacy-time-visualization.html

## 残課題
- 実Measurement IDの取得・差し替え（ゆうすけ対応待ち）
- onclick紐付け後の実データ確認（GA4リアルタイムレポートで確認推奨）
