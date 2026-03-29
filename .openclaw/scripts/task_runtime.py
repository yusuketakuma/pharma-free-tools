#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import sys
import tempfile
import uuid
from contextlib import contextmanager
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = ROOT.parent
TASKS_ROOT = ROOT / "tasks"
CONFIG_ROOT = ROOT / "config"
SCHEMAS_ROOT = ROOT / "schemas"
QUEUE_ROOT = ROOT / "runtime" / "queue"
METRICS_ROOT = ROOT / "runtime" / "metrics"
QUEUE_REASONS = (
    "waiting_auth",
    "waiting_approval",
    "waiting_capacity",
    "waiting_manual_review",
)
QUEUE_SCHEMA_VERSION = 1
LANE_SELECTION_SCHEMA_VERSION = 1
DISPATCH_ATTEMPT_SCHEMA_VERSION = 1
DEFAULT_CLAUDE_CODE_BIN = "claude"
DEFAULT_CLAUDE_CODE_CONFIG: Dict[str, Any] = {
    "mode": "mock",
    "primary_mode": "acp",
    "secondary_mode": "cli",
    "backend_safety_net": "cli",
    "bin": DEFAULT_CLAUDE_CODE_BIN,
    "model": "sonnet",
    "permission_mode_default": "default",
    "permission_mode_execute": "bypassPermissions",
    "timeout_sec": 900,
    "max_turns": 12,
    "max_budget_usd": 5.0,
    "use_json_schema": True,
    "save_raw_response": True,
    "settings_strategy": "ephemeral_file",
    "use_bare_for_low_risk": False,
    "restrict_tools": [],
    "allow_result_json_fallback": True,
    "fallback_accept_root_json_string": True,
    "fallback_accept_single_fenced_json": True,
    "fallback_accept_free_text_json": False,
    "retry_on_json_schema_cold_start": 1,
    "auto_publish_requires_strict_output_for_write_tasks": True,
    "auth": {
        "mode": "auto",
        "required": True,
        "fail_closed": True,
        "persist_artifacts": True,
        "allow_login_hint": True,
        "preferred_setting_sources": "user,project,local",
        "use_ephemeral_settings": True,
        "primary_method": "claude_subscription",
        "allowed_methods": ["claude_subscription"],
        "setup_token_positioning": "disabled_for_this_workspace",
    },
}

LIFECYCLE_STATES = [
    "RECEIVED",
    "ROUTED",
    "WAITING_APPROVAL",
    "AUTH_REQUIRED",
    "READY_FOR_EXECUTION",
    "WAITING_CAPACITY",
    "WAITING_MANUAL_REVIEW",
    "RUNNING",
    "REVIEWING",
    "PUBLISHED",
    "ROUTE_FAILED",
    "EXECUTION_FAILED",
    "REVIEW_FAILED",
    "REJECTED",
    "CANCELLED",
]

HEAVY_KEYWORDS = [
    "implement",
    "implementation",
    "refactor",
    "multi",
    "build",
    "feature",
    "migrate",
    "fix",
    "bug",
    "test",
    "adapter",
    "schema",
    "task lifecycle",
]


class TaskRuntimeError(Exception):
    pass


class ValidationError(TaskRuntimeError):
    pass


class LockError(TaskRuntimeError):
    pass


class ApprovalError(TaskRuntimeError):
    pass


class PublishError(TaskRuntimeError):
    pass


class StateError(TaskRuntimeError):
    pass


