#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import fnmatch
from pathlib import Path
from typing import Any, Dict, List, Set

from task_runtime import (
    CONFIG_ROOT,
    ValidationError,
    detect_protected_paths,
    ensure_schema_valid,
    load_json,
    normalize_path,
    task_paths,
)

HEAVY_KEYWORDS = {
    "implement": ["backend", "python"],
    "refactor": ["architecture", "multi-file-change"],
    "schema": ["schema", "api"],
    "api": ["api", "backend"],
    "frontend": ["frontend", "ui-implementation"],
    "ui": ["ui-implementation", "visual-design"],
    "design": ["ui", "visual-design"],
    "ux": ["ux", "usability"],
    "auth": ["security", "approval", "runtime"],
    "approval": ["approval", "policy"],
    "policy": ["policy", "risk"],
    "config": ["config", "ops"],
    "infra": ["infra", "ops"],
    "ops": ["ops", "runtime"],
    "workflow": ["workflow-automation", "process-review"],
    "test": ["qa", "verification"],
    "docs": ["docs", "copy"],
    "doc": ["docs", "copy"],
    "plan": ["scoping", "coordination"],
    "report": ["analysis", "reporting"],
}

PATH_CAPABILITY_HINTS = [
    (".openclaw/scripts/**", ["python", "runtime", "workflow-automation"]),
    (".openclaw/config/**", ["config", "ops", "policy"]),
    (".openclaw/schemas/**", ["schema", "api"]),
    ("org/**", ["docs", "policy", "approval"]),
    ("docs/**", ["docs", "copy"]),
    ("tests/**", ["qa", "verification"]),
    ("infra/**", ["infra", "ops"]),
    (".github/workflows/**", ["ci", "ops"]),
]

OUTPUT_HINTS = [
    ("schema", "schema"),
    ("api", "service"),
    ("frontend", "ui"),
    ("ui", "ui"),
    ("design", "design-spec"),
    ("doc", "doc"),
    ("docs", "doc"),
    ("report", "report"),
    ("plan", "plan"),
    ("workflow", "script"),
    ("script", "script"),
    ("config", "config"),
]


