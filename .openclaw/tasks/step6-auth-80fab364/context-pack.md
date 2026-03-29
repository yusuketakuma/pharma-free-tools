# Context Pack: step6-auth-80fab364

- task: Implement queue rebalance fixture
- route: claude-code
- route_decision_id: route-auth
- approval_required: false
- protected_paths: (none)

## Constraints
- preserve route decision

## Target Paths
- .openclaw/scripts/execute_task.py
- .openclaw/scripts/rebalance_queue.py

## Verification Commands
- python3 -m unittest discover -s .openclaw/tests -p 'test_*.py'

## Review Focus
- correctness