@contextmanager
def task_lock(task_dir: Path):
    lock_path = task_dir / ".lock"
    task_dir.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError as exc:
        raise LockError(f"task lock already exists: {lock_path}") from exc
    try:
        os.write(fd, f"pid={os.getpid()} created_at={now_iso()}\n".encode("utf-8"))
        os.close(fd)
        yield lock_path
    finally:
        try:
            lock_path.unlink()
        except FileNotFoundError:
            pass


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def new_operation_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def parse_iso_or_none(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except Exception:  # noqa: BLE001
        return None


def normalize_path(path: str) -> str:
    path = path.strip().replace("\\", "/")
    if not path:
        return path
    if path.startswith(str(WORKSPACE_ROOT)):
        path = str(Path(path).resolve().relative_to(WORKSPACE_ROOT.resolve())).replace("\\", "/")
    while path.startswith("./"):
        path = path[2:]
    return path


def task_paths(task_id: str) -> Dict[str, Path]:
    base = TASKS_ROOT / task_id
    return {
        "dir": base,
        "task": base / "task.json",
        "state": base / "state.json",
        "route": base / "route-decision.json",
        "assignment": base / "assignment-plan.json",
        "capacity_snapshot": base / "capacity-snapshot.json",
        "dispatch": base / "dispatch-plan.json",
        "lane_selection": base / "lane-selection.json",
        "dispatch_attempts": base / "dispatch-attempts.jsonl",
        "context": base / "context-pack.md",
        "request": base / "execution-request.json",
        "prompt": base / "rendered-prompt.txt",
        "settings": base / "claude-settings.json",
        "raw": base / "claude-raw.json",
        "auth_status": base / "auth-status.json",
        "auth_log": base / "auth-preflight.log",
        "stdout": base / "execution.stdout.log",
        "stderr": base / "execution.stderr.log",
        "result": base / "execution-result.json",
        "review": base / "review-report.json",
        "final": base / "final-response.md",
        "lifecycle": base / "lifecycle.log",
        "queue_status": base / "queue-status.json",
        "manual_review_status": base / "manual-review-status.json",
    }


def atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=path.name + ".", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(content)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def atomic_write_json(path: Path, payload: Dict[str, Any] | List[Any]) -> None:
    atomic_write_text(path, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def append_jsonl(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(payload, ensure_ascii=False) + "\n")


def load_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        if not raw.strip():
            continue
        payload = json.loads(raw)
        if isinstance(payload, dict):
            rows.append(payload)
    return rows


def validate_jsonl_file(path: Path, schema_name: str) -> List[Dict[str, Any]]:
    rows = load_jsonl(path)
    validated: List[Dict[str, Any]] = []
    for idx, payload in enumerate(rows, start=1):
        if not isinstance(payload, dict):
            raise ValidationError(f"{schema_name}: line {idx} is not an object")
        validate_payload(schema_name, payload)
        validated.append(payload)
    return validated


def read_lane_selection_artifact(path: Path, default: Dict[str, Any] | None = None) -> Dict[str, Any]:
    if not path.exists():
        return dict(default or {})
    payload = ensure_schema_valid(path, "lane-selection")
    return payload


def write_lane_selection_artifact(path: Path, payload: Dict[str, Any]) -> Dict[str, Any]:
    validate_payload("lane-selection", payload)
    atomic_write_json(path, payload)
    return payload


def normalize_dispatch_attempt_payload(payload: Dict[str, Any], *, line_no: int | None = None) -> Dict[str, Any]:
    task_id = payload.get("task_id") or payload.get("taskId") or payload.get("id") or "unknown"
    dispatch_id = payload.get("dispatch_id") or payload.get("dispatchId") or payload.get("attempt_id") or payload.get("attemptId") or f"dispatch-legacy-{line_no or 0:02d}"
    dispatch_attempt_id = payload.get("dispatch_attempt_id") or payload.get("dispatchAttemptId") or payload.get("attempt_id") or payload.get("attemptId") or f"{dispatch_id}_attempt_{int(payload.get('attempt_index') or payload.get('attempt') or line_no or 1):02d}"
    lane = str(payload.get("lane") or payload.get("selected_lane") or payload.get("fallback_target") or payload.get("provider_lane") or payload.get("adapter") or "none")
    if lane not in {"acp", "cli", "cli_backend_safety_net", "none"}:
        lane = "cli_backend_safety_net" if "safety" in lane else "cli" if lane else "none"
    attempt_index_raw = payload.get("attempt_index") or payload.get("attempt") or payload.get("index") or line_no or 1
    try:
        attempt_index = int(attempt_index_raw)
    except Exception:  # noqa: BLE001
        attempt_index = max(int(line_no or 1), 1)
    status = str(payload.get("status") or payload.get("result") or payload.get("outcome") or "runtime_error")
    status_map = {
        "ok": "success",
        "passed": "success",
        "failure": "runtime_error",
        "error": "runtime_error",
        "failed": "failed",
        "timeout_error": "timeout",
    }
    status = status_map.get(status, status)
    if status not in {"success", "policy_blocked", "timeout", "runtime_error", "invalid_request", "invalid_result", "failed"}:
        status = "runtime_error"
    started_at = payload.get("started_at") or payload.get("startedAt") or payload.get("captured_at") or payload.get("at") or now_iso()
    finished_at = payload.get("finished_at") or payload.get("finishedAt") or payload.get("completed_at") or payload.get("captured_at") or started_at
    if parse_iso_or_none(started_at) is None:
        started_at = now_iso()
    if parse_iso_or_none(finished_at) is None:
        finished_at = started_at
    exit_code_raw = payload.get("exit_code")
    if exit_code_raw is None:
        exit_code_raw = 0 if status == "success" else 30
    try:
        exit_code = int(exit_code_raw)
    except Exception:  # noqa: BLE001
        exit_code = 0 if status == "success" else 30
    result_code = payload.get("result_code") or payload.get("resultCode")
    fallback_triggered = bool(payload.get("fallback_triggered") or payload.get("fallbackTriggered") or payload.get("fallback_target") or payload.get("fallbackTarget"))
    fallback_target = payload.get("fallback_target") or payload.get("fallbackTarget")
    if not fallback_triggered:
        fallback_target = None
    version = payload.get("version") if isinstance(payload.get("version"), int) and payload.get("version") >= 1 else DISPATCH_ATTEMPT_SCHEMA_VERSION
    normalized = {
        **payload,
        "task_id": str(task_id),
        "dispatch_id": str(dispatch_id),
        "dispatch_attempt_id": str(dispatch_attempt_id),
        "lane": lane,
        "attempt_index": max(attempt_index, 1),
        "started_at": str(started_at),
        "finished_at": str(finished_at),
        "status": status,
        "result_code": result_code,
        "fallback_triggered": fallback_triggered,
        "fallback_target": fallback_target,
        "exit_code": max(exit_code, 0),
        "version": version,
    }
    validate_payload("dispatch-attempt", normalized)
    return normalized


def migrate_dispatch_attempt_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for idx, payload in enumerate(rows, start=1):
        if not isinstance(payload, dict):
            continue
        normalized.append(normalize_dispatch_attempt_payload(payload, line_no=idx))
    return normalized


def load_dispatch_attempts_artifact(path: Path, default: List[Dict[str, Any]] | None = None) -> List[Dict[str, Any]]:
    if not path.exists():
        return list(default or [])
    try:
        return validate_jsonl_file(path, "dispatch-attempt")
    except ValidationError:
        legacy_rows = load_jsonl(path)
        normalized = migrate_dispatch_attempt_rows(legacy_rows)
        if not normalized and legacy_rows:
            raise
        rewritten = "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in normalized)
        backup_path = path.with_suffix(path.suffix + ".legacy.bak")
        if not backup_path.exists():
            atomic_write_text(backup_path, path.read_text(encoding="utf-8"))
        atomic_write_text(path, rewritten)
        return normalized


def append_dispatch_attempt_artifact(path: Path, payload: Dict[str, Any]) -> Dict[str, Any]:
    validate_payload("dispatch-attempt", payload)
    append_jsonl(path, payload)
    return payload


def queue_artifact_path(task_id: str, reason: str) -> Path:
    if reason not in QUEUE_REASONS:
        raise StateError(f"unknown queue reason: {reason}")
    return QUEUE_ROOT / reason / f"{task_id}.json"


def clear_runtime_queue_entries(task_id: str) -> None:
    for reason in QUEUE_REASONS:
        path = queue_artifact_path(task_id, reason)
        if path.exists():
            path.unlink()


def classify_queue_reason(
    state_payload: Dict[str, Any] | None = None,
    dispatch: Dict[str, Any] | None = None,
    result: Dict[str, Any] | None = None,
    review: Dict[str, Any] | None = None,
) -> str | None:
    state_payload = state_payload or {}
    dispatch = dispatch or {}
    result = result or {}
    review = review or {}

    state_name = str(state_payload.get("state") or "")
    result_meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
    result_code = str(result_meta.get("result_code") or "")
    queue_reason = str(dispatch.get("queue_reason") or "").lower()
    dispatch_reasons = [str(item).lower() for item in dispatch.get("reasons", []) if isinstance(item, str)]
    classification = str(review.get("result_classification") or "")

    if state_name in {"REVIEW_FAILED", "EXECUTION_FAILED", "ROUTE_FAILED", "REJECTED", "CANCELLED", "PUBLISHED", "REVIEWING", "RUNNING", "READY_FOR_EXECUTION", "ROUTED"}:
        return None
    if state_name == "AUTH_REQUIRED" or result_code == "AUTH_REQUIRED":
        return "waiting_auth"
    if state_name == "WAITING_APPROVAL":
        return "waiting_approval"
    if state_name == "WAITING_CAPACITY":
        return "waiting_capacity"
    if state_name == "WAITING_MANUAL_REVIEW":
        return "waiting_manual_review"
    if dispatch.get("execution_mode") == "queued":
        return "waiting_capacity"
    if queue_reason in QUEUE_REASONS:
        return queue_reason
    if "pressure" in queue_reason or "capacity" in queue_reason:
        return "waiting_capacity"
    if any(token in dispatch_reason for dispatch_reason in dispatch_reasons for token in ("pressure", "capacity", "queued")):
        return "waiting_capacity"
    if review.get("requires_manual_review"):
        return "waiting_manual_review"
    if classification in {"degraded_success_protected", "degraded_success_write"}:
        return "waiting_manual_review"
    return None


def queue_resume_target(reason: str | None) -> str | None:
    mapping = {
        "waiting_auth": "READY_FOR_EXECUTION",
        "waiting_approval": "READY_FOR_EXECUTION",
        "waiting_capacity": "READY_FOR_EXECUTION",
        "waiting_manual_review": "REVIEWING",
    }
    return mapping.get(reason)


def queue_resume_blockers(reason: str | None, state_payload: Dict[str, Any], dispatch: Dict[str, Any], review: Dict[str, Any]) -> List[str]:
    approval = state_payload.get("approval") if isinstance(state_payload.get("approval"), dict) else {}
    blockers: List[str] = []
    if reason == "waiting_auth":
        blockers.append("claude_auth_unavailable")
        if dispatch.get("auth_blocked"):
            blockers.append("resume_requires_claude_auth")
    elif reason == "waiting_approval":
        if not approval.get("approved"):
            blockers.append("approval_pending")
    elif reason == "waiting_capacity":
        blockers.append("provider_capacity_unavailable")
    elif reason == "waiting_manual_review":
        if review.get("requires_manual_review"):
            blockers.append("manual_review_pending")
        if review.get("publishable") is False:
            blockers.append("publish_blocked_until_manual_review")
    return blockers


def build_queue_payload(
    task_id: str,
    *,
    reason: str | None,
    current_state: Dict[str, Any],
    current_route: Dict[str, Any],
    current_dispatch: Dict[str, Any],
    current_review: Dict[str, Any],
    existing: Dict[str, Any],
    rebalanced_at: str | None,
) -> Dict[str, Any]:
    now = now_iso()
    blockers = queue_resume_blockers(reason, current_state, current_dispatch, current_review)
    payload = {
        "task_id": task_id,
        "active": bool(reason),
        "queue_reason": reason,
        "last_queue_reason": reason or existing.get("queue_reason") or existing.get("last_queue_reason"),
        "state": current_state.get("state"),
        "route": current_state.get("route") or current_route.get("decision"),
        "route_decision_id": current_state.get("route_decision_id") or current_route.get("route_decision_id"),
        "approval_id": current_state.get("approval_id"),
        "dispatch_id": current_state.get("dispatch_id") or current_dispatch.get("dispatch_id"),
        "queued_at": existing.get("queued_at"),
        "released_at": existing.get("released_at"),
        "last_rebalanced_at": rebalanced_at or existing.get("last_rebalanced_at"),
        "resume_target_state": queue_resume_target(reason),
        "resume_eligible": False,
        "resume_blockers": blockers,
        "updated_at": now,
        "version": QUEUE_SCHEMA_VERSION,
    }
    return payload


def validate_runtime_queue_artifact(payload: Dict[str, Any], *, runtime: bool) -> None:
    validate_payload("runtime-queue-entry" if runtime else "queue-status", payload)


def load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def append_lifecycle(task_dir: Path, state: str, message: str, details: Dict[str, Any] | None = None) -> None:
    line = {
        "at": now_iso(),
        "state": state,
        "message": message,
        "details": details or {},
    }
    lifecycle_path = task_dir / "lifecycle.log"
    lifecycle_path.parent.mkdir(parents=True, exist_ok=True)
    with lifecycle_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(line, ensure_ascii=False) + "\n")


def update_state(task_id: str, state: str, **extra: Any) -> Dict[str, Any]:
    if state not in LIFECYCLE_STATES:
        raise StateError(f"unknown lifecycle state: {state}")
    paths = task_paths(task_id)
    payload = load_json(paths["state"], default={}) or {}
    payload.update(extra)
    payload.update({
        "task_id": task_id,
        "state": state,
        "updated_at": now_iso(),
    })
    if "history" not in payload:
        payload["history"] = []
    history_entry = {
        "state": state,
        "at": payload["updated_at"],
    }
    for key in ("route_decision_id", "approval_id", "dispatch_id", "message"):
        if key in extra and extra[key]:
            history_entry[key] = extra[key]
    payload["history"].append(history_entry)
    atomic_write_json(paths["state"], payload)
    append_lifecycle(paths["dir"], state, extra.get("message", "state updated"), extra)
    return payload


def parse_scalar(raw: str) -> Any:
    value = raw.strip()
    if value == "":
        return ""
    if value.startswith(("'", '"')) and value.endswith(("'", '"')) and len(value) >= 2:
        return value[1:-1]
    lowered = value.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if lowered in {"null", "none"}:
        return None
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?\d+\.\d+", value):
        return float(value)
    return value


def parse_simple_yaml(text: str) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    current_list_key: str | None = None
    current_indent = 0
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip(" "))
        stripped = line.strip()
        if stripped.startswith("- "):
            if current_list_key is None or indent <= current_indent:
                raise ValidationError(f"invalid yaml-like list item: {raw}")
            data.setdefault(current_list_key, []).append(parse_scalar(stripped[2:]))
            continue
        current_list_key = None
        current_indent = indent
        match = re.match(r"^([A-Za-z0-9_.-]+):(?:\s+(.*))?$", stripped)
        if not match:
            raise ValidationError(f"invalid yaml-like line: {raw}")
        key, value = match.groups()
        if value is None:
            data[key] = []
            current_list_key = key
            continue
        data[key] = parse_scalar(value)
    return data


