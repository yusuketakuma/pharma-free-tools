# ツール数表記統一レポート — 2026-03-18 19:40 JST

## 実施内容

index.html（本体・ポータルコピー）内のツール数表記を、実ツールカード数（85件）に統一。

## 変更箇所

### 変更前 → 変更後

| 箇所 | 変更前 | 変更後 |
|------|--------|--------|
| `<title>` | 89選 | 85選 |
| `<meta name="description">` | 89個 | 85個 |
| `<meta property="og:title">` | 89選 | 85選 |
| `<meta property="og:description">` | 89個 | 85個 |
| `<meta name="twitter:title">` | 89選 | 85選 |
| `<meta name="twitter:description">` | 89個 | 85個 |
| JSON-LD description | 66個 | 85個 |
| `.subtitle` | 72選 | 85選 |
| `.stat-number` | 81 | 85 |

## 適用ファイル

1. `/workspace/index.html`（本体）
2. `/workspace/sidebiz/free-tool-portal/index.html`（ポータルコピー）

## 根拠

- 実ツールカード数: 85件（tool-cardクラス要素数）
- status.md（2026-03-18 19:35）のJSON-LD拡充結果と整合

## 波及チェック

- sitemap.xml: 86 URL（index 1件 + ツール85件）→整合確認済み
- JSON-LD ItemList numberOfItems: 85 →整合確認済み

## 次アクション

- pharmacy-talent-development.html削除（ゆうすけ確認後）
- GA4 Measurement ID差し替え（実ID判明次第）
- OGP画像作成（ogp-ai-prompts.png）

---

*作成日時: 2026-03-18 19:40 JST*
