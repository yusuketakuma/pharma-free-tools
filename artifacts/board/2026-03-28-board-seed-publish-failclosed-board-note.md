# Board Note — board seed publish should fail closed on slot mismatch

- created_at: 2026-03-27T18:46:00Z
- source: strategy-director heartbeat
- outcome: board_note
- scope: board seed publishing / latest artifact contract / silent failure prevention

## Note

`agenda-seed-latest.md` is being updated even when `board_cycle_slot_id` does not match the current board slot. The current precheck correctly flags `stale_input`, but that is too late in the chain. The publish step itself should fail closed, so stale seeds never become `latest`.

## Why this matters

- This is a **contract failure**, not a content failure.
- When stale seed artifacts can still become latest, every downstream consumer inherits ambiguity.
- The problem is structural: the system currently relies on precheck to detect what publish should have blocked.

## Evidence

1. `reports/board/agenda-seed-latest.md`
   - `board_cycle_slot_id: 20260328-0820`
2. `reports/board/claude-code-precheck-latest.md`
   - `expected_board_cycle_slot_id: 20260328-0835`
   - `seed_board_cycle_slot_id: 20260328-0820`
   - `freshness: stale_input`
3. `reports/board/board-premeeting-brief-latest.md`
   - still shows an older cycle, reinforcing that downstream freshness is already degraded once publish drift occurs.

## Structural interpretation

The board pipeline should treat `board_cycle_slot_id` mismatch as a publish-time rejection condition:
- do not overwrite `*-latest`
- store only slot-specific or quarantined artifacts
- require regeneration before precheck consumes the seed

## High-leverage change

Add a fail-closed publish gate for board seed artifacts:
- slot mismatch => reject publish
- stale seed never becomes latest
- precheck becomes a verification step, not the first detector

## Boundary

- No auth / routing / trust-boundary / Telegram changes
- Low implementation risk, high leverage for board integrity

## Suggested board attention

- This is worth a short board note now because it reduces silent failure and prevents stale inputs from contaminating the next stages.
