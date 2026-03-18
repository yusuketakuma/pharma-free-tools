# HTMLツール群 内部リンク相互接続率レポート

**作成日時**: 2026-03-18 JST
**対象**: workspace/ 直下の全HTMLファイル（71ファイル）

---

## 1. 全体サマリー

| 指標 | 値 |
|------|-----|
| 総HTMLファイル数 | 71 |
| 総可能リンクペア数（有向） | 4970 |
| 実リンク数 | 50 |
| **クロスリンク率** | **1.0%** |
| アウトバウンドリンク0のファイル | 37/71 (52%) |
| インバウンドリンク0のファイル | 56/71 (79%) |

---

## 2. サンプリング20ファイル クロスリンクマトリクス

| # | ファイル | アウトバウンド | インバウンド | リンク先（サンプル内） |
|---|---------|------------|-----------|-------------------|
| 1 | `ai-prompts-lp.html` | 0 | 31 | — |
| 2 | `antibiotic-stewardship.html` | 0 | 1 | — |
| 3 | `antihypertensive-selector.html` | 0 | 2 | — |
| 4 | `dementia-elderly-medication-support-checklist.html` | 0 | 0 | — |
| 5 | `emergency-disaster-response-checklist.html` | 0 | 0 | — |
| 6 | `generic-drug-switch-revenue-checklist.html` | 0 | 0 | — |
| 7 | `graceful-period-drug-switch-checklist.html` | 0 | 0 | — |
| 8 | `graceful-period-patient-followup-checklist.html` | 0 | 0 | — |
| 9 | `homecare-revenue-simulator.html` | 1 | 0 | ai-prompts-lp |
| 10 | `pharmacy-5s-checklist.html` | 0 | 0 | — |
| 11 | `pharmacy-5s-diagnosis.html` | 0 | 0 | — |
| 12 | `pharmacy-annual-calendar.html` | 0 | 0 | — |
| 13 | `pharmacy-automation-roi.html` | 0 | 0 | — |
| 14 | `pharmacy-branding-diagnosis.html` | 1 | 0 | ai-prompts-lp |
| 15 | `pharmacy-claim-denial-diagnosis.html` | 1 | 0 | ai-prompts-lp |
| 16 | `pharmacy-claim-denial-risk-diagnosis.html` | 1 | 0 | ai-prompts-lp |
| 17 | `pharmacy-role-clarity-diagnosis.html` | 3 | 1 | ai-prompts-lp |
| 18 | `pharmacy-time-study-diagnosis.html` | 0 | 0 | — |
| 19 | `renal-drug-dosing.html` | 5 | 0 | ai-prompts-lp, antibiotic-stewardship, antihypertensive-selector |
| 20 | `supply-disruption-patient-impact.html` | 2 | 1 | ai-prompts-lp |

---

## 3. アウトバウンドリンク TOP5

| # | ファイル | リンク数 | リンク先 |
|---|---------|---------|---------|
| 1 | `renal-drug-dosing.html` | 5 | ai-prompts-lp, antibiotic-stewardship, antihypertensive-selector, claim-denial-prevention-c, doac-dosing |
| 2 | `pharmacy-staff-development.html` | 4 | ai-prompts-lp, pharmacy-ai-readiness, pharmacy-bottleneck-diagn, pharmacy-role-clarity-dia |
| 3 | `pharmacy-talent-development.html` | 4 | ai-prompts-lp, pharmacy-ai-readiness, pharmacy-bottleneck-diagn, pharmacy-priority-scoring |
| 4 | `pharmacy-role-clarity-diagnosis.html` | 3 | ai-prompts-lp, pharmacy-bottleneck-diagn, pharmacy-talent-developme |
| 5 | `ai-medication-history-workflow.html` | 2 | ai-prompts-lp, pharmacy-ai-readiness |

---

## 4. 関連度が高いのにリンクがないペア TOP10

| # | ファイル1 | ファイル2 | 関連スコア | カテゴリ |
|---|---------|---------|----------|---------|
| 1 | `ai-medication-history-workflow.html` | `pharmacy-medication-history-efficiency.html` | 7 | medication |
| 2 | `emergency-disaster-response-checklist.html` | `pharmacy-emergency-response-checklist.html` | 7 | checklist |
| 3 | `generic-drug-switch-revenue-checklist.html` | `graceful-period-drug-switch-checklist.html` | 7 | checklist |
| 4 | `graceful-period-drug-switch-checklist.html` | `graceful-period-patient-followup-checklist.html` | 7 | checklist |
| 5 | `pharmacy-claim-denial-diagnosis.html` | `pharmacy-claim-denial-risk-diagnosis.html` | 7 | diagnosis |
| 6 | `ai-medication-history-workflow.html` | `medication-reminder.html` | 5 | medication |
| 7 | `ai-prompts-lp.html` | `pharmacy-ai-readiness.html` | 5 | other |
| 8 | `claim-denial-prevention-checklist.html` | `designated-abuse-prevention-drugs-checklist.html` | 5 | checklist |
| 9 | `claim-denial-prevention-checklist.html` | `dispensing-error-prevention-checklist.html` | 5 | checklist |
| 10 | `dementia-elderly-medication-support-checklist.html` | `medication-adherence-improvement-checklist.html` | 5 | checklist |

