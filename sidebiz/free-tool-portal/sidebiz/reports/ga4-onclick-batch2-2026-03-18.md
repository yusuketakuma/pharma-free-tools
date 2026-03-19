# GA4 onclickバインディング Batch2 実装レポート — 2026-03-18 22:30 JST

## 概要

dispatch.md 優先度2: GA4スクリプト追加済み12ファイルへのonclickイベント接続

---

## 実施結果

### バインディング追加サマリー

| # | ファイル名 | onclick追加数 | 主なイベント |
|---|-----------|-------------|------------|
| 1 | `pharmacist-burnout-diagnosis.html` | 1件 | trackPromptCTA（関連ツールセクション内CTA） |
| 2 | `pharmacist-career-diagnosis.html` | 5件 | trackToolUsage(next/reset), trackCopyAction, trackPromptCTA |
| 3 | `pharmacy-5s-diagnosis.html` | 3件 | trackCopyAction(save), trackToolUsage(reset), trackPromptCTA |
| 4 | `pharmacy-ai-readiness.html` | 3件 | trackToolUsage(next/reset), trackPromptCTA |
| 5 | `pharmacy-inventory-diagnosis.html` | 3件 | trackToolUsage(calculate/reset), trackPromptCTA |
| 6 | `pharmacy-dispensing-time-diagnosis.html` | 4件 | trackToolUsage(next/reset×2), trackPromptCTA |
| 7 | `pharmacy-claim-denial-risk-diagnosis.html` | 3件 | trackToolUsage(calculate/reset), trackPromptCTA |
| 8 | `pharmacy-role-clarity-diagnosis.html` | 2件 | trackToolUsage(next), trackPromptCTA |
| 9 | `homecare-efficiency-diagnosis.html` | 3件 | trackToolUsage(calculate/reset), trackPromptCTA |
| 10 | `pharmacy-rice-scoring.html` | 1件 | trackPromptCTA |
| 11 | `pharmacy-followup-efficiency.html` | 3件 | trackToolUsage(calculate), trackPromptCTA ×2 |
| 12 | `polypharmacy-assessment.html` | 3件 | trackToolUsage(calculate/reset), trackPromptCTA |

**合計: 34件のonclickバインディング追加**

---

## イベント分類

| イベント関数 | トリガー | 追加数 |
|------------|---------|-------|
| `trackToolUsage('next')` | 次へボタン（クイズ進行） | 5件 |
| `trackToolUsage('reset')` | リセット・もう一度ボタン | 8件 |
| `trackToolUsage('calculate')` | 計算・診断実行ボタン | 3件 |
| `trackToolUsage('show-results')` | 結果表示ボタン | 0件（JS内呼び出しのみ） |
| `trackCopyAction()` | コピー・保存ボタン | 2件 |
| `trackPromptCTA()` | AIプロンプト集CTAリンク | 11件（全ファイル） |

---

## 注記

- `pharmacist-burnout-diagnosis.html` と `pharmacy-rice-scoring.html` は「準備中」ページのため対話型ボタンなし → 関連ツールセクション内のtrackPromptCTAのみ
- 全ファイルでGA4 Measurement IDは引き続き `G-XXXXXXXXXX` プレースホルダー（実ID差し替え待ち）
- onclick属性内のシングルクォート統一（HTML互換性確保済み）

---

## 次回推奨

- GA4 実Measurement ID差し替え後、各イベントをGA4 DebugViewで動作確認
- `tool_start` イベント追加: ページロード時に診断開始を自動計測（Window onload）
- Batch3: 残り36ファイル（GA4未設置）へのGA4スクリプト追加

