# 自律改善の成果指標レビュー — 2026-03-26 04:30 JST

## 結論
- 全体は **継続**。ただし、実行回数だけでは前進判定できず、**PoC化・実装着手・利用価値** に寄せた指標がまだ弱い。
- 進んでいるのは **openclaw-core / pharma-free-tools / CareRoute-RX**。
- 停滞しているのは **sidebiz / polymarket / CareViaX Pharmacy / DeadStockSolution**。
- 直近の記録 run は `ok / 213,398ms / delivery not delivered`、safe auto-fix は KPI 文面補強 2 件。今回はこの記録を基準に差分更新した。
- 直近の安全な修正は、**レポート保存と KPI 文面の補強** まで。大規模設定変更はしない。

## 成果指標レビュー

| 対象 | direct | proxy | missing | 判定 |
|---|---|---|---|---|
| openclaw-core / workspace loop | docs/backlog/status 更新、queue triage / stale-report / bundle sync の具体化 | 前回提案の実装確認率、safe-close / reopen、dominant-prefix triage | 提案→実装→定着率、baseline/smoke 遵守率 | **継続・修正** |
| CareRoute-RX | source repo `/Users/yusuke/careroute-rx` latest commit 2026-03-18 15:34:35 +0900 / 未コミット差分 356 | FE-DISPLAY / security follow-up / unrelated WIP の切り分け可能 | UI 正常化の完了率、回帰防止の実測 | **継続・修正優先** |
| pharma-free-tools | 既存改善 9 HTML / 94 箇所、最新 commit 2026-03-22、未コミット差分 28 | existing-only refresh、Top3 収束、status/backlog/learn 更新 | visit / start / completion / CTA、改善前後比較 | **継続** |
| sidebiz | 2026-03-25 scout で有望案が具体化 | PoC化率、棄却理由、次実験接続率 | owner / due / success criteria の定着 | **修正** |
| polymarket | 技術的には可能という調査ログあり | compliance matrix、paper trading plan、risk budget | 実運用可否、停止条件、検証完了 | **保留/停止候補** |
| DeadStockSolution | source repo `/Users/yusuke/.openclaw/workspace/DeadStockSolution` latest commit 2026-03-21 02:15:10 +0900 / 未コミット差分 225 | keep / drop / relocate の棚卸し進捗 | 変更完了率、境界維持の実測 | **修正** |
| CareViaX Pharmacy | status だけで backlog が空 | なしに近い | executable backlog、success criteria | **停止/保留候補** |

- source_repo ありの対象は `pharma-free-tools` **28**、`CareRoute-RX` **356**、`DeadStockSolution` **225**。`openclaw-core` / `sidebiz` / `polymarket` / `CareViaX` は source_repo なしまたは未形成。
- duration が明示できたのは本 cron の `213,398ms` のみ。個別ジョブは report はあるが、duration が visible でないものが多い。

## 進捗あり
- **openclaw-core**
  - 03-26 に `docs/status.md` と `backlog/queue.md` が更新され、Queue Triage Analyst / board-backed safe-close-reopen / bundle sync が明確化。
  - 進んでいるのは「観測を増やす」ではなく、「同じ観測を triage に落とす」方向。
- **pharma-free-tools**
  - 03-25 の existing-only refresh で、トップ3が固定され、低リスク修正（返戻表記ゆれ 94 箇所）も先行適用済み。
  - 新規追加より既存改善優先へ寄っているのは良い。
- **CareRoute-RX**
  - 03-25 22:20 の board review で、WIP-TRIAGE-001 を `FE-DISPLAY / security follow-up / unrelated WIP` に落とす方針が採用。
  - ただし、source repo の差分量はまだ大きい。
- **sidebiz**
  - 03-25 の scout で有望案が `予約確認・ノーショー対策 / 問い合わせ・見積追客 / 請求・入金消込` に収束。
  - 以前より「何をやるか」は明確。

## 停滞あり
- **sidebiz**
  - 候補は絞れたが、PoC 入口がまだ owner / due / success criteria 付きで固定されていない。
- **polymarket**
  - 技術調査は進んだが、compliance / paper trading / stop rule が未形成。
  - 収益期待だけで追う段階ではない。
- **DeadStockSolution**
  - maintenance-first の境界は正しいが、preview branch の棚卸しが止まると次に進めない。
- **CareViaX Pharmacy**
  - バックログが空で、現時点では評価材料がない。

## 追加すべき指標
- すべてのジョブに共通
  - `proposal → 実装 → 定着` の conversion
  - `owner / due / success criteria` の付与率
  - 前回提案の実装確認率
- `pharma-free-tools`
  - 出力型改善の公開件数
  - visit / start / completion / CTA
- `sidebiz`
  - PoC化率
  - 棄却理由明確化率
  - 次実験接続率
- `polymarket`
  - compliance checklist 完成率
  - paper trading plan 完成率
  - stop rule の明文化率
- `openclaw-core`
  - safe-close / reopen の実施件数
  - bundle manifest + dry-run 成功率
  - repeated prefix の再掲率
- `DeadStockSolution`
  - keep / drop / relocate の分類完了率

## 実際に修正したこと
- 本レビューを `reports/cron/autonomy-kpi-outcome-review-20260326-0430.md` として保存した。
- 追加の破壊的変更はしていない。

## 前回との差分
- 前回の KPI まとまりは、`pharma-free-tools / sidebiz / polymarket / workspace loop` の baseline 作成が中心だった。
- 今回はそれに加えて、
  - `openclaw-core` が **triage と bundle sync** まで進んだ
  - `pharma-free-tools` が **existing-only refresh と低リスク修正** に入った
  - `CareRoute-RX` が **WIP triage の bucket 化** へ進んだ
  - `sidebiz` が **候補列挙から PoC 入口設計** へ寄った
- 一方で、`polymarket` と `CareViaX` は依然として direct outcome が薄く、判断不能が残る。

## 次アクション
1. `openclaw-core` は `proposal → 実装 → 定着` を追える最小メトリクスを 1 枚で定義する。
2. `CareRoute-RX` は WIP-TRIAGE-001 を 3 bucket で切り終える。
3. `pharma-free-tools` は top1 の「薬歴下書き・要点整理支援」を 1 枚ワイヤーに固定する。
4. `sidebiz` は 1候補1入口で `owner / due / success criteria` を必須化する。
5. `polymarket` は compliance matrix なしで継続判断しない。
6. `DeadStockSolution` は keep / drop / relocate の棚卸しだけに絞る。
7. `CareViaX Pharmacy` は executable backlog を作れるまで保留。
