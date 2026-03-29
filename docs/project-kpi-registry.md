# Project KPI Registry

最終更新: 2026-03-27 06:00 JST

このレジストリは、各対象について **何をもって前進とみなすか** を揃えるための最小基準。
数値がまだ取れていない対象でも、無理にスコア化せず `ベースライン未形成` を明記する。

---

## 1. pharma-free-tools
- 種別: 公開中プロダクト / source repo あり
- 現在判定: **指標はあるが弱い**
- ベースライン: 形成済み（ただし成果の直接計測は不足）
- 根拠スナップショット:
  - source repo: `/Users/yusuke/pharma-free-tools`
  - latest commit: `2026-03-22T17:17:07+09:00`
  - 未コミット差分: 34 files（modified 23 / untracked 11）
  - 直近の実ファイル更新例: `designated-abuse-prevention-drugs-checklist.html`, `dispensing-error-prevention-checklist.html`, `claim-denial-reduction-simulator.html`, `ai-prompts-lp.html`, `index.html`
  - docs 更新: `status.md` 2026-03-27 / `backlog/queue.md` 2026-03-27 / `learn/improvement-ledger.md` 2026-03-27

### direct KPI
- 上位優先テーマから **出力型改善**（診断止まりではなく、下書き・説明文・記録文・ナビまで届く改善）を公開反映した件数
- 優先1〜3テーマの **ワイヤー確定 → 実装 → 公開** の完了数
- 公開ページでの **主要CTA / 完了イベント** 到達率

### proxy KPI
- 優先テーマの順位と差分理由が `status / backlog / learn` に同期されているか
- source repo の latest commit 時刻、未コミット差分件数、直近実ファイル更新
- 実ファイル監査で見つかった low-risk fix（OGP / typo / canonical / JSON-LD）の適用件数
- 「診断止まり」ページを「そのまま業務で使える出力型」に変換した件数

### missing KPI
- ページ別の利用計測（visit / start / completion / CTA click）
- どの改善が実利用につながったかの比較軸
- 上位テーマごとの公開後レビュー（仮説一致 / 不一致）
- 「改善で足りたのか / 新規作成が必要だったのか」の事後判定率

### 継続条件 / 強化条件 / 停止検討条件
- 継続条件:
  - 優先テーマの差分理由が docs に残り、次の1手が具体化されている
  - source repo の差分量が review 可能な範囲に収まっている
- 強化条件:
  - 主要3テーマのうち2件以上でワイヤーまたは出力要件が固定された
  - イベント計測を入れて、改善前後比較が可能になった
- 停止検討条件:
  - 3サイクル連続で docs 更新だけが進み、公開反映や出力型改善が増えない
  - 類似テーマの重複追加が再発し、差別化理由が説明できない

---

## 2. sidebiz
- 種別: 研究 / 探索 / docs中心
- 現在判定: **指標不足で判断不能**
- ベースライン: **再形成が必要**（scout rubric は整備済みだが、PoC baseline は未完）
- 根拠スナップショット:
  - `docs/sidebiz/scout-rubric.md` 2026-03-25 03:02 JST
  - `reports/cron/sidebiz-project-scout-20260325-0900.md` 2026-03-25 09:03 JST
  - 旧 KPI: `reports/sidebiz/affiliate-kpi-2026-03.md` / `reports/sidebiz/funnel-kpi-2026-03.md`（最終更新 2026-03-10）
  - 直近の実更新は候補比較と rubric 固定まで。PoC 実行・初回売上・初回商談は未確認

### direct KPI
- 選定した1テーマが **PoC着手** まで進んだ件数
- PoC から **初回課金 / 初回商談 / 実運用テスト** まで進んだ件数
- 検証中テーマの **継続可否判断** が owner / due 付きで閉じられた件数

### proxy KPI
- **PoC化率**（候補→PoC）
- **棄却理由の明確さ**（deprioritized 理由が明文化されている割合）
- **次実験接続率**（scout report が次の PoC / interview / LP / automation test に接続している割合）
- docs 更新 freshness、実修正件数、次アクション具体度

