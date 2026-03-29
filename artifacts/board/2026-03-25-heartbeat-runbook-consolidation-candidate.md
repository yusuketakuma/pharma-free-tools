# Heartbeat Artifact Update Candidate

- kind: artifact_update
- scope: heartbeat / queue governance / runbook consolidation
- status: candidate_only
- board_required: yes

## Observed repetition
- `stale queue backlog` の triage / closure / reopen 論点が複数の cron / board / report に反復して出ている。
- 既存の `HEARTBEAT.md` は点検手順を持つが、`queue backlog` の safe-close / reopen / escalate 条件は散在している。
- 直近の探索では、これ以上の新規論点追加よりも、既存の反復論点を短い runbook に圧縮する価値が高い。

## Proposed artifact direction
- `stale queue backlog triage` を 1 枚の runbook / checklist に圧縮する。
- 含めるべき最小項目:
  1. safe-close 条件
  2. reopen 条件
  3. escalate 条件
  4. heartbeat / report / ledger に残す最小指標
  5. manual review へ送る境界

## Why this is only a candidate
- queue / routing / approval の根幹は自動変更しない。
- 方針変更は Board 候補に止める。
- まずは既存反復の整形に留め、実適用はレビュー後に判断する。
