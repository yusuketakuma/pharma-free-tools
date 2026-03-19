
---

## 2026-03-18 19:35 JST — 自動実行

### 実施タスク（dispatch 2026-03-18 19:18 JST 3タスク）

**優先度1: pharmacy-talent-development → pharmacy-staff-development 統合**
- pharmacy-staff-development.html に以下を移植:
  - イントロ画面（診断開始前のUIセクション）
  - 領域別スコア進捗バー（CSS + JS）
  - 5領域×2段階の詳細改善提案（categoryRecommendationsオブジェクト）
  - 改善ポイント／強み 分離表示
  - 関連ツール3件グリッド
- ポータル（両index.html）からtalent-development JSON-LD ListItemエントリ削除
- talent-development.htmlファイル本体は保留（ゆうすけ確認後削除）
- 成果物: pharmacy-staff-development.html + reports/talent-staff-dev-merge-2026-03-18.md

**優先度2: sitemap.xml 新規作成（ワークスペースルート）**
- /workspace/sitemap.xml: 86 URL（index 1件 + 85ツール）全件絶対URL
- 両index.htmlのheadにsitemap参照タグ追加
- 成果物: sitemap.xml + reports/sitemap-creation-2026-03-18.md

**優先度3: JSON-LD ItemList 拡充**
- 57件（欠番・talent-development含む） → 85件（全ツールカード・連番）
- numberOfItems: 67 → 85に修正
- 両index.html（本体・ポータルコピー）に適用
- 実ツールカード数: 85件（dispatch記載99件との差: 実態に基づき85件）
- 成果物: index.html更新（両ファイル）+ reports/jsonld-expansion-2026-03-18.md

---

## 2026-03-18 20:30 JST — 自動実行

### 実施タスク（dispatch 2026-03-18 20:03 JST 3タスク）

**優先度1: OGP画像 ogp-ai-prompts.png 作成**
- Python/Pillowで1200×630px PNG画像を生成
- デザイン: 白/青/緑系医療テイスト、角丸白カード、グラデーション背景
- テキスト: 「薬剤師のためのAI活用プロンプト集」「業務効率を3倍にする100選」「100プロンプト収録・38領域対応」
- 配置先: /workspace/ogp-ai-prompts.png（og:image URLと一致）
- HTML確認: ai-prompts-lp.html のog:imageは既に実URL設定済み → HTML変更不要
- 成果物: ogp-ai-prompts.png（66KB）+ reports/ogp-image-creation-2026-03-18.md

**優先度2: pharmacy-talent-development.html 削除準備レポート**
- 全参照箇所の削除確認: index.html（本体）・free-tool-portal/index.html・sitemap.xml 全てからtalent-development除外済みを確認
- pharmacy-staff-development.html のcanonical・og:url正常設定を確認
- 外部リンク考慮事項・リダイレクト代替案をレポートに記載
- ゆうすけ承認後の削除コマンド・git操作例を準備
- 成果物: reports/talent-dev-deletion-ready-2026-03-18.md

**優先度3: GA4計測 次回レビュー準備チェックリスト**
- GA4スクリプト設置状況: 72ファイル中13ファイル（18%）確認
- onclickバインディング: 13ファイル中11ファイルに設置済み確認
- G-XXXXXXXXXXプレースホルダ残存ファイルリスト: 11ファイルを特定
- イベント命名規則（cta_click/tool_usage/copy_action/purchase_click）を文書化
- Measurement ID一括差し替えコマンド・確認ポイント・デプロイ手順を整備
- 成果物: reports/ga4-measurement-ready-checklist-2026-03-18.md

---

## 2026-03-18 20:47 JST

**優先度1: GA4スクリプト一括追加（11ファイル）**
- pharmacy-patient-communication.html に GA4 追加
- pharmacy-safety-diagnosis.html に GA4 追加
- pharmacy-ict-diagnosis.html に GA4 追加
- pharmacy-time-study-diagnosis.html に GA4 追加
- pharmacy-automation-roi.html に GA4 追加
- pharmacy-dx-roadmap.html に GA4 追加
- antihypertensive-selector.html に GA4 追加
- renal-drug-dosing.html に GA4 追加
- pharmacy-cashflow-diagnosis.html に GA4 追加
- pharmacy-bottleneck-diagnosis.html に GA4 追加
- pharmacy-priority-scoring.html に GA4 追加
- pharmacy-revenue-improvement.html / pharmacy-dx-roi-calculator.html → 既設置済みスキップ
- GA4カバレッジ: 13→24ファイル（18%→33%）
- 成果物: reports/ga4-batch-addition-2026-03-18.md

**優先度2: AIプロンプト集 サンプルプロンプト15本作成**
- 服薬指導領域 5本（初回指導・副作用確認・高齢者説明書・多剤併用・アドヒアランス）
- 在宅業務領域 5本（SOAP記録・トレーシングレポート・電話フォロー・算定チェック・緊急時マニュアル）
- 調剤報酬算定領域 5本（薬歴SOAP・後発品変更・疑義照会・特定薬剤加算・調剤過誤防止）
- LP掲載用「こんなプロンプトが入っています」ブロック文言作成
- 成果物: sidebiz/sample-prompts-for-pharmacists-2026-03-18.md

**優先度3: pharmacy-drug-price-revision-2026.html SEO最適化**
- meta description 61文字→89文字に拡充
- og:title / og:description / og:url / og:site_name / Twitter Card 追加
- JSON-LD: Article + FAQPage（5問）追加
- FAQセクション（5問）をページ下部に追加
- h2「よくある質問（FAQ）」追加
- 成果物: reports/drug-price-revision-seo-check-2026-03-18.md + HTML更新
