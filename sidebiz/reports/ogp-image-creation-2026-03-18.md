# OGP画像作成レポート — 2026-03-18 20:30 JST

## 概要

AIプロンプト集LP（`ai-prompts-lp.html`）用のOGP画像 `ogp-ai-prompts.png` を作成。SNSシェア時の機会損失を解消。

---

## 成果物

| 項目 | 内容 |
|------|------|
| ファイル名 | `ogp-ai-prompts.png` |
| 配置先 | `/workspace/ogp-ai-prompts.png` |
| サイズ | 1200×630px（OGP標準） |
| ファイル容量 | 66 KB |
| 生成方法 | Python / Pillow（PIL）|

---

## デザイン仕様

| 要素 | 内容 |
|------|------|
| 背景 | 縦グラデーション（#1B4F8A → #0F9B6E: 医療系ブルー→ティール） |
| カード | ホワイト角丸カード（余白60px・radius 20px） |
| タグバッジ | 「薬剤師専用」紺背景 |
| 副題 | 「薬剤師のための」（ブルー #2B5FA8） |
| 主題 | 「AI活用プロンプト集」（#1B4F8A・56pt） |
| 特徴バッジ | 「100プロンプト収録」「38領域対応」「今日から使えるテンプレート」（緑/オレンジ/青） |
| キャッチ | 「業務効率を3倍にする100選」（下線付き・緑） |
| アイコン | 右側に医療十字マーク円 |
| 下部バー | 対応AIツール・領域・使用感の補足テキスト |

---

## HTMLとの整合性確認

`ai-prompts-lp.html` の `og:image` タグの状態:

```html
<meta property="og:image" content="https://yusukedev.github.io/free-pharmacy-tools/ogp-ai-prompts.png">
```

→ **既に実URLが設定済み**（TODOコメントなし）。HTMLの変更は不要。

**注記**: `twitter:image` タグは未設定だが、Twitter/Xは `og:image` をフォールバックとして使用するため実用上問題なし。必要に応じて追加可能:
```html
<meta name="twitter:image" content="https://yusukedev.github.io/free-pharmacy-tools/ogp-ai-prompts.png">
```

---

## 対応するog:image URL

```
https://yusukedev.github.io/free-pharmacy-tools/ogp-ai-prompts.png
```

GitHub Pages公開時は `/workspace/ogp-ai-prompts.png` がこのURLに対応。

---

## 次アクション

- [ ] GitHub Pagesにpushして `og:image` URLの実際の表示を確認
- [ ] Twitter Card Validatorでプレビュー確認（https://cards-dev.twitter.com/validator）
- [ ] OGP確認ツール（ogp.me 等）でFacebook/LINEプレビュー確認
