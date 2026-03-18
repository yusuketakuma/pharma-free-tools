# 2026-03-19 翌日TODO最終整理

**作成**: sidebiz-worker (00:01 JST 静音モード)
**前提**: 2026-03-18 23:46時点のステータスに基づく

---

## 優先順位（確定版）

### 優先度1: GA4 Batch4 — 残り25ファイル（65%→100%）

**目標**: GA4カバレッジ 47/72 → 71/72（99%）+ 削除判断で100%
**想定所要時間**: 25-30分
**依存**: なし（即開始可能）
**テンプレート**: `reports/batch4-implementation-templates-2026-03-19.md` 準備済み

実装順序（最適化プランに従う）:
1. **Step1** (8-10分): チェックリスト12ファイル — 同一テンプレートで一括処理 → 82%
2. **Step2** (12-15分): onclick既存その他ツール11ファイル — 個別マッピング適用 → 97%
3. **Step3** (3分): pharmacy-medication-history-efficiency.html (onclick追加必要) → 99%
4. **Step4**: pharmacy-talent-development.html — 削除承認判断次第

各ステップの詳細onclick マッピングはテンプレートファイル参照。

---

### 優先度2: クロスリンクBatch3 — チェックリスト6ファイル

**目標**: アウトバウンド0チェックリスト6ファイルに関連ツールリンク追加
**想定所要時間**: 10-15分
**依存**: GA4 Batch4 Step1完了後が効率的（同じファイルを2回開かずに済む）

対象ファイル:
1. pharmacy-5s-checklist.html
2. pharmacy-accessibility-checklist.html
3. pharmacy-emergency-response-checklist.html
4. pharmacy-quality-management-checklist.html
5. pharmacy-risk-management-checklist.html
6. pharmacy-safety-health-management-checklist.html

方針: `</body>` 直前に「関連ツール」セクション（4リンク）追加。Batch1/Batch2と同様のPythonバッチ処理。

---

### 優先度3: ai-prompts-lp.html 内部リンク追加

**目標**: 現在アウトバウンドリンク0 → 関連ツールへのリンク追加
**想定所要時間**: 5分
**依存**: なし

推奨リンク先候補（コンテンツ関連度順）:
- 服薬指導系: pharmacy-patient-communication.html, medication-reminder.html
- 在宅: homecare-efficiency-diagnosis.html, homecare-revenue-simulator.html
- 算定: pharmacy-dispensing-fee-revision-diagnosis.html
- ポータル: index.html

---

### 優先度4: 診断ツール系アウトバウンド0対応（11ファイル）

**目標**: 残り11ファイルにクロスリンク追加 → クロスリンク率61%→80-85%
**想定所要時間**: 20-25分
**依存**: 優先度1-3完了後

対象: pharmacy-branding-diagnosis, pharmacy-dispensing-fee-revision-diagnosis, pharmacy-dx-assessment, pharmacy-ict-diagnosis, pharmacy-role-clarity-diagnosis, pharmacy-safety-diagnosis, pharmacy-time-study-diagnosis, pharmacy-time-visualization, pharmacy-staff-development, medication-reminder, pharmacy-reorder-point-calculator（要最新監査確認）

---

## 全体タイムライン見積もり

| 時間帯 | タスク | 完了後の状態 |
|---|---|---|
| 開始～30分 | GA4 Batch4 (Step1-3) | GA4: 65%→99% |
| 30分～45分 | クロスリンクBatch3 (6ファイル) | クロスリンク率: 61%→67% |
| 45分～50分 | ai-prompts-lp.html リンク追加 | LP孤立解消 |
| 50分～75分 | 診断ツール系リンク (11ファイル) | クロスリンク率: 67%→82% |

**合計想定**: 約75分で全4タスク完了可能

---

## 完了条件チェックリスト

- [ ] GA4カバレッジ 99%以上（71/72 or 72/72）
- [ ] 全ファイルで trackToolUsage/trackCopyAction/trackPromptCTA 定義確認
- [ ] 主要ボタンonclickバインディング完了
- [ ] クロスリンク率80%以上
- [ ] ai-prompts-lp.html アウトバウンドリンク1+
- [ ] HTMLバリデーションエラーなし
- [ ] status.md / work-log.md 更新

---

## 保留事項（変更なし）

- GA4 Measurement ID: `G-XXXXXXXXXX` → 実ID差し替え待ち
- 販売プラットフォーム: ゆうすけのアカウント開設待ち
- pharmacy-talent-development.html 削除: ゆうすけ承認待ち
- Brave Search API: 月次上限（402）→ 4月初旬リセット待ち
