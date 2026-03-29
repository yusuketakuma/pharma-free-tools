#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List

from dispatch_task import load_json_like, pressure_level_claude, pressure_level_openclaw
from task_runtime import (
    CONFIG_ROOT,
    QUEUE_REASONS,
    ROOT,
    LockError,
    ValidationError,
    atomic_write_json,
    handle_invalid_queue_artifact,
    load_json,
    now_iso,
    read_queue_artifact,
    sync_queue_for_task,
    task_lock,
    task_paths,
    update_state,
    write_runtime_metrics,
)

AUTH_RUNTIME_PATH = ROOT / "runtime" / "auth" / "latest-status.json"
CAPACITY_RUNTIME_PATH = ROOT / "runtime" / "capacity" / "latest-capacity.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Re-evaluate queued OpenClaw tasks")
    parser.add_argument("--task-id")
    parser.add_argument("--reason", choices=list(QUEUE_REASONS))
    return parser.parse_args()


def iter_queue_entries(task_id: str | None = None, reason: str | None = None) -> Iterable[Path]:
    reasons = [reason] if reason else list(QUEUE_REASONS)
    for queue_reason in reasons:
        queue_dir = ROOT / "runtime" / "queue" / queue_reason
        if not queue_dir.exists():
            continue
        for path in sorted(queue_dir.glob("*.json")):
            if task_id and path.stem != task_id:
                continue
            yield path


def auth_recovered() -> bool:
    status = load_json(AUTH_RUNTIME_PATH, default={}) or {}
    stdout = status.get("stdout") if isinstance(status.get("stdout"), dict) else {}
    return bool(status.get("ok")) and bool(
        status.get("logged_in")
        or status.get("auth_ok")
        or stdout.get("loggedIn")
    )


def capacity_recovered(dispatch: Dict[str, Any]) -> bool:
    snapshot = load_json(CAPACITY_RUNTIME_PATH, default={}) or {}
    providers = snapshot.get("providers") if isinstance(snapshot.get("providers"), dict) else {}
    if not providers:
        return False
    policy = load_json_like(CONFIG_ROOT / "capacity-policy.yaml")
    selected_provider = str(dispatch.get("selected_provider") or "")
    if selected_provider == "claude_code":
        provider = providers.get("claude_code") or {}
        return bool(provider) and pressure_level_claude(provider, policy) == "normal"
    if selected_provider == "openclaw":
        provider = providers.get("openclaw") or {}
        return bool(provider) and pressure_level_openclaw(provider, policy) == "normal"
    openclaw = providers.get("openclaw") or {}
    claude = providers.get("claude_code") or {}
    return bool(openclaw and claude) and pressure_level_openclaw(openclaw, policy) == "normal" and pressure_level_claude(claude, policy) == "normal"


def manual_review_resolved(paths: Dict[str, Path], state: Dict[str, Any]) -> bool:
    marker = load_json(paths["manual_review_status"], default={}) or {}
    if marker.get("resolved") is True:
        return True
    if marker.get("approved") is True:
        return True
    return bool(state.get("manual_review_resolved"))


def review_can_publish(review: Dict[str, Any]) -> bool:
    return bool(review.get("publishable", review.get("publish_recommendation") == "publish")) and not bool(review.get("requires_manual_review"))


def release_waiting_auth(task_id: str, state: Dict[str, Any], route: Dict[str, Any], dispatch: Dict[str, Any], review: Dict[str, Any], now: str) -> Dict[str, Any]:
    ready_state = update_state(
        task_id,
        "READY_FOR_EXECUTION",
        route=state.get("route") or route.get("decision"),
        route_decision_id=state.get("route_decision_id") or route.get("route_decision_id"),
        approval=state.get("approval", {}),
        approval_id=state.get("approval_id"),
        dispatch_id=state.get("dispatch_id") or dispatch.get("dispatch_id"),
        message="queue rebalanced: auth recovered; ready to resume",
    )
    sync_queue_for_task(task_id, state_payload=ready_state, route=route, dispatch=dispatch, review=review, rebalanced_at=now)
    return ready_state


def release_waiting_approval(task_id: str, state: Dict[str, Any], route: Dict[str, Any], dispatch: Dict[str, Any], review: Dict[str, Any], now: str) -> Dict[str, Any]:
    ready_state = update_state(
        task_id,
        "READY_FOR_EXECUTION",
        route=state.get("route") or route.get("decision"),
        route_decision_id=state.get("route_decision_id") or route.get("route_decision_id"),
        approval=state.get("approval", {}),
        approval_id=state.get("approval_id"),
        dispatch_id=state.get("dispatch_id") or dispatch.get("dispatch_id"),
        message="queue rebalanced: approval detected; ready to resume",
    )
    sync_queue_for_task(task_id, state_payload=ready_state, route=route, dispatch=dispatch, review=review, rebalanced_at=now)
    return ready_state


