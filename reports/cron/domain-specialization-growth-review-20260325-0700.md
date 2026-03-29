# Domain Specialization Growth Review — 2026-03-25 07:00 JST

## 結論
- いま強化すべきは「万能のSupervisor」ではなく、**領域ごとの判断パック** を固定すること。
- 直近の再利用価値が高い領域は、**dss-manager / pharma-free-tools / sidebiz / polymarket** の4つ。
- 推奨方針は次の順。
  1. **dss-manager** は「接続済み前提の運用安全化」を標準化する
  2. **pharma-free-tools** は「テーマ選定 + 既存HTMLの低リスク改善」を専任化する
  3. **sidebiz** は「候補列挙」ではなく「PoC接続」を専任化する
  4. **polymarket** は「収益化」ではなく「compliance / paper trading / risk budget」を先に固定する
- 追加エージェントは、すぐ増やすより **境界が明確な領域だけ** に限定して増設するのがよい。

## 特化候補領域

### 1) dss-manager / DDS-agents
**反復している作業**
- register / heartbeat / claim / callback / report の接続確認
- secret / state cleanup
- `blocked / question / pr / report` の分岐確認
- live run の E2E 確認
- `reportUrl` null などの運用上の例外確認

**repo/domain 専用に持つべきもの**
- verification commands
  - `node --check` で runner scripts の構文確認
  - live register / heartbeat / claim の実接続確認
  - launchd tick の稼働確認
- 既知障害
  - `.env.local` に bootstrap token が残る
  - `state.json` に active state が残る
  - `status=idle` なのに stale `active*` が残る
  - `reportUrl` が register response で null になることがある
- 既知修正パターン
  - register 成功時に token を自動除去
  - blocked/completed/failed 後に active state をクリア
  - live 接続後は secret/state を即片付け
- よく使う比較軸
  - 接続済みか / 安全に止まるか / 再実行できるか / E2E が通るか
- 手順テンプレ
  - connect → heartbeat → claim → dispatch → callback/report → cleanup

### 2) pharma-free-tools
**反復している作業**
- 薬局業務の再点検とテーマ抽出
- 既存HTMLの low-risk 改善
- OGP / canonical / sitemap / index の整合確認
- 公開前の品質監査
- 出力型ツールへの寄せ込み

**repo/domain 専用に持つべきもの**
- verification commands
  - `python3 ~/.openclaw/scripts/daily_pharma_tool.py`
  - `python3 ~/.openclaw/scripts/daily_pharma_tool.py --skip-new`
  - `python3 ~/.openclaw/scripts/daily_pharma_tool.py --skip-update`
  - `gh run list --repo yusuketakuma/pharma-free-tools`
  - `find . -maxdepth 1 -name "*.html" -not -name "*.tmp" | wc -l`
  - OGP / meta / canonical の grep 確認
- 既知障害
  - `index / sitemap / 実ファイル数` のズレ
  - generic OGP/Twitter meta の残り
  - 返戻表記ゆれや typo の残存
  - 診断止まりで出力型になっていないページ
- 既知修正パターン
  - まず 1枚ワイヤーで出力要件を固定
  - 診断 → 下書き / 説明文 / 記録文 / ナビへ変換
  - OGP / sitemap / index / canonical を同時点検
- よく使う比較軸
  - 頻度 / 痛み / 代替の弱さ / HTML実装しやすさ / 既存資産流用性
- 手順テンプレ
  - テーマ選定 → 既存資産監査 → 1枚ワイヤー → 実装 → OGP / sitemap / index / link check → 公開

### 3) sidebiz
**反復している作業**
- 市場/現場シグナルの探索
- 候補比較
- 需要の強さと PoC 実行性の切り分け
- owner / due / success criteria の付与
- 旧 KPI と current scout KPI の分離

**repo/domain 専用に持つべきもの**
- verification commands
  - `docs/sidebiz/scout-rubric.md` に沿った採点
  - `reports/cron/sidebiz-project-scout-*.md` の差分比較
- 既知障害
  - 論点を混ぜる（例: missed-call と quote-follow-up の混同）
  - 旧 affiliate / funnel KPI を current scout に流用する
  - next action が owner / due / success criteria なしで止まる
