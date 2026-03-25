#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

from task_runtime import CONFIG_ROOT, ROOT, SCHEMAS_ROOT, TASKS_ROOT, ValidationError, append_jsonl, ensure_schema_valid, load_json, now_iso

BOARD_RUNTIME_ROOT = ROOT / "runtime" / "board"
BOARD_RUNTIME_ROOT.mkdir(parents=True, exist_ok=True)
LEDGER_PATH = BOARD_RUNTIME_ROOT / "decision-ledger.jsonl"
PRECEDENTS_PATH = BOARD_RUNTIME_ROOT / "precedents.jsonl"
STANDING_APPROVALS_PATH = BOARD_RUNTIME_ROOT / "standing-approvals.jsonl"
DEFERRED_QUEUE_PATH = BOARD_RUNTIME_ROOT / "deferred-queue.jsonl"
SIGNALS_PATH = BOARD_RUNTIME_ROOT / "signals.jsonl"
CANDIDATES_PATH = BOARD_RUNTIME_ROOT / "agenda-candidates.jsonl"
CASES_PATH = BOARD_RUNTIME_ROOT / "agenda-cases.jsonl"
RISK_CONFIG_PATH = CONFIG_ROOT / "board-risk-scoring.json"


def _load_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        payload = json.loads(line)
        if isinstance(payload, dict):
            rows.append(payload)
    return rows


def _new_id(prefix: str) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{prefix}-{ts}-{Path('/tmp').stat().st_mtime_ns % 1000000:06d}"


def _risk_cfg() -> Dict[str, Any]:
    return load_json(RISK_CONFIG_PATH, default={}) or {}