def parse_simple_yaml_list(text: str, key: str) -> List[str]:
    results: List[str] = []
    in_section = False
    section_indent: int | None = None
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip(" "))
        stripped = line.strip()
        if re.match(rf"^{re.escape(key)}:\s*$", stripped):
            in_section = True
            section_indent = indent
            continue
        if in_section:
            if indent <= (section_indent or 0) and not stripped.startswith("-"):
                break
            item = re.match(r"^-\s+(.+)$", stripped)
            if item:
                results.append(str(parse_scalar(item.group(1))))
    return results


def normalize_claude_auth_method(value: Any) -> str | None:
    raw = str(value or "").strip().lower().replace("-", "_")
    if not raw:
        return None
    aliases = {
        "claude.ai": "claude_subscription",
        "claude_ai": "claude_subscription",
        "oauth": "claude_subscription",
        "subscription": "claude_subscription",
        "api_key": "api_key",
        "anthropic_api_key": "api_key",
        "setup_token": "setup_token",
    }
    return aliases.get(raw, raw)



def evaluate_claude_auth_status(parsed: Any, auth_config: Dict[str, Any] | None = None) -> Tuple[bool, str | None, str | None]:
    auth_cfg = auth_config or {}
    logged_in = bool(isinstance(parsed, dict) and (parsed.get("loggedIn") or parsed.get("authenticated") or parsed.get("ok")))
    if not logged_in:
        return False, None, "claude auth not logged in"
    normalized_method = normalize_claude_auth_method((parsed or {}).get("authMethod") or (parsed or {}).get("method"))
    allowed_methods = auth_cfg.get("allowed_methods") or [auth_cfg.get("primary_method") or "claude_subscription"]
    if not isinstance(allowed_methods, list):
        allowed_methods = [allowed_methods]
    allowed_methods = [str(item) for item in allowed_methods if str(item).strip()]
    if allowed_methods and normalized_method not in allowed_methods:
        return False, normalized_method, f"unsupported auth method for this workspace: {normalized_method or 'unknown'}"
    return True, normalized_method, None



def load_approval_policy() -> Dict[str, Any]:
    path = CONFIG_ROOT / "approval-policy.yaml"
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    patterns = [m.group(1) for m in re.finditer(r'-\s+pattern:\s+"([^"]+)"', text)]
    actions = parse_simple_yaml_list(text, "high_risk_actions")
    return {
        "patterns": patterns or [".git/**", ".openclaw/config/**", "org/**", "CURRENT_STATUS.md"],
        "high_risk_actions": actions,
    }


