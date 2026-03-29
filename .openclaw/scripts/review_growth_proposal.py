#!/usr/bin/env python3
from __future__ import annotations

import argparse
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
    validate_payload,
)

GROWTH_ROOT = ROOT / "growth"
PROPOSALS_DIR = GROWTH_ROOT / "proposals"
REVIEWS_DIR = GROWTH_ROOT / "reviews"
LEDGERS_DIR = GROWTH_ROOT / "ledgers"
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
DECISION_TO_STATUS = {
    "approve": "APPROVED",
    "reject": "REJECTED",
    "revise": "INBOX",
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Review a growth proposal and persist state + ledger artifacts")
    p.add_argument("--proposal", required=True, help="proposal path or proposal_id")
    p.add_argument("--decision", required=True, choices=["approve", "reject", "revise"])
    p.add_argument("--reviewer", required=True)
    p.add_argument("--reason", required=True)
    p.add_argument("--apply-mode", default="manual", choices=["manual", "assisted"])
    p.add_argument("--approved-path", action="append", default=[])
    p.add_argument("--blocked-path", action="append", default=[])
    p.add_argument("--note", action="append", default=[])
    return p.parse_args()


def resolve_proposal_path(value: str) -> Path:
    candidate = Path(value)
    if candidate.exists():
        return candidate.resolve()
    if not value.endswith(".json"):
        value = f"{value}.json"
    return (PROPOSALS_DIR / value).resolve()


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


def update_ledger(proposal: dict[str, Any], review_path: Path, review: dict[str, Any]) -> Path:
    cycle_id = derive_cycle_id(proposal)
    ledger_path = LEDGERS_DIR / f"{cycle_id}.json"
    ledger = load_json(ledger_path, default={}) or {}
    if not isinstance(ledger, dict):
        ledger = {}
    ledger.setdefault("cycle_id", cycle_id)
    ledger.setdefault("created_at", proposal.get("created_at") or now_iso())
    ledger["updated_at"] = now_iso()
    ledger["proposal_id"] = proposal["proposal_id"]
    ledger["proposal_path"] = str(resolve_proposal_path(proposal["proposal_id"]))
    ledger["proposal_status"] = proposal["status"]
    ledger["review_path"] = str(review_path)
    ledger["last_review"] = {
        "decision": review["decision"],
        "reviewer": review["reviewer"],
        "reason": review["reason"],
        "apply_mode": review["apply_mode"],
        "reviewed_at": review["reviewed_at"],
    }
    events = ledger.setdefault("events", [])
    events.append({
        "at": review["reviewed_at"],
        "type": "review",
        "decision": review["decision"],
        "status": proposal["status"],
        "review_path": str(review_path),
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

    status_before = proposal["status"]
    append_status_history(proposal, status_before, "loaded for review")
    proposal["status"] = "UNDER_REVIEW"
    append_status_history(proposal, "UNDER_REVIEW", f"review started by {args.reviewer}")

    approved_paths = [normalize_path(p) for p in (args.approved_path or []) if normalize_path(p)]
    blocked_paths = [normalize_path(p) for p in (args.blocked_path or []) if normalize_path(p)]
    if not approved_paths and args.decision == "approve":
        approved_paths = [normalize_path(p) for p in proposal.get("affected_paths", []) if normalize_path(str(p))]
    approved_paths = sorted(set(approved_paths))
    blocked_paths = sorted(set(blocked_paths))

    reviewed_at = now_iso()
    final_status = DECISION_TO_STATUS[args.decision]
    proposal["status"] = final_status
    append_status_history(proposal, final_status, f"decision={args.decision}")
    proposal["reviewed_at"] = reviewed_at
    proposal["review"] = {
        "decision": args.decision,
        "reviewer": args.reviewer,
        "reason": args.reason,
        "apply_mode": args.apply_mode,
        "approved_paths": approved_paths,
        "blocked_paths": blocked_paths,
        "notes": args.note,
        "reviewed_at": reviewed_at,
    }
    proposal["next_step"] = {
        "approve": "Run apply_growth_proposal.py to generate an apply plan and ledger update.",
        "reject": "Proposal closed as rejected.",
        "revise": "Revise the proposal and resubmit it to the inbox.",
    }[args.decision]

    review = {
        "review_id": f"{proposal_id}-review",
        "proposal_id": proposal_id,
        "proposal_path": str(proposal_path),
        "reviewed_at": reviewed_at,
        "decision": args.decision,
        "reviewer": args.reviewer,
        "reason": args.reason,
        "apply_mode": args.apply_mode,
        "approved_paths": approved_paths,
        "blocked_paths": blocked_paths,
        "status_before": status_before,
        "status_after": final_status,
        "notes": args.note,
    }
    validate_payload("growth-review", review)

    review_path = REVIEWS_DIR / f"{proposal_id}.review.json"
    atomic_write_json(review_path, review)
    proposal["review_path"] = str(review_path)
    validate_payload("growth-proposal", proposal)
    atomic_write_json(proposal_path, proposal)
    sync_status_projection(proposal_path, proposal)
    ledger_path = update_ledger(proposal, review_path, review)

    ensure_schema_valid(review_path, "growth-review")
    ensure_schema_valid(proposal_path, "growth-proposal")

    print(json.dumps({
        "proposal_id": proposal_id,
        "proposal_path": str(proposal_path),
        "review_path": str(review_path),
        "ledger_path": str(ledger_path),
        "decision": args.decision,
        "status": final_status,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
