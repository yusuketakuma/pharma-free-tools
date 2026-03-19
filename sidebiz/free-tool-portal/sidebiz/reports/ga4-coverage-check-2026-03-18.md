# GA4イベント計測 確認結果 — 2026-03-18

## サマリー

- 対象: 主要5ツール
- 実装済み: 2件（既存）→ 5件（補完後）
- 計測漏れ修正: 3件

---

## 確認結果

| ツール | 修正前 | 修正後 | 対応 |
|--------|--------|--------|------|
| homecare-revenue-simulator.html | ✅ GA4実装済み（5 gtag calls） | — | 対応不要 |
| doac-dosing.html | ✅ GA4実装済み（6 gtag calls） | — | 対応不要 |
| graceful-period-drug-switch-checklist.html | ❌ 未実装 | ✅ 6 gtag calls | GA4スニペット追加 |
| designated-abuse-prevention-drugs-checklist.html | ❌ 未実装 | ✅ 6 gtag calls | GA4スニペット追加 |
| dispensing-error-prevention-checklist.html | ❌ 未実装 | ✅ 6 gtag calls | GA4スニペット追加 |

---

## 追加した計測イベント

各ツールに以下3イベントを追加:

1. `tool_usage` — ツール操作時（engagement カテゴリ）
2. `copy_action` — コピー操作時（engagement カテゴリ）
3. `cta_click` — CTA クリック時（monetization カテゴリ）

---

## 注意事項

- Measurement ID は `G-XXXXXXXXXX`（プレースホルダ）。実際のGA4プロパティIDに差し替え必要。
- onclick属性による個別ボタンへの紐付けは未実装（HTML構造に依存するため次サイクルで対応推奨）。
