#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from handoff_contract import augment_execution_request, build_handoff_pack, normalize_execution_result
from task_runtime import (
    ROOT,
    WORKSPACE_ROOT,
    ApprovalError,
    ValidationError,
    append_dispatch_attempt_artifact,
    atomic_write_json,
    atomic_write_text,
    build_context_pack,
    build_execution_request,
    build_openclaw_result,
    build_review_report,
    build_task_record,
    ensure_schema_valid,
    is_plan_only_task,
    is_write_task,
    load_dispatch_attempts_artifact,
    load_json,
    read_lane_selection_artifact,
    write_lane_selection_artifact,
    new_operation_id,
    now_iso,
    route_task,
    sync_queue_for_task,
    task_lock,
    task_paths,
    update_state,
    write_runtime_metrics,
)
from analyze_task import analyze_task
from select_assignees import save_assignment_plan, select_assignment_plan
from dispatch_task import build_dispatch_plan

EXIT_CODE_TO_STATUS = {
    0: "success",
    10: "policy_blocked",
    20: "timeout",
    30: "runtime_error",
    40: "invalid_request",
    50: "invalid_result",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Execute an OpenClaw task closed-loop")
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--task")
    parser.add_argument("--paths", nargs="*", default=[])
    parser.add_argument("--constraint", action="append", default=[])
    parser.add_argument("--verify", action="append", default=[])
    parser.add_argument("--review-focus", action="append", default=[])
    parser.add_argument("--action", action="append", default=[])
    parser.add_argument("--requested-route", choices=["openclaw", "claude-code"])
    parser.add_argument("--task-file", help="JSON file with task payload")
    return parser.parse_args()


def load_task_payload(args: argparse.Namespace) -> dict:
    if args.task_file:
        return json.loads(Path(args.task_file).read_text(encoding="utf-8"))
    return {
        "task": args.task or "",
        "requested_paths": args.paths,
        "constraints": args.constraint,
        "verification_commands": args.verify,
        "review_focus": args.review_focus,
        "requested_actions": args.action,
        "requested_route": args.requested_route,
    }


def next_dispatch_attempt_id(task_id: str, dispatch_id: str) -> tuple[str, int]:
    attempts = load_dispatch_attempts_artifact(task_paths(task_id)["dispatch_attempts"])
    next_index = len(attempts) + 1
    return f"{dispatch_id}_attempt_{next_index:02d}", next_index


def run_claude_lane(task: dict, route: dict, approval: dict, *, dispatch_id: str | None = None, selected_lane: str = "cli", fallback_triggered: bool = False) -> tuple[int, dict | None, str, str]:
    paths = task_paths(task["task_id"])
    dispatch_id = dispatch_id or new_operation_id("dispatch")
    dispatch_attempt_id, attempt_index = next_dispatch_attempt_id(task["task_id"], dispatch_id)
    request = build_execution_request(task, route, dispatch_id=dispatch_id)
    request = augment_execution_request(request, task, paths["dir"])
    request["started_at"] = now_iso()
    request["dispatch_attempt_id"] = dispatch_attempt_id
    request["selected_lane"] = selected_lane
    request["task_type"] = "plan_only" if is_plan_only_task(task) else "write" if is_write_task(task) else "read_only"
    if request.get("mock_mode") in {"acp_pre_session_failure", "pre_session_failure"} and selected_lane == "cli_backend_safety_net":
        request["mock_mode"] = "success"
    elif request.get("mock_mode") == "acp_pre_session_failure" and selected_lane == "cli":
        request["mock_mode"] = "success"
    atomic_write_json(paths["request"], request)
    ensure_schema_valid(paths["request"], "execution-request")

    if route["approval_required"] and not approval.get("approved"):
        raise ApprovalError("protected paths require approval before execution")

    update_state(
        task["task_id"],
        "READY_FOR_EXECUTION",
        route=route["decision"],
        route_decision_id=route.get("route_decision_id"),
        approval=approval,
        dispatch_id=dispatch_id,
        message=f"execution request saved lane={selected_lane} attempt={dispatch_attempt_id}",
    )
    update_state(
        task["task_id"],
        "RUNNING",
        route=route["decision"],
        route_decision_id=route.get("route_decision_id"),
        approval=approval,
        dispatch_id=dispatch_id,
        message=f"executor started lane={selected_lane} attempt={dispatch_attempt_id}",
    )

    command = [
        "bash",
        str(ROOT / "scripts" / "run_claude_code.sh"),
        "--request",
        str(paths["request"]),
        "--result",
        str(paths["result"]),
        "--stdout-log",
        str(paths["stdout"]),
        "--stderr-log",
        str(paths["stderr"]),
    ]
    if selected_lane == "acp":
        command = [
            "python3",
            str(ROOT / "scripts" / "run_claude_acp.py"),
            "--request",
            str(paths["request"]),
            "--result",
            str(paths["result"]),
            "--stdout-log",
            str(paths["stdout"]),
            "--stderr-log",
            str(paths["stderr"]),
        ]
    completed = subprocess.run(command, cwd=str(WORKSPACE_ROOT), check=False)
    result_payload = None
    if paths["result"].exists():
        try:
            result_payload = ensure_schema_valid(paths["result"], "execution-result")
        except ValidationError:
            result_payload = load_json(paths["result"], default={}) or {}
            raise
    result_meta = result_payload.get("_meta") if isinstance((result_payload or {}).get("_meta"), dict) else {}
    attempt_payload = {
        "task_id": task["task_id"],
        "dispatch_id": dispatch_id,
        "dispatch_attempt_id": dispatch_attempt_id,
        "lane": selected_lane,
        "attempt_index": attempt_index,
        "status": (result_payload or {}).get("status") or EXIT_CODE_TO_STATUS.get(completed.returncode, "failed"),
        "exit_code": completed.returncode,
        "started_at": request.get("started_at") or (result_payload or {}).get("started_at"),
        "finished_at": (result_payload or {}).get("finished_at") or now_iso(),
        "result_code": result_meta.get("result_code"),
        "fallback_triggered": fallback_triggered,
        "fallback_target": selected_lane if fallback_triggered else None,
        "version": 1,
    }
    append_dispatch_attempt_artifact(paths["dispatch_attempts"], attempt_payload)
    write_runtime_metrics()
    return completed.returncode, result_payload, dispatch_id, dispatch_attempt_id


def resolve_route(task: dict, paths: dict, existing_state: dict) -> tuple[dict, bool]:
    existing_route = load_json(paths["route"], default={}) or {}
    if existing_route and existing_state.get("state") in {
        "WAITING_APPROVAL",
        "AUTH_REQUIRED",
        "READY_FOR_EXECUTION",
        "WAITING_CAPACITY",
        "WAITING_MANUAL_REVIEW",
        "RUNNING",
        "REVIEWING",
        "PUBLISHED",
        "EXECUTION_FAILED",
        "REVIEW_FAILED",
    }:
        ensure_schema_valid(paths["route"], "route-decision")
        return existing_route, True
    route = route_task(task)
    atomic_write_json(paths["route"], route)
    return route, False


def resolve_dispatch(task: dict, paths: dict, existing_state: dict, assignment_plan: dict) -> tuple[dict, bool]:
    existing_dispatch = load_json(paths["dispatch"], default={}) or {}
    if existing_dispatch and existing_state.get("state") in {
        "WAITING_APPROVAL",
        "AUTH_REQUIRED",
        "READY_FOR_EXECUTION",
        "WAITING_CAPACITY",
        "WAITING_MANUAL_REVIEW",
        "RUNNING",
        "REVIEWING",
        "PUBLISHED",
        "EXECUTION_FAILED",
        "REVIEW_FAILED",
    }:
        ensure_schema_valid(paths["dispatch"], "dispatch-plan")
        if paths["lane_selection"].exists():
            read_lane_selection_artifact(paths["lane_selection"])
        return existing_dispatch, True
    dispatch = build_dispatch_plan(task, assignment_plan)
    return dispatch, False


def can_auto_fallback(task: dict, result: dict | None) -> tuple[bool, str]:
    meta = result.get("_meta") if isinstance((result or {}).get("_meta"), dict) else {}
    result_code = str(meta.get("result_code") or "")
    failure_stage = str(meta.get("failure_stage") or "")
    partial_execution = bool(meta.get("partial_execution", False))
    side_effects_possible = bool(meta.get("side_effects_possible", False))
    if result_code == "AUTH_REQUIRED":
        return True, "auth failure before execution"
    if failure_stage in {"session_start", "health_check", "capacity_check", "auth_preflight"}:
        return True, f"pre-execution failure: {failure_stage}"
    if not is_write_task(task):
        return True, "read-only or plan-only task"
    if partial_execution or side_effects_possible or failure_stage in {"execution", "worktree_created", "edit_started"}:
        return False, "write task may have side effects"
    return False, "write task fallback is disabled by policy"


def next_lane_after(current_lane: str, dispatch_plan: dict) -> str | None:
    chain = [str(item) for item in dispatch_plan.get("fallback_chain", []) if isinstance(item, str)]
    if current_lane not in chain:
        return None
    idx = chain.index(current_lane)
    return chain[idx + 1] if idx + 1 < len(chain) else None


def main() -> int:
    args = parse_args()
    payload = load_task_payload(args)
    task = build_task_record(args.task_id, payload)
    paths = task_paths(task["task_id"])

    with task_lock(paths["dir"]):
        existing_task = load_json(paths["task"], default={}) or {}
        existing_state = load_json(paths["state"], default={}) or {}
        merged_task = dict(existing_task)
        merged_task.update({k: v for k, v in task.items() if v not in (None, [], "")})
        task = merged_task
        atomic_write_json(paths["task"], task)

        existing_approval = existing_state.get("approval", {}) if existing_state else {}
        approval_payload = {
            "required": False,
            "approved": bool(existing_approval.get("approved")),
        }
        for key in ("approved_by", "approved_at", "note"):
            if key in existing_approval:
                approval_payload[key] = existing_approval[key]
        if not existing_state:
            update_state(task["task_id"], "RECEIVED", message="task stored", approval=approval_payload)

        assignment_plan = load_json(paths["assignment"], default={}) or {}
        if not assignment_plan:
            try:
                assignment_plan = select_assignment_plan(analyze_task(task))
                save_assignment_plan(assignment_plan, paths["assignment"])
            except Exception as exc:  # noqa: BLE001
                print(f"warning: assignment planning skipped: {exc}", file=sys.stderr)

        route, reused_route = resolve_route(task, paths, existing_state)
        dispatch_plan, reused_dispatch = resolve_dispatch(task, paths, existing_state, assignment_plan)
        dispatch_mode = dispatch_plan.get("execution_mode")
        dispatch_route = route["decision"]
        if dispatch_mode == "openclaw":
            dispatch_route = "openclaw"
        elif dispatch_mode in {"claude_code", "split", "plan_only"}:
            dispatch_route = "claude-code"
        route["decision"] = dispatch_route
        approval_payload["required"] = route["approval_required"]
        if not reused_route:
            route["dispatch_mode"] = dispatch_mode
            update_state(
                task["task_id"],
                "ROUTED",
                route=dispatch_route,
                route_decision_id=route.get("route_decision_id"),
                approval=approval_payload,
                protected_paths=route["protected_paths"],
                dispatch_id=dispatch_plan.get("dispatch_id"),
                message="route decision stored",
            )

        should_emit_context_pack = dispatch_mode != "plan_only" or bool(dispatch_plan.get("pre_auth_openclaw_phase"))
        if should_emit_context_pack:
            build_handoff_pack(task, route, dispatch_plan, paths["dir"])
        else:
            atomic_write_text(paths["context"], build_context_pack(task, route))

        if dispatch_mode == "queued":
            queued_state = update_state(
                task["task_id"],
                "WAITING_CAPACITY",
                route=dispatch_route,
                route_decision_id=route.get("route_decision_id"),
                approval=approval_payload,
                dispatch_id=dispatch_plan.get("dispatch_id"),
                message="dispatch queued pending provider capacity",
            )
            sync_queue_for_task(task["task_id"], state_payload=queued_state, route=route, dispatch=dispatch_plan)
            return 0

        if dispatch_mode == "plan_only":
            if dispatch_plan.get("auth_blocked"):
                waiting_state = update_state(
                    task["task_id"],
                    "AUTH_REQUIRED",
                    route=dispatch_route,
                    route_decision_id=route.get("route_decision_id"),
                    approval=approval_payload,
                    dispatch_id=dispatch_plan.get("dispatch_id"),
                    message=(
                        "pre-auth OpenClaw artifacts prepared; waiting for Claude auth"
                        if dispatch_plan.get("pre_auth_openclaw_phase")
                        else "Claude auth required before execution can continue"
                    ),
                )
                sync_queue_for_task(task["task_id"], state_payload=waiting_state, route=route, dispatch=dispatch_plan)
                return 0
            routed_state = update_state(
                task["task_id"],
                "ROUTED",
                route=dispatch_route,
                route_decision_id=route.get("route_decision_id"),
                approval=approval_payload,
                dispatch_id=dispatch_plan.get("dispatch_id"),
                message=f"dispatch withheld: {dispatch_mode}",
            )
            sync_queue_for_task(task["task_id"], state_payload=routed_state, route=route, dispatch=dispatch_plan)
            return 0

        if route["approval_required"] and not approval_payload.get("approved"):
            if existing_state.get("state") != "WAITING_APPROVAL":
                approval_state = update_state(
                    task["task_id"],
                    "WAITING_APPROVAL",
                    route=route["decision"],
                    route_decision_id=route.get("route_decision_id"),
                    approval=approval_payload,
                    protected_paths=route["protected_paths"],
                    dispatch_id=dispatch_plan.get("dispatch_id"),
                    message="waiting for approval",
                )
            else:
                approval_state = load_json(paths["state"], default={}) or {}
            sync_queue_for_task(task["task_id"], state_payload=approval_state, route=route, dispatch=dispatch_plan)
            return 0

        if route["decision"] == "openclaw":
            direct_approval = dict(approval_payload)
            direct_approval["approved"] = True
            update_state(
                task["task_id"],
                "READY_FOR_EXECUTION",
                route="openclaw",
                route_decision_id=route.get("route_decision_id"),
                approval=direct_approval,
                dispatch_id=dispatch_plan.get("dispatch_id"),
                message="direct execution ready",
            )
            update_state(
                task["task_id"],
                "RUNNING",
                route="openclaw",
                route_decision_id=route.get("route_decision_id"),
                approval=direct_approval,
                dispatch_id=dispatch_plan.get("dispatch_id"),
                message="openclaw execution started",
            )
            result = normalize_execution_result(build_openclaw_result(task, route), task, paths["dir"])
            atomic_write_json(paths["result"], result)
            ensure_schema_valid(paths["result"], "execution-result")
            review = build_review_report({**task, "approval": direct_approval}, route, result)
            atomic_write_json(paths["review"], review)
            ensure_schema_valid(paths["review"], "review-report")
            current_state_name = "WAITING_MANUAL_REVIEW" if review.get("requires_manual_review") else "REVIEWING"
            reviewed_state = update_state(
                task["task_id"],
                current_state_name,
                route="openclaw",
                route_decision_id=route.get("route_decision_id"),
                approval=direct_approval,
                dispatch_id=dispatch_plan.get("dispatch_id"),
                message="manual review required before publish" if current_state_name == "WAITING_MANUAL_REVIEW" else "reviewing direct result",
            )
            sync_queue_for_task(task["task_id"], state_payload=reviewed_state, route=route, dispatch=dispatch_plan, result=result, review=review)
            return 0

        selected_lane = dispatch_plan.get("selected_lane") or "cli"
        try:
            exit_code, result, dispatch_id, dispatch_attempt_id = run_claude_lane(
                task,
                route,
                approval_payload,
                dispatch_id=dispatch_plan.get("dispatch_id"),
                selected_lane=selected_lane,
                fallback_triggered=False,
            )
        except ApprovalError as exc:
            approval_state = update_state(
                task["task_id"],
                "WAITING_APPROVAL",
                route=route["decision"],
                route_decision_id=route.get("route_decision_id"),
                approval={"required": True, "approved": False},
                protected_paths=route["protected_paths"],
                dispatch_id=dispatch_plan.get("dispatch_id"),
                message=str(exc),
            )
            sync_queue_for_task(task["task_id"], state_payload=approval_state, route=route, dispatch=dispatch_plan)
            return 0
        except ValidationError as exc:
            approved_payload = dict(approval_payload)
            approved_payload["approved"] = True
            update_state(
                task["task_id"],
                "REVIEW_FAILED",
                route=route["decision"],
                route_decision_id=route.get("route_decision_id"),
                approval=approved_payload,
                message=str(exc),
            )
            review = {
                "task_id": task["task_id"],
                "verdict": "blocked",
                "summary": "Execution result schema validation failed.",
                "issues": [str(exc)],
                "publish_recommendation": "hold",
            }
            atomic_write_json(paths["review"], review)
            return 50

        status = EXIT_CODE_TO_STATUS.get(exit_code, "failed")
        approved_payload = dict(approval_payload)
        approved_payload["approved"] = True
        if result is None:
            failed_state = update_state(
                task["task_id"],
                "EXECUTION_FAILED",
                route=route["decision"],
                route_decision_id=route.get("route_decision_id"),
                approval=approved_payload,
                dispatch_id=dispatch_id,
                message="executor returned without result",
            )
            sync_queue_for_task(task["task_id"], state_payload=failed_state, route=route, dispatch=dispatch_plan)
            return exit_code or 30

        result = normalize_execution_result(result, task, paths["dir"])
        atomic_write_json(paths["result"], result)
        result_meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
        result_code = str(result_meta.get("result_code") or "")
        if result_code == "AUTH_REQUIRED":
            auth_state = update_state(
                task["task_id"],
                "AUTH_REQUIRED",
                route=route["decision"],
                route_decision_id=route.get("route_decision_id"),
                approval=approved_payload,
                dispatch_id=dispatch_id,
                message="Claude auth required before execution can continue",
            )
            review = build_review_report({**task, "approval": approved_payload}, route, result)
            atomic_write_json(paths["review"], review)
            ensure_schema_valid(paths["review"], "review-report")
            sync_queue_for_task(task["task_id"], state_payload=auth_state, route=route, dispatch=dispatch_plan, result=result, review=review)
            return exit_code or 30

        if status != "success":
            fallback_allowed = False
            fallback_reason = "no fallback evaluated"
            while status != "success":
                fallback_allowed, fallback_reason = can_auto_fallback(task, result)
                fallback_lane = next_lane_after(selected_lane, dispatch_plan) if fallback_allowed else None
                if not fallback_lane:
                    break
                dispatch_plan["selected_lane"] = fallback_lane
                dispatch_plan["selection_reasons"] = list(dispatch_plan.get("selection_reasons", [])) + [f"auto fallback {selected_lane}->{fallback_lane}: {fallback_reason}"]
                atomic_write_json(paths["dispatch"], dispatch_plan)
                lane_selection = {
                    "task_id": task["task_id"],
                    "provider": dispatch_plan.get("selected_provider", "claude_code"),
                    "primary_mode": dispatch_plan.get("primary_mode", "acp"),
                    "selected_lane": dispatch_plan.get("selected_lane", fallback_lane),
                    "fallback_chain": dispatch_plan.get("fallback_chain", []),
                    "selection_reasons": dispatch_plan.get("selection_reasons", []),
                    "lane_health_snapshot": dispatch_plan.get("lane_health_snapshot", {}),
                    "captured_at": dispatch_plan.get("captured_at") or now_iso(),
                    "version": 1,
                }
                if paths["lane_selection"].exists():
                    lane_selection.update(read_lane_selection_artifact(paths["lane_selection"], default={}) or {})
                lane_selection.update({
                    "selected_lane": fallback_lane,
                    "selection_reasons": dispatch_plan["selection_reasons"],
                    "captured_at": lane_selection.get("captured_at") or dispatch_plan.get("captured_at") or now_iso(),
                    "version": 1,
                })
                write_lane_selection_artifact(paths["lane_selection"], lane_selection)
                selected_lane = fallback_lane
                exit_code, result, dispatch_id, dispatch_attempt_id = run_claude_lane(
                    task,
                    route,
                    approved_payload,
                    dispatch_id=dispatch_id,
                    selected_lane=fallback_lane,
                    fallback_triggered=True,
                )
                status = EXIT_CODE_TO_STATUS.get(exit_code, "failed")
                result_meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
                result_code = str(result_meta.get("result_code") or "")
                if result_code == "AUTH_REQUIRED":
                    auth_state = update_state(
                        task["task_id"],
                        "AUTH_REQUIRED",
                        route=route["decision"],
                        route_decision_id=route.get("route_decision_id"),
                        approval=approved_payload,
                        dispatch_id=dispatch_id,
                        message="Claude auth required before execution can continue",
                    )
                    review = build_review_report({**task, "approval": approved_payload}, route, result)
                    atomic_write_json(paths["review"], review)
                    ensure_schema_valid(paths["review"], "review-report")
                    sync_queue_for_task(task["task_id"], state_payload=auth_state, route=route, dispatch=dispatch_plan, result=result, review=review)
                    return exit_code or 30
            if status != "success":
                target_state = "WAITING_MANUAL_REVIEW" if not fallback_allowed else "EXECUTION_FAILED"
                failed_state = update_state(
                    task["task_id"],
                    target_state,
                    route=route["decision"],
                    route_decision_id=route.get("route_decision_id"),
                    approval=approved_payload,
                    dispatch_id=dispatch_id,
                    message=(f"automatic fallback blocked: {fallback_reason}" if target_state == "WAITING_MANUAL_REVIEW" else f"executor finished with status={status}"),
                )
                review = build_review_report({**task, "approval": approved_payload}, route, result)
                atomic_write_json(paths["review"], review)
                sync_queue_for_task(task["task_id"], state_payload=failed_state, route=route, dispatch=dispatch_plan, result=result, review=review)
                return exit_code

        review = build_review_report({**task, "approval": approved_payload}, route, result)
        atomic_write_json(paths["review"], review)
        ensure_schema_valid(paths["review"], "review-report")
        current_state_name = "WAITING_MANUAL_REVIEW" if review.get("requires_manual_review") else "REVIEWING"
        reviewed_state = update_state(
            task["task_id"],
            current_state_name,
            route=route["decision"],
            route_decision_id=route.get("route_decision_id"),
            approval=approved_payload,
            dispatch_id=dispatch_id,
            message="manual review required before publish" if current_state_name == "WAITING_MANUAL_REVIEW" else "execution succeeded; entering review",
        )
        sync_queue_for_task(task["task_id"], state_payload=reviewed_state, route=route, dispatch=dispatch_plan, result=result, review=review)
        return 0


if __name__ == "__main__":
    sys.exit(main())
