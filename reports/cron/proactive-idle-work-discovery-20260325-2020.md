# Proactive Idle Work Discovery — Board Review

Date: 2026-03-25 20:20 JST

## 結論
今回の自律探索では、**stale queue backlog の再調整方針を board-routed のまま維持し、runtime queue は read-only で保つ** ことを採用した。

理由は単純で、直近の探索で queue telemetry / dominant-prefix triage / RUNBOOK 接続 / baseline checklist はすでに成果物化済みで、今の新規性は **「stale backlog をどう safe-close / reopen するか」** にほぼ収束しているため。

## 今回見つけた候補（最大3件）
1. **stale queue backlog の safe-close / reopen policy を board で確定する**
   - 目的: `waiting_auth` / `waiting_manual_review` が auth 回復後も stale 化したまま残る問題を、単発掃除ではなく durable な運用ルールに変える
   - リスク: 中（誤クローズ・誤 reopen を防ぐ必要あり）
   - 判定: board review 必須

2. **openclaw-core status に board-routed stale backlog を明示する**
   - 目的: 既存の telemetry / triage / runbook 群と、今 board で待っている論点をつなぐ
   - リスク: 低
   - 判定: 低リスクの内部更新として採用可

3. **queue telemetry の再掲を増やさない**
   - 目的: 既存の 476 / 343 の観測を、意味のある差分が出るまで再掲しない
   - リスク: 低
   - 判定: 観測継続はするが、新規着手はしない

## board の採否判断
- **採用**: 1, 2
- **保留**: 3

### Board の評価
- **Board Visionary**: 1 は stale backlog を「件数」ではなく「再開・終了の政策」に変えるので、レバレッジが高い。
- **Board User Advocate**: 2 は status を 1 行だけ更新する低負荷策で、次回の探索が迷いにくくなる。
- **Board Operator**: 1 は board decision 後にしか動かさない方が安全。2 は今すぐ反映できる。
- **Board Auditor**: 1 は safe-close 条件と reopen 条件を先に固定しないと危ない。3 は差分がない限り再掲不要。
- **Board Chair**: 1 を board-routed のまま維持し、2 を内部記録として反映。3 は evidence が変わるまで見送り。

## その中で実際に着手したもの（最大1件）
- `projects/openclaw-core/docs/status.md` に以下を追記
  - board-routed stale queue backlog triage / closure / reopen policy を visible に保つ
  - runtime queue state は board decision が出るまで read-only で扱う

## 残した成果物 / 差分
- 更新: `projects/openclaw-core/docs/status.md`
- 新規報告: `reports/cron/proactive-idle-work-discovery-20260325-2020.md`

## 見送った理由
- **queue telemetry をさらに掘ること**: 直近 24h の差分がなく、新しい証跡が出ていない
- **stale backlog を自動 drain すること**: 誤クローズの損失が大きく、board decision 前に押し切るべきではない
- **Telegram 設定変更**: 禁止
- **auth / trust boundary / routing / approval の根幹変更**: 禁止

## 次アクション
1. board で stale queue backlog の safe-close / reopen / escalate 条件を固定する
2. 次回以降の探索では、queue telemetry ではなく **board decision の結果** を見る
3. `projects/openclaw-core/ops/RUNBOOK.md` へ接続済み手順との整合が必要なら、board decision 後に 1 行だけ追記する