def load_claude_code_config() -> Dict[str, Any]:
    path = CONFIG_ROOT / "claude-code.yaml"
    config = dict(DEFAULT_CLAUDE_CODE_CONFIG)
    config["auth"] = dict(DEFAULT_CLAUDE_CODE_CONFIG["auth"])
    if path.exists():
        raw_text = path.read_text(encoding="utf-8")
        top_level_lines = []
        in_auth_block = False
        for raw in raw_text.splitlines():
            if raw.strip() == "auth:":
                in_auth_block = True
                continue
            if in_auth_block:
                if raw.startswith("  ") or not raw.strip() or raw.lstrip().startswith("#"):
                    continue
                in_auth_block = False
            if not in_auth_block:
                top_level_lines.append(raw)
        parsed = parse_simple_yaml("\n".join(top_level_lines))
        if "claude_code_bin" in parsed and "bin" not in parsed:
            parsed["bin"] = parsed["claude_code_bin"]
        for key in DEFAULT_CLAUDE_CODE_CONFIG:
            if key == "auth":
                continue
            if key in parsed and parsed[key] is not None:
                config[key] = parsed[key]

        auth_section = {}
        in_auth = False
        for raw in raw_text.splitlines():
            if not raw.strip() or raw.lstrip().startswith("#"):
                continue
            indent = len(raw) - len(raw.lstrip(" "))
            stripped = raw.strip()
            if stripped == "auth:":
                in_auth = True
                continue
            if in_auth:
                if indent <= 0 and not stripped.startswith("-"):
                    break
                if indent >= 2 and ":" in stripped:
                    key, value = stripped.split(":", 1)
                    auth_section[key.strip()] = parse_scalar(value.strip())
        auth_allowed_methods = parse_simple_yaml_list(raw_text, "allowed_methods")
        if auth_allowed_methods:
            auth_section["allowed_methods"] = auth_allowed_methods
        for key, value in auth_section.items():
            if value is not None:
                config["auth"][key] = value

    config["bin"] = str(config.get("bin") or DEFAULT_CLAUDE_CODE_BIN)
    config["mode"] = str(config.get("mode") or "mock")
    config["primary_mode"] = str(config.get("primary_mode") or "acp")
    config["secondary_mode"] = str(config.get("secondary_mode") or "cli")
    config["backend_safety_net"] = str(config.get("backend_safety_net") or "cli")
    config["model"] = str(config.get("model") or "sonnet")
    for key in ("timeout_sec", "max_turns", "retry_on_json_schema_cold_start"):
        config[key] = int(config[key])
    config["max_budget_usd"] = float(config["max_budget_usd"])
    for key in (
        "use_json_schema",
        "save_raw_response",
        "use_bare_for_low_risk",
        "allow_result_json_fallback",
        "fallback_accept_root_json_string",
        "fallback_accept_single_fenced_json",
        "fallback_accept_free_text_json",
        "auto_publish_requires_strict_output_for_write_tasks",
    ):
        config[key] = bool(config[key])
    config["settings_strategy"] = str(config.get("settings_strategy") or "ephemeral_file")
    restrict_tools = config.get("restrict_tools") or []
    if not isinstance(restrict_tools, list):
        raise ValidationError("claude-code config: restrict_tools must be a list")
    config["restrict_tools"] = [str(item) for item in restrict_tools]
    auth = config.get("auth") or {}
    if not isinstance(auth, dict):
        raise ValidationError("claude-code config: auth must be an object")
    merged_auth = dict(DEFAULT_CLAUDE_CODE_CONFIG["auth"])
    merged_auth.update(auth)
    for key in ("required", "fail_closed", "persist_artifacts", "allow_login_hint", "use_ephemeral_settings"):
        merged_auth[key] = bool(merged_auth[key])
    merged_auth["mode"] = str(merged_auth.get("mode") or "auto")
    merged_auth["preferred_setting_sources"] = str(merged_auth.get("preferred_setting_sources") or "user,project,local")
    merged_auth["primary_method"] = str(merged_auth.get("primary_method") or "claude_subscription")
    allowed_methods = merged_auth.get("allowed_methods") or [merged_auth["primary_method"]]
    if not isinstance(allowed_methods, list):
        allowed_methods = [allowed_methods]
    merged_auth["allowed_methods"] = [str(item) for item in allowed_methods if str(item).strip()]
    merged_auth["setup_token_positioning"] = str(merged_auth.get("setup_token_positioning") or "disabled_for_this_workspace")
    config["auth"] = merged_auth
    validate_claude_code_config(config)
    return config


def resolve_claude_code_bin(config: Dict[str, Any] | None = None) -> Tuple[str, str]:
    env_value = os.environ.get("CLAUDE_CODE_BIN")
    if env_value:
        return env_value, "env"
    effective = config or load_claude_code_config()
    yaml_value = effective.get("bin")
    if yaml_value:
        return str(yaml_value), "yaml"
    return DEFAULT_CLAUDE_CODE_BIN, "default"


def detect_protected_paths(paths: Iterable[str], actions: Iterable[str] | None = None) -> List[str]:
    policy = load_approval_policy()
    normalized = [normalize_path(p) for p in paths if normalize_path(p)]
    matched = []
    for path in normalized:
        for pattern in policy["patterns"]:
            if fnmatch.fnmatch(path, pattern):
                matched.append(path)
                break
    if actions:
        high_risk = set(policy["high_risk_actions"])
        if any(action in high_risk for action in actions):
            for path in normalized:
                if path not in matched:
                    matched.append(path)
    return sorted(set(matched))


def validate_json_value(schema: Dict[str, Any], payload: Any, path: str) -> None:
    if isinstance(schema.get("type"), list):
        allowed = schema["type"]
        last_error: ValidationError | None = None
        for allowed_type in allowed:
            try:
                validate_json_value({**schema, "type": allowed_type}, payload, path)
                return
            except ValidationError as exc:
                last_error = exc
        raise last_error or ValidationError(f"{path}: invalid value")

    expected_type = schema.get("type")
    if expected_type == "object":
        if not isinstance(payload, dict):
            raise ValidationError(f"{path}: expected object")
        required = schema.get("required", [])
        missing = [key for key in required if key not in payload]
        if missing:
            raise ValidationError(f"{path}: missing required fields: {', '.join(missing)}")
        properties = schema.get("properties", {})
        for key, subschema in properties.items():
            if key in payload:
                validate_json_value(subschema, payload[key], f"{path}.{key}")
        if schema.get("additionalProperties") is False:
            extra_keys = [key for key in payload if key not in properties]
            if extra_keys:
                raise ValidationError(f"{path}: unexpected fields: {', '.join(extra_keys)}")
        return
    if expected_type == "array":
        if not isinstance(payload, list):
            raise ValidationError(f"{path}: expected array")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for idx, item in enumerate(payload):
                validate_json_value(item_schema, item, f"{path}[{idx}]")
        return
    if expected_type == "string" and not isinstance(payload, str):
        raise ValidationError(f"{path}: expected string")
    if expected_type == "integer" and (not isinstance(payload, int) or isinstance(payload, bool)):
        raise ValidationError(f"{path}: expected integer")
    if expected_type == "number" and not ((isinstance(payload, int) and not isinstance(payload, bool)) or isinstance(payload, float)):
        raise ValidationError(f"{path}: expected number")
    if expected_type == "boolean" and not isinstance(payload, bool):
        raise ValidationError(f"{path}: expected boolean")
    if expected_type == "null" and payload is not None:
        raise ValidationError(f"{path}: expected null")
    if "enum" in schema and payload not in schema["enum"]:
        raise ValidationError(f"{path}: invalid value: {payload}")
    if isinstance(payload, (int, float)) and not isinstance(payload, bool):
        if "minimum" in schema and payload < schema["minimum"]:
            raise ValidationError(f"{path}: must be >= {schema['minimum']}")
        if "maximum" in schema and payload > schema["maximum"]:
            raise ValidationError(f"{path}: must be <= {schema['maximum']}")


def load_schema(schema_name: str) -> Dict[str, Any]:
    path = SCHEMAS_ROOT / f"{schema_name}.schema.json"
    if not path.exists():
        raise ValidationError(f"schema not found: {schema_name}")
    schema = load_json(path)
    if not isinstance(schema, dict):
        raise ValidationError(f"schema is not an object: {path}")
    return schema


