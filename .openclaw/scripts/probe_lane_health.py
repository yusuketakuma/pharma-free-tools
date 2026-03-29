#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from task_runtime import atomic_write_json, append_jsonl, evaluate_claude_auth_status, load_claude_code_config, now_iso, resolve_claude_code_bin  # noqa: E402

RUNTIME_ROOT = ROOT / "runtime" / "health"
LATEST_PATH = RUNTIME_ROOT / "lane-health.json"
HISTORY_PATH = RUNTIME_ROOT / "lane-health-history.jsonl"
LANES = ("acp", "cli", "cli_backend_safety_net")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Probe Claude lane health and persist runtime artifacts")
    parser.add_argument("--timeout-sec", type=int, default=45)
    parser.add_argument("--output")
    parser.add_argument("--history-path")
    return parser.parse_args()


def detect_native_acp(claude_bin: str) -> tuple[bool, str | None]:
    try:
        completed = subprocess.run([claude_bin, "--help"], check=False, capture_output=True, text=True, timeout=10)
    except Exception as exc:  # noqa: BLE001
        return False, f"help probe failed: {exc}"
    combined = f"{completed.stdout}\n{completed.stderr}".lower()
    commands_block = combined.split("commands:", 1)[1] if "commands:" in combined else combined
    if any(line.strip().startswith("acp") for line in commands_block.splitlines()):
        return True, None
    return False, "claude CLI does not expose native acp subcommand"


def auth_probe(claude_bin: str, auth_cfg: dict[str, Any]) -> tuple[bool, dict[str, Any], str | None]:
    command = [claude_bin, "auth", "status", "--json"]
    completed = subprocess.run(command, check=False, capture_output=True, text=True)
    parsed = None
    parse_error = None
    try:
        parsed = json.loads(completed.stdout) if completed.stdout.strip() else None
    except Exception as exc:  # noqa: BLE001
        parse_error = str(exc)
    auth_ok = False
    normalized_auth_method = None
    error = None
    if isinstance(parsed, dict):
        auth_ok, normalized_auth_method, error = evaluate_claude_auth_status(parsed, auth_cfg)
    payload = {
        "command": command,
        "exit_code": completed.returncode,
        "parsed": parsed,
        "stderr": completed.stderr,
        "normalized_auth_method": normalized_auth_method,
        "allowed_auth_methods": auth_cfg.get("allowed_methods") or [auth_cfg.get("primary_method") or "claude_subscription"],
    }
    if parse_error:
        payload["parse_error"] = parse_error
    if completed.returncode != 0:
        error = completed.stderr.strip() or f"auth status exited {completed.returncode}"
    elif error is None and not auth_ok:
        error = "claude auth unavailable"
    return completed.returncode == 0 and auth_ok, payload, error


