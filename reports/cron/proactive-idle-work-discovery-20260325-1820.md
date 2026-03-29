# Proactive Idle Work Discovery — Board Review

Date: 2026-03-25 18:20 JST

## 結論
今回の自律探索では、**OpenClaw Core の既存更新安全策を 1 枚の baseline / smoke checklist に束ねる** ことを採用した。
既に RUNBOOK には queue triage / artifact retention / stale-report detection が接続済みだったため、次は更新前後の確認手順を同じ運用導線に載せるのが最もレバレッジが高いと判断した。

## 今回見つけた候補（最大3件）
1. **pre-update baseline / post-update smoke checklist を 1 枚化する**
   - 目的: OpenClaw 更新や LaunchAgent / PATH 変更時の確認手順を迷わず使える形にする
   - リスク: 低
   - 効き目: 高

2. **dominant-prefix triage checklist を backlog / RUNBOOK からさらに目に入りやすくする**
   - 目的: waiting_auth / waiting_manual_review の反復論点を観測から triage へ進める
   - リスク: 低
   - 状態: 既に checklist は存在するため、今回は重複が強い

3. **`.openclaw/tasks/` の棚卸し / 退避方針を次段へ進める**
   - 目的: 生成物の増殖を抑える
   - リスク: 中
   - 状態: 追加の証跡確認が必要

## board の採否判断
- **採用**: 1
- **保留**: 2, 3

### Board の評価
- **Board Visionary**: 1 は更新安全性を上げるだけでなく、今後の保守作業の入口を統一できる。
- **Board User Advocate**: 1 は 10 項目に圧縮されていて、現場で迷いにくい。
- **Board Operator**: 1 は既存レポートの再編集で済み、即日反映しやすい。
- **Board Auditor**: 2 はすでに checklist があり、今回は差分が薄い。3 は保全対象の見誤りが痛いので未着手。
- **Board Chair**: 1 を採択し、2 / 3 は次の evidence が揃ってから再評価する。

## 実際に着手したもの（最大1件）
- `projects/openclaw-core/docs/pre-update-baseline-smoke-checklist.md` を新規作成
- `projects/openclaw-core/ops/RUNBOOK.md` に baseline / smoke の接続を追加
- `projects/openclaw-core/backlog/queue.md` の該当項目に source link を追加

## 残した成果物 / 差分
- 新規: `projects/openclaw-core/docs/pre-update-baseline-smoke-checklist.md`
- 更新: `projects/openclaw-core/ops/RUNBOOK.md`
- 更新: `projects/openclaw-core/backlog/queue.md`
- 新規報告: `reports/cron/proactive-idle-work-discovery-20260325-1820.md`

## 見送った理由
- **dominant-prefix triage の再記述**: 既に checklist があり、今回は重複感が強い
- **`.openclaw/tasks/` の削除系作業**: 証跡不足のまま進めると保全対象を壊しうる
- **Telegram 設定変更**: 禁止
- **auth / trust boundary / routing / approval の根幹変更**: 禁止

## 次アクション
1. 次回の OpenClaw 更新時に、この baseline / smoke checklist をそのまま使う
2. `projects/openclaw-core/docs/status.md` へ、必要なら 1 行だけ接続状況を反映する
3. `.openclaw/tasks/` の棚卸しは、証跡付きで安全候補が揃った段階で再開する
