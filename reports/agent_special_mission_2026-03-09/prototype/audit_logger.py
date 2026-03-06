#!/usr/bin/env python3
"""
Audit Logger Module
AIエージェントの全操作を監査可能な形式で記録
"""

import json
import hashlib
from datetime import datetime
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class AuditEntry:
    """監査ログエントリ"""
    timestamp: str
    session_id: str
    agent_id: str
    log_id: str
    action_type: str
    action_level: str
    risk_score: float
    input_summary: str
    output_summary: str
    approval_status: str
    approver: Optional[str]
    evidence_refs: List[str]
    reasoning_trace: str
    duration_ms: int
    previous_hash: str
    current_hash: str


class AuditLogger:
    """監査ロガー"""

    def __init__(self, log_dir: str = "./audit_logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.current_session = self._generate_session_id()
        self.chain: List[str] = []  # ハッシュチェーン

    def _generate_session_id(self) -> str:
        """セッションID生成"""
        return f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    def _generate_log_id(self) -> str:
        """ログID生成"""
        import uuid
        return f"log_{uuid.uuid4().hex[:8]}"

    def _compute_hash(self, entry: Dict[str, Any]) -> str:
        """エントリのハッシュ計算"""
        entry_str = json.dumps(entry, sort_keys=True)
        return hashlib.sha256(entry_str.encode()).hexdigest()

    def log_decision(
        self,
        agent_id: str,
        action_type: str,
        action_level: str,
        risk_score: float,
        input_summary: str,
        output_summary: str,
        evidence_refs: List[str],
        reasoning: str,
        duration_ms: int
    ) -> str:
        """
        意思決定をログに記録

        Args:
            agent_id: エージェントID
            action_type: アクションタイプ
            action_level: アクションレベル
            risk_score: リスクスコア
            input_summary: 入力要約
            output_summary: 出力要約
            evidence_refs: 根拠ソース
            reasoning: 推論過程
            duration_ms: 処理時間（ミリ秒）

        Returns:
            str: ログエントリID
        """
        log_id = self._generate_log_id()
        timestamp = datetime.now().isoformat()

        # 前のハッシュ取得
        previous_hash = self.chain[-1] if self.chain else "genesis"

        entry_data = {
            "timestamp": timestamp,
            "session_id": self.current_session,
            "agent_id": agent_id,
            "log_id": log_id,
            "action_type": action_type,
            "action_level": action_level,
            "risk_score": risk_score,
            "input_summary": input_summary,
            "output_summary": output_summary,
            "approval_status": "pending",
            "approver": None,
            "evidence_refs": evidence_refs,
            "reasoning_trace": reasoning,
            "duration_ms": duration_ms,
            "previous_hash": previous_hash
        }

        # ハッシュ計算
        current_hash = self._compute_hash(entry_data)
        entry_data["current_hash"] = current_hash

        # チェーンに追加
        self.chain.append(current_hash)

        # ファイルに追記
        log_file = self.log_dir / f"audit_{datetime.now().strftime('%Y%m%d')}.jsonl"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry_data, ensure_ascii=False) + "\n")

        return log_id

    def approve(self, log_id: str, approver: str) -> bool:
        """
        承認記録を追加

        Args:
            log_id: ログエントリID
            approver: 承認者

        Returns:
            bool: 成功ならTrue
        """
        # 最新のログファイルを検索
        log_files = sorted(self.log_dir.glob("audit_*.jsonl"), reverse=True)

        for log_file in log_files:
            entries = []
            found = False

            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    entry = json.loads(line)
                    if entry["log_id"] == log_id:
                        entry["approval_status"] = "approved"
                        entry["approver"] = approver
                        entry["approved_at"] = datetime.now().isoformat()
                        found = True
                    entries.append(entry)

            if found:
                # ファイル書き戻し
                with open(log_file, "w", encoding="utf-8") as f:
                    for entry in entries:
                        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
                return True

        return False

    def query(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        agent_id: Optional[str] = None,
        approval_status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        ログ検索

        Args:
            start_time: 開始時刻
            end_time: 終了時刻
            agent_id: エージェントID
            approval_status: 承認ステータス

        Returns:
            List[Dict]: 検索結果
        """
        results = []

        log_files = sorted(self.log_dir.glob("audit_*.jsonl"))

        for log_file in log_files:
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    entry = json.loads(line)
                    entry_time = datetime.fromisoformat(entry["timestamp"])

                    # フィルタリング
                    if start_time and entry_time < start_time:
                        continue
                    if end_time and entry_time > end_time:
                        continue
                    if agent_id and entry["agent_id"] != agent_id:
                        continue
                    if approval_status and entry["approval_status"] != approval_status:
                        continue

                    results.append(entry)

        return results

    def verify_chain(self) -> bool:
        """
        ハッシュチェーンの整合性検証

        Returns:
            bool: 整合していればTrue
        """
        log_files = sorted(self.log_dir.glob("audit_*.jsonl"))
        previous_hash = "genesis"

        for log_file in log_files:
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    entry = json.loads(line)

                    # 前のハッシュ確認
                    if entry["previous_hash"] != previous_hash:
                        return False

                    # 現在のハッシュ再計算
                    entry_copy = {k: v for k, v in entry.items() if k != "current_hash"}
                    computed_hash = self._compute_hash(entry_copy)

                    if computed_hash != entry["current_hash"]:
                        return False

                    previous_hash = entry["current_hash"]

        return True

    def get_statistics(self) -> Dict[str, Any]:
        """
        統計情報取得

        Returns:
            Dict: 統計情報
        """
        entries = self.query()

        if not entries:
            return {
                "total_entries": 0,
                "by_agent": {},
                "by_approval_status": {},
                "avg_duration_ms": 0,
                "avg_risk_score": 0
            }

        # エージェント別集計
        by_agent = {}
        for entry in entries:
            agent = entry["agent_id"]
            by_agent[agent] = by_agent.get(agent, 0) + 1

        # 承認ステータス別集計
        by_status = {}
        for entry in entries:
            status = entry["approval_status"]
            by_status[status] = by_status.get(status, 0) + 1

        # 平均値
        avg_duration = sum(e["duration_ms"] for e in entries) / len(entries)
        avg_risk = sum(e["risk_score"] for e in entries) / len(entries)

        return {
            "total_entries": len(entries),
            "by_agent": by_agent,
            "by_approval_status": by_status,
            "avg_duration_ms": round(avg_duration, 2),
            "avg_risk_score": round(avg_risk, 3),
            "chain_verified": self.verify_chain()
        }


# 使用例
if __name__ == "__main__":
    logger = AuditLogger("./test_audit_logs")

    # ログ記録
    log_id = logger.log_decision(
        agent_id="pharmacy_agent",
        action_type="analyze",
        action_level="level_2",
        risk_score=0.4,
        input_summary="患者Aの服薬履歴を分析",
        output_summary="アドヒアランス率: 85%",
        evidence_refs=["drug_db_001"],
        reasoning="患者は高齢、多剤併用あり",
        duration_ms=1234
    )

    print(f"Log ID: {log_id}")

    # 承認
    logger.approve(log_id, "yusuke")

    # 統計
    stats = logger.get_statistics()
    print(f"Statistics: {json.dumps(stats, indent=2, ensure_ascii=False)}")
