#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from board_runtime import emit_candidate, emit_signal
from task_runtime import CONFIG_ROOT, ROOT, TASKS_ROOT, ValidationError, append_jsonl, ensure_schema_valid, load_json, now_iso

HEARTBEAT_RUNTIME_ROOT = ROOT / "runtime" / "heartbeat"
HEARTBEAT_RUNTIME_ROOT.mkdir(parents=True, exist_ok=True)
HEARTBEAT_RESULTS_PATH = HEARTBEAT_RUNTIME_ROOT / "heartbeat-results.jsonl"
EXPLORATION_LEASES_PATH = HEARTBEAT_RUNTIME_ROOT / "exploration-leases.jsonl"
HEARTBEAT_STATE_PATH = HEARTBEAT_RUNTIME_ROOT / "heartbeat-state.json"
SCOUT_REQUESTS_PATH = HEARTBEAT_RUNTIME_ROOT / "scout-requests.jsonl"
ARTIFACT_UPDATES_PATH = HEARTBEAT_RUNTIME_ROOT / "artifact-updates.jsonl"
GOVERNANCE_CONFIG_PATH = CONFIG_ROOT / "heartbeat-governance.json"
BOARD_RUNTIME_ROOT = ROOT / "runtime" / "board"
BOARD_DECISIONS_PATH = BOARD_RUNTIME_ROOT / "decision-ledger.jsonl"
BOARD_CASES_PATH = BOARD_RUNTIME_ROOT / "agenda-cases.jsonl"

EXECUTION_ROLES = {"research-analyst", "github-operator", "ops-automator", "doc-editor", "dss-manager"}
BOARD_ROLES = {"supervisor-core", "board-visionary", "board-user-advocate", "board-operator", "board-auditor"}
SCOUT_ROLES = {"opportunity-scout"}
CEO_ROLES = {"ceo-tama"}


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


def _load_state() -> Dict[str, Any]:
    state = load_json(HEARTBEAT_STATE_PATH, default={}) or {}
    if not isinstance(state, dict):
        return {}
    state.setdefault("roles", {})
    return state


def _save_state(state: Dict[str, Any]) -> None:
    HEARTBEAT_STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _cfg() -> Dict[str, Any]:
    cfg = load_json(GOVERNANCE_CONFIG_PATH, default={}) or {}
    if not isinstance(cfg, dict):
        return {}
    return cfg


def _hash_id(prefix: str, payload: str) -> str:
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()[:12]
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{prefix}-{ts}-{digest}"


def role_kind(source_role: str) -> str:
    if source_role in CEO_ROLES:
        return "ceo"
    if source_role in BOARD_ROLES:
        return "board"
    if source_role in SCOUT_ROLES:
        return "scout"
    return "execution"


def allowed_outcomes(source_role: str) -> List[str]:
    kind = role_kind(source_role)
    policies = (_cfg().get("rolePolicies") or {})
    role_policy = policies.get(kind) or {}
    return [str(x) for x in role_policy.get("allowedOutcomeTypes", [])]


def permission_check(source_role: str, outcome_type: str) -> Dict[str, Any]:
    allowed = allowed_outcomes(source_role)
    ok = outcome_type in allowed
    reason = None if ok else f"{source_role} cannot emit {outcome_type}"
    return {
        "allowed": ok,
        "allowed_outcomes": allowed,
        "reason": reason,
    }


def compute_duplicate_key(root_issue: Optional[str], desired_change: Optional[str], change_scope: Dict[str, Any] | None) -> Optional[str]:
    issue = (root_issue or "").strip().lower()
    change = (desired_change or "").strip().lower()
    scope = change_scope or {}
    domains = ",".join(sorted(str(x) for x in (scope.get("domains") or [])))
    repos = ",".join(sorted(str(x) for x in (scope.get("repos") or [])))
    agents = ",".join(sorted(str(x) for x in (scope.get("agents") or [])))
    if not any([issue, change, domains, repos, agents]):
        return None
    blob = "|".join([issue, change, domains, repos, agents])
    return hashlib.sha1(blob.encode("utf-8")).hexdigest()


def recent_results(hours: int = 24) -> List[Dict[str, Any]]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows: List[Dict[str, Any]] = []
    for row in _load_jsonl(HEARTBEAT_RESULTS_PATH):
        ts_raw = row.get("created_at") or row.get("heartbeat_run_id", "")
        try:
            ts = datetime.fromisoformat(str(row.get("created_at"))) if row.get("created_at") else cutoff
        except Exception:
            ts = cutoff
        if ts >= cutoff:
            rows.append(row)
    return rows