def validate_runtime_semantics(schema_name: str, payload: Dict[str, Any]) -> None:
    if schema_name == "execution-result":
        status = payload.get("status")
        exit_code = payload.get("exit_code")
        if status == "success" and exit_code != 0:
            raise ValidationError("execution-result: success requires exit_code=0")
        if status != "success" and exit_code == 0:
            raise ValidationError("execution-result: non-success requires non-zero exit_code")
        for key in ("started_at", "finished_at"):
            try:
                datetime.fromisoformat(str(payload.get(key)))
            except Exception as exc:  # noqa: BLE001
                raise ValidationError(f"execution-result: invalid ISO timestamp in {key}") from exc
        meta = payload.get("_meta") if isinstance(payload.get("_meta"), dict) else {}
        result_code = meta.get("result_code")
        if result_code == "AUTH_REQUIRED" and status != "runtime_error":
            raise ValidationError("execution-result: AUTH_REQUIRED must use status=runtime_error")
        if result_code == "AUTH_REQUIRED" and exit_code == 0:
            raise ValidationError("execution-result: AUTH_REQUIRED requires non-zero exit_code")
        if status == "success" and meta.get("fallback_used"):
            required_meta = [
                "normalization_source",
                "fallback_used",
                "retry_count",
                "cli_version",
                "raw_sha256",
                "degraded_contract",
            ]
            missing = [key for key in required_meta if key not in meta]
            if missing:
                raise ValidationError(
                    "execution-result: degraded success missing _meta fields: " + ", ".join(missing)
                )
    elif schema_name == "execution-request":
        if payload.get("executor") != "claude-code":
            raise ValidationError("execution-request: executor must be claude-code")
    elif schema_name == "route-decision":
        if payload.get("approval_required") and not payload.get("protected_paths"):
            raise ValidationError("route-decision: approval_required=true needs protected_paths")
    elif schema_name == "lane-selection":
        if payload.get("primary_mode") not in {"acp", "cli"}:
            raise ValidationError("lane-selection: primary_mode must be one of acp|cli")
        if payload.get("selected_lane") not in {"acp", "cli", "cli_backend_safety_net", "none"}:
            raise ValidationError("lane-selection: selected_lane must be a known lane")
        if parse_iso_or_none(payload.get("captured_at")) is None:
            raise ValidationError("lane-selection: captured_at must be ISO timestamp")
        lane_health_snapshot = payload.get("lane_health_snapshot") if isinstance(payload.get("lane_health_snapshot"), dict) else {}
        snapshot_captured_at = lane_health_snapshot.get("captured_at")
        if snapshot_captured_at is not None and parse_iso_or_none(snapshot_captured_at) is None:
            raise ValidationError("lane-selection: lane_health_snapshot.captured_at must be ISO timestamp or null")
        if payload.get("version") != LANE_SELECTION_SCHEMA_VERSION:
            raise ValidationError(f"lane-selection: version must be {LANE_SELECTION_SCHEMA_VERSION}")
    elif schema_name == "dispatch-attempt":
        for field in ("started_at", "finished_at"):
            if parse_iso_or_none(payload.get(field)) is None:
                raise ValidationError(f"dispatch-attempt: {field} must be ISO timestamp")
        if payload.get("attempt_index") != int(payload.get("attempt_index") or 0):
            raise ValidationError("dispatch-attempt: attempt_index must be an integer")
        fallback_triggered = bool(payload.get("fallback_triggered"))
        fallback_target = payload.get("fallback_target")
        if fallback_triggered and not fallback_target:
            raise ValidationError("dispatch-attempt: fallback_target is required when fallback_triggered=true")
        if not fallback_triggered and fallback_target is not None:
            raise ValidationError("dispatch-attempt: fallback_target must be null when fallback_triggered=false")
        if payload.get("version") != DISPATCH_ATTEMPT_SCHEMA_VERSION:
            raise ValidationError(f"dispatch-attempt: version must be {DISPATCH_ATTEMPT_SCHEMA_VERSION}")
    elif schema_name in {"queue-status", "runtime-queue-entry"}:
        reason = payload.get("queue_reason")
        target = payload.get("resume_target_state")
        if reason is None:
            if target is not None:
                raise ValidationError(f"{schema_name}: inactive queue must not set resume_target_state")
        else:
            if reason not in QUEUE_REASONS:
                raise ValidationError(f"{schema_name}: invalid queue_reason={reason}")
            expected = queue_resume_target(reason)
            if target != expected:
                raise ValidationError(f"{schema_name}: resume_target_state must be {expected} for {reason}")
        if payload.get("queued_at") is not None and parse_iso_or_none(payload.get("queued_at")) is None:
            raise ValidationError(f"{schema_name}: queued_at must be ISO timestamp or null")
        for field in ("last_rebalanced_at", "released_at", "updated_at"):
            value = payload.get(field)
            if value is not None and parse_iso_or_none(value) is None:
                raise ValidationError(f"{schema_name}: {field} must be ISO timestamp or null")
        if payload.get("version") != QUEUE_SCHEMA_VERSION:
            raise ValidationError(f"{schema_name}: version must be {QUEUE_SCHEMA_VERSION}")


def validate_claude_code_config(config: Dict[str, Any]) -> None:
    if config["mode"] not in {"mock", "cli", "sdk"}:
        raise ValidationError("claude-code config: mode must be one of mock|cli|sdk")
    if config["primary_mode"] not in {"acp", "cli"}:
        raise ValidationError("claude-code config: primary_mode must be one of acp|cli")
    if config["secondary_mode"] not in {"cli"}:
        raise ValidationError("claude-code config: secondary_mode must remain cli")
    if config["backend_safety_net"] not in {"cli"}:
        raise ValidationError("claude-code config: backend_safety_net must remain cli")
    for key in ("permission_mode_default", "permission_mode_execute"):
        if not str(config.get(key) or "").strip():
            raise ValidationError(f"claude-code config: {key} must be non-empty")
    if config["timeout_sec"] <= 0:
        raise ValidationError("claude-code config: timeout_sec must be > 0")
    if config["max_turns"] <= 0:
        raise ValidationError("claude-code config: max_turns must be > 0")
    if config["max_budget_usd"] < 0:
        raise ValidationError("claude-code config: max_budget_usd must be >= 0")
    if config["settings_strategy"] not in {"ephemeral_file", "inline", "none"}:
        raise ValidationError("claude-code config: settings_strategy must be one of ephemeral_file|inline|none")
    if config["retry_on_json_schema_cold_start"] < 0:
        raise ValidationError("claude-code config: retry_on_json_schema_cold_start must be >= 0")
    if config["fallback_accept_free_text_json"]:
        raise ValidationError("claude-code config: fallback_accept_free_text_json must remain false")
    auth = config.get("auth") or {}
    if auth.get("mode") not in {"auto", "required", "disabled"}:
        raise ValidationError("claude-code config: auth.mode must be one of auto|required|disabled")
    if auth.get("required") and not auth.get("fail_closed"):
        raise ValidationError("claude-code config: auth.required=true must keep fail_closed=true")
    primary_method = str(auth.get("primary_method") or "")
    if primary_method != "claude_subscription":
        raise ValidationError("claude-code config: auth.primary_method must remain claude_subscription in this workspace")
    allowed_methods = auth.get("allowed_methods") or []
    if not isinstance(allowed_methods, list) or allowed_methods != ["claude_subscription"]:
        raise ValidationError("claude-code config: auth.allowed_methods must remain ['claude_subscription'] in this workspace")


