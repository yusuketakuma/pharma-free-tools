# Sidebiz KPI Tracker
最終更新: 2026-03-19 17:40

## 実測サマリー
| 指標 | 実測値 | 備考 |
|------|--------|------|
| ツール総数 | 73 | ルート直下HTML実測 |
| CTA設置 | 72 | `scripts/verify-portal-integrity.sh` 実測（index除く全HTML） |
| OGP設定 | 73 | ルート直下HTML実測 |
| GA4プレースホルダー残存 | 72 | 実ID判明後に一括置換 |
| sitemap URL数 | 87 | index 1 + ツール86 |

> 運用ルール: 手動記入値ではなく `scripts/verify-portal-integrity.sh` の実測値を正とする。

## 無料ツール一覧（52ツール・旧台帳）

### ポータル内ツール（GitHub Pages公開）
| # | ツール名 | URL | ステータス | CTA |
|---|----------|-----|------------|-----|
| 1 | ポータルindex | index.html | ✅公開 | - |
| 2 | AIプロンプトLP | ai-prompts-lp.html | ✅公開 | 有料製品 |
| 3 | 抗菌薬適正使用 | antibiotic-stewardship.html | ✅公開 | 未 |
| 4 | 降圧薬選択 | antihypertensive-selector.html | ✅公開 | 未 |
| 5 | DOAC用量 | doac-dosing.html | ✅公開 | 未 |
| 6 | 薬剤性ADE | drug-induced-ade-checklist.html | ✅公開 | 未 |
| 7 | ポリファーマシー | polypharmacy-assessment.html | ✅公開 | 未 |
| 8 | 腎機能別用量 | renal-drug-dosing.html | ✅公開 | 未 |
| 9 | 継続勉強クイズ | pharmacist-quiz-generator.html | ✅公開 | 有料製品 |
| 10 | キャリア診断 | pharmacist-career-diagnosis.html | ✅公開 | 有料製品 |
| 11 | ブランディング診断 | pharmacy-branding-diagnosis.html | ✅公開 | 有料製品 |
| 12 | AI活用診断 | pharmacy-ai-readiness.html | ✅公開 | 有料製品 |
| 13 | ボトルネック診断 | pharmacy-bottleneck-diagnosis.html | ✅公開 | 有料製品 |
| 14 | 在庫管理診断 | pharmacy-inventory-diagnosis.html | ✅公開 | 有料製品 |
| 15 | 2026改定対応診断 | pharmacy-revision-2026.html | ✅公開 | 有料製品 |
| 16 | 優先順位スコアリング診断 | pharmacy-priority-scoring.html | ✅公開 | 有料製品 |
| 17 | RICE優先順位スコアリング診断 | pharmacy-rice-scoring.html | ✅公開 | 有料製品 |
| 18 | 薬局患者対応診断 | pharmacy-patient-communication.html | ✅公開 | 有料製品 |
| 19 | 薬局医療安全診断 | pharmacy-safety-diagnosis.html | ✅公開 | 有料製品 |
| 20 | 服薬フォロー効率化診断 | pharmacy-followup-efficiency.html | ✅公開 | 有料製品 |
| 21 | 薬局収益改善診断 | pharmacy-revenue-improvement.html | ✅公開 | 有料製品 |
| 22 | 薬局スタッフ育成診断 | pharmacy-talent-development.html | ✅公開 | 有料製品 |
| 23 | 2026薬価改定対応チェックリスト | pharmacy-drug-price-revision-2026.html | ✅公開 | 有料製品 |
| 24 | 薬局キャッシュフロー診断 | pharmacy-cashflow-diagnosis.html | ✅公開 | 有料製品 |
| 25 | AI薬歴支援ワークフローチェックリスト | ai-medication-history-workflow.html | ✅公開 | 有料製品 |
| 26 | 返戣理由テンプレート・再請求チェックリスト | pharma-rejection-template/ | ✅公開 NEW | 有料製品 |

