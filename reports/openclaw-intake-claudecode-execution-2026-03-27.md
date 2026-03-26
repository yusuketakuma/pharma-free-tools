# OpenClaw intake / Claude Code execution policy — 2026-03-27

## 結論
実行系エージェントは **OpenClaw で指示を受け、Claude Code で実行する** 方針に固定した。

## 変更内容
### 1. execution placement policy 更新
対象: `~/.openclaw/config/execution-placement-policy.yaml`

追加:
- `execution_plane_contract`
- OpenClaw = control plane / Claude Code = execution plane を明文化
- OpenClaw 完結は read_only / plan_only / short report / lightweight coordination に限定
- repo investigation / multi-file edit / test / refactor / implementation は Claude Code execution plane を優先

### 2. routing policy 更新
対象: `~/.openclaw/config/routing-policy.yaml`

追加:
- `executionAgentContract`
- 実行系エージェントは OpenClaw intake, Claude Code execution を明文化
- OpenClaw 側の責務: task_intake / routing / prioritization / approval_gate / review / publish
- Claude Code 側の責務: repo_investigation / multi_file_edit / test_execution / refactor / implementation

### 3. 取締役会本会議更新
対象 cron: `board-agenda-assembly`

追加:
- 実行論点ごとに OpenClaw 完結か Claude Code 実行行きかを明示
- repo 調査・複数ファイル変更・テスト・実装・refactor は原則 Claude Code execution plane に振る
- 出力に `Claude Code execution へ回す論点` / `OpenClaw 完結でよい論点` / `実行面の配置判断理由` を追加

### 4. 会議後 dispatch 更新
対象 cron: `board-postmeeting-agent-dispatch`

追加:
- 実行系エージェントの重い実作業は Claude Code execution plane 前提で指示する
- OpenClaw 完結は軽量 coordination のみ
- 出力に `Claude Code 実行へ回す対象` を追加

## 期待される状態
- OpenClaw は control plane に集中する
- 実行系エージェントは OpenClaw から指示を受ける
- 実作業は Claude Code execution plane に寄る
- Board でも execution placement が明示される

## 次に確認すべきこと
1. 次回 Board サイクルで `Claude Code execution へ回す論点` が実際に出るか
2. 重い investigate / fix / refactor が Claude Code execution plane へ流れるか
3. OpenClaw 側で重い実作業を抱え込まなくなったか
