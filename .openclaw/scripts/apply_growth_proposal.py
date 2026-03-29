#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fnmatch
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_ROOT))

from task_runtime import (  # noqa: E402
    atomic_write_json,
    ensure_schema_valid,
    load_json,
    normalize_path,
    now_iso,
    parse_simple_yaml_list,
    validate_payload,
)

GROWTH_ROOT = ROOT / "growth"
PROPOSALS_DIR = GROWTH_ROOT / "proposals"
REVIEWS_DIR = GROWTH_ROOT / "reviews"
APPLY_RESULTS_DIR = GROWTH_ROOT / "apply-results"
LEDGERS_DIR = GROWTH_ROOT / "ledgers"
CONFIG_PATH = ROOT / "config" / "growth-policy.yaml"
STATUS_DIRS = {
    "INBOX": GROWTH_ROOT / "inbox",
    "UNDER_REVIEW": GROWTH_ROOT / "under-review",
    "APPROVED": GROWTH_ROOT / "approved",
    "REJECTED": GROWTH_ROOT / "rejected",
    "APPLIED": GROWTH_ROOT / "applied",
    "VERIFIED": GROWTH_ROOT / "verified",
}
LEGACY_STATUS_MAP = {
    "proposed": "INBOX",
    "approved": "APPROVED",
    "rejected": "REJECTED",
    "applied": "APPLIED",
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Apply a reviewed growth proposal with guardrails")
    p.add_argument("--proposal", required=True, help="proposal path or proposal_id")
    p.add_argument("--review", help="review path; defaults to growth/reviews/<proposal_id>.review.json")
    return p.parse_args()


def resolve_proposal_path(value: str) -> Path:
    candidate = Path(value)
    if candidate.exists():
        return candidate.resolve()
    if not value.endswith(".json"):
        value = f"{value}.json"
    return (PROPOSALS_DIR / value).resolve()


def resolve_review_path(proposal_id: str, value: str | None) -> Path:
    if value:
        candidate = Path(value)
        if candidate.exists():
            return candidate.resolve()
        raise SystemExit(f"review not found: {value}")
    return (REVIEWS_DIR / f"{proposal_id}.review.json").resolve()


def derive_cycle_id(proposal: dict[str, Any]) -> str:
    proposal_id = str(proposal.get("proposal_id") or "")
    if proposal.get("cycle_id"):
        return str(proposal["cycle_id"])
    if proposal_id.endswith("-proposal"):
        return proposal_id[: -len("-proposal")]
    return proposal_id or "growth-cycle"


def normalize_status(status: str | None) -> str:
    raw = str(status or "").strip()
    if not raw:
        return "INBOX"
    return LEGACY_STATUS_MAP.get(raw, raw.upper())


def append_status_history(proposal: dict[str, Any], status: str, note: str) -> None:
    history = proposal.setdefault("status_history", [])
    if not history or history[-1].get("status") != status:
        history.append({"status": status, "at": now_iso(), "note": note})


def sync_status_projection(proposal_path: Path, proposal: dict[str, Any]) -> None:
    target_status = str(proposal.get("status") or "INBOX")
    for status, directory in STATUS_DIRS.items():
        directory.mkdir(parents=True, exist_ok=True)
        snapshot = directory / proposal_path.name
        if status == target_status:
            atomic_write_json(snapshot, proposal)
        elif snapshot.exists():
            snapshot.unlink()


def load_guardrails() -> tuple[list[str], list[str]]:
    text = CONFIG_PATH.read_text(encoding="utf-8") if CONFIG_PATH.exists() else ""
    blocked = parse_simple_yaml_list(text, "auto_apply_blocked")
    assisted_only = parse_simple_yaml_list(text, "assisted_apply_only")
    if not blocked:
        blocked = [
            ".openclaw/config/approval-policy.yaml",
            ".openclaw/config/routing-policy.yaml",
            ".openclaw/config/claude-code.yaml",
            ".openclaw/scripts/run_claude_code.sh",
            "org/**",
        ]
    if not assisted_only:
        assisted_only = [
            ".openclaw/shared/**",
            ".openclaw/workflows/**",
            "projects/*/docs/**",
            "projects/*/learn/**",
        ]
    return blocked, assisted_only


def matches_any(path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(path, pattern) for pattern in patterns)


def update_ledger(proposal: dict[str, Any], result_path: Path, result: dict[str, Any]) -> Path:
    cycle_id = derive_cycle_id(proposal)
    ledger_path = LEDGERS_DIR / f"{cycle_id}.json"
    ledger = load_json(ledger_path, default={}) or {}
    if not isinstance(ledger, dict):
        ledger = {}
    ledger.setdefault("cycle_id", cycle_id)
    ledger.setdefault("created_at", proposal.get("created_at") or now_iso())
    ledger["updated_at"] = now_iso()
    ledger["proposal_id"] = proposal["proposal_id"]
    ledger["proposal_status"] = proposal["status"]
    ledger["apply_result_path"] = str(result_path)
    ledger["last_apply"] = {
        "status": result["status"],
        "apply_mode": result["apply_mode"],
        "applied_paths": result["applied_paths"],
        "blocked_paths": result["blocked_paths"],
        "manual_paths": result["manual_paths"],
        "applied_at": result["applied_at"],
    }
    events = ledger.setdefault("events", [])
    events.append({
        "at": result["applied_at"],
        "type": "apply",
        "status": result["status"],
        "proposal_status": proposal["status"],
        "apply_result_path": str(result_path),
    })
    atomic_write_json(ledger_path, ledger)
    return ledger_path


def main() -> int:
    args = parse_args()
    proposal_path = resolve_proposal_path(args.proposal)
    proposal = load_json(proposal_path)
    if not isinstance(proposal, dict):
        raise SystemExit(f"proposal not found or invalid: {proposal_path}")

    proposal_id = str(proposal.get("proposal_id") or proposal_path.stem)
    proposal["proposal_id"] = proposal_id
    proposal["cycle_id"] = derive_cycle_id(proposal)
    proposal["status"] = normalize_status(str(proposal.get("status") or "INBOX"))
    review_path = resolve_review_path(proposal_id, args.review)
    review = ensure_schema_valid(review_path, "growth-review")

    requested_paths = [normalize_path(p) for p in review.get("approved_paths", []) if normalize_path(str(p))]
    explicitly_blocked = {normalize_path(p) for p in review.get("blocked_paths", []) if normalize_path(str(p))}
    blocked_patterns, assisted_only_patterns = load_guardrails()

    if review["decision"] != "approve":
        requested_paths = requested_paths or [normalize_path(p) for p in proposal.get("affected_paths", []) if normalize_path(str(p))]
        result = {
            "apply_id": f"{proposal_id}-apply",
            "proposal_id": proposal_id,
            "applied_at": now_iso(),
            "proposal_path": str(proposal_path),
            "review_path": str(review_path),
            "apply_mode": review["apply_mode"],
            "status": "skipped",
            "requested_paths": sorted(set(requested_paths)),
            "applied_paths": [],
            "blocked_paths": sorted(explicitly_blocked),
            "manual_paths": [],
            "apply_plan": [],
            "proposal_status_before": proposal["status"],
            "proposal_status_after": proposal["status"],
            "notes": [f"review decision={review['decision']} so apply was skipped"],
        }
    else:
        proposal_status_before = proposal["status"]
        if proposal_status_before != "APPROVED":
            proposal["status"] = "APPROVED"
            append_status_history(proposal, "APPROVED", "normalized prior to apply")
        apply_plan = []
        applied_paths: list[str] = []
        blocked_paths: list[str] = []
        manual_paths: list[str] = []
        for path in sorted(set(requested_paths)):
            if path in explicitly_blocked or matches_any(path, blocked_patterns):
                blocked_paths.append(path)
                reason = "guardrail_blocked"
                apply_plan.append({"path": path, "disposition": "blocked", "reason": reason})
                continue
            if matches_any(path, assisted_only_patterns):
                if review["apply_mode"] == "assisted":
                    applied_paths.append(path)
                    apply_plan.append({"path": path, "disposition": "assisted", "reason": "assisted_apply_allowed"})
                else:
                    manual_paths.append(path)
                    apply_plan.append({"path": path, "disposition": "manual", "reason": "assisted_only_requires_assisted_mode"})
                continue
            manual_paths.append(path)
            apply_plan.append({"path": path, "disposition": "manual", "reason": "non_guardrail_path_requires_manual_execution"})

        result_status = "blocked"
        if applied_paths:
            result_status = "applied"
        elif manual_paths:
            result_status = "manual_required"

        notes = []
        if blocked_paths:
            notes.append("guardrail-blocked paths were not auto-applied")
        if applied_paths:
            notes.append("assisted apply generated a safe apply plan; target files were not mutated automatically")
        if manual_paths:
            notes.append("remaining allowed paths require manual execution outside this automation step")

        result = {
            "apply_id": f"{proposal_id}-apply",
            "proposal_id": proposal_id,
            "applied_at": now_iso(),
            "proposal_path": str(proposal_path),
            "review_path": str(review_path),
            "apply_mode": review["apply_mode"],
            "status": result_status,
            "requested_paths": sorted(set(requested_paths)),
            "applied_paths": applied_paths,
            "blocked_paths": blocked_paths,
            "manual_paths": manual_paths,
            "apply_plan": apply_plan,
            "proposal_status_before": proposal_status_before,
            "proposal_status_after": "APPLIED" if applied_paths else proposal["status"],
            "notes": notes,
        }
        if applied_paths:
            proposal["status"] = "APPLIED"
            append_status_history(proposal, "APPLIED", "assisted apply plan generated")
            proposal["apply_result_path"] = str((APPLY_RESULTS_DIR / f"{proposal_id}.apply.json").resolve())
            proposal["next_step"] = "Run verification before moving to VERIFIED."
        else:
            proposal["next_step"] = "Resolve blocked/manual paths before verification."

    validate_payload("growth-apply-result", result)
    result_path = APPLY_RESULTS_DIR / f"{proposal_id}.apply.json"
    atomic_write_json(result_path, result)
    proposal["apply_result_path"] = str(result_path)
    validate_payload("growth-proposal", proposal)
    atomic_write_json(proposal_path, proposal)
    sync_status_projection(proposal_path, proposal)
    ledger_path = update_ledger(proposal, result_path, result)

    ensure_schema_valid(result_path, "growth-apply-result")
    ensure_schema_valid(proposal_path, "growth-proposal")

    print(json.dumps({
        "proposal_id": proposal_id,
        "proposal_path": str(proposal_path),
        "review_path": str(review_path),
        "apply_result_path": str(result_path),
        "ledger_path": str(ledger_path),
        "status": result["status"],
        "proposal_status": proposal["status"],
        "applied_paths": result["applied_paths"],
        "blocked_paths": result["blocked_paths"],
        "manual_paths": result["manual_paths"],
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
