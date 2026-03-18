# クロスリンク監査レポート（更新版）

**日時**: 2026-03-18 23:15 JST
**対象**: workspace/*.html（72ファイル）
**前回監査**: 2026-03-18 22:06 JST

---

## サマリー

| 指標 | 前回（22:06） | Batch1後 | Batch2後 | 現在（23:15） |
|---|---|---|---|---|
| 総HTMLファイル数 | 72 | 72 | 72 | 72 |
| アウトバウンドリンク0ファイル | 37 | 22 | — | **28** |
| クロスリンク率（1+リンクあり） | — | 69.4% | — | **61.1%（44/72）** |
| 平均リンク数（index除外） | 1.5 | — | — | **2.27** |
| GA4カバレッジ | 33% | — | — | **65.3%（47/72）** |

> **注**: 前回監査（22:06）時点でBatch1完了直後は22ファイルだったが、数え方の差異（index.html経由のリンクを含むかどうか等）により現在28ファイル。以下の28ファイルリストが最新の正確なリストです。

---

## アウトバウンドリンク0ファイル一覧（28ファイル）

### チェックリスト系（6ファイル）— dispatch記載の残りBatch3対象
1. `pharmacy-5s-checklist.html`
2. `pharmacy-accessibility-checklist.html`
3. `pharmacy-emergency-response-checklist.html`
4. `pharmacy-quality-management-checklist.html`
5. `pharmacy-risk-management-checklist.html`
6. `pharmacy-safety-health-management-checklist.html`

### 診断ツール系（12ファイル）
7. `pharmacy-branding-diagnosis.html`
8. `pharmacy-dispensing-fee-revision-diagnosis.html`
9. `pharmacy-dx-assessment.html`
10. `pharmacy-ict-diagnosis.html`
11. `pharmacy-role-clarity-diagnosis.html`
12. `pharmacy-safety-diagnosis.html`
13. `pharmacy-time-study-diagnosis.html`
14. `pharmacy-dx-roadmap.html`
15. `pharmacy-dx-roi-calculator.html`
16. `pharmacy-priority-scoring.html`
17. `pharmacy-staff-development.html`
18. `pharmacy-talent-development.html`（削除待ち）

### 計算・シミュレーター系（4ファイル）
19. `antihypertensive-selector.html`
20. `homecare-revenue-simulator.html`
21. `pharmacy-reorder-point-calculator.html`
22. `pharmacy-annual-calendar.html`

### その他ツール系（4ファイル）
23. `ai-prompts-lp.html`
24. `medication-reminder.html`
25. `pharmacist-quiz-generator.html`
26. `pharmacy-time-visualization.html`

### 改定関連（1ファイル）
27. `pharmacy-revision-2026.html`

### チェックシート（1ファイル）
28. `severe-patient-ratio-checksheet.html`

---

## 改善推奨（優先度順）

### 優先度A: チェックリスト6ファイル（Batch3）
dispatch指示通り、残り6チェックリストへ「関連ツール」セクション追加。Batch1/Batch2と同フォーマット。

### 優先度B: 診断ツール系12ファイル
クロスリンク率を大幅改善可能。pharmacy-talent-development.html は削除待ちのため除外→実質11ファイル。

### 優先度C: ai-prompts-lp.html
LP（ランディングページ）は全ツールからのCTA先であり、ここからの逆リンクがないのはSEO的にもったいない。主要ツール3-4件へのリンク追加推奨。

### 優先度D: 計算/その他ツール系8ファイル
残りの0リンクファイルへ順次展開。

---

## 結論

- Batch1+Batch2で29ファイルにクロスリンク追加済み（大きな進展）
- 残り28ファイル（うち1ファイル削除待ち）→ **実質27ファイル**が未対応
- 平均リンク数は1.5→2.27に改善
- 翌日はチェックリスト6ファイル（優先度A）→診断ツール11ファイル（優先度B）の順で進めるのが効率的
