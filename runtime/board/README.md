# Board Runtime Contract (provisional)

This directory is the provisional fixed runtime target for Board-facing candidate producer jobs.

## Files
- `signals.jsonl`: one JSON object per `signal_event`
- `candidates.jsonl`: one JSON object per `agenda_candidate`

## Emit-signal equivalent shape
Required practical fields:
- `ts`
- `event_type` = `signal_event`
- `source`
- `job_id`
- `agent`
- `kind`
- `summary`
- `root_issue`
- `desired_change`
- `evidence`
- `artifact_refs`

## Emit-candidate equivalent shape
Required practical fields:
- `ts`
- `event_type` = `agenda_candidate`
- `source`
- `job_id`
- `agent`
- `title`
- `summary`
- `root_issue`
- `desired_change`
- `requested_action`
- `change_scope`
- `boundary_impact`
- `reversibility`
- `blast_radius`
- `novelty`
- `evidence`
- `recommendation.proposed_lane`

This is a provisional artifact created to remove approval-gated discovery from the cross-agent knowledge sync path.
