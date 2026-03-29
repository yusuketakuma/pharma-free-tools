# 自律改善の成果指標レビュー — 2026-03-28 04:30 JST

## 結論
- **継続**が妥当。ただし、今回は前回よりもはっきり **「run が ok でも outcome が進んでいない系」** が見えた。
- **進捗あり**: `openclaw-core / workspace loop`、`pharma-free-tools`、`board agenda seed の生成自体`。
- **停滞あり**: `board meeting chain`、`sidebiz`、`polymarket`、`DeadStockSolution`、`CareViaX Pharmacy`。
- **継続・修正優先**: `CareRoute-RX`。重要だが、見える direct outcome はまだ WIP 棚卸し準備止まり。
- 今回の最大発見は、**board 系は run success ではなく freshness 成功で見るべき**という点。ここを direct KPI に入れないと、前進を過大評価する。

## 成果指標レビュー

### 使えた指標

#### direct
- 最新 run summary / status / duration
  - `autonomy-kpi-outcome-review`: `ok / 290,466ms`
  - `workspace-project-priority-review`: `ok / 47,134ms` ただし **承認待ちで repo 実測なし**
  - `pharma-free-tools-integrity-audit`: `ok / 22,772ms` ただし **承認待ち**。前回成功 run は `ok / 299,617ms`
  - `sidebiz-project-scout`: `ok / 98,482ms`
  - `polymarket-autonomous-bot-research`: `ok / 110,801ms`
  - `board agenda seed`: `ok / 89,124ms`
  - `board claude-code precheck`: `ok / 95,779ms` だが outcome は `stale_input`
  - `board premeeting sync`: `ok / 13,561ms` だが実質は **承認要求**
- docs / backlog / status 更新の有無
- `source_repo` の latest commit / dirty count（既存レジストリと直近レビュー由来）
  - `CareRoute-RX`: latest commit `2026-03-18 15:34:35 +0900` / diff **356**
  - `pharma-free-tools`: latest commit `2026-03-22 17:17:07 +0900` / diff **34**（レジストリ）
  - `DeadStockSolution`: latest commit `2026-03-21 02:15:10 +0900` / diff **225**
- 自動修正件数
  - `pharma-free-tools`: `返戣→返戻` **9 HTML / 94 箇所**
- 次アクションの具体化有無
  - `openclaw-core` backlog は具体
  - `sidebiz / polymarket` は research next step まではあるが、owner / due / success criteria が弱い

#### proxy
- `status.md` / `backlog/queue.md` の freshness
- Top3 や優先テーマの収束度
- `stale_input` の連続発生
- report は出ているが downstream artifact が current slot に揃っているか
- safe auto-fix の有無
- 「同じ論点の反復」か「次工程へ接続した」か

#### missing
- `proposal → 実装 → 定着` conversion の実測
- `owner / due / success criteria` 付与率の定点観測
- `pharma-free-tools` の利用計測（visit / start / completion / CTA）
- `sidebiz` の PoC化率 / 次実験接続率
- `polymarket` の compliance matrix 完成率 / paper trading plan 完成率
- `board chain` の freshness gate 自動停止率 / stale root-cause 別件数
- `CareViaX Pharmacy` の executable backlog と success criteria

### 対象別の見立て

| 対象 | direct | proxy | missing | 判定 |
|---|---|---|---|---|
| openclaw-core / workspace loop | status/backlog 更新、queue triage / bundle sync / verification state model 反映 | 新規発見率、重複抑制、board freshness 問題の顕在化 | conversion / baseline遵守率 | **継続・修正** |
| board meeting chain | seed 生成 run は ok、precheck は連続 `stale_input`、premeeting sync は承認待ち反復 | slot 一致率、generated_at freshness、stale 連続回数 | freshness gate 自動停止率、root cause 別件数 | **修正優先** |
| CareRoute-RX | latest commit 3/18、dirty **356**、WIP-TRIAGE-001 は明示 | FE-DISPLAY / security / unrelated bucket 化の準備 | UI 正常化完了率、回帰防止の実測 | **継続・修正優先** |
| pharma-free-tools | docs更新、9 HTML / 94 箇所修正、dirty **34** | Top3 収束、wireframe proposal、監査結果 | 利用計測、公開後比較 | **継続** |
| sidebiz | scout run は回るが PoC なし | 候補比較の型、悩みの収束、next experiment 文面 | owner / due / success criteria、PoC化率 | **修正** |
| polymarket | 技術調査は進んだ | risk / rewards / market structure の論点カバレッジ | compliance matrix、paper trading、stop rule | **保留/停止候補** |
| DeadStockSolution | latest commit 3/21、dirty **225** | keep / drop / relocate 棚卸しの必要性は明確 | 棚卸し完了率 | **修正** |
| CareViaX Pharmacy | status しかなく backlog 薄い | project slot 維持のみ | executable backlog、success criteria | **保留** |

