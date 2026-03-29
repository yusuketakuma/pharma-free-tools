#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

from task_runtime import ROOT, atomic_write_json, load_claude_code_config, load_json, now_iso

METRICS_PATH = ROOT / "runtime" / "metrics" / "latest-metrics.json"
CAPACITY_PATH = ROOT / "runtime" / "capacity" / "claude-capacity.json"
AUTH_PATH = ROOT / "runtime" / "auth" / "latest-status.json"
LANE_HEALTH_PATH = ROOT / "runtime" / "health" / "lane-health.json"
DEFAULT_OUTPUT = ROOT / "runtime" / "metrics" / "lane-health-probe.json"

FALLBACK_CHAIN: List[str] = ["acp", "cli", "cli_backend_safety_net"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lane health probe for OpenClaw hybrid runtime")
    parser.add_argument("--json", dest="json_output", action="store_true", help="Machine-readable JSON output")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Write probe result to this path")
    return parser.parse_args()


def build_probe() -> Dict[str, Any]:
    metrics = load_json(METRICS_PATH, default={}) or {}
    capacity = load_json(CAPACITY_PATH, default={}) or {}
    auth_data = load_json(AUTH_PATH, default={}) or {}
    lane_health = load_json(LANE_HEALTH_PATH, default={}) or {}
    config = load_claude_code_config()
    primary_mode = str(config.get("primary_mode") or "acp")

    lanes_payload = lane_health.get("lanes") if isinstance(lane_health.get("lanes"), dict) else {}
    auth_payload = lane_health.get("auth") if isinstance(lane_health.get("auth"), dict) else {}

    auth_ok = bool(auth_payload.get("auth_ok", auth_data.get("auth_ok", auth_data.get("ok", capacity.get("auth_ok", True)))))
    acp_healthy = bool((lanes_payload.get("acp") or {}).get("healthy", capacity.get("acp_healthy", capacity.get("healthy", False))))
    cli_healthy = bool((lanes_payload.get("cli") or {}).get("healthy", capacity.get("cli_healthy", capacity.get("healthy", False))))
    cli_backend_healthy = bool((lanes_payload.get("cli_backend_safety_net") or {}).get("healthy", capacity.get("cli_backend_healthy", cli_healthy)))

    lane_healthy: Dict[str, bool] = {
        "acp": acp_healthy,
        "cli": cli_healthy,
        "cli_backend_safety_net": cli_backend_healthy,
    }
    fallback_chain = ["cli", "cli_backend_safety_net"] if primary_mode == "cli" else ["acp", "cli", "cli_backend_safety_net"]

    recommended_lane: str | None = None
    for lane in fallback_chain:
        if lane_healthy.get(lane):
            recommended_lane = lane
            break

    degraded_lanes = [lane for lane in FALLBACK_CHAIN if not lane_healthy.get(lane)]
    any_lane_healthy = any(lane_healthy[lane] for lane in fallback_chain)
    system_healthy = any_lane_healthy and auth_ok

    return {
        "probed_at": now_iso(),
        "system_healthy": system_healthy,
        "auth_ok": auth_ok,
        "primary_mode": primary_mode,
        "recommended_lane": recommended_lane,
        "degraded_lanes": degraded_lanes,
        "lane_health_snapshot_ref": str(LANE_HEALTH_PATH.relative_to(ROOT.parent)) if LANE_HEALTH_PATH.exists() else None,
        "lanes": {
            "acp": {
                "healthy": acp_healthy,
                "transport_kind": (lanes_payload.get("acp") or {}).get("transport_kind"),
                "consecutive_failures": int(metrics.get("acp_consecutive_failures", 0) or 0),
                "last_success_at": metrics.get("acp_last_success_at"),
                "last_error": (lanes_payload.get("acp") or {}).get("last_error"),
            },
            "cli": {
                "healthy": cli_healthy,
                "transport_kind": (lanes_payload.get("cli") or {}).get("transport_kind"),
                "consecutive_failures": int(metrics.get("cli_consecutive_failures", 0) or 0),
                "last_success_at": metrics.get("cli_last_success_at"),
                "last_error": (lanes_payload.get("cli") or {}).get("last_error"),
            },
            "cli_backend_safety_net": {
                "healthy": cli_backend_healthy,
                "transport_kind": (lanes_payload.get("cli_backend_safety_net") or {}).get("transport_kind"),
                "consecutive_failures": int(metrics.get("cli_consecutive_failures", 0) or 0),
                "last_success_at": metrics.get("cli_last_success_at"),
                "last_error": (lanes_payload.get("cli_backend_safety_net") or {}).get("last_error"),
            },
        },
        "capacity": {
            "retry_after_sec": float(capacity.get("retry_after_sec", 0) or 0),
            "hard_blocked": bool(capacity.get("hard_blocked", False)),
        },
    }


def exit_code(probe: Dict[str, Any]) -> int:
    if not probe["auth_ok"] or not any(probe["lanes"][l]["healthy"] for l in FALLBACK_CHAIN):
        return 2
    if probe["degraded_lanes"]:
        return 1
    return 0


def human_summary(probe: Dict[str, Any]) -> str:
    lines = [
        f"Lane Health Probe  {probe['probed_at']}",
        f"  system_healthy : {probe['system_healthy']}",
        f"  auth_ok        : {probe['auth_ok']}",
        f"  primary_mode   : {probe['primary_mode']}",
        f"  recommended    : {probe['recommended_lane'] or 'none'}",
        f"  degraded_lanes : {probe['degraded_lanes'] or '[]'}",
        "",
        "Lanes:",
    ]
    for lane, info in probe["lanes"].items():
        status = "OK" if info["healthy"] else "NG"
        failures = info["consecutive_failures"]
        last = info["last_success_at"] or "never"
        transport = info.get("transport_kind") or "unknown"
        error = info.get("last_error") or "-"
        lines.append(f"  {lane:<28} {status}  failures={failures}  last_ok={last}  transport={transport}  error={error}")
    cap = probe["capacity"]
    lines += [
        "",
        f"Capacity: retry_after={cap['retry_after_sec']}s  hard_blocked={cap['hard_blocked']}",
    ]
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    probe = build_probe()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    atomic_write_json(output_path, probe)
    if args.json_output:
        print(json.dumps(probe, ensure_ascii=False, indent=2))
    else:
        print(human_summary(probe))
    return exit_code(probe)


if __name__ == "__main__":
    raise SystemExit(main())
