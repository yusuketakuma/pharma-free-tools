#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Tuple

from analyze_task import analyze_task
from task_runtime import (
    CONFIG_ROOT,
    ROOT,
    ValidationError,
    atomic_write_json,
    ensure_schema_valid,
    write_lane_selection_artifact,
    is_plan_only_task,
    is_write_task,
    load_claude_code_config,
    load_json,
    new_operation_id,
    now_iso,
    task_paths,
)


CAPACITY_RUNTIME_ROOT = ROOT / "runtime" / "capacity"
HEALTH_RUNTIME_ROOT = ROOT / "runtime" / "health"
LANE_HEALTH_FRESHNESS_SEC = 900


def load_json_like(path: Path, default: Dict[str, Any] | None = None) -> Dict[str, Any]:
    if not path.exists():
        return dict(default or {})
    return json.loads(path.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build capacity snapshot + dispatch plan")
    parser.add_argument("--task-id")
    parser.add_argument("--task-file")
    parser.add_argument("--assignment-plan")
    parser.add_argument("--output")
    return parser.parse_args()


def load_task(args: argparse.Namespace) -> Dict[str, Any]:
    if args.task_file:
        payload = json.loads(Path(args.task_file).read_text(encoding="utf-8"))
        if args.task_id and "task_id" not in payload:
            payload["task_id"] = args.task_id
        return payload
    if not args.task_id:
        raise ValidationError("--task-id or --task-file is required")
    task = load_json(task_paths(args.task_id)["task"], default=None)
    if not task:
        raise ValidationError(f"task not found: {args.task_id}")
    return task


def load_assignment_plan(task_id: str, explicit: str | None) -> Dict[str, Any]:
    path = Path(explicit) if explicit else task_paths(task_id)["assignment"]
    plan = load_json(path, default=None)
    if not plan:
        raise ValidationError(f"assignment plan not found: {path}")
    temp = path.parent / "assignment-plan.dispatch.validate.json"
    temp.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ensure_schema_valid(temp, "assignment-plan")
    return plan


def refresh_provider_snapshots() -> Tuple[Dict[str, Any], Dict[str, Any]]:
    subprocess.run(["python3", str(ROOT / "scripts" / "provider_capacity_openai.py")], check=True, capture_output=True, text=True)
    subprocess.run(["python3", str(ROOT / "scripts" / "provider_capacity_claude.py")], check=True, capture_output=True, text=True)
    openclaw = load_json(CAPACITY_RUNTIME_ROOT / "openai-capacity.json", default={}) or {}
    claude = load_json(CAPACITY_RUNTIME_ROOT / "claude-capacity.json", default={}) or {}
    return openclaw, claude


def build_capacity_snapshot(task_id: str) -> Dict[str, Any]:
    openclaw, claude = refresh_provider_snapshots()
    captured_at = max(str(openclaw.get("captured_at", "")), str(claude.get("captured_at", ""))) or now_iso()
    snapshot = {
        "task_id": task_id,
        "captured_at": captured_at,
        "providers": {
            "openclaw": openclaw,
            "claude_code": claude,
        },
    }
    temp = task_paths(task_id)["dir"] / "capacity-snapshot.validate.json"
    temp.parent.mkdir(parents=True, exist_ok=True)
    temp.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ensure_schema_valid(temp, "capacity-snapshot")
    atomic_write_json(CAPACITY_RUNTIME_ROOT / "latest-capacity.json", snapshot)
    return snapshot


def is_heavy_task(task: Dict[str, Any], intake: Dict[str, Any], assignment: Dict[str, Any]) -> bool:
    requested_paths = task.get("requested_paths", intake.get("requested_paths", []))
    text = (task.get("task") or intake.get("task_summary") or "").lower()
    return (
        intake.get("complexity") in {"high", "very_high"}
        or len(requested_paths) > 1
        or "multi-file-change" in intake.get("required_capabilities", [])
        or any(token in text for token in ["implement", "refactor", "migration", "heavy", "multi-file"])
        or len(assignment.get("active_subroles", [])) > 0
    )


def is_multi_file_write(task: Dict[str, Any], intake: Dict[str, Any]) -> bool:
    requested_paths = task.get("requested_paths", intake.get("requested_paths", []))
    text = (task.get("task") or intake.get("task_summary") or "").lower()
    if len(requested_paths) <= 1:
        return False
    read_only_markers = ["read-only", "read only", "without changing files", "no file changes"]
    return not any(marker in text for marker in read_only_markers)


def is_single_department_light(intake: Dict[str, Any], assignment: Dict[str, Any]) -> bool:
    return (
        len(intake.get("departments_involved", [])) == 1
        and intake.get("complexity") == "low"
        and intake.get("risk_level") == "low"
        and not assignment.get("active_subroles")
    )


def has_pre_auth_openclaw_value(task: Dict[str, Any], intake: Dict[str, Any], assignment: Dict[str, Any]) -> bool:
    desired_outputs = {str(item) for item in intake.get("desired_outputs", [])}
    required_capabilities = {str(item) for item in intake.get("required_capabilities", [])}
    review_focus = {str(item).lower() for item in task.get("review_focus", [])}
    constraints = " ".join(str(item) for item in task.get("constraints", []))
    return bool(
        desired_outputs.intersection({"doc", "plan", "report", "task-brief"})
        or required_capabilities.intersection({"docs", "copy", "analysis", "coordination", "requirements"})
        or any(token in constraints.lower() for token in ["context pack", "docs draft", "reviewer template"])
        or any(token in review_focus for token in ["reviewer", "documentation", "docs"])
        or len(assignment.get("advisory_subroles", [])) > 0
    )


def pressure_level_openclaw(snapshot: Dict[str, Any], policy: Dict[str, Any]) -> str:
    thresholds = policy["providers"]["openclaw"]["thresholds"]
    usage = max(float(snapshot.get("usage_pressure", 0)), float(snapshot.get("cost_pressure", 0)))
    if snapshot.get("hard_blocked") or usage >= float(thresholds["hard_pressure_at"]):
        return "hard"
    if usage >= float(thresholds["high_pressure_at"]):
        return "high"
    return "normal"


def pressure_level_claude(snapshot: Dict[str, Any], policy: Dict[str, Any]) -> str:
    thresholds = policy["providers"]["claude_code"]["thresholds"]
    pressure = max(
        float(snapshot.get("rpm_pressure", 0)),
        float(snapshot.get("itpm_pressure", 0)),
        float(snapshot.get("otpm_pressure", 0)),
        float(snapshot.get("spend_pressure", 0)),
    )
    if snapshot.get("hard_blocked") or pressure >= float(thresholds["hard_pressure_at"]):
        return "hard"
    if pressure >= float(thresholds["high_pressure_at"]) or float(snapshot.get("retry_after_sec", 0)) >= float(thresholds["retry_after_high_at"]):
        return "high"
    return "normal"


def load_lane_probe(max_age_sec: int = LANE_HEALTH_FRESHNESS_SEC) -> Tuple[Dict[str, Any], bool]:
    path = HEALTH_RUNTIME_ROOT / "lane-health.json"
    payload = load_json(path, default={}) or {}
    captured_at = payload.get("captured_at") if isinstance(payload, dict) else None
    captured_dt = None
    if captured_at:
        try:
            captured_dt = datetime.fromisoformat(str(captured_at))
        except Exception:  # noqa: BLE001
            captured_dt = None
    is_fresh = False
    if captured_dt is not None:
        is_fresh = (datetime.now(captured_dt.tzinfo or None) - captured_dt).total_seconds() <= max_age_sec
    return payload if isinstance(payload, dict) else {}, is_fresh


def lane_health_snapshot(task: Dict[str, Any], claude_snapshot: Dict[str, Any]) -> Dict[str, Any]:
    metrics = load_json(ROOT / "runtime" / "metrics" / "latest-metrics.json", default={}) or {}
    probe_payload, probe_fresh = load_lane_probe()
    probe_lanes = probe_payload.get("lanes") if isinstance(probe_payload.get("lanes"), dict) else {}
    auth_payload = probe_payload.get("auth") if isinstance(probe_payload.get("auth"), dict) else {}

    auth_ok = bool(claude_snapshot.get("auth_ok", True))
    acp_healthy = bool(claude_snapshot.get("acp_healthy", claude_snapshot.get("healthy", False)))
    cli_healthy = bool(claude_snapshot.get("cli_healthy", claude_snapshot.get("healthy", False)))
    cli_backend_healthy = bool(claude_snapshot.get("cli_backend_healthy", cli_healthy))
    lane_errors: Dict[str, Any] = {}
    lane_latencies: Dict[str, Any] = {}
    probe_transport: Dict[str, Any] = {}

    if probe_fresh and str(claude_snapshot.get("source") or "") != "test":
        auth_ok = bool(auth_payload.get("auth_ok", auth_ok))
        acp = probe_lanes.get("acp") if isinstance(probe_lanes.get("acp"), dict) else {}
        cli = probe_lanes.get("cli") if isinstance(probe_lanes.get("cli"), dict) else {}
        cli_backend = probe_lanes.get("cli_backend_safety_net") if isinstance(probe_lanes.get("cli_backend_safety_net"), dict) else {}
        acp_healthy = bool(acp.get("healthy", acp_healthy))
        cli_healthy = bool(cli.get("healthy", cli_healthy))
        cli_backend_healthy = bool(cli_backend.get("healthy", cli_backend_healthy))
        lane_errors = {
            "acp": acp.get("last_error"),
            "cli": cli.get("last_error"),
            "cli_backend_safety_net": cli_backend.get("last_error"),
        }
        lane_latencies = {
            "acp": acp.get("latency_ms"),
            "cli": cli.get("latency_ms"),
            "cli_backend_safety_net": cli_backend.get("latency_ms"),
        }
        probe_transport = {
            "acp": acp.get("transport_kind"),
            "cli": cli.get("transport_kind"),
            "cli_backend_safety_net": cli_backend.get("transport_kind"),
        }

    return {
        "auth_ok": auth_ok,
        "acp_healthy": acp_healthy,
        "cli_healthy": cli_healthy,
        "cli_backend_healthy": cli_backend_healthy,
        "acp_last_success_at": metrics.get("acp_last_success_at"),
        "cli_last_success_at": metrics.get("cli_last_success_at"),
        "acp_consecutive_failures": int(metrics.get("acp_consecutive_failures", 0) or 0),
        "cli_consecutive_failures": int(metrics.get("cli_consecutive_failures", 0) or 0),
        "retry_after_sec": float(claude_snapshot.get("retry_after_sec", 0) or 0),
        "hard_blocked": bool(claude_snapshot.get("hard_blocked", False)),
        "probe_fresh": probe_fresh,
        "probe_path": str((HEALTH_RUNTIME_ROOT / "lane-health.json").relative_to(ROOT.parent)),
        "lane_last_error": lane_errors,
        "lane_latency_ms": lane_latencies,
        "lane_transport": probe_transport,
        "captured_at": (probe_payload.get("captured_at") if probe_fresh else claude_snapshot.get("captured_at")) or now_iso(),
    }


def fallback_chain_for_primary_mode(primary_mode: str) -> List[str]:
    if primary_mode == "cli":
        return ["cli", "cli_backend_safety_net"]
    return ["acp", "cli", "cli_backend_safety_net"]


def select_claude_lane(task: Dict[str, Any], claude_snapshot: Dict[str, Any]) -> Tuple[str, List[str], List[str], Dict[str, Any], str | None]:
    config = load_claude_code_config()
    primary_mode = str(config.get("primary_mode") or "acp")
    fallback_chain = fallback_chain_for_primary_mode(primary_mode)
    health = lane_health_snapshot(task, claude_snapshot)
    reasons: List[str] = [f"primary_mode={primary_mode}"]
    if not health["auth_ok"]:
        reasons.append("claude auth unavailable")
        return "none", reasons, fallback_chain, health, "waiting_auth"

    for lane in fallback_chain:
        healthy_key = {
            "acp": "acp_healthy",
            "cli": "cli_healthy",
            "cli_backend_safety_net": "cli_backend_healthy",
        }[lane]
        if health.get(healthy_key):
            reasons.append(f"selected {lane} because {healthy_key}=true")
            return lane, reasons, fallback_chain, health, None
        reasons.append(f"skip {lane} because {healthy_key}=false")

    reasons.append("no Claude lane healthy")
    return "none", reasons, fallback_chain, health, "waiting_capacity"


def role_provider_preference(role_name: str) -> List[str]:
    role_caps = load_json_like(CONFIG_ROOT / "role-capability.yaml")
    role = (role_caps.get("roles") or {}).get(role_name, {})
    prefs = role.get("default_provider_preference") or ["openclaw", "claude-code"]
    normalized: List[str] = []
    for item in prefs:
        if item == "claude-code":
            normalized.append("claude_code")
        else:
            normalized.append(str(item))
    return normalized


def score_provider(provider: str, intake: Dict[str, Any], assignment: Dict[str, Any], snapshot: Dict[str, Any], policy: Dict[str, Any], *, heavy: bool, multi_file_write: bool) -> Dict[str, float]:
    provider_policy = policy["providers"][provider]
    preferred_for = set(provider_policy.get("preferred_for", []))
    lead_pref = role_provider_preference(assignment["lead_role"])
    capability_fit = 0.9 if (provider == "claude_code" and heavy) else 0.9 if (provider == "openclaw" and not heavy) else 0.45
    if multi_file_write and provider == "claude_code":
        capability_fit = min(1.0, capability_fit + 0.1)
    if is_single_department_light(intake, assignment) and provider == "openclaw":
        capability_fit = 1.0

    preference_tokens = set()
    if is_single_department_light(intake, assignment):
        preference_tokens.add("single_department_light")
    if "docs" in intake.get("required_capabilities", []) or "doc" in intake.get("desired_outputs", []):
        preference_tokens.add("docs")
    if heavy:
        preference_tokens.update({"heavy_code", "implementation", "multi_file_change"})
    provider_preference_fit = 0.7 if any(token in preferred_for for token in preference_tokens) else 0.4
    if lead_pref and lead_pref[0] == provider:
        provider_preference_fit = min(1.0, provider_preference_fit + 0.2)

    historical_success = 0.82 if provider == "claude_code" else 0.78
    latency_fit = 0.85 if (provider == "openclaw" and not heavy) else 0.7 if provider == "claude_code" else 0.45
    if provider == "openclaw":
        limit_pressure = max(float(snapshot.get("usage_pressure", 0)), 1.0 - float(snapshot.get("remaining_requests_ratio", 1)), 1.0 - float(snapshot.get("remaining_tokens_ratio", 1)))
        cost_pressure = float(snapshot.get("cost_pressure", 0))
    else:
        limit_pressure = max(float(snapshot.get("rpm_pressure", 0)), float(snapshot.get("itpm_pressure", 0)), float(snapshot.get("otpm_pressure", 0)))
        cost_pressure = float(snapshot.get("spend_pressure", 0))
    queue_penalty = 0.2 if provider == "claude_code" and heavy else 0.05
    risk_penalty = 0.25 if (multi_file_write and provider == "openclaw") else 0.15 if intake.get("risk_level") in {"high", "critical"} and provider == "openclaw" else 0.05
    total = round(capability_fit + provider_preference_fit + historical_success + latency_fit - limit_pressure - cost_pressure - queue_penalty - risk_penalty, 3)
    return {
        "capability_fit": round(capability_fit, 3),
        "provider_preference_fit": round(provider_preference_fit, 3),
        "historical_success": round(historical_success, 3),
        "latency_fit": round(latency_fit, 3),
        "limit_pressure": round(limit_pressure, 3),
        "cost_pressure": round(cost_pressure, 3),
        "queue_penalty": round(queue_penalty, 3),
        "risk_penalty": round(risk_penalty, 3),
        "total": total,
    }


def choose_execution_mode(task: Dict[str, Any], intake: Dict[str, Any], assignment: Dict[str, Any], snapshot: Dict[str, Any], policy: Dict[str, Any]) -> Tuple[str, str, List[str], Dict[str, float], Dict[str, Any]]:
    openclaw = snapshot["providers"]["openclaw"]
    claude = snapshot["providers"]["claude_code"]
    heavy = is_heavy_task(task, intake, assignment)
    multi_file_write = is_multi_file_write(task, intake)
    openclaw_pressure = pressure_level_openclaw(openclaw, policy)
    claude_pressure = pressure_level_claude(claude, policy)
    reasons: List[str] = []
    flags: Dict[str, Any] = {}

    openclaw_scores = score_provider("openclaw", intake, assignment, openclaw, policy, heavy=heavy, multi_file_write=multi_file_write)
    claude_scores = score_provider("claude_code", intake, assignment, claude, policy, heavy=heavy, multi_file_write=multi_file_write)

    if not claude.get("auth_ok", True):
        preprocess_value = has_pre_auth_openclaw_value(task, intake, assignment)
        flags.update({
            "auth_blocked": True,
            "auth_blocked_provider": "claude_code",
            "pre_auth_openclaw_phase": preprocess_value,
            "queue_reason": "waiting_auth",
        })
        reasons.append("Claude auth NG のため claude_code 実行は保留")
        if preprocess_value:
            reasons.append("OpenClaw 前処理価値ありのため context pack / docs draft 系のみ先行")
        else:
            reasons.append("OpenClaw 前処理価値が薄いため即 WAITING_AUTH")
        reasons.append("route / dispatch を再積みせず auth 回復後に READY_FOR_EXECUTION へ戻す")
        return "plan_only", "claude-code", reasons, claude_scores, flags

    if openclaw_pressure in {"high", "hard"} and claude_pressure in {"high", "hard"}:
        reasons.append("両 provider が high pressure のため queued")
        flags["queue_reason"] = "waiting_capacity"
        return "queued", "plan_only", reasons, claude_scores if claude_scores["total"] >= openclaw_scores["total"] else openclaw_scores, flags

    if heavy and openclaw_pressure == "hard":
        reasons.append("OpenClaw hard pressure のため heavy task を流さない")
        if claude_pressure == "normal":
            return "claude_code", "claude-code", reasons, claude_scores, flags
        if multi_file_write:
            reasons.append("heavy write を誤 dispatch しないため queued")
            flags["queue_reason"] = "waiting_capacity"
            return "queued", "plan_only", reasons, claude_scores, flags
        return "plan_only", "plan_only", reasons, claude_scores, flags

    if multi_file_write and claude_pressure == "hard":
        reasons.append("Claude hard pressure のため multi-file write を流さない")
        flags["queue_reason"] = "waiting_capacity"
        return "queued", "plan_only", reasons, claude_scores, flags

    if heavy and multi_file_write and claude_pressure in {"high", "hard"}:
        reasons.append("heavy multi-file write は安全側で queued")
        flags["queue_reason"] = "waiting_capacity"
        return "queued", "plan_only", reasons, claude_scores, flags

    if is_single_department_light(intake, assignment) and openclaw_pressure == "normal":
        reasons.append("単一部門・軽タスクのため openclaw")
        return "openclaw", "openclaw", reasons, openclaw_scores, flags

    if heavy and claude.get("healthy", False) and claude_pressure == "normal":
        if assignment.get("active_subroles") or len(assignment.get("departments_involved", [])) > 1:
            reasons.append("重いコードタスク + Claude healthy + 複数役割のため split")
            return "split", "claude-code", reasons, claude_scores, flags
        reasons.append("重いコードタスク + Claude healthy のため claude_code")
        return "claude_code", "claude-code", reasons, claude_scores, flags

    if claude_scores["total"] > openclaw_scores["total"] and claude.get("healthy", False) and claude_pressure != "hard":
        reasons.append("score 優位のため claude_code")
        return "claude_code", "claude-code", reasons, claude_scores, flags

    if task.get("requested_route") == "claude-code" and claude_pressure != "hard":
        reasons.append("requested_route=claude-code を尊重")
        return "claude_code", "claude-code", reasons, claude_scores, flags

    if openclaw_pressure != "hard":
        reasons.append("safe fallback として openclaw")
        return "openclaw", "openclaw", reasons, openclaw_scores, flags

    reasons.append("安全側で plan_only")
    return "plan_only", "plan_only", reasons, openclaw_scores, flags


def build_provider_assignments(assignment: Dict[str, Any], execution_mode: str, *, auth_blocked: bool = False) -> Dict[str, Any]:
    if auth_blocked:
        lead_provider = "claude_code"
        lead_executor = "deferred"
    else:
        lead_provider = "claude_code" if execution_mode in {"claude_code", "split"} else "openclaw" if execution_mode == "openclaw" else "plan_only"
        lead_executor = "claude-code" if execution_mode in {"claude_code", "split"} else "openclaw" if execution_mode == "openclaw" else "deferred"
    subroles = []
    for role in assignment.get("active_subroles", []):
        provider = "openclaw" if execution_mode == "split" and not auth_blocked else lead_provider
        executor = "openclaw" if execution_mode == "split" and not auth_blocked else lead_executor
        subroles.append({"role": role, "provider": provider, "executor": executor})
    for role in assignment.get("advisory_subroles", []):
        subroles.append({"role": role, "provider": "openclaw", "executor": "openclaw", "mode": "advisory"})
    return {
        "lead": {
            "role": assignment["lead_role"],
            "provider": lead_provider,
            "executor": lead_executor,
        },
        "subroles": subroles,
    }


def build_dispatch_plan(task: Dict[str, Any], assignment: Dict[str, Any]) -> Dict[str, Any]:
    policy = load_json_like(CONFIG_ROOT / "capacity-policy.yaml")
    snapshot = build_capacity_snapshot(task["task_id"])
    intake = analyze_task(task)
    execution_mode, selected_executor, reasons, scores, flags = choose_execution_mode(task, intake, assignment, snapshot, policy)
    auth_blocked = bool(flags.get("auth_blocked"))
    selected_provider = "claude_code" if auth_blocked or execution_mode in {"claude_code", "split"} else "openclaw" if execution_mode == "openclaw" else "plan_only"
    selected_lane = "none"
    selection_reasons: List[str] = []
    fallback_chain: List[str] = []
    lane_snapshot: Dict[str, Any] = {}
    queue_reason = flags.get("queue_reason")
    primary_mode = load_claude_code_config().get("primary_mode", "acp")
    if selected_provider == "claude_code":
        selected_lane, selection_reasons, fallback_chain, lane_snapshot, lane_queue_reason = select_claude_lane(task, snapshot["providers"]["claude_code"])
        if lane_queue_reason:
            queue_reason = lane_queue_reason
            if lane_queue_reason == "waiting_auth":
                execution_mode = "plan_only"
                auth_blocked = True
            elif execution_mode != "plan_only":
                execution_mode = "queued"
    publish_policy = {
        "auto_publish_allowed": not (bool(intake.get("protected_paths")) and execution_mode in {"split", "claude_code", "plan_only", "queued"}),
        "block_on_degraded_success": bool(intake.get("protected_paths")),
        "protected_paths": intake.get("protected_paths", []),
    }
    plan = {
        "task_id": task["task_id"],
        "dispatch_id": new_operation_id("dispatch"),
        "execution_mode": execution_mode,
        "selected_provider": selected_provider,
        "selected_executor": selected_executor,
        "assignment_contract": {
            "lead_role": assignment["lead_role"],
            "advisory_subroles": assignment.get("advisory_subroles", []),
            "active_subroles": assignment.get("active_subroles", []),
            "mandatory_review_roles": assignment.get("mandatory_review_roles", []),
        },
        "provider_assignments": build_provider_assignments(assignment, execution_mode, auth_blocked=auth_blocked),
        "scores": scores,
        "reasons": reasons,
        "capacity_snapshot_ref": f".openclaw/tasks/{task['task_id']}/capacity-snapshot.json",
        "publish_policy": publish_policy,
        "captured_at": snapshot["captured_at"],
        "auth_blocked": auth_blocked,
        "pre_auth_openclaw_phase": bool(flags.get("pre_auth_openclaw_phase")),
        "primary_mode": primary_mode,
        "selected_lane": selected_lane,
        "selection_reasons": selection_reasons,
        "fallback_chain": fallback_chain,
        "lane_health_snapshot": lane_snapshot,
        "task_type": "plan_only" if is_plan_only_task(task) else "write" if is_write_task(task) else "read_only",
    }
    if queue_reason:
        plan["queue_reason"] = queue_reason
    temp = task_paths(task["task_id"])["dir"] / "dispatch-plan.validate.json"
    temp.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ensure_schema_valid(temp, "dispatch-plan")
    paths = task_paths(task["task_id"])
    lane_selection_payload = {
        "task_id": task["task_id"],
        "provider": selected_provider,
        "primary_mode": primary_mode,
        "selected_lane": selected_lane,
        "fallback_chain": fallback_chain,
        "selection_reasons": selection_reasons,
        "lane_health_snapshot": lane_snapshot,
        "captured_at": snapshot["captured_at"],
        "version": 1,
    }
    atomic_write_json(paths["capacity_snapshot"], snapshot)
    atomic_write_json(paths["dispatch"], plan)
    write_lane_selection_artifact(paths["lane_selection"], lane_selection_payload)
    atomic_write_json(CAPACITY_RUNTIME_ROOT / "latest-capacity.json", snapshot)
    return plan


def main() -> int:
    args = parse_args()
    task = load_task(args)
    if "task_id" not in task:
        raise ValidationError("task_id missing")
    assignment = load_assignment_plan(task["task_id"], args.assignment_plan)
    plan = build_dispatch_plan(task, assignment)
    if args.output:
        atomic_write_json(Path(args.output), plan)
    print(json.dumps(plan, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
