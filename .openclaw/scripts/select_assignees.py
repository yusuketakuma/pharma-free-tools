#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fnmatch
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

from task_runtime import CONFIG_ROOT, ROOT, ValidationError, ensure_schema_valid, load_json, normalize_path, task_paths
from analyze_task import analyze_task

COMPLEXITY_WEIGHT = {"low": 0.2, "medium": 0.4, "high": 0.6, "very_high": 0.8}
RISK_WEIGHT = {"low": 0.0, "medium": 0.1, "high": 0.2, "critical": 0.3}


def load_json_yaml(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Select task assignees and save assignment-plan.json")
    parser.add_argument("--task-id")
    parser.add_argument("--task-file")
    parser.add_argument("--intake-file")
    parser.add_argument("--output")
    return parser.parse_args()


def load_task_payload(args: argparse.Namespace) -> Dict[str, Any]:
    if args.task_file:
        payload = json.loads(Path(args.task_file).read_text(encoding="utf-8"))
        if args.task_id and "task_id" not in payload:
            payload["task_id"] = args.task_id
        return payload
    if not args.task_id:
        raise ValidationError("--task-id or --task-file is required")
    task = load_json(task_paths(args.task_id)["task"], default=None)
    if not task:
        raise ValidationError(f"task not found: {args.task_id}")
    return task


def load_intake(args: argparse.Namespace, task: Dict[str, Any]) -> Dict[str, Any]:
    if args.intake_file:
        intake = json.loads(Path(args.intake_file).read_text(encoding="utf-8"))
        temp = Path(task_paths(intake.get("task_id", task.get("task_id", "adhoc"))["dir"]) / "task-intake.validate.json")
        temp.parent.mkdir(parents=True, exist_ok=True)
        temp.write_text(json.dumps(intake, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        ensure_schema_valid(temp, "task-intake")
        return intake
    return analyze_task(task)


def match_any_path(paths: List[str], patterns: List[str]) -> bool:
    for path in paths:
        normalized = normalize_path(path)
        for pattern in patterns:
            if fnmatch.fnmatch(normalized, pattern):
                return True
    return False


def score_role(role_name: str, role_info: Dict[str, Any], intake: Dict[str, Any]) -> Tuple[float, List[str]]:
    score = 0.05
    reasons: List[str] = []
    role_caps = set(role_info.get("capabilities", []))
    required_caps = set(intake.get("required_capabilities", []))
    matched_caps = sorted(role_caps.intersection(required_caps))
    if matched_caps:
        cap_score = min(0.45, 0.15 * len(matched_caps))
        score += cap_score
        reasons.append(f"capability match: {', '.join(matched_caps)}")

    preferred_outputs = set(role_info.get("preferred_outputs", []))
    desired_outputs = set(intake.get("desired_outputs", []))
    matched_outputs = sorted(preferred_outputs.intersection(desired_outputs))
    if matched_outputs:
        output_score = min(0.20, 0.10 * len(matched_outputs))
        score += output_score
        reasons.append(f"output fit: {', '.join(matched_outputs)}")

    requested_paths = intake.get("requested_paths", [])
    owns_paths = role_info.get("owns_paths", [])
    matched_paths = [normalize_path(path) for path in requested_paths if any(fnmatch.fnmatch(normalize_path(path), pattern) for pattern in owns_paths)]
    if matched_paths:
        score += min(0.20, 0.10 * len(matched_paths))
        reasons.append("owns relevant paths")

    if role_info.get("department") in intake.get("departments_involved", []):
        score += 0.08
        reasons.append(f"department match: {role_info['department']}")

    score += COMPLEXITY_WEIGHT.get(intake.get("complexity", "low"), 0) * 0.1
    score += RISK_WEIGHT.get(intake.get("risk_level", "low"), 0)
    return min(score, 1.0), reasons


def should_activate(rule: Dict[str, Any], intake: Dict[str, Any]) -> bool:
    threshold = rule.get("active_roles_when_complexity_at_least")
    if not threshold:
        return True
    order = ["low", "medium", "high", "very_high"]
    current = order.index(intake.get("complexity", "low"))
    needed = order.index(threshold)
    return current >= needed


def apply_rules(plan: Dict[str, Any], intake: Dict[str, Any], roles: Dict[str, Any], rules: Dict[str, Any]) -> None:
    requested_paths = intake.get("requested_paths", [])
    desired_outputs = intake.get("desired_outputs", [])
    task_text = (intake.get("task_summary") or "").lower()
    limits = rules.get("limits", {})
    max_active = int(limits.get("max_active_subroles", 2))

    for rule_name, rule in rules.get("rules", {}).items():
        matched = False
        if rule.get("if_outputs_any") and set(rule["if_outputs_any"]).intersection(desired_outputs):
            matched = True
        if rule.get("if_paths_match_any") and match_any_path(requested_paths, rule["if_paths_match_any"]):
            matched = True
        if rule.get("if_text_any") and any(token in task_text for token in rule["if_text_any"]):
            matched = True
        if rule.get("if_risk_levels_any") and intake.get("risk_level") in rule["if_risk_levels_any"]:
            matched = True
        if rule.get("if_departments_count_at_least") and len(intake.get("departments_involved", [])) >= int(rule["if_departments_count_at_least"]):
            matched = True
        if rule.get("if_output_count_at_least") and len(desired_outputs) >= int(rule["if_output_count_at_least"]):
            matched = True
        if not matched:
            continue

        for role in rule.get("advisory_roles", []):
            if role != plan["lead_role"]:
                plan["advisory_subroles"].append(role)
                plan["reasons"].append(f"{rule_name}: advisory -> {role}")
        if should_activate(rule, intake):
            for role in rule.get("active_roles", []):
                if role != plan["lead_role"] and len(plan["active_subroles"]) < max_active:
                    plan["active_subroles"].append(role)
                    plan["reasons"].append(f"{rule_name}: active -> {role}")
        for role in rule.get("mandatory_review_roles", []):
            if role != plan["lead_role"]:
                plan["mandatory_review_roles"].append(role)
                plan["reasons"].append(f"{rule_name}: mandatory_review -> {role}")

    if intake.get("risk_level") in {"high", "critical"}:
        lead_reviews = roles.get(plan["lead_role"], {}).get("review_roles", [])
        for role in lead_reviews[:2]:
            if role != plan["lead_role"]:
                plan["mandatory_review_roles"].append(role)
                plan["reasons"].append(f"lead review pairing -> {role}")

    plan["advisory_subroles"] = sorted(set(plan["advisory_subroles"]))
    plan["mandatory_review_roles"] = sorted(set(plan["mandatory_review_roles"]))
    deduped_active: List[str] = []
    for role in plan["active_subroles"]:
        if role not in deduped_active and role not in plan["advisory_subroles"]:
            deduped_active.append(role)
    plan["active_subroles"] = deduped_active[:max_active]

    if len(intake.get("departments_involved", [])) == 1 and intake.get("complexity") == "low" and intake.get("risk_level") == "low":
        plan["advisory_subroles"] = []
        plan["active_subroles"] = []
        plan["mandatory_review_roles"] = []
        plan["reasons"].append("single-department low-complexity task kept lead-only")


def select_assignment_plan(intake: Dict[str, Any]) -> Dict[str, Any]:
    role_capability = load_json_yaml(CONFIG_ROOT / "role-capability.yaml")
    rules = load_json_yaml(CONFIG_ROOT / "cross-functional-rules.yaml")
    roles = role_capability["roles"]

    scored: List[Tuple[str, float, List[str]]] = []
    for role_name, role_info in roles.items():
        score, reasons = score_role(role_name, role_info, intake)
        scored.append((role_name, score, reasons))
    scored.sort(key=lambda item: (-item[1], item[0]))
    lead_role, lead_score, lead_reasons = scored[0]

    plan = {
        "task_id": intake["task_id"],
        "lead_role": lead_role,
        "advisory_subroles": [],
        "active_subroles": [],
        "mandatory_review_roles": [],
        "required_capabilities": intake["required_capabilities"],
        "departments_involved": intake["departments_involved"],
        "reasons": [f"lead selected by highest lead_score={lead_score:.2f}"] + lead_reasons,
        "lead_score": round(lead_score, 3),
        "risk_level": intake["risk_level"],
        "complexity": intake["complexity"],
        "desired_outputs": intake.get("desired_outputs", []),
        "protected_paths": intake.get("protected_paths", []),
    }

    apply_rules(plan, intake, roles, rules)

    validate_path = Path(task_paths(intake["task_id"])["dir"]) / "assignment-plan.validate.json"
    validate_path.parent.mkdir(parents=True, exist_ok=True)
    validate_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ensure_schema_valid(validate_path, "assignment-plan")
    return plan


def save_assignment_plan(plan: Dict[str, Any], output_path: Path | None = None) -> Path:
    if output_path is None:
        paths = task_paths(plan["task_id"])
        output_path = paths["dir"] / "assignment-plan.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ensure_schema_valid(output_path, "assignment-plan")
    return output_path


def main() -> int:
    args = parse_args()
    task = load_task_payload(args)
    intake = load_intake(args, task)
    plan = select_assignment_plan(intake)
    output_path = Path(args.output) if args.output else None
    saved = save_assignment_plan(plan, output_path)
    print(json.dumps({"saved_to": str(saved), "plan": plan}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
