#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
sys.path.insert(0, str(ROOT / "scripts"))

from task_runtime import (  # noqa: E402
    atomic_write_json,
    atomic_write_text,
    ensure_schema_valid,
    evaluate_claude_auth_status,
    load_claude_code_config,
    load_json,
    resolve_claude_code_bin,
)

EXIT_SUCCESS = 0
EXIT_POLICY_BLOCKED = 10
EXIT_TIMEOUT = 20
EXIT_RUNTIME_ERROR = 30
EXIT_INVALID_REQUEST = 40
EXIT_INVALID_RESULT = 50
STRUCTURED_SCHEMA_PATH = ROOT / "schemas" / "claude-structured-output.schema.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Contract-preserving ACP adapter for Claude Code")
    parser.add_argument("--request", required=True)
    parser.add_argument("--result", required=True)
    parser.add_argument("--stdout-log", required=True)
    parser.add_argument("--stderr-log", required=True)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def build_result(
    request: dict,
    *,
    status: str,
    exit_code: int,
    summary: str,
    changed_files: list[str] | None = None,
    verification_results: list[str] | None = None,
    remaining_risks: list[str] | None = None,
    meta: dict | None = None,
) -> dict:
    payload = {
        "task_id": request.get("task_id", "unknown"),
        "status": status,
        "executor": "claude-code",
        "summary": summary,
        "changed_files": changed_files or [],
        "verification_results": verification_results or [],
        "remaining_risks": remaining_risks or [],
        "exit_code": exit_code,
        "started_at": request.get("started_at") or now_iso(),
        "finished_at": now_iso(),
        "dispatch_id": request.get("dispatch_id"),
        "raw_response_path": str(Path(request.get("raw_response_path") or (Path(request.get("context_pack_path") or ".").parent / "claude-raw.json"))),
        "rendered_prompt_path": str(request.get("rendered_prompt_path") or ""),
    }
    if meta:
        payload["_meta"] = meta
    return payload