---

## 5. 改善優先度付きアクションリスト

### 優先度A（即時対応・SEO効果大）

1. **診断ツール間の相互リンク**: 同カテゴリ診断ツール間で「関連ツール」セクションを追加
   - 対象: pharmacy-*-diagnosis.html 群（約15ファイル）
   - 効果: ユーザー回遊率UP + 内部リンクジュース分配

2. **チェックリスト間の相互リンク**: 関連チェックリスト間でフッターリンク追加
   - 対象: *-checklist.html 群（約15ファイル）
   - 効果: 関連コンテンツ発見率UP

3. **返戻・請求関連ツールのクラスタリング**: 返戻・請求系4ファイルを相互リンク
   - 対象: pharmacy-claim-*.html, pharmacy-rejection-*.html, claim-*.html
   - 効果: トピッククラスタ強化

### 優先度B（中期対応）

4. **「関連ツール」共通コンポーネント作成**: 全ツールのフッターに3-5件の関連ツールリンクを動的表示
   - 実装: カテゴリマッピングJSONを作成し、共通JSで読み込み
   - 効果: 全ファイルのクロスリンク率を一括改善

5. **ai-prompts-lp.html へのCTAリンク統一**: 全ツールにAIプロンプト集CTAを追加（現在31/71ファイルのみ）
   - 効果: 有料コンテンツへの導線強化

### 優先度C（長期施策）

6. **インバウンドリンク0のファイル対策**: 56ファイルが孤立状態 → index.html以外からの参照を確保
7. **サイトマップ連携**: 内部リンク構造をsitemap.xmlの優先度に反映

---

## 6. インバウンドリンク0のファイル一覧（孤立ファイル）

- `dementia-elderly-medication-support-checklist.html`
- `designated-abuse-prevention-drugs-checklist.html`
- `dispensing-error-prevention-checklist.html`
- `drug-induced-ade-checklist.html`
- `e-prescription-migration-checklist.html`
- `emergency-disaster-response-checklist.html`
- `generic-drug-switch-revenue-checklist.html`
- `graceful-period-drug-switch-checklist.html`
- `graceful-period-patient-followup-checklist.html`
- `homecare-efficiency-diagnosis.html`
- `homecare-joint-visit-checklist.html`
- `homecare-revenue-simulator.html`
- `inventory-order-optimization-checklist.html`
- `medication-adherence-improvement-checklist.html`
- `medication-history-time-saving-checklist.html`
- `medication-reminder.html`
- `patient-identification-checklist.html`
- `patient-informed-consent-checklist.html`
- `pharmacist-burnout-diagnosis.html`
- `pharmacist-career-diagnosis.html`
- `pharmacist-quiz-generator.html`
- `pharmacy-5s-checklist.html`
- `pharmacy-5s-diagnosis.html`
- `pharmacy-accessibility-checklist.html`
- `pharmacy-annual-calendar.html`
- `pharmacy-automation-roi.html`
- `pharmacy-branding-diagnosis.html`
- `pharmacy-cashflow-diagnosis.html`
- `pharmacy-claim-denial-diagnosis.html`
- `pharmacy-claim-denial-risk-diagnosis.html`
- `pharmacy-dispensing-fee-revision-diagnosis.html`
- `pharmacy-dispensing-time-diagnosis.html`
- `pharmacy-drug-price-revision-2026.html`
- `pharmacy-dx-assessment.html`
- `pharmacy-dx-roadmap.html`
- `pharmacy-dx-roi-calculator.html`
- `pharmacy-emergency-response-checklist.html`
- `pharmacy-followup-efficiency.html`
- `pharmacy-ict-diagnosis.html`
- `pharmacy-medication-history-efficiency.html`
- `pharmacy-patient-communication.html`
- `pharmacy-quality-management-checklist.html`
- `pharmacy-reorder-point-calculator.html`
- `pharmacy-revenue-improvement.html`
- `pharmacy-revision-2026.html`
- `pharmacy-rice-scoring.html`
- `pharmacy-risk-management-checklist.html`
- `pharmacy-safety-diagnosis.html`
- `pharmacy-safety-health-management-checklist.html`
- `pharmacy-staff-development.html`
- `pharmacy-time-study-diagnosis.html`
- `pharmacy-time-visualization.html`
- `polypharmacy-assessment.html`
- `prescription-reception-checklist.html`
- `renal-drug-dosing.html`
- `severe-patient-ratio-checksheet.html`

---

## 7. 次回レビュー推奨

- 優先度A施策実施後にクロスリンク率を再計測（目標: 5%以上）
- 月次でインバウンドリンク0ファイルの削減状況を確認
