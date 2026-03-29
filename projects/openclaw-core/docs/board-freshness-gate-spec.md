# Board Freshness Gate Spec

## Purpose
Prevent downstream board review from using stale seed / precheck / brief inputs by enforcing a freshness gate on the latest generated artifacts.

## Scope
Use this gate for:
- `agenda-seed-latest`
- `claude-code-precheck-latest`
- `board-premeeting-brief-latest`

## Gate rules
1. Confirm the current `board_cycle_slot_id` is present.
2. Confirm `generated_at` is recent enough for the current board cycle.
3. Stop if the input is stale.
4. Normalize source / latest / slot references before review.
5. Reject mixed or ambiguous slot references.

## Stop conditions
Stop and require refresh if any of the following are true:
- `board_cycle_slot_id` is missing
- `generated_at` is stale
- source/latest/slot references do not match
- the brief is not clearly tied to the current cycle

## Output shape
Prefer a short block:
- source
- latest
- board_cycle_slot_id
- generated_at
- freshness result: `pass / stale / mixed`
- next action

## Acceptance criteria
- stale inputs are blocked before review
- slot normalization is explicit
- downstream board review only sees current-cycle inputs
- Related backlog item: `projects/openclaw-core/backlog/queue.md` item 12.
- Related status note: `projects/openclaw-core/docs/status.md`.

## Related backlog item
- `projects/openclaw-core/backlog/queue.md` item 12
