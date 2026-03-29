# Board Agenda Layer Assembly — 2026-03-25 18:35 JST

## 結論
Board に上げる案件は **1件 בלבד** だった。
今回の直近入力は、`stale queue backlog` の再調整論点に収束し、それ以外は **既存 runbook / checklist / standing approval 側で流せる routine** だったため、Board では裁かずに運用レーンへ落とした。

## intake 件数
- 主要入力: **4件**
  - `signal-20260325073600-stale-queue-backlog`
  - `proposal-20260325073850-ddcd1999feeb`
  - `case-20260325073850-45542b6b41dd`
  - `proactive-idle-work-discovery-20260325-1820`（review output）

## dedupe / cluster 後の case 件数
- **2件** に収束

### Cluster A — stale queue backlog の再調整方針
- 代表論点:
  - auth 回復後に `waiting_auth` / `waiting_manual_review` が stale 化したまま残る
  - 単発掃除ではなく triage / closure / reopen policy が未整備
  - backlog 再発防止を board-approved の運用ルールに落とす必要がある
- 判定: **Board に上げる**
- lane: **fast**
- board_mode: **chair_ack**

### Cluster B — pre-update baseline / post-update smoke checklist の1枚化
- 代表論点:
  - 更新前後の確認手順を 1 枚にまとめる
  - RUNBOOK / queue / artifact retention に接続済みの routine
  - 既存の運用導線へ載せれば十分
- 判定: **Board に上げない**
- lane: **fast**

## precedent 適用件数
- **正式 ledger precedent: 0件**
- **運用上の precedent / standing approval 相当の抑制: 1件**
  - baseline / smoke checklist は既存 RUNBOOK 接続の範囲内で処理可能

## lane 別件数
- fast: **2件**
- review: **0件**
- deep: **0件**

## Board に上げた case
### 1) stale queue backlog の再調整方針を board 論点化する
- root issue: stale queue backlog に対する board-approved triage / closure / reopen ルールがまだ無く、auth recovery 後も queue が自動で健全化しない
- desired change: board で backlog triage policy を定義し、safe-close / reopen / escalate の分岐基準と follow-up artifact を決める
- why now: auth が正常なのに stale backlog が約60時間放置されており、以後の heartbeat でも再燃しやすい
- risk lane: **fast**
- score: **3**
- board mode: **chair_ack**
- proposed disposition: **investigate**
- guardrail:
  - backlog の自動 drain はしない
  - 実行層への直接散布をしない
  - safe-close / reopen / escalate の条件を board で先に固定する
- follow-up owner: **supervisor-core / Queue Triage Analyst**
- reopen condition: auth 回復後も stale backlog が次サイクルで再発し、owner / due / success criteria が未固定のまま残る場合

## Board に上げなかった理由
### Cluster B
- routine で reversible
- 単一領域または局所多領域に収まる
- trust / approval / routing の根幹変更ではない
- 既存 RUNBOOK / checklist に落とせる
- すでに `pre-update baseline / post-update smoke checklist` として実務導線に接続済み

## unresolved / reopen 候補
1. **stale queue backlog の safe-close / reopen 条件**
   - どこまで自動で閉じるか
   - どの条件で reopen するか
2. **backlog triage の reporting 指標**
   - heartbeat / report / ledger に残す最低限の backlog 指標
3. **same-prefix 再掲抑制の継続監視**
   - dominant-prefix の再掲が増えたら、再度 board で policy を見直す

## 次アクション
1. `stale queue backlog` の triage / closure / reopen ルールを board decision として固定する
2. `supervisor-core` と `Queue Triage Analyst` の役割境界を、再掲抑制前提で明文化する
3. routine ops は `RUNBOOK / checklist / standing approval` 側へ流し続ける
4. 次回の Board では、telemetry の再掲ではなく **triage / remediation の実施結果** を見る
5. 通常通知は出さず、7:00 / 12:00 / 17:00 / 23:00 の定期報告へ集約する
