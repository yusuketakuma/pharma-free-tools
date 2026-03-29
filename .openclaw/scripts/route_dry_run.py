#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys

from task_runtime import build_task_record, route_task


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run route decision for OpenClaw hybrid execution")
    parser.add_argument("--task", required=True)
    parser.add_argument("--paths", nargs="*", default=[])
    parser.add_argument("--requested-route", choices=["openclaw", "claude-code"])
    parser.add_argument("--action", action="append", default=[])
    args = parser.parse_args()

    task = build_task_record(
        "dry-run",
        {
            "task": args.task,
            "requested_paths": args.paths,
            "requested_route": args.requested_route,
            "requested_actions": args.action,
        },
    )
    decision = route_task(task)
    print(json.dumps(decision, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
