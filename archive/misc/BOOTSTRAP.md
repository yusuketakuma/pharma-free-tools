# BOOTSTRAP.md

## Purpose

このファイルは、brand-new workspace を一度だけ初期化するための bootstrap 指示である。 
bootstrap 完了後は、通常運用の主要文脈として残さず、アーカイブまたは削除してよい。

## Bootstrap Goals

1. ワークスペースの identity を確立する
2. OpenClaw = control plane / Claude Code = execution plane を固定する
3. Telegram「たまAI」設定を保持対象として明示する
4. 主要 bootstrap files を整備する
5. projects/ と .openclaw/ の責務分離を確認する
6. 自律成長ループの最低限の観測・提案基盤を確認する

## Bootstrap Steps

### 1. Core files を確認または生成
以下の存在を確認する。
- SOUL.md
- IDENTITY.md
- AGENTS.md
- TOOLS.md
- USER.md
- HEARTBEAT.md
- MEMORY.md

不足していれば作成する。

### 2. Workspace model を固定
- OpenClaw は control plane
- Claude Code は execution plane
- Claude 側認証は subscription-only
- API key を主系に使わない
- Telegram「たまAI」設定は保持する

### 3. Structure を確認
- `.openclaw/` は control-plane runtime/config/artifacts
- `projects/*/` は project-scoped workspace
- `projects/*/.claude/` は execution specialists と project rules
- `org/` は組織責務
- `CURRENT_STATUS.md` は全体インデックス

### 4. Protected / immutable を登録
- Telegram「たまAI」設定
- auth / approval / routing / trust boundary の根幹設定
- bootstrap core files
- subscription-only 方針

### 5. Health and baseline を確認
- auth preflight
- queue health
- lane health
- project manifest
- growth baseline

### 6. Bootstrap report を残す
最低限次を記録する。
- 現在の workspace モデル
- project 一覧
- protected items
- 未完了事項
- 次にやるべきこと

## After Bootstrap

bootstrap が完了したら、このファイルは常駐文脈としては不要である。 
以後の運用は SOUL / IDENTITY / AGENTS / TOOLS / USER / HEARTBEAT / MEMORY に従う。