### missing KPI
- 現在どの1テーマに集中するかの固定
- owner / due / success criteria 付きの next action
- Scout → PoC → 商談 / 売上までの共通 funnel 定義
- 旧 affiliate/funnel 指標と新 scout 指標の切り分け

### 継続条件 / 強化条件 / 停止検討条件
- 継続条件:
  - 探索対象ごとに採用理由と非採用理由が残る
  - 次アクションが owner / due / success criteria 付きで1件以上ある
- 強化条件:
  - 1テーマを選び、PoC化率と次実験接続率を毎回記録し始める
  - 旧KPI（affiliate/funnel）と新KPI（scout/PoC）を明確に分ける
- 停止検討条件:
  - 2サイクル以上、候補列挙だけで PoC に進まない
  - 棄却理由が残らず、同じ論点を繰り返している

---

## 3. polymarket
- 種別: 研究 / 技術・規制調査
- 現在判定: **指標不足で判断不能**
- ベースライン: **未形成**
- 根拠スナップショット:
  - `reports/polymarket/2026-03-26-1000-autonomous-bot-research.md` 2026-03-26 10:03 JST
  - `reports/polymarket/2026-03-25-1000-autonomous-bot-research.md` 2026-03-25 10:01 JST
  - `reports/polymarket/2026-03-24-1000-api-marketmaking.md` 2026-03-24 10:02 JST
  - `research/polymarket-bot-research.md` 2026-03-23 10:03 JST
  - source repo: なし
  - 現状は BOT 実装の可否調査は進んだが、compliance matrix / paper trading plan / stop rule は未作成

### direct KPI
- **合法・実行可能な paper trading PoC** を定義し、検証開始した件数
- 戦略仮説ごとの **期待値検証完了数**
- 継続候補 / 棄却候補の判断が、規制・市場構造・執行要件込みで閉じた件数

### proxy KPI
- **PoC化率**（調査テーマ→検証設計）
- **棄却理由の明確さ**（なぜ今やらないかが明文化されているか）
- **次実験接続率**（調査ログが次の compliance matrix / paper trade / strategy test に接続しているか）
- API / auth / rate limit / geoblock / fee / resolution rule の論点カバレッジ

### missing KPI
- compliant execution 条件のチェックリスト
- real money 前提ではない段階的検証基準
- 戦略別の kill switch / risk budget / stop rule
- 「技術的に可能」と「運用してよい」の分離基準

### 継続条件 / 強化条件 / 停止検討条件
- 継続条件:
  - 調査ログに次回候補だけでなく、やらない理由も残す
  - paper trading 以前に compliance と risk の前提整理を進める
- 強化条件:
  - compliance matrix と paper trading plan が揃う
  - 少なくとも1戦略で検証設計が具体化する
- 停止検討条件:
  - 規制 / 地域制限 / 鍵管理 / kill switch の前提が固まらない
  - 調査だけが増え、検証設計に進まない

---

## 4. workspace improvement loop
- 種別: 監督 / レビュー / 改善ループ
- 現在判定: **指標は比較的明確だが、直接KPIがまだ弱い**
- ベースライン: 形成済み
- 根拠スナップショット:
  - `projects/openclaw-core/docs/status.md` 2026-03-27 05:31 / `backlog/queue.md` 2026-03-27 05:31 / `learn/improvement-ledger.md` 2026-03-27 03:03
  - 新規実装修正: `report-verification-state-model.md`, `queue-dominant-prefix-triage.md`, `queue-triage-analyst-runbook.md`, `bundle-sync-dry-run-smoke.md`
  - 直近レポート: `reports/cron/workspace-report-learning-review-20260327-0300.md`, `reports/cron/workspace-project-priority-review-20260327-0330.md`
  - 直近の実更新は、状態分離・queue triage・bundle sync の3本柱が具体化

### direct KPI
- backlog の Ready から **安全に実装または明文化まで完了** した件数
- 単一点障害・観測不足・更新事故など、**既知の再発リスクを1つ潰した件数**
- 次回レビューで **前回提案が実装済み** と確認できた割合

