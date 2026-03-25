#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

from task_runtime import CONFIG_ROOT, ROOT, TASKS_ROOT, ValidationError, append_jsonl, ensure_schema_valid, load_json, now_iso

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

BOUNDARY_SCORE = {"none": 0, "low": 0, "medium": 1, "high": 2}
BLAST_SCORE = {"none": 0, "low": 0, "medium": 1, "high": 2}
REVERSIBILITY_SCORE = {"high": 0, "medium": 1, "low": 2}
NOVELTY_SCORE = {"low": 0, "medium": 1, "high": 2}
LAYER_WEIGHT = {"ceo": 1, "board": 1, "execution": 1, "infra": 2, "user-facing": 2}


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


def _hash_id(prefix: str, payload: str) -> str:
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()[:12]
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{prefix}-{ts}-{digest}"


def new_proposal_id(source: str, title: str) -> str:
    return _hash_id("proposal", f"{source}:{title}")


def new_case_id(keys: Iterable[str]) -> str:
    return _hash_id("case", "|".join(keys))


def new_decision_id(case_id: str) -> str:
    return _hash_id("decision", case_id)


def new_precedent_id(title: str) -> str:
    return _hash_id("precedent", title)


def new_approval_id(scope: str) -> str:
    return _hash_id("approval", scope)


def _risk_cfg() -> Dict[str, Any]:
    return load_json(RISK_CONFIG_PATH, default={}) or {}


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


def read_ledger() -> List[Dict[str, Any]]:
    return _load_jsonl(LEDGER_PATH)


def read_deferred() -> List[Dict[str, Any]]:
    return _load_jsonl(DEFERRED_QUEUE_PATH)


def read_precedents() -> List[Dict[str, Any]]:
    return _load_jsonl(PRECEDENTS_PATH)


def read_standing_approvals() -> List[Dict[str, Any]]:
    return _load_jsonl(STANDING_APPROVALS_PATH)


def active_unresolved_items() -> List[Dict[str, Any]]:
    return [item for item in read_deferred() if item.get("status") in {"open", "reopened"}]


def load_recent_decisions(window_hours: int = 6, offset_hours: int = 0) -> List[Dict[str, Any]]:
    return _rows_in_window(hours=window_hours, offset_hours=offset_hours)


def load_active_unresolved_items() -> List[Dict[str, Any]]:
    return active_unresolved_items()


def load_deep_review_status(window_hours: int = 24) -> List[Dict[str, Any]]:
    rows = load_recent_decisions(window_hours=window_hours)
    items = []
    for row in rows:
        deep_state = row.get("deep_review_status", "none")
        if deep_state == "none" and row.get("lane", {}).get("risk_lane") != "deep":
            continue
        items.append({
            "decision_id": row.get("decision_id"),
            "case_id": row.get("source_case_id") or row.get("case_id"),
            "status": deep_state,
            "result": row.get("ruling", {}).get("result", "unknown"),
            "summary": row.get("reporting", {}).get("board_summary", ""),
        })
    return items[-20:]


def load_followups_due(hours_ahead: int = 24) -> List[Dict[str, Any]]:
    due = []
    now = datetime.now(timezone.utc)
    limit = now + timedelta(hours=hours_ahead)
    for row in read_ledger():
        follow = row.get("followup", {}) if isinstance(row.get("followup"), dict) else {}
        due_at = follow.get("followup_due") or follow.get("checkpoint_at")
        if not due_at:
            continue
        try:
            ts = datetime.fromisoformat(str(due_at))
        except Exception:
            continue
        if now <= ts <= limit:
            due.append({
                "decision_id": row.get("decision_id"),
                "owner": follow.get("owner", ""),
                "due_at": due_at,
                "summary": row.get("reporting", {}).get("board_summary", ""),
            })
    return due[-20:]


def load_reopen_candidates() -> List[Dict[str, Any]]:
    items = []
    for row in read_ledger():
        follow = row.get("followup", {}) if isinstance(row.get("followup"), dict) else {}
        reasons = follow.get("reopen_condition") or []
        if reasons:
            items.append({
                "decision_id": row.get("decision_id"),
                "case_id": row.get("source_case_id") or row.get("case_id"),
                "reopen_condition": reasons,
                "summary": row.get("reporting", {}).get("board_summary", ""),
            })
    return items[-20:]


