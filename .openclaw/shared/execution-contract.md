# Shared Doc: Execution Contract

## Request
`execution-request.json` は機械契約として以下を持つ。

- `task_id`
- `request_version`
- `executor`
- `task_summary`
- `constraints`
- `target_paths`
- `verification_commands`
- `review_focus`

## Result
`execution-result.json` は成功/失敗を問わず以下を持つ。

- `task_id`
- `status`
- `executor`
- `summary`
- `changed_files`
- `verification_results`
- `remaining_risks`
- `exit_code`
- `started_at`
- `finished_at`
