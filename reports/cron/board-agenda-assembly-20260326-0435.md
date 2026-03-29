# Board Agenda Layer Assembly — 2026-03-26 04:35 JST

## 結論
Board に上げる案件は **1件** だった。
今回の直近入力は `stale queue backlog` の再調整論点に収束し、precedent / standing approval の正式一致は無かったため、fast lane ではあるが **chair_ack** として runtime に case / decision を残した。

## intake 件数
- signal: **1件**
  - `signal-20260325073600-stale-queue-backlog`
- candidate: **1件**
  - `proposal-20260325073850-ddcd1999feeb`
- review output: **0件**
- unresolved item: **0件**

## dedupe / cluster 後の case 件数
- **1件** に収束

### Cluster A — stale queue backlog の再調整方針
- 代表論点:
  - `waiting_auth` / `waiting_manual_review` の stale backlog が再燃しやすい
  - 単発棚卸しではなく triage / closure / reopen policy が未整備
  - backlog 再発防止を board-approved の運用ルールに落とす必要がある
- 判定: **Board に上げる**
- lane: **fast**
- board_mode: **chair_ack**

## precedent 適用件数
- **正式 precedent match: 0件**
- **standing approval match: 0件**

## lane 別件数
- fast: **1件**
- review: **0件**
- deep: **0件**

## runtime に書いた case / decision / deferred 件数
- case: **1件**
- decision: **1件**
- deferred: **0件**

## Board に上げた case
### 1) stale queue backlog の再調整方針を board 論点化する
- case_id: `case-20260325193504-45542b6b41dd`
- decision_id: `decision-20260325193504-f5680f8e177d`
- root issue: stale queue backlog に対する board-approved triage / closure / reopen ルールがまだ無く、auth recovery 後も queue が自動で健全化しない
- desired change: board で backlog triage policy を定義し、safe-close / reopen / escalate の分岐基準と follow-up artifact を決める
- risk lane: **fast**
- score: **3**
- board mode: **chair_ack**
- ruling: **investigate**
- guardrail:
  - backlog の自動 drain はしない
  - 実行層の生ログを Board に流さない
  - safe-close / reopen / escalate の条件を先に固定する
- follow-up owner: **supervisor-core**

## Board に上げなかった理由
- **該当なし**
- 今回の intake は 1 case のみに収束し、他の候補は生成されなかった

## unresolved / reopen 候補
- **なし**
  - active unresolved count: 0
  - reopen candidates: 0

## 次アクション
1. `stale queue backlog` の triage / closure / reopen ルールを board decision として固定する
2. `supervisor-core` に対して safe-close / reopen の判定基準を実運用へ落とす
3. routine ops は引き続き precedent / standing approval / fast lane 側へ流す
4. 次回の Board では、再掲された backlog そのものではなく **triage 実施結果** を見る
5. 通常通知は出さず、7:00 / 12:00 / 17:00 / 23:00 の定期報告へ集約する
