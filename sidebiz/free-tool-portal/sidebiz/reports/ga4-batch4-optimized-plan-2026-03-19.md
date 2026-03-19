# GA4 Batch4 実装順序最適化プラン — 2026-03-19

**作成**: sidebiz-worker
**目的**: 残り25ファイルへのGA4スクリプト追加（65%→100%）
**想定所要時間**: 約25-30分（Pythonバッチ処理）

---

## 対象ファイル一覧（25件）

| # | ファイル名 | カテゴリ | サイズ | onclick既存 | 優先度 |
|---|---|---|---|---|---|
| 1 | claim-denial-prevention-checklist.html | チェックリスト | 19KB | ✅ | A |
| 2 | dementia-elderly-medication-support-checklist.html | チェックリスト | 23KB | ✅ | A |
| 3 | designated-abuse-prevention-drugs-checklist.html | チェックリスト | 15KB | ✅ | A |
| 4 | dispensing-error-prevention-checklist.html | チェックリスト | 20KB | ✅ | A |
| 5 | medication-adherence-improvement-checklist.html | チェックリスト | 25KB | ✅ | A |
| 6 | pharmacy-5s-checklist.html | チェックリスト | 11KB | ✅ | A |
| 7 | pharmacy-accessibility-checklist.html | チェックリスト | 20KB | ✅ | A |
| 8 | pharmacy-billing-checklist.html | チェックリスト | 19KB | ✅ | A |
| 9 | pharmacy-emergency-response-checklist.html | チェックリスト | 24KB | ✅ | A |
| 10 | pharmacy-quality-management-checklist.html | チェックリスト | 25KB | ✅ | A |
| 11 | pharmacy-risk-management-checklist.html | チェックリスト | 17KB | ✅ | A |
| 12 | pharmacy-safety-health-management-checklist.html | チェックリスト | 16KB | ✅ | A |
| 13 | antibiotic-stewardship.html | 専門ツール | 28KB | ✅ | B |
| 14 | pharmacy-drug-price-revision-2026.html | 専門ツール | 27KB | ✅ | B |
| 15 | pharmacy-dx-assessment.html | 診断ツール | 26KB | ✅ | B |
| 16 | pharmacy-ai-readiness.html | 診断ツール | 28KB | ✅ | B |
| 17 | pharmacy-rejection-template.html | テンプレート | 26KB | ✅ | B |
| 18 | pharmacist-quiz-generator.html | その他ツール | 23KB | ✅ | B |
| 19 | pharmacy-annual-calendar.html | その他ツール | 17KB | ✅ | B |
| 20 | pharmacy-revision-2026.html | その他ツール | 15KB | ✅ | B |
| 21 | ai-medication-history-workflow.html | ワークフロー | 17KB | ✅ | B |
| 22 | severe-patient-ratio-checksheet.html | チェックシート | 14KB | ✅ | B |
| 23 | supply-disruption-patient-impact.html | 分析ツール | 20KB | ✅ | B |
| 24 | pharmacy-medication-history-efficiency.html | 効率化ツール | 19KB | ❌ | C |
| 25 | pharmacy-talent-development.html | 人材育成 | 33KB | ❌ | C* |

*C*: 削除承認待ちのためスキップ推奨

---

## 推奨実装順序

### Step 1: チェックリスト一括処理（12ファイル・優先度A）

**理由**: 同一テンプレート構造のため1つのバッチスクリプトで連続処理可能。onclick既存のためバインディング追加も容易。

**実装方式**: Pythonスクリプト（`</head>` 直前にgtag.js挿入 + onclick既存ボタンにtracking関数追記）

**対象**:
1. claim-denial-prevention-checklist.html
2. dementia-elderly-medication-support-checklist.html
3. designated-abuse-prevention-drugs-checklist.html
4. dispensing-error-prevention-checklist.html
5. medication-adherence-improvement-checklist.html
6. pharmacy-5s-checklist.html
7. pharmacy-accessibility-checklist.html
8. pharmacy-billing-checklist.html
9. pharmacy-emergency-response-checklist.html
10. pharmacy-quality-management-checklist.html
11. pharmacy-risk-management-checklist.html
12. pharmacy-safety-health-management-checklist.html

**想定所要時間**: 8-10分
**完了後GA4カバレッジ**: 47→59/72 = **82%**

### Step 2: onclick既存その他ツール（12ファイル・優先度B）

**理由**: onclick属性が既に存在するためバインディング追加が容易。ただしファイル構造がバラバラなので個別確認が必要。

**サブグループ**:

**2a. 診断ツール系（2ファイル）** — Batch1-3で処理した診断ツールと同構造
- pharmacy-dx-assessment.html
- pharmacy-ai-readiness.html

**2b. 専門ツール・テンプレート（3ファイル）**
- antibiotic-stewardship.html
- pharmacy-drug-price-revision-2026.html
- pharmacy-rejection-template.html

**2c. その他ツール（7ファイル）**
- pharmacist-quiz-generator.html
- pharmacy-annual-calendar.html
- pharmacy-revision-2026.html
- ai-medication-history-workflow.html
- severe-patient-ratio-checksheet.html
- supply-disruption-patient-impact.html

**想定所要時間**: 12-15分
**完了後GA4カバレッジ**: 59→70/72 = **97%**

### Step 3: onclick未存在ファイル（1ファイル・優先度C）

- pharmacy-medication-history-efficiency.html（onclick属性なし→ボタン要素にonclick追加が必要）

**想定所要時間**: 3分
**完了後GA4カバレッジ**: 70→71/72 = **99%**

### Step 4: 保留（1ファイル）

- pharmacy-talent-development.html — **削除承認待ちのためスキップ推奨**
  - 削除が承認された場合: GA4追加不要（72→71ファイルで100%）
  - 削除が却下された場合: GA4追加して72/72 = 100%

---

## バッチスクリプト共通仕様

```
挿入位置: </head> 直前
挿入内容:
- Google Tag Manager (gtag.js) スクリプト
- gtag('config', 'G-XXXXXXXXXX') ← 実ID差し替え待ち
- trackToolUsage(action) 関数
- trackCopyAction() 関数
- trackPromptCTA() 関数
- slug名: ファイル名から自動生成
```

## onclickバインディング方針

- `<button onclick="...">` 既存 → セミコロン追記で `trackToolUsage('action')` 追加
- コピーボタン → `trackCopyAction()` 追加
- CTA/外部リンク → `trackPromptCTA()` 追加
- onclick未存在の `<button>` → onclick属性を新規追加

---

## 完了条件

- [ ] 25ファイル全てにGA4スクリプトが存在する（pharmacy-talent-development.html は削除判断次第）
- [ ] 全ファイルで trackToolUsage / trackCopyAction / trackPromptCTA の3関数が定義されている
- [ ] 主要ボタンにonclickバインディングが設定されている
- [ ] HTMLバリデーションエラーなし（引用符の統一確認）
