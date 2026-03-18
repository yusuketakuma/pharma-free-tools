# 整合性チェックレポート — 2026-03-18 18:30 JST

## 概要
index.htmlのツール数表記を実カード数（99件）に統一更新。波及箇所を全てgrepで洗い出し、一括修正。

## 実ツールカード数
- `grep -c 'tool-card'` → **99件**（確定値）

## 修正箇所一覧

### workspace/index.html（本体）
| 行 | 修正前 | 修正後 | 要素 |
|----|--------|--------|------|
| 6 | 89選 / 89個 | 99選 / 99個 | title / meta description |
| 10 | 89選 | 99選 | og:title |
| 11 | 89個 | 99個 | og:description |
| 19 | 89選 | 99選 | twitter:title |
| 20 | 89個 | 99個 | twitter:description |
| 252 | 66個 | 99個 | JSON-LD ItemList description |
| 336 | 66個 | 99個 | JSON-LD WebApplication description |
| 440 | 66ツール | 99ツール | JSON-LD FAQ answer |
| 499 | 72選 | 99選 | subtitle (visible header) |
| 502 | 81 | 99 | stat-number (hero section) |
| 1092 | 67ツール | 99ツール | FAQ visible text |

### workspace/sidebiz/free-tool-portal/index.html（ポータルコピー）
同一修正を適用（89選→99選、89個→99個、66個→99個、72選→99選、67ツール→99ツール、stat-number 81→99）

## リンクチェック結果
- 相対リンク61件: **全件正常**（対応するHTMLファイルが存在）
- 絶対URL9件: GitHub Pages上のURL（ローカルチェック対象外）

## 波及チェック（grep結果）
- sitemap.xml: **存在しない**（今後作成推奨）
- README: **存在しない**
- 他HTMLファイル内のポータルリンク: 個別ツールにはポータルへの参照数値なし → 影響なし
- memory/内の旧数値: ログファイルのため修正不要

## 残課題
- sitemap.xml未作成 → SEO上作成推奨（優先度中）
- JSON-LD ItemListのlistItem数（position 29まで）が実際の99件と乖離 → 全件追加は大作業のため別タスク推奨
