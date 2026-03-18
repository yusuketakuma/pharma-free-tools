# 新規HTMLツール追加チェックリスト

新しい無料ツールをポータルに追加する際の全工程チェックリスト。ヘッダー数値未更新等の漏れを防止するため、全項目を順番に実施すること。

---

## 1. ツール本体の作成

- [ ] HTMLファイルを `workspace/` に作成
- [ ] ファイル名は kebab-case（例: `pharmacy-new-tool.html`）
- [ ] レスポンシブ対応（meta viewport設定済み）
- [ ] オフライン動作対応（外部API依存なし）
- [ ] 個人情報のサーバー送信なし

## 2. SEOメタタグ設定

- [ ] `<title>` タグ設定（ツール名 + 簡潔な説明）
- [ ] `<meta name="description">` 設定（120〜160文字）
- [ ] `<meta name="keywords">` 設定
- [ ] OGPタグ設定:
  - [ ] `og:title`
  - [ ] `og:description`
  - [ ] `og:type` → `website`
  - [ ] `og:url` → `https://yusuketakuma.github.io/pharma-free-tools/{filename}`
  - [ ] `og:image` → 画像パス（TODO: 画像作成後に差し替え）
  - [ ] `og:locale` → `ja_JP`
- [ ] Twitter Cardタグ設定:
  - [ ] `twitter:card` → `summary_large_image`
  - [ ] `twitter:title`
  - [ ] `twitter:description`
- [ ] `<link rel="canonical">` 設定

## 3. GA4イベント計測の埋め込み

- [ ] GA4 gtagスクリプト埋め込み（Measurement ID: `G-XXXXXXXXXX` → TODO: 実ID取得後に差し替え）
- [ ] CTAボタンに `onclick` イベント追加
- [ ] 主要操作ボタンに `onclick` イベント追加（計算、診断、保存、リセット等）
- [ ] イベント命名規則の遵守:
  - カテゴリ: `cta_click` / `tool_use` / `tool_result`
  - アクション: `{tool-name}_{action}`（例: `new_tool_calculate`）
  - ラベル: 日本語の簡潔な説明
- [ ] TODOコメント追加（Measurement ID未設定の場合）: `<!-- TODO: GA4 Measurement ID を実IDに差し替え -->`

## 4. ポータル（index.html）への追加

- [ ] 適切なカテゴリセクションにツールカードを追加
- [ ] カード内容:
  - [ ] ツール名（h3）
  - [ ] バッジ（`新着` / `NEW` / `popular` 等）
  - [ ] 説明文（1〜2行）
  - [ ] 相対リンク `href="{filename}"`
- [ ] 追加後のツールカード総数をカウント（`grep -c 'tool-card' index.html`）

## 5. ヘッダー・数値の一括更新（波及チェック）

以下の全箇所を **新しいツール総数** に更新:

- [ ] `<title>` 内の「ツールN選」
- [ ] `<meta name="description">` 内の「N個の無料Webツール」
- [ ] `og:title` 内の「ツールN選」
- [ ] `og:description` 内の「N個の無料Webツール」
- [ ] `twitter:title` 内の「ツールN選」
- [ ] `twitter:description` 内の「N個の無料Webツール」
- [ ] JSON-LD ItemList `description` 内の「N個」
- [ ] JSON-LD WebApplication `description` 内の「N個」
- [ ] JSON-LD FAQ回答内の「全Nツール」
- [ ] `.subtitle` の「ツールN選」
- [ ] `.stat-number` の数値
- [ ] FAQ表示テキスト内の「全Nツール」
- [ ] `sidebiz/free-tool-portal/index.html`（ポータルコピー）にも同一修正

### 波及チェック用grepコマンド

```bash
# 旧数値を検索（Nを現在の数値に置換）
grep -rn 'N選\|N個\|全Nツール' workspace/index.html workspace/sidebiz/free-tool-portal/index.html
```

## 6. リンクチェック

- [ ] 新規ツールへの相対リンクが正常か確認
- [ ] 既存全リンクの再チェック:
  ```bash
  grep -oP 'href="([^"]+\.html)"' workspace/index.html | sed 's/href="//;s/"//' | grep -v '^http' | while read f; do [ ! -f "workspace/$f" ] && echo "BROKEN: $f"; done
  ```

## 7. カテゴリ別ツール数の確認

- [ ] 各カテゴリセクション内のカード数を目視確認
- [ ] カテゴリヘッダーに数値表記がある場合は更新

## 8. 成果物の配置

- [ ] ツールHTMLを `workspace/` に配置
- [ ] 更新済み `index.html` を確認
- [ ] 作業レポートを `sidebiz/reports/` に保存

## 9. sitemap.xml更新（作成済みの場合）

- [ ] 新規ツールのURLを `<url>` エントリとして追加
- [ ] `<lastmod>` を更新日に設定

## 10. status.md更新

- [ ] 実行結果をstatus.mdに記録
- [ ] 次サイクル推奨タスクを更新

---

## 注意事項

- **波及チェックは必須工程**。ツール追加とヘッダー更新は必ずセットで実施。
- Measurement IDがプレースホルダの場合、必ずTODOコメントを追加。
- ポータルコピー（sidebiz/free-tool-portal/index.html）の同期を忘れないこと。
