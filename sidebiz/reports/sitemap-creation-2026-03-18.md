# sitemap.xml 新規作成レポート
**作成日時**: 2026-03-18 19:30 JST（自動実行）

---

## 作成ファイル

`/workspace/sitemap.xml`（新規）

---

## 仕様

- フォーマット: XML Sitemap Protocol（sitemaps.org/schemas/sitemap/0.9）
- エントリ数: **86 URL**（index.html 1件 + ツール85件）
- `<lastmod>`: 2026-03-18（本日日付）
- `<priority>`: index.html = 1.0、各ツールページ = 0.8
- `<changefreq>`: index.html = weekly、各ツールページ = monthly
- URL形式: 全件絶対URL（`https://yusuketakuma.github.io/...`）

---

## ポータルへの参照追加

- `index.html`（本体）のhead内に追加:
  ```html
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  ```
- `sidebiz/free-tool-portal/index.html`（コピー）にも同一追加

---

## 注意事項

- 既存の `sidebiz/sitemap.xml`（2026-03-10作成）はそのまま保持
- 本ファイルはワークスペースルート（`/workspace/sitemap.xml`）に新規作成
