#!/usr/bin/env python3
"""
Safety Gate Module
AIエージェントの意思決定における安全策を提供
"""

from enum import Enum
from typing import List, Optional
from dataclasses import dataclass


class RiskLevel(Enum):
    """リスクレベル"""
    LOW = "low"          # 自動実行可能
    MEDIUM = "medium"    # 提案モード
    HIGH = "high"        # 二重確認必要


@dataclass
class Action:
    """アクション定義"""
    action_type: str           # "read", "write", "delete", "execute"
    target: str                # 対象（ファイル、データ等）
    description: str           # 人間可読な説明
    params: dict               # パラメータ
    is_destructive: bool = False  # 破壊的操作かどうか


@dataclass
class RiskAssessment:
    """リスク評価結果"""
    level: RiskLevel
    score: float               # 0.0-1.0
    requires_approval: bool
    required_evidence: List[str]
    warnings: List[str]


class SafetyGate:
    """安全ゲート"""

    # 危険キーワード
    DANGEROUS_KEYWORDS = [
        "削除", "delete", "remove", "drop",
        "破壊", "destroy", "初期化", "initialize",
        "全件", "all", "truncate"
    ]

    # 高リスク操作
    HIGH_RISK_OPERATIONS = [
        "file_delete",
        "database_update",
        "external_send",
        "system_config_change"
    ]

    def __init__(self):
        self.strict_mode = False

    def assess_risk(self, action: Action) -> RiskAssessment:
        """
        アクションのリスクを評価

        Args:
            action: 評価対象のアクション

        Returns:
            RiskAssessment: リスク評価結果
        """
        score = 0.0
        warnings = []
        required_evidence = []

        # 1. アクションタイプによる評価
        if action.action_type in ["read", "query"]:
            score += 0.1
        elif action.action_type in ["write", "create"]:
            score += 0.4
        elif action.action_type in ["delete", "execute"]:
            score += 0.8

        # 2. 破壊的操作
        if action.is_destructive:
            score += 0.3
            warnings.append("破壊的操作です")

        # 3. 危険キーワードチェック
        text_to_check = f"{action.target} {action.description}".lower()
        for keyword in self.DANGEROUS_KEYWORDS:
            if keyword in text_to_check:
                score += 0.2
                warnings.append(f"危険キーワード検出: {keyword}")

        # 4. 高リスク操作
        if action.action_type in self.HIGH_RISK_OPERATIONS:
            score += 0.3
            required_evidence.append("operation_approval")

        # スコア正規化
        score = min(1.0, max(0.0, score))

        # リスクレベル決定
        if score < 0.3:
            level = RiskLevel.LOW
            requires_approval = False
        elif score < 0.7:
            level = RiskLevel.MEDIUM
            requires_approval = True
            required_evidence.append("user_confirmation")
        else:
            level = RiskLevel.HIGH
            requires_approval = True
            required_evidence.extend([
                "user_confirmation",
                "admin_approval",
                "backup_verification"
            ])

        # 厳格モード
        if self.strict_mode and level in [RiskLevel.LOW, RiskLevel.MEDIUM]:
            level = RiskLevel.HIGH if score > 0.5 else RiskLevel.MEDIUM
            requires_approval = True

        return RiskAssessment(
            level=level,
            score=score,
            requires_approval=requires_approval,
            required_evidence=required_evidence,
            warnings=warnings
        )

    def requires_approval(self, action: Action) -> bool:
        """承認が必要かどうか"""
        assessment = self.assess_risk(action)
        return assessment.requires_approval

    def get_required_evidence(self, action: Action) -> List[str]:
        """必要な根拠ソースのリスト"""
        assessment = self.assess_risk(action)
        return assessment.required_evidence

    def is_safe_to_execute(self, action: Action, has_approval: bool = False) -> bool:
        """
        実行可能かどうか判定

        Args:
            action: アクション
            has_approval: 承認済みかどうか

        Returns:
            bool: 実行可能ならTrue
        """
        assessment = self.assess_risk(action)

        # LOW リスクは即座に実行可能
        if assessment.level == RiskLevel.LOW:
            return True

        # MEDIUM/HIGH は承認が必要
        return has_approval


def create_action(
    action_type: str,
    target: str,
    description: str,
    params: dict = None,
    is_destructive: bool = False
) -> Action:
    """アクション作成ヘルパー"""
    return Action(
        action_type=action_type,
        target=target,
        description=description,
        params=params or {},
        is_destructive=is_destructive
    )


# 使用例
if __name__ == "__main__":
    gate = SafetyGate()

    # テストケース1: 安全な読み取り
    action1 = create_action("read", "patient_data.csv", "患者データを確認")
    result1 = gate.assess_risk(action1)
    print(f"Test 1: {result1.level.value} (score: {result1.score:.2f})")

    # テストケース2: 危険な削除
    action2 = create_action("delete", "all_patients", "全患者データを削除", is_destructive=True)
    result2 = gate.assess_risk(action2)
    print(f"Test 2: {result2.level.value} (score: {result2.score:.2f})")
    print(f"  Warnings: {result2.warnings}")
    print(f"  Evidence needed: {result2.required_evidence}")