def build_task_record(task_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    record = {
        "task_id": task_id,
        "task": payload.get("task") or payload.get("task_summary") or "",
        "requested_paths": [normalize_path(p) for p in payload.get("requested_paths", payload.get("target_paths", []))],
        "constraints": payload.get("constraints", []),
        "verification_commands": payload.get("verification_commands", []),
        "review_focus": payload.get("review_focus", []),
        "requested_actions": payload.get("requested_actions", []),
        "requested_route": payload.get("requested_route"),
        "created_at": payload.get("created_at") or now_iso(),
    }
    for key in ("mock_mode", "direct_response", "metadata"):
        if key in payload:
            record[key] = payload[key]
    return record


def route_task(task: Dict[str, Any]) -> Dict[str, Any]:
    requested_paths = task.get("requested_paths", [])
    protected_paths = detect_protected_paths(requested_paths, task.get("requested_actions", []))
    text = (task.get("task") or "").lower()
    heavy = (
        task.get("requested_route") == "claude-code"
        or len(requested_paths) > 1
        or len(task.get("verification_commands", [])) > 1
        or any(keyword in text for keyword in HEAVY_KEYWORDS)
    )
    decision = "claude-code" if heavy else "openclaw"
    reasons = []
    if heavy:
        reasons.append("task appears multi-step or implementation-heavy")
    else:
        reasons.append("task is small enough for direct OpenClaw handling")
    if protected_paths:
        reasons.append("protected paths detected by routing policy")
    if task.get("requested_route"):
        reasons.append(f"requested_route={task['requested_route']}")
    score = 0.85 if heavy else 0.2
    if protected_paths:
        score = max(score, 0.95)
    route = {
        "task_id": task["task_id"],
        "route_decision_id": new_operation_id("route"),
        "decision": decision,
        "score": score,
        "reasons": reasons,
        "approval_required": bool(protected_paths),
        "protected_paths": protected_paths,
        "affected_paths": requested_paths,
    }
    validate_payload("route-decision", route)
    return route


def build_context_pack(task: Dict[str, Any], route: Dict[str, Any]) -> str:
    lines = [
        f"# Context Pack: {task['task_id']}",
        "",
        f"- task: {task['task']}",
        f"- route: {route['decision']}",
        f"- route_decision_id: {route.get('route_decision_id', '(none)')}",
        f"- approval_required: {str(route['approval_required']).lower()}",
        f"- protected_paths: {', '.join(route['protected_paths']) if route['protected_paths'] else '(none)'}",
        "",
        "## Constraints",
    ]
    constraints = task.get("constraints") or ["No additional constraints provided"]
    lines.extend([f"- {item}" for item in constraints])
    lines.extend(["", "## Target Paths"])
    target_paths = task.get("requested_paths") or ["(none)"]
    lines.extend([f"- {item}" for item in target_paths])
    lines.extend(["", "## Verification Commands"])
    verification_commands = task.get("verification_commands") or ["(manual review only)"]
    lines.extend([f"- {item}" for item in verification_commands])
    lines.extend(["", "## Review Focus"])
    review_focus = task.get("review_focus") or ["correctness", "safety"]
    lines.extend([f"- {item}" for item in review_focus])
    return "\n".join(lines) + "\n"


def build_execution_request(task: Dict[str, Any], route: Dict[str, Any], dispatch_id: str | None = None) -> Dict[str, Any]:
    paths = task_paths(task["task_id"])
    config = load_claude_code_config()
    payload = {
        "task_id": task["task_id"],
        "request_version": 2,
        "executor": "claude-code",
        "execution_mode": config["mode"],
        "task_summary": task["task"],
        "constraints": task.get("constraints", []),
        "target_paths": task.get("requested_paths", []),
        "verification_commands": task.get("verification_commands", []),
        "review_focus": task.get("review_focus", []),
        "approval": {
            "required": route["approval_required"],
            "protected_paths": route["protected_paths"],
        },
        "route_decision_id": route.get("route_decision_id"),
        "dispatch_id": dispatch_id,
        "context_pack_path": str(paths["context"].relative_to(WORKSPACE_ROOT)),
        "rendered_prompt_path": str(paths["prompt"].relative_to(WORKSPACE_ROOT)),
        "raw_response_path": str(paths["raw"].relative_to(WORKSPACE_ROOT)),
        "auth_artifacts": {
            "auth_status_path": str(paths["auth_status"].relative_to(WORKSPACE_ROOT)),
            "auth_log_path": str(paths["auth_log"].relative_to(WORKSPACE_ROOT)),
        },
    }
    if task.get("mock_mode"):
        payload["mock_mode"] = task["mock_mode"]
    validate_payload("execution-request", payload)
    return payload


def build_openclaw_result(task: Dict[str, Any], route: Dict[str, Any]) -> Dict[str, Any]:
    started = now_iso()
    finished = now_iso()
    summary = task.get("direct_response") or f"OpenClaw handled task '{task['task']}' directly."
    payload = {
        "task_id": task["task_id"],
        "status": "success",
        "executor": "openclaw",
        "summary": summary,
        "changed_files": task.get("requested_paths", []),
        "verification_results": task.get("verification_commands", []) or ["manual_openclaw_review"],
        "remaining_risks": ["No external executor was invoked"],
        "exit_code": 0,
        "started_at": started,
        "finished_at": finished,
    }
    validate_payload("execution-result", payload)
    return payload


def is_write_task(task: Dict[str, Any]) -> bool:
    if task.get("requested_actions"):
        return True
    text_parts = [str(task.get("task") or "")]
    text_parts.extend(str(item) for item in task.get("constraints", []))
    combined = " ".join(text_parts).lower()
    read_only_markers = [
        "read-only",
        "read only",
        "without changing files",
        "do not change files",
        "no file changes",
    ]
    if any(marker in combined for marker in read_only_markers):
        return False
    for path in task.get("requested_paths", []):
        normalized = normalize_path(path)
        if normalized and normalized != "(none)":
            return True
    return False


def is_plan_only_task(task: Dict[str, Any]) -> bool:
    if is_write_task(task):
        return False
    combined = " ".join([str(task.get("task") or ""), *(str(item) for item in task.get("constraints", []))]).lower()
    plan_markers = ["plan-only", "plan only", "planning", "design only", "proposal only"]
    return any(marker in combined for marker in plan_markers)


def build_review_report(task: Dict[str, Any], route: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
    issues: List[str] = []
    verdict = "pass"
    recommendation = "publish"
    summary = "Execution result passed review."
    publishable = True
    requires_manual_review = False
    result_classification = "strict_success"

    result_meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
    result_code = str(result_meta.get("result_code") or "")
    fallback_used = bool(result_meta.get("fallback_used"))
    strict_required_for_write = load_claude_code_config()["auto_publish_requires_strict_output_for_write_tasks"]
    write_task = is_write_task(task)

    if route["approval_required"] and not task.get("approval", {}).get("approved"):
        verdict = "blocked"
        recommendation = "approval_required"
        publishable = False
        requires_manual_review = True
        result_classification = "approval_required"
        issues.append("protected paths require approval before publish")
        summary = "Publish blocked pending approval."
    elif result_code == "AUTH_REQUIRED":
        verdict = "blocked"
        recommendation = "hold"
        publishable = False
        requires_manual_review = False
        result_classification = "auth_required"
        issues.append("Claude auth preflight failed; execution can be resumed after login recovery")
        summary = "Claude authentication is required before execution can continue."
    elif result["status"] != "success":
        verdict = "blocked"
        recommendation = "hold"
        publishable = False
        requires_manual_review = True
        result_classification = "execution_failure"
        issues.append(f"execution status={result['status']}")
        summary = "Execution did not complete successfully."
    elif fallback_used and route.get("protected_paths"):
        verdict = "blocked"
        recommendation = "hold"
        publishable = False
        requires_manual_review = True
        result_classification = "degraded_success_protected"
        issues.append("protected path + degraded success cannot auto-publish")
        summary = "Protected-path degraded result requires manual review before publish."
    elif fallback_used and write_task and strict_required_for_write:
        verdict = "blocked"
        recommendation = "hold"
        publishable = False
        requires_manual_review = True
        result_classification = "degraded_success_write"
        issues.append("fallback normalization used for write task; manual review required before publish")
        summary = "Fallback-normalized write result requires manual review before publish."
    elif fallback_used:
        result_classification = "degraded_success_read_only"
        issues.append("fallback normalization used; reviewed as degraded success")
        summary = "Fallback-normalized read-only result passed review and may be published."
    elif route["decision"] == "claude-code":
        summary = "Execution result passed review and may be published."

    payload = {
        "task_id": task["task_id"],
        "verdict": verdict,
        "summary": summary,
        "issues": issues,
        "publish_recommendation": recommendation,
        "publishable": publishable,
        "requires_manual_review": requires_manual_review,
        "result_classification": result_classification,
        "fallback_used": fallback_used,
    }
    validate_payload("review-report", payload)
    return payload


def render_final_response(task: Dict[str, Any], route: Dict[str, Any], result: Dict[str, Any], review: Dict[str, Any]) -> str:
    result_meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
    result_code = str(result_meta.get("result_code") or "")
    fallback_used = bool(result_meta.get("fallback_used"))

    conclusion = review["summary"]
    next_action = "No further action required."
    if result_code == "AUTH_REQUIRED":
        next_action = "Run `claude auth login` or restore the existing Claude session, then rerun execution to resume from READY_FOR_EXECUTION."
    elif review["publish_recommendation"] == "approval_required":
        next_action = "Approve the task, then rerun execution/publish."
    elif fallback_used and review.get("publishable") is False:
        next_action = "Review the fallback-normalized result manually before publishing any write-side outcome."
    elif fallback_used:
        next_action = "Share the degraded-but-reviewed read-only result, and rerun strictly if higher confidence is needed."
    elif route["decision"] == "claude-code":
        next_action = "Share the reviewed result with the requester or proceed with follow-up verification."

    supplement_parts = [
        f"route={route['decision']}",
        f"changed_files={len(result['changed_files'])}",
        f"protected_paths={len(route['protected_paths'])}",
        f"review={review.get('result_classification', 'n/a')}",
    ]
    if fallback_used:
        supplement_parts.append(f"normalization={result_meta.get('normalization_source', 'unknown')}")
    if result_code == "AUTH_REQUIRED":
        supplement_parts.append("resume_state=READY_FOR_EXECUTION after auth recovery")
    supplement = " / ".join(supplement_parts)
    return "\n".join([
        "1. 結論",
        conclusion,
        "",
        "2. 次アクション",
        next_action,
        "",
        "3. 補足",
        supplement,
    ]) + "\n"


def validate_payload(schema_name: str, payload: Dict[str, Any]) -> None:
    schema = load_schema(schema_name)
    validate_json_value(schema, payload, schema_name)
    validate_runtime_semantics(schema_name, payload)


def ensure_schema_valid(path: Path, schema_name: str) -> Dict[str, Any]:
    payload = load_json(path)
    if not isinstance(payload, dict):
        raise ValidationError(f"{schema_name}: payload is not an object")
    validate_payload(schema_name, payload)
    return payload


def append_review_issue(task_id: str, summary: str, issue: str) -> Dict[str, Any]:
    paths = task_paths(task_id)
    review = load_json(paths["review"], default={}) or {"task_id": task_id, "issues": []}
    issues = [str(item) for item in review.get("issues", [])]
    if issue not in issues:
        issues.append(issue)
    review.update({
        "task_id": task_id,
        "verdict": "blocked",
        "summary": summary,
        "issues": issues,
        "publish_recommendation": "hold",
        "publishable": False,
        "requires_manual_review": True,
        "result_classification": "queue_artifact_invalid",
        "fallback_used": False,
    })
    validate_payload("review-report", review)
    atomic_write_json(paths["review"], review)
    return review


def handle_invalid_queue_artifact(task_id: str, artifact_path: Path, error: str) -> Dict[str, Any]:
    paths = task_paths(task_id)
    try:
        artifact_path.unlink(missing_ok=True)
    except Exception:  # noqa: BLE001
        pass
    review = append_review_issue(task_id, "Queue artifact validation failed; task held for manual review.", error)
    failed_state = update_state(
        task_id,
        "REVIEW_FAILED",
        route=(load_json(paths["state"], default={}) or {}).get("route"),
        route_decision_id=(load_json(paths["state"], default={}) or {}).get("route_decision_id"),
        approval=(load_json(paths["state"], default={}) or {}).get("approval", {}),
        approval_id=(load_json(paths["state"], default={}) or {}).get("approval_id"),
        dispatch_id=(load_json(paths["state"], default={}) or {}).get("dispatch_id"),
        message=error,
    )
    sync_queue_for_task(task_id, state_payload=failed_state, review=review)
    return {"task_id": task_id, "action": "invalid", "state": "REVIEW_FAILED", "error": error}


def read_queue_artifact(path: Path) -> Dict[str, Any]:
    schema_name = "runtime-queue-entry" if "runtime/queue" in str(path) else "queue-status"
    try:
        payload = load_json(path)
    except Exception as exc:  # noqa: BLE001
        raise ValidationError(f"{schema_name}: invalid json in {path}") from exc
    if not isinstance(payload, dict):
        raise ValidationError(f"{schema_name}: payload is not an object")
    validate_payload(schema_name, payload)
    return payload


def collect_runtime_metrics() -> Dict[str, Any]:
    now = datetime.now(timezone.utc).astimezone()
    queue_entries: List[Dict[str, Any]] = []
    invalid_queue_artifacts = 0
    queue_reason_counts = {reason: 0 for reason in QUEUE_REASONS}
    residency_by_reason: Dict[str, List[float]] = {reason: [] for reason in QUEUE_REASONS}
    auth_failure_count = 0
    approval_waiting_count = 0
    manual_review_waiting_count = 0
    fallback_success_count = 0
    degraded_success_count = 0
    rebalance_attempts = 0
    rebalance_successes = 0
    lane_selection_counts = {"acp": 0, "cli": 0, "cli_backend_safety_net": 0, "none": 0}
    lane_fallback_counts = {
        "acp_to_cli": 0,
        "acp_to_cli_backend_safety_net": 0,
        "cli_to_cli_backend_safety_net": 0,
    }
    lane_attempts: Dict[str, List[Dict[str, Any]]] = {"acp": [], "cli": [], "cli_backend_safety_net": []}

    for reason in QUEUE_REASONS:
        queue_dir = QUEUE_ROOT / reason
        if not queue_dir.exists():
            continue
        for path in sorted(queue_dir.glob("*.json")):
            try:
                payload = read_queue_artifact(path)
                queue_entries.append(payload)
                queue_reason_counts[reason] += 1
                queued_at = parse_iso_or_none(payload.get("queued_at"))
                if queued_at is not None:
                    residency_by_reason[reason].append(max((now - queued_at).total_seconds(), 0.0))
            except ValidationError:
                invalid_queue_artifacts += 1

    for task_dir in sorted(TASKS_ROOT.glob("*")):
        if not task_dir.is_dir():
            continue
        state = load_json(task_dir / "state.json", default={}) or {}
        review = load_json(task_dir / "review-report.json", default={}) or {}
        result = load_json(task_dir / "execution-result.json", default={}) or {}
        try:
            lane_selection = read_lane_selection_artifact(task_dir / "lane-selection.json", default={}) or {}
        except ValidationError:
            lane_selection = {}
        try:
            dispatch_attempts = load_dispatch_attempts_artifact(task_dir / "dispatch-attempts.jsonl")
        except ValidationError:
            dispatch_attempts = []
        history = state.get("history") if isinstance(state.get("history"), list) else []
        auth_meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
        selected_lane = str(lane_selection.get("selected_lane") or "")
        if selected_lane in lane_selection_counts:
            lane_selection_counts[selected_lane] += 1
        elif lane_selection:
            lane_selection_counts["none"] += 1
        for attempt in dispatch_attempts:
            lane = str(attempt.get("lane") or "")
            if lane in lane_attempts:
                lane_attempts[lane].append(attempt)
        fallback_chain = [str(item) for item in lane_selection.get("fallback_chain", []) if isinstance(item, str)]
        if fallback_chain[:2] == ["acp", "cli"]:
            lane_fallback_counts["acp_to_cli"] += 1
        if "acp" in fallback_chain and "cli_backend_safety_net" in fallback_chain:
            lane_fallback_counts["acp_to_cli_backend_safety_net"] += 1
        if fallback_chain[:2] == ["cli", "cli_backend_safety_net"]:
            lane_fallback_counts["cli_to_cli_backend_safety_net"] += 1
        if str(auth_meta.get("result_code") or "") == "AUTH_REQUIRED":
            auth_failure_count += 1
        if state.get("state") == "WAITING_APPROVAL":
            approval_waiting_count += 1
        if state.get("state") == "WAITING_MANUAL_REVIEW":
            manual_review_waiting_count += 1
        if bool(auth_meta.get("fallback_used")) and result.get("status") == "success":
            degraded_success_count += 1
            if review.get("publishable") or str(review.get("result_classification") or "") == "degraded_success_read_only":
                fallback_success_count += 1
        for entry in history:
            if not isinstance(entry, dict):
                continue
            message = str(entry.get("message") or "")
            if message.startswith("queue rebalanced:"):
                rebalance_attempts += 1
                if entry.get("state") in {"READY_FOR_EXECUTION", "REVIEWING"}:
                    rebalance_successes += 1

    residency_summary = {}
    for reason, values in residency_by_reason.items():
        if values:
            residency_summary[reason] = {
                "count": len(values),
                "avg_seconds": round(sum(values) / len(values), 3),
                "max_seconds": round(max(values), 3),
            }
        else:
            residency_summary[reason] = {"count": 0, "avg_seconds": 0.0, "max_seconds": 0.0}

    direct_claude_capacity = load_json(ROOT / "runtime" / "capacity" / "claude-capacity.json", default={}) or {}
    latest_capacity = load_json(ROOT / "runtime" / "capacity" / "latest-capacity.json", default={}) or {}
    latest_snapshot_claude = (latest_capacity.get("providers") or {}).get("claude_code", {}) if isinstance(latest_capacity.get("providers"), dict) else {}
    claude_capacity = direct_claude_capacity or latest_snapshot_claude
    acp_healthy = bool(claude_capacity.get("acp_healthy", claude_capacity.get("healthy", False)))
    cli_healthy = bool(claude_capacity.get("cli_healthy", claude_capacity.get("healthy", False)))
    cli_backend_healthy = bool(claude_capacity.get("cli_backend_healthy", cli_healthy))

    def summarize_lane_attempts(lane: str) -> tuple[str | None, int]:
        attempts = sorted(
            lane_attempts.get(lane, []),
            key=lambda item: str(item.get("finished_at") or item.get("started_at") or ""),
        )
        last_success_at = None
        consecutive_failures = 0
        for attempt in attempts:
            status = str(attempt.get("status") or "")
            finished_at = attempt.get("finished_at") or attempt.get("started_at")
            if status == "success":
                last_success_at = str(finished_at) if finished_at else last_success_at
        for attempt in reversed(attempts):
            if str(attempt.get("status") or "") == "success":
                break
            consecutive_failures += 1
        return last_success_at, consecutive_failures

    acp_last_success_at, acp_consecutive_failures = summarize_lane_attempts("acp")
    cli_last_success_at, cli_consecutive_failures = summarize_lane_attempts("cli")

    return {
        "captured_at": now_iso(),
        "queue_reason_counts": queue_reason_counts,
        "queue_residency_seconds": residency_summary,
        "rebalance": {
            "attempts": rebalance_attempts,
            "successes": rebalance_successes,
            "success_rate": round((rebalance_successes / rebalance_attempts), 4) if rebalance_attempts else 0.0,
        },
        "auth_failure_count": auth_failure_count,
        "approval_waiting_count": approval_waiting_count,
        "manual_review_waiting_count": manual_review_waiting_count,
        "fallback_success_count": fallback_success_count,
        "degraded_success_count": degraded_success_count,
        "invalid_queue_artifact_count": invalid_queue_artifacts,
        "acp_healthy": acp_healthy,
        "cli_healthy": cli_healthy,
        "cli_backend_healthy": cli_backend_healthy,
        "acp_last_success_at": acp_last_success_at,
        "cli_last_success_at": cli_last_success_at,
        "acp_consecutive_failures": acp_consecutive_failures,
        "cli_consecutive_failures": cli_consecutive_failures,
        "lane_selection_counts": lane_selection_counts,
        "lane_fallback_counts": lane_fallback_counts,
    }


def write_runtime_metrics() -> Dict[str, Any]:
    metrics = collect_runtime_metrics()
    METRICS_ROOT.mkdir(parents=True, exist_ok=True)
    atomic_write_json(METRICS_ROOT / "latest-metrics.json", metrics)
    atomic_write_json(METRICS_ROOT / f"daily-{date.today().isoformat()}.json", metrics)
    return metrics


def sync_queue_for_task(
    task_id: str,
    *,
    state_payload: Dict[str, Any] | None = None,
    route: Dict[str, Any] | None = None,
    dispatch: Dict[str, Any] | None = None,
    result: Dict[str, Any] | None = None,
    review: Dict[str, Any] | None = None,
    rebalanced_at: str | None = None,
) -> Dict[str, Any]:
    paths = task_paths(task_id)
    current_state = state_payload or load_json(paths["state"], default={}) or {}
    current_route = route or load_json(paths["route"], default={}) or {}
    current_dispatch = dispatch or load_json(paths["dispatch"], default={}) or {}
    current_result = result or load_json(paths["result"], default={}) or {}
    current_review = review or load_json(paths["review"], default={}) or {}
    existing = load_json(paths["queue_status"], default={}) or {}
    reason = classify_queue_reason(current_state, current_dispatch, current_result, current_review)

    payload = build_queue_payload(
        task_id,
        reason=reason,
        current_state=current_state,
        current_route=current_route,
        current_dispatch=current_dispatch,
        current_review=current_review,
        existing=existing,
        rebalanced_at=rebalanced_at,
    )
    payload["task_queue_path"] = str(paths["queue_status"].relative_to(WORKSPACE_ROOT))

    if reason:
        payload["queued_at"] = existing.get("queued_at") or payload["updated_at"]
        payload["released_at"] = None
        validate_runtime_queue_artifact(payload, runtime=False)
        runtime_payload = dict(payload)
        runtime_payload["runtime_queue_path"] = str(queue_artifact_path(task_id, reason).relative_to(WORKSPACE_ROOT))
        validate_runtime_queue_artifact(runtime_payload, runtime=True)
        clear_runtime_queue_entries(task_id)
        runtime_path = queue_artifact_path(task_id, reason)
        runtime_path.parent.mkdir(parents=True, exist_ok=True)
        atomic_write_json(runtime_path, runtime_payload)
        atomic_write_json(paths["queue_status"], payload)
        write_runtime_metrics()
        return payload

    clear_runtime_queue_entries(task_id)
    if existing:
        payload["released_at"] = payload["updated_at"]
        payload["queue_reason"] = None
        payload["resume_target_state"] = None
        payload["resume_eligible"] = False
        payload["resume_blockers"] = []
        validate_runtime_queue_artifact(payload, runtime=False)
        atomic_write_json(paths["queue_status"], payload)
        write_runtime_metrics()
        return payload
    if paths["queue_status"].exists():
        paths["queue_status"].unlink()
    write_runtime_metrics()
    return payload


def cli_validate(args: argparse.Namespace) -> int:
    path = Path(args.path)
    if args.schema == "dispatch-attempt":
        rows = load_dispatch_attempts_artifact(path)
        task_id = rows[-1].get("task_id") if rows else None
        print(json.dumps({"ok": True, "schema": args.schema, "path": args.path, "task_id": task_id, "rows": len(rows)}, ensure_ascii=False))
        return 0
    payload = ensure_schema_valid(path, args.schema)
    print(json.dumps({"ok": True, "schema": args.schema, "path": args.path, "task_id": payload.get("task_id")}, ensure_ascii=False))
    return 0


def cli_show_claude_config(args: argparse.Namespace) -> int:
    config = load_claude_code_config()
    print(json.dumps(config, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="OpenClaw task runtime helpers")
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate")
    validate.add_argument(
        "--schema",
        required=True,
        choices=[
            "route-decision",
            "execution-request",
            "execution-result",
            "review-report",
            "task-intake",
            "assignment-plan",
            "capacity-snapshot",
            "dispatch-plan",
            "lane-selection",
            "dispatch-attempt",
            "growth-proposal",
            "growth-review",
            "growth-apply-result",
            "queue-status",
            "runtime-queue-entry",
        ],
    )
    validate.add_argument("--path", required=True)
    validate.set_defaults(func=cli_validate)

    show_config = sub.add_parser("show-claude-config")
    show_config.set_defaults(func=cli_show_claude_config)
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
