# Status

## Current Goal
Stabilize OpenClaw orchestration, routing, and review workflow as the portfolio execution core.

## Current Risks
- Execution policy and runtime changes can affect all portfolio projects.
- Protected-path updates require explicit approval handling.
- CEO / department reporting job が止まると、差分検知と期限フォローが全体で止まる単一点障害がある。
- `.openclaw/tasks/` や一時生成物の保管ポリシーが未整備で、運用アーティファクトが蓄積しやすい。
- `waiting_auth` / `waiting_manual_review` の滞留は件数だけでは実害判断が難しく、stale backlog と active backlog を見分けにくい。
- queue telemetry は有効だが、同じ prefix を見続けるだけでは観測が反復してしまい、triage まで落ちないと backlog は減らない。
- workspace ↔ live runtime の contract bundle がずれると、個別 adapter の部分同期で互換性を壊しやすい。bundle 単位の dry-run なし同期は危険。
- deep status / audit の `gateway.probe_failed` (`missing scope: operator.read`) は、実サービス健全性とズレる可能性があり、更新判断を誤らせる。
- report / apply / manual_required / pending_artifact / effect-confirmed を混同すると、実際には未検証の変更を完了扱いしやすい。
- board chain で run status が `ok` でも、`agenda-seed-latest` / `claude-code-precheck-latest` / `board-premeeting-brief-latest` の slot がずれると実質アウトカムは止まる。freshness gate 不在は progress over-reporting を招く。

## Active Tasks
- Maintain routing / approval / context policy consistency.
- Keep task lifecycle, review, and publish flow verifiable.
- ~~Define stale-report detection / self-health checks for CEO and department reporting flow.~~ ✅ Done 2026-03-29.
- Define retention / cleanup rules for `.openclaw/tasks/` and temporary artifacts.
- Standardize evidence-based verification for reported quality metrics before reporting completion.
- Add read-only queue telemetry snapshots (count / oldest / newest / top prefixes / invalid JSON / 24h delta) for blocked runtime queues.
- Convert repeated queue prefixes into a dominant-prefix triage checklist with owner / next action / due / evidence / success criteria / stop condition, plus escalation rules for repeated no-diff / judgment / missing-metric cases.
- Keep the board-routed stale queue backlog triage / closure / reopen policy visible, and leave runtime queue state read-only until the board decision lands.
- Treat repeated dominant-prefix triage as a dedicated `Queue Triage Analyst` path instead of another supervisor-style review.
- Surface `projects/openclaw-core/docs/queue-triage-analyst-runbook.md` as the operator entrypoint for repeated blocked-prefix triage.
- Standardize pre-update baseline and post-update smoke checks so PATH drift, LaunchAgent drift, and probe-only auth mismatches are detected quickly.
- Standardize bundle-manifest / dry-run sync before reflecting workspace `.openclaw/` runtime changes into live `~/.openclaw/`.
- Keep review / apply / manual_required / effect-confirmed states separate in report handling so applied artifacts are not mistaken for verified outcomes.
- Add a board freshness gate so `board_cycle_slot_id` and `generated_at` mismatches stop downstream precheck / premeeting flows before they look green.

## Pending Approvals
- None at the moment. Add approval-gated items here when they appear.

## Last Updated
- 2026-03-29
