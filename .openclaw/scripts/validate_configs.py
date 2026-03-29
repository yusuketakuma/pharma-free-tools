#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config"
SCHEMAS = ROOT / "schemas"
SCRIPTS = ROOT / "scripts"
QUEUE_ROOT = ROOT / "runtime" / "queue"
sys.path.insert(0, str(SCRIPTS))

from task_runtime import (  # noqa: E402
    QUEUE_REASONS,
    ValidationError,
    load_claude_code_config,
    load_json,
    read_queue_artifact,
    validate_json_value,
    validate_payload,
    write_runtime_metrics,
)


def validate_schema_files() -> None:
    json_files = sorted(SCHEMAS.glob("*.json"))
    if not json_files:
        raise FileNotFoundError("no schema json files found")
    for path in json_files:
        payload = load_json(path)
        if not isinstance(payload, dict):
            raise ValidationError(f"schema is not an object: {path}")
        validate_json_value({"type": "object"}, payload, path.name)
        print(f"ok schema {path.relative_to(ROOT)}")


def validate_yaml_presence() -> None:
    yaml_files = sorted(CONFIG.glob("*.yaml"))
    if not yaml_files:
        raise FileNotFoundError("no yaml config files found")
    for path in yaml_files:
        text = path.read_text(encoding="utf-8")
        if not text.strip():
            raise ValidationError(f"empty file: {path}")
        if ":" not in text:
            raise ValidationError(f"not yaml-like: {path}")
        print(f"ok yaml {path.relative_to(ROOT)}")


def validate_claude_code() -> None:
    config = load_claude_code_config()
    required = [
        "mode",
        "primary_mode",
        "secondary_mode",
        "backend_safety_net",
        "bin",
        "model",
        "permission_mode_default",
        "permission_mode_execute",
        "timeout_sec",
        "max_turns",
        "max_budget_usd",
        "use_json_schema",
        "save_raw_response",
        "settings_strategy",
        "use_bare_for_low_risk",
        "restrict_tools",
        "allow_result_json_fallback",
        "fallback_accept_root_json_string",
        "fallback_accept_single_fenced_json",
        "fallback_accept_free_text_json",
        "retry_on_json_schema_cold_start",
        "auto_publish_requires_strict_output_for_write_tasks",
        "auth",
    ]
    missing = [key for key in required if key not in config]
    if missing:
        raise ValidationError(f"claude-code config missing keys: {', '.join(missing)}")
    print("ok claude-code config", json.dumps(config, ensure_ascii=False))


def validate_runtime_queue() -> None:
    for reason in QUEUE_REASONS:
        queue_dir = QUEUE_ROOT / reason
        if not queue_dir.exists():
            continue
        for path in sorted(queue_dir.glob("*.json")):
            read_queue_artifact(path)
            print(f"ok queue {path.relative_to(ROOT)}")
    metrics = write_runtime_metrics()
    print("ok metrics", json.dumps(metrics, ensure_ascii=False))


def main() -> int:
    validate_yaml_presence()
    validate_schema_files()
    validate_claude_code()
    validate_payload("lane-selection", {
        "task_id": "validate-sample",
        "provider": "claude_code",
        "primary_mode": "acp",
        "selected_lane": "acp",
        "fallback_chain": ["acp", "cli", "cli_backend_safety_net"],
        "selection_reasons": ["validate sample"],
        "lane_health_snapshot": {"captured_at": "2026-03-22T13:00:00+09:00"},
        "captured_at": "2026-03-22T13:00:00+09:00",
        "version": 1,
    })
    validate_payload("dispatch-attempt", {
        "task_id": "validate-sample",
        "dispatch_id": "dispatch-sample",
        "dispatch_attempt_id": "dispatch-sample_attempt_01",
        "lane": "acp",
        "attempt_index": 1,
        "started_at": "2026-03-22T13:00:00+09:00",
        "finished_at": "2026-03-22T13:00:01+09:00",
        "status": "success",
        "result_code": None,
        "fallback_triggered": False,
        "fallback_target": None,
        "version": 1,
    })
    print("ok artifact schemas lane-selection dispatch-attempt")
    validate_runtime_queue()
    return 0


if __name__ == "__main__":
    sys.exit(main())
