# 販売ページ SEOメタタグ整備・最終チェック — 2026-03-18

## 1. AIプロンプト集LP（ai-prompts-lp.html）

### SEOメタタグ状況

| 項目 | 修正前 | 修正後 | 状態 |
|------|--------|--------|------|
| title | 【薬剤師専用】AI活用100プロンプト集 \| 業務時間を30%削減 | 変更なし | OK |
| meta description | あり（100文字程度） | 変更なし | OK |
| og:title | あり | 変更なし | OK |
| og:description | あり | 変更なし | OK |
| og:type | product | 変更なし | OK |
| og:url | yusukedev.github.io（旧ドメイン） | yusuketakuma.github.io/pharma-free-tools/ に修正 | 修正済み |
| og:image | yusukedev.github.io（旧ドメイン） | yusuketakuma.github.io/pharma-free-tools/ に修正 | 修正済み |
| og:locale | なし | ja_JP 追加 | 追加済み |
| twitter:card | あり | 変更なし | OK |
| canonical | なし | 追加済み | 追加済み |
| JSON-LD | なし | Product型構造化データ追加 | 追加済み |

### 修正内容
1. **og:url修正**: `yusukedev.github.io` → `yusuketakuma.github.io/pharma-free-tools/ai-prompts-lp.html`（CTAバナーのリンク先と整合性確保）
2. **og:image修正**: 同上ドメイン修正
3. **og:locale追加**: `ja_JP`
4. **canonical追加**: 正規URLを明示
5. **JSON-LD追加**: Product型構造化データ（商品名・価格・在庫状態）

### 残課題
- og:image画像ファイル（ogp-ai-prompts.png）の実体確認が必要。GitHub Pages上に存在するか要確認
- index.htmlのCTAバナーリンク先は `https://yusuketakuma.github.io/promo-ai-prompts-lp/` で、LP自体のcanonicalとは異なるパス。統一推奨

---

## 2. Notionテンプレート説明文 最終校正

### テンプレートA: 服薬指導記録テンプレート（¥1,000）
- 50字版: OK（訴求ポイント明確）
- 200字版: OK（機能一覧・利用条件明示）
- 1,000字版: OK（課題→解決→機能→導入効果の構成が明確）
- 校正結果: 問題なし

### テンプレートB: 薬歴管理シート（¥1,500）
- 50字版: OK
- 200字版: OK（ROI数値訴求あり）
- 1,000字版: OK（ROI試算が具体的で説得力あり）
- 校正結果: 問題なし

### テンプレートC: チーム業務引き継ぎボード（¥500）
- 説明文: 前回確認済み
- 校正結果: 問題なし

---

## 3. OGP画像・構造化データ チェック

| 対象 | OGP画像 | JSON-LD | 備考 |
|------|---------|---------|------|
| ai-prompts-lp.html | 指定あり（要実体確認） | Product型追加済み | og:image URLのファイル存在確認が必要 |
| index.html | 指定あり（ai-prompts-lp.htmlをOGP画像に使用→不適切） | ItemList + SoftwareApplication + FAQPage あり | OGP画像をスクリーンショット等に変更推奨 |

---

## まとめ
- ai-prompts-lp.htmlのSEOメタタグを5項目修正・追加
- Notionテンプレート説明文は3テンプレートとも品質良好、校正不要
- 残課題: OGP画像実体の確認、index.htmlのOGP画像改善