def duplicate_check(duplicate_key: Optional[str]) -> Dict[str, Any]:
    if not duplicate_key:
        return {"is_duplicate": False, "matched_run_id": None, "reason": None}
    suppress_hours = int((_cfg().get("duplicateSuppressHours") or 12))
    for row in reversed(recent_results(hours=suppress_hours)):
        if row.get("duplicate_key") == duplicate_key:
            return {
                "is_duplicate": True,
                "matched_run_id": row.get("heartbeat_run_id"),
                "reason": f"duplicate suppressed for {suppress_hours}h",
            }
    return {"is_duplicate": False, "matched_run_id": None, "reason": None}


def _active_leases() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    leases = []
    for row in _load_jsonl(EXPLORATION_LEASES_PATH):
        if row.get("status") != "active":
            continue
        try:
            expires_at = datetime.fromisoformat(str(row.get("expires_at")))
        except Exception:
            continue
        if expires_at > now:
            leases.append(row)
    return leases


def acquire_exploration_lease(issue_family: Optional[str], owner: str, source_role: str, duplicate_key: Optional[str]) -> Dict[str, Any]:
    if not issue_family:
        return {"lease_id": None, "issue_family": None, "owner": owner, "status": "not-needed", "expires_at": None}
    now = datetime.now(timezone.utc)
    ttl_hours = int((_cfg().get("leaseTtlHours") or 4))
    for lease in _active_leases():
        if lease.get("issue_family") == issue_family and lease.get("owner") != owner:
            return {
                "lease_id": lease.get("lease_id"),
                "issue_family": issue_family,
                "owner": lease.get("owner"),
                "status": "held-by-other",
                "expires_at": lease.get("expires_at"),
            }
        if lease.get("issue_family") == issue_family and lease.get("owner") == owner:
            return {
                "lease_id": lease.get("lease_id"),
                "issue_family": issue_family,
                "owner": owner,
                "status": "renewed",
                "expires_at": lease.get("expires_at"),
            }
    lease = {
        "lease_id": _hash_id("lease", f"{issue_family}:{owner}"),
        "issue_family": issue_family,
        "owner": owner,
        "created_at": now_iso(),
        "expires_at": (now + timedelta(hours=ttl_hours)).isoformat(),
        "status": "active",
        "source_role": source_role,
        "duplicate_key": duplicate_key,
    }
    ensure_payload(lease, "exploration-lease")
    append_jsonl(EXPLORATION_LEASES_PATH, lease)
    return {
        "lease_id": lease["lease_id"],
        "issue_family": issue_family,
        "owner": owner,
        "status": "acquired",
        "expires_at": lease["expires_at"],
    }


def cooldown_check(source_role: str, outcome_type: str) -> Dict[str, Any]:
    state = _load_state()
    role_state = state["roles"].setdefault(source_role, {"noop_streak": 0, "duplicate_streak": 0, "cooldown_until": None})
    now = datetime.now(timezone.utc)
    cooldown_until = role_state.get("cooldown_until")
    if cooldown_until:
        try:
            ts = datetime.fromisoformat(str(cooldown_until))
            if ts > now and outcome_type == "agenda_candidate":
                return {"candidate_allowed": False, "cooldown_until": cooldown_until, "reason": "cooldown active"}
        except Exception:
            pass
    if role_kind(source_role) == "board" and outcome_type == "agenda_candidate":
        window_hours = int((_cfg().get("boardWindowHours") or 2))
        cap = int((_cfg().get("boardCandidateCapPerWindow") or 1))
        count = sum(1 for row in recent_results(hours=window_hours) if row.get("source_role") == source_role and row.get("outcome_type") == "agenda_candidate")
        if count >= cap:
            return {"candidate_allowed": False, "cooldown_until": None, "reason": "board candidate cap reached"}
    if source_role == "opportunity-scout" and outcome_type == "agenda_candidate":
        cap = int((_cfg().get("opportunityScoutOpenCap") or 1))
        count = sum(1 for row in recent_results(hours=24) if row.get("source_role") == source_role and row.get("outcome_type") == "agenda_candidate")
        if count >= cap:
            return {"candidate_allowed": False, "cooldown_until": None, "reason": "scout open opportunity cap reached"}
    return {"candidate_allowed": True, "cooldown_until": None, "reason": None}


