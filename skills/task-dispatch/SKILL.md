---
name: task-dispatch
description: 'Dispatch coding/testing/review tasks to Claude Code execution plane. Use when: user requests implementation, bug fixes, refactoring, testing, code review, or investigation on any project (CareRoute-RX, DeadStockSolution, OpenClaw Core). NOT for: simple questions, status reports, general conversation. Requires bash tool.'
metadata:
  { "openclaw": { "emoji": "🚀", "requires": { "anyBins": ["python3", "claude"] } } }
---

# task-dispatch

Bridges natural language task instructions (from Telegram or any chat interface) to the
OpenClaw execution pipeline, which runs the task through Claude Code and returns the result.

## When to use this skill

Use task-dispatch when the user requests:

| User intent | Keywords (JP) | Keywords (EN) |
|-------------|---------------|---------------|
| implement   | 追加、作成、実装、作って | add, create, implement, build |
| fix         | 修正、直して、バグ、エラー | fix, repair, bug, error |
| refactor    | リファクタ、整理、改善 | refactor, clean, improve |
| test        | テスト、テストを書いて | test, spec, coverage |
| review      | レビュー、確認して | review, check, inspect |
| investigate | 調査、確認、どうなってる | investigate, look into, analyze |

Do NOT use for: status reports, general questions, simple explanations.

## Project detection

Map user keywords to project IDs:

| User keywords | projectId |
|---------------|-----------|
| CareRoute, ケアルート, careroute | careroute-rx |
| CareViaX, ケアビアックス, careviax | careviax-pharmacy |
| DeadStock, デッドストック, deadstock | deadstocksolution |
| OpenClaw, openclaw, このシステム | openclaw-core |

## Task intake flow

1. Read the user's natural language instruction
2. Detect project and task type (see tables above)
3. Generate a task ID: `tg-YYYYMMDD-HHMMSS`
4. Create the task directory and write JSON files
5. Run the pipeline scripts
6. Read and summarize the result for the user

## Lane Policy

Lane選択は自動（dispatch_task.py）だが、優先順位は以下の通り:

1. **acp_compat** — Claude主系lane（最優先）
2. **cli** — Claude二次lane
3. **cli_backend_safety_net** — optional予備

Claude Code認証はsubscription-only。`claude auth status --json`が正本。

## Step-by-step execution

### Step 1: Prepare task directory and files

```bash
TASK_ID="tg-$(date +%Y%m%d-%H%M%S)"
mkdir -p ~/.openclaw/tasks/${TASK_ID}
```

Write `~/.openclaw/tasks/${TASK_ID}/task.json`:

```json
{
  "task_id": "<TASK_ID>",
  "type": "<implement|fix|refactor|test|review|investigate>",
  "priority": "normal",
  "task": {
    "summary": "<user instruction verbatim or paraphrased>",
    "scope": {
      "projectId": "<careroute-rx|deadstocksolution|openclaw-core|careviax-pharmacy>"
    }
  },
  "routing": {
    "assignee": "engineering",
    "runtime": "acp_compat",
    "laneOrder": ["acp_compat", "cli", "cli_backend_safety_net"]
  },
  "constraints": {
    "timeoutMinutes": 15,
    "noDestructive": false,
    "noPush": true
  },
  "createdAt": "<ISO8601 timestamp>",
  "createdBy": "ceo-tama"
}
```

Write `~/.openclaw/tasks/${TASK_ID}/execution-request.json` with the same content (the
pipeline reads this file for dispatch).

### Step 2: Run the pipeline

```bash
# Dispatch: lane selection + auth preflight + queue placement
python3 ~/.openclaw/scripts/dispatch_task.py ${TASK_ID}

# Execute: call Claude Code via acp_compat lane and collect output
python3 ~/.openclaw/scripts/execute_task.py ${TASK_ID}
```

タイムアウト問題の対策: `constraints.timeoutMinutes` を15分に設定。
長時間タスクの場合は30分に増やす。パイプライン内部でacp_compat laneを優先使用する。

### Step 3: Read the result

```bash
cat ~/.openclaw/tasks/${TASK_ID}/execution-result.json
```

The result JSON contains:

| Field | Meaning |
|-------|---------|
| `status` | `completed`, `failed`, `manual_review` |
| `summary` | One-line result summary |
| `metrics.durationSeconds` | How long it took |
| `_resultCode` | Machine-readable outcome code |

### Step 4: Format for user

結果を簡潔な日本語（2〜5行）で要約する。例:

```
タスク完了: CareRoute-RXにログインバリデーションを追加しました。
所要時間: 47秒
詳細: ~/.openclaw/tasks/tg-20260322-153000/
```

失敗した場合はエラーコードと次のアクションを含める。

## Claude Code 委譲トリガー（9条件）

以下の**いずれか**に該当する場合はClaude Codeに委譲する:

| # | 条件 | 具体例 |
|---|------|--------|
| 1 | 複数ファイルの変更が必要 | 2ファイル以上のコード修正、機能実装 |
| 2 | テストの実行・作成が必要 | テストコードの追加、テストスイートの実行 |
| 3 | repo全体の調査が必要 | コードベース全体の検索、依存関係の調査 |
| 4 | コードの読解・解読が重い | 大きなファイルの分析、複雑なロジックの追跡 |
| 5 | 実装を伴う作業 | 新規ファイル作成、API実装、機能追加 |
| 6 | worktreeを伴う修正 | ブランチを切った上での複数変更 |
| 7 | 複雑な不具合修正 | 原因追及にコードベース横断調査が必要なバグ |
| 8 | 実装を伴うrefactor | 型定義の変更が複数ファイルに波及する変更 |
| 9 | 高重量verification | ビルド確認、lint実行、型チェック、E2Eテスト |

## Quick one-liner (via telegram_task_bridge.py)

```bash
python3 ~/.openclaw/scripts/telegram_task_bridge.py \
  --instruction "CareRoute-RXにログインバリデーション追加" \
  [--project careroute-rx] \
  [--type implement]
```
