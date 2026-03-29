# Workspace cleanup review

- 実行時刻: 2026-03-23 02:30 JST
- 方針: 非破壊。自動削除なし。

## 削除候補
- ルート直下の `*.html.tmp` 24件
  - すべて 0 byte / 約2日経過
  - 対応する本体 `.html` は存在
  - 生成途中の残骸である可能性が高い
- `outputs/` 内の 2026-03-19 生成物一式
  - 直近運用で再参照していなければ退避 or 手動整理候補
- `reports/` 直下の 2026-03-06〜03-08 の単発レポート群
  - `reports/cron/` やカテゴリ配下への整理余地あり

## 保留候補
- `AGENTS.md` 内の `BOOTSTRAP.md` 参照
  - テンプレ由来の可能性あり。即修正は不要
- `IDENTITY.md` 内の `avatars/openclaw.png` 参照
  - まだ未設定のテンプレ項目の可能性あり
- `DeadStockSolution/reports/` と `repos/DeadStockSolution-preview-bot/reports/`
  - レビュー・slowpaths・cron の作業証跡。削除判断は保留

## 参照価値あり
- `reports/company/transition-2026-03-22.md`
- `reports/company/*-latest.md`
- `.openclaw/growth/reports/phase4-growth-smoke.md`
- `reports/homecare/2026-0401-revision-impact-analysis.md`
- `reports/sidebiz/` 配下の月次・KPI・提案系

## 実施したこと
- クリーンアップ候補を棚卸し
- 本レビューを `reports/cron/` に保存

## 前回との差分
- 前回レビュー記録を検出できず、今回が比較ベースの初回

## 次アクション
1. `*.html.tmp` 24件を一括手動削除するか判断
2. `outputs/` の 2026-03-19 生成物を「保持」か「archive化」か決める
3. `reports/` 直下の古い単発レポートをカテゴリ配下へ寄せる運用にするか決める
