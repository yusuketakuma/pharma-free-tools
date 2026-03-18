# ゆうすけ アクション優先マトリクス（3/19〜）

**作成日**: 2026年3月19日 00:00 JST
**本日の成果物数**: 22件以上（3/18 全サイクル合計）

---

## 即実行（3/19 朝一番）

| # | アクション | 所要時間 | 参照ファイル |
|---|-----------|----------|-------------|
| 1 | **テリパラチド「サワイ」在庫確認**: 冷蔵庫でロット番号・使用期限・本数をメモ | 5分 | `outputs/teriparatide-3day-action-2026-03-19.md` |
| 2 | **テリパラチド患者別割当て確認**: 処方中患者の一覧化（何本/月） | 5分 | `outputs/teriparatide-action-kit-2026-03.md` → PART 1 |
| 3 | **仕入先電話番号を控える**: 卸・MS担当者名・直通番号を準備 | 5分 | `outputs/teriparatide-action-kit-2026-03.md` → PART 2 |
| 4 | **MCS起動→患者抽出開始**: テリパラチド成分名で検索→CSVエクスポート | 15分 | `outputs/mcs-phase1-preparation-update-2026-03-18.md` |

**即実行の合計**: 約30分

---

## 今週中（3/19〜3/22）

| # | アクション | 推奨日 | 所要時間 | 参照ファイル |
|---|-----------|--------|----------|-------------|
| 5 | **MCS患者抽出（残り5成分）**: アモキサピン・リラグルチド・ガランタミン・メマンチン・トラニラスト | 3/19〜22 | 30分 | `outputs/transition-matcher-final-check-2026-03-18.md` |
| 6 | **照合スクリプト実行**: `prescriptions_export.csv` 配置 → `python transition-drugs-387-matcher.py` 実行 | MCS抽出後 | 10分 | `outputs/transition-matcher-final-check-2026-03-18.md` |
| 7 | **テリパラチド仕入先に電話→メールで返品申請** | 3/20 | 15分 | `outputs/teriparatide-3day-action-2026-03-19.md` |
| 8 | **主治医へFAX送信**（テリパラチド代替薬相談） | 3/21 or 3/23 | 15分 | `outputs/teriparatide-action-kit-2026-03.md` → PART 4 |
| 9 | **在宅薬学総合体制加算1/2 実績確認**: MCSで訪問回数・重症患者割合を確認 | 3/19〜22 | 20分 | `outputs/kazan2-gap-action-plan-2026-03.md` |
| 10 | **重症患者割合2割チェックシート記入**: 自己評価→MCS照合後に確認欄記入 | MCS操作後 | 15分 | `outputs/zaitaku-sogo-taisei-kazan2-self-assessment.md` |
| 11 | **麻薬6品目の備蓄確認**（管理薬剤師として） | 3/19〜22 | 20分 | `outputs/kazan2-gap-action-plan-2026-03.md` |
| 12 | **homecare-revenue-simulator.html 動作確認**: ブラウザで加算2A/B修正後の計算値を確認 | 時間のある時 | 10分 | `outputs/revenue-simulator-verify-checklist-2026-03-18.md` |

**今週中の合計**: 約2時間15分（分散実施可）

---

## 来週（3/24〜）

| # | アクション | 推奨日 | 所要時間 | 参照ファイル |
|---|-----------|--------|----------|-------------|
| 13 | **指定濫用防止医薬品 スタッフ教育資料配布開始** | 3/24（月） | 15分 | `outputs/designated-abuse-prevention-education-schedule-2026-03.md` |
| 14 | **スタッフ向けOJTシート・Q&Aカード配布**: 印刷→配布リスト確認 | 3/24〜25 | 15分 | `outputs/designated-abuse-prevention-ojt-sheet-2026-03.md` |
| 15 | **患者・家族向けQ&Aカード準備**: A5印刷用に出力 | 3/24〜25 | 10分 | `outputs/designated-abuse-prevention-patient-card.md` |
| 16 | **テリパラチド主治医返答確認**: 3/25期限→返答なければ電話フォロー | 3/25 | 10分 | `outputs/teriparatide-action-kit-2026-03.md` |
| 17 | **テリパラチド返品梱包・冷蔵便手配** | 3/26〜27 | 30分 | `outputs/teriparatide-action-kit-2026-03.md` |
| 18 | **朝礼向け説明資料の活用**: 改定3大ポイントをスタッフに説明（約3分） | 朝礼時 | 3分 | `outputs/staff-morning-briefing-reform-2026.md` |

---

## 4月中

