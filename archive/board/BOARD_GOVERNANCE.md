# BOARD GOVERNANCE DOCUMENT

## 運用フロー (Operational Flow)

### 標準的な取締役会本会議フロー
```
agenda seed → Claude Code 事前審議 → premeeting 正本 brief → OpenClaw 再レビュー → 記録 → 指示
```

## 主要論点 (Key Discussion Points)

### 1. Control Plane vs Execution Plane の明確な振り分け

**OpenClaw (Control Plane) の担当範囲:**
- intake / routing
- task classification
- lead / subrole assignment
- capacity-aware dispatch
- queue / approval / rebalance
- review / publish
- metrics / growth
- durable state
- 要約・仕様整理・タスク分解
- 軽い docs 更新・単純な文章整備
- 低リスクの軽作業

**Claude Code (Execution Plane) の担当範囲:**
- 重いコード読解
- 複数ファイル変更
- 実装
- テスト実行
- repo-wide 調査
- code-oriented specialist 実行
- worktree を伴う修正
- 複雑な不具合修正
- 実装を伴う refactor
- 高重量 verification

### 2. 差分指示要点の明示

**Claude Code 実行へ回す対象:**
- 複数ファイル変更を伴うタスク
- テスト実行が必要な作業
- repo-wide 調査を必要とする分析
- code-oriented specialist が必要な実装

**OpenClaw 完結でよい論点:**
- read-only / plan-only タスク
- short report 作成
- lightweight coordination
- 要約・仕様整理・review / publish

**実行面の配置判断理由:**
- task type (read-only / plan-only / write)
- heaviness (light / medium / heavy)
- dependency complexity
- execution time requirements

### 3. 成果物と実行状態の3段階管理

**成功ステージ:**
- 送信成功 (Sent) - 指示が Claude Code に送信された
- 受容成功 (Accepted) - Claude Code がタスクを受け入れた
- 成果物確認済み (Completed) - 実行結果が確認・承認された

**未達ステージ:**
- 未配信 (Unsent) - 指示送信前
- 未受理 (Rejected) - Claude Code によるタスク拒否
- 未成果確認 (Pending Review) - 完成後の確認待ち

**自己改善 proposal 管理状態:**
- 引き渡し済み (Delivered) - Board に提案済み
- 裁定待ち (Pending Approval) - Board 審議中
- 適用済み (Applied) - 承認済みで適用完了

## 最重要方針 (Core Policy)

### 実行系エージェントの動線
```
OpenClaw (Control Plane) → 指示 → Claude Code (Execution Plane) → 実行 → 結果 → OpenClaw → 確認・発行
```

### 基本原則
- **実行系エージェントは OpenClaw で指示を受け、Claude Code で実行する**
- OpenClaw は control plane、Claude Code は execution plane として明確に扱う
- 重要な統治ルールの変更は必ず Board 最終裁定を通す

## Decision Framework

### Lane 選択の入力要素
```yaml
inputs:
  provider: # primary/secondary
  primary_mode: # acp_compat/cli/cli_backend_safety_net
  auth_status: # required/available/drift
  lane_health: # healthy/degraded/unhealthy
  task_heaviness: # light/medium/heavy
  task_type: # read_only/plan_only/write
  capacity_pressure: # low/medium/high
  queue_state: # empty/backlogged/critical
  fallback_safety: # allowed/not_allowed
```

### 実行配置決定ロジック
```python
def determine_placement(task):
    if task.type == "read_only" or task.type == "plan_only":
        return "openclaw_only"
    elif task.heaviness == "light" and task.complexity == "low":
        return "openclaw_only"
    elif task.requires_multiple_files or task.tests or task.repo_wide_search:
        return "claude_code"
    else:
        # fallback to safety rules
        if task.is_write and task.has_partial_execution:
            return "waiting_manual_review"
        else:
            return "openclaw_only"
```

## Additional Outputs Required

### Claude Code Execution へ回す論点
- [ ] 実装が必要な新機能開発
- [ ] 複数ファイルにまたがる refactoring
- [ ] テストカバレージ向上のための修正
- [ ] performance optimization が伴う変更
- [ ] API 仕様変更に伴う実装

### OpenClaw 完結でよい論点
- [ ] 要約・ドキュメント整理
- [ ] 仕様確認・計画作成
- [ ] review / publish 処理
- [ ] queue / rebalance 処理
- [ ] 簡単な文章修正・整理

### 実行面の配置判断理由
- Task complexity vs execution capacity
- Risk level vs operational constraints
- Time sensitivity vs quality requirements
- Dependency chain requirements

## Governance Artifacts

### Decision Records
- 每日の実行配置判断記録
- fallback events の分析レポート
- lane health と capacity metrics

### Quality Assurance
- execution success rate by lane
- task placement accuracy metrics
- user satisfaction feedback loop

### Continuous Improvement
- execution placement rules の定期的な見直し
- fallback 原因の根本原因分析
- board 指示の最適化提案

## Monitoring & Metrics

### Key Performance Indicators
- Task placement accuracy (>95%)
- Execution success rate (>90%)
- Average completion time by lane
- User satisfaction score

### Health Monitoring
- Lane availability status
- Queue depth metrics
- Capacity utilization rates
- Error rate tracking

## Emergency Procedures

### Lane Failure Response
1. ** degraded 状態**: fallback 到達ルールに基づき代替経路を選択
2. ** unhealthy 状態**: Board 経由で手動レビューワークフローに移行
3. ** complete failure**: emergency fallback プロトコルを実行

### Manual Override Process
- 重要な統治ルール変更は manual review 必須
- Board 指示による例外処理プロセス
- 審議記録と裁決プロセスの明確化