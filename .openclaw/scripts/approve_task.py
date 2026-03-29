#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys

from task_runtime import load_json, new_operation_id, now_iso, sync_queue_for_task, task_lock, task_paths, update_state


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Approve a protected OpenClaw task")
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--approver", required=True)
    parser.add_argument("--note", default="approved")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    paths = task_paths(args.task_id)
    with task_lock(paths["dir"]):
        state = load_json(paths["state"], default={}) or {}
        if state.get("state") != "WAITING_APPROVAL":
            print(f"task is not waiting approval: {state.get('state')}", file=sys.stderr)
            return 1
        approval = {
            "required": True,
            "approved": True,
            "approved_by": args.approver,
            "approved_at": now_iso(),
            "note": args.note,
        }
        ready_state = update_state(
            args.task_id,
            "READY_FOR_EXECUTION",
            route=state.get("route"),
            route_decision_id=state.get("route_decision_id"),
            approval_id=new_operation_id("approval"),
            dispatch_id=state.get("dispatch_id"),
            protected_paths=state.get("protected_paths", []),
            approval=approval,
            message="approval recorded",
        )
        sync_queue_for_task(args.task_id, state_payload=ready_state)
    return 0


if __name__ == "__main__":
    sys.exit(main())