### 個別ツール（free-tool-*ディレクトリ）
| # | ツール名 | ディレクトリ | ステータス |
|---|----------|-------------|------------|
| 9 | アドヒアランスチェック | free-tool-adherence-check | ✅ |
| 10 | 持参薬確認 | free-tool-bringing-medicine | ✅ |
| 11 | DI検索 | free-tool-di-query | ✅ |
| 12 | 薬物相互作用 | free-tool-drug-interaction | ✅ |
| 13 | 薬価計算 | free-tool-drug-price | ✅ |
| 14 | 調剤報酬計算 | free-tool-fee-calculator | ✅ |
| 15 | 在宅記録 | free-tool-homecare-record | ✅ |
| 16 | 在宅報告書 | free-tool-homecare-report | ✅ |
| 17 | 在宅スケジュール | free-tool-homecare-scheduler | ✅ |
| 18 | 問い合わせメール | free-tool-inquiry-email | ✅ |
| 19 | 在庫アラート | free-tool-inventory-alert | ✅ |
| 20 | 服薬カレンダー | free-tool-medication-calendar | ✅ |
| 21 | 服薬指導シナリオ | free-tool-medication-guidance-scenario | ✅ |
| 22 | 服薬指導 | free-tool-medication-guidance | ✅ |
| 23 | 薬歴作成 | free-tool-medication-history | ✅ |
| 24 | 服薬リマインダー | free-tool-medication-reminder | ✅ |
| 25 | 服薬サマリー | free-tool-medication-summary | ✅ |
| 26 | 患者説明 | free-tool-patient-explanation | ✅ |
| 27 | 薬剤師効率診断v2 | free-tool-pharmacist-efficiency-diagnosis-v2 | ✅ |
| 28 | 薬剤師効率診断 | free-tool-pharmacist-efficiency-diagnosis | ✅ |
| 29 | ポリファーマシー（個別） | free-tool-polypharmacy | ✅ |
| 30 | 処方監査 | free-tool-prescription-audit | ✅ |
| 31 | 処方チェックリスト | free-tool-prescription-checklist | ✅ |
| 32 | 処方スクリーニング | free-tool-prescription-screening | ✅ |
| 33 | 腎機能用量（個別） | free-tool-renal-dose | ✅ |
| 34 | 副作用チェッカー | free-tool-side-effect-checker | ✅ |
| 35 | 類似薬チェック | free-tool-similar-drug-check | ✅ |

## 有料製品

| 製品名 | 価格 | プラットフォーム | ステータス |
|--------|------|------------------|------------|
| 薬剤師向けAIプロンプト集 | ¥1,500 | Payhip（予定） | ⏳アカウント待ち |
| チェックリスト販売バンドル | ¥980 | Gumroad（予定） | ⏳アカウント待ち |

## 収益化チャネル（ユーザー依存）

| チャネル | 用途 | ステータス |
|----------|------|------------|
| Gumroad | デジタル商品販売 | ⏳アカウント作成待ち |
| Note | 記事+有料note | ⏳アカウント作成待ち |
| Coconala | コンサル販売 | ⏳アカウント作成待ち |
| MENTA | メンタリング | ⏳アカウント作成待ち |
| TimeTicket | コンサル予約 | ⏳アカウント作成待ち |
| Payhip | 海外販売 | ⏳アカウント作成待ち |

## KPI目標

| 指標 | 現在 | 1ヶ月目標 | 3ヶ月目標 |
|------|------|-----------|-----------|
| 無料ツール数 | 51 | 51 | 60 |
| ポータルPV/月 | - | 5,000 | 20,000 |
| 有料製品売上 | ¥0 | ¥10,000 | ¥100,000 |
| メールリスト | 0 | 50 | 200 |

## 本日実施タスク（2026-03-11）

### 22:05
1. 52ツール目「返戣理由テンプレート・再請求チェックリスト」開発
2. 返戣理由別回答テンプレート8パターン実装
3. 再請求対応チェックリスト15項目実装（進捗保存機能付き）
4. ポータル更新（59→60選表記）
5. KPIトラッカー更新（51→52ツール）

### 21:10
1. 51ツール目「AI薬歴支援ワークフローチェックリスト」開発
2. AIに投げる工程/投げない工程の20項目チェックリスト実装
3. プロンプト例・注意事項・進捗保存（localStorage）を追加
4. ポータル更新（58→59選表記、JSON-LD 60件目追加）
5. link-checker.sh をポータル相対参照に修正

### 18:37
1. 重複候補確認: 返戻リスク診断は既存ツールと重複のため新規リリース見送り
2. 50ツール目「薬局キャッシュフロー診断」開発
3. 新規診断ツール（入金管理・在庫圧迫・固定費管理・請求回収・見える化の5領域20問）
4. ポータル更新（57→58選表記、JSON-LD 59件目追加）
5. GitHub Pages反映準備・link-checker.sh 再実行予定

## 本日実施タスク（2026-03-10）

### 23:37
1. 49ツール目「2026薬価改定対応チェックリスト」開発
2. 新規チェックリスト（4領域20項目：在庫管理・患者説明・システム対応・経営戦略）
3. 薬価改定準備レベル可視化・改善ポイント特定
4. ポータル更新・JSON-LD更新・GitHub Pages反映
5. GitHub push完了（commit: 5e1ba00）