def ensure_parent(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def resolve_workspace_path(value: str | None, fallback: Path) -> Path:
    if not value:
        return fallback
    path = Path(value)
    if not path.is_absolute():
        path = WORKSPACE / path
    return path


def append_log(path: Path, message: str) -> None:
    with path.open("a", encoding="utf-8") as fh:
        fh.write(message)
        if not message.endswith("\n"):
            fh.write("\n")


def build_prompt(request: dict, prompt_path: Path) -> str:
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    context_text = ""
    context_path = resolve_workspace_path(request.get("context_pack_path"), prompt_path.parent / "context-pack.md")
    if context_path.exists():
        context_text = context_path.read_text(encoding="utf-8").strip()
    handoff_pack = request.get("handoff_pack") if isinstance(request.get("handoff_pack"), dict) else {}
    return_schema = request.get("return_schema") if isinstance(request.get("return_schema"), dict) else {}
    lines = [
        f"Task ID: {request.get('task_id', 'unknown')}",
        f"Dispatch ID: {request.get('dispatch_id', '(none)')}",
        "Execution lane: acp",
        "",
        "Return structured output that matches the provided JSON schema exactly.",
        "Do not wrap the response in markdown fences.",
        "Prefer the handoff artifacts over guesswork.",
        "If the task is ambiguous, return a narrow executable plan rather than broad speculative edits.",
        "Always include changed_files, verification_results, remaining_risks, and a concise summary.",
        "",
        "Task Summary:",
        request.get("task_summary", ""),
        "",
        "Constraints:",
    ]
    constraints = request.get("constraints") or ["(none)"]
    lines.extend([f"- {item}" for item in constraints])
    lines.extend(["", "Target Paths:"])
    targets = request.get("target_paths") or ["(none)"]
    lines.extend([f"- {item}" for item in targets])
    lines.extend(["", "Verification Commands:"])
    commands = request.get("verification_commands") or ["(none)"]
    lines.extend([f"- {item}" for item in commands])
    lines.extend(["", "Review Focus:"])
    focus = request.get("review_focus") or ["(none)"]
    lines.extend([f"- {item}" for item in focus])
    if handoff_pack:
        lines.extend(["", "Handoff Artifacts:"])
        lines.extend([f"- {key}: {value}" for key, value in handoff_pack.items()])
    if return_schema:
        lines.extend(["", "Return Schema Hints:"])
        lines.extend([f"- {key}: {value}" for key, value in return_schema.items()])
    if context_text:
        lines.extend(["", "Context Pack:", context_text])
    prompt = "\n".join(lines).rstrip() + "\n"
    atomic_write_text(prompt_path, prompt)
    return prompt


def detect_native_acp_support(claude_bin: str) -> tuple[bool, str | None]:
    try:
        help_run = subprocess.run([claude_bin, "--help"], check=False, capture_output=True, text=True, timeout=15)
    except Exception as exc:  # noqa: BLE001
        return False, f"help probe failed: {exc}"
    combined = f"{help_run.stdout}\n{help_run.stderr}".lower()
    commands_block = combined.split("commands:", 1)[1] if "commands:" in combined else combined
    if re.search(r"(?m)^\s*acp\b", commands_block):
        return True, None
    return False, "claude CLI does not expose a native acp subcommand in this environment"


def auth_preflight(claude_bin: str, auth_status_path: Path, auth_log_path: Path, auth_cfg: dict[str, Any]) -> dict[str, Any]:
    started_at = now_iso()
    command = [claude_bin, "auth", "status", "--json"]
    completed = subprocess.run(command, check=False, capture_output=True, text=True)
    parsed = None
    parse_error = None
    try:
        parsed = json.loads(completed.stdout) if completed.stdout.strip() else None
    except Exception as exc:  # noqa: BLE001
        parse_error = str(exc)
    logged_in = False
    auth_method = None
    normalized_auth_method = None
    user_email = None
    auth_error = None
    auth_ok = False
    if isinstance(parsed, dict):
        logged_in = bool(parsed.get("loggedIn") or parsed.get("authenticated") or parsed.get("ok"))
        auth_method = parsed.get("authMethod") or parsed.get("method")
        user_email = parsed.get("email") or parsed.get("userEmail")
        auth_ok, normalized_auth_method, auth_error = evaluate_claude_auth_status(parsed, auth_cfg)
    log_lines = [
        f"[{started_at}] command={' '.join(command)}",
        f"exit_code={completed.returncode}",
        "--- stdout ---",
        completed.stdout.rstrip(),
        "--- stderr ---",
        completed.stderr.rstrip(),
    ]
    atomic_write_text(auth_log_path, "\n".join(log_lines).rstrip() + "\n")
    payload = {
        "checked_at": now_iso(),
        "ok": completed.returncode == 0 and auth_ok,
        "auth_ok": completed.returncode == 0 and auth_ok,
        "cli": claude_bin,
        "command": command,
        "exit_code": completed.returncode,
        "logged_in": logged_in,
        "auth_method": auth_method,
        "normalized_auth_method": normalized_auth_method,
        "allowed_auth_methods": auth_cfg.get("allowed_methods") or [auth_cfg.get("primary_method") or "claude_subscription"],
        "user_email": user_email,
        "stderr": completed.stderr,
    }
    if isinstance(parsed, dict):
        payload["stdout"] = parsed
    if parse_error:
        payload["message"] = f"stdout JSON parse failed: {parse_error}"
    elif auth_error:
        payload["message"] = auth_error
    atomic_write_json(auth_status_path, payload)
    runtime_cache_path = ROOT / "runtime" / "auth" / "latest-status.json"
    ensure_parent(runtime_cache_path)
    atomic_write_json(runtime_cache_path, payload)
    return payload


def extract_events(payload: Any) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    init_event = None
    result_event = None
    if isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict) and item.get("type") == "system" and item.get("subtype") == "init":
                init_event = item
        for item in reversed(payload):
            if isinstance(item, dict) and item.get("type") == "result":
                result_event = item
                break
    elif isinstance(payload, dict) and payload.get("type") == "result":
        result_event = payload
    return init_event, result_event


