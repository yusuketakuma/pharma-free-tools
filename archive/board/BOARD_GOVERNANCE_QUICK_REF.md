# Board Governance Quick Reference

## 核心原則 (Core Principles)

### 1. Control Plane vs Execution Plane
- **OpenClaw**: Control Plane (意思決定・配置・レビュー)
- **Claude Code**: Execution Plane (実際の実行)

### 2. 基本動線
```
指示 (OpenClaw) → 実行 (Claude Code) → 確認 (OpenClaw) → 発行
```

## 標準運用フロー (Standard Operational Flow)

```
agenda seed → Claude Code 事前審議 → premeeting 正本 brief → 
OpenClaw 再レビュー → 記録 → 指示
```

## タスク配置判断基準 (Task Placement Criteria)

### OpenClaw Only
- [x] read-only タスク
- [x] plan-only タスク  
- [x] 軽量なドキュメント更新
- [x] 要約・仕様整理
- [x] review / publish 処理
- [x] 低リスクの軽作業

### Claude Code Execution
- [x] 複数ファイル変更
- [x] テスト実行
- [x] repo-wide 調査
- [x] 実装・refactor
- [x] 高重量 verification

### Manual Review Required
- [x] 重要な統治ルール変更
- [x] 緊急対応タスク
- [x] 保護されたパス変更

## 3段階管理 (3-Stage Management)

### 成功ステージ
1. **送信成功 (Sent)**: 指示が Claude Code に送信された
2. **受容成功 (Accepted)**: Claude Code がタスクを受け入れた  
3. **成果物確認済み (Completed)**: 実行結果が確認・承認された

### 未達ステージ
- **未配信 (Unsent)**: 指示送信前
- **未受理 (Rejected)**: Claude Code によるタスク拒否
- **未成果確認 (Pending Review)**: 完成後の確認待ち

## 毎日チェックリスト (Daily Checklist)

### Morning (毎朝)
- [ ] レーン状態確認 (acp_compat, cli, safety_net)
- [ ] キュー状態評価
- [ ] ボード指示レビュー
- [ ] 本日の配置判断基準確認

### During (日中)
- [ ] タスク配置判断の記録
- [ ] 3段階管理の進捗監視
- [ ] 品質保証の実施
- [ ] 例外処理対応

### Evening (毎晩)
- [ ] 日次サマリー作成
- [ ] 決定記録の更新
- [ ] 次日の計画立案

## 主要メトリクス (Key Metrics)

### Performance Indicators
- **Task Placement Accuracy**: >95%
- **Execution Success Rate**: >90%
- **Average Completion Time**: by lane
- **User Satisfaction Score**: >4.0/5.0

### Health Monitoring
- **Lane Availability**: healthy/degraded/unhealthy
- **Queue Depth**: empty/backlogged/critical
- **Capacity Utilization**: low/medium/high
- **Error Rate**: <2%

## 緊急対応 (Emergency Response)

### System Failure
1. 緊急フォールバックプロトコルをアクティブ化
2. 全ステークホルダーに通知
3. 手動レビュープロセスを開始
4. インシデントを文書化

### Security Incident
1. 影響システムを隔離
2. 証拠を保全
3. セキュリティチームに通知
4. 影響評価を実施

## 主要文書の場所 (Document Locations)

### Governance Documents
- **BOARD_GOVERNANCE.md**: 根幠ルールと運用原則
- **BOARD_AGENDA_TEMPLATE.md**: 取締役会本会議テンプレート
- **BOARD_GOVERNANCE_CHECKLIST.md**: 運用チェックリスト
- **BOARD_GOVERNANCE_IMPLEMENTATION.md**: 実装ガイド

### Supporting Documents  
- **AGENTS.md**: エージェントの役割分担
- **TOOLS.md**: 実行経路ポリシー
- **SOUL.md**: 個性と基本姿勢

## 決定記録フォーマット (Decision Record Format)

```yaml
task_id: [ID]
task_content: [Brief description]
placement_decision: [OpenClaw/Claude Code/Manual Review]
reasoning: [Specific explanation]
decision_maker: [Agent/Board]
timestamp: [ISO datetime]
outcome: [Success/Failure/Learning]
```

## 差分指示要点の例 (Differential Instruction Examples)

### Claude Code Executionへ回す論点
- [ ] 新機能実装 (複数ファイル変更・テストが必要)
- [ ] 複雑なrefactoring (repo-wide調査が必要)
- [ ] performance optimization (高重量verificationが必要)

### OpenClaw完結でよい論点
- [ ] ドキュメント更新 (単一ファイル・軽作業)
- [ ] 仕様整理 (read-only・計画作成)
- [ ] review/publish処理 (軽量coordination)

## 用語解説 (Glossary)

- **Control Plane**: OpenClawが担当する意思決定と配置レイヤー
- **Execution Plane**: Claude Codeが担当する実際の実行レイヤー
- **Lane**: Claude Codeの実行経路 (acp_compat, cli, safety_net)
- **3段階管理**: 送信成功→受容成功→成果物確認済みのステージ管理
- **Board**: ガバナンスの最終決定機関

## 重要連絡先 (Key Contacts)

- **Board Chair**: [Name/Contact]
- **Lead Agent**: [Name/Contact]  
- **Quality Assurance**: [Name/Contact]
- **Technical Support**: [Name/Contact]

---

**作成**: 2026-03-28
**バージョン**: 1.0
**最終更新**: [Update as needed]
**レビュー周期**: 月次