def load_json_yaml(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Analyze task into task-intake structure")
    parser.add_argument("--task-id")
    parser.add_argument("--task-file")
    parser.add_argument("--output")
    return parser.parse_args()


def load_task(args: argparse.Namespace) -> Dict[str, Any]:
    if args.task_file:
        payload = json.loads(Path(args.task_file).read_text(encoding="utf-8"))
        if args.task_id and "task_id" not in payload:
            payload["task_id"] = args.task_id
        return payload
    if not args.task_id:
        raise ValidationError("--task-id or --task-file is required")
    paths = task_paths(args.task_id)
    task = load_json(paths["task"], default=None)
    if not task:
        raise ValidationError(f"task not found: {args.task_id}")
    return task


def infer_outputs(task_text: str, requested_paths: List[str]) -> List[str]:
    outputs: List[str] = []
    lowered = task_text.lower()
    for keyword, output in OUTPUT_HINTS:
        if keyword in lowered and output not in outputs:
            outputs.append(output)
    for path in requested_paths:
        normalized = normalize_path(path)
        if normalized.endswith(".md") and "doc" not in outputs:
            outputs.append("doc")
        if normalized.endswith(".json") and "schema" not in outputs and "schemas/" in normalized:
            outputs.append("schema")
        if normalized.endswith(".py") and "script" not in outputs:
            outputs.append("script")
        if normalized.endswith(".yaml") or normalized.endswith(".yml"):
            if "config" not in outputs:
                outputs.append("config")
    return outputs or ["task-brief"]


def infer_capabilities(task_text: str, requested_paths: List[str], outputs: List[str]) -> List[str]:
    capabilities: Set[str] = set()
    lowered = task_text.lower()
    for token, implied in HEAVY_KEYWORDS.items():
        if token in lowered:
            capabilities.update(implied)
    for path in requested_paths:
        normalized = normalize_path(path)
        for pattern, implied in PATH_CAPABILITY_HINTS:
            if fnmatch.fnmatch(normalized, pattern):
                capabilities.update(implied)
    output_to_capability = {
        "doc": "docs",
        "plan": "coordination",
        "report": "analysis",
        "schema": "schema",
        "script": "python",
        "config": "config",
        "ui": "ui-implementation",
        "design-spec": "visual-design",
        "service": "backend",
        "task-brief": "requirements",
    }
    for output in outputs:
        if output in output_to_capability:
            capabilities.add(output_to_capability[output])
    return sorted(capabilities or {"generalist"})


def infer_risk(task: Dict[str, Any], protected_paths: List[str]) -> tuple[str, List[str]]:
    reasons: List[str] = []
    score = 0
    text = (task.get("task") or task.get("task_summary") or "").lower()
    requested_paths = [normalize_path(p) for p in task.get("requested_paths", task.get("target_paths", []))]
    if protected_paths:
        score += 3
        reasons.append("protected paths involved")
    if any(path.startswith(".openclaw/config/") or path.startswith("infra/") for path in requested_paths):
        score += 2
        reasons.append("ops or config path involved")
    if any(token in text for token in ["auth", "approval", "policy", "security"]):
        score += 2
        reasons.append("auth/policy/security work")
    if len(requested_paths) > 2:
        score += 1
        reasons.append("multiple files affected")
    if len(task.get("verification_commands", [])) > 1:
        score += 1
        reasons.append("verification breadth suggests risk")
    if score >= 5:
        return "high", reasons
    if score >= 2:
        return "medium", reasons
    return "low", reasons or ["no high-risk signals detected"]


def infer_complexity(task: Dict[str, Any], outputs: List[str], risk_level: str) -> str:
    text = (task.get("task") or task.get("task_summary") or "").lower()
    requested_paths = task.get("requested_paths", task.get("target_paths", []))
    score = 0
    if len(requested_paths) > 1:
        score += 2
    elif requested_paths:
        score += 1
    if len(outputs) > 1:
        score += 1
    if len(task.get("verification_commands", [])) > 1:
        score += 1
    if any(token in text for token in ["implement", "refactor", "migration", "multi-file"]):
        score += 2
    if risk_level == "high":
        score += 1
    if score >= 5:
        return "high"
    if score >= 3:
        return "medium"
    return "low"


def infer_departments(required_capabilities: List[str], requested_paths: List[str]) -> List[str]:
    capability_department_map = {
        "frontend": ["engineering"],
        "ui-implementation": ["engineering", "design"],
        "visual-design": ["design"],
        "ux": ["design"],
        "usability": ["design"],
        "backend": ["engineering"],
        "api": ["engineering", "testing"],
        "schema": ["engineering", "testing"],
        "database": ["engineering"],
        "python": ["engineering"],
        "architecture": ["engineering"],
        "ai": ["engineering"],
        "workflow-automation": ["engineering", "testing"],
        "ops": ["engineering", "studio-operations"],
        "infra": ["engineering", "studio-operations"],
        "runtime": ["engineering", "studio-operations"],
        "security": ["studio-operations", "testing"],
        "config": ["engineering", "studio-operations"],
        "policy": ["studio-operations"],
        "approval": ["studio-operations"],
        "docs": ["marketing"],
        "copy": ["marketing"],
        "scoping": ["product", "project-management"],
        "requirements": ["product"],
        "coordination": ["project-management"],
        "analysis": ["product", "studio-operations"],
        "reporting": ["studio-operations"],
        "qa": ["testing"],
        "verification": ["testing"],
        "performance": ["testing"],
        "risk": ["studio-operations", "testing"],
        "ci": ["engineering", "studio-operations"],
        "multi-file-change": ["engineering"],
    }
    departments: Set[str] = set()
    for capability in required_capabilities:
        departments.update(capability_department_map.get(capability, []))
    if any(path.startswith("org/") for path in requested_paths):
        departments.add("studio-operations")
    if not departments:
        departments.add("engineering")
    return sorted(departments)


def analyze_task(task: Dict[str, Any]) -> Dict[str, Any]:
    task_id = task.get("task_id") or "adhoc-task"
    task_summary = task.get("task") or task.get("task_summary") or ""
    requested_paths = [normalize_path(p) for p in task.get("requested_paths", task.get("target_paths", [])) if normalize_path(p)]
    protected_paths = detect_protected_paths(requested_paths, task.get("requested_actions", []))
    outputs = infer_outputs(task_summary, requested_paths)
    capabilities = infer_capabilities(task_summary, requested_paths, outputs)
    risk_level, risk_reasons = infer_risk(task, protected_paths)
    complexity = infer_complexity(task, outputs, risk_level)
    departments = infer_departments(capabilities, requested_paths)
    intake = {
        "task_id": task_id,
        "task_summary": task_summary,
        "requested_paths": requested_paths,
        "required_capabilities": capabilities,
        "desired_outputs": outputs,
        "departments_involved": departments,
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "complexity": complexity,
        "protected_paths": protected_paths,
        "signals": {
            "requested_actions": task.get("requested_actions", []),
            "verification_commands": task.get("verification_commands", []),
            "constraints": task.get("constraints", []),
        },
    }
    if task.get("requested_route"):
        intake["requested_route"] = task.get("requested_route")
    temp_path = Path(task_paths(task_id)["dir"]) / "task-intake.json"
    temp_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path.write_text(json.dumps(intake, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ensure_schema_valid(temp_path, "task-intake")
    return intake


def main() -> int:
    args = parse_args()
    task = load_task(args)
    intake = analyze_task(task)
    if args.output:
        Path(args.output).write_text(json.dumps(intake, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(intake, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