- 既知修正パターン
  - 1アイデア = 1入口で比較
  - 採用/非採用理由を必ず残す
  - まず read-only PoC / 下書き生成 PoC から始める
- よく使う比較軸
  - Japan fit / OpenClaw fit / difficulty / competition density / why now
- 手順テンプレ
  - シグナル収集 → Rubric 評価 → PoC 候補1件に絞る → owner/due/success criteria 記入 → 次回検証へ接続

### 4) polymarket
**反復している作業**
- API / 実装可否の調査
- 規制・地域制限・鍵管理・手数料の確認
- 戦略候補の比較
- paper trading 前提の検証設計

**repo/domain 専用に持つべきもの**
- verification commands
  - 公式 docs / SDK / geoblock / rate limits / fee structure の定点確認
  - compliance matrix と paper trading plan のレビュー
- 既知障害
  - 収益期待だけで前に進めると破綻する
  - 規制/地域制限/キーバックアップ/kill switch が先に詰まる
  - 技術的に可能でも運用してよいとは限らない
- 既知修正パターン
  - まず compliance matrix を作る
  - 次に paper trading plan
  - その後に strategy test
- よく使う比較軸
  - compliance / liquidity / fee / resolution rule / risk budget / kill switch
- 手順テンプレ
  - 調査 → compliance 整理 → paper trading 設計 → 小さく検証 → 継続/停止判断

## 蓄積すべき知識

### dss-manager
- 接続済みかどうかより、**後片付けが自動化されているか** を優先して見る
- `reportUrl` null は未接続と同義ではない
- `blocked / question / pr / report` を JSON-only で分岐する実務を定着させる
- いま必要なのは「新規機能」より **E2E 1件 + cleanup 標準化**

### pharma-free-tools
- 優先テーマは固定済みだが、**公開後の直接成果** はまだ弱い
- 新規追加より既存HTMLの出力型改善が先
- 「診断止まり」を減らすことが最重要
- 低リスク修正は OGP / canonical / typo / sitemap / index の整合から入る

### sidebiz
- 旧 affiliate / funnel KPI は archive 扱い
- current scout は **PoC化率 / 棄却理由 / 次実験接続率** で見る
- 似た痛点でも入口が違えば別候補
- 需要確認だけで終わると、改善が積み上がらない

### polymarket
- 収益性評価より前に **compliance / risk / stop rule** が必要
- 技術調査は十分でも、運用可能性が未形成なら進めない
- まずは paper trading でしか検証しない前提を固定する

## 追加候補エージェント

### 推奨候補
1. **pharma-free-tools-auditor**
   - 役割: 既存HTML監査、OGP/SEO/索引整合、低リスク修正候補抽出
   - 理由: この領域は「調査→監査→低リスク修正」が反復しており、専任化の効果が高い

2. **sidebiz-scout** もしくは **sidebiz-poc-designer**
   - 役割: 候補比較、PoC 接続、owner/due/success criteria 付与
   - 理由: sidebiz は探索と実行設計の差分が大きく、比較専任が有効

3. **polymarket-compliance-analyst**
   - 役割: compliance matrix、paper trading 条件、risk budget、停止条件の整理
   - 理由: この領域は技術より先に制約整理がボトルネックになる

### 条件付き候補
4. **dss-integrations-qa**
   - 役割: DDS runner の live E2E、cleanup、再実行確認
   - 理由: 現状は dss-manager + runner で足りるが、E2E が増えるなら分離価値が出る

## 次アクション
1. `dss-manager` 用に **1枚 runbook** を固定する
   - connect / heartbeat / claim / report / cleanup を1枚に圧縮
2. `pharma-free-tools` 用に **低リスク監査テンプレ** を固定する
   - OGP / sitemap / index / canonical / typo / output型変換をチェック項目化
3. `sidebiz` 用に **scout→PoC テンプレ** を完全定着させる
   - owner / due / success criteria を未記入の候補は却下
4. `polymarket` は **compliance matrix なしで収益性議論しない** ルールを固定する
5. 追加エージェントは、まず **pharma-free-tools-auditor** から始めるのが最も費用対効果が高い