### 23:05
1. 48ツール目「薬局スタッフ育成診断」開発
2. 新規診断ツール（OJT体制・研修制度・スキル評価・キャリアパス・組織文化の5領域20問）
3. 人材育成レベル可視化・改善ポイント特定
4. ポータル更新（47→48ツール）
5. GitHub Pagesデプロイ完了

### 22:05
1. 2リポジトリのコンフリクト解決
   - pharma-drug-price-tool: rebase成功→プッシュ完了
   - pharma-efficiency-diagnosis: コンフリクト解決→プッシュ完了
2. CTAリンク統一（AIプロンプトLPへの正しいURL反映）
3. 収益化導線確保完了

### 19:37
1. 46ツール目「服薬フォロー効率化診断」開発
2. 新規診断ツール（電話フォロー工数可視化・効率化ポイント特定）
3. 5領域20問診断（フォロー体制・コミュニケーション・業務プロセス・DX推進・成果測定）
4. ポータル更新（45→46ツール）
5. GitHub Pagesデプロイ完了

### 19:02
1. ポータルリンク404修正（保守担当検出分）
2. 腎機能別用量調整計算URL修正（pharma-renal-dose/ → pharma-renal-dose-tool/）
3. 服薬リマインダー生成リンク非表示化（ファイル未作成のため一時非表示）
4. JSON-LD構造化データURL修正
5. GitHub Pagesデプロイ完了

### 17:53
1. 45ツール目「薬局医療安全診断」開発
2. 新カテゴリ「医療安全・リスクマネジメント系」追加
3. 5領域20問診断（調剤エラー防止・副作用モニタリング・相互作用チェック・ヒヤリハット分析・インシデント報告）
4. ポータル更新（44→45ツール）
5. GitHub Pagesデプロイ完了

### 15:03
1. 41ツール目「2026改定対応・実績計算診断」開発
2. 新カテゴリ「薬局経営・改定対応系」追加
3. 5領域20問診断（地域連携・在宅医療・供給体制・患者対応・DX推進）
4. ポータル更新（40→41ツール）
5. GitHub Pagesデプロイ完了

### 14:35
1. 40ツール目「薬局在庫管理診断」開発
2. 新カテゴリ「在庫管理・運営効率系」追加
3. 5領域20問診断（発注管理・在庫回転・期限管理・欠品対策・コスト管理）
4. ポータル更新（39→40ツール）
5. GitHub Pagesデプロイ完了

### 13:01
1. 38ツール目「薬局AI活用診断」開発
2. DX基盤・AI導入・組織文化・今後の計画の4領域20問診断
3. ポータル更新（37→38ツール）
4. GitHub Pagesデプロイ完了

### 12:35
1. 37ツール目「薬局ブランディング診断」開発
2. 新カテゴリ「マーケティング・ブランディング系」追加
3. ポータル更新（36→37ツール）
4. GitHub Pagesデプロイ完了

### 12:05
1. LinkedIn投稿ドラフト作成（4案・新チャネル開拓）
2. ストーリーテリング型・数値訴求型・在宅特化型・DX訴求型の4パターン用意
3. ハッシュタグ・投稿タイミング推奨も記載

### 11:40
1. ニュースレター原稿 vol.1 作成（36ツール紹介）
2. 無料ツール→継続接触→有料導線の文面整備
3. KPI案・CTA案・セグメント別差し替え文を整理

### 11:35
1. X告知スレッドドラフト作成（35ツール達成告知）
2. 薬剤師キャリア診断開発（36ツール目・新カテゴリ）
3. ポータル更新（35→36ツール）
4. GitHub Pagesデプロイ完了

### 10:32
1. CTAリンク追加（antihypertensive-selector.html, polypharmacy-assessment.html）
2. 収益化リンク未設置ツール→0件達成
3. GitHub Pagesデプロイ完了

### 10:02
1. KPIトラッカー新規作成
2. 薬剤師継続勉強クイズジェネレーター開発（32ツール目）
3. ポータル更新（31→32ツール）
4. GitHub Pagesデプロイ完了

## 次回アクション候補

1. 50ツール目の新規開発（需要調査→選定）
2. AIブログ記事転換フロー構築（無料ツール→ブログ記事→SEO流入）
3. ニュースレター登録LP文案作成
4. n8n自動収益システム調査（月5万円事例の再現性評価）
5. アカウント作成（ユーザー依存）
6. 薬価改定チェックリストのCTA文面最適化