### proxy KPI
- **新規発見率**（前回にない有効な知見がどれだけ出たか）
- **重複率**（同じ指摘だけを繰り返していないか）
- **safe auto-fix件数**
- **owner付き次アクション率**
- report freshness、docs反映件数、read-only telemetry の有無

### missing KPI
- 提案 → 実装 → 定着までの conversion 定義
- stale-report / single-point-of-failure をどれだけ減らせたかの継続指標
- update baseline / smoke checklist の運用遵守率
- queue telemetry が判断精度に与えた改善効果

### 継続条件 / 強化条件 / 停止検討条件
- 継続条件:
  - 毎回のレビューで前回との差分と次アクションが残る
  - docs / backlog / learn のいずれかに反映される
- 強化条件:
  - proxy KPI を定点観測して、前回提案の実装率まで見えるようにする
  - stale-report detection / telemetry / baseline / smoke の実装確認が回り始める
- 停止検討条件:
  - 新規発見がほぼなく重複率だけが上がる
  - レビューが提案の再掲に留まり、safe auto-fix や owner 付き next action に繋がらない

---

## 5. board meeting chain
- 種別: 運用 / board input orchestration / freshness-dependent chain
- 現在判定: **指標はあるが、direct outcome が freshness gate 依存で壊れやすい**
- ベースライン: 形成済み
- 根拠スナップショット:
  - `reports/board/agenda-seed-latest.md` は `board_cycle_slot_id: 20260327-2220` / `generated_at: 2026-03-27T22:20:00+09:00`
  - `reports/board/claude-code-precheck-latest.md` は 2026-03-28 00:35 / 02:35 / 04:35 slot で連続 `stale_input`
  - `reports/board/board-premeeting-brief-latest.md` は `board_cycle_slot_id: 20260327-1835` のまま止まっている
  - つまり run status が `ok` でも、latest artifact freshness が壊れると downstream outcome は進んでいない

### direct KPI
- current slot の `agenda-seed-latest` / `claude-code-precheck-latest` / `board-premeeting-brief-latest` が **同一 board_cycle_slot_id で揃った回数**
- `stale_input` ではなく **freshness OK のまま precheck → premeeting brief まで通過**した回数
- stale を検知したときに **publish ではなく差し戻し**で止められた回数

### proxy KPI
- 各 run の status / duration / artifact 更新有無
- `board_cycle_slot_id` 一致率
- `generated_at` が current slot 近傍にある割合
- stale_input 連続回数
- freshness gate / source-latest-slot 正規化の明文化有無

### missing KPI
- freshness gate を自動で弾いた率
- slot 不一致の root cause（未再生成 / latest 更新漏れ / 正規化失敗）別件数
- board 決定が Issue / owner 付与まで接続した率
- fresh artifact と stale artifact で downstream 判断精度がどう違ったか

### 継続条件 / 強化条件 / 停止検討条件
- 継続条件:
  - stale_input を outcome 停止として正しく扱い、誤って前進扱いしない
  - slot / generated_at / latest artifact の整合が毎回記録される
- 強化条件:
  - freshness gate（slot一致 + generated_at許容範囲 + stale時停止）が自動化される
  - source / latest / slot artifact の正規化経路が 1 つに揃う
- 停止検討条件:
  - `ok` run が続いても fresh artifact が揃わず、board downstream が実質止まったままになる
  - stale_input の再発理由が記録されず、同じ差し戻しが反復する

---

## 共通ルール
- 初回または履歴不足の対象は、無理にスコア化せず `ベースライン未形成` と書く。
- 研究系は **案の数** ではなく、`PoC化率 / 棄却理由の明確さ / 次実験接続率` を優先する。
- 監督 / レビュー系は `新規発見率 / 重複率 / safe auto-fix件数 / owner付き次アクション率` を優先する。
- source repo がある対象は、`latest commit時刻 / 未コミット差分件数 / 直近実ファイル更新` を必ず proxy KPI 候補に含める。
- docs中心の対象は、更新時刻だけでなく `実修正件数 / 次アクション具体度 / 反復論点の有無` を見る。