def update_cooldown_state(source_role: str, outcome_type: str, duplicate: bool) -> None:
    state = _load_state()
    role_state = state["roles"].setdefault(source_role, {"noop_streak": 0, "duplicate_streak": 0, "cooldown_until": None})
    if outcome_type == "noop":
        role_state["noop_streak"] = int(role_state.get("noop_streak", 0)) + 1
    else:
        role_state["noop_streak"] = 0
    if duplicate:
        role_state["duplicate_streak"] = int(role_state.get("duplicate_streak", 0)) + 1
    else:
        role_state["duplicate_streak"] = 0
    noop_after = int((_cfg().get("noopCooldownAfter") or 2))
    if (_cfg().get("candidateSuppressAfterNoop") is True) and role_state["noop_streak"] >= noop_after:
        role_state["cooldown_until"] = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    elif not duplicate:
        role_state["cooldown_until"] = None
    _save_state(state)


def ensure_payload(payload: Dict[str, Any], schema_name: str) -> None:
    path = TASKS_ROOT / "_heartbeat_validate_tmp.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    try:
        ensure_schema_valid(path, schema_name)
    finally:
        try:
            path.unlink()
        except FileNotFoundError:
            pass


def build_heartbeat_result(payload: Dict[str, Any]) -> Dict[str, Any]:
    source_role = str(payload.get("source_role") or "")
    outcome_type = str(payload.get("outcome_type") or "noop")
    duplicate_key = compute_duplicate_key(payload.get("root_issue"), payload.get("desired_change"), payload.get("change_scope") or {})
    perm = permission_check(source_role, outcome_type)
    dup = duplicate_check(duplicate_key)
    issue_family = payload.get("issue_family") or duplicate_key
    lease = acquire_exploration_lease(issue_family if outcome_type in {"agenda_candidate", "scout_request"} else None, owner=source_role, source_role=source_role, duplicate_key=duplicate_key)
    cooldown = cooldown_check(source_role, outcome_type)
    suppress_until = None
    if dup["is_duplicate"]:
        suppress_hours = int((_cfg().get("duplicateSuppressHours") or 12))
        suppress_until = (datetime.now(timezone.utc) + timedelta(hours=suppress_hours)).isoformat()
    result = {
        "heartbeat_run_id": payload.get("heartbeat_run_id") or _hash_id("heartbeat", f"{source_role}:{now_iso()}"),
        "source_role": source_role,
        "domain_scope": [str(x) for x in (payload.get("domain_scope") or [])],
        "trigger_reason": str(payload.get("trigger_reason") or "heartbeat"),
        "outcome_type": outcome_type,
        "duplicate_key": duplicate_key,
        "suppress_until": suppress_until,
        "estimated_value": str(payload.get("estimated_value") or "low"),
        "estimated_cost": str(payload.get("estimated_cost") or "low"),
        "evidence_refs": [str(x) for x in (payload.get("evidence_refs") or [])],
        "source_case_id": payload.get("source_case_id"),
        "source_proposal_id": payload.get("source_proposal_id"),
        "root_issue": payload.get("root_issue"),
        "desired_change": payload.get("desired_change"),
        "permission_check": perm,
        "duplicate_check": dup,
        "lease": lease,
        "cooldown": cooldown,
        "created_at": now_iso()
    }
    if not perm["allowed"]:
        result["outcome_type"] = "noop"
    if dup["is_duplicate"] and result["outcome_type"] == "agenda_candidate":
        result["outcome_type"] = "signal_only"
    if not cooldown["candidate_allowed"] and result["outcome_type"] == "agenda_candidate":
        result["outcome_type"] = "signal_only"
    if lease["status"] == "held-by-other" and result["outcome_type"] == "agenda_candidate":
        result["outcome_type"] = "signal_only"
    ensure_payload(result, "heartbeat-result")
    return result