def load_raw_json(raw_path: Path) -> tuple[Any, str]:
    raw_text = raw_path.read_text(encoding="utf-8") if raw_path.exists() else ""
    if not raw_text.strip():
        return None, raw_text
    try:
        return json.loads(raw_text), raw_text
    except Exception:
        return None, raw_text


def build_meta(
    *,
    init_event: dict[str, Any] | None,
    result_event: dict[str, Any] | None,
    session_id: str | None,
    transport_kind: str,
    native_acp_available: bool,
    normalization_source: str,
    fallback_used: bool,
    raw_text: str,
    retry_count: int = 0,
    degraded_contract: str | None = None,
) -> dict[str, Any]:
    meta: dict[str, Any] = {
        "lane": "acp",
        "transport_kind": transport_kind,
        "native_acp_available": native_acp_available,
        "session_id": session_id,
        "normalization_source": normalization_source,
        "fallback_used": fallback_used,
        "retry_count": retry_count,
        "raw_sha256": hashlib.sha256(raw_text.encode("utf-8")).hexdigest(),
        "publishable": True,
    }
    if degraded_contract:
        meta["degraded_contract"] = degraded_contract
    if isinstance(result_event, dict):
        for key in ("modelUsage", "total_cost_usd", "duration_ms", "duration_api_ms", "num_turns", "stop_reason", "permission_denials", "is_error"):
            if key in result_event:
                meta[key] = result_event.get(key)
    if isinstance(init_event, dict):
        meta["cli_version"] = init_event.get("claude_code_version")
        meta["init"] = {
            key: init_event.get(key)
            for key in ("session_id", "model", "permissionMode", "tools", "claude_code_version")
            if key in init_event
        }
    else:
        meta["cli_version"] = None
    return {key: value for key, value in meta.items() if value is not None}


def coerce_structured_output(candidate: Any) -> tuple[dict[str, Any] | None, bool, str | None]:
    if isinstance(candidate, dict):
        required = {"result", "changed_files", "verification_results", "remaining_risks"}
        if required.issubset(candidate.keys()):
            return candidate, False, None
        compat = dict(candidate)
        changed = False
        if "result" not in compat and isinstance(compat.get("summary"), str):
            compat["result"] = compat["summary"]
            changed = True
        if "changed_files" not in compat:
            compat["changed_files"] = []
            changed = True
        if "verification_results" not in compat:
            compat["verification_results"] = []
            changed = True
        if "remaining_risks" not in compat:
            compat["remaining_risks"] = []
            changed = True
        if required.issubset(compat.keys()):
            return compat, changed, "compatibility normalization filled missing structured output fields" if changed else None
    return None, False, None


