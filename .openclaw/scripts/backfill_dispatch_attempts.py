#!/usr/bin/env python3
"""Backfill dispatch-attempts.jsonl and lane-selection.json for older tasks."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from task_runtime import (
    TASKS_ROOT,
    DISPATCH_ATTEMPT_SCHEMA_VERSION,
    LANE_SELECTION_SCHEMA_VERSION,
    ValidationError,
    append_jsonl,
    atomic_write_json,
    load_json,
    now_iso,
    task_paths,
    validate_payload,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backfill dispatch-attempts.jsonl and lane-selection.json")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing files")
    parser.add_argument("--task-id", help="Process a single task by ID")
    return parser.parse_args()


def iter_task_ids(task_id: Optional[str]) -> List[str]:
    if task_id:
        return [task_id]
    if not TASKS_ROOT.exists():
        return []
    return sorted(p.name for p in TASKS_ROOT.iterdir() if p.is_dir())


def map_result_status(result: Dict[str, Any]) -> str:
    """Map execution-result status/exit_code to dispatch-attempt status enum."""
    status = str(result.get("status") or "")
    meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
    result_code = str(meta.get("result_code") or "")
    exit_code = result.get("exit_code")

    valid_statuses = {"success", "policy_blocked", "timeout", "runtime_error", "invalid_request", "invalid_result", "failed"}
    if status in valid_statuses:
        return status
    if result_code == "AUTH_REQUIRED":
        return "runtime_error"
    if result_code == "POLICY_BLOCKED":
        return "policy_blocked"
    if result_code == "TIMEOUT":
        return "timeout"
    if exit_code == 0:
        return "success"
    if exit_code is not None and exit_code != 0:
        return "failed"
    return "failed"


def backfill_dispatch_attempts(task_id: str, paths: Dict[str, Path], dry_run: bool) -> bool:
    if paths["dispatch_attempts"].exists():
        return False  # already present, skip

    dispatch = load_json(paths["dispatch"], default=None)
    result = load_json(paths["result"], default=None)
    if not dispatch:
        return False  # cannot synthesize without dispatch-plan

    dispatch_id = str(dispatch.get("dispatch_id") or "")
    selected_lane = str(dispatch.get("selected_lane") or "none")
    if selected_lane not in {"acp", "cli", "cli_backend_safety_net", "none"}:
        selected_lane = "none"

    started_at = now_iso()
    finished_at = now_iso()
    status = "failed"
    exit_code: Optional[int] = None
    result_code: Optional[str] = None

    if result and isinstance(result, dict):
        started_at = str(result.get("started_at") or started_at)
        finished_at = str(result.get("finished_at") or finished_at)
        exit_code = result.get("exit_code")
        if not isinstance(exit_code, int):
            exit_code = None
        meta = result.get("_meta") if isinstance(result.get("_meta"), dict) else {}
        result_code = str(meta.get("result_code") or "") or None
        status = map_result_status(result)

    dispatch_attempt_id = f"{dispatch_id}_attempt_01" if dispatch_id else f"{task_id}_attempt_01"

    entry: Dict[str, Any] = {
        "task_id": task_id,
        "dispatch_id": dispatch_id,
        "dispatch_attempt_id": dispatch_attempt_id,
        "lane": selected_lane,
        "attempt_index": 1,
        "started_at": started_at,
        "finished_at": finished_at,
        "status": status,
        "result_code": result_code,
        "fallback_triggered": False,
        "fallback_target": None,
        "version": DISPATCH_ATTEMPT_SCHEMA_VERSION,
    }
    if exit_code is not None:
        entry["exit_code"] = exit_code

    validate_payload("dispatch-attempt", entry)

    if not dry_run:
        append_jsonl(paths["dispatch_attempts"], entry)
    return True


def backfill_lane_selection(task_id: str, paths: Dict[str, Path], dry_run: bool) -> bool:
    if paths["lane_selection"].exists():
        return False  # already present, skip

    dispatch = load_json(paths["dispatch"], default=None)
    if not dispatch:
        return False  # cannot synthesize without dispatch-plan

    selected_lane = str(dispatch.get("selected_lane") or "none")
    if selected_lane not in {"acp", "cli", "cli_backend_safety_net", "none"}:
        selected_lane = "none"

    primary_mode = str(dispatch.get("primary_mode") or "acp")
    if primary_mode not in {"acp", "cli"}:
        primary_mode = "acp"

    fallback_chain = dispatch.get("fallback_chain")
    if not isinstance(fallback_chain, list):
        fallback_chain = [selected_lane]

    selection_reasons = dispatch.get("selection_reasons")
    if not isinstance(selection_reasons, list):
        selection_reasons = dispatch.get("reasons") or []
    selection_reasons = [str(r) for r in selection_reasons]

    lane_health_snapshot = dispatch.get("lane_health_snapshot")
    if not isinstance(lane_health_snapshot, dict):
        lane_health_snapshot = {}

    captured_at = str(dispatch.get("captured_at") or now_iso())
    provider = str(dispatch.get("selected_provider") or "claude_code")

    payload: Dict[str, Any] = {
        "task_id": task_id,
        "provider": provider,
        "primary_mode": primary_mode,
        "selected_lane": selected_lane,
        "fallback_chain": fallback_chain,
        "selection_reasons": selection_reasons,
        "lane_health_snapshot": lane_health_snapshot,
        "captured_at": captured_at,
        "version": LANE_SELECTION_SCHEMA_VERSION,
    }

    validate_payload("lane-selection", payload)

    if not dry_run:
        atomic_write_json(paths["lane_selection"], payload)
    return True


def main() -> int:
    args = parse_args()
    task_ids = iter_task_ids(args.task_id)

    scanned = 0
    backfilled_attempts = 0
    backfilled_lanes = 0
    skipped = 0
    errors = 0

    for tid in task_ids:
        scanned += 1
        paths = task_paths(tid)
        if not paths["dir"].exists():
            print(f"[SKIP] {tid}: directory not found")
            skipped += 1
            continue

        task_backfilled = False
        try:
            did_attempts = backfill_dispatch_attempts(tid, paths, args.dry_run)
            did_lane = backfill_lane_selection(tid, paths, args.dry_run)

            if did_attempts:
                tag = "[DRY-RUN] " if args.dry_run else ""
                print(f"{tag}[BACKFILL] {tid}: wrote dispatch-attempts.jsonl")
                backfilled_attempts += 1
                task_backfilled = True
            if did_lane:
                tag = "[DRY-RUN] " if args.dry_run else ""
                print(f"{tag}[BACKFILL] {tid}: wrote lane-selection.json")
                backfilled_lanes += 1
                task_backfilled = True

            if not task_backfilled:
                skipped += 1

        except ValidationError as exc:
            print(f"[ERROR] {tid}: validation failed — {exc}")
            errors += 1
        except Exception as exc:  # noqa: BLE001
            print(f"[ERROR] {tid}: unexpected error — {exc}")
            errors += 1

    print()
    print(f"Summary: scanned={scanned} backfilled_attempts={backfilled_attempts} backfilled_lanes={backfilled_lanes} skipped={skipped} errors={errors}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