def map_heartbeat_result(result: Dict[str, Any]) -> Dict[str, Any]:
    mapped: Dict[str, Any] = {"kind": result.get("outcome_type"), "written": False}
    if result.get("outcome_type") == "signal_only":
        domain = (result.get("domain_scope") or ["monitoring"])[0]
        payload = {
            "signal_id": _hash_id("signal", result["heartbeat_run_id"]),
            "occurred_at": result.get("created_at") or now_iso(),
            "source": {"type": role_kind(result["source_role"]), "name": result["source_role"]},
            "category": "suggestion",
            "domain": domain if domain in {"prompt","staffing","routing","auth","reporting","policy","execution","monitoring"} else "monitoring",
            "summary": result.get("root_issue") or result.get("desired_change") or f"heartbeat from {result['source_role']}",
            "severity": "low" if result.get("estimated_value") == "low" else "medium",
            "evidence": {"metrics": [], "refs": result.get("evidence_refs") or []},
            "related_entities": {"agents": [result["source_role"]], "repos": [], "layers": ["board" if role_kind(result["source_role"]) == "board" else "execution"]},
            "candidate_hint": False,
        }
        emit_signal(payload)
        mapped["written"] = True
        mapped["signal_id"] = payload["signal_id"]
    elif result.get("outcome_type") == "agenda_candidate":
        domain = (result.get("domain_scope") or ["monitoring"])[0]
        payload = {
            "proposal_id": result.get("source_proposal_id") or _hash_id("proposal", result["heartbeat_run_id"]),
            "created_at": result.get("created_at") or now_iso(),
            "source": {"type": role_kind(result["source_role"]), "name": result["source_role"]},
            "title": result.get("desired_change") or result.get("root_issue") or f"heartbeat agenda from {result['source_role']}",
            "summary": result.get("root_issue") or result.get("desired_change") or f"heartbeat agenda from {result['source_role']}",
            "root_issue": result.get("root_issue") or result.get("desired_change") or "heartbeat issue",
            "desired_change": result.get("desired_change") or result.get("root_issue") or "investigate",
            "requested_action": {"type": "investigate", "target": domain},
            "change_scope": {"domains": result.get("domain_scope") or [domain], "repos": [], "agents": [result["source_role"]], "layers": ["board" if role_kind(result["source_role"]) == "board" else "execution"]},
            "why_now": result.get("trigger_reason") or "heartbeat",
            "expected_benefit": f"estimated_value={result.get('estimated_value','low')}",
            "possible_harm": f"estimated_cost={result.get('estimated_cost','low')}",
            "boundary_impact": {"ceo_board":"none","board_execution":"low","trust_boundary":"none","approval_boundary":"none"},
            "reversibility": {"level":"high","rollback_path":"revert or ignore candidate"},
            "blast_radius": {"users":"none","agents":"low","production":"none"},
            "novelty": {"level":"medium" if result.get("duplicate_key") else "low"},
            "evidence": {"metrics": [], "signals": [], "refs": result.get("evidence_refs") or []},
            "recommendation": {"proposed_lane":"fast","proposed_disposition":"investigate"},
        }
        emit_candidate(payload)
        mapped["written"] = True
        mapped["proposal_id"] = payload["proposal_id"]
    elif result.get("outcome_type") == "scout_request":
        append_jsonl(SCOUT_REQUESTS_PATH, result)
        mapped["written"] = True
    elif result.get("outcome_type") == "artifact_update":
        append_jsonl(ARTIFACT_UPDATES_PATH, result)
        mapped["written"] = True
    return mapped

def write_heartbeat_result(result: Dict[str, Any]) -> Dict[str, Any]:
    ensure_payload(result, "heartbeat-result")
    append_jsonl(HEARTBEAT_RESULTS_PATH, result)
    update_cooldown_state(result["source_role"], result["outcome_type"], bool(result.get("duplicate_check", {}).get("is_duplicate")))
    result["mapped_output"] = map_heartbeat_result(result)
    return result


