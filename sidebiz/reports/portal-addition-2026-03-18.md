# ポータル未掲載HTML追加掲載レポート — 2026-03-18

## 概要
前回リンクチェックで検出された未掲載21件のHTMLを仕分け・掲載対応した。

## 仕分け結果

### グループA: 絶対URL経由で掲載済み（9件）→ 対応不要
以下はindex.htmlに `https://yusuketakuma.github.io/pharma-free-tools/xxx.html` 形式でツールカードが存在。ローカル相対リンクとしては未掲載だが、実質掲載済み。

| ファイル名 | 判断 | 理由 |
|-----------|------|------|
| antibiotic-stewardship.html | 掲載済み | 絶対URLでツールカード存在 |
| doac-dosing.html | 掲載済み | 絶対URLでツールカード存在 |
| drug-induced-ade-checklist.html | 掲載済み | 絶対URLでツールカード存在 |
| pharmacist-career-diagnosis.html | 掲載済み | 絶対URLでツールカード存在 |
| pharmacist-quiz-generator.html | 掲載済み | 絶対URLでツールカード存在 |
| pharmacy-ai-readiness.html | 掲載済み | 絶対URLでツールカード存在 |
| pharmacy-branding-diagnosis.html | 掲載済み | 絶対URLでツールカード存在 |
| polypharmacy-assessment.html | 掲載済み | 絶対URLでツールカード存在 |
| renal-drug-dosing.html | 掲載済み | 絶対URLでツールカード存在 |

### グループB: 掲載推奨 → 今回追加（10件）

| ファイル名 | カテゴリ | 判断理由 |
|-----------|---------|---------|
| ai-medication-history-workflow.html | 薬歴・記録系 | AI薬歴ワークフローチェックリスト。薬歴効率化の新ツール |
| claim-denial-prevention-checklist.html | 薬局経営・改定対応系 | 返戣予防チェックリスト。返戣理由テンプレートとは異なり予防に特化 |
| designated-abuse-prevention-drugs-checklist.html | 在庫・安全管理系 | 2026年5月施行の法改正対応。時事性高く掲載価値大 |
| graceful-period-patient-priority-triage.html | 薬局経営・改定対応系 | 経過措置患者トリアージ。既存経過措置ツール群の補完 |
| pharmacy-cashflow-diagnosis.html | 薬局経営・改定対応系 | キャッシュフロー診断。経営系ツールの拡充 |
| pharmacy-claim-denial-diagnosis.html | 薬局経営・改定対応系 | レセプト返戻リスク診断（5領域20問形式） |
| pharmacy-claim-denial-risk-diagnosis.html | 薬局経営・改定対応系 | 返戻リスク診断（パターン特定型）。上記とは切り口が異なる |
| pharmacy-role-clarity-diagnosis.html | 人材育成・組織開発系 | 役割分担診断。属人化リスク可視化 |
| pharmacy-time-visualization.html | 薬局経営・改定対応系 | 業務時間可視化。タイムスタディ診断とは異なる可視化アプローチ |

### グループC: 掲載不要（2件）

| ファイル名 | 判断 | 理由 |
|-----------|------|------|
| ai-prompts-lp.html | 非掲載 | LP（ランディングページ）。CTAバナーで既にリンク済み。無料ツールではなく有料商品のLP |
| pharmacy-talent-development.html | 非掲載 | pharmacy-staff-development.html（薬局スタッフ育成診断）と同一コンセプトの重複ファイル。統合を推奨 |

## 実施内容
1. index.htmlに10件のツールカードを追加（適切なカテゴリに配置）
2. 全カードにNEWバッジ付与
3. 追加後リンクチェック実施 → 全相対リンク正常
4. ツールカード総数: 99件（追加前89件 → 99件）

## 残課題
- pharmacy-talent-development.html と pharmacy-staff-development.html の統合検討
- 絶対URL→相対URLへの統一（9件）は任意だが、GitHub Pages公開時の一貫性向上に寄与
- ヘッダーのツール数表記（現在「81」）の更新が必要