def normalize_success_result(
    request: dict,
    raw_path: Path,
    *,
    session_id: str | None,
    transport_kind: str,
    native_acp_available: bool,
) -> dict:
    raw_payload, raw_text = load_raw_json(raw_path)
    init_event, result_event = extract_events(raw_payload)
    if not isinstance(result_event, dict):
        return build_result(
            request,
            status="invalid_result",
            exit_code=EXIT_INVALID_RESULT,
            summary="ACP adapter could not locate result envelope",
            verification_results=["result envelope missing"],
            remaining_risks=["inspect claude-raw.json for output drift"],
            meta={
                "lane": "acp",
                "transport_kind": transport_kind,
                "native_acp_available": native_acp_available,
                "session_id": session_id,
                "publishable": False,
            },
        )

    structured_output = result_event.get("structured_output")
    candidate, compat_changed, degraded_contract = coerce_structured_output(structured_output)
    normalization_source = "structured_output"
    fallback_used = False
    if candidate is None and isinstance(result_event.get("result"), str):
        raw_result = result_event.get("result")
        try:
            candidate_json = json.loads(raw_result)
        except Exception:
            fenced = re.findall(r"```json\s*(\{.*?\})\s*```", raw_result, flags=re.IGNORECASE | re.DOTALL)
            candidate_json = None
            if len(fenced) == 1:
                try:
                    candidate_json = json.loads(fenced[0])
                except Exception:
                    candidate_json = None
        candidate, compat_changed, degraded_contract = coerce_structured_output(candidate_json)
        if candidate is not None:
            normalization_source = "result_json_fallback"
            fallback_used = True
            degraded_contract = degraded_contract or "structured_output missing; decoded JSON string from result"

    if candidate is None:
        return build_result(
            request,
            status="invalid_result",
            exit_code=EXIT_INVALID_RESULT,
            summary="ACP adapter could not normalize Claude output to the structured contract",
            verification_results=["structured output normalization failed"],
            remaining_risks=["inspect claude-raw.json for schema drift"],
            meta={
                "lane": "acp",
                "transport_kind": transport_kind,
                "native_acp_available": native_acp_available,
                "session_id": session_id,
                "publishable": False,
            },
        )

    summary = candidate.get("summary") or candidate.get("result") or "ACP adapter completed successfully"
    meta = build_meta(
        init_event=init_event,
        result_event=result_event,
        session_id=session_id or result_event.get("session_id") or (init_event or {}).get("session_id"),
        transport_kind=transport_kind,
        native_acp_available=native_acp_available,
        normalization_source=normalization_source,
        fallback_used=fallback_used or compat_changed,
        raw_text=raw_text,
        degraded_contract=degraded_contract if (fallback_used or compat_changed) else None,
    )
    return build_result(
        request,
        status="success",
        exit_code=EXIT_SUCCESS,
        summary=summary,
        changed_files=candidate.get("changed_files") or request.get("target_paths", []),
        verification_results=candidate.get("verification_results") or request.get("verification_commands", []),
        remaining_risks=candidate.get("remaining_risks") or [],
        meta=meta,
    )


def write_session_manifest(session_path: Path, payload: dict[str, Any]) -> None:
    atomic_write_json(session_path, payload)


def invoke_claude_compat(
    request: dict,
    *,
    prompt: str,
    raw_path: Path,
    stdout_log: Path,
    stderr_log: Path,
    claude_bin: str,
    config: dict[str, Any],
    existing_session_id: str | None,
) -> tuple[int, str | None]:
    command = [
        claude_bin,
        "-p",
        "--output-format",
        "json",
        "--permission-mode",
        str(config.get("permission_mode_execute") or "bypassPermissions"),
    ]
    model = str(config.get("model") or "").strip()
    if model:
        command.extend(["--model", model])
    if bool(config.get("use_json_schema", True)):
        command.extend(["--json-schema", STRUCTURED_SCHEMA_PATH.read_text(encoding="utf-8")])
    if existing_session_id:
        command.extend(["--resume", existing_session_id])
    command.append(prompt)
    append_log(stdout_log, f"[openclaw-acp] invoking compat transport: {' '.join(command[:-1])} <rendered-prompt>")
    try:
        completed = subprocess.run(command, check=False, capture_output=True, text=True, timeout=int(config.get("timeout_sec") or 900))
    except subprocess.TimeoutExpired as exc:
        append_log(stdout_log, exc.stdout or "")
        append_log(stderr_log, exc.stderr or "")
        raw_payload = {
            "adapter": "openclaw-acp",
            "transport_kind": "claude_print_json_compat",
            "status": "timeout",
            "timeout_sec": int(config.get("timeout_sec") or 900),
            "stdout": exc.stdout or "",
            "stderr": exc.stderr or "",
            "captured_at": now_iso(),
        }
        atomic_write_json(raw_path, raw_payload)
        return 124, existing_session_id

    append_log(stdout_log, completed.stdout)
    append_log(stderr_log, completed.stderr)
    raw_text = completed.stdout if completed.stdout.endswith("\n") else completed.stdout + "\n"
    raw_path.write_text(raw_text, encoding="utf-8")
    session_id = existing_session_id
    try:
        raw_payload = json.loads(completed.stdout)
    except Exception:
        raw_payload = {
            "adapter": "openclaw-acp",
            "transport_kind": "claude_print_json_compat",
            "captured_at": now_iso(),
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "exit_code": completed.returncode,
        }
        atomic_write_json(raw_path, raw_payload)
    else:
        init_event, result_event = extract_events(raw_payload)
        session_id = (result_event or {}).get("session_id") or (init_event or {}).get("session_id") or existing_session_id
        raw_path.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return completed.returncode, session_id


