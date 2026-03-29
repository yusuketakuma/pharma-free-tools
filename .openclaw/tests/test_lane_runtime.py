from __future__ import annotations

import json
import sys
import unittest
import uuid
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
WORKSPACE = ROOT.parent
sys.path.insert(0, str(SCRIPTS))

import execute_task as execute_task_module  # noqa: E402
from task_runtime import atomic_write_json, evaluate_claude_auth_status, load_claude_code_config, load_dispatch_attempts_artifact, load_json, task_paths  # noqa: E402


class LaneRuntimeAcceptanceTest(unittest.TestCase):
    def make_id(self, name: str) -> str:
        return f"lane-runtime-{name}-{uuid.uuid4().hex[:8]}"

    def dispatch_payload(self, task_id: str, *, selected_lane: str = "acp") -> dict:
        return {
            "task_id": task_id,
            "dispatch_id": f"dispatch-{task_id}",
            "execution_mode": "claude_code",
            "selected_provider": "claude_code",
            "selected_executor": "claude-code",
            "assignment_contract": {
                "lead_role": "engineering",
                "advisory_subroles": [],
                "active_subroles": [],
                "mandatory_review_roles": [],
            },
            "provider_assignments": {
                "lead": {"role": "engineering", "provider": "claude_code", "executor": "claude-code"},
                "subroles": [],
            },
            "scores": {"total": 1.0},
            "reasons": ["test fixture"],
            "capacity_snapshot_ref": f".openclaw/tasks/{task_id}/capacity-snapshot.json",
            "publish_policy": {"auto_publish_allowed": True, "block_on_degraded_success": False, "protected_paths": []},
            "captured_at": "2026-03-22T13:00:00+09:00",
            "auth_blocked": False,
            "pre_auth_openclaw_phase": False,
            "primary_mode": "acp",
            "selected_lane": selected_lane,
            "selection_reasons": ["test fixture"],
            "fallback_chain": ["acp", "cli", "cli_backend_safety_net"],
            "lane_health_snapshot": {
                "auth_ok": True,
                "acp_healthy": True,
                "cli_healthy": True,
                "cli_backend_healthy": True,
                "captured_at": "2026-03-22T13:00:00+09:00",
            },
            "task_type": "write",
        }

    def assignment_payload(self, task_id: str) -> dict:
        return {
            "task_id": task_id,
            "lead_role": "engineering",
            "advisory_subroles": [],
            "active_subroles": [],
            "mandatory_review_roles": [],
        }

    def task_payload(self, task_id: str, *, mock_mode: str | None = None) -> dict:
        payload = {
            "task_id": task_id,
            "task": "Implement lane runtime behavior",
            "requested_paths": [".openclaw/scripts/execute_task.py"],
            "constraints": [],
            "verification_commands": [],
            "review_focus": ["correctness"],
            "requested_actions": ["edit"],
            "requested_route": "claude-code",
        }
        if mock_mode:
            payload["mock_mode"] = mock_mode
        return payload

    def success_result(self, task_id: str, dispatch_id: str) -> dict:
        return {
            "task_id": task_id,
            "status": "success",
            "executor": "claude-code",
            "summary": "ok",
            "changed_files": [".openclaw/scripts/execute_task.py"],
            "verification_results": ["fixture"],
            "remaining_risks": [],
            "exit_code": 0,
            "started_at": "2026-03-22T13:00:00+09:00",
            "finished_at": "2026-03-22T13:00:01+09:00",
            "dispatch_id": dispatch_id,
            "_meta": {"lane": "acp", "publishable": True},
        }

    def runtime_error(self, task_id: str, dispatch_id: str, *, result_code: str | None = None, failure_stage: str = "session_start", partial_execution: bool = False, side_effects_possible: bool = False) -> dict:
        payload = {
            "task_id": task_id,
            "status": "runtime_error",
            "executor": "claude-code",
            "summary": "runtime error",
            "changed_files": [".openclaw/scripts/execute_task.py"] if partial_execution else [],
            "verification_results": ["fixture"],
            "remaining_risks": ["fixture"],
            "exit_code": 30,
            "started_at": "2026-03-22T13:00:00+09:00",
            "finished_at": "2026-03-22T13:00:01+09:00",
            "dispatch_id": dispatch_id,
            "_meta": {
                "failure_stage": failure_stage,
                "partial_execution": partial_execution,
                "side_effects_possible": side_effects_possible,
                "publishable": False,
            },
        }
        if result_code:
            payload["_meta"]["result_code"] = result_code
        return payload

    def prepare_task(self, task_id: str, dispatch: dict | None = None, *, mock_mode: str | None = None) -> Path:
        paths = task_paths(task_id)
        atomic_write_json(paths["task"], self.task_payload(task_id, mock_mode=mock_mode))
        atomic_write_json(paths["assignment"], self.assignment_payload(task_id))
        return paths["task"]

    def run_main(self, task_id: str, dispatch: dict, side_effect) -> None:
        with mock.patch.object(execute_task_module, "build_dispatch_plan", return_value=dispatch):
            with mock.patch.object(execute_task_module, "run_claude_lane", side_effect=side_effect):
                with mock.patch.object(sys, "argv", ["execute_task.py", "--task-id", task_id, "--task-file", str(task_paths(task_id)["task"])]):
                    self.assertEqual(execute_task_module.main(), 0)

    def test_acceptance_acp_success_path(self) -> None:
        task_id = self.make_id("acp-success")
        dispatch = self.dispatch_payload(task_id, selected_lane="acp")
        self.prepare_task(task_id)
        result = self.success_result(task_id, dispatch["dispatch_id"])
        self.run_main(task_id, dispatch, [(0, result, dispatch["dispatch_id"], "attempt-01")])
        state = load_json(task_paths(task_id)["state"])
        self.assertEqual(state["state"], "REVIEWING")

    def test_acceptance_acp_to_cli_backend_safety_net(self) -> None:
        task_id = self.make_id("acp-cli-safety")
        dispatch = self.dispatch_payload(task_id, selected_lane="acp")
        task_path = self.prepare_task(task_id)
        atomic_write_json(task_path, {
            "task_id": task_id,
            "task": "Review runtime behavior in read-only mode",
            "requested_paths": [".openclaw/scripts/execute_task.py"],
            "constraints": ["read-only"],
            "verification_commands": [],
            "review_focus": ["correctness"],
            "requested_actions": [],
            "requested_route": "claude-code",
        })
        side_effect = [
            (30, self.runtime_error(task_id, dispatch["dispatch_id"], failure_stage="session_start"), dispatch["dispatch_id"], "attempt-01"),
            (30, self.runtime_error(task_id, dispatch["dispatch_id"], failure_stage="health_check"), dispatch["dispatch_id"], "attempt-02"),
            (0, self.success_result(task_id, dispatch["dispatch_id"]), dispatch["dispatch_id"], "attempt-03"),
        ]
        self.run_main(task_id, dispatch, side_effect)
        state = load_json(task_paths(task_id)["state"])
        lane_selection = load_json(task_paths(task_id)["lane_selection"])
        self.assertEqual(state["state"], "REVIEWING")
        self.assertEqual(lane_selection["selected_lane"], "cli_backend_safety_net")
        self.assertIn("auto fallback cli->cli_backend_safety_net", " ".join(lane_selection["selection_reasons"]))

    def test_acceptance_acp_auth_ng(self) -> None:
        task_id = self.make_id("auth-ng")
        dispatch = self.dispatch_payload(task_id, selected_lane="acp")
        self.prepare_task(task_id)
        side_effect = [(30, self.runtime_error(task_id, dispatch["dispatch_id"], result_code="AUTH_REQUIRED", failure_stage="auth_preflight"), dispatch["dispatch_id"], "attempt-01")]
        with mock.patch.object(execute_task_module, "build_dispatch_plan", return_value=dispatch):
            with mock.patch.object(execute_task_module, "run_claude_lane", side_effect=side_effect):
                with mock.patch.object(sys, "argv", ["execute_task.py", "--task-id", task_id, "--task-file", str(task_paths(task_id)["task"])]):
                    self.assertEqual(execute_task_module.main(), 30)
        state = load_json(task_paths(task_id)["state"])
        self.assertEqual(state["state"], "AUTH_REQUIRED")

    def test_acceptance_acp_partial_write_failure_blocks_fallback(self) -> None:
        task_id = self.make_id("partial-write")
        dispatch = self.dispatch_payload(task_id, selected_lane="acp")
        self.prepare_task(task_id)
        side_effect = [(30, self.runtime_error(task_id, dispatch["dispatch_id"], failure_stage="execution", partial_execution=True, side_effects_possible=True), dispatch["dispatch_id"], "attempt-01")]
        with mock.patch.object(execute_task_module, "build_dispatch_plan", return_value=dispatch):
            with mock.patch.object(execute_task_module, "run_claude_lane", side_effect=side_effect):
                with mock.patch.object(sys, "argv", ["execute_task.py", "--task-id", task_id, "--task-file", str(task_paths(task_id)["task"])]):
                    self.assertEqual(execute_task_module.main(), 30)
        state = load_json(task_paths(task_id)["state"])
        self.assertEqual(state["state"], "WAITING_MANUAL_REVIEW")

    def test_claude_config_keeps_subscription_only_auth_policy(self) -> None:
        config = load_claude_code_config()
        self.assertEqual(config["auth"]["primary_method"], "claude_subscription")
        self.assertEqual(config["auth"]["allowed_methods"], ["claude_subscription"])

    def test_evaluate_claude_auth_status_rejects_non_subscription_auth(self) -> None:
        ok, method, error = evaluate_claude_auth_status(
            {"loggedIn": True, "authMethod": "api_key", "email": "tester@example.com"},
            {"primary_method": "claude_subscription", "allowed_methods": ["claude_subscription"]},
        )
        self.assertFalse(ok)
        self.assertEqual(method, "api_key")
        self.assertIn("unsupported auth method", error or "")

    def test_dispatch_attempt_loader_migrates_legacy_rows(self) -> None:
        task_id = self.make_id("migrate")
        attempts_path = task_paths(task_id)["dispatch_attempts"]
        attempts_path.parent.mkdir(parents=True, exist_ok=True)
        attempts_path.write_text(
            json.dumps(
                {
                    "taskId": task_id,
                    "dispatchId": "dispatch-legacy",
                    "attempt": 1,
                    "selected_lane": "cli",
                    "status": "ok",
                    "captured_at": "2026-03-22T13:00:00+09:00",
                },
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        rows = load_dispatch_attempts_artifact(attempts_path)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["lane"], "cli")
        self.assertEqual(rows[0]["status"], "success")
        self.assertTrue(attempts_path.with_suffix(".jsonl.legacy.bak").exists())


if __name__ == "__main__":
    unittest.main()
