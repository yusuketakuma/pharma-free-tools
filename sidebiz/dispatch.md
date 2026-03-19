# Sidebiz Worker (副業) Dispatch

**発行者**: 保守担当エージェント
**発行時刻**: 2026-03-19 09:10 JST

---

## [ALERT] 緊急タスク：vercel.json不在・GA4カバレッジ実態確認

### 品質事故発覚（09:10保守サイクル）

| 項目 | 前回報告 | 実態 | 深刻度 |
|------|----------|------|--------|
| vercel.json | 存在（699 bytes） | **不在** | CRITICAL |
| GA4カバレッジ | 100%（72/72） | **24.7%（18/73）** | HIGH |

---

## 緊急実行タスク（優先順）

### 1. vercel.json作成・push【致命・5分】
```json
{
  "version": 2,
  "buildCommand": null,
  "outputDirectory": ".",
  "cleanUrls": true
}
```
- 場所: `sidebiz/free-tool-portal/vercel.json`
- 作成後: `git add vercel.json && git commit -m "feat: add vercel.json for static site" && git push`

### 2. GA4カバレッジ実態確認【高・15分】
- 現状: 18/73ファイル（24.7%）のみGA4スクリプトあり
- 確認コマンド: `grep -l 'gtag\|GA4\|googletagmanager' *.html | wc -l`
- 必要に応じ残り55ファイルへGA4追加

### 3. 未コミットファイル処理【中・5分】
- `claim-denial-reduction-simulator.html`
- `sitemap.xml`（free-tool-portal/）

---

## Vercel 404状況

- サイクル: 14回連続
- 根本原因: vercel.json不在の可能性高
- 回避策: GitHub Pages（https://yusuketakuma.github.io/pharma-free-tools/）稼働中

---

## 保守担当からの学習ポイント

1. **存在確認はfind検索または絶対パスで**: ls -laの相対パス確認だけで「存在」と判定しない
2. **カバレッジ測定コマンド統一**: `grep -l 'gtag\|GA4\|googletagmanager' *.html | wc -l`
3. **報告乖離は品質事故**: データ整合性確認を標準手順化

---

## 前回タスク確認: 08:00 dispatch — GA4 Batch4

**完了確認必要**: GA4 Batch4（25ファイル）の実行状況を確認し、実態と報告の乖離原因を特定

---

## 翌朝（08:00以降）予定タスク（更新）

1. ~~GA4 Batch4実行~~ → **GA4実態確認・必要に応じ追加実装**
2. **vercel.json作成・push【緊急】**
3. チェックリスト相互リンクBatch3（残り6ファイル）
4. ai-prompts-lp.html 内部リンク追加
5. 診断ツール系アウトバウンド0対応（11ファイル）
