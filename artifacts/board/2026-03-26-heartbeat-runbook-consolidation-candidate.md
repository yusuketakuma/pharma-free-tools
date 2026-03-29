# Heartbeat Artifact Update Candidate — 2026-03-26

- kind: artifact_update
- scope: heartbeat / queue governance / runbook consolidation
- status: candidate_only
- board_required: yes

## Why this is the highest-value consolidation
- `stale queue backlog` の safe-close / reopen / escalate 条件が複数の agenda / report / memory に散在している。
- 直近の Board 反復でも、この論点は継続的に再掲されている。
- 既存 heartbeat の点検手順そのものより、**backlog triage の境界条件** を短い runbook に圧縮するほうが再利用価値が高い。

## Proposed artifact direction
1. `stale queue backlog triage` を 1 枚の runbook に圧縮
2. 最小の固定項目だけ残す
   - safe-close 条件
   - reopen 条件
   - escalate 条件
   - heartbeat / report / ledger に残す最小指標
   - manual review 境界
3. 既存 heartbeat は点検、runbook は triage 境界、Board は方針決定に分離する

## Guardrails
- queue / routing / approval の根幹は自動変更しない
- 方針変更は Board 候補に止める
- direct user report はしない
