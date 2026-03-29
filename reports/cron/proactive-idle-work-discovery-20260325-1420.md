# Proactive Idle Work Discovery — Board Review

Date: 2026-03-25 14:20 JST

## 結論
今回の自律探索では、**OpenClaw Core の既存 playbook 群を RUNBOOK に接続すること** を採用した。
queue telemetry を見続けるだけでは新規性が薄く、直近で既に作成済みの `queue-dominant-prefix-triage.md` / `artifact-retention-policy.md` / `stale-report-detection-spec.md` を「運用手順」として束ねる方が、ゆうすけの負担軽減と再利用性に効く。

## 今回見つけた候補（最大3件）
1. **RUNBOOK に既存 playbook を接続する**
   - 目的: 既存の triage / retention / stale-report 仕様を、迷わず使える運用手順に変える
   - リスク: 低
   - 効き目: 高

2. **pre-update baseline / post-update smoke checklist を 1 枚化する**
   - 目的: PATH drift / LaunchAgent drift / auth scope mismatch を更新直後に早く検知する
   - リスク: 低〜中
   - 状態: まだ runbook への接続前

3. **`.openclaw/tasks/` の安全な棚卸し / 退避方針を詰める**
   - 目的: 運用アーティファクトの増殖を抑える
   - リスク: 中（保全対象の見誤りに注意）
   - 状態: 追加の証跡確認が必要

## board の採否判断
- **採用**: 1
- **保留**: 2, 3

### Board の評価
- **Board Visionary**: 1 は既存成果物を「探せる文書」から「使える運用」に格上げするため、レバレッジが高い。
- **Board User Advocate**: 1 は導入負荷が最小で、参照先が一箇所にまとまるので運用しやすい。
- **Board Operator**: 1 は最小実行可能で、今日すぐ反映できる。
- **Board Auditor**: 2 はまだ別成果物への接続が弱く、3 は削除判断の誤りが痛いので、今回は実施しない。
- **Board Chair**: 1 を先に通し、2 と 3 は既存 backlog / evidence が揃ってから再評価する。

## 実際に着手したもの（最大1件）
- `projects/openclaw-core/ops/RUNBOOK.md` に以下を追記
  - queue triage の使い方
  - artifact retention の扱い
  - stale-report detection の扱い

## 残した成果物 / 差分
- 更新: `projects/openclaw-core/ops/RUNBOOK.md`
- 新規報告: `reports/cron/proactive-idle-work-discovery-20260325-1420.md`

## 見送った理由
- **探索を深掘りして新候補を増やすこと**: 直近24h で同系統の queue / runbook / retention 論点が既に扱われており、新規性が薄い
- **Telegram 設定変更**: 禁止
- **auth / trust boundary / routing / approval の根幹変更**: 禁止
- **`.openclaw/tasks/` の削除系作業**: 保全対象の誤削除リスクがあるため、追加確認なしでは進めない

## 次アクション
1. `projects/openclaw-core/docs/status.md` に、今回 RUNBOOK に接続した playbook 群を 1 行で反映するか検討
2. `pre-update baseline / post-update smoke checklist` を runbook に接続する
3. `.openclaw/tasks/` の棚卸しは、証跡付きで安全候補を絞ってから着手する