def release_waiting_capacity(task_id: str, state: Dict[str, Any], route: Dict[str, Any], dispatch: Dict[str, Any], review: Dict[str, Any], now: str) -> Dict[str, Any]:
    ready_state = update_state(
        task_id,
        "READY_FOR_EXECUTION",
        route=state.get("route") or route.get("decision"),
        route_decision_id=state.get("route_decision_id") or route.get("route_decision_id"),
        approval=state.get("approval", {}),
        approval_id=state.get("approval_id"),
        dispatch_id=state.get("dispatch_id") or dispatch.get("dispatch_id"),
        message="queue rebalanced: provider capacity recovered; ready to resume",
    )
    sync_queue_for_task(task_id, state_payload=ready_state, route=route, dispatch=dispatch, review=review, rebalanced_at=now)
    return ready_state


def release_waiting_manual_review(task_id: str, state: Dict[str, Any], route: Dict[str, Any], dispatch: Dict[str, Any], review: Dict[str, Any], now: str, paths: Dict[str, Path]) -> Dict[str, Any]:
    updated_review = dict(review)
    updated_review["verdict"] = "pass"
    updated_review["publish_recommendation"] = "publish"
    updated_review["publishable"] = True
    updated_review["requires_manual_review"] = False
    updated_review["summary"] = "Manual review resolved; result may be published."
    issues = list(updated_review.get("issues", []))
    if "manual review resolved" not in issues:
        issues.append("manual review resolved")
    updated_review["issues"] = issues
    atomic_write_json(paths["review"], updated_review)

    reviewing_state = update_state(
        task_id,
        "REVIEWING",
        route=state.get("route") or route.get("decision"),
        route_decision_id=state.get("route_decision_id") or route.get("route_decision_id"),
        approval=state.get("approval", {}),
        approval_id=state.get("approval_id"),
        dispatch_id=state.get("dispatch_id") or dispatch.get("dispatch_id"),
        message="queue rebalanced: manual review resolved; ready for publish",
    )
    sync_queue_for_task(task_id, state_payload=reviewing_state, route=route, dispatch=dispatch, review=updated_review, rebalanced_at=now)
    return reviewing_state


def rebalance_one(task_id: str, expected_reason: str | None = None, artifact_path: Path | None = None) -> Dict[str, Any]:
    paths = task_paths(task_id)
    if artifact_path is not None:
        try:
            artifact = read_queue_artifact(artifact_path)
        except ValidationError as exc:
            result = handle_invalid_queue_artifact(task_id, artifact_path, f"invalid queue artifact: {artifact_path}: {exc}")
            write_runtime_metrics()
            return result
        if expected_reason and artifact.get("queue_reason") != expected_reason:
            return {"task_id": task_id, "queue_reason": expected_reason, "action": "held", "state": "mismatch"}
    try:
        with task_lock(paths["dir"]):
            state = load_json(paths["state"], default={}) or {}
            route = load_json(paths["route"], default={}) or {}
            dispatch = load_json(paths["dispatch"], default={}) or {}
            review = load_json(paths["review"], default={}) or {}
            queue_status = load_json(paths["queue_status"], default={}) or {}
            reason = expected_reason or queue_status.get("queue_reason") or queue_status.get("last_queue_reason")
            now = now_iso()
            if reason == "waiting_auth":
                if auth_recovered():
                    new_state = release_waiting_auth(task_id, state, route, dispatch, review, now)
                    write_runtime_metrics()
                    return {"task_id": task_id, "queue_reason": reason, "action": "released", "state": new_state.get("state")}
            elif reason == "waiting_approval":
                if (state.get("approval") or {}).get("approved"):
                    new_state = release_waiting_approval(task_id, state, route, dispatch, review, now)
                    write_runtime_metrics()
                    return {"task_id": task_id, "queue_reason": reason, "action": "released", "state": new_state.get("state")}
            elif reason == "waiting_capacity":
                if capacity_recovered(dispatch):
                    new_state = release_waiting_capacity(task_id, state, route, dispatch, review, now)
                    write_runtime_metrics()
                    return {"task_id": task_id, "queue_reason": reason, "action": "released", "state": new_state.get("state")}
            elif reason == "waiting_manual_review":
                if manual_review_resolved(paths, state) and not review_can_publish(review):
                    new_state = release_waiting_manual_review(task_id, state, route, dispatch, review, now, paths)
                    write_runtime_metrics()
                    return {"task_id": task_id, "queue_reason": reason, "action": "released", "state": new_state.get("state")}

            synced = sync_queue_for_task(task_id, state_payload=state, route=route, dispatch=dispatch, review=review, rebalanced_at=now)
            write_runtime_metrics()
            return {"task_id": task_id, "queue_reason": reason, "action": "held", "state": synced.get("state")}
    except LockError:
        write_runtime_metrics()
        return {"task_id": task_id, "queue_reason": expected_reason, "action": "skipped_locked", "state": "locked"}


def main() -> int:
    args = parse_args()
    results: List[Dict[str, Any]] = []
    seen: set[str] = set()
    if args.task_id:
        artifact_path = next(iter_queue_entries(task_id=args.task_id, reason=args.reason), None)
        results.append(rebalance_one(args.task_id, args.reason, artifact_path))
    else:
        for path in iter_queue_entries(reason=args.reason):
            if path.stem in seen:
                results.append({"task_id": path.stem, "queue_reason": path.parent.name, "action": "skipped_duplicate", "state": "deduped"})
                continue
            seen.add(path.stem)
            results.append(rebalance_one(path.stem, args.reason or path.parent.name, path))
    write_runtime_metrics()
    print(json.dumps({"results": results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
