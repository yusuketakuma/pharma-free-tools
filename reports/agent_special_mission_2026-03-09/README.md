# 特別任務: エージェント改善プロジェクト

**担当**: AI社長
**期限**: 2026年3月9日
**報告先**: ゆうすけ（部長）

---

## 目的

現在のAIエージェントの問題点を特定し、3つの改善施策を文書とプロトタイプとして具現化する。

## 3つの改善施策

### 1. 安全ゲートと監査ログ
- **問題**: 誤回答・危険操作のリスク、追跡不可能
- **解決策**: 意思決定の事前承認 + 全操作の監査ログ記録
- **文書**: [docs/01_safety_gate_audit_log_design.md](docs/01_safety_gate_audit_log_design.md)
- **プロトタイプ**: `prototype/safety_gate.py`, `prototype/audit_logger.py`

### 2. 自動評価100シナリオ
- **問題**: 品質評価が曖昧、改善サイクルが回らない
- **解決策**: 代表的100シナリオでの自動評価パイプライン
- **文書**: [docs/02_evaluation_scenarios_100.md](docs/02_evaluation_scenarios_100.md)
- **プロトタイプ**: `prototype/evaluation/`

### 3. 勝ち筋エージェント（薬局/訪問薬剤管理）
- **問題**: 汎用性重視で現場で使われない
- **解決策**: 高頻度業務に特化した「勝ち筋」エージェント
- **文書**: [docs/03_winning_agent_implementation_plan.md](docs/03_winning_agent_implementation_plan.md)
- **プロトタイプ**: `prototype/pharmacy_visit_agent.py`

---

## 成果物

### 文書
- [docs/01_safety_gate_audit_log_design.md](docs/01_safety_gate_audit_log_design.md)
- [docs/02_evaluation_scenarios_100.md](docs/02_evaluation_scenarios_100.md)
- [docs/03_winning_agent_implementation_plan.md](docs/03_winning_agent_implementation_plan.md)

### プロトタイプ
- `prototype/` - 実行可能なPythonコード
- `prototype/run_demo.py` - デモ実行
- `prototype/run_eval.py` - 100シナリオ評価実行

---

## 進捗状況

- [x] プロジェクト開始
- [ ] 文書ドラフト完成
- [ ] プロトタイプ実装完了
- [ ] 100シナリオ評価完了
- [ ] 最終報告

---

## 実行方法

### デモ実行
```bash
cd reports/agent_special_mission_2026-03-09/prototype
python3 run_demo.py
```

### 100シナリオ評価
```bash
cd reports/agent_special_mission_2026-03-09/prototype
python3 run_eval.py
```

### テスト実行
```bash
cd reports/agent_special_mission_2026-03-09/prototype
python3 -m unittest discover -s tests -v
```

---

## 連絡

進捗・質問はいつでも部長（ゆうすけ）までご連絡ください。
