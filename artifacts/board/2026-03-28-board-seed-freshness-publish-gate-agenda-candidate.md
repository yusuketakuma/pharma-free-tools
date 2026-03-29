# Agenda Candidate — board seed freshness publish gate

- created_at: 2026-03-27T18:46:00Z
- source: strategy-director heartbeat
- outcome: agenda_candidate
- scope: board seed generation / publish-time freshness / slot contract

## Summary

`agenda-seed-latest.md` is still pinned to `board_cycle_slot_id=20260327-2220`, while the current board slot expected by precheck is `20260328-0235`. The seed is therefore stale at publish time, and the board cycle cannot safely advance from seed to precheck without manual correction.

## Why this is worth board time

- This is not just a stale artifact; it is a **publish contract failure**.
- The current flow detects the problem in precheck, which is late in the path.
- If freshness validation were enforced before publish, stale seeds would not become `latest`, and the board cycle would fail earlier with a clearer cause.

## Evidence

1. `reports/board/agenda-seed-latest.md`
   - `board_cycle_slot_id: 20260327-2220`
   - `generated_at: 2026-03-27T22:20:00+09:00`
2. `reports/board/claude-code-precheck-latest.md`
   - `expected_board_cycle_slot_id: 20260328-0235`
   - `seed_board_cycle_slot_id: 20260327-2220`
   - `freshness: stale_input`
3. `reports/board/board-premeeting-brief-latest.md`
   - still shows an older cycle and therefore cannot serve as the current board premeeting brief for the 0235 slot.

## Root issue

The board pipeline is allowing a stale seed to be published as latest, and only later discovering the mismatch during precheck.

## Desired change

Move slot validation to the publish step so that:
- the seed cannot be saved as `*-latest` unless its `board_cycle_slot_id` matches the current slot,
- stale seeds are written only as slot-specific artifacts or rejected,
- precheck becomes a confirmation step, not the first detector of slot drift.

## Requested action

- Treat this as a board agenda item for **freshness contract hardening**.
- Decide whether seed publication should be blocked unless slot freshness passes at write time.

## Change scope

- reporting / board artifact lifecycle / publish-time validation
- no auth, routing, trust-boundary, or Telegram changes

## Boundary impact

- Low to medium
- It changes artifact publication rules, not execution permissions.

## Reversibility

- High
- The publish gate can be relaxed later if it proves too strict.

## Blast radius

- Medium
- Affects board seed generation, precheck, and latest artifact behavior.

## Recommendation

- proposed_lane: review
- board_mode: short review
- first step: require slot freshness to pass before `agenda-seed-latest` is updated