def main() -> int:
    args = parse_args()
    request_path = Path(args.request)
    result_path = ensure_parent(Path(args.result))
    stdout_log = ensure_parent(Path(args.stdout_log))
    stderr_log = ensure_parent(Path(args.stderr_log))
    stdout_log.write_text("", encoding="utf-8")
    stderr_log.write_text("", encoding="utf-8")

    try:
        request = load_json(request_path, default=None)
        if not isinstance(request, dict):
            raise ValueError("request payload must be an object")
        ensure_schema_valid(request_path, "execution-request")
    except Exception as exc:  # noqa: BLE001
        atomic_write_json(
            result_path,
            build_result({}, status="invalid_request", exit_code=EXIT_INVALID_REQUEST, summary=f"invalid request: {exc}", remaining_risks=["request validation failed"]),
        )
        return EXIT_INVALID_REQUEST

    raw_path = ensure_parent(resolve_workspace_path(request.get("raw_response_path"), result_path.parent / "claude-raw.json"))
    prompt_path = ensure_parent(resolve_workspace_path(request.get("rendered_prompt_path"), result_path.parent / "rendered-prompt.txt"))
    auth_status_path = ensure_parent(resolve_workspace_path(((request.get("auth_artifacts") or {}).get("auth_status_path")), result_path.parent / "auth-status.json"))
    auth_log_path = ensure_parent(resolve_workspace_path(((request.get("auth_artifacts") or {}).get("auth_log_path")), result_path.parent / "auth-preflight.log"))
    session_path = result_path.parent / "acp-session.json"

    config = load_claude_code_config()
    auth_cfg = config.get("auth") if isinstance(config.get("auth"), dict) else {}
    claude_bin, claude_bin_source = resolve_claude_code_bin(config)
    claude_bin_path = shutil.which(claude_bin)
    native_acp_available, native_acp_reason = detect_native_acp_support(claude_bin) if claude_bin_path else (False, "claude binary not found")
    append_log(stdout_log, f"[openclaw-acp] lane=acp dispatch_attempt={request.get('dispatch_attempt_id')}")
    append_log(stdout_log, f"[openclaw-acp] bin={claude_bin} source={claude_bin_source} resolved={claude_bin_path or '<missing>'}")
    append_log(stdout_log, f"[openclaw-acp] native_acp_available={str(native_acp_available).lower()}")
    if native_acp_reason:
        append_log(stdout_log, f"[openclaw-acp] native_acp_reason={native_acp_reason}")

    mock_mode = request.get("mock_mode")
    explicit_mock = bool(mock_mode)
    if not claude_bin_path and not explicit_mock:
        result = build_result(
            request,
            status="runtime_error",
            exit_code=EXIT_RUNTIME_ERROR,
            summary="ACP transport preflight failed: Claude binary not found",
            verification_results=["acp_transport_preflight"],
            remaining_risks=[f"Claude binary unavailable: {claude_bin}"],
            meta={
                "lane": "acp",
                "failure_stage": "transport_preflight",
                "partial_execution": False,
                "side_effects_possible": False,
                "publishable": False,
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
            },
        )
        atomic_write_json(result_path, result)
        return EXIT_RUNTIME_ERROR

    if args.dry_run:
        prompt = build_prompt(request, prompt_path)
        atomic_write_json(
            raw_path,
            {
                "adapter": "openclaw-acp",
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
                "captured_at": now_iso(),
                "prompt_preview": prompt[:500],
            },
        )
        result = build_result(
            request,
            status="success",
            exit_code=EXIT_SUCCESS,
            summary="dry-run completed; ACP adapter rendered prompt/settings without invoking Claude",
            changed_files=request.get("target_paths", []),
            verification_results=["dry-run"],
            remaining_risks=["Claude execution skipped by --dry-run"],
            meta={
                "lane": "acp",
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
                "publishable": True,
            },
        )
        atomic_write_json(result_path, result)
        ensure_schema_valid(result_path, "execution-result")
        return EXIT_SUCCESS

    if mock_mode in {"auth_required", "acp_auth_required"}:
        atomic_write_json(auth_status_path, {"checked_at": now_iso(), "ok": False, "logged_in": False})
        result = build_result(
            request,
            status="runtime_error",
            exit_code=EXIT_RUNTIME_ERROR,
            summary="ACP auth required before execution can continue",
            verification_results=["acp_session_start"],
            remaining_risks=["Claude ACP auth unavailable"],
            meta={
                "result_code": "AUTH_REQUIRED",
                "lane": "acp",
                "failure_stage": "auth_preflight",
                "partial_execution": False,
                "side_effects_possible": False,
                "publishable": False,
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
            },
        )
        atomic_write_json(result_path, result)
        return EXIT_RUNTIME_ERROR
    if mock_mode in {"acp_pre_session_failure", "pre_session_failure"}:
        result = build_result(
            request,
            status="runtime_error",
            exit_code=EXIT_RUNTIME_ERROR,
            summary="ACP session failed before execution started",
            verification_results=["acp_session_start"],
            remaining_risks=["ACP unavailable"],
            meta={
                "lane": "acp",
                "failure_stage": "session_start",
                "partial_execution": False,
                "side_effects_possible": False,
                "publishable": False,
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
            },
        )
        atomic_write_json(result_path, result)
        return EXIT_RUNTIME_ERROR
    if mock_mode in {"acp_partial_write_failure", "partial_write_failure"}:
        result = build_result(
            request,
            status="runtime_error",
            exit_code=EXIT_RUNTIME_ERROR,
            summary="ACP failed after partial write execution",
            changed_files=request.get("target_paths", []),
            verification_results=["acp_session_start", "acp_execution_started"],
            remaining_risks=["Partial execution may have side effects"],
            meta={
                "lane": "acp",
                "failure_stage": "execution",
                "partial_execution": True,
                "side_effects_possible": True,
                "publishable": False,
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
            },
        )
        atomic_write_json(result_path, result)
        return EXIT_RUNTIME_ERROR

    if mock_mode == "success":
        result = build_result(
            request,
            status="success",
            exit_code=EXIT_SUCCESS,
            summary="ACP preflight mock completed successfully",
            changed_files=request.get("target_paths", []),
            verification_results=request.get("verification_commands", []),
            remaining_risks=[],
            meta={
                "lane": "acp",
                "session_mode": "preflight_mock",
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
                "publishable": True,
            },
        )
        atomic_write_json(result_path, result)
        ensure_schema_valid(result_path, "execution-result")
        return EXIT_SUCCESS

    auth_status = auth_preflight(claude_bin, auth_status_path, auth_log_path, auth_cfg)
    if not auth_status.get("ok"):
        result = build_result(
            request,
            status="runtime_error",
            exit_code=EXIT_RUNTIME_ERROR,
            summary="ACP auth required before execution can continue",
            verification_results=["acp_auth_preflight"],
            remaining_risks=["Claude auth unavailable"],
            meta={
                "result_code": "AUTH_REQUIRED",
                "lane": "acp",
                "failure_stage": "auth_preflight",
                "partial_execution": False,
                "side_effects_possible": False,
                "publishable": False,
                "auth_status_path": str(auth_status_path),
                "auth_log_path": str(auth_log_path),
                "transport_kind": "claude_print_json_compat",
                "native_acp_available": native_acp_available,
            },
        )
        atomic_write_json(result_path, result)
        ensure_schema_valid(result_path, "execution-result")
        return EXIT_RUNTIME_ERROR

    existing_session = load_json(session_path, default={}) or {}
    existing_session_id = existing_session.get("session_id") if isinstance(existing_session, dict) else None
    prompt = build_prompt(request, prompt_path)
    transport_kind = "claude_print_json_compat"
    append_log(stdout_log, f"[openclaw-acp] transport_kind={transport_kind}")
    if existing_session_id:
        append_log(stdout_log, f"[openclaw-acp] resuming session_id={existing_session_id}")

    compat_exit, session_id = invoke_claude_compat(
        request,
        prompt=prompt,
        raw_path=raw_path,
        stdout_log=stdout_log,
        stderr_log=stderr_log,
        claude_bin=claude_bin,
        config=config,
        existing_session_id=existing_session_id,
    )

    session_manifest = {
        "task_id": request.get("task_id"),
        "lane": "acp",
        "transport_kind": transport_kind,
        "native_acp_available": native_acp_available,
        "native_acp_reason": native_acp_reason,
        "session_id": session_id,
        "updated_at": now_iso(),
    }
    write_session_manifest(session_path, session_manifest)

    if compat_exit == 124:
        result = build_result(
            request,
            status="timeout",
            exit_code=EXIT_TIMEOUT,
            summary=f"ACP execution timed out after {int(config.get('timeout_sec') or 900)}s",
            verification_results=["timeout"],
            remaining_risks=["consider increasing timeout or simplifying the task"],
            meta={
                "lane": "acp",
                "transport_kind": transport_kind,
                "native_acp_available": native_acp_available,
                "session_id": session_id,
                "publishable": False,
            },
        )
        atomic_write_json(result_path, result)
        ensure_schema_valid(result_path, "execution-result")
        return EXIT_TIMEOUT

    if compat_exit != 0:
        raw_payload, raw_text = load_raw_json(raw_path)
        init_event, result_event = extract_events(raw_payload)
        result = build_result(
            request,
            status="runtime_error",
            exit_code=EXIT_RUNTIME_ERROR,
            summary=f"ACP executor failed with exit code {compat_exit}",
            verification_results=["executor returned non-zero"],
            remaining_risks=["inspect execution.stderr.log and claude-raw.json"],
            meta=build_meta(
                init_event=init_event,
                result_event=result_event,
                session_id=session_id,
                transport_kind=transport_kind,
                native_acp_available=native_acp_available,
                normalization_source="raw_exit",
                fallback_used=False,
                raw_text=raw_text,
                degraded_contract=None,
            ),
        )
        result["_meta"]["publishable"] = False
        atomic_write_json(result_path, result)
        ensure_schema_valid(result_path, "execution-result")
        return EXIT_RUNTIME_ERROR

    result = normalize_success_result(
        request,
        raw_path,
        session_id=session_id,
        transport_kind=transport_kind,
        native_acp_available=native_acp_available,
    )
    atomic_write_json(result_path, result)
    try:
        ensure_schema_valid(result_path, "execution-result")
    except Exception:
        return EXIT_INVALID_RESULT
    return int(result.get("exit_code", EXIT_RUNTIME_ERROR))


if __name__ == "__main__":
    raise SystemExit(main())
