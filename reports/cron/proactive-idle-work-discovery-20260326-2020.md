# Proactive Idle Work Discovery — 2026-03-26 20:20 JST

## 結論
- 今回の自律探索では、**低リスクで実装可能な 1 件**を採用した。
- 採用対象は、`waiting_auth` / `waiting_manual_review` の **close record 最小項目を runbook 側で固定すること**。
- 既存の board 論点と重複する高リスク案件は、board review 済みの範囲を超えないよう抑制した。

## 見つけた候補

### 1) queue waiting-state runbook の close-record 最小項目強化
- 争点: owner / next action / due だけでは、再開可否と監査の追跡が少し弱い。
- 価値: `success criteria` / `linked evidence` / `review after` を固定すると、safe-close / reopen の後追いがしやすい。
- リスク: 低い。文書更新のみで、auth / routing / approval / trust boundary は触らない。
- 採否: **採用**

### 2) stale-report detection / fallback notification の再探索
- 争点: 既に `projects/openclaw-core/docs/stale-report-detection-spec.md` が存在し、backlog と runbook にも参照がある。
- board 判断: **重複扱いで見送り**。新規差分が薄い。

### 3) bundle manifest + dry-run sync の再探索
- 争点: 既に `projects/openclaw-core/docs/bundle-sync-dry-run-smoke.md` が存在し、runbook / backlog 参照もある。
- board 判断: **重複扱いで見送り**。今回は追加成果物を増やす必要なし。

## board の採否判断
- **採用**: queue waiting-state runbook の close-record 強化
- **見送り**: stale-report detection の再調査
- **見送り**: bundle sync の再調査

## 実際に着手したもの
- `docs/runbooks/queue-waiting-state-runbook.md`
  - `success criteria` と `linked evidence`、`review after` を追加し、Decision record の最小項目を強化
  - Item-level decision table も同じ語彙に寄せて、再開判断の解釈ぶれを減らした

## 残した成果物 / 差分
- 更新済み: `docs/runbooks/queue-waiting-state-runbook.md`
- 保存済み: `reports/cron/proactive-idle-work-discovery-20260326-2020.md`

## 見送った理由
- stale-report detection: 既存 spec があり、今日の探索としては新規性が薄い
- bundle sync: 既存 spec と前回 board 反映があり、重複探索に当たる

## 次アクション
1. この runbook 変更を次回 board / heartbeat の review に流す
2. `waiting_auth` / `waiting_manual_review` の次回 triage で `success criteria` と `linked evidence` が実際に埋まるか確認する
3. もし同じ prefix が再燃するなら、item-level ではなく Queue Triage Analyst 側へ戻す
