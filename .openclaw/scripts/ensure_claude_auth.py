#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_ROOT))

from task_runtime import atomic_write_json, atomic_write_text, evaluate_claude_auth_status, load_claude_code_config  # noqa: E402


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Ensure Claude Code auth and persist task-local artifacts")
    p.add_argument("--task-dir", required=True)
    p.add_argument("--cli-bin")
    p.add_argument("--auth-status-path")
    p.add_argument("--auth-log-path")
    p.add_argument("--execution-result-path")
    p.add_argument("--raw-path")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    task_dir = Path(args.task_dir).resolve()
    task_dir.mkdir(parents=True, exist_ok=True)
    config = load_claude_code_config()
    auth_cfg = config.get("auth", {}) if isinstance(config.get("auth"), dict) else {}
    cli_bin = args.cli_bin or config.get("bin") or "claude"
    auth_status_path = Path(args.auth_status_path) if args.auth_status_path else task_dir / "auth-status.json"
    auth_log_path = Path(args.auth_log_path) if args.auth_log_path else task_dir / "auth-preflight.log"
    execution_result_path = Path(args.execution_result_path) if args.execution_result_path else task_dir / "execution-result.json"
    raw_path = Path(args.raw_path) if args.raw_path else task_dir / "claude-raw.json"
    runtime_cache_path = ROOT / "runtime" / "auth" / "latest-status.json"
    runtime_cache_path.parent.mkdir(parents=True, exist_ok=True)

    command = [cli_bin, "auth", "status", "--json"]
    started_at = now_iso()
    completed = subprocess.run(command, check=False, capture_output=True, text=True)
    parsed = None
    parse_error = None
    try:
        parsed = json.loads(completed.stdout) if completed.stdout.strip() else None
    except Exception as exc:  # noqa: BLE001
        parse_error = str(exc)

    log_lines = [
        f"[{started_at}] command={' '.join(command)}",
        f"exit_code={completed.returncode}",
        "--- stdout ---",
        completed.stdout.rstrip(),
        "--- stderr ---",
        completed.stderr.rstrip(),
    ]
    atomic_write_text(auth_log_path, "\n".join(log_lines).rstrip() + "\n")

    logged_in = False
    auth_method = None
    normalized_auth_method = None
    user_email = None
    auth_error = None
    if isinstance(parsed, dict):
        logged_in = bool(parsed.get("loggedIn") or parsed.get("authenticated") or parsed.get("ok"))
        auth_method = parsed.get("authMethod") or parsed.get("method")
        user_email = parsed.get("email") or parsed.get("userEmail")
        auth_ok, normalized_auth_method, auth_error = evaluate_claude_auth_status(parsed, auth_cfg)
    else:
        auth_ok = False

    payload = {
        "checked_at": now_iso(),
        "ok": completed.returncode == 0 and auth_ok,
        "auth_ok": completed.returncode == 0 and auth_ok,
        "cli": cli_bin,
        "command": command,
        "exit_code": completed.returncode,
        "logged_in": logged_in,
        "auth_method": auth_method,
        "normalized_auth_method": normalized_auth_method,
        "allowed_auth_methods": auth_cfg.get("allowed_methods") or [auth_cfg.get("primary_method") or "claude_subscription"],
        "user_email": user_email,
        "raw_path": str(raw_path),
        "log_path": str(auth_log_path),
        "runtime_cache_path": str(runtime_cache_path),
        "stderr": completed.stderr,
    }
    if parse_error:
        payload["message"] = f"stdout JSON parse failed: {parse_error}"
    elif auth_error:
        payload["message"] = auth_error
    elif isinstance(parsed, dict) and parsed.get("message"):
        payload["message"] = str(parsed.get("message"))
    if auth_cfg.get("allow_login_hint", True):
        payload["login_hint"] = "Run `claude auth login` and retry once the session is active."
    if parsed is not None:
        payload["stdout"] = parsed

    atomic_write_json(auth_status_path, payload)
    atomic_write_json(runtime_cache_path, payload)

    raw_payload = {
        "kind": "auth_preflight",
        "checked_at": payload["checked_at"],
        "command": command,
        "exit_code": completed.returncode,
        "stdout": parsed if parsed is not None else completed.stdout,
        "stderr": completed.stderr,
    }
    if parse_error:
        raw_payload["stdout_parse_error"] = parse_error
    atomic_write_json(raw_path, raw_payload)

    if payload["ok"]:
        return 0

    result_payload = {
        "task_id": task_dir.name,
        "status": "runtime_error",
        "executor": "claude-code",
        "summary": "Claude auth is required before execution.",
        "changed_files": [],
        "verification_results": ["claude auth status --json"],
        "remaining_risks": ["Claude Code execution blocked until login is completed."],
        "exit_code": 30,
        "started_at": started_at,
        "finished_at": now_iso(),
        "raw_response_path": str(raw_path),
        "_meta": {
            "result_code": "AUTH_REQUIRED",
            "publishable": False,
            "auth_status_path": str(auth_status_path),
            "auth_log_path": str(auth_log_path),
        },
    }
    atomic_write_json(execution_result_path, result_payload)
    return 30 if auth_cfg.get("fail_closed", True) else 0


if __name__ == "__main__":
    sys.exit(main())