def load_precedent_promotions(window_hours: int = 24) -> List[Dict[str, Any]]:
    rows = load_recent_decisions(window_hours=window_hours)
    items = []
    for row in rows:
        prec = row.get("precedent", {}) if isinstance(row.get("precedent"), dict) else {}
        if prec.get("creates_precedent") or prec.get("standing_approval_candidate"):
            items.append({
                "decision_id": row.get("decision_id"),
                "precedent_id": prec.get("precedent_id"),
                "standing_approval_candidate": bool(prec.get("standing_approval_candidate")),
                "summary": row.get("reporting", {}).get("board_summary", ""),
            })
    return items[-20:]


def normalize_candidate(candidate: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(candidate)
    scope = dict(candidate.get("change_scope") or {})
    for key in ("domains", "repos", "agents", "layers"):
        values = scope.get(key) or []
        scope[key] = sorted({str(v) for v in values if str(v).strip()})
    normalized["change_scope"] = scope
    normalized["root_issue"] = str(candidate.get("root_issue") or candidate.get("summary") or "").strip()
    normalized["desired_change"] = str(candidate.get("desired_change") or f"{candidate['requested_action']['type']}:{candidate['requested_action']['target']}").strip()
    return normalized


def candidate_dedupe_key(candidate: Dict[str, Any]) -> str:
    c = normalize_candidate(candidate)
    scope = c["change_scope"]
    major_impact = ",".join(sorted(scope.get("layers") or []))
    key = "|".join([
        ",".join(scope.get("domains") or []),
        c["requested_action"]["target"],
        c["requested_action"]["type"],
        c["root_issue"],
        major_impact,
    ])
    return hashlib.sha1(key.encode("utf-8")).hexdigest()


def _match_rule_texts(texts: List[str], candidate: Dict[str, Any]) -> bool:
    haystacks = [
        candidate.get("title", "").lower(),
        candidate.get("summary", "").lower(),
        candidate.get("desired_change", "").lower(),
        candidate.get("root_issue", "").lower(),
        candidate.get("requested_action", {}).get("target", "").lower(),
        " ".join((candidate.get("change_scope") or {}).get("domains", [])).lower(),
    ]
    blob = " \n ".join(haystacks)
    return all(str(text).lower() in blob for text in texts)


def match_precedent(candidate: Dict[str, Any]) -> Dict[str, Any]:
    normalized = normalize_candidate(candidate)
    precedents = read_precedents()
    approvals = read_standing_approvals()
    best = {
        "matched": False,
        "precedent_id": None,
        "standing_approval": False,
        "confidence": "low",
        "applies_if": [],
        "excludes_if": [],
        "required_guardrails": [],
    }
    for precedent in precedents:
        if precedent.get("revoked"):
            continue
        applies_if = [str(x) for x in precedent.get("applies_if", [])]
        excludes_if = [str(x) for x in precedent.get("excludes_if", [])]
        applies = _match_rule_texts(applies_if, normalized) if applies_if else False
        excludes = _match_rule_texts(excludes_if, normalized) if excludes_if else False
        if excludes:
            continue
        if applies:
            confidence = "high"
        else:
            same_target = precedent.get("title", "").lower() in normalized.get("title", "").lower() or normalized["requested_action"]["target"].lower() in precedent.get("title", "").lower()
            overlapping_domain = bool(set((normalized.get("change_scope") or {}).get("domains", [])) & set(" ".join(applies_if).split()))
            if same_target or overlapping_domain:
                confidence = "medium"
            else:
                continue
        best = {
            "matched": True,
            "precedent_id": precedent.get("precedent_id"),
            "standing_approval": False,
            "confidence": confidence,
            "applies_if": applies_if,
            "excludes_if": excludes_if,
            "required_guardrails": [str(x) for x in precedent.get("required_guardrails", [])],
        }
        for approval in approvals:
            if approval.get("based_on_precedent_id") != best["precedent_id"]:
                continue
            forbidden = [str(x) for x in approval.get("forbidden_conditions", [])]
            if _match_rule_texts(forbidden, normalized):
                continue
            best["standing_approval"] = True
            best["required_guardrails"] = sorted({*best["required_guardrails"], *[str(x) for x in approval.get("required_checks", [])]})
            break
        if confidence == "high":
            break
    return best


def _mandatory_deep_flags(candidate: Dict[str, Any]) -> List[str]:
    cfg = _risk_cfg()
    flags: List[str] = []
    domains = set((candidate.get("change_scope") or {}).get("domains", []))
    layers = set((candidate.get("change_scope") or {}).get("layers", []))
    boundary = candidate.get("boundary_impact") or {}
    blast = candidate.get("blast_radius") or {}
    text = " ".join([
        candidate.get("title", ""),
        candidate.get("summary", ""),
        candidate.get("why_now", ""),
        candidate.get("possible_harm", ""),
    ]).lower()
    if "auth" in domains or boundary.get("trust_boundary") == "high":
        flags.append("auth_root_change")
    if boundary.get("trust_boundary") == "high":
        flags.append("trust_boundary_redefinition")
    if boundary.get("approval_boundary") == "high":
        flags.append("approval_root_change")
    if "routing" in domains and boundary.get("board_execution") == "high":
        flags.append("routing_root_change")
    if boundary.get("ceo_board") == "high" or boundary.get("board_execution") == "high":
        flags.append("ceo_board_execution_boundary_change")
    if "authority" in text or "権限" in text:
        flags.append("authority_redistribution_major")
    if candidate.get("reversibility", {}).get("level") == "low" and blast.get("production") in {"medium", "high"}:
        flags.append("irreversible_production_change")
    if blast.get("users") == "high" or "trust" in text:
        flags.append("user_trust_critical")
    if len((candidate.get("change_scope") or {}).get("repos", [])) >= 2 and {"ceo", "board", "execution"}.issubset(layers):
        flags.append("root_governance_multi_layer_change")
    allowed = set((_risk_cfg().get("mandatoryDeepFlags") or []))
    return [flag for flag in flags if flag in allowed]


def score_candidate(candidate: Dict[str, Any]) -> Dict[str, Any]:
    c = normalize_candidate(candidate)
    boundary = c.get("boundary_impact") or {}
    blast = c.get("blast_radius") or {}
    scope = c.get("change_scope") or {}
    dependency_spread = 0
    if len(scope.get("repos", [])) >= 2 or len(scope.get("agents", [])) >= 3:
        dependency_spread = 2
    elif len(scope.get("repos", [])) == 1 and (len(scope.get("agents", [])) >= 2 or len(scope.get("layers", [])) >= 2):
        dependency_spread = 1
    layer_score = max([LAYER_WEIGHT.get(layer, 0) for layer in scope.get("layers", [])], default=0)
    dependency_spread = max(dependency_spread, 1 if layer_score == 1 and len(scope.get("layers", [])) >= 2 else 0)
    if layer_score == 2 and len(scope.get("layers", [])) >= 2:
        dependency_spread = 2
    score_breakdown = {
        "boundary_impact": max(BOUNDARY_SCORE.get(str(boundary.get("ceo_board", "none")), 0), BOUNDARY_SCORE.get(str(boundary.get("board_execution", "none")), 0), BOUNDARY_SCORE.get(str(boundary.get("trust_boundary", "none")), 0), BOUNDARY_SCORE.get(str(boundary.get("approval_boundary", "none")), 0)),
        "blast_radius": max(BLAST_SCORE.get(str(blast.get("users", "none")), 0), BLAST_SCORE.get(str(blast.get("agents", "none")), 0), BLAST_SCORE.get(str(blast.get("production", "none")), 0)),
        "reversibility": REVERSIBILITY_SCORE.get(str(c.get("reversibility", {}).get("level", "high")), 0),
        "novelty": NOVELTY_SCORE.get(str(c.get("novelty", {}).get("level", "low")), 0),
        "trust_user_impact": max(BLAST_SCORE.get(str(blast.get("users", "none")), 0), BOUNDARY_SCORE.get(str(boundary.get("trust_boundary", "none")), 0), BOUNDARY_SCORE.get(str(boundary.get("approval_boundary", "none")), 0)),
        "dependency_spread": dependency_spread,
    }
    reason_codes = [key for key, val in score_breakdown.items() if val > 0]
    mandatory = _mandatory_deep_flags(c)
    score_total = sum(score_breakdown.values())
    return {
        "score_breakdown": score_breakdown,
        "score_total": score_total,
        "mandatory_deep_flags": mandatory,
        "reason_codes": reason_codes,
    }


def compute_lane(score: int, mandatory_deep: bool = False) -> str:
    cfg = _risk_cfg()
    if mandatory_deep:
        return "deep"
    for lane in ("fast", "review", "deep"):
        band = (cfg.get("scoreBands") or {}).get(lane, {})
        if band.get("min") is not None and band.get("max") is not None and band["min"] <= score <= band["max"]:
            return lane
    return "deep"


def route_case(candidate: Dict[str, Any], precedent: Dict[str, Any], scored: Dict[str, Any]) -> Dict[str, Any]:
    mandatory = bool(scored["mandatory_deep_flags"])
    lane = compute_lane(scored["score_total"], mandatory)
    board_mode = "deep_review"
    quorum_profile = "full_board"
    auto_disposition_eligible = False
    if lane == "fast":
        quorum_profile = None
        if precedent["matched"] and precedent["standing_approval"]:
            board_mode = "auto"
            auto_disposition_eligible = True
        else:
            board_mode = "chair_ack"
    elif lane == "review":
        domains = set((candidate.get("change_scope") or {}).get("domains", []))
        if domains & {"policy", "auth", "routing"}:
            quorum_profile = "full_board"
            board_mode = "deep_review" if mandatory else "quorum_review"
        elif domains & {"execution", "monitoring"}:
            quorum_profile = "ops_audit"
            board_mode = "quorum_review"
        elif domains & {"prompt", "staffing", "reporting"}:
            quorum_profile = "user_impact" if "reporting" in domains else "strategy_ops"
            board_mode = "quorum_review"
        else:
            quorum_profile = "strategy_ops"
            board_mode = "quorum_review"
    return {
        "risk_lane": lane,
        "board_mode": board_mode,
        "quorum_profile": quorum_profile,
        "auto_disposition_eligible": auto_disposition_eligible,
    }


def build_case_from_candidate(candidate: Dict[str, Any]) -> Dict[str, Any]:
    normalized = normalize_candidate(candidate)
    precedent = match_precedent(normalized)
    scored = score_candidate(normalized)
    routed = route_case(normalized, precedent, scored)
    case = {
        "case_id": new_case_id([
            candidate_dedupe_key(normalized),
            normalized["requested_action"]["target"],
            normalized["requested_action"]["type"],
        ]),
        "source_proposals": [normalized["proposal_id"]],
        "source_signals": normalized.get("evidence", {}).get("signals", []),
        "canonical_title": normalized["title"],
        "canonical_summary": normalized["summary"],
        "root_issue": normalized["root_issue"],
        "desired_change": normalized["desired_change"],
        "impact_profile": normalized["change_scope"],
        "precedent_match": {
            "matched": precedent["matched"],
            "precedent_id": precedent["precedent_id"],
            "standing_approval": precedent["standing_approval"],
            "confidence": precedent["confidence"],
        },
        "risk": {
            "score": scored["score_total"],
            "lane": routed["risk_lane"],
            "mandatory_deep": bool(scored["mandatory_deep_flags"]),
            "reasons": scored["reason_codes"] + scored["mandatory_deep_flags"],
        },
        "disposition_options": ["adopt", "defer", "reject", "investigate"],
        "routing": {
            "board_mode": routed["board_mode"],
            "quorum_profile": routed["quorum_profile"],
            "auto_disposition_eligible": routed["auto_disposition_eligible"],
        },
        "state": "routed" if routed["board_mode"] != "auto" else "precedent_applied",
    }
    return case


def build_decision_from_case(case: Dict[str, Any], ruling: str = "adopted") -> Dict[str, Any]:
    board_mode = case["routing"]["board_mode"]
    participants_map = {
        "auto": ["chair"],
        "chair_ack": ["chair"],
        "quorum_review": (_risk_cfg().get("quorumProfiles") or {}).get(case["routing"].get("quorum_profile") or "strategy_ops", ["chair", "visionary", "operator"]),
        "deep_review": (_risk_cfg().get("quorumProfiles") or {}).get("full_board", ["chair", "visionary", "user_advocate", "operator", "auditor"]),
    }
    decision = {
        "decision_id": new_decision_id(case["case_id"]),
        "case_id": case["case_id"],
        "proposal_ids": case["source_proposals"],
        "decided_at": now_iso(),
        "decision_status": ruling if board_mode != "deep_review" else ("deep_review_pending" if ruling in {"investigate", "deferred"} else ruling),
        "source_case_id": case["case_id"],
        "source_proposal_ids": case["source_proposals"],
        "deep_review_status": "completed" if board_mode == "deep_review" and ruling == "adopted" else "deferred" if board_mode == "deep_review" and ruling == "deferred" else "pending" if board_mode == "deep_review" else "none",
        "board_mode": {
            "type": "fast_auto" if board_mode == "auto" else "chair_ack" if board_mode == "chair_ack" else "quorum_review" if board_mode == "quorum_review" else "deep_review",
            "participants": participants_map[board_mode],
            "quorum_profile": case["routing"].get("quorum_profile"),
        },
        "lane": {
            "risk_lane": case["risk"]["lane"],
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
            "tradeoffs": case["risk"]["reasons"],
        },
        "guardrail": {
            "constraints": [],
            "forbidden_actions": [],
            "required_checks": [],
            "rollout_mode": "direct" if case["risk"]["lane"] == "fast" else "staged" if case["risk"]["lane"] == "review" else "simulation",
        },
        "followup": {
            "owner": "supervisor-core",
            "target_agents": [],
            "monitor_metrics": [],
            "checkpoint_at": None,
            "followup_due": None,
            "reopen_condition": [],
        },
        "precedent": {
            "creates_precedent": False,
            "precedent_id": case["precedent_match"]["precedent_id"],
            "standing_approval_candidate": case["risk"]["lane"] == "fast",
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


def _rows_in_window(hours: int, offset_hours: int = 0) -> List[Dict[str, Any]]:
    end = datetime.now(timezone.utc) - timedelta(hours=offset_hours)
    start = end - timedelta(hours=hours)
    rows: List[Dict[str, Any]] = []
    for row in read_ledger():
        decided_at = row.get("decided_at")
        try:
            ts = datetime.fromisoformat(str(decided_at))
        except Exception:
            continue
        if start <= ts < end:
            rows.append(row)
    return rows


def _decision_summaries(rows: List[Dict[str, Any]], result: str | None = None, limit: int = 10) -> List[Dict[str, Any]]:
    picked = []
    for row in rows:
        if result and row.get("ruling", {}).get("result") != result:
            continue
        picked.append({
            "decision_id": row.get("decision_id"),
            "summary": row.get("reporting", {}).get("board_summary", ""),
            "lane": row.get("lane", {}).get("risk_lane", "unknown"),
            "mode": row.get("board_mode", {}).get("type", "unknown"),
        })
    return picked[-limit:]


def compute_last_cycle_diff(prev_cycle: List[Dict[str, Any]], current_cycle: List[Dict[str, Any]]) -> Dict[str, Any]:
    current_lane = Counter(row.get("lane", {}).get("risk_lane", "unknown") for row in current_cycle)
    previous_lane = Counter(row.get("lane", {}).get("risk_lane", "unknown") for row in prev_cycle)
    current_ruling = Counter(row.get("ruling", {}).get("result", "unknown") for row in current_cycle)
    previous_ruling = Counter(row.get("ruling", {}).get("result", "unknown") for row in prev_cycle)
    return {
        "decision_count_delta": len(current_cycle) - len(prev_cycle),
        "lane_counts_current": dict(current_lane),
        "lane_counts_previous": dict(previous_lane),
        "ruling_counts_current": dict(current_ruling),
        "ruling_counts_previous": dict(previous_ruling),
    }


def _heartbeat_governance_snapshot(hours: int) -> Dict[str, Any]:
    from heartbeat_runtime import report_governance_snapshot
    return report_governance_snapshot(hours)


def report_input_model(hours: int = 6) -> Dict[str, Any]:
    current = load_recent_decisions(window_hours=hours, offset_hours=0)
    previous = load_recent_decisions(window_hours=hours, offset_hours=hours)
    model = {
        "generated_at": now_iso(),
        "window_hours": hours,
        "decision_count": len(current),
        "board_summary": _decision_summaries(current, limit=8),
        "adopted": _decision_summaries(current, result="adopted", limit=8),
        "deferred": _decision_summaries(current, result="deferred", limit=8),
        "rejected": _decision_summaries(current, result="rejected", limit=8),
        "deep_review": load_deep_review_status(window_hours=max(24, hours)),
        "active_unresolved": load_active_unresolved_items()[:12],
        "followups_due": load_followups_due(hours_ahead=max(24, hours)),
        "reopen_candidates": load_reopen_candidates()[:12],
        "precedent_promotions": load_precedent_promotions(window_hours=max(24, hours))[:12],
        "cycle_diff": compute_last_cycle_diff(previous, current),
        "heartbeat_governance_snapshot": _heartbeat_governance_snapshot(max(24, hours)),
        "coverage": {},
    }
    model["coverage"] = report_guardrail_summary(model)
    return model


def ledger_snapshot(hours: int = 24) -> Dict[str, Any]:
    rows = _rows_in_window(hours=hours, offset_hours=0)
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


def render_report_input_view(hours: int = 6) -> str:
    model = report_input_model(hours=hours)
    lines = [
        "# Board Report Input View",
        "",
        f"- generated_at: {model['generated_at']}",
        f"- window_hours: {model['window_hours']}",
        f"- decision_count: {model['decision_count']}",
        f"- decision_count_delta: {model['cycle_diff']['decision_count_delta']}",
        "",
        "## Board Summary",
    ]
    for item in model["board_summary"]:
        lines.append(f"- [{item['decision_id']}] ({item['lane']}/{item['mode']}) {item['summary']}")
    if not model["board_summary"]:
        lines.append("- (none)")
    for label, key in [("Adopted", "adopted"), ("Deferred", "deferred"), ("Rejected", "rejected")]:
        lines.extend(["", f"## {label}"])
        items = model[key]
        if items:
            for item in items:
                lines.append(f"- [{item['decision_id']}] {item['summary']}")
        else:
            lines.append("- (none)")
    lines.extend(["", "## Deep Review State"])
    if model["deep_review"]:
        for item in model["deep_review"]:
            lines.append(f"- [{item['decision_id']}] {item['status']}/{item['result']}: {item['summary']}")
    else:
        lines.append("- (none)")
    lines.extend(["", "## Active Unresolved Items"])
    if model["active_unresolved"]:
        for item in model["active_unresolved"]:
            lines.append(f"- [{item.get('item_id')}] {item.get('reason', '')}")
    else:
        lines.append("- (none)")
    lines.extend(["", "## Followups Due"])
    if model["followups_due"]:
        for item in model["followups_due"]:
            lines.append(f"- [{item['decision_id']}] due {item['due_at']} owner={item['owner']}: {item['summary']}")
    else:
        lines.append("- (none)")
    lines.extend(["", "## Reopen Candidates"])
    if model["reopen_candidates"]:
        for item in model["reopen_candidates"]:
            lines.append(f"- [{item['decision_id']}] {item['summary']}")
    else:
        lines.append("- (none)")
    lines.extend(["", "## Heartbeat Governance Snapshot", json.dumps(model["heartbeat_governance_snapshot"], ensure_ascii=False)])
    lines.extend(["", "## Coverage", json.dumps(model["coverage"], ensure_ascii=False)])
    lines.extend(["", "## Last Cycle Diff", json.dumps(model["cycle_diff"], ensure_ascii=False)])
    return "\n".join(lines).rstrip() + "\n"


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


def decision_coverage_check(report_model: Dict[str, Any]) -> Dict[str, Any]:
    missing = []
    for key in ("adopted", "deferred", "rejected", "deep_review"):
        for item in report_model.get(key, []):
            if not item.get("decision_id"):
                missing.append({"section": key, "item": item})
    return {"ok": not missing, "missing": missing}


def raw_fallback_check(report_text: str) -> Dict[str, Any]:
    suspicious = [token for token in ["execution.stdout.log", "execution.stderr.log", "raw log", "claude-raw.json"] if token in report_text]
    return {"ok": not suspicious, "tokens": suspicious}


def deep_review_explicitness_check(report_model: Dict[str, Any]) -> Dict[str, Any]:
    adopted_ids = {item.get("decision_id") for item in report_model.get("adopted", [])}
    invalid = []
    for item in report_model.get("deep_review", []):
        if item.get("status") in {"pending", "in_progress", "deferred"} and item.get("decision_id") in adopted_ids:
            invalid.append(item)
    return {"ok": not invalid, "invalid": invalid}


def report_guardrail_summary(report_model: Dict[str, Any]) -> Dict[str, Any]:
    draft = render_report_input_view(report_model.get("window_hours", 6)) if False else ""
    coverage = decision_coverage_check(report_model)
    deep = deep_review_explicitness_check(report_model)
    raw = raw_fallback_check(draft)
    gaps = []
    if not coverage["ok"]:
        gaps.append("ledger_coverage_gap")
    if not deep["ok"]:
        gaps.append("deep_review_explicitness_gap")
    if not raw["ok"]:
        gaps.append("raw_fallback_gap")
    return {
        "decision_coverage_check": coverage,
        "deep_review_explicitness_check": deep,
        "raw_fallback_check": raw,
        "ledger_coverage_gap": gaps,
    }




def _recent_jsonl(path: Path, hours: int = 24) -> List[Dict[str, Any]]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = []
    for row in _load_jsonl(path):
        ts_raw = row.get("created_at") or row.get("occurred_at") or row.get("decided_at")
        try:
            ts = datetime.fromisoformat(str(ts_raw)) if ts_raw else cutoff
        except Exception:
            ts = cutoff
        if ts >= cutoff:
            rows.append(row)
    return rows


def _existing_case_ids() -> set[str]:
    return {str(row.get("case_id")) for row in _load_jsonl(CASES_PATH) if row.get("case_id")}


def _existing_decision_case_ids() -> set[str]:
    return {str(row.get("source_case_id") or row.get("case_id")) for row in read_ledger() if row.get("source_case_id") or row.get("case_id")}


def _existing_deferred_case_ids() -> set[str]:
    return {str(row.get("source_case_id")) for row in read_deferred() if row.get("source_case_id")}


def assemble_cases(hours: int = 24) -> Dict[str, Any]:
    candidates = _recent_jsonl(CANDIDATES_PATH, hours=hours)
    signals = _recent_jsonl(SIGNALS_PATH, hours=hours)
    existing_cases = _existing_case_ids()
    existing_decisions = _existing_decision_case_ids()
    existing_deferred = _existing_deferred_case_ids()
    created_cases = 0
    created_decisions = 0
    created_deferred = 0
    lane_counts: Counter[str] = Counter()
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for candidate in candidates:
        key = candidate_dedupe_key(candidate)
        grouped.setdefault(key, []).append(candidate)
    for _, group in grouped.items():
        base = group[-1]
        case = build_case_from_candidate(base)
        case["source_proposals"] = sorted({str(c.get("proposal_id")) for c in group if c.get("proposal_id")})
        related_signals = []
        for sig in signals:
            if any(ref in (sig.get("evidence", {}).get("refs") or []) for ref in (base.get("evidence", {}).get("refs") or [])):
                if sig.get("signal_id"):
                    related_signals.append(sig.get("signal_id"))
        case["source_signals"] = sorted(set(case.get("source_signals", []) + related_signals))
        if case["case_id"] not in existing_cases:
            write_case(case)
            created_cases += 1
            existing_cases.add(case["case_id"])
        lane_counts[case["risk"]["lane"]] += 1
        if case["case_id"] in existing_decisions or case["case_id"] in existing_deferred:
            continue
        if case["routing"]["board_mode"] == "auto":
            decision = build_decision_from_case(case, ruling="adopted")
            write_decision(decision)
            created_decisions += 1
            existing_decisions.add(case["case_id"])
        elif case["routing"]["board_mode"] == "chair_ack":
            decision = build_decision_from_case(case, ruling="investigate")
            write_decision(decision)
            created_decisions += 1
            existing_decisions.add(case["case_id"])
        else:
            ruling = "deferred" if case["routing"]["board_mode"] == "deep_review" else "investigate"
            decision = build_decision_from_case(case, ruling=ruling)
            write_decision(decision)
            created_decisions += 1
            existing_decisions.add(case["case_id"])
            deferred = {
                "item_id": _hash_id("deferred", case["case_id"]),
                "decision_id": decision["decision_id"],
                "reason": f"awaiting {case['routing']['board_mode']}",
                "required_investigation": [case["canonical_summary"]],
                "reopen_if": ["board review requested", "new evidence", "risk escalation"],
                "review_after": None,
                "status": "open",
                "source_case_id": case["case_id"],
                "source_proposal_ids": case["source_proposals"],
                "deep_review_status": decision["deep_review_status"],
            }
            write_deferred(deferred)
            created_deferred += 1
            existing_deferred.add(case["case_id"])
    return {
        "hours": hours,
        "candidate_count": len(candidates),
        "signal_count": len(signals),
        "case_count": len(grouped),
        "created_cases": created_cases,
        "created_decisions": created_decisions,
        "created_deferred": created_deferred,
        "lane_counts": dict(lane_counts),
    }


def emit_candidate(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not payload.get("proposal_id"):
        payload["proposal_id"] = new_proposal_id(str(payload.get("source", {}).get("name", "unknown")), str(payload.get("title", "untitled")))
    if not payload.get("created_at"):
        payload["created_at"] = now_iso()
    return write_candidate(payload)


def emit_signal(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not payload.get("signal_id"):
        payload["signal_id"] = _hash_id("signal", str(payload.get("summary", "signal")))
    if not payload.get("occurred_at"):
        payload["occurred_at"] = now_iso()
    return write_signal(payload)

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Board runtime helpers")
    sub = parser.add_subparsers(dest="command", required=True)
    view = sub.add_parser("view")
    view.add_argument("--hours", type=int, default=24)
    report_view = sub.add_parser("report-view")
    report_view.add_argument("--hours", type=int, default=6)
    report_json = sub.add_parser("report-json")
    report_json.add_argument("--hours", type=int, default=6)
    assemble = sub.add_parser("assemble")
    assemble.add_argument("--hours", type=int, default=24)
    emit_signal_p = sub.add_parser("emit-signal")
    emit_signal_p.add_argument("payloadPath")
    emit_candidate_p = sub.add_parser("emit-candidate")
    emit_candidate_p.add_argument("payloadPath")
    snap = sub.add_parser("snapshot")
    snap.add_argument("--hours", type=int, default=24)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "view":
        print(render_report_view(hours=args.hours))
        return 0
    if args.command == "report-view":
        print(render_report_input_view(hours=args.hours))
        return 0
    if args.command == "report-json":
        print(json.dumps(report_input_model(hours=args.hours), ensure_ascii=False, indent=2))
        return 0
    if args.command == "assemble":
        print(json.dumps(assemble_cases(hours=args.hours), ensure_ascii=False, indent=2))
        return 0
    if args.command == "emit-signal":
        payload = json.loads(Path(args.payloadPath).read_text(encoding="utf-8"))
        print(json.dumps(emit_signal(payload), ensure_ascii=False, indent=2))
        return 0
    if args.command == "emit-candidate":
        payload = json.loads(Path(args.payloadPath).read_text(encoding="utf-8"))
        print(json.dumps(emit_candidate(payload), ensure_ascii=False, indent=2))
        return 0
    if args.command == "snapshot":
        print(json.dumps(ledger_snapshot(hours=args.hours), ensure_ascii=False, indent=2))
        return 0
    raise ValidationError(f"unknown command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
