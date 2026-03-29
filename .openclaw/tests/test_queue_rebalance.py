from __future__ import annotations

import json
import subprocess
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
from dispatch_task import build_dispatch_plan  # noqa: E402
from task_runtime import atomic_write_json, load_json, load_dispatch_attempts_artifact, sync_queue_for_task, task_paths, update_state  # noqa: E402

AUTH_RUNTIME = ROOT / "runtime" / "auth" / "latest-status.json"
CAPACITY_RUNTIME = ROOT / "runtime" / "capacity" / "latest-capacity.json"
LANE_HEALTH_RUNTIME = ROOT / "runtime" / "health" / "lane-health.json"


class QueueRebalanceSmokeTest(unittest.TestCase):
    auth_backup: str | None = None
    capacity_backup: str | None = None
    lane_health_backup: str | None = None

    @classmethod
    def setUpClass(cls) -> None:
        cls.auth_backup = AUTH_RUNTIME.read_text(encoding="utf-8") if AUTH_RUNTIME.exists() else None
        cls.capacity_backup = CAPACITY_RUNTIME.read_text(encoding="utf-8") if CAPACITY_RUNTIME.exists() else None
        cls.lane_health_backup = LANE_HEALTH_RUNTIME.read_text(encoding="utf-8") if LANE_HEALTH_RUNTIME.exists() else None

    @classmethod
    def tearDownClass(cls) -> None:
        if cls.auth_backup is not None:
            AUTH_RUNTIME.write_text(cls.auth_backup, encoding="utf-8")
        if cls.capacity_backup is not None:
            CAPACITY_RUNTIME.write_text(cls.capacity_backup, encoding="utf-8")
        if cls.lane_health_backup is not None:
            LANE_HEALTH_RUNTIME.write_text(cls.lane_health_backup, encoding="utf-8")

    def make_id(self, name: str) -> str:
        return f"step6-{name}-{uuid.uuid4().hex[:8]}"

    def route_payload(self, task_id: str, *, decision: str = "claude-code", approval_required: bool = False, protected_paths: list[str] | None = None, route_decision_id: str = "route-fixed") -> dict:
        return {
            "task_id": task_id,
            "route_decision_id": route_decision_id,
            "decision": decision,
            "score": 0.91 if decision == "claude-code" else 0.2,
            "reasons": ["test fixture"],
            "approval_required": approval_required,
            "protected_paths": protected_paths or [],
            "affected_paths": [".openclaw/scripts/execute_task.py"],
        }

    def dispatch_payload(
        self,
        task_id: str,
        *,
        dispatch_id: str = "dispatch-fixed",
        execution_mode: str = "claude_code",
        selected_provider: str = "claude_code",
        selected_executor: str = "claude-code",
        selected_lane: str = "acp",
        fallback_chain: list[str] | None = None,
        queue_reason: str | None = None,
        auth_blocked: bool = False,
        pre_auth_openclaw_phase: bool = False,
    ) -> dict:
        payload = {
            "task_id": task_id,
            "dispatch_id": dispatch_id,
            "execution_mode": execution_mode,
            "selected_provider": selected_provider,
            "selected_executor": selected_executor,
            "assignment_contract": {
                "lead_role": "engineering",
                "advisory_subroles": [],
                "active_subroles": [],
                "mandatory_review_roles": [],
            },
            "provider_assignments": {
                "lead": {"role": "engineering", "provider": selected_provider, "executor": selected_executor},
                "subroles": [],
            },
            "scores": {
                "capability_fit": 0.9,
                "provider_preference_fit": 0.8,
                "historical_success": 0.8,
                "latency_fit": 0.7,
                "limit_pressure": 0.1,
                "cost_pressure": 0.1,
                "queue_penalty": 0.2,
                "risk_penalty": 0.05,
                "total": 2.75,
            },
            "reasons": ["test fixture"],
            "capacity_snapshot_ref": f".openclaw/tasks/{task_id}/capacity-snapshot.json",
            "publish_policy": {"auto_publish_allowed": True, "block_on_degraded_success": False, "protected_paths": []},
            "captured_at": "2026-03-22T13:00:00+09:00",
            "auth_blocked": auth_blocked,
            "pre_auth_openclaw_phase": pre_auth_openclaw_phase,
            "primary_mode": "acp",
            "selected_lane": selected_lane,
            "selection_reasons": ["test fixture"],
            "fallback_chain": fallback_chain or ["acp", "cli", "cli_backend_safety_net"],
            "lane_health_snapshot": {
                "auth_ok": True,
                "acp_healthy": True,
                "cli_healthy": True,
                "cli_backend_healthy": True,
                "captured_at": "2026-03-22T13:00:00+09:00",
            },
            "task_type": "write",
        }
        if queue_reason:
            payload["queue_reason"] = queue_reason
        return payload

    def result_payload(self, task_id: str, *, status: str = "success", exit_code: int = 0, result_code: str | None = None) -> dict:
        payload = {
            "task_id": task_id,
            "status": status,
            "executor": "claude-code",
            "summary": "fixture result",
            "changed_files": [".openclaw/scripts/execute_task.py"],
            "verification_results": ["fixture"],
            "remaining_risks": [],
            "exit_code": exit_code,
            "started_at": "2026-03-22T13:00:00+09:00",
            "finished_at": "2026-03-22T13:00:01+09:00",
            "dispatch_id": "dispatch-fixed",
        }
        if result_code:
            payload["_meta"] = {"result_code": result_code}
        return payload

    def review_payload(self, task_id: str, *, publish_recommendation: str = "publish", publishable: bool = True, requires_manual_review: bool = False, result_classification: str = "strict_success") -> dict:
        return {
            "task_id": task_id,
            "verdict": "pass" if publish_recommendation == "publish" else "blocked",
            "summary": "fixture review",
            "issues": [],
            "publish_recommendation": publish_recommendation,
            "publishable": publishable,
            "requires_manual_review": requires_manual_review,
            "result_classification": result_classification,
            "fallback_used": result_classification.startswith("degraded_"),
        }

    def seed_task(self, task_id: str, *, state_name: str, route: dict, dispatch: dict, result: dict | None = None, review: dict | None = None, approval: dict | None = None, approval_id: str | None = None) -> dict:
        paths = task_paths(task_id)
        atomic_write_json(paths["task"], {
            "task_id": task_id,
            "task": "Implement queue rebalance fixture",
            "requested_paths": [".openclaw/scripts/execute_task.py", ".openclaw/scripts/rebalance_queue.py"],
            "constraints": ["preserve route decision"],
            "verification_commands": ["python3 -m unittest discover -s .openclaw/tests -p 'test_*.py'"],
            "review_focus": ["correctness"],
            "requested_actions": ["edit"],
            "requested_route": "claude-code",
            "mock_mode": "success",
        })
        atomic_write_json(paths["route"], route)
        atomic_write_json(paths["dispatch"], dispatch)
        atomic_write_json(paths["lane_selection"], {
            "task_id": task_id,
            "provider": dispatch.get("selected_provider", "claude_code"),
            "primary_mode": dispatch.get("primary_mode", "acp"),
            "selected_lane": dispatch.get("selected_lane", "acp"),
            "fallback_chain": dispatch.get("fallback_chain", ["acp", "cli", "cli_backend_safety_net"]),
            "selection_reasons": dispatch.get("selection_reasons", ["test fixture"]),
            "lane_health_snapshot": dispatch.get("lane_health_snapshot", {}),
            "captured_at": dispatch.get("captured_at", "2026-03-22T13:00:00+09:00"),
            "version": 1,
        })
        if result is not None:
            atomic_write_json(paths["result"], result)
        if review is not None:
            atomic_write_json(paths["review"], review)
        state = update_state(
            task_id,
            state_name,
            route=route["decision"],
            route_decision_id=route["route_decision_id"],
            approval=approval or {"required": route["approval_required"], "approved": True},
            approval_id=approval_id,
            dispatch_id=dispatch["dispatch_id"],
            protected_paths=route.get("protected_paths", []),
            message=f"seeded {state_name}",
        )
        sync_queue_for_task(task_id, state_payload=state, route=route, dispatch=dispatch, result=result, review=review)
        return paths

    def run_script(self, *args: str) -> dict:
        completed = subprocess.run(["python3", *args], cwd=str(WORKSPACE), check=True, capture_output=True, text=True)
        return json.loads(completed.stdout or "{}")

    def test_auth_waiting_rebalances_and_resume_reuses_route_and_dispatch(self) -> None:
        task_id = self.make_id("auth")
        route = self.route_payload(task_id, route_decision_id="route-auth")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-auth")
        result = self.result_payload(task_id, status="runtime_error", exit_code=30, result_code="AUTH_REQUIRED")
        review = self.review_payload(task_id, publish_recommendation="hold", publishable=False, requires_manual_review=False, result_classification="auth_required")
        paths = self.seed_task(task_id, state_name="AUTH_REQUIRED", route=route, dispatch=dispatch, result=result, review=review)

        queue_status = load_json(paths["queue_status"])
        self.assertEqual(queue_status["queue_reason"], "waiting_auth")
        self.assertEqual(queue_status["resume_target_state"], "READY_FOR_EXECUTION")

        AUTH_RUNTIME.parent.mkdir(parents=True, exist_ok=True)
        AUTH_RUNTIME.write_text(json.dumps({"ok": True, "logged_in": True, "stdout": {"loggedIn": True}}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        rebalance = self.run_script(str(SCRIPTS / "rebalance_queue.py"), "--task-id", task_id)
        self.assertEqual(rebalance["results"][0]["action"], "released")
        state_after_rebalance = load_json(paths["state"])
        self.assertEqual(state_after_rebalance["state"], "READY_FOR_EXECUTION")
        self.assertEqual(state_after_rebalance["route_decision_id"], "route-auth")
        self.assertEqual(state_after_rebalance["dispatch_id"], "dispatch-auth")

        dispatch_before = load_json(paths["dispatch"])
        subprocess.run([
            "python3",
            str(SCRIPTS / "execute_task.py"),
            "--task-id",
            task_id,
            "--task-file",
            str(paths["task"]),
        ], cwd=str(WORKSPACE), check=True)

        final_state = load_json(paths["state"])
        self.assertEqual(final_state["state"], "REVIEWING")
        self.assertEqual(final_state["route_decision_id"], "route-auth")
        self.assertEqual(final_state["dispatch_id"], "dispatch-auth")
        self.assertEqual(load_json(paths["dispatch"])["dispatch_id"], dispatch_before["dispatch_id"])
        resumed_history = [entry for entry in final_state["history"] if entry["state"] in {"READY_FOR_EXECUTION", "RUNNING", "REVIEWING"}]
        self.assertTrue(resumed_history)
        self.assertTrue(all(entry.get("dispatch_id") == "dispatch-auth" for entry in resumed_history))
        self.assertEqual(load_json(paths["route"])["route_decision_id"], "route-auth")

    def test_dispatch_attempt_artifact_includes_schema_fields(self) -> None:
        task_id = self.make_id("attempt-schema")
        route = self.route_payload(task_id, route_decision_id="route-attempt-schema")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-attempt-schema")
        paths = self.seed_task(task_id, state_name="READY_FOR_EXECUTION", route=route, dispatch=dispatch)

        subprocess.run([
            "python3",
            str(SCRIPTS / "execute_task.py"),
            "--task-id",
            task_id,
            "--task-file",
            str(paths["task"]),
        ], cwd=str(WORKSPACE), check=True)

        attempts = load_dispatch_attempts_artifact(paths["dispatch_attempts"])
        self.assertEqual(len(attempts), 1)
        attempt = attempts[0]
        self.assertEqual(attempt["attempt_index"], 1)
        self.assertFalse(attempt["fallback_triggered"])
        self.assertIsNone(attempt["fallback_target"])
        self.assertEqual(attempt["version"], 1)


    def test_waiting_approval_classifies_and_rebalances_when_approved(self) -> None:
        task_id = self.make_id("approval")
        route = self.route_payload(task_id, decision="claude-code", approval_required=True, protected_paths=["org/policy.md"], route_decision_id="route-approval")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-approval")
        paths = self.seed_task(
            task_id,
            state_name="WAITING_APPROVAL",
            route=route,
            dispatch=dispatch,
            review=self.review_payload(task_id, publish_recommendation="approval_required", publishable=False, requires_manual_review=False, result_classification="approval_required"),
            approval={"required": True, "approved": False},
        )
        self.assertEqual(load_json(paths["queue_status"])["queue_reason"], "waiting_approval")

        state = load_json(paths["state"])
        state["approval"] = {"required": True, "approved": True, "approved_by": "tester", "approved_at": "2026-03-22T13:01:00+09:00"}
        state["approval_id"] = "approval-fixed"
        atomic_write_json(paths["state"], state)

        rebalance = self.run_script(str(SCRIPTS / "rebalance_queue.py"), "--task-id", task_id)
        self.assertEqual(rebalance["results"][0]["action"], "released")
        rebalanced_state = load_json(paths["state"])
        self.assertEqual(rebalanced_state["state"], "READY_FOR_EXECUTION")
        self.assertEqual(rebalanced_state["approval_id"], "approval-fixed")
        self.assertEqual(rebalanced_state["route_decision_id"], "route-approval")

    def test_waiting_capacity_classifies_and_rebalances_when_pressure_recovers(self) -> None:
        task_id = self.make_id("capacity")
        route = self.route_payload(task_id, route_decision_id="route-capacity")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-capacity", execution_mode="queued", queue_reason="waiting_capacity", selected_provider="claude_code")
        paths = self.seed_task(task_id, state_name="WAITING_CAPACITY", route=route, dispatch=dispatch)
        self.assertEqual(load_json(paths["queue_status"])["queue_reason"], "waiting_capacity")

        CAPACITY_RUNTIME.parent.mkdir(parents=True, exist_ok=True)
        CAPACITY_RUNTIME.write_text(json.dumps({
            "captured_at": "2026-03-22T13:02:00+09:00",
            "providers": {
                "openclaw": {
                    "healthy": True,
                    "remaining_requests_ratio": 0.8,
                    "remaining_tokens_ratio": 0.8,
                    "usage_pressure": 0.1,
                    "cost_pressure": 0.1,
                    "hard_blocked": False,
                    "captured_at": "2026-03-22T13:02:00+09:00",
                    "source": "test"
                },
                "claude_code": {
                    "healthy": True,
                    "auth_ok": True,
                    "rpm_pressure": 0.1,
                    "itpm_pressure": 0.1,
                    "otpm_pressure": 0.1,
                    "spend_pressure": 0.1,
                    "retry_after_sec": 0,
                    "hard_blocked": False,
                    "captured_at": "2026-03-22T13:02:00+09:00",
                    "source": "test"
                }
            }
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        rebalance = self.run_script(str(SCRIPTS / "rebalance_queue.py"), "--task-id", task_id)
        self.assertEqual(rebalance["results"][0]["action"], "released")
        state = load_json(paths["state"])
        self.assertEqual(state["state"], "READY_FOR_EXECUTION")
        self.assertEqual(state["dispatch_id"], "dispatch-capacity")

    def test_waiting_manual_review_classifies_and_rebalances_when_resolved(self) -> None:
        task_id = self.make_id("manual-review")
        route = self.route_payload(task_id, route_decision_id="route-manual")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-manual")
        review = self.review_payload(task_id, publish_recommendation="hold", publishable=False, requires_manual_review=True, result_classification="degraded_success_write")
        paths = self.seed_task(task_id, state_name="WAITING_MANUAL_REVIEW", route=route, dispatch=dispatch, review=review)
        self.assertEqual(load_json(paths["queue_status"])["queue_reason"], "waiting_manual_review")

        atomic_write_json(paths["manual_review_status"], {"resolved": True, "reviewer": "tester"})

        rebalance = self.run_script(str(SCRIPTS / "rebalance_queue.py"), "--task-id", task_id)
        self.assertEqual(rebalance["results"][0]["action"], "released")
        state = load_json(paths["state"])
        self.assertEqual(state["state"], "REVIEWING")
        self.assertEqual(state["route_decision_id"], "route-manual")
        updated_review = load_json(paths["review"])
        self.assertTrue(updated_review["publishable"])
        self.assertFalse(updated_review["requires_manual_review"])
        self.assertEqual(updated_review["publish_recommendation"], "publish")

    def test_invalid_queue_artifact_fails_safe_to_review_failed(self) -> None:
        task_id = self.make_id("invalid-artifact")
        route = self.route_payload(task_id, route_decision_id="route-invalid")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-invalid")
        result = self.result_payload(task_id, status="runtime_error", exit_code=30, result_code="AUTH_REQUIRED")
        review = self.review_payload(task_id, publish_recommendation="hold", publishable=False, requires_manual_review=False, result_classification="auth_required")
        paths = self.seed_task(task_id, state_name="AUTH_REQUIRED", route=route, dispatch=dispatch, result=result, review=review)
        runtime_entry = ROOT / "runtime" / "queue" / "waiting_auth" / f"{task_id}.json"
        runtime_entry.write_text("{not-json\n", encoding="utf-8")

        rebalance = self.run_script(str(SCRIPTS / "rebalance_queue.py"), "--task-id", task_id)
        self.assertEqual(rebalance["results"][0]["action"], "invalid")
        state = load_json(paths["state"])
        self.assertEqual(state["state"], "REVIEW_FAILED")
        review_after = load_json(paths["review"])
        self.assertEqual(review_after["result_classification"], "queue_artifact_invalid")
        self.assertFalse(runtime_entry.exists())

    def test_duplicate_rebalance_is_deduped(self) -> None:
        task_id = self.make_id("dedupe")
        route = self.route_payload(task_id, route_decision_id="route-dedupe")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-dedupe")
        result = self.result_payload(task_id, status="runtime_error", exit_code=30, result_code="AUTH_REQUIRED")
        review = self.review_payload(task_id, publish_recommendation="hold", publishable=False, requires_manual_review=False, result_classification="auth_required")
        paths = self.seed_task(task_id, state_name="AUTH_REQUIRED", route=route, dispatch=dispatch, result=result, review=review)
        lock_path = paths["dir"] / ".lock"
        lock_path.write_text("held by test\n", encoding="utf-8")
        try:
            rebalance = self.run_script(str(SCRIPTS / "rebalance_queue.py"), "--task-id", task_id)
        finally:
            lock_path.unlink(missing_ok=True)
        self.assertEqual(rebalance["results"][0]["action"], "skipped_locked")
        self.assertEqual(load_json(paths["state"])["state"], "AUTH_REQUIRED")

    def test_resume_does_not_redispatch_existing_dispatch(self) -> None:
        task_id = self.make_id("resume-no-redispatch")
        route = self.route_payload(task_id, route_decision_id="route-no-redispatch")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-no-redispatch")
        paths = self.seed_task(task_id, state_name="READY_FOR_EXECUTION", route=route, dispatch=dispatch)
        before = load_json(paths["dispatch"])

        subprocess.run([
            "python3",
            str(SCRIPTS / "execute_task.py"),
            "--task-id",
            task_id,
            "--task-file",
            str(paths["task"]),
        ], cwd=str(WORKSPACE), check=True)

        after = load_json(paths["dispatch"])
        self.assertEqual(after["dispatch_id"], before["dispatch_id"])
        state = load_json(paths["state"])
        self.assertEqual(state["dispatch_id"], "dispatch-no-redispatch")
        self.assertEqual(state["route_decision_id"], "route-no-redispatch")

    def test_plan_only_auth_ng_defaults_to_waiting_auth_and_preprocess_exception_marks_context_pack(self) -> None:
        assignment = {
            "task_id": "t-dispatch-auth",
            "lead_role": "engineering",
            "advisory_subroles": [],
            "active_subroles": [],
            "mandatory_review_roles": [],
        }
        auth_ng_snapshot = ({
            "healthy": True,
            "remaining_requests_ratio": 0.8,
            "remaining_tokens_ratio": 0.8,
            "usage_pressure": 0.1,
            "cost_pressure": 0.1,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        }, {
            "healthy": True,
            "acp_healthy": True,
            "cli_healthy": True,
            "cli_backend_healthy": True,
            "auth_ok": False,
            "rpm_pressure": 0.1,
            "itpm_pressure": 0.1,
            "otpm_pressure": 0.1,
            "spend_pressure": 0.1,
            "retry_after_sec": 0,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        })

        task_default = {
            "task_id": self.make_id("plan-auth-default"),
            "task": "Implement adapter change",
            "requested_paths": [".openclaw/scripts/task_runtime.py", ".openclaw/scripts/rebalance_queue.py"],
            "constraints": [],
            "verification_commands": ["python3 -m unittest"],
            "review_focus": ["correctness"],
            "requested_actions": ["edit"],
            "requested_route": "claude-code",
        }
        with mock.patch("dispatch_task.refresh_provider_snapshots", return_value=auth_ng_snapshot):
            plan_default = build_dispatch_plan(task_default, assignment)
        self.assertEqual(plan_default["execution_mode"], "plan_only")
        self.assertTrue(plan_default["auth_blocked"])
        self.assertFalse(plan_default["pre_auth_openclaw_phase"])
        self.assertEqual(plan_default["queue_reason"], "waiting_auth")

        task_exception = {
            **task_default,
            "task_id": self.make_id("plan-auth-exception"),
            "task": "Implement adapter change and prepare docs draft",
            "constraints": ["prepare context pack and docs draft before Claude resumes"],
            "review_focus": ["documentation"],
        }
        with mock.patch("dispatch_task.refresh_provider_snapshots", return_value=auth_ng_snapshot):
            plan_exception = build_dispatch_plan(task_exception, assignment)
        self.assertTrue(plan_exception["pre_auth_openclaw_phase"])

        task_id = self.make_id("plan-auth-runtime")
        fake_plan = self.dispatch_payload(
            task_id,
            dispatch_id="dispatch-auth-runtime",
            execution_mode="plan_only",
            selected_provider="claude_code",
            selected_executor="claude-code",
            queue_reason="waiting_auth",
            auth_blocked=True,
            pre_auth_openclaw_phase=True,
        )
        paths = task_paths(task_id)
        atomic_write_json(paths["assignment"], {
            "task_id": task_id,
            "lead_role": "engineering",
            "advisory_subroles": [],
            "active_subroles": [],
            "mandatory_review_roles": [],
        })
        with mock.patch.object(execute_task_module, "build_dispatch_plan", return_value=fake_plan):
            with mock.patch.object(sys, "argv", ["execute_task.py", "--task-id", task_id, "--task", "Prepare docs draft", "--paths", ".openclaw/scripts/task_runtime.py", ".openclaw/scripts/rebalance_queue.py", "--requested-route", "claude-code"]):
                self.assertEqual(execute_task_module.main(), 0)
        state = load_json(paths["state"])
        queue_status = load_json(paths["queue_status"])
        self.assertEqual(state["state"], "AUTH_REQUIRED")
        self.assertEqual(queue_status["queue_reason"], "waiting_auth")
        self.assertTrue(paths["context"].exists())

    def test_acceptance_lane_selection_primary_mode_acp_prefers_acp(self) -> None:
        assignment = {"task_id": "t1", "lead_role": "engineering", "advisory_subroles": [], "active_subroles": [], "mandatory_review_roles": []}
        snapshot = ({
            "healthy": True,
            "remaining_requests_ratio": 0.8,
            "remaining_tokens_ratio": 0.8,
            "usage_pressure": 0.1,
            "cost_pressure": 0.1,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        }, {
            "healthy": True,
            "acp_healthy": True,
            "cli_healthy": True,
            "cli_backend_healthy": True,
            "auth_ok": True,
            "rpm_pressure": 0.1,
            "itpm_pressure": 0.1,
            "otpm_pressure": 0.1,
            "spend_pressure": 0.1,
            "retry_after_sec": 0,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        })
        task = {
            "task_id": self.make_id("lane-acp"),
            "task": "Implement runtime lane selector",
            "requested_paths": [".openclaw/scripts/dispatch_task.py", ".openclaw/scripts/execute_task.py"],
            "constraints": [],
            "verification_commands": ["python3 -m unittest"],
            "review_focus": ["correctness"],
            "requested_actions": ["edit"],
            "requested_route": "claude-code",
        }
        with mock.patch("dispatch_task.refresh_provider_snapshots", return_value=snapshot):
            plan = build_dispatch_plan(task, assignment)
        self.assertEqual(plan["selected_lane"], "acp")

    def test_acceptance_lane_selection_falls_back_to_cli_when_acp_unhealthy(self) -> None:
        assignment = {"task_id": "t2", "lead_role": "engineering", "advisory_subroles": [], "active_subroles": [], "mandatory_review_roles": []}
        snapshot = ({
            "healthy": True,
            "remaining_requests_ratio": 0.8,
            "remaining_tokens_ratio": 0.8,
            "usage_pressure": 0.1,
            "cost_pressure": 0.1,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        }, {
            "healthy": True,
            "acp_healthy": False,
            "cli_healthy": True,
            "cli_backend_healthy": True,
            "auth_ok": True,
            "rpm_pressure": 0.1,
            "itpm_pressure": 0.1,
            "otpm_pressure": 0.1,
            "spend_pressure": 0.1,
            "retry_after_sec": 0,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        })
        task = {
            "task_id": self.make_id("lane-cli"),
            "task": "Implement runtime lane selector",
            "requested_paths": [".openclaw/scripts/dispatch_task.py", ".openclaw/scripts/execute_task.py"],
            "constraints": [],
            "verification_commands": ["python3 -m unittest"],
            "review_focus": ["correctness"],
            "requested_actions": ["edit"],
            "requested_route": "claude-code",
        }
        with mock.patch("dispatch_task.refresh_provider_snapshots", return_value=snapshot):
            plan = build_dispatch_plan(task, assignment)
        self.assertEqual(plan["selected_lane"], "cli")

    def test_acceptance_lane_selection_waiting_capacity_when_all_lanes_unhealthy(self) -> None:
        assignment = {"task_id": "t3", "lead_role": "engineering", "advisory_subroles": [], "active_subroles": [], "mandatory_review_roles": []}
        snapshot = ({
            "healthy": True,
            "remaining_requests_ratio": 0.8,
            "remaining_tokens_ratio": 0.8,
            "usage_pressure": 0.1,
            "cost_pressure": 0.1,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        }, {
            "healthy": False,
            "acp_healthy": False,
            "cli_healthy": False,
            "cli_backend_healthy": False,
            "auth_ok": True,
            "rpm_pressure": 0.1,
            "itpm_pressure": 0.1,
            "otpm_pressure": 0.1,
            "spend_pressure": 0.1,
            "retry_after_sec": 0,
            "hard_blocked": False,
            "captured_at": "2026-03-22T13:02:00+09:00",
            "source": "test",
        })
        task = {
            "task_id": self.make_id("lane-capacity"),
            "task": "Implement runtime lane selector",
            "requested_paths": [".openclaw/scripts/dispatch_task.py", ".openclaw/scripts/execute_task.py"],
            "constraints": [],
            "verification_commands": ["python3 -m unittest"],
            "review_focus": ["correctness"],
            "requested_actions": ["edit"],
            "requested_route": "claude-code",
        }
        with mock.patch("dispatch_task.refresh_provider_snapshots", return_value=snapshot):
            plan = build_dispatch_plan(task, assignment)
        self.assertEqual(plan["execution_mode"], "queued")
        self.assertEqual(plan["queue_reason"], "waiting_capacity")

    def test_acceptance_read_only_acp_failure_allows_cli_fallback(self) -> None:
        task_id = self.make_id("lane-readonly-fallback")
        fake_plan = self.dispatch_payload(
            task_id,
            dispatch_id="dispatch-readonly-fallback",
            execution_mode="claude_code",
            selected_lane="acp",
            fallback_chain=["acp", "cli", "cli_backend_safety_net"],
        )
        paths = task_paths(task_id)
        atomic_write_json(paths["assignment"], {"task_id": task_id, "lead_role": "engineering", "advisory_subroles": [], "active_subroles": [], "mandatory_review_roles": []})
        task_payload = {
            "task": "Review runtime behavior in read-only mode",
            "requested_paths": [".openclaw/scripts/dispatch_task.py"],
            "constraints": ["read-only"],
            "verification_commands": [],
            "review_focus": ["correctness"],
            "requested_actions": [],
            "requested_route": "claude-code",
            "mock_mode": "acp_pre_session_failure",
        }
        atomic_write_json(paths["task"], {"task_id": task_id, **task_payload})
        with mock.patch.object(execute_task_module, "build_dispatch_plan", return_value=fake_plan):
            with mock.patch.object(sys, "argv", ["execute_task.py", "--task-id", task_id, "--task-file", str(paths["task"])]):
                self.assertEqual(execute_task_module.main(), 0)
        attempts = paths["dispatch_attempts"].read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(attempts), 2)
        last_attempt = json.loads(attempts[-1])
        self.assertEqual(last_attempt["lane"], "cli")
        self.assertEqual(load_json(paths["state"])["state"], "REVIEWING")

    def test_acceptance_write_partial_execution_blocks_auto_fallback(self) -> None:
        task_id = self.make_id("lane-write-blocked")
        fake_plan = self.dispatch_payload(
            task_id,
            dispatch_id="dispatch-write-blocked",
            execution_mode="claude_code",
            selected_lane="acp",
            fallback_chain=["acp", "cli", "cli_backend_safety_net"],
        )
        fake_plan["task_type"] = "write"
        paths = task_paths(task_id)
        atomic_write_json(paths["assignment"], {"task_id": task_id, "lead_role": "engineering", "advisory_subroles": [], "active_subroles": [], "mandatory_review_roles": []})
        atomic_write_json(paths["task"], {
            "task_id": task_id,
            "task": "Implement runtime change",
            "requested_paths": [".openclaw/scripts/dispatch_task.py"],
            "constraints": [],
            "verification_commands": [],
            "review_focus": ["correctness"],
            "requested_actions": ["edit"],
            "requested_route": "claude-code",
            "mock_mode": "acp_partial_write_failure",
        })
        with mock.patch.object(execute_task_module, "build_dispatch_plan", return_value=fake_plan):
            with mock.patch.object(sys, "argv", ["execute_task.py", "--task-id", task_id, "--task-file", str(paths["task"])]):
                execute_task_module.main()
        state = load_json(paths["state"])
        attempts = paths["dispatch_attempts"].read_text(encoding="utf-8").splitlines()
        self.assertEqual(state["state"], "WAITING_MANUAL_REVIEW")
        self.assertEqual(len(attempts), 1)


    def test_acceptance_cli_backend_safety_net_fallback_from_cli(self) -> None:
        """When both ACP and CLI fail for a read-only task, fallback reaches cli_backend_safety_net."""
        task_id = self.make_id("lane-safety-net")
        fake_plan = self.dispatch_payload(
            task_id,
            dispatch_id="dispatch-safety-net",
            execution_mode="claude_code",
            selected_lane="cli",
            fallback_chain=["cli", "cli_backend_safety_net"],
        )
        paths = task_paths(task_id)
        atomic_write_json(paths["assignment"], {"task_id": task_id, "lead_role": "engineering", "advisory_subroles": [], "active_subroles": [], "mandatory_review_roles": []})
        atomic_write_json(paths["task"], {
            "task_id": task_id,
            "task": "Check runtime logs in read-only mode",
            "requested_paths": [".openclaw/scripts/dispatch_task.py"],
            "constraints": ["read-only"],
            "verification_commands": [],
            "review_focus": ["correctness"],
            "requested_actions": [],
            "requested_route": "claude-code",
            "mock_mode": "pre_session_failure",
        })
        with mock.patch.object(execute_task_module, "build_dispatch_plan", return_value=fake_plan):
            with mock.patch.object(sys, "argv", ["execute_task.py", "--task-id", task_id, "--task-file", str(paths["task"])]):
                self.assertEqual(execute_task_module.main(), 0)
        attempts = paths["dispatch_attempts"].read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(attempts), 2)
        first = json.loads(attempts[0])
        second = json.loads(attempts[1])
        self.assertEqual(first["lane"], "cli")
        self.assertEqual(first["status"], "runtime_error")
        self.assertEqual(second["lane"], "cli_backend_safety_net")
        self.assertTrue(second["fallback_triggered"])
        self.assertEqual(second["fallback_target"], "cli_backend_safety_net")
        self.assertEqual(load_json(paths["state"])["state"], "REVIEWING")

    def test_lane_health_probe_prefers_latest_lane_snapshot(self) -> None:
        probe_output = ROOT / "runtime" / "metrics" / "lane-health-probe-test.json"
        AUTH_RUNTIME.parent.mkdir(parents=True, exist_ok=True)
        LANE_HEALTH_RUNTIME.parent.mkdir(parents=True, exist_ok=True)
        AUTH_RUNTIME.write_text(json.dumps({"ok": True, "auth_ok": True}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        LANE_HEALTH_RUNTIME.write_text(json.dumps({
            "captured_at": "2026-03-22T17:13:59+09:00",
            "auth": {"auth_ok": True},
            "lanes": {
                "acp": {"healthy": True, "transport_kind": "claude_print_json_compat", "last_error": None},
                "cli": {"healthy": True, "transport_kind": "cli_json", "last_error": None},
                "cli_backend_safety_net": {"healthy": False, "transport_kind": "cli_bare_json", "last_error": "probe exited 1"}
            }
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        try:
            completed = subprocess.run(
                ["python3", str(SCRIPTS / "lane_health_probe.py"), "--json", "--output", str(probe_output)],
                cwd=str(WORKSPACE),
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 1)
            probe = json.loads(probe_output.read_text(encoding="utf-8"))
            self.assertFalse(probe["lanes"]["cli_backend_safety_net"]["healthy"])
            self.assertEqual(probe["recommended_lane"], "acp")
        finally:
            probe_output.unlink(missing_ok=True)

    def test_acceptance_lane_health_probe_runs(self) -> None:
        """Lane health probe runs without error and writes output."""
        probe_output = ROOT / "runtime" / "metrics" / "lane-health-probe-test.json"
        try:
            completed = subprocess.run(
                ["python3", str(SCRIPTS / "lane_health_probe.py"), "--json", "--output", str(probe_output)],
                cwd=str(WORKSPACE),
                capture_output=True,
                text=True,
            )
            self.assertIn(completed.returncode, {0, 1, 2})
            self.assertTrue(probe_output.exists())
            probe = json.loads(probe_output.read_text(encoding="utf-8"))
            self.assertIn("system_healthy", probe)
            self.assertIn("auth_ok", probe)
            self.assertIn("recommended_lane", probe)
            self.assertIn("lanes", probe)
            for lane_name in ("acp", "cli", "cli_backend_safety_net"):
                self.assertIn(lane_name, probe["lanes"])
                self.assertIn("healthy", probe["lanes"][lane_name])
        finally:
            probe_output.unlink(missing_ok=True)

    def test_acceptance_backfill_dry_run(self) -> None:
        """Backfill script runs in dry-run mode without errors."""
        completed = subprocess.run(
            ["python3", str(SCRIPTS / "backfill_dispatch_attempts.py"), "--dry-run"],
            cwd=str(WORKSPACE),
            capture_output=True,
            text=True,
        )
        self.assertEqual(completed.returncode, 0)
        self.assertIn("Summary:", completed.stdout)

    def test_acceptance_acp_adapter_mock_contract_preserved(self) -> None:
        """ACP adapter produces schema-valid result in mock mode."""
        task_id = self.make_id("acp-mock-contract")
        route = self.route_payload(task_id, route_decision_id="route-acp-mock")
        dispatch = self.dispatch_payload(task_id, dispatch_id="dispatch-acp-mock", selected_lane="acp")
        paths = self.seed_task(task_id, state_name="READY_FOR_EXECUTION", route=route, dispatch=dispatch)

        subprocess.run([
            "python3",
            str(SCRIPTS / "execute_task.py"),
            "--task-id",
            task_id,
            "--task-file",
            str(paths["task"]),
        ], cwd=str(WORKSPACE), check=True)

        result = load_json(paths["result"])
        self.assertEqual(result["status"], "success")
        self.assertIn("_meta", result)
        self.assertEqual(result["_meta"]["session_mode"], "preflight_mock")
        state = load_json(paths["state"])
        self.assertEqual(state["state"], "REVIEWING")
        attempts = load_dispatch_attempts_artifact(paths["dispatch_attempts"])
        self.assertTrue(len(attempts) >= 1)
        self.assertEqual(attempts[0]["lane"], "acp")


if __name__ == "__main__":
    unittest.main()
