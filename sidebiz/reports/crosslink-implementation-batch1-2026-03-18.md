# クロスリンク実装レポート Batch1 — 2026-03-18 22:30 JST

## 概要

dispatch.md 優先度1: 診断ツール群（12ファイル）の相互リンク実装

---

## 実施結果

### 改善前後比較

| 指標 | 改善前 | 改善後 | 差分 |
|------|-------|-------|------|
| アウトバウンドリンク0ファイル | 37/71 (52%) | **22/71 (31%)** | **-15ファイル** |
| 目標（25以下） | — | ✅ 達成（22） | — |

### 処理ファイル一覧（12ファイル）

| # | ファイル名 | 処理内容 | 追加リンク数 |
|---|-----------|---------|------------|
| 1 | `pharmacist-burnout-diagnosis.html` | 関連ツールセクション追加 | 4件 |
| 2 | `pharmacist-career-diagnosis.html` | 関連ツールセクション追加 | 4件 |
| 3 | `pharmacy-5s-diagnosis.html` | 関連ツールセクション追加 | 4件 |
| 4 | `pharmacy-ai-readiness.html` | 関連ツールセクション追加 | 4件 |
| 5 | `pharmacy-inventory-diagnosis.html` | 既存セクションあり（スキップ）— GA4追加のみ | — |
| 6 | `pharmacy-dispensing-time-diagnosis.html` | 関連ツールセクション追加 | 4件 |
| 7 | `pharmacy-claim-denial-risk-diagnosis.html` | 関連ツールセクション追加 | 4件 |
| 8 | `pharmacy-role-clarity-diagnosis.html` | 既存セクションあり（スキップ）— GA4追加のみ | — |
| 9 | `homecare-efficiency-diagnosis.html` | 関連ツールセクション追加 | 4件 |
| 10 | `pharmacy-rice-scoring.html` | 関連ツールセクション追加 | 4件 |
| 11 | `pharmacy-followup-efficiency.html` | 関連ツールセクション追加 | 4件 |
| 12 | `polypharmacy-assessment.html` | 関連ツールセクション追加 | 4件 |

**追加合計: 40件の相互リンク（10ファイル × 4リンク）**

### 関連ツールセクション仕様

- デザイン: インライン CSS（外部CSSなし、将来のリファクタリング向け）
- リンクスタイル: カテゴリ内ツールは青系バッジ、AIプロンプト集CTAは紫グラデーションボタン
- カテゴリ内リンク優先（診断→診断）+ AIプロンプト集CTA
- `trackPromptCTA()` onclick付き

### リンクマッピング

| ファイル | 関連ツール1 | 関連ツール2 | 関連ツール3 |
|---------|-----------|-----------|-----------|
| pharmacist-burnout-diagnosis | pharmacist-career-diagnosis | pharmacy-role-clarity-diagnosis | pharmacy-bottleneck-diagnosis |
| pharmacist-career-diagnosis | pharmacist-burnout-diagnosis | pharmacy-role-clarity-diagnosis | pharmacy-staff-development |
| pharmacy-5s-diagnosis | pharmacy-inventory-diagnosis | pharmacy-safety-diagnosis | pharmacy-bottleneck-diagnosis |
| pharmacy-ai-readiness | pharmacy-bottleneck-diagnosis | pharmacy-ict-diagnosis | pharmacy-dx-assessment |
| pharmacy-dispensing-time-diagnosis | pharmacy-time-study-diagnosis | pharmacy-bottleneck-diagnosis | pharmacy-followup-efficiency |
| pharmacy-claim-denial-risk-diagnosis | pharmacy-claim-denial-diagnosis | claim-denial-prevention-checklist | pharmacy-billing-checklist |
| homecare-efficiency-diagnosis | homecare-revenue-simulator | pharmacy-followup-efficiency | pharmacy-bottleneck-diagnosis |
| pharmacy-rice-scoring | pharmacy-priority-scoring | pharmacy-bottleneck-diagnosis | pharmacy-dx-roadmap |
| pharmacy-followup-efficiency | pharmacy-dispensing-time-diagnosis | homecare-efficiency-diagnosis | pharmacy-medication-history-efficiency |
| polypharmacy-assessment | renal-drug-dosing | doac-dosing | antihypertensive-selector |

---

## 次回推奨アクション

- チェックリスト群（15ファイル）の相互リンク追加（優先度A施策2）
- `ai-prompts-lp.html` 自体への内部リンク追加（アウトバウンド0→改善）
- 関連ツール共通コンポーネント化（優先度B）