def write_signal(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(payload, "signal-event")
    append_jsonl(SIGNALS_PATH, payload)
    return payload


def write_candidate(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(payload, "agenda-candidate")
    append_jsonl(CANDIDATES_PATH, payload)
    return payload


def write_case(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(payload, "agenda-case")
    append_jsonl(CASES_PATH, payload)
    return payload


def write_decision(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(payload, "decision-record")
    append_jsonl(LEDGER_PATH, payload)
    return payload


def write_precedent(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(payload, "precedent-record")
    append_jsonl(PRECEDENTS_PATH, payload)
    return payload


def write_standing_approval(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(payload, "standing-approval")
    append_jsonl(STANDING_APPROVALS_PATH, payload)
    return payload


def write_deferred(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(payload, "deferred-item")
    append_jsonl(DEFERRED_QUEUE_PATH, payload)
    return payload


def ensure_payload(payload: Dict[str, Any], schema_name: str) -> None:
    path = TASKS_ROOT / "_board_validate_tmp.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    try:
        ensure_schema_valid(path, schema_name)
    finally:
        try:
            path.unlink()
        except FileNotFoundError:
            pass


def compute_lane(score: int, mandatory_deep: bool = False) -> str:
    cfg = _risk_cfg()
    if mandatory_deep:
        return "deep"
    for lane in ("fast", "review", "deep"):
        band = (cfg.get("scoreBands") or {}).get(lane, {})
        if band.get("min") is not None and band.get("max") is not None and band["min"] <= score <= band["max"]:
            return lane
    return "deep"


def build_case_from_candidate(candidate: Dict[str, Any], matched_precedent_id: str | None = None, confidence: str = "low") -> Dict[str, Any]:
    risk_score = int(candidate.get("risk_score", 0)) if isinstance(candidate.get("risk_score"), int) else 0
    mandatory_deep = bool(candidate.get("mandatory_deep", False))
    lane = compute_lane(risk_score, mandatory_deep)
    quorum = None
    board_mode = "auto"
    if lane == "review":
        quorum = "strategy_ops"
        board_mode = "quorum_review"
    elif lane == "deep":
        quorum = "full_board"
        board_mode = "deep_review"
    elif matched_precedent_id:
        board_mode = "auto"
    else:
        board_mode = "chair_ack"
    payload = {
        "case_id": _new_id("case"),
        "source_proposals": [candidate["proposal_id"]],
        "source_signals": candidate.get("evidence", {}).get("signals", []),
        "canonical_title": candidate["title"],
        "canonical_summary": candidate["summary"],
        "root_issue": candidate["summary"],
        "desired_change": candidate["requested_action"]["type"] + ":" + candidate["requested_action"]["target"],
        "impact_profile": candidate["change_scope"],
        "precedent_match": {
            "matched": bool(matched_precedent_id),
            "precedent_id": matched_precedent_id,
            "standing_approval": False,
            "confidence": confidence,
        },
        "risk": {
            "score": risk_score,
            "lane": lane,
            "mandatory_deep": mandatory_deep,
            "reasons": candidate.get("risk_reasons", []),
        },
        "disposition_options": ["adopt", "defer", "reject", "investigate"],
        "routing": {"board_mode": board_mode, "quorum_profile": quorum},
        "state": "routed",
    }
    return payload


def build_decision_from_case(case: Dict[str, Any], ruling: str = "adopted") -> Dict[str, Any]:
    lane = case["risk"]["lane"]
    board_mode = {
        "fast": "chair_ack" if case["routing"]["board_mode"] == "chair_ack" else "fast_auto",
        "review": "quorum_review",
        "deep": "deep_review",
    }[lane]
    participants = {
        "fast_auto": ["chair"],
        "chair_ack": ["chair"],
        "quorum_review": ["chair", "visionary", "operator"],
        "deep_review": ["chair", "visionary", "user_advocate", "operator", "auditor"],
    }[board_mode]
    decision = {
        "decision_id": _new_id("decision"),
        "case_id": case["case_id"],
        "proposal_ids": case["source_proposals"],
        "decided_at": now_iso(),
        "board_mode": {
            "type": board_mode,
            "participants": participants,
            "quorum_profile": case["routing"]["quorum_profile"],
        },
        "lane": {
            "risk_lane": lane,
            "risk_score": case["risk"]["score"],
            "mandatory_deep": case["risk"]["mandatory_deep"],
            "score_breakdown": {
                "boundary_impact": 0,
                "blast_radius": 0,
                "reversibility": 0,
                "novelty": 0,
                "trust_user_impact": 0,
                "dependency_spread": 0,
            },
        },
        "ruling": {"result": ruling, "confidence": "medium"},
        "reason": {
            "accepted_because": [case["canonical_summary"]] if ruling == "adopted" else [],
            "deferred_because": [case["canonical_summary"]] if ruling == "deferred" else [],
            "rejected_because": [case["canonical_summary"]] if ruling == "rejected" else [],
            "tradeoffs": [],
        },
        "guardrail": {
            "constraints": [],
            "forbidden_actions": [],
            "required_checks": [],
            "rollout_mode": "direct" if lane == "fast" else "staged" if lane == "review" else "simulation",
        },
        "followup": {
            "owner": "supervisor-core",
            "target_agents": [],
            "monitor_metrics": [],
            "checkpoint_at": None,
            "reopen_condition": [],
        },
        "precedent": {
            "creates_precedent": False,
            "precedent_id": case["precedent_match"]["precedent_id"],
            "standing_approval_candidate": False,
            "precedent_scope": None,
        },
        "reporting": {
            "board_summary": case["canonical_summary"],
            "adopted_summary": case["canonical_summary"] if ruling == "adopted" else "",
            "deferred_summary": case["canonical_summary"] if ruling == "deferred" else "",
            "rejected_summary": case["canonical_summary"] if ruling == "rejected" else "",
        },
        "provenance": {
            "derived_from_signals": case["source_signals"],
            "derived_from_candidates": case["source_proposals"],
            "applied_precedents": [case["precedent_match"]["precedent_id"]] if case["precedent_match"]["precedent_id"] else [],
            "supersedes_decision_id": None,
        },
    }
    return decision


def read_ledger() -> List[Dict[str, Any]]:
    return _load_jsonl(LEDGER_PATH)


def read_deferred() -> List[Dict[str, Any]]:
    return _load_jsonl(DEFERRED_QUEUE_PATH)


def read_precedents() -> List[Dict[str, Any]]:
    return _load_jsonl(PRECEDENTS_PATH)


def active_unresolved_items() -> List[Dict[str, Any]]:
    deferred = [item for item in read_deferred() if item.get("status") in {"open", "reopened"}]
    return deferred


def ledger_snapshot(hours: int = 24) -> Dict[str, Any]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = []
    for row in read_ledger():
        decided_at = row.get("decided_at")
        try:
            ts = datetime.fromisoformat(str(decided_at))
        except Exception:
            continue
        if ts >= cutoff:
            rows.append(row)
    lane_counts = Counter(row.get("lane", {}).get("risk_lane", "unknown") for row in rows)
    ruling_counts = Counter(row.get("ruling", {}).get("result", "unknown") for row in rows)
    return {
        "generated_at": now_iso(),
        "window_hours": hours,
        "decision_count": len(rows),
        "lane_counts": dict(lane_counts),
        "ruling_counts": dict(ruling_counts),
        "active_unresolved_count": len(active_unresolved_items()),
        "latest_decisions": rows[-10:],
    }


def render_report_view(hours: int = 24) -> str:
    snapshot = ledger_snapshot(hours=hours)
    lines = [
        "# Board Decision Ledger View",
        "",
        f"- generated_at: {snapshot['generated_at']}",
        f"- window_hours: {snapshot['window_hours']}",
        f"- decision_count: {snapshot['decision_count']}",
        f"- active_unresolved_count: {snapshot['active_unresolved_count']}",
        f"- lane_counts: {json.dumps(snapshot['lane_counts'], ensure_ascii=False)}",
        f"- ruling_counts: {json.dumps(snapshot['ruling_counts'], ensure_ascii=False)}",
        "",
        "## Latest Decisions",
    ]
    for row in snapshot["latest_decisions"]:
        lines.append(f"- [{row.get('decision_id')}] {row.get('ruling', {}).get('result', 'unknown')}: {row.get('reporting', {}).get('board_summary', '')}")
    if not snapshot["latest_decisions"]:
        lines.append("- (none)")
    if snapshot["active_unresolved_count"]:
        lines.extend(["", "## Active Unresolved Items"])
        for item in active_unresolved_items()[:20]:
            lines.append(f"- [{item.get('item_id')}] {item.get('reason', '')}")
    return "\n".join(lines).rstrip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Board runtime helpers")
    sub = parser.add_subparsers(dest="command", required=True)
    view = sub.add_parser("view")
    view.add_argument("--hours", type=int, default=24)
    sub.add_parser("snapshot")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "view":
        print(render_report_view(hours=args.hours))
        return 0
    if args.command == "snapshot":
        print(json.dumps(ledger_snapshot(), ensure_ascii=False, indent=2))
        return 0
    raise ValidationError(f"unknown command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