def report_governance_snapshot(hours: int = 24) -> Dict[str, Any]:
    rows = recent_results(hours=hours)
    outcome_counts: Dict[str, int] = {}
    board_origin_candidate_count = 0
    scout_request_count = 0
    for row in rows:
        outcome = row.get("outcome_type", "unknown")
        outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1
        if outcome == "agenda_candidate" and role_kind(str(row.get("source_role", ""))) == "board":
            board_origin_candidate_count += 1
        if outcome == "scout_request":
            scout_request_count += 1
    duplicate_count = sum(1 for row in rows if row.get("duplicate_check", {}).get("is_duplicate"))
    noop_count = outcome_counts.get("noop", 0)
    signal_count = outcome_counts.get("signal_only", 0)
    candidate_count = outcome_counts.get("agenda_candidate", 0)
    scout_backlog = len(_load_jsonl(SCOUT_REQUESTS_PATH))
    board_cases = _load_jsonl(BOARD_CASES_PATH) if BOARD_CASES_PATH.exists() else []
    board_decisions = _load_jsonl(BOARD_DECISIONS_PATH) if BOARD_DECISIONS_PATH.exists() else []
    now = datetime.now(timezone.utc)
    one_day_ago = now - timedelta(hours=hours)
    recent_case_count = 0
    for row in board_cases:
        ts_raw = row.get("created_at") or row.get("occurred_at") or row.get("decided_at")
        try:
            ts = datetime.fromisoformat(str(ts_raw)) if ts_raw else one_day_ago
        except Exception:
            ts = one_day_ago
        if ts >= one_day_ago:
            recent_case_count += 1
    recent_decision_count = 0
    deep_count = 0
    for row in board_decisions:
        ts_raw = row.get("decided_at")
        try:
            ts = datetime.fromisoformat(str(ts_raw)) if ts_raw else one_day_ago
        except Exception:
            ts = one_day_ago
        if ts >= one_day_ago:
            recent_decision_count += 1
            if row.get("lane", {}).get("risk_lane") == "deep":
                deep_count += 1
    candidate_to_case_ratio = (recent_case_count / candidate_count) if candidate_count else 0
    candidate_to_board_touch_ratio = (recent_decision_count / candidate_count) if candidate_count else 0
    warnings = []
    if candidate_count and candidate_to_board_touch_ratio > 0.8:
        warnings.append("board_touch_high")
    if duplicate_count and (duplicate_count / len(rows)) > 0.3:
        warnings.append("duplicate_spike")
    if scout_backlog > int((_cfg().get("opportunityScoutOpenCap") or 1)):
        warnings.append("scout_backlog_high")
    if noop_count and (noop_count / len(rows)) > 0.7:
        warnings.append("noop_heavy")
    return {
        "generated_at": now_iso(),
        "window_hours": hours,
        "heartbeat_run_count": len(rows),
        "outcome_counts": outcome_counts,
        "noop_rate": (noop_count / len(rows)) if rows else 0,
        "signal_rate": (signal_count / len(rows)) if rows else 0,
        "candidate_rate": (candidate_count / len(rows)) if rows else 0,
        "scout_request_rate": (scout_request_count / len(rows)) if rows else 0,
        "duplicate_suppression_rate": (duplicate_count / len(rows)) if rows else 0,
        "board_origin_candidate_count": board_origin_candidate_count,
        "candidate_to_case_ratio": candidate_to_case_ratio,
        "candidate_to_board_touch_ratio": candidate_to_board_touch_ratio,
        "scout_backlog": scout_backlog,
        "warnings": warnings,
        "board_overload_risk": candidate_to_board_touch_ratio > 0.8 and candidate_count >= 3,
        "scout_saturation_risk": scout_backlog > int((_cfg().get("opportunityScoutOpenCap") or 1)),
        "duplicate_spike_risk": duplicate_count > 0 and (duplicate_count / len(rows)) > 0.3 if rows else False,
        "exploration_drift_risk": candidate_count > 0 and signal_count == 0 and scout_request_count == 0,
        "active_leases": len(_active_leases()),
        "deep_review_rate": (deep_count / recent_decision_count) if recent_decision_count else 0,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Heartbeat governance runtime")
    sub = parser.add_subparsers(dest="command", required=True)
    emit = sub.add_parser("emit")
    emit.add_argument("payloadPath")
    report_view = sub.add_parser("report-view")
    report_view.add_argument("--hours", type=int, default=24)
    report_json = sub.add_parser("report-json")
    report_json.add_argument("--hours", type=int, default=24)
    snap = sub.add_parser("snapshot")
    snap.add_argument("--hours", type=int, default=24)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "emit":
        payload = json.loads(Path(args.payloadPath).read_text(encoding="utf-8"))
        result = build_heartbeat_result(payload)
        print(json.dumps(write_heartbeat_result(result), ensure_ascii=False, indent=2))
        return 0
    if args.command == "report-view":
        print(json.dumps(report_governance_snapshot(hours=args.hours), ensure_ascii=False, indent=2))
        return 0
    if args.command == "report-json":
        print(json.dumps(report_governance_snapshot(hours=args.hours), ensure_ascii=False, indent=2))
        return 0
    if args.command == "snapshot":
        print(json.dumps(report_governance_snapshot(hours=args.hours), ensure_ascii=False, indent=2))
        return 0
    raise ValidationError(f"unknown command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
