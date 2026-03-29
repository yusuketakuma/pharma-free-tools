# Workspace Project Priority Review — 2026-03-25 03:30 JST

## 結論
**今日の優先順位は前回維持。Top3 は `openclaw-core` → `careroute-rx` → `pharma-free-tools`。**

判断軸は以下の4点を 1〜5 で軽く採点した。
- 変更量
- 未整理度
- 業務/収益インパクト
- 次の1手の明確さ

総合すると、
- **openclaw-core** は全体レバレッジ最大で、今の Ready 群がそのまま安全に前進しやすい
- **careroute-rx** は事業インパクト最大級だが、巨大な未コミット差分の棚卸しを先に挟むべき
- **pharma-free-tools** は既存改善優先が整理済みで、低リスクに成果化しやすい

## 優先案件トップ3

### 1) openclaw-core
- **現状**: status / backlog が具体化済み。stale-report detection、fallback notification、evidence-based verification、queue telemetry、pre/post-update checklist が Ready に並んでいる。
- **優先すべき理由**: workspace 全体の自律実行品質・レビュー品質・更新安全性を底上げできる。
- **次の最小アクション**: Ready #1 `stale-report detection for CEO / department jobs` の仕様を 1 枚に固定する。

### 2) careroute-rx
- **現状**: P0 security fixes は完了済み。UI 正常表示改善フェーズだが、source repo に大きな未コミット差分が残る。
- **優先すべき理由**: 事業/運用インパクトが非常に高く、差分肥大化で review / rollback / security 確認コストが跳ねやすい。
- **次の最小アクション**: source repo を `FE-DISPLAY 系 / security follow-up / unrelated WIP` に棚卸しし、次 commit 単位を切り出す。

### 3) pharma-free-tools
- **現状**: 実需リサーチ→既存改善優先の方針が定着。最新更新で既存 HTML の低リスク修正も進んだ。
- **優先すべき理由**: 優先テーマが整理済みで、低リスクで成果を積みやすい。新規より改善が効く状態。
- **次の最小アクション**: 1位候補 `薬歴下書き・要点整理支援` のワイヤーと出力要件（SOAP / 次回確認事項 / 患者説明メモ）を 1 枚に固定する。

## 4観点の軽い採点

| Project | 変更量 | 未整理度 | 業務/収益インパクト | 次の1手の明確さ | 補足 |
|---|---:|---:|---:|---:|---|
| openclaw-core | 4 | 4 | 5 | 5 | source_repo なし。docs / backlog ベースで評価 |
| careroute-rx | 5 | 4 | 5 | 4 | source repo が最大級に dirty |
| pharma-free-tools | 3 | 2 | 4 | 5 | 既存改善優先がかなり整理済み |
| deadstocksolution | 5 | 5 | 3 | 2 | deletion-heavy だが maintenance-first |
| careviax-pharmacy | 1 | 4 | 2 | 1 | project slot はあるが executable backlog が薄い |

## Source repo check

- `careroute-rx` → `/Users/yusuke/careroute-rx`
  - branch: `main`
  - changed: **356 files**（modified/deleted 312, untracked 44）
- `deadstocksolution` → `/Users/yusuke/.openclaw/workspace/DeadStockSolution`
  - branch: `preview`
  - changed: **225 files**（modified/deleted 220, deleted 215, untracked 5）
- `pharma-free-tools` → `/Users/yusuke/pharma-free-tools`
  - branch: `main` (ahead 1)
  - changed: **28 files**（modified/deleted 17, untracked 11）

## Top3 以外の理由

- **deadstocksolution**: 差分量と未整理度は最大級だが、maintenance-first のため今は feature expansion ではなく棚卸しが先。次の安全な1手はあるが、業務インパクトは Top3 より一段低い。
- **careviax-pharmacy**: project slot は整っているが、まだ具体的に深掘る実行候補が薄い。まず requirements capture が必要。

## 実際に修正したこと

### `projects/pharma-free-tools/docs/status.md`
- 返戻表記ゆれの低リスク修正について、**9 件のHTML / 94 箇所** に先行適用したと明記

### `projects/pharma-free-tools/backlog/queue.md`
- 返戻表記ゆれの低リスク修正について、**94 箇所一括修正（9 件のHTMLに先行適用）** と補足

## 前回との差分

### 2026-03-24 からの差分
- **Top3 の顔ぶれは維持**
- `pharma-free-tools` は低リスク修正が進み、改善方針の定着がさらに明確になった
- `careroute-rx` / `deadstocksolution` の source repo は依然として大きく dirty だが、前回からの方針は変えずに維持
- `careviax-pharmacy` は引き続き bootstrap 段階で、今回も順位は上がらなかった

### 2026-03-23 からの差分
- `openclaw-core` の横断レバレッジ優先は継続
- `careroute-rx` は WIP 棚卸しの必要性がより明確
- `pharma-free-tools` は既存改善優先へ完全に寄っており、実行しやすさが上がった
- `deadstocksolution` は大きい差分の割に maintenance-first なので、優先順位は上げすぎない判断を維持

## 次アクション
1. `openclaw-core` の stale-report detection を仕様 1 枚に落とす
2. `careroute-rx` の巨大差分を FE-DISPLAY / security follow-up / unrelated WIP に切る
3. `pharma-free-tools` の 1位候補をワイヤー化して実装待ちにする
