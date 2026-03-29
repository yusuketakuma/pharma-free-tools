# Project KPI Registry Maintenance — 2026-03-27 06:00 JST

## 結論
- 横断レジストリは今回で更新可能な状態にある。
- **pharma-free-tools** は still「指標はあるが弱い」だが、source repo の dirty 状態と 2026-03-27 の docs 更新で、優先テーマの収束は明確。
- **sidebiz** は scout rubric / scout report は整ったが、PoC 以降の実績がなく、まだ **指標不足で判断不能**。
- **polymarket** は 2026-03-26 の調査で実装可能性が一段具体化した一方、compliance matrix / paper trading plan が未作成で **ベースライン未形成**。
- **workspace improvement loop** は、report verification state model と queue triage / bundle sync の実装修正が入り、直接KPIはまだ弱いが前進判定の足場が強くなった。

## 現在の指標状況

### pharma-free-tools
- 使える指標
  - 上位テーマの順位と差分理由
  - source repo latest commit / uncommitted diff / recent file updates
  - docs 更新 freshness
  - 既存 HTML の low-risk fix 件数
- いまの見立て
  - 公開改善の方向性は収束している
  - ただし **利用計測がない** ため、前進の判断が repo activity に寄りやすい

### sidebiz
- 使える指標
  - `docs/sidebiz/scout-rubric.md`
  - `reports/cron/sidebiz-project-scout-20260325-0900.md`
  - 旧 KPI（affiliate / funnel）は archive 扱いに切り替え可能
- いまの見立て
  - 候補比較の型はある
  - しかし PoC / 商談 / 売上への接続がまだなく、比較が成果になっていない

### polymarket
- 使える指標
  - 調査レポートの更新履歴
  - compliance / paper trading / stop rule の論点カバレッジ
- いまの見立て
  - 技術的には BOT を組めるところまで来た
  - でも「作れる」と「運用してよい」は別で、判断軸がまだ欠ける

### workspace improvement loop
- 使える指標
  - backlog Ready の消化件数
  - 前回提案の実装確認率
  - 新規発見率 / 重複率 / safe auto-fix 件数 / owner 付き次アクション率
- いまの見立て
  - 監督系 KPI はかなり揃ってきた
  - ただし実装結果の検証率はまだ弱い

## 指標不足
- pharma-free-tools
  - visit / start / completion / CTA の利用計測がない
  - 改善前後の比較軸がない
- sidebiz
  - 1テーマ集中の固定がない
  - owner / due / success criteria 付きの next action が KPI になっていない
- polymarket
  - compliance matrix がない
  - paper trading plan がない
  - stop rule / risk budget がない
- workspace improvement loop
  - 提案→実装→定着の conversion 定義が弱い
  - report の状態分離と effect confirmation の接続がまだ途上

## 追加すべき指標
- pharma-free-tools
  - 出力型改善の公開件数
  - ワイヤー確定→実装→公開の完了数
  - CTA / 完了イベント到達率
- sidebiz
  - PoC化率
  - 棄却理由の明確さ
  - 次実験接続率
  - owner付き次アクション率
- polymarket
  - PoC化率（調査→検証設計）
  - 棄却理由の明確さ
  - compliance checklist 完成率
  - 次実験接続率
- workspace improvement loop
  - 新規発見率
  - 重複率
  - safe auto-fix件数
  - 前回提案の実装確認率

## 実際に修正したこと
- `docs/project-kpi-registry.md` を 2026-03-27 版へ更新
  - pharma-free-tools の dirty count を 34 files に更新
  - sidebiz / polymarket / workspace loop の根拠スナップショットを最新化
  - 4対象の `direct KPI / proxy KPI / missing KPI / 条件` を現行状態に合わせて整理
- 本レポートを `reports/cron/project-kpi-registry-maintenance-20260327-0600.md` として保存

## レジストリ更新案
- プロダクト系は、引き続き `公開反映・利用・完了` を direct KPI に置く。
- 研究系は、`PoC着手 / 検証完了 / 棄却理由` を direct/proxy の中心に置き、案の数は追わない。
- 監督系は、`前回提案の実装確認率` を direct KPI に寄せ、`新規発見率 / 重複率 / safe auto-fix件数 / owner付き次アクション率` を proxy に置く。
- sidebiz の旧 affiliate / funnel KPI は archive に退避し、current scout とは分離する。
- polymarket は、compliance matrix なしで収益性の議論を続けない。

## 前回との差分
- 前回は 3/24 時点の初版で、4対象の baseline を置くところが中心だった。
- 今回は以下が主な差分。
  - **pharma-free-tools**: source repo の dirty 状態が 20 files → 34 files になり、直近の実ファイル更新例も 3/27 版に更新
  - **sidebiz**: scout rubric が整備され、候補比較の型は明確になったが、PoC 接続はまだ薄い
  - **polymarket**: 2026-03-25 / 2026-03-26 のレポートで技術実装条件は具体化したが、compliance matrix までは未到達
  - **workspace loop**: report verification state model / queue triage / bundle sync の実装が入り、監督系の直近前進が一段具体化した
- 要するに、今回は「分類を置く」段階から、**各対象の proxy を少し現実に寄せた** 更新になった。

## 次アクション
1. pharma-free-tools は、薬歴下書き・要点整理支援の wireframe を実装待ちに固定する。
2. sidebiz は、次回 scout から owner / due / success criteria を必須化して PoC へ寄せる。
3. polymarket は、compliance matrix と paper trading plan を先に作る。
4. workspace improvement loop は、次回レビューで前回提案の実装確認率を必ず記録する。
