#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

from task_runtime import ROOT, now_iso

RUNTIME_PATH = ROOT / "runtime" / "capacity" / "claude-capacity.json"
AUTH_RUNTIME_PATH = ROOT / "runtime" / "auth" / "latest-status.json"
LANE_HEALTH_PATH = ROOT / "runtime" / "health" / "lane-health.json"


def env_float(name: str, default: float, cap: float = 1.0) -> float:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    return max(0.0, min(cap, float(raw)))


def env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def load_json(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def load_previous() -> dict:
    return load_json(RUNTIME_PATH)


def build_snapshot() -> dict:
    previous = load_previous()
    auth_runtime = load_json(AUTH_RUNTIME_PATH)
    lane_health = load_json(LANE_HEALTH_PATH)
    lanes = lane_health.get("lanes") if isinstance(lane_health.get("lanes"), dict) else {}
    lane_auth = lane_health.get("auth") if isinstance(lane_health.get("auth"), dict) else {}

    auth_ok_default = bool(auth_runtime.get("auth_ok", auth_runtime.get("ok", previous.get("auth_ok", True))))
    auth_ok = env_bool("CLAUDE_AUTH_OK", auth_ok_default)
    rpm_pressure = env_float("CLAUDE_RPM_PRESSURE", float(previous.get("rpm_pressure", 0.3)))
    itpm_pressure = env_float("CLAUDE_ITPM_PRESSURE", float(previous.get("itpm_pressure", 0.3)))
    otpm_pressure = env_float("CLAUDE_OTPM_PRESSURE", float(previous.get("otpm_pressure", 0.3)))
    spend_pressure = env_float("CLAUDE_SPEND_PRESSURE", float(previous.get("spend_pressure", 0.2)))
    retry_after_sec = env_float("CLAUDE_RETRY_AFTER_SEC", float(previous.get("retry_after_sec", 0)), cap=86400.0)
    pressure_peak = max(rpm_pressure, itpm_pressure, otpm_pressure, spend_pressure)
    hard_blocked = env_bool(
        "CLAUDE_HARD_BLOCKED",
        (not auth_ok) or pressure_peak >= 0.95 or retry_after_sec >= 300,
    )

    probe_acp = bool((lanes.get("acp") or {}).get("healthy")) if lanes else None
    probe_cli = bool((lanes.get("cli") or {}).get("healthy")) if lanes else None
    probe_cli_backend = bool((lanes.get("cli_backend_safety_net") or {}).get("healthy")) if lanes else None

    known_bare_auth_gap = (
        bool(auth_ok)
        and str(auth_runtime.get("normalized_auth_method") or auth_runtime.get("auth_method") or "") in {"claude_subscription", "claude.ai"}
        and not os.environ.get("ANTHROPIC_API_KEY")
    )

    healthy_default = auth_ok and (not hard_blocked) and pressure_peak < 0.9
    healthy = env_bool("CLAUDE_HEALTHY", healthy_default)
    acp_healthy = env_bool("CLAUDE_ACP_HEALTHY", probe_acp if probe_acp is not None else healthy)
    cli_healthy = env_bool("CLAUDE_CLI_HEALTHY", probe_cli if probe_cli is not None else healthy)
    cli_backend_default = probe_cli_backend if probe_cli_backend is not None else (False if known_bare_auth_gap else cli_healthy)
    cli_backend_healthy = env_bool("CLAUDE_CLI_BACKEND_HEALTHY", cli_backend_default)

    source = "derived_env_or_cache"
    if lanes or auth_runtime:
        source = "runtime_auth_and_probe"

    snapshot = {
        "healthy": healthy,
        "acp_healthy": acp_healthy,
        "cli_healthy": cli_healthy,
        "cli_backend_healthy": cli_backend_healthy,
        "auth_ok": auth_ok,
        "rpm_pressure": rpm_pressure,
        "itpm_pressure": itpm_pressure,
        "otpm_pressure": otpm_pressure,
        "spend_pressure": spend_pressure,
        "retry_after_sec": retry_after_sec,
        "hard_blocked": hard_blocked,
        "captured_at": now_iso(),
        "source": source,
    }
    if lane_auth:
        snapshot["auth_source"] = lane_auth
    if known_bare_auth_gap:
        snapshot["cli_backend_gap"] = "--bare requires API key auth and does not use claude.ai subscription auth"
    return snapshot


def main() -> int:
    snapshot = build_snapshot()
    Path(RUNTIME_PATH).parent.mkdir(parents=True, exist_ok=True)
    RUNTIME_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(snapshot, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
