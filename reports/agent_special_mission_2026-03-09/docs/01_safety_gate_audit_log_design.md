# 01. 安全ゲートと監査ログ設計

**作成日**: 2026年3月6日
**担当**: AI社長

---

## 1. 目的

AIエージェントの意思決定プロセスに安全策を組み込み、全操作を追跡可能にする。

### 解決する課題
- **誤回答（幻覚）**: 根拠のない回答を防ぐ
- **危険操作**: 破壊的コマンドの誤実行を防ぐ
- **追跡不可能**: 何が起きたか後で分からない
- **説明責任**: なぜその判断をしたか不明

---

## 2. 設計概要

### 2.1 安全ゲート（Safety Gate）

#### 3段階の権限レベル
```
Level 1: 閲覧（Read-only）
- ファイル読み込み
- データ参照
- 情報検索

Level 2: 提案（Proposal）
- 変更案の提示
- 実行計画の立案
- ユーザー確認待ち

Level 3: 実行（Execution）
- 承認済み操作の実行
- 二重確認が必要な操作
- 監査ログ必須
```

#### 意思決定フロー
```
1. エージェントがタスクを受け取る
2. 安全ゲートがリスクレベルを判定
   - Low risk → 自動実行
   - Medium risk → 提案モード
   - High risk → 二重確認 + 承認
3. 監査ログに記録
4. 実行 or 待機
```

### 2.2 監査ログ（Audit Log）

#### 記録内容（JSONL形式）
```json
{
  "timestamp": "2026-03-06T16:40:00+09:00",
  "session_id": "session_001",
  "agent_id": "pharmacy_visit_agent",
  "action_type": "proposal",
  "action_level": "level_2",
  "risk_score": 0.3,
  "input_summary": "患者Aの服薬歴を確認",
  "output_summary": "提案: 服薬アドヒアランス向上プラン",
  "approval_status": "pending",
  "approver": null,
  "evidence_refs": ["drug_db_001", "guideline_042"],
  "reasoning_trace": "患者は高齢、多剤併用あり、アドヒアランス低下リスク...",
  "duration_ms": 1234
}
```

#### ログ保存ポリシー
- **保存期間**: 3年間
- **保存場所**: ローカル + クラウドバックアップ
- **アクセス権**: 管理者のみ
- **改ざん防止**: ハッシュチェーン方式

---

## 3. 実装仕様

### 3.1 SafetyGate クラス

```python
class SafetyGate:
    def assess_risk(self, action: Action) -> RiskLevel:
        """
        アクションのリスクレベルを判定
        
        Returns:
            RiskLevel.LOW    - 自動実行可能
            RiskLevel.MEDIUM - 提案モード
            RiskLevel.HIGH   - 二重確認必要
        """
        
    def requires_approval(self, action: Action) -> bool:
        """承認が必要かどうか"""
        
    def get_required_evidence(self, action: Action) -> List[str]:
        """必要な根拠ソースのリスト"""
```

### 3.2 AuditLogger クラス

```python
class AuditLogger:
    def log_decision(
        self,
        agent_id: str,
        action: Action,
        risk_level: RiskLevel,
        evidence: List[str],
        reasoning: str
    ) -> str:
        """
        意思決定をログに記録
        
        Returns:
            ログエントリID
        """
        
    def approve(self, log_id: str, approver: str) -> None:
        """承認記録を追加"""
        
    def query(
        self,
        start_time: datetime,
        end_time: datetime,
        agent_id: Optional[str] = None
    ) -> List[AuditEntry]:
        """ログ検索"""
```

---

## 4. リスク判定基準

### Low Risk（自動実行）
- データの読み取り専用
- 整形・要約・翻訳
- 一般的な質問への回答

### Medium Risk（提案モード）
- 新規ファイル作成
- 設定変更の提案
- 外部API呼び出し（読み取り）

### High Risk（二重確認）
- ファイル削除・上書き
- データベース更新
- 外部送信・公開
- 金銭・契約関連

---

## 5. 導入ステップ

### Phase 1: 基盤構築（Day 1）
- [x] SafetyGate クラス実装
- [x] AuditLogger クラス実装
- [x] JSONL ログ出力

### Phase 2: 統合（Day 2）
- [ ] 既存エージェントに安全ゲート統合
- [ ] 監査ログの可視化ツール
- [ ] アラート機能

### Phase 3: 運用開始（Day 3）
- [ ] 運用マニュアル作成
- [ ] チームトレーニング
- [ ] 定期レビュー体制

---

## 6. 期待効果

### 定量的指標
- **事故削減**: 重大インシデント 90%削減
- **説明率向上**: 「なぜその判断か」100%説明可能
- **デバッグ時間短縮**: 問題特定時間 70%短縮

### 定性的効果
- ユーザー信頼性向上
- コンプライアンス強化
- 継続的改善の基盤

---

## 7. 次のステップ

1. プロトタイプでデモンストレーション
2. フィードバック収集
3. 本番環境への適用計画

---

**参照プロトタイプ**:
- `../prototype/safety_gate.py`
- `../prototype/audit_logger.py`
