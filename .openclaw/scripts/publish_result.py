#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys

from task_runtime import (
    PublishError,
    atomic_write_text,
    ensure_schema_valid,
    load_json,
    render_final_response,
    sync_queue_for_task,
    task_lock,
    task_paths,
    update_state,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish a reviewed OpenClaw task result")
    parser.add_argument("--task-id", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    paths = task_paths(args.task_id)
    with task_lock(paths["dir"]):
        task = load_json(paths["task"], default={}) or {}
        state = load_json(paths["state"], default={}) or {}
        route = ensure_schema_valid(paths["route"], "route-decision")
        result = ensure_schema_valid(paths["result"], "execution-result")
        review = ensure_schema_valid(paths["review"], "review-report")

        result_meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
        if state.get("state") == "AUTH_REQUIRED" or str(result_meta.get("result_code") or "") == "AUTH_REQUIRED":
            raise PublishError("publish blocked: Claude auth is required; restore auth and resume execution first")

        if review["verdict"] != "pass" or review["publish_recommendation"] != "publish":
            raise PublishError(
                f"publish blocked: verdict={review['verdict']} recommendation={review['publish_recommendation']}"
            )
        if review.get("publishable") is False or review.get("requires_manual_review") is True:
            raise PublishError(
                "publish blocked: review marked result as non-publishable pending manual review"
            )

        final_response = render_final_response(task, route, result, review)
        atomic_write_text(paths["final"], final_response)
        published_state = update_state(
            args.task_id,
            "PUBLISHED",
            route=route["decision"],
            route_decision_id=route.get("route_decision_id"),
            approval={"required": route["approval_required"], "approved": True},
            dispatch_id=state.get("dispatch_id"),
            approval_id=state.get("approval_id"),
            message="final response published",
        )
        sync_queue_for_task(args.task_id, state_payload=published_state, route=route, result=result, review=review)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except PublishError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
