# OpenClaw → Claude Code Handoff Contract v1

## 結論
OpenClaw からローカル Claude Code への実行委譲は、**独自 Telegram bridge を主系にせず**、**OpenClaw 標準 ACP / `sessions_spawn(runtime="acp")` を主系** として扱う。

この文書は、OpenClaw を control plane、Claude Code を execution plane として安定運用するための **handoff contract v1** を定義する。

---

## Goals

1. タスク移管を prompt 依存から contract 依存へ変える
2. Claude Code が毎回 repo を掘り直さなくても着手できるようにする
3. 実行結果を次回再開可能な形で OpenClaw に返す
4. project ごとの差異を OpenClaw 側で吸収する
5. 独自 bridge と標準 ACP の二重運用を段階的に解消する

---

## Control / Execution Boundary

### OpenClaw が担うもの
- intake
- routing
- approval
- task classification
- repo / project context の収集
- success criteria の定義
- execution contract の生成
- result の統合
- user-facing update

### Claude Code が担うもの
- code / docs / repo-wide investigation
- implementation
- test / verification
- structured result 返却

---

## Main Path

### Primary
- OpenClaw conversation
- `sessions_spawn(runtime="acp")`
- session/thread ベースの Claude Code 実行

### Secondary / compatibility
- `~/.openclaw/scripts/telegram_task_bridge.py`
- `dispatch_task.py`
- `execute_task.py`

互換経路は当面残してよいが、**新規主機能は標準 ACP 前提で設計**する。

---

## Handoff Pack v1

Claude Code に渡す前に、OpenClaw 側で以下の情報をまとめる。

### 1. task-summary
最低限:
- taskId
- title
- requested outcome
- task type
- priority
- requested by

### 2. repo-context
最低限:
- projectId
- sourceRepoPath
- workspacePath
- relevant directories
- protected paths
- project-specific rules
- source of truth

### 3. working-context
最低限:
- related files
- related docs
- previous attempt summary
- known failures
- unresolved questions
- assumptions

### 4. execution-constraints
最低限:
- noDestructive
- noPush
- approvalRequiredConditions
- timeoutMinutes
- allowedWriteScope
- allowedNetworkScope
- security review required or not

### 5. verification-plan
最低限:
- required commands
- optional commands
- pass criteria
- artifacts to keep
- stop conditions

### 6. success-criteria
最低限:
- done definition
- must-have output
- acceptable fallback
- review required conditions

### 7. return-schema
最低限:
- status
- summary
- changedFiles
- commandsRun
- verificationStatus
- risks
- blockers
- nextRecommendedAction
- resumeHint

---

## Canonical Artifact Layout

推奨 artifact:

```text
<task-dir>/
  execution-request.json
  repo-context.json
  working-context.json
  execution-constraints.json
  verification-plan.json
  success-criteria.json
  previous-run-summary.md
  execution-result.json
  execution.stdout.log
  execution.stderr.log
```

---

## Minimal JSON Shapes

### execution-request.json
```json
{
  "requestId": "task-123",
  "task": {
    "summary": "pharma-free-tools の index 監査を修正する",
    "detail": "index/sitemap/dashboard-data の整合ずれを確認し、軽微な差分だけ直す",
    "scope": {
      "projectId": "pharma-free-tools",
      "repoPath": "/Users/yusuke/.openclaw/workspace/projects/pharma-free-tools"
    }
  },
  "routing": {
    "runtime": "acp",
    "assignee": "engineering"
  }
}
```

### repo-context.json
```json
{
  "projectId": "pharma-free-tools",
  "sourceRepoPath": "/Users/yusuke/.openclaw/workspace/projects/pharma-free-tools",
  "sourceOfTruth": [
    "docs/status.md",
    "backlog/queue.md",
    "ops/"
  ],
  "protectedPaths": [
    "AGENTS.md",
    "SOUL.md",
    "MEMORY.md"
  ],
  "projectRules": [
    "長文更新前は read する",
    "exact-match 一発置換に依存しない"
  ]
}
```

### execution-result.json
```json
{
  "requestId": "task-123",
  "status": "success|failed|manual_review",
  "summary": "何をしたかの短い要約",
  "changedFiles": [
    "docs/status.md"
  ],
  "commandsRun": [
    "pnpm check:fast"
  ],
  "verificationStatus": {
    "passed": true,
    "failedCommands": []
  },
  "risks": [],
  "blockers": [],
  "nextRecommendedAction": "必要なら dashboard-data の再生成を行う",
  "resumeHint": "docs/status.md の 2026-03-25 節から再開",
  "completedAt": "2026-03-25T00:00:00Z"
}
```

---

## Project-specific Injection Rules

### CareRoute-RX
必須注入:
- PHI / security review 条件
- `pnpm check:fast`
- PHI変更時の追加検証
- protected path / deploy rule

### DeadStockSolution
必須注入:
- runtime / migration / production callback 周辺の注意
- Vercel / DB 変更時の review rule
- unrelated dirty files を巻き込まない staging rule

### pharma-free-tools
必須注入:
- status/backlog/learn 更新時の read-first rule
- exact-match edit の再試行禁止
- 末尾追記 / 見出し単位更新優先

---

## Execution Pattern

### Pattern A: discovery / plan
用途:
- 対象ファイルや改修方針がまだ曖昧

Claude Code に返させるもの:
- relevant files
- proposed change set
- verification plan
- risks

### Pattern B: execute / verify
用途:
- 対象と done definition が固まっている

Claude Code に返させるもの:
- changed files
- verification result
- blockers
- resume hint

v1 では **曖昧タスクに対しては Pattern A を先に使う**。

---

## Compatibility Policy for Existing Bridge

### 現在の位置づけ
- `telegram_task_bridge.py` は compatibility layer
- 既存 task artifact の参照用には残してよい
- ただし新規主系設計はここへ寄せない

### やらないこと
- bridge 独自仕様を先に拡張し続ける
- 標準 ACP と同じ責務を二重実装する
- prompt の肥大化でコンテキスト不足を補おうとする

---

## Migration Rules

### Phase 1
- 主系方針を標準 ACP に固定
- handoff pack schema を定義
- result schema を定義
- project injection ルールを明文化

### Phase 2
- 既存 bridge から生成する artifact を handoff pack に寄せる
- execution-result を新 schema に寄せる
- `task.summary + task.detail` 依存を弱める

### Phase 3
- 新規運用を `sessions_spawn(runtime="acp")` へ寄せる
- bridge は互換 / fallback 専用へ降格

---

## Definition of Done for v1

以下を満たしたら v1 完了とする。

1. 主系が標準 ACP と文書で固定されている
2. handoff pack の最低 schema が定義されている
3. execution result の最低 schema が定義されている
4. project-specific injection ルールが 3 project 分ある
5. bridge の立ち位置が compatibility layer として定義されている

---

## Recommendation

実装順の推奨は次の通り。

1. `sessions_spawn(runtime="acp")` 主系化を運用ルールへ固定
2. handoff pack generator を作る
3. result normalizer を作る
4. project injection registry を作る
5. 既存 bridge をその registry 利用へ寄せる
