# Supervisor-Core Runbook Review — 2026-03-26

## 結論
現行の `projects/openclaw-core/ops/RUNBOOK.md` と関連ポリシーは、board 方針（stale queue backlog の safe-close / reopen / escalate、dominant-prefix triage の分離、runtime queue state read-only）と整合している。

## 例外 / 差分 / precedent gap
- **precedent gap 1件**: board 指示には `owner / due / evidence / stop条件` の明記があるが、RUNBOOK 本体の queue triage セクションでは `prefix / suspected choke point / owner / next action / success criteria` までで止まっており、`due / evidence / stop条件` の一枚明示はまだ見えない。

## 触らない範囲
- auth
- trust boundary
- routing
- approval
- Telegram 根幹

## 追加所見
- `projects/openclaw-core/docs/stale-queue-safe-close-reopen-policy.md` と `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` は、board intent の実体を既に持っている。
- したがって、必要なのは policy 変更ではなく、RUNBOOK の表現補強だけ。
