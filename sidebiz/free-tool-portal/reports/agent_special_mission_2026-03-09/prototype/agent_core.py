#!/usr/bin/env python3
"""
Agent Core Module
AIエージェントの基本構造と安全ゲート・監査ログの統合
"""

import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum

from safety_gate import SafetyGate, RiskLevel, Action, create_action
from audit_logger import AuditLogger


class AgentState(Enum):
    """エージェント状態"""
    IDLE = "idle"
    PROCESSING = "processing"
    WAITING_APPROVAL = "waiting_approval"
    ERROR = "error"


@dataclass
class AgentResponse:
    """エージェント応答"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    requires_approval: bool = False
    risk_level: str = "low"
    log_id: Optional[str] = None


class BaseAgent:
    """エージェント基底クラス"""

    def __init__(
        self,
        agent_id: str,
        safety_gate: SafetyGate,
        audit_logger: AuditLogger
    ):
        self.agent_id = agent_id
        self.safety_gate = safety_gate
        self.audit_logger = audit_logger
        self.state = AgentState.IDLE
        self.pending_approvals: Dict[str, Action] = {}

    def process_task(
        self,
        task_description: str,
        task_params: Dict[str, Any]
    ) -> AgentResponse:
        """
        タスク処理のメインエントリーポイント

        Args:
            task_description: タスクの説明
            task_params: タスクパラメータ

        Returns:
            AgentResponse: 処理結果
        """
        start_time = time.time()
        self.state = AgentState.PROCESSING

        try:
            # 1. アクション作成
            action = self._create_action(task_description, task_params)

            # 2. リスク評価
            assessment = self.safety_gate.assess_risk(action)

            # 3. 承認が必要な場合
            if assessment.requires_approval:
                log_id = self._log_pending_action(action, assessment, task_params)
                self.pending_approvals[log_id] = action
                self.state = AgentState.WAITING_APPROVAL

                return AgentResponse(
                    success=False,
                    message=f"承認が必要です（リスクレベル: {assessment.level.value}）",
                    requires_approval=True,
                    risk_level=assessment.level.value,
                    log_id=log_id,
                    data={
                        "warnings": assessment.warnings,
                        "required_evidence": assessment.required_evidence
                    }
                )

            # 4. 実行
            result = self._execute_action(action, task_params)

            # 5. ログ記録
            duration_ms = int((time.time() - start_time) * 1000)
            log_id = self.audit_logger.log_decision(
                agent_id=self.agent_id,
                action_type=action.action_type,
                action_level=f"level_{1 if assessment.level == RiskLevel.LOW else 2}",
                risk_score=assessment.score,
                input_summary=task_description,
                output_summary=result.get("summary", ""),
                evidence_refs=result.get("evidence", []),
                reasoning=result.get("reasoning", ""),
                duration_ms=duration_ms
            )

            self.state = AgentState.IDLE

            return AgentResponse(
                success=True,
                message="処理完了",
                data=result,
                risk_level=assessment.level.value,
                log_id=log_id
            )

        except Exception as e:
            self.state = AgentState.ERROR
            return AgentResponse(
                success=False,
                message=f"エラー: {str(e)}",
                risk_level="high"
            )

    def approve_task(self, log_id: str, approver: str) -> AgentResponse:
        """
        承認されたタスクを実行

        Args:
            log_id: ログID
            approver: 承認者

        Returns:
            AgentResponse: 実行結果
        """
        if log_id not in self.pending_approvals:
            return AgentResponse(
                success=False,
                message="該当する承認待ちタスクがありません"
            )

        action = self.pending_approvals[log_id]
        start_time = time.time()

        try:
            # 実行
            result = self._execute_action(action, action.params)

            # 承認記録
            self.audit_logger.approve(log_id, approver)

            # 実行ログ
            duration_ms = int((time.time() - start_time) * 1000)
            self.audit_logger.log_decision(
                agent_id=self.agent_id,
                action_type=action.action_type,
                action_level="level_3",
                risk_score=0.8,
                input_summary=f"承認済み: {action.description}",
                output_summary=result.get("summary", ""),
                evidence_refs=["approval", approver],
                reasoning=result.get("reasoning", ""),
                duration_ms=duration_ms
            )

            # ペンディングから削除
            del self.pending_approvals[log_id]
            self.state = AgentState.IDLE

            return AgentResponse(
                success=True,
                message="承認済みタスクを実行しました",
                data=result,
                log_id=log_id
            )

        except Exception as e:
            return AgentResponse(
                success=False,
                message=f"実行エラー: {str(e)}"
            )

    def _create_action(self, description: str, params: Dict[str, Any]) -> Action:
        """アクション作成（サブクラスでオーバーライド）"""
        return create_action(
            action_type=params.get("action_type", "read"),
            target=params.get("target", "unknown"),
            description=description,
            params=params,
            is_destructive=params.get("is_destructive", False)
        )

    def _execute_action(self, action: Action, params: Dict[str, Any]) -> Dict[str, Any]:
        """アクション実行（サブクラスでオーバーライド）"""
        return {
            "summary": "基本アクションを実行しました",
            "evidence": [],
            "reasoning": "基底クラスのため詳細なし"
        }


# 使用例
if __name__ == "__main__":
    # 初期化
    safety_gate = SafetyGate()
    audit_logger = AuditLogger("./demo_audit_logs")
    agent = BaseAgent("demo_agent", safety_gate, audit_logger)

    # 安全なタスク
    response1 = agent.process_task(
        "データを確認する",
        {"action_type": "read", "target": "sample.csv"}
    )
    print(f"Task 1: {response1.message}")

    # 危険なタスク（承認必要）
    response2 = agent.process_task(
        "全データを削除する",
        {"action_type": "delete", "target": "all_data", "is_destructive": True}
    )
    print(f"Task 2: {response2.message}")
    print(f"  Requires approval: {response2.requires_approval}")
    print(f"  Log ID: {response2.log_id}")

    # 統計
    stats = audit_logger.get_statistics()
    print(f"\nStatistics: {stats}")
