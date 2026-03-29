# Board Post-Meeting Agent Dispatch — 2026-03-26 08:22 JST

## 結論
直近の decision ledger / board pre-meeting report を踏まえ、今回の会議後運用は **stale queue backlog の triage/runbook 化を実運用へ落とし込み、routine は監視寄りへ収束させる** ことを中心に dispatch した。

## 会議で確定した主要方針
- `waiting_auth` / `waiting_manual_review` は safe-close / reopen / escalate の運用へ寄せる
- supervisor-core の重複しやすい review loop は runbook と owner ベースへ分離する
- routine heartbeat / scorecard は signal-only、candidate は anomaly / delta / precedent gap に限定する
- auth / trust boundary / routing / approval / Telegram 根幹は今回の指示対象外

## エージェント別指示一覧

### Board 系（sessions_spawn / subagent）
- ceo-tama: 継続 — 例外・差分・precedent gap のみ上げる
- supervisor-core: 新規着手 — safe-close / reopen / escalate の1ページ runbook
- board-visionary: 監視 — precedent gap / contract reuse のみ
- board-user-advocate: 監視 — 文面の簡素さ確認
- board-operator: 継続 — triage policy を最小運用手順へ
- board-auditor: 監視 — silent failure / reopen 条件監査

### 実行系（openclaw agent）
- research-analyst: 調査 — dominant prefix / 滞留時間 / reopen パターンを evidence-only で要約
- github-operator: 待機 — repo 変更なし
- ops-automator: 継続 — 監視のみ、自動 drain なし
- doc-editor: 新規着手 — 1ページ runbook に圧縮
- dss-manager: 待機 — DSS 固有の新規着手なし
- opportunity-scout: 監視 — 新規論点のみ拾う

## 実際に配信できたエージェント

### 直接 dispatch 成功（accepted / completed）
- ceo-tama — sessions_spawn accepted
- supervisor-core — sessions_spawn accepted
- board-visionary — sessions_spawn accepted
- board-user-advocate — sessions_spawn accepted
- board-operator — sessions_spawn accepted
- board-auditor — sessions_spawn accepted
- research-analyst — completed
- github-operator — completed
- ops-automator — completed
- doc-editor — completed
- dss-manager — completed
- opportunity-scout — completed

## 配信できなかったエージェント
- なし

## 配信失敗理由
- エージェント本体への dispatch 失敗はなし
- ただし初回の一括 sessions_spawn で `streamTo` を付けたため、`runtime=subagent` では不正として失敗
- その後、`streamTo` を外して再実行し、Board 系は全件 accepted
- 一括 exec の背景実行ラッパーは安定しなかったため、最終的には個別 dispatch に切り替えた

## 即時着手項目
- supervisor-core: safe-close / reopen / escalate の runbook 初稿
- doc-editor: 1ページ版の文面確定
- research-analyst: dominant prefix / 滞留期間の evidence-only 要約
- ops-automator: 監視条件の最小化

## 待機項目
- github-operator: repo 変更待機
- dss-manager: DSS 転用可能パターン待ち
- board-visionary / board-user-advocate / board-auditor: 監視継続

## 次回会議までの監視項目
- `waiting_auth` / `waiting_manual_review` の件数と 24h delta
- reopen 率と safe-close 後の再発率
- candidate→board-touch 比率
- routine report の candidate 化の増加有無
- dominant-prefix triage の再集中有無

## 次アクション
1. supervisor-core / doc-editor / research-analyst / ops-automator の成果を 12:00 JST 前後で回収
2. 失敗例外が出たらその時点で再 dispatch
3. board cycle では exception / delta のみを再掲する

## 参照
- manifest: `artifacts/board/2026-03-26-postmeeting-dispatch-manifest.json`
- this report: `reports/cron/board-postmeeting-agent-dispatch-20260326-0822.md`