def lane_command(claude_bin: str, lane: str) -> list[str]:
    base = [claude_bin, "-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]
    schema = json.dumps(
        {
            "type": "object",
            "required": ["result", "changed_files", "verification_results", "remaining_risks"],
            "properties": {
                "summary": {"type": "string"},
                "result": {"type": "string"},
                "changed_files": {"type": "array", "items": {"type": "string"}},
                "verification_results": {"type": "array", "items": {"type": "string"}},
                "remaining_risks": {"type": "array", "items": {"type": "string"}},
            },
            "additionalProperties": False,
        },
        ensure_ascii=False,
    )
    base.extend(["--json-schema", schema])
    if lane == "cli_backend_safety_net":
        base.extend(["--bare", "--tools=StructuredOutput"])
    if lane == "cli_backend_safety_net":
        prompt = "Return structured output with result='lane health ok', empty changed_files, verification_results=['cli_backend_safety_net probe'], remaining_risks=[]."
    elif lane == "cli":
        prompt = "Return structured output with result='lane health ok', empty changed_files, verification_results=['cli probe'], remaining_risks=[]."
    else:
        prompt = "Return structured output with result='lane health ok', empty changed_files, verification_results=['acp compat probe'], remaining_risks=[]."
    return [*base, prompt] if lane == "cli_backend_safety_net" else [*base, prompt]


def run_lane_probe(claude_bin: str, lane: str, *, timeout_sec: int, auth_ok: bool, native_acp_available: bool, native_acp_reason: str | None) -> dict[str, Any]:
    captured_at = now_iso()
    if lane == "acp":
        transport_kind = "claude_print_json_compat"
    elif lane == "cli_backend_safety_net":
        transport_kind = "cli_bare_json"
    else:
        transport_kind = "cli_json"

    payload: dict[str, Any] = {
        "lane": lane,
        "healthy": False,
        "auth_ok": auth_ok,
        "latency_ms": None,
        "last_error": None,
        "captured_at": captured_at,
        "transport_kind": transport_kind,
        "native_acp_available": native_acp_available,
    }
    if lane == "acp" and native_acp_reason:
        payload["native_transport_gap"] = native_acp_reason
    if not auth_ok:
        payload["last_error"] = "claude auth unavailable"
        return payload

    command = lane_command(claude_bin, lane)
    started = time.perf_counter()
    try:
        completed = subprocess.run(command, check=False, capture_output=True, text=True, timeout=timeout_sec)
        latency_ms = round((time.perf_counter() - started) * 1000, 3)
    except subprocess.TimeoutExpired:
        payload["latency_ms"] = round((time.perf_counter() - started) * 1000, 3)
        payload["last_error"] = f"probe timeout after {timeout_sec}s"
        return payload
    payload["latency_ms"] = latency_ms
    payload["command"] = command[:-1] + ["<prompt>"]
    payload["exit_code"] = completed.returncode
    if completed.returncode != 0:
        payload["last_error"] = completed.stderr.strip() or f"probe exited {completed.returncode}"
        return payload

    try:
        raw_payload = json.loads(completed.stdout)
    except Exception as exc:  # noqa: BLE001
        payload["last_error"] = f"probe output parse failed: {exc}"
        return payload

    result_event = None
    if isinstance(raw_payload, list):
        for item in reversed(raw_payload):
            if isinstance(item, dict) and item.get("type") == "result":
                result_event = item
                break
    elif isinstance(raw_payload, dict) and raw_payload.get("type") == "result":
        result_event = raw_payload
    if not isinstance(result_event, dict):
        payload["last_error"] = "probe result envelope missing"
        return payload

    payload["healthy"] = not bool(result_event.get("is_error"))
    payload["session_id"] = result_event.get("session_id")
    payload["model_usage"] = result_event.get("modelUsage")
    if not payload["healthy"]:
        payload["last_error"] = result_event.get("result") or "probe returned is_error=true"
    return payload


def main() -> int:
    args = parse_args()
    config = load_claude_code_config()
    auth_cfg = config.get("auth") if isinstance(config.get("auth"), dict) else {}
    claude_bin, _ = resolve_claude_code_bin(config)
    claude_bin_path = shutil.which(claude_bin)
    native_acp_available = False
    native_acp_reason = None
    auth_ok = False
    auth_payload: dict[str, Any] = {}
    auth_error = None
    if claude_bin_path:
        native_acp_available, native_acp_reason = detect_native_acp(claude_bin)
        auth_ok, auth_payload, auth_error = auth_probe(claude_bin, auth_cfg)
    else:
        native_acp_reason = f"Claude binary not found: {claude_bin}"
        auth_error = native_acp_reason

    lanes: dict[str, Any] = {}
    for lane in LANES:
        if not claude_bin_path:
            lanes[lane] = {
                "lane": lane,
                "healthy": False,
                "auth_ok": False,
                "latency_ms": None,
                "last_error": auth_error,
                "captured_at": now_iso(),
                "transport_kind": "unavailable",
                "native_acp_available": False,
            }
            continue
        lane_payload = run_lane_probe(
            claude_bin,
            lane,
            timeout_sec=args.timeout_sec,
            auth_ok=auth_ok,
            native_acp_available=native_acp_available,
            native_acp_reason=native_acp_reason,
        )
        if auth_error and not lane_payload.get("last_error"):
            lane_payload["last_error"] = auth_error
        lanes[lane] = lane_payload

    snapshot = {
        "captured_at": now_iso(),
        "claude_bin": claude_bin,
        "claude_bin_resolved": claude_bin_path,
        "auth": {
            "auth_ok": auth_ok,
            "last_error": auth_error,
            "details": auth_payload,
        },
        "lanes": lanes,
        "version": 1,
    }
    output_path = Path(args.output) if args.output else LATEST_PATH
    history_path = Path(args.history_path) if args.history_path else HISTORY_PATH
    output_path.parent.mkdir(parents=True, exist_ok=True)
    history_path.parent.mkdir(parents=True, exist_ok=True)
    atomic_write_json(output_path, snapshot)
    append_jsonl(history_path, snapshot)
    print(json.dumps(snapshot, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
