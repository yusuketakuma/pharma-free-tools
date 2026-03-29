#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

from task_runtime import ROOT, now_iso

RUNTIME_PATH = ROOT / "runtime" / "capacity" / "openai-capacity.json"


def env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    return max(0.0, min(1.0, float(raw)))


def env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def load_previous() -> dict:
    if RUNTIME_PATH.exists():
        return json.loads(RUNTIME_PATH.read_text(encoding="utf-8"))
    return {}


def build_snapshot() -> dict:
    previous = load_previous()
    remaining_requests_ratio = env_float(
        "OPENCLAW_REMAINING_REQUESTS_RATIO",
        float(previous.get("remaining_requests_ratio", 0.7)),
    )
    remaining_tokens_ratio = env_float(
        "OPENCLAW_REMAINING_TOKENS_RATIO",
        float(previous.get("remaining_tokens_ratio", 0.7)),
    )
    usage_pressure = env_float(
        "OPENCLAW_USAGE_PRESSURE",
        round(1.0 - min(remaining_requests_ratio, remaining_tokens_ratio), 3),
    )
    cost_pressure = env_float(
        "OPENCLAW_COST_PRESSURE",
        float(previous.get("cost_pressure", min(usage_pressure, 0.95))),
    )
    hard_blocked = env_bool(
        "OPENCLAW_HARD_BLOCKED",
        usage_pressure >= 0.95,
    )
    healthy = env_bool(
        "OPENCLAW_HEALTHY",
        (not hard_blocked) and remaining_requests_ratio > 0.05 and remaining_tokens_ratio > 0.05,
    )
    return {
        "healthy": healthy,
        "remaining_requests_ratio": remaining_requests_ratio,
        "remaining_tokens_ratio": remaining_tokens_ratio,
        "usage_pressure": usage_pressure,
        "cost_pressure": cost_pressure,
        "hard_blocked": hard_blocked,
        "captured_at": now_iso(),
        "source": "derived_env_or_cache",
    }


def main() -> int:
    snapshot = build_snapshot()
    Path(RUNTIME_PATH).parent.mkdir(parents=True, exist_ok=True)
    RUNTIME_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(snapshot, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
