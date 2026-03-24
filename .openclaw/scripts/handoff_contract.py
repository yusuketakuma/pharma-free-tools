#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from task_runtime import CONFIG_ROOT, WORKSPACE_ROOT, atomic_write_json, atomic_write_text, load_json, normalize_path, now_iso


def _project_id_from_task(task: Dict[str, Any]) -> str | None:
    explicit = task.get("project_id") or task.get("projectId")
    if explicit:
        return str(explicit)
    for raw in task.get("requested_paths", []) or []:
        path = normalize_path(str(raw))
        if path.startswith("projects/"):
            parts = path.split("/")
            if len(parts) >= 2:
                return parts[1]
    return None


REGISTRY_PATH = CONFIG_ROOT / "project-injection-registry.json"


def _load_registry() -> Dict[str, Any]:
    payload = load_json(REGISTRY_PATH, default={}) or {}
    if not isinstance(payload, dict):
        return {}
    return payload


def _registry_project(project_id: str | None) -> Dict[str, Any]:
    registry = _load_registry()
    default_cfg = registry.get("default") if isinstance(registry.get("default"), dict) else {}
    projects = registry.get("projects") if isinstance(registry.get("projects"), dict) else {}
    project_cfg = projects.get(project_id, {}) if project_id else {}
    merged = dict(default_cfg)
    for key, value in project_cfg.items():
        if isinstance(value, list) and isinstance(merged.get(key), list):
            merged[key] = [*merged[key], *value]
        elif isinstance(value, dict) and isinstance(merged.get(key), dict):
            tmp = dict(merged[key])
            tmp.update(value)
            merged[key] = tmp
        else:
            merged[key] = value
    return merged


def _project_rules(project_id: str | None) -> List[str]:
    cfg = _registry_project(project_id)
    rules = cfg.get("projectRules") if isinstance(cfg.get("projectRules"), list) else []
    return [str(item) for item in rules]


def _repo_root_for_project(project_id: str | None) -> str:
    if not project_id:
        return str(WORKSPACE_ROOT)
    return str((WORKSPACE_ROOT / "projects" / project_id).resolve())


def _related_directories(paths: List[str]) -> List[str]:
    dirs: List[str] = []
    seen = set()
    for raw in paths:
        path = normalize_path(str(raw))
        if not path:
            continue
        parent = str(Path(path).parent).replace("\\", "/")
        if parent == ".":
            parent = ""
        if parent not in seen:
            seen.add(parent)
            dirs.append(parent or ".")
    return dirs


def _load_previous_run_summary(task_dir: Path) -> str:
    result = load_json(task_dir / "execution-result.json", default={}) or {}
    review = load_json(task_dir / "review-report.json", default={}) or {}
    lines: List[str] = []
    if result:
        lines.append(f"Previous status: {result.get('status', 'unknown')}")
        summary = str(result.get("summary") or "").strip()
        if summary:
            lines.append(f"Previous summary: {summary}")
    if review:
        verdict = str(review.get("verdict") or "").strip()
        if verdict:
            lines.append(f"Previous review verdict: {verdict}")
        review_summary = str(review.get("summary") or "").strip()
        if review_summary:
            lines.append(f"Previous review summary: {review_summary}")
    return "\n".join(lines).strip() or "No previous execution summary available."