## 進捗あり
- **openclaw-core / workspace loop**
  - 前回から引き続き `queue triage / bundle sync / verification state model` は維持。
  - さらに今回は **board freshness が別KPIで必要**だと明確になった。
- **pharma-free-tools**
  - `返戣→返戻` の実修正、integrity audit、Top3 収束は前進。
  - docs/backlog/status も更新されており、「何を改善するか」はぶれていない。
- **board agenda seed の生成自体**
  - seed 生成 run は複数 slot で回り、生成・dedupe までは動く。
  - ただし downstream で freshness 崩れが起きるため、ここだけで前進判定しない。

## 停滞あり
- **board meeting chain**
  - `agenda-seed-latest` が `20260327-2220` のまま、`claude-code-precheck` が `20260328-0035 / 0235 / 0435` で連続 `stale_input`。
  - `board-premeeting-sync` は直近3回が承認要求止まりで、latest brief も古い。
  - つまり **run success だが outcome 停止**。
- **sidebiz**
  - 案の顔ぶれは変化しているが、PoC 入口が固定されていない。
  - 研究としては動くが、事業アウトカムにはまだ届いていない。
- **polymarket**
  - 技術面はかなり具体化したが、`compliance matrix / paper trading plan / stop rule` が未形成。
  - 今のまま継続すると、調査の深掘りだけ増えやすい。
- **DeadStockSolution**
  - maintenance-first は妥当だが、`preview` deletion-heavy 差分の棚卸しが未完。
- **CareViaX Pharmacy**
  - 履歴不足ではなく、まだ評価可能な backlog 自体が薄い。

## 追加すべき指標
1. **board chain freshness KPI**
   - `latest 3 artifact 同一 slot 率`
   - `stale_input 連続回数`
   - `stale 検知時に publish せず止めた率`
2. **project 共通の conversion KPI**
   - `proposal → 実装 → 定着`
3. **research 系の成果寄り proxy**
   - `PoC化率`
   - `棄却理由明確化率`
   - `次実験接続率`
4. **repo 系の hygiene KPI**
   - `dirty files の増減`
   - `次 commit 単位まで切れた率`
5. **運用系の gate KPI**
   - `承認待ちで止まった run 比率`
   - `approval なしで完了できる read-only / doc-only 率`

## 実際に修正したこと
安全で可逆な補助修正のみ実施。

1. `docs/project-kpi-registry.md`
   - **`board meeting chain` セクションを追加**
   - direct / proxy / missing / 継続条件 を明文化
2. `projects/openclaw-core/docs/status.md`
   - `run ok でも freshness 崩れで outcome 停止` のリスクを追記
   - board freshness gate を active task に追加
3. `projects/openclaw-core/backlog/queue.md`
   - Ready #12 として **board freshness gate** を追加

破壊的変更・cron 大改修・権限境界変更はしていない。

## 前回との差分
- 前回は `openclaw-core / pharma-free-tools / CareRoute-RX` を進捗ありと見ていた。これは大枠維持。
- 今回の大きい差分は、**board 系の「ok run なのに stale_input で止まる」失敗様式が顕在化**したこと。
- `pharma-free-tools` は前回の「整合修正・既存改善優先」に続き、実修正と監査が積み上がった。
- `sidebiz` は候補列挙のままではなく、問い合わせ返信/口コミ/予約追客へ収束したが、**まだ PoC 接続なし**。
- `polymarket` は前回より技術調査が深くなったが、**停止条件と compliance gate が未整備な点は不変**。
- `workspace-project-priority-review` と `pharma-free-tools-integrity-audit` は、直近 run が **承認待ちで outcome 不足** になっている。ここは前回より悪化。

## 次アクション
1. **最優先**: board chain に freshness gate を入れる
   - `board_cycle_slot_id` 一致
   - `generated_at` 許容範囲
   - stale 時は precheck / premeeting を green にしない
2. `CareRoute-RX`
   - `WIP-TRIAGE-001` を 3 bucket で切り、dirty 356 を次 commit 粒度へ落とす
3. `pharma-free-tools`
   - 1位の `薬歴下書き・要点整理支援` を wireframe → 実装待ちへ固定
   - 利用計測がないので、少なくとも completion proxy を置く
4. `sidebiz`
   - 次回から **1案だけ**選び、`owner / due / success criteria` を必須化
5. `polymarket`
   - compliance matrix と paper trading plan が揃うまで **継続判断を保留**
6. `DeadStockSolution`
   - keep / drop / relocate の棚卸しだけに絞る
7. `CareViaX Pharmacy`
   - executable backlog ができるまで保留扱いを維持
