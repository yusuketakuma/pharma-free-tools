# 新規ツール追加時の品質チェックリスト

**最終更新**: 2026-03-21 05:30 JST
**対象**: pharma-free-tools リポジトリ

---

## 使用方法

新規HTMLツールを追加する際、以下のチェックリストを確認してください。
全項目が✅になるまでリリース不可とします。

---

## 1. 必須項目（全て✅必須）

### 1.1 GA4タグ
- [ ] `<head>`内にGA4タグが含まれている
- [ ] 測定IDが`G-XXXXXXXXXX`（仮ID）または実IDに設定されている
- [ ] `trackToolUsage`関数が定義されている（イベント計測用）

```html
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
  
  function trackToolUsage(action) {
    gtag('event', 'tool_usage', {
      'event_category': 'engagement',
      'event_label': '<tool-name>-' + action
    });
  }
</script>
```

### 1.2 SEO meta description
- [ ] `<meta name="description">`が存在する
- [ ] 文字数が50〜160字の範囲内
- [ ] キーワードが含まれている（薬剤師、薬局、業務効率化等）

**確認コマンド**:
```bash
grep -o '<meta name="description" content="[^"]*"' <file>.html | wc -c
```

### 1.3 title タグ
- [ ] `<title>`が存在する
- [ ] ツール名 + 「- 薬剤師無料ツール集」の形式
- [ ] 文字数が適切（30〜60字推奨）

### 1.4 OGPタグ（SNS共有用）
- [ ] `og:title`が設定されている
- [ ] `og:description`が設定されている
- [ ] `og:image`が設定されている（または共通画像を使用）
- [ ] `og:url`が設定されている
- [ ] `og:type`が設定されている

```html
<meta property="og:title" content="ツール名 - 薬剤師無料ツール集">
<meta property="og:description" content="ツールの説明（50-160字）">
<meta property="og:image" content="https://yusuketakuma.github.io/pharma-free-tools/images/ogp-default.png">
<meta property="og:url" content="https://yusuketakuma.github.io/pharma-free-tools/<tool-name>.html">
<meta property="og:type" content="website">
```

### 1.5 CTAセクション
- [ ] `.cta-section`クラスのセクションが存在する
- [ ] AIプロンプト集へのリンクが含まれている
- [ ] CTAボタンに`.cta-button`クラスが適用されている

```html
<!-- CTA Section -->
<div class="cta-section">
  <h3>薬剤師向けAIプロンプト集（100選）</h3>
  <p>このツールで使えるプロンプト例を100個収録。</p>
  <a href="ai-prompts-lp.html" class="cta-button">詳細を見る →</a>
</div>
```

### 1.6 クロスリンク（関連ツール）
- [ ] `.related-section`クラスのセクションが存在する
- [ ] 2〜4個の関連ツールへのリンクが含まれている
- [ ] 各リンクに簡潔な説明が付いている

```html
<!-- Related Tools -->
<div class="related-section">
  <h3>関連ツール</h3>
  <ul>
    <li><a href="tool-a.html">ツールA</a> - 説明文</li>
    <li><a href="tool-b.html">ツールB</a> - 説明文</li>
  </ul>
</div>
```

### 1.7 index.htmlへの追加
- [ ] `index.html`のツール一覧に追加されている
- [ ] 適切なカテゴリに分類されている
- [ ] リンクが正しく機能する

---

## 2. 推奨項目

### 2.1 meta keywords
- [ ] `<meta name="keywords">`が存在する
- [ ] 3〜5個のキーワードが設定されている

### 2.2 JSON-LD構造化データ
- [ ] `@type: "WebApplication"`のJSON-LDが含まれている
- [ ] name, description, urlが設定されている

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ツール名",
  "description": "ツールの説明",
  "url": "https://yusuketakuma.github.io/pharma-free-tools/<tool-name>.html",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  }
}
</script>
```

### 2.3 レスポンシブデザイン
- [ ] モバイル表示が適切（375px幅で確認）
- [ ] タッチ操作に対応している
- [ ] フォントサイズが読みやすい

### 2.4 アクセシビリティ
- [ ] 適切なコントラスト比（4.5:1以上）
- [ ] フォーカス状態が視覚的に分かる
- [ ] 画像にalt属性が設定されている

---

## 3. 動作確認

### 3.1 ローカル確認
- [ ] ブラウザでHTMLファイルを開いて動作確認
- [ ] JavaScriptエラーがない（コンソール確認）
- [ ] チェックボックス/入力欄が動作する

### 3.2 GitHub Pages確認
- [ ] push後、GitHub Pagesで表示される
- [ ] リンクが正しく遷移する
- [ ] 画像・CSSが正しく読み込まれる

---

## 4. 品質監査スクリプト

以下のコマンドで一括品質チェック可能：

```bash
# SEO description文字数チェック（50字未満または160字超過を検出）
for f in *.html; do
  len=$(grep -o '<meta name="description" content="[^"]*"' "$f" 2>/dev/null | sed 's/<meta name="description" content="//;s/"$//' | wc -c)
  if [ "$len" -lt 50 ] || [ "$len" -gt 160 ]; then
    echo "SHORT/LONG: $f ($len chars)"
  fi
done

# GA4未設定チェック
for f in *.html; do
  if ! grep -q 'G-XXXXXXXXXX\|G-[A-Z0-9]' "$f"; then
    echo "NO_GA4: $f"
  fi
done

# CTA未設定チェック
for f in *.html; do
  if ! grep -q 'cta-section\|cta-banner' "$f"; then
    echo "NO_CTA: $f"
  fi
done

# クロスリンク未設定チェック（index.html除外）
for f in $(ls *.html | grep -v index.html); do
  if ! grep -q 'related-section\|関連ツール' "$f"; then
    echo "NO_RELATED: $f"
  fi
done
```

---

## 5. チェックリスト完了後

- [ ] 本チェックリストのコピーを完了報告に添付
- [ ] commitメッセージに`[quality-check]`プレフィックスを付与
- [ ] 必要に応じて`coding/outputs/`に作業ログを保存

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-03-21 | 初版作成 |
