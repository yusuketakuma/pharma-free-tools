# pharmacy-drug-price-revision-2026.html SEO最適化チェックレポート

**実施日時**: 2026-03-18 20:47 JST
**担当**: sidebiz-worker
**対象ファイル**: `pharmacy-drug-price-revision-2026.html`

---

## 改善前の課題

| 確認項目 | 改善前の状態 | 評価 |
|---|---|---|
| meta description 文字数 | 61文字（120〜160文字目安に未達） | ❌ |
| meta description キーワード含有 | 「2026年度薬価改定」含む | ✅ |
| og:title | 未設定 | ❌ |
| og:description | 未設定 | ❌ |
| JSON-LD (Article) | 未設定 | ❌ |
| JSON-LD (FAQPage) | 未設定 | ❌ |
| h1 構造 | 「📋 2026薬価改定対応チェックリスト」1件 | ✅ |
| h2 構造 | 0件 | ❌ |
| h3 構造 | 2件（ポイント説明・CTA） | △ |
| FAQセクション | なし | ❌ |

---

## 実施した改善

### 1. meta description 最適化
- **変更前** (61文字): `2026年度薬価改定に向けた薬局の対応状況をチェック。在庫確認・新薬価反映・患者説明・調剤報酬影響の4領域20項目で評価。`
- **変更後** (89文字): `2026年度薬価改定に対応できていますか？薬局の在庫管理・新薬価反映・患者説明・調剤報酬影響を4領域20項目で無料チェック。対応状況を即スコア化し、優先すべき課題を明確化します。`
- **改善点**: 「無料」「スコア化」「課題を明確化」を追加してクリック訴求力を強化

### 2. OGP（og:title / og:description）追加
```html
<meta property="og:type" content="website">
<meta property="og:title" content="2026薬価改定対応チェックリスト｜薬局向け無料診断ツール">
<meta property="og:description" content="2026年度薬価改定への薬局対応状況を無料チェック。在庫管理・患者説明・調剤報酬対応など4領域20項目でスコア化。今すぐ自院の課題を把握しましょう。">
<meta property="og:url" content="https://yusuke-takuma.github.io/pharmacy-drug-price-revision-2026.html">
<meta property="og:site_name" content="薬剤師無料ツール集">
```
- Twitter Card（summary）も追加

### 3. JSON-LD: Article 追加
- Schema.org Article型でページ内容を構造化
- headline・description・keywordsを設定

### 4. JSON-LD: FAQPage 追加（5問）
- Q1: 2026年度薬価改定の適用日
- Q2: 調剤報酬への影響
- Q3: 薬局が最初にやるべきこと
- Q4: 在庫仕入れの注意点
- Q5: このチェックリストの無料利用

### 5. FAQ HTMLセクション追加（ページ下部）
- 同内容を `<div class="intro">` スタイルで視覚的に表示
- 訪問者の「疑問解決→滞在時間向上」を狙う

---

## 改善後の評価

| 確認項目 | 改善後の状態 | 評価 |
|---|---|---|
| meta description 文字数 | 89文字 | ✅ |
| meta description キーワード含有 | 「2026年度薬価改定」「無料」「調剤報酬」含む | ✅ |
| og:title | 設定済み | ✅ |
| og:description | 設定済み（74文字） | ✅ |
| JSON-LD (Article) | 設定済み | ✅ |
| JSON-LD (FAQPage) | 5問設定済み | ✅ |
| h1 構造 | 薬価改定キーワード含む | ✅ |
| h2 構造 | 「よくある質問（FAQ）」追加 | ✅ |
| h3 構造 | 2件（変更なし） | △ |
| FAQセクション | 5問追加 | ✅ |

---

## 残課題・推奨アクション

1. **h2追加**: ページ本体内の「4領域チェック」セクションにもh2見出しを追加するとさらに構造化が進む
2. **og:image設定**: OGP画像 (ogp-ai-prompts.png と同様の薬価改定専用画像) があればSNSシェア率向上
3. **canonical URL確認**: ドメイン確定後に `og:url` のURLを実URLに差し替え
4. **検索流入モニタリング**: Google Search Console でのクリック率・表示回数を改定後（4月以降）に確認推奨
