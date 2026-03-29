# Board Candidate — stale queue backlog reconciliation

- created_at: 2026-03-25T07:36:00+00:00
- source: ceo-heartbeat / ceo-tama
- proposal_id: proposal-20260325073850-ddcd1999feeb
- case_id: case-20260325073850-45542b6b41dd
- routed_lane: fast
- board_mode: chair_ack
- quorum_profile: None

## Why this is worth board time

- Heartbeat 時点で `waiting_auth=476` / `waiting_manual_review=343` が stale 化。
- auth 自体は OK なので、単なる認証障害ではなく **queue 再調整の運用欠落** が主因。
- ここを board で論点化すると、単発掃除ではなく再利用可能な triage / reopen / closure policy に変えられる。

## Not doing automatically

- backlog の自動 drain は実施しない。
- 実行層への直接散布もしない。
- high-risk な境界変更には触れない。

## Proposed board questions

1. `waiting_auth` を auth 回復後にどう再分類するか。
2. `waiting_manual_review` の safe-close 条件と reopen 条件をどう定義するか。
3. heartbeat / report / ledger に最低限どの backlog 指標を残すか。
4. 一度きりの棚卸しではなく、どの cron / board follow-up に組み込むか。

## Evidence

- `.openclaw/reports/heartbeat/2026-03-25-0330-jst.md`
- `reports/board-layer-rollout-plan-2026-03-25.md`
- `reports/board-runtime-implementation-plan-2026-03-25.md`