| # | アクション | 期限 | 参照ファイル |
|---|-----------|------|-------------|
| 19 | **加算1実績カウント確認**: 年間48回以上・個人宅訪問回数の確定 | 4月中 | `outputs/zaitaku-sogo-taisei-kazan1-jisseki-worksheet.md` |
| 20 | **加算2ルート判定**: A〜Dどのルートで算定するか最終決定 | 4月中 | `outputs/kazan2-route-simulation-2026-03.md` |
| 21 | **指定濫用防止 スタッフ個別OJT実施**: 第2週〜第4週（ロールプレイ・テスト） | 4/7〜4/30 | `outputs/designated-abuse-prevention-ojt-sheet-2026-03.md` |
| 22 | **経過措置医薬品 個別患者対応**: 照合結果に基づきカテゴリA〜D対応 | 4月中 | `outputs/transition-priority-6-cards-2026-03.md` |

---

## カウントダウン（期限一覧）

| 期限 | 内容 | 残日数 |
|------|------|--------|
| **3/28** | テリパラチド「サワイ」返品発送完了 | **9日** |
| **3/31** | 経過措置医薬品 Phase1患者抽出完了 | **12日** |
| **4/30** | 指定濫用防止医薬品 施行日（スタッフ教育完了必須） | **42日** |
| **6月** | 調剤報酬改定 施行（加算1/2新要件適用開始） | 約75日 |

---

## 本日の全成果物一覧（3/18作成分）

| カテゴリ | ファイル名 | 概要 |
|---------|-----------|------|
| **テリパラチド** | `outputs/teriparatide-3day-action-2026-03-19.md` | 3日間アクションプラン |
| | `outputs/teriparatide-action-kit-2026-03.md` | 対応4点セット（在庫確認・返品・患者説明・主治医連絡） |
| | `outputs/teriparatide-reminder-2026-03-18.md` | リマインダー |
| | `outputs/teriparatide-followup-checkpoints-2026-03.md` | フォローアップ準備メモ |
| | `outputs/teriparatide-print-checklist-2026-03-19.md` | 印刷用チェックリスト（A4 1枚） |
| **経過措置** | `outputs/transition-priority-6-cards-2026-03.md` | 優先6成分 個別対応カード |
| | `outputs/transition-matcher-final-check-2026-03-18.md` | 照合スクリプト操作手順 |
| | `outputs/csv-expansion-2026-03-18.md` | CSV 54品目拡充レポート |
| | `outputs/mcs-phase1-preparation-update-2026-03-18.md` | MCS操作前準備確認 |
| **加算・報酬** | `outputs/zaitaku-kaisan-hayami-2026-06.md` | 在宅関連加算 早見表 |
| | `outputs/zaitaku-sogo-taisei-kazan2-self-assessment.md` | 加算2 自己評価チェックシート |
| | `outputs/kazan2-gap-action-plan-2026-03.md` | 加算2 ギャップ分析アクション |
| | `outputs/kazan2-route-simulation-2026-03.md` | 加算2 ルート比較 |
| | `outputs/zaitaku-shidouryou-tsuki2kai-checklist.md` | 月2回算定 要件チェックシート |
| | `outputs/revenue-simulator-fix-2026-03-18.md` | 収益シミュレーター修正レポート |
| | `outputs/revenue-simulator-verify-checklist-2026-03-18.md` | 収益シミュレーター動作確認用 |
| | `outputs/kazan12-self-assessment-gap-review-2026-03-18.md` | セルフアセスメント不足点レビュー |
| **指定濫用防止** | `outputs/designated-abuse-prevention-education-schedule-2026-03.md` | スタッフ教育スケジュール |
| | `outputs/designated-abuse-prevention-ojt-sheet-2026-03.md` | OJT実施シート |
| | `outputs/designated-abuse-prevention-patient-card.md` | 患者・家族向けQ&A |
| **スタッフ向け** | `outputs/staff-morning-briefing-reform-2026.md` | 朝礼向け改定説明資料 |
| | `outputs/patient-explanation-kaizen-2026.md` | 患者向け説明資料 |
| **HTMLツール修正** | `outputs/severe-patient-ratio-fix-patch-2026-03-18.md` | 重症患者割合チェックシート修正案 |
| | `outputs/joint-visit-fix-patch-2026-03-18.md` | 同行訪問チェックリスト修正案 |
| **週次管理** | `outputs/weekly-task-template-2026-03-19.md` | 週次タスクテンプレート |
| | `outputs/2026-03-19-daily-action-summary.md` | 翌朝サマリー |

---

**作成**: 薬剤師エージェント / 2026-03-19 00:00 JST（静音モード）
