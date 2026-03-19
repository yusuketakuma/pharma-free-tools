#!/usr/bin/env python3
"""
Pharmacy Visit Agent
訪問薬剤管理支援特化型エージェント
"""

import random
from typing import Dict, Any, List
from datetime import datetime, timedelta

from agent_core import BaseAgent, AgentResponse
from safety_gate import SafetyGate, create_action
from audit_logger import AuditLogger


class PharmacyVisitAgent(BaseAgent):
    """訪問薬剤管理支援エージェント"""

    def __init__(self, safety_gate: SafetyGate, audit_logger: AuditLogger):
        super().__init__("pharmacy_visit_agent", safety_gate, audit_logger)

    def analyze_adherence(self, patient_id: str) -> AgentResponse:
        """
        服薬アドヒアランス分析

        Args:
            patient_id: 患者ID

        Returns:
            AgentResponse: 分析結果
        """
        return self.process_task(
            f"患者 {patient_id} の服薬アドヒアランスを分析",
            {
                "action_type": "analyze",
                "target": f"patient_{patient_id}",
                "patient_id": patient_id
            }
        )

    def screen_high_risk_patients(self, patient_list: List[str]) -> AgentResponse:
        """
        リスク患者スクリーニング

        Args:
            patient_list: 患者IDリスト

        Returns:
            AgentResponse: スクリーニング結果
        """
        return self.process_task(
            f"{len(patient_list)}名のリスク患者スクリーニング",
            {
                "action_type": "screen",
                "target": "patient_list",
                "patient_list": patient_list
            }
        )

    def generate_visit_report(self, visit_notes: str) -> AgentResponse:
        """
        訪問レポート自動生成

        Args:
            visit_notes: 訪問メモ

        Returns:
            AgentResponse: 生成されたレポート
        """
        return self.process_task(
            "訪問レポートを生成",
            {
                "action_type": "generate",
                "target": "visit_report",
                "visit_notes": visit_notes
            }
        )

    def _execute_action(self, action, params: Dict[str, Any]) -> Dict[str, Any]:
        """アクション実行（オーバーライド）"""

        if action.action_type == "analyze":
            return self._execute_analyze(params)
        elif action.action_type == "screen":
            return self._execute_screen(params)
        elif action.action_type == "generate":
            return self._execute_generate(params)
        else:
            return super()._execute_action(action, params)

    def _execute_analyze(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """服薬アドヒアランス分析実行"""
        patient_id = params.get("patient_id", "unknown")

        # シミュレーション（実際はDBから取得）
        adherence_rate = random.uniform(0.65, 0.98)
        risk_factors = []

        if adherence_rate < 0.8:
            risk_factors.append("服薬漏れの傾向あり")
        if random.random() > 0.7:
            risk_factors.append("多剤併用によるリスク")
        if random.random() > 0.8:
            risk_factors.append("高齢者特有の配慮が必要")

        # 改善提案
        recommendations = []
        if adherence_rate < 0.8:
            recommendations.append("服薬カレンダーの導入検討")
        if "多剤併用によるリスク" in risk_factors:
            recommendations.append("処方見直しの提案")
        if "高齢者特有の配慮が必要" in risk_factors:
            recommendations.append("訪問頻度の増加")

        return {
            "summary": f"患者 {patient_id} のアドヒアランス率: {adherence_rate:.1%}",
            "evidence": ["服薬履歴DB", "処方データ"],
            "reasoning": f"過去30日間の服薬記録を分析。アドヒアランス率 {adherence_rate:.1%}。"
                        f"リスク要因: {', '.join(risk_factors) if risk_factors else '特になし'}",
            "data": {
                "patient_id": patient_id,
                "adherence_rate": adherence_rate,
                "risk_factors": risk_factors,
                "recommendations": recommendations,
                "analysis_date": datetime.now().isoformat()
            }
        }

    def _execute_screen(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """リスク患者スクリーニング実行"""
        patient_list = params.get("patient_list", [])

        # シミュレーション
        high_risk = []
        medium_risk = []

        for patient_id in patient_list:
            risk_score = random.uniform(0, 1)
            if risk_score > 0.7:
                high_risk.append({
                    "patient_id": patient_id,
                    "risk_score": risk_score,
                    "reasons": random.sample(
                        ["多剤併用", "高齢", "腎機能低下", "服薬漏れ歴"],
                        k=random.randint(1, 2)
                    )
                })
            elif risk_score > 0.4:
                medium_risk.append({
                    "patient_id": patient_id,
                    "risk_score": risk_score,
                    "reasons": random.sample(
                        ["軽微な相互作用リスク", "服薬管理支援必要"],
                        k=1
                    )
                })

        # 優先順位付け
        priority_list = sorted(high_risk, key=lambda x: x["risk_score"], reverse=True)

        return {
            "summary": f"高リスク患者: {len(high_risk)}名, 中リスク患者: {len(medium_risk)}名",
            "evidence": ["患者マスター", "処方履歴", "検査データ"],
            "reasoning": f"全{len(patient_list)}名をスクリーニング。"
                        f"多剤併用、高齢、腎機能等のリスク要因を総合評価。",
            "data": {
                "high_risk_patients": high_risk,
                "medium_risk_patients": medium_risk,
                "priority_visit_list": [p["patient_id"] for p in priority_list],
                "screening_date": datetime.now().isoformat()
            }
        }

    def _execute_generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """訪問レポート生成実行"""
        visit_notes = params.get("visit_notes", "")

        # シンプルな構造化（実際はLLM使用）
        report = {
            "visit_date": datetime.now().strftime("%Y年%m月%d日"),
            "patient_condition": "安定" if "安定" in visit_notes else "要観察",
            "medication_status": "良好" if "良好" in visit_notes else "改善余地あり",
            "key_observations": [],
            "actions_taken": [],
            "next_visit_plan": {}
        }

        # キーワードから抽出（簡易版）
        if "血圧" in visit_notes:
            report["key_observations"].append("血圧測定実施")
        if "服薬指導" in visit_notes:
            report["actions_taken"].append("服薬指導実施")
        if "副作用" in visit_notes:
            report["key_observations"].append("副作用確認必要")

        # 次回計画
        report["next_visit_plan"] = {
            "recommended_date": (datetime.now() + timedelta(days=14)).strftime("%Y年%m月%d日"),
            "priority": "高" if report["patient_condition"] == "要観察" else "中",
            "focus_items": ["服薬状況確認", "副作用モニタリング"]
        }

        return {
            "summary": f"訪問レポート生成完了: {report['patient_condition']}",
            "evidence": ["訪問メモ", "患者データ"],
            "reasoning": f"訪問メモを構造化し、{len(report['key_observations'])}件の重要事項を抽出。",
            "data": report
        }


# デモ実行
if __name__ == "__main__":
    import json

    # 初期化
    safety_gate = SafetyGate()
    audit_logger = AuditLogger("./demo_pharmacy_logs")
    agent = PharmacyVisitAgent(safety_gate, audit_logger)

    print("=" * 60)
    print("薬局訪問薬剤管理エージェント デモ")
    print("=" * 60)

    # 1. 服薬アドヒアランス分析
    print("\n【1】服薬アドヒアランス分析")
    response = agent.analyze_adherence("P001")
    print(f"結果: {response.message}")
    if response.success and response.data:
        data = response.data["data"]
        print(f"  アドヒアランス率: {data['adherence_rate']:.1%}")
        print(f"  リスク要因: {', '.join(data['risk_factors']) or 'なし'}")
        print(f"  推奨事項: {', '.join(data['recommendations']) or 'なし'}")

    # 2. リスク患者スクリーニング
    print("\n【2】リスク患者スクリーニング")
    patients = ["P001", "P002", "P003", "P004", "P005", "P006", "P007", "P008", "P009", "P010"]
    response = agent.screen_high_risk_patients(patients)
    print(f"結果: {response.message}")
    if response.success and response.data:
        data = response.data["data"]
        print(f"  高リスク患者: {len(data['high_risk_patients'])}名")
        print(f"  優先訪問リスト: {', '.join(data['priority_visit_list'][:3])}")

    # 3. 訪問レポート生成
    print("\n【3】訪問レポート生成")
    notes = "患者は安定。血圧正常範囲。服薬指導実施。副作用なし。"
    response = agent.generate_visit_report(notes)
    print(f"結果: {response.message}")
    if response.success and response.data:
        data = response.data["data"]
        print(f"  患者状態: {data['patient_condition']}")
        print(f"  重要事項: {', '.join(data['key_observations'])}")
        print(f"  次回訪問推奨日: {data['next_visit_plan']['recommended_date']}")

    # 統計
    print("\n" + "=" * 60)
    print("監査ログ統計")
    print("=" * 60)
    stats = audit_logger.get_statistics()
    print(json.dumps(stats, indent=2, ensure_ascii=False))
