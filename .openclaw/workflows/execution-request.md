# Workflow: Execution Request

1. `execute_task.py` stores `task.json` / `route-decision.json` / `context-pack.md`
2. route=`claude-code` の場合のみ `execution-request.json` を生成
3. adapter に `--request --result --stdout-log --stderr-log` を渡す
4. `execution-result.json` は成功/失敗を問わず必ず残す
5. executor 完了後に review へ進める