def build_handoff_pack(task: Dict[str, Any], route: Dict[str, Any], dispatch_plan: Dict[str, Any] | None, task_dir: Path) -> Dict[str, Any]:
    requested_paths = [normalize_path(str(item)) for item in (task.get("requested_paths") or []) if str(item).strip()]
    project_id = _project_id_from_task(task)
    registry_cfg = _registry_project(project_id)
    repo_context = {
        "projectId": project_id,
        "sourceRepoPath": _repo_root_for_project(project_id),
        "workspacePath": str(WORKSPACE_ROOT),
        "relevantDirectories": _related_directories(requested_paths),
        "targetPaths": requested_paths,
        "protectedPaths": route.get("protected_paths", []),
        "projectRules": _project_rules(project_id),
        "sourceOfTruthHints": [str(item) for item in registry_cfg.get("sourceOfTruthHints", [])],
    }
    working_context = {
        "taskId": task.get("task_id"),
        "requestedActions": task.get("requested_actions", []),
        "relatedFiles": requested_paths,
        "reviewFocus": task.get("review_focus", []),
        "knownFailures": [],
        "unresolvedQuestions": [],
        "assumptions": [str(item) for item in registry_cfg.get("assumptions", [])],
    }
    execution_constraints = {
        **(registry_cfg.get("executionConstraints") if isinstance(registry_cfg.get("executionConstraints"), dict) else {}),
        "noDestructive": True,
        "approvalRequired": bool(route.get("approval_required")),
        "protectedPaths": route.get("protected_paths", []),
        "allowedWriteScope": requested_paths,
    }
    verification_plan = {
        **(registry_cfg.get("verificationPlan") if isinstance(registry_cfg.get("verificationPlan"), dict) else {}),
        "requiredCommands": task.get("verification_commands", []),
    }
    success_criteria = {
        **(registry_cfg.get("successCriteria") if isinstance(registry_cfg.get("successCriteria"), dict) else {}),
        "manualReviewRequiredWhen": route.get("protected_paths", []),
    }
    previous_summary = _load_previous_run_summary(task_dir)

    repo_context_path = task_dir / "repo-context.json"
    working_context_path = task_dir / "working-context.json"
    execution_constraints_path = task_dir / "execution-constraints.json"
    verification_plan_path = task_dir / "verification-plan.json"
    success_criteria_path = task_dir / "success-criteria.json"
    previous_run_summary_path = task_dir / "previous-run-summary.md"

    atomic_write_json(repo_context_path, repo_context)
    atomic_write_json(working_context_path, working_context)
    atomic_write_json(execution_constraints_path, execution_constraints)
    atomic_write_json(verification_plan_path, verification_plan)
    atomic_write_json(success_criteria_path, success_criteria)
    atomic_write_text(previous_run_summary_path, previous_summary + "\n")

    rel = lambda p: str(p.resolve().relative_to(WORKSPACE_ROOT.resolve())).replace("\\", "/")
    manifest = {
        "generatedAt": now_iso(),
        "projectId": project_id,
        "artifacts": {
            "repoContext": rel(repo_context_path),
            "workingContext": rel(working_context_path),
            "executionConstraints": rel(execution_constraints_path),
            "verificationPlan": rel(verification_plan_path),
            "successCriteria": rel(success_criteria_path),
            "previousRunSummary": rel(previous_run_summary_path),
        },
    }
    atomic_write_json(task_dir / "handoff-pack.json", manifest)

    context_lines = [
        f"# Context Pack: {task.get('task_id', 'unknown')}",
        "",
        f"- task: {task.get('task', '')}",
        f"- route: {route.get('decision', 'unknown')}",
        f"- dispatch_id: {(dispatch_plan or {}).get('dispatch_id', '(none)')}",
        f"- project_id: {project_id or '(none)'}",
        f"- approval_required: {str(bool(route.get('approval_required'))).lower()}",
        f"- protected_paths: {', '.join(route.get('protected_paths', [])) if route.get('protected_paths') else '(none)'}",
        "",
        "## Constraints",
    ]
    constraints = task.get("constraints") or ["No additional constraints provided"]
    context_lines.extend(f"- {item}" for item in constraints)
    context_lines.extend([
        "",
        "## Target Paths",
        *[f"- {item}" for item in (requested_paths or ["(none)"])],
        "",
        "## Verification Commands",
        *[f"- {item}" for item in (task.get('verification_commands') or ["(manual review only)"])],
        "",
        "## Review Focus",
        *[f"- {item}" for item in (task.get('review_focus') or ["correctness", "safety"])],
        "",
        "## Project Rules",
        *[f"- {item}" for item in repo_context["projectRules"]],
        "",
        "## Previous Run Summary",
        previous_summary,
        "",
        "## Handoff Artifacts",
        f"- repo_context: {manifest['artifacts']['repoContext']}",
        f"- working_context: {manifest['artifacts']['workingContext']}",
        f"- execution_constraints: {manifest['artifacts']['executionConstraints']}",
        f"- verification_plan: {manifest['artifacts']['verificationPlan']}",
        f"- success_criteria: {manifest['artifacts']['successCriteria']}",
        f"- previous_run_summary: {manifest['artifacts']['previousRunSummary']}",
    ])
    atomic_write_text(task_dir / "context-pack.md", "\n".join(context_lines).rstrip() + "\n")
    return manifest


def augment_execution_request(request: Dict[str, Any], task: Dict[str, Any], task_dir: Path) -> Dict[str, Any]:
    manifest = load_json(task_dir / "handoff-pack.json", default={}) or {}
    project_id = manifest.get("projectId") or _project_id_from_task(task)
    request = dict(request)
    request["project_id"] = project_id
    request["handoff_pack"] = manifest.get("artifacts", {})
    request["return_schema"] = {
        "changedFiles": "list[string]",
        "commandsRun": "list[string]",
        "verificationStatus": {"passed": "boolean", "failedCommands": "list[string]"},
        "risks": "list[string]",
        "blockers": "list[string]",
        "nextRecommendedAction": "string",
        "resumeHint": "string",
    }
    return request


def normalize_execution_result(result: Dict[str, Any], task: Dict[str, Any], task_dir: Path) -> Dict[str, Any]:
    payload = dict(result)
    changed_files = payload.get("changed_files") or payload.get("changedFiles") or task.get("requested_paths", [])
    verification_results = payload.get("verification_results") or payload.get("verificationResults") or task.get("verification_commands", [])
    remaining_risks = payload.get("remaining_risks") or payload.get("remainingRisks") or []
    if not isinstance(changed_files, list):
        changed_files = [str(changed_files)] if changed_files else []
    if not isinstance(verification_results, list):
        verification_results = [str(verification_results)] if verification_results else []
    if not isinstance(remaining_risks, list):
        remaining_risks = [str(remaining_risks)] if remaining_risks else []

    failed_commands = [str(item) for item in verification_results if isinstance(item, str) and ("fail" in item.lower() or "error" in item.lower())]
    manifest = load_json(task_dir / "handoff-pack.json", default={}) or {}
    payload["changed_files"] = [normalize_path(str(item)) for item in changed_files]
    payload["verification_results"] = [str(item) for item in verification_results]
    payload["remaining_risks"] = [str(item) for item in remaining_risks]
    payload["changedFiles"] = payload["changed_files"]
    payload["commandsRun"] = payload["verification_results"]
    payload["verificationStatus"] = {
        "passed": payload.get("status") == "success" and not failed_commands,
        "failedCommands": failed_commands,
    }
    payload.setdefault("risks", payload["remaining_risks"])
    payload.setdefault("blockers", [] if payload.get("status") == "success" else [payload.get("summary", "execution failed")])
    payload.setdefault("nextRecommendedAction", "Review result and continue from resumeHint if more work remains.")
    payload.setdefault("resumeHint", "Use previous-run-summary.md and context-pack.md to resume safely.")
    payload.setdefault("projectId", manifest.get("projectId") or _project_id_from_task(task))
    return payload